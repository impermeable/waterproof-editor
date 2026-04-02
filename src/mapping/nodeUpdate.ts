import { Tree, TreeNode } from "./Tree";
import { OperationType, ParsedStep } from "./types";
import { Mapping } from "./mapping";
import { typeFromStep } from "./helper-functions";
import { DocChange, DocumentSerializer, NodeUpdateError, TagConfiguration, WrappingDocChange } from "../api";
import { WaterproofSchema } from "../schema";
import { Node } from "prosemirror-model";
import { ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";

function countNewlines(s: string): number {
    let count = 0;
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '\n') count++;
    }
    return count;
}

export class NodeUpdate {
    // Store the tag configuration and serializer
    constructor (private readonly tagConf: TagConfiguration, private readonly serializer: DocumentSerializer) {} 

    // Utility to get the opening and closing tag for a given node type
    nodeNameToTagPair(nodeName: string, title: string = ""): [string, string] {
        switch (nodeName) {
            case "markdown":
                return [this.tagConf.markdown.openTag, this.tagConf.markdown.closeTag];
            case "code":
                return [this.tagConf.code.openTag, this.tagConf.code.closeTag];
            case "hint":
                return [this.tagConf.hint.openTag(title), this.tagConf.hint.closeTag];
            case "input":
                return [this.tagConf.input.openTag, this.tagConf.input.closeTag];
            case "math_display":
                return [this.tagConf.math.openTag, this.tagConf.math.closeTag];
            case "container":
                return [this.tagConf.container.openTag(title), this.tagConf.container.closeTag(title)];
            default:
                throw new NodeUpdateError(`Unsupported node type: ${nodeName}`);
        }
    }
    
    // Handle a node update step
    public nodeUpdate(step: ReplaceStep | ReplaceAroundStep, mapping: Mapping, serializedDoc: string, serializer: DocumentSerializer, proseDoc: Node) : ParsedStep {
        let parsedStep;
        if (step instanceof ReplaceStep) {
            // The step is a ReplaceStep
            parsedStep = this.doReplaceStep(step, mapping, serializedDoc, serializer, proseDoc);
        } else {
            // The step is a ReplaceAroundStep (wrapping or unwrapping of nodes)
            parsedStep = this.doReplaceAroundStep(step, mapping);
        }
        return parsedStep;
    }

    doReplaceStep(step: ReplaceStep, mapping: Mapping, serializedDoc: string, serializer: DocumentSerializer, proseDoc: Node): ParsedStep {
        // Determine operation type
        const type = typeFromStep(step);
        console.log("In doReplaceStep, operation type:", type);
        switch (type) {
            case OperationType.insert:
                return this.replaceInsert(step, mapping.getMapping(), serializedDoc);
            case OperationType.delete:
                return this.replaceDelete(step, mapping.getMapping(), serializer, proseDoc);
            case OperationType.replace:
                throw new NodeUpdateError(" We do not support ReplaceSteps that replace nodes with other nodes (textual replaces are handled in the textUpdate module) ");
        }
    }

    doReplaceAroundStep(step: ReplaceAroundStep, mapping: Mapping): ParsedStep {
        // Determine operation type
        const type = typeFromStep(step);
        switch (type) {
            case OperationType.insert:
                throw new NodeUpdateError(" ReplaceAroundSteps with 'insert' operation type are not supported ");
            case OperationType.delete:
                // Delete when we are removing the tags around a node.
                return this.replaceAroundDelete(step, mapping.getMapping());
            case OperationType.replace:
                // Replace when we are adding tags around a node
                return this.replaceAroundReplace(step, mapping.getMapping());
        }
    }

    // ReplaceInsert is used when we insert new nodes into the document
    // Note: that these steps can be quite complex, as they can contain multiple (nested) nodes
    //       for example undoing a node deletion 'reinserts' the deleted node(s)
    replaceInsert(step: ReplaceStep, tree: Tree, serializedDoc: string): ParsedStep {
        // We start by checking that there is something to insert in the step
        if (!step.slice.content.childCount) {
            throw new NodeUpdateError(" ReplaceStep insert has no content ");
        }

        // We find the node in the tree that is at the position where we are inserting
        const nodeInTree = tree.findNodeByProsePos(step.from);
        if (!nodeInTree) throw new NodeUpdateError(" Could not find position to insert node in mapping ");
        const parent = tree.findParent(nodeInTree);
        if (!parent) throw new NodeUpdateError(" Could not find parent of insertion position in mapping ");

        // When we are inserting at zero we manually set the document pos to zero        
        const atZero = step.from === 0;
        // Should we use the to position of the node we found?
        const useTo = nodeInTree.pmRange.to === step.from;

        const documentPos = atZero ? 0 : (useTo ? nodeInTree.tagRange.to : nodeInTree.tagRange.from);

        let offsetProse = atZero ? 0 : (useTo ? nodeInTree.pmRange.to : nodeInTree.pmRange.from);
        let offsetOriginal = documentPos;
        
        const nodes: TreeNode[] = [];
        let serialized = "";
        // We use the fully serialized document to determine an accurate linecount
        // If this causes performance issues, we could likely fix this by being smarter about it.
        let lineCounter = countNewlines(serializedDoc.substring(0, documentPos));
        step.slice.content.forEach((node, _, idx) => {
            const parentContent = step.slice.content;

            // Above
            const nodeDirectlyAbove = parentContent.maybeChild(idx - 1);
            const nodeTwoAbove = parentContent.maybeChild(idx - 2);
            // Below
            const nodeDirectlyBelow = parentContent.maybeChild(idx + 1);
            const nodeTwoBelow = parentContent.maybeChild(idx + 2);

            const func = (skipNewlines: boolean): { nodeAbove: string | null; nodeBelow: string | null } => {
                let above = nodeDirectlyAbove?.type.name ?? null;
                let below = nodeDirectlyBelow?.type.name ?? null;

                if (above === "newline" && skipNewlines) above = nodeTwoAbove?.type.name ?? null;
                if (below === "newline" && skipNewlines) below = nodeTwoBelow?.type.name ?? null;

                return {nodeAbove: above, nodeBelow: below};
            };
            const output = this.serializer.serializeNode(node, parent.type, func);
            serialized += output;
            const builtNode = this.buildTreeFromNode(node, offsetOriginal, offsetProse, lineCounter);
            nodes.push(builtNode);
            offsetOriginal += output.length;
            offsetProse += node.nodeSize;
            lineCounter += countNewlines(output);
        });

        const docChange: DocChange = {
            startInFile: documentPos,
            endInFile: documentPos,
            finalText: serialized
        };

        const proseOffset = step.slice.content.size;
        const textOffset = serialized.length;

        const lineDelta = countNewlines(serialized);

        // now we need to update the tree
        tree.traverseDepthFirst((thisNode: TreeNode) => {
            // Skip the root node — it's handled separately below
            if (thisNode === tree.root) return;

            if (thisNode.pmRange.from < step.from && thisNode.pmRange.to > step.from) {
                // This node strictly contains the insertion point (parent/ancestor)
                // Only shift closing offsets
                thisNode.shiftCloseOffsets(textOffset, proseOffset);
            } else if (thisNode.pmRange.from >= step.to) {
                // This node starts at or after the insertion position (sibling)
                thisNode.shiftOffsets(textOffset, proseOffset);
                thisNode.shiftLineStart(lineDelta);
            }
        });
        // The root always contains the insertion
        tree.root.shiftCloseOffsets(textOffset, proseOffset);

        // Add the nodes to the parent node. We do this later so that updating in the step 
        // before does not affect the positions of the nodes we are adding
        nodes.forEach(n => parent.addChild(n));
        return { result: docChange, newTree: tree, lineDelta: lineDelta };
    }

    buildTreeFromNode(node: Node, startOrig: number, startProse: number, currentLine: number = 0): TreeNode {
        // Shortcut for newline nodes
        if (node.type == WaterproofSchema.nodes.newline) {
            return new TreeNode(
                "newline",
                {from: startOrig, to: startOrig + 1},
                {from: startOrig, to: startOrig + 1},
                "",
                startProse, startProse,
                {from: startProse, to: startProse + node.nodeSize},
                0
            );
        }
        // Shortcut for text nodes
        if (node.type == WaterproofSchema.nodes.text) {
            return new TreeNode(
                "text",
                {from: startOrig, to: startOrig + node.nodeSize},
                {from: startOrig, to: startOrig + node.nodeSize},
                "",
                startProse, startProse + node.nodeSize,
                {from: startProse, to: startProse + node.nodeSize},
                0
            )
        }

        const nodeTitle = node.attrs.title ? node.attrs.title : (node.attrs.name ? node.attrs.name : "");
        const [openTagForNode, closeTagForNode] = this.nodeNameToTagPair(node.type.name, nodeTitle);

        const contentLineStart = currentLine + countNewlines(openTagForNode);
        const lineStart = (node.type.name === "code" || node.type.name === "math_display") ? contentLineStart : 0;

        const treeNode = new TreeNode(
            node.type.name, // node type
            {from: startOrig + openTagForNode.length, to: 0}, // inner range
            {from: startOrig, to: 0}, // full range
            nodeTitle, // title
            startProse + 1, 0, // prosemirror start, end
            {from: startProse, to: 0},
            lineStart
        );


        let childOffsetOriginal = startOrig + openTagForNode.length;
        let childOffsetProse = startProse + 1; // +1 for the opening tag
        let childLine = contentLineStart;

        node.forEach((child, _, idx) => {
            const childTreeNode = this.buildTreeFromNode(child, childOffsetOriginal, childOffsetProse, childLine);
            treeNode.children.push(childTreeNode);

            // Above
            const nodeDirectlyAbove = node.maybeChild(idx - 1);
            const nodeTwoAbove = node.maybeChild(idx - 2);

            // Below
            const nodeDirectlyBelow = node.maybeChild(idx + 1);
            const nodeTwoBelow = node.maybeChild(idx + 2);

            const func = (skipNewlines: boolean): { nodeAbove: string | null; nodeBelow: string | null } => {
                let above = nodeDirectlyAbove?.type.name ?? null;
                let below = nodeDirectlyBelow?.type.name ?? null;

                if (above === "newline" && skipNewlines) above = nodeTwoAbove?.type.name ?? null;
                if (below === "newline" && skipNewlines) below = nodeTwoBelow?.type.name ?? null;

                return {nodeAbove: above, nodeBelow: below};
            };
            
            // Update the offsets for the next child
            const serializedChild = this.serializer.serializeNode(child, node.type.name, func);
            childOffsetOriginal += serializedChild.length;
            childOffsetProse += child.nodeSize;
            childLine += countNewlines(serializedChild);
        });

        // Now fill in the to positions for innerRange and range
        treeNode.contentRange.to = childOffsetOriginal;
        treeNode.tagRange.to = childOffsetOriginal + closeTagForNode.length;
        treeNode.prosemirrorEnd = childOffsetProse;
        treeNode.pmRange.to = childOffsetProse + 1;
        return treeNode;
    }

    /**
     * Handles ReplaceSteps that delete content.
     * @param step The ReplaceStep for which we determined that it is deletion of one or more nodes.
     * @param tree The input tree
     * @returns A ParsedStep containing the resulting DocChange and the updated tree.
     */
    replaceDelete(step: ReplaceStep, tree: Tree, serializer: DocumentSerializer, proseDoc: Node): ParsedStep {
        // Find all nodes that are fully in the deleted range
        const nodesToDelete: TreeNode[] = [];
        let from = Number.POSITIVE_INFINITY;
        let to = Number.NEGATIVE_INFINITY;

        const origDocStart = step.from;
        const origDocEnd = step.to;

        // Figure out how many newlines are in the deleted content, needed to update the
        // line numbers of the nodes that come after the deleted nodes.
        // proseDoc reflects the state after all prior steps in this transaction because
        // Mapping._currentDoc is kept in sync and passed here as proseDoc.
        const parentNodeType = proseDoc.resolve(origDocStart).parent.type.name;
        const parentNode = parentNodeType === "doc" ? null : parentNodeType;
        // Get the slice of the document that will be deleted, serialize it and count the newlines in it
        const { content } = proseDoc.slice(origDocStart, origDocEnd);
        const str = serializer.serializeFragment(content, parentNode);
        const deletedNewlines = countNewlines(str);

        // First pass: identify nodes to delete
        tree.traverseDepthFirst((node: TreeNode) => {
            if (node.prosemirrorStart >= step.from && node.prosemirrorEnd <= step.to) {
                nodesToDelete.push(node);

                if (node.tagRange.from < from) from = node.tagRange.from;
                if (node.tagRange.to > to) to = node.tagRange.to;
            }
        });

        // Second pass: remove from tree
        for (const node of nodesToDelete) {
            const parent = tree.findParent(node);
            if (parent) {
                parent.removeChild(node);
            }
        }

        if (nodesToDelete.length == 0) {
            throw new NodeUpdateError("Could not find any nodes to delete in the given step.");
        }

        // Create the docChange, the range to remove is from the start of the first node to the end of the last node
        const docChange: DocChange = {
            startInFile: from,
            endInFile: to,
            finalText: ""
        };
        
        // The length of text removed from the original document
        const originalRemovedLength = docChange.endInFile - docChange.startInFile;
        // The total length (as prosemirror indexing) of the nodes removed
        const proseRemovedLength = step.to - step.from;
        
        // Update positions of nodes after the deleted nodes
        tree.traverseDepthFirst((thisNode: TreeNode) => {
            // only shift nodes that come after the deleted nodes
            if (thisNode.prosemirrorStart >= step.to) {
                thisNode.shiftOffsets(-originalRemovedLength, -proseRemovedLength);
                thisNode.shiftLineStart(-deletedNewlines);
            }
        });
        tree.root.shiftCloseOffsets(-originalRemovedLength, -proseRemovedLength);

        return { result: docChange, newTree: tree, lineDelta: -deletedNewlines };
    }

    // ReplaceAroundDelete is used when we unwrap nodes (remove the hint or input tags)
    replaceAroundDelete(step: ReplaceAroundStep, tree: Tree): ParsedStep {
        const firstNodeBeingUnwrapped = tree.findNodeByProsePos(step.gapFrom);
        const lastNodeBeingUnwrapped = tree.findNodeByProsePos(step.gapTo);
        if (!firstNodeBeingUnwrapped || !lastNodeBeingUnwrapped) {
            throw new NodeUpdateError(" Could not find first or last node to unwrap in mapping ");
        }

        // Get all nodes in the range (these are the nodes that will be unwrapped)
        const nodesInRange = tree.nodesInProseRange(firstNodeBeingUnwrapped.pmRange.from, lastNodeBeingUnwrapped.pmRange.to);

        // The wrapperNode should be the parent of the nodes being unwrapped 
        const wrapperNode = tree.findParent(firstNodeBeingUnwrapped);
        if (!wrapperNode) throw new NodeUpdateError(" Could not find parent of nodes being unwrapped ");

        const [wrappedOpenTag, wrappedCloseTag] = this.nodeNameToTagPair(wrapperNode.type, wrapperNode.title);

        // We remove the wrapper node from the tree
        const wrapperParent = tree.findParent(wrapperNode);
        if (!wrapperParent) throw new NodeUpdateError(" Could not find parent of wrapper node ");
        wrapperParent.removeChild(wrapperNode);

        // Create document change
        const docChange: WrappingDocChange = {
            firstEdit: {
                startInFile: wrapperNode.tagRange.from,
                endInFile: wrapperNode.contentRange.from,
                finalText: ""
            },
            secondEdit: {
                startInFile: wrapperNode.contentRange.to,
                endInFile: wrapperNode.tagRange.to,
                finalText: ""
            }
        };

        // First we update all nodes that come totally after the unwrapped node
        tree.traverseDepthFirst((thisNode: TreeNode) => {
            if (thisNode.pmRange.from >= wrapperNode.pmRange.to) {
                // The text positions shift by the length of the open and close tags that have just been removed
                const textOffset = -wrappedOpenTag.length - wrappedCloseTag.length;
                // The prosemirror positions shift by 2 (1 for the opening and 1 for the closing tag)
                const proseOffset = -2;
                thisNode.shiftOffsets(textOffset, proseOffset);
            }
        });

        // Update the root node separately
        tree.root.shiftCloseOffsets(-wrappedOpenTag.length - wrappedCloseTag.length, -2);

        // Now we need to update the nodes that were children of the wrapper node
        nodesInRange.forEach(n => {
            // We update their positions
            n.shiftOffsets(-wrappedOpenTag.length, -1);
            // and add them to the parent of the wrapper node
            wrapperParent.addChild(n);
        });
        
        return { result: docChange, newTree: tree, lineDelta: 0 };
    }
    
    replaceAroundReplace(step: ReplaceAroundStep, tree: Tree): ParsedStep {        
        // We start by checking what kind of node we are wrapping with
        const wrappingNode = step.slice.content.firstChild;
        if (!wrappingNode) {
            throw new NodeUpdateError(" ReplaceAroundStep replace has no wrapping node ");
        }

        const pmSize = step.slice.size;
        if (pmSize != 2) throw new NodeUpdateError(" Size of the slice is not equal to 2 ");
        
        if (step.slice.content.childCount != 1) {
            throw new NodeUpdateError(" We only support ReplaceAroundSteps with a single wrapping node ");
        }

        // Check that the wrapping node is of a supported type (hint, input, or container)
        const insertedNodeType = wrappingNode.type.name;
        if (insertedNodeType !== "hint" && insertedNodeType !== "input" && insertedNodeType !== "container") {
            throw new NodeUpdateError(" We only support wrapping in hints, inputs, or containers ");
        }

        // If we are wrapping in a hint node we need to have a title attribute; container uses name attribute
        const title: string = insertedNodeType === "hint" ? wrappingNode.attrs.title
            : insertedNodeType === "container" ? wrappingNode.attrs.name
            : "";
        // Get the tags for the wrapping node
        const [openTag, closeTag] = this.nodeNameToTagPair(insertedNodeType, title);

        // The step includes a range of nodes that are wrapped. We use the mapping
        // to find the node at gapFrom (the first one being wrapped) and the node
        // at gapTo (the last one being wrapped).
        let nodesBeingWrappedStart = tree.findNodeByProsePos(step.gapFrom);
        const nodesBeingWrappedEnd = tree.findNodeByProsePos(step.gapTo);
        // If one of the two doesn't exist we error
        if (!nodesBeingWrappedStart || !nodesBeingWrappedEnd) throw new NodeUpdateError(" Could not find node in mapping ");

        // findNodeByProsePos is biased: at a boundary position it returns the node ENDING there.
        // If gapFrom equals nodesBeingWrappedStart.pmRange.to, we got the preceding node instead
        // of the node that starts at gapFrom. Advance to the next sibling to correct this.
        if (nodesBeingWrappedStart.pmRange.to === step.gapFrom) {
            const parent = tree.findParent(nodesBeingWrappedStart);
            const siblings = parent ? parent.children : tree.root.children;
            const idx = siblings.indexOf(nodesBeingWrappedStart);
            if (idx + 1 < siblings.length) {
                nodesBeingWrappedStart = siblings[idx + 1];
            }
        }

        // Generate the document change (this is a wrapping document change)
        const docChange: WrappingDocChange = {
            firstEdit: {
                finalText: openTag,
                startInFile: nodesBeingWrappedStart.tagRange.from,
                endInFile: nodesBeingWrappedStart.tagRange.from,
            }, 
            secondEdit: {
                finalText: closeTag,
                startInFile: nodesBeingWrappedEnd.tagRange.to,
                endInFile: nodesBeingWrappedEnd.tagRange.to
            }
        };

        // We now update the tree

        const positions = {
            startFrom: nodesBeingWrappedStart.tagRange.from, 
            startTo: nodesBeingWrappedStart.tagRange.to,
            endFrom: nodesBeingWrappedEnd.tagRange.from,
            endTo: nodesBeingWrappedEnd.tagRange.to,
            proseStart: nodesBeingWrappedStart.pmRange.from,
            proseEnd: nodesBeingWrappedEnd.pmRange.to
        };
        
        const contentEnd = positions.endTo + openTag.length;
        const tagEnd = positions.endTo + openTag.length + closeTag.length;

        // Create the new wrapping node
        const newNode = new TreeNode(
            insertedNodeType,
            {from: positions.startFrom + openTag.length, to: contentEnd}, // inner range
            {from: positions.startFrom, to: tagEnd}, // full range
            title,
            positions.proseStart + 1, positions.proseEnd + 1, // prosemirror start, end
            {from: positions.proseStart, to: positions.proseEnd + 2}, // pmRange
            0
        );

        // We need to find the parent of the first node being wrapped
        const parent = tree.findParent(nodesBeingWrappedStart);
        if (!parent) throw new NodeUpdateError(" Could not find parent of nodes being wrapped ");

        const nodesInRange = tree.nodesInProseRange(positions.proseStart, positions.proseEnd);

        // Remove the nodes that are now children of the new wrapping node from their current parent
        nodesInRange.forEach(n => {
            parent.removeChild(n);
        });
        
        // Finally we need to update all nodes that come after the inserted wrapping node
        tree.traverseDepthFirst((thisNode: TreeNode) => {
            if (thisNode.pmRange.from >= positions.proseEnd) {
                thisNode.shiftOffsets(openTag.length + closeTag.length, 2);
            }
        });

        // Now we need to insert the new wrapping node in the right place in the tree
        parent.addChild(newNode);
        
        nodesInRange.forEach(n => {
            newNode.addChild(n);
            n.shiftOffsets(openTag.length, 1);
        });

        tree.root.shiftCloseOffsets(openTag.length + closeTag.length, 2);

        return {result: docChange, newTree: tree, lineDelta: 0};
    }

}
