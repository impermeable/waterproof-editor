import { Mapping } from "./mapping";
import { ParsedStep, OperationType } from "./types";
import { Tree, TreeNode } from "./Tree";
import { typeFromStep } from "./helper-functions";
import { ReplaceStep } from "prosemirror-transform";
import { TextUpdateError, DocChange } from "../api";

export class TextUpdate {
    /**
     * We cache the last node in which a text update happened, as it is likely that the next text update will happen in the same node
     * Note that this is a *reference* to the node in the tree.
     */
    private cachedNode: TreeNode | null = null;

    getNodeFromCacheOrSearch(step: ReplaceStep, tree: Tree): TreeNode | null {
        // These checks should be okay as the tree is updated after every text update,
        // therefore we can use the cached node bounds to check if the next text update is happening in the same node
        if (this.cachedNode !== null &&
                this.cachedNode.prosemirrorStart <= step.from &&
                step.to < this.cachedNode.prosemirrorEnd) {
            return this.cachedNode;
        }
        const target = tree.findNodeByProsePos(step.from);
        this.cachedNode = target;
        return target;
    }

    /** This function is responsible for handling updates in prosemirror that happen exclusively as text edits and translating them to vscode text doc */
    textUpdate(step: ReplaceStep, mapping: Mapping) : ParsedStep {
        // Determine operation type
        const type = typeFromStep(step);
        
        // If there is more than one node in the fragment of step, throw an error
        if(step.slice.content.childCount > 1) throw new TextUpdateError(" Text edit contained more text nodes than expected ");

        // Check that the slice conforms to our assumptions
        if (step.slice.openStart != 0 || step.slice.openEnd != 0) throw new TextUpdateError(" We do not support partial slices for ReplaceSteps");

        const tree = mapping.getMapping()

        const targetCell = this.getNodeFromCacheOrSearch(step, tree);

        if (targetCell === null) throw new TextUpdateError(" Target cell is not in mapping!!! ");

        if (targetCell === tree.root) throw new TextUpdateError(" Text can not be inserted into the root ");

        /** Check that the change is, indeed, happening within a stringcell */
        if (targetCell.prosemirrorEnd < step.from) throw new TextUpdateError(" Step does not happen within cell ");

        /** The offset within the correct stringCell for the step action */ 
        const offsetBegin = step.from - targetCell.prosemirrorStart;

        /** The offset within the correct stringCell for the step action */ 
        const offsetEnd = step.to - targetCell.prosemirrorStart;  

        const text = step.slice.content.firstChild?.text ?? "";

        const offset = getTextOffset(type,step);

        /** The resulting document change to document model */
        const result: DocChange = {
            startInFile: targetCell.contentRange.from + offsetBegin,
            endInFile: targetCell.contentRange.from + offsetEnd,
            finalText: text
        }

        const target = {prosemirrorStart: targetCell.prosemirrorStart, prosemirrorEnd: targetCell.prosemirrorEnd}
        tree.traverseDepthFirst((node: TreeNode) => {
            if (node.prosemirrorStart <= target.prosemirrorStart && target.prosemirrorEnd <= node.prosemirrorEnd) {
                // This node is either the node we are making the text update in or a parent node
                // We only have to update the closing ranges
                node.shiftCloseOffsets(offset);
            } else if (node.prosemirrorStart > target.prosemirrorStart && node.prosemirrorEnd > target.prosemirrorEnd) {
                // This node is fully after the node in which we made the text update
                // We update all the ranges
                node.shiftOffsets(offset);
            }
        });

        return {result, newTree: tree};
    }
}

/** This gets the offset in the vscode document that is being added (then >0) or removed (then <0) */
function getTextOffset(type: OperationType, step: ReplaceStep) : number  {
    if (type == OperationType.delete) return step.from - step.to;

    /** Validate step if not a delete type */
    if (step.slice.content.firstChild?.text === undefined) throw new TextUpdateError(" Invalid replace step " + step);

    if (type == OperationType.insert) return step.slice.content.firstChild.text?.length;

    return step.slice.content.firstChild.text?.length + step.from - step.to;
}