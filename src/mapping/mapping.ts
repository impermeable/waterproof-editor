import { Tree, TreeNode } from "./Tree";
import { TextUpdate } from "./textUpdate";
import { NodeUpdate } from "./nodeUpdate";
import { ParsedStep } from "./types";
import { Block, typeguards } from "../document";
import { DocChange, DocumentSerializer, MappingError, TagConfiguration, TextUpdateError, WrappingDocChange } from "../api";
import { WaterproofSchema } from "../schema";
import { Node } from "prosemirror-model";
import { ReplaceAroundStep, ReplaceStep, Step } from "prosemirror-transform";

/**
 * This class is responsible for keeping track of the mapping between the prosemirror state and the vscode Text
 * Document model
 */
export class Mapping {
    /** This stores the String cells of the entire document */
    private tree: Tree;
    /** The version of the underlying textDocument */
    private _version: number;
    /**
     * Tracks the ProseMirror document after each processed step.
     * The caller of `update` always passes the pre-transaction document, so for
     * step N in a multi-step transaction the passed `doc` is already stale.
     * We keep `_currentDoc` in sync by applying each step to it, so that
     * subsequent calls within the same transaction see the correct document.
     */
    private _currentDoc: Node | null = null;

    private readonly serializer: DocumentSerializer;
    private readonly nodeUpdate: NodeUpdate;
    private readonly textUpdate: TextUpdate;

    /**
     * Constructs the mapping instance given the source document in the form of a block array.
     * @param inputBlocks Array containing the blocks that make up this document.
     */
    constructor(inputBlocks: Block[], versionNum: number, tMap: TagConfiguration, serializer: DocumentSerializer) {
        this.serializer = serializer;
        this.textUpdate = new TextUpdate();
        this.nodeUpdate = new NodeUpdate(tMap, serializer);
        this._version = versionNum;
        this.tree = new Tree(
            "", // type
            { from: 0, to: inputBlocks.at(-1)!.range.to }, // contentRange
            { from: 0, to: inputBlocks.at(-1)!.range.to }, // tagRange
            "", // title
            0, // prosemirrorStart
            0, // prosemirrorEnd
            { from: 0, to: 0 },
            0 // lineStart
        );
        this.initTree(inputBlocks);
    }

    //// The getters of this class

    /**
     * Returns the mapping to preserve integrity
     */
    public getMapping() {
        return this.tree;
    }

    /**
     * Get the version of the underlying text document
     */
    public get version() {
        return this._version;
    }

    /** 
     * Map a ProseMirror index into the corresponding text offset.
     * @param index A valid ProseMirror offset.
     * @returns The corresponding text offset into the document.
     */
    public pmIndexToTextOffset(index: number) {
        const node = this.tree.findNodeByProsePos(index);
        if (node === null) throw new MappingError(` [findPosition] The vscode document offset for prosemirror index (${index}) could not be found `);
        return (index - node.prosemirrorStart) + node.contentRange.from;
    }

    /**
     * Map a text offset into the corresponding ProseMirror index.
     * @param offset The offset (in characters) in the document.
     * @returns The corresponding ProseMirror index into the ProseMirror view.
     */
    public textOffsetToPmIndex(offset: number) {
        const correctNode: TreeNode | null = this.tree.findNodeByOriginalPosition(offset);
        if (correctNode === null) throw new MappingError(` [findInvPosition] The prosemirror index for offset (${offset}) could not be found `);
        return (offset - correctNode.contentRange.from) + correctNode.prosemirrorStart;
    }

    public computeLineNumbers(): Array<number> {
        return this.tree.computeLineNumbers();
    }

    public updateLines(lineDelta: number, from: number): void {
        const targetCell: TreeNode | null = this.tree.findNodeByProsePos(from);
        if (targetCell === null) throw new TextUpdateError(" Target cell is not in mapping!!! ");
        const target = {prosemirrorStart: targetCell.prosemirrorStart, prosemirrorEnd: targetCell.prosemirrorEnd}
        this.tree.traverseDepthFirst((node: TreeNode) => {
            if (node.prosemirrorStart > target.prosemirrorStart && node.prosemirrorEnd > target.prosemirrorEnd) {
                node.shiftLineStart(lineDelta);
            }
        });
        
    }

    /**
     * Resets the internally-evolved document to null so the next transaction
     * starts fresh from the document passed by the caller.
     * Call this at the beginning of each ProseMirror dispatchTransaction.
     */
    public resetCurrentDoc(): void {
        this._currentDoc = null;
    }

