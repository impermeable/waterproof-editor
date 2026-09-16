import { Tree, TreeNode } from "./Tree";
import { TextUpdate } from "./textUpdate";
import { NodeUpdate } from "./nodeUpdate";
import { ParsedStep, pmIndex, PmIndex, textOffset, TextOffset } from "./types";
import {
  DocChange,
  DocumentSerializer,
  MappingError,
  TagConfiguration,
  TextUpdateError,
  WrappingDocChange,
} from "../api";
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
  constructor(
    versionNum: number,
    tMap: TagConfiguration,
    serializer: DocumentSerializer,
    tree: Tree,
  ) {
    this.serializer = serializer;
    this.textUpdate = new TextUpdate();
    this.nodeUpdate = new NodeUpdate(tMap, serializer);
    this._version = versionNum;
    this.tree = tree;
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
  public pmIndexToTextOffset(index: PmIndex): TextOffset {
    const node = this.tree.findNodeByProsePos(index);
    if (node === null)
      throw new MappingError(
        ` [findPosition] The vscode document offset for prosemirror index (${index}) could not be found `,
      );
    return textOffset(index - node.prosemirrorStart + node.contentRange.from);
  }

  /**
   * Map a text offset into the corresponding ProseMirror index.
   * @param offset The offset (in characters) in the document.
   * @returns The corresponding ProseMirror index into the ProseMirror view.
   */
  public textOffsetToPmIndex(offset: TextOffset): PmIndex {
    const correctNode: TreeNode | null =
      this.tree.findNodeByOriginalPosition(offset);
    if (correctNode === null)
      throw new MappingError(
        ` [findInvPosition] The prosemirror index for offset (${offset}) could not be found `,
      );
    return pmIndex(
      offset - correctNode.contentRange.from + correctNode.prosemirrorStart,
    );
  }

  public computeLineNumbers(): Array<number> {
    return this.tree.computeLineNumbers();
  }

  public updateLines(lineDelta: number, from: number): void {
    const targetCell: TreeNode | null = this.tree.findNodeByProsePos(from);
    if (targetCell === null)
      throw new TextUpdateError(" Target cell is not in mapping!!! ");
    const target = {
      prosemirrorStart: targetCell.prosemirrorStart,
      prosemirrorEnd: targetCell.prosemirrorEnd,
    };
    this.tree.traverseDepthFirst((node: TreeNode) => {
      if (
        node.prosemirrorStart > target.prosemirrorStart &&
        node.prosemirrorEnd > target.prosemirrorEnd
      ) {
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
      throw new MappingError(
        "Step update (in textDocMapping) should not be called with a non document changing step",
      );

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
      isText =
        step.slice.content.childCount === 0 &&
        (nodeAtPos?.type === "markdown" ||
          nodeAtPos?.type === "code" ||
          nodeAtPos?.type === "math_display") &&
        step.from >= nodeAtPos.prosemirrorStart &&
        step.from <= nodeAtPos.prosemirrorEnd;
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
      result = this.nodeUpdate.nodeUpdate(
        step,
        this,
        this.serializer,
        currentDoc,
      );
    }

    this.tree = result.newTree;

    // Evolve _currentDoc by applying the step, so the next call in the same
    // transaction receives the correct document rather than the stale original.
    const applied = step.apply(currentDoc);
    this._currentDoc = applied.doc ?? currentDoc;

    if ("finalText" in result.result) {
      if (this.checkDocChange(result.result)) this._version++;
    } else if (
      this.checkDocChange(result.result.firstEdit) ||
      this.checkDocChange(result.result.secondEdit)
    ) {
      this._version++;
    }

    return result.result;
  }

  /**
   * This checks if the doc change actually changed the document, since vscode
   * does not register empty changes
   */
  private checkDocChange(change: DocChange): boolean {
    if (change.endInFile === change.startInFile && change.finalText.length == 0)
      return false;
    return true;
  }
}