    public update(step: Step, doc: Node): DocChange | WrappingDocChange {
        if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep))
            throw new MappingError("Step update (in textDocMapping) should not be called with a non document changing step");

        // Check whether the edit is a text edit
        let isText: boolean;
        if (step.slice.content.firstChild?.type === WaterproofSchema.nodes.text) {
            // Short circuit when the content is a text node. This is the case for simple text insertions
            // This is probably the most used path
            isText = true;
        } else {
            const nodeAtPos = this.tree.findNodeByProsePos(step.from);

            // The lower bound excludes deletions of the node itself (step.from = pmRange.from
            // < prosemirrorStart). The upper bound excludes the case where findNodeByProsePos
            // returns a node whose pmRange.to equals step.from due to its left-bias — in that
            // situation step.from is past the node's content and belongs to nodeUpdate.
            isText = (step.slice.content.childCount === 0 &&
                (nodeAtPos?.type === "markdown" ||
                 nodeAtPos?.type === "code" ||
                 nodeAtPos?.type === "math_display") &&
                step.from >= nodeAtPos.prosemirrorStart &&
                step.from <= nodeAtPos.prosemirrorEnd);
        }

        let result: ParsedStep;

        // For multi-step transactions the caller passes the same pre-transaction `doc` for
        // every step, so by step N it is stale. Use our internally-evolved document instead.
        const currentDoc = this._currentDoc ?? doc;

        // Parse the step into a text document change
        if (step instanceof ReplaceStep && isText) {
            result = this.textUpdate.textUpdate(step, this);
        } else {
            // A structural (node-level) update may remove nodes from the tree, leaving
            // any cached TextUpdate node as a stale orphan. Invalidate before delegating.
            // The main function of the cache is performance speedup for students editing documents,
            // and they will never hit this branch
            this.textUpdate.invalidateCache();
            // The entire document is serialized here. This is done to be able to produce an accurate linecount
            // If this leads to performance issues, this could likely be resolved by being smarter about this.
            result = this.nodeUpdate.nodeUpdate(step, this, this.serializer, currentDoc);
        }

        this.tree = result.newTree;

        // Evolve _currentDoc by applying the step, so the next call in the same
        // transaction receives the correct document rather than the stale original.
        const applied = step.apply(currentDoc);
        this._currentDoc = applied.doc ?? currentDoc;

        if ('finalText' in result.result) {
            if (this.checkDocChange(result.result)) this._version++;
        } else if (this.checkDocChange(result.result.firstEdit) || this.checkDocChange(result.result.secondEdit)) {
            this._version++;
        }

        return result.result;
    }

    /**
     * This checks if the doc change actually changed the document, since vscode
     * does not register empty changes 
     */
    private checkDocChange(change: DocChange): boolean {
        if (change.endInFile === change.startInFile && change.finalText.length == 0) return false;
        return true;
    }

    //// The methods used to manage the mapping


    /**
     * Initializes the mapping given the input document in the form of a Block array.
     * @param blocks 
     */
    private initTree(blocks: Block[]): void {
        function buildSubtree(blocks: Block[]): TreeNode[] {
            return blocks.map(block => {

                const title = typeguards.isHintBlock(block) ? block.title
                    : typeguards.isContainerBlock(block) ? block.name
                    : "";

                const node = new TreeNode(
                    block.type,
                    // Explicit dereferencing of object properties to avoid shared references to innerRange and range
                    {from: block.innerRange.from, to: block.innerRange.to},
                    {from: block.range.from, to: block.range.to},
                    title,
                    0, // prosemirrorStart (to be calculated later)
                    0, // prosemirrorEnd (to be calculated later)
                    {from: 0, to: 0}, // full prosemirror range (to be computed later)
                    block.lineStart
                );

                if (block.innerBlocks && block.innerBlocks.length > 0) {
                    const children = buildSubtree(block.innerBlocks);
                    children.forEach(child => node.addChild(child));
                }

                return node;
            });
        }

        const topLevelNodes = buildSubtree(blocks);
        topLevelNodes.forEach(child => this.tree.root.addChild(child));

        // Now compute the ProseMirror offsets after creating the tree structure
        this.computeProsemirrorOffsets(this.tree.root);
    }

    /**
     * Recursively computes the prosemirrorStart and prosemirrorEnd offsets for each node.
     * 
     * @param node The current node to compute the offsets for.
     * @param startTagMap The start tag mapping for each block type.
     * @param endTagMap The end tag mapping for each block type.
     * @param currentOffset The current offset from where the computation should begin.
     * @param level The current depth level in the tree (used for adjusting offsets).
     * @returns The updated offset after computing the current node.
     */
    private computeProsemirrorOffsets(
        node: TreeNode | null,
        currentOffset: number = 0,
        level: number = 0
    ): number {
        // INVARIANT:
        // At the start of this function `offset` points exactly before the tag of `node` and at the end of the function `offset` points right after the tag. 
        // That is, if we are processing some document that looks like this: <md>Test</md> where the <md> and </md> denote the boundaries of the markdown node.
        // We ensure that at the start of processing this node `offset` is at the position marked with A and at the end of the function `offset` is at
        // the position marked with B. The prosemirror start and end of the markdown are at C and D, respectively: A<md>CTestD</md>B.
        
        if (!node) return currentOffset;
        
        let offset = currentOffset;

        // We handle the newline separately as this node has a size of just 1.
        if (node.type === "newline") {
            node.prosemirrorStart = offset;
            node.prosemirrorEnd = offset;
            node.pmRange.from = offset;
            node.pmRange.to = offset + 1;
            return offset + 1; 
            // return offset;
        }

        node.pmRange.from = offset;

        if (node !== this.tree.root) {
            // Add start tag and +1 for going one level deeper (entering the node)
            offset += 1;
        }

        // Record the ProseMirror start after entering this node
        node.prosemirrorStart = offset;

        if (node.children.length === 0) {
            // Leaf: add length of content + end tag + +1 for exiting level
            offset += (node.contentRange.to - node.contentRange.from);
        } else {
            // Non-leaf: handle children and end tag
            for (const child of node.children) {
                offset = this.computeProsemirrorOffsets(
                    child,
                    offset,
                    level + 1
                );
            }
        }

        // Record the ProseMirror end offset after all child nodes have been processed.
        node.prosemirrorEnd = offset;
        // To satisfy the invariant we add one to the offset to move outside of the current node again.
        offset += 1;
        node.pmRange.to = offset;
        return offset;
    }

}
