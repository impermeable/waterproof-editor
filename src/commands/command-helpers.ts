/////// Helper functions /////////

import { Fragment, NodeType, Node as PNode } from "prosemirror-model";
import {
  EditorState,
  TextSelection,
  Transaction,
  Selection,
  NodeSelection,
} from "prosemirror-state";
import { INPUT_AREA_PLUGIN_KEY } from "../inputArea";
import { WaterproofSchema } from "../schema";
import {
  newline,
  inputArea,
  hint,
  text,
  container,
} from "../document/blocks/schema";
import {
  closingTagStartsWithNewline,
  getParentAndIndex,
  needsNewlineAfter,
  needsNewlineBefore,
  openingTagEndsWithNewline,
} from "./utils";
import { TagConfiguration } from "../api";

/////// Helper functions /////////

function createNodeWithOptionalTextContent(
  nodeType: NodeType,
  content: string,
): PNode {
  return content.length > 0
    ? nodeType.create({}, text(content))
    : nodeType.create();
}

/**
 * Builds the node (optionally wrapped in a hint or input area) to insert, shared
 * by {@link insertCompositeNodeAbove} and {@link insertCompositeNodeBelow}.
 * @returns The nodes to insert, or `undefined` for an unsupported wrapper type.
 */
export function buildCompositeNodes(
  wrappedNodeType: NodeType,
  wrapNodeType: NodeType | undefined,
  hintTitle: string,
  content: string,
): PNode[] | undefined {
  const wrappedNode = createNodeWithOptionalTextContent(
    wrappedNodeType,
    content,
  );

  if (wrapNodeType === undefined) {
    return [wrappedNode];
  } else if (wrapNodeType === WaterproofSchema.nodes.hint) {
    return [hint(hintTitle, [newline(), wrappedNode, newline()])];
  } else if (wrapNodeType === WaterproofSchema.nodes.input) {
    return [inputArea([newline(), wrappedNode, newline()])];
  } else {
    // Unsupported wrapper type for this helper.
    return;
  }
}

export function buildExerciseNodes(
  containerName: string | undefined,
  statementContent: string,
  closingContent: string,
): PNode[] {
  const inner = [
    createNodeWithOptionalTextContent(
      WaterproofSchema.nodes.code,
      statementContent,
    ),
    newline(),
    inputArea([
      newline(),
      createNodeWithOptionalTextContent(WaterproofSchema.nodes.code, ""),
      newline(),
    ]),
    newline(),
    createNodeWithOptionalTextContent(
      WaterproofSchema.nodes.code,
      closingContent,
    ),
  ];
  return containerName === undefined
    ? inner
    : [container(containerName, [newline(), ...inner, newline()])];
}

function isNewline(node: PNode | null): boolean {
  return node?.type === WaterproofSchema.nodes.newline;
}

/**
 * The position directly before (`"start"`) or after (`"end"`) the currently selected node.
 */
function selectedNodeBoundary(
  sel: Selection,
  side: "start" | "end",
): number | undefined {
  if (sel instanceof NodeSelection) {
    // To and from point directly to beginning and end of node.
    return side === "start" ? sel.from : sel.to;
  } else if (sel instanceof TextSelection) {
    // The selected node is the parent of the text.
    return side === "start" ? sel.$from.before() : sel.$from.after();
  } else {
    return;
  }
}

/**
 * State shared by {@link insertCompositeNodeAbove} and {@link insertCompositeNodeBelow}.
 */
interface InsertionContext {
  /** The parent of the currently selected node. */
  parent: PNode;
  /** The index of the currently selected node in `parent`. */
  index: number;
  /** The currently selected node. */
  currentNode: PNode | null;
  /** Whether the open tag of the first inserted node requires a newline before it. */
  newNeedsNewlineBefore: boolean;
  /** Whether the close tag of the last inserted node requires a newline after it. */
  newNeedsNewlineAfter: boolean;
}

function getInsertionContext(
  state: EditorState,
  nodes: PNode[],
  tagConf: TagConfiguration,
): InsertionContext | undefined {
  if (nodes.length === 0) return;

  const parentAndIndex = getParentAndIndex(state.selection);
  if (parentAndIndex === null) return;
  const { parent, index } = parentAndIndex;

  return {
    parent,
    index,
    currentNode: parent.maybeChild(index),
    newNeedsNewlineBefore: needsNewlineBefore(nodes[0].type, tagConf),
    newNeedsNewlineAfter: needsNewlineAfter(nodes.at(-1)!.type, tagConf),
  };
}

/**
 * Whether a newline must be inserted between the new nodes and whatever precedes them, when
 * inserting above the selection.
 */
function needsNewlineAboveInsertion(
  { parent, index, newNeedsNewlineBefore }: InsertionContext,
  tagConf: TagConfiguration,
): boolean {
  const nodeAboveSelection = parent.maybeChild(index - 1);

  if (isNewline(nodeAboveSelection)) {
    // We insert above this existing newline, so look at the node above it instead.
    const nodeAboveNewline = parent.maybeChild(index - 2);
    if (isNewline(nodeAboveNewline)) return false;
    return (
      newNeedsNewlineBefore ||
      (nodeAboveNewline !== null &&
        needsNewlineAfter(nodeAboveNewline.type, tagConf))
    );
  }

  if (nodeAboveSelection === null) {
    // The new node's open tag requires a newline before it (e.g. code's "```coq") and would
    // otherwise glue onto the opening tag of a non-doc container that does not already end
    // with a newline.
    return (
      newNeedsNewlineBefore &&
      parent.type !== WaterproofSchema.nodes.doc &&
      !openingTagEndsWithNewline(parent.type, tagConf)
    );
  }

  // The new node's open tag or the preceding sibling's close tag requires a newline.
  return (
    newNeedsNewlineBefore || needsNewlineAfter(nodeAboveSelection.type, tagConf)
  );
}

/**
 * Whether a newline must be inserted between the new nodes and whatever follows them, when
 * inserting below the selection.
 */
function needsNewlineBelowInsertion(
  { parent, index, newNeedsNewlineAfter }: InsertionContext,
  tagConf: TagConfiguration,
): boolean {
  const nodeBelowSelection = parent.maybeChild(index + 1);

  if (isNewline(nodeBelowSelection)) {
    // We insert below this existing newline, so look at the node below it instead.
    const nodeBelowNewline = parent.maybeChild(index + 2);
    if (isNewline(nodeBelowNewline)) return false;
    return (
      newNeedsNewlineAfter ||
      (nodeBelowNewline !== null &&
        needsNewlineBefore(nodeBelowNewline.type, tagConf))
    );
  }

  if (nodeBelowSelection === null) {
    // The new node's close tag requires a newline after it (e.g. code's "\n```") and would
    // otherwise glue onto the closing tag of a non-doc container that does not already start
    // with a newline.
    return (
      newNeedsNewlineAfter &&
      parent.type !== WaterproofSchema.nodes.doc &&
      !closingTagStartsWithNewline(parent.type, tagConf)
    );
  }

  // The new node's close tag or the following sibling's open tag requires a newline.
  return (
    newNeedsNewlineAfter || needsNewlineBefore(nodeBelowSelection.type, tagConf)
  );
}

/**
 * Inserts `nodes` at `pos`, unless the schema does not allow them there (e.g. a hint inside a
 * hint, or a container that is not at the top level).
 */
function insertIfValid(
  state: EditorState,
  tr: Transaction,
  pos: number,
  nodes: PNode[],
): Transaction | undefined {
  const $pos = state.doc.resolve(pos);
  const index = $pos.index();
  if (!$pos.parent.canReplace(index, index, Fragment.from(nodes))) return;
  return tr.insert(pos, nodes);
}

/**
 * Helper function for inserting a sequence of nodes above the currently selected one.
 * @param state The current editor state.
 * @param tr The current transaction for the state of the editor.
 * @param nodes The nodes to insert, in order. Newline padding before/after this sequence is
 * decided by the open-tag requirements of `nodes[0]` and the close-tag requirements of the
 * last node in `nodes`.
 * @returns An insertion transaction.
 */
export function insertCompositeNodeAbove(
  state: EditorState,
  tr: Transaction,
  nodes: PNode[],
  tagConf: TagConfiguration,
): Transaction | undefined {
  const ctx = getInsertionContext(state, nodes, tagConf);
  if (ctx === undefined) return;

  let pos = selectedNodeBoundary(state.selection, "start");
  if (pos === undefined) return;

  const beforeIsNewline = isNewline(ctx.parent.maybeChild(ctx.index - 1));
  if (beforeIsNewline) {
    // Assumption: If a newline appears before a node the current node wants that.
    pos -= 1; // We are going to insert before the newline node
  }

  // A newline is required between the new nodes and the current node (now below) if either
  // side's tag requires one, unless the existing newline already separates them.
  const currentNeedsNewlineBefore =
    ctx.currentNode !== null &&
    needsNewlineBefore(ctx.currentNode.type, tagConf);
  const newlineBetweenNewAndCurrent =
    !beforeIsNewline && (ctx.newNeedsNewlineAfter || currentNeedsNewlineBefore);

  const toInsert: PNode[] = [];
  if (needsNewlineAboveInsertion(ctx, tagConf)) toInsert.push(newline());
  toInsert.push(...nodes);
  if (newlineBetweenNewAndCurrent) toInsert.push(newline());

  return insertIfValid(state, tr, pos, toInsert);
}

/**
 * Helper function for inserting a sequence of nodes below the currently selected one.
 * @param state The current editor state.
 * @param tr The current transaction for the state of the editor.
 * @param nodes The nodes to insert, in order. Newline padding before/after this sequence is
 * decided by the open-tag requirements of `nodes[0]` and the close-tag requirements of the
 * last node in `nodes`.
 * @returns An insertion transaction.
 */
export function insertCompositeNodeBelow(
  state: EditorState,
  tr: Transaction,
  nodes: PNode[],
  tagConf: TagConfiguration,
): Transaction | undefined {
  const ctx = getInsertionContext(state, nodes, tagConf);
  if (ctx === undefined) return;

  let pos = selectedNodeBoundary(state.selection, "end");
  if (pos === undefined) return;

  const afterIsNewline = isNewline(ctx.parent.maybeChild(ctx.index + 1));
  if (afterIsNewline) {
    // Assumption: If a newline appears after a node the current node wants that.
    pos += 1; // We are going to insert after
  }

  // A newline is required between the current node (now above) and the new nodes if either
  // side's tag requires one, unless the existing newline already separates them.
  const currentNeedsNewlineAfter =
    ctx.currentNode !== null &&
    needsNewlineAfter(ctx.currentNode.type, tagConf);
  const newlineBetweenNewAndCurrent =
    !afterIsNewline && (ctx.newNeedsNewlineBefore || currentNeedsNewlineAfter);

  const toInsert: PNode[] = [];
  if (newlineBetweenNewAndCurrent) toInsert.push(newline());
  toInsert.push(...nodes);
  if (needsNewlineBelowInsertion(ctx, tagConf)) toInsert.push(newline());

  return insertIfValid(state, tr, pos, toInsert);
}

export function nodeFromSel(sel: Selection): PNode | undefined {
  if (sel instanceof TextSelection) {
    return sel.$from.node(sel.$from.depth);
  } else if (sel instanceof NodeSelection) {
    return sel.node;
  } else {
    return;
  }
}

/**
 * Returns the containing node for the current selection.
 * @param sel The user's selection.
 * @returns The node containing this selection. Will *not* return text nodes.
 */
export function getContainingNode(sel: Selection): PNode | undefined {
  if (sel instanceof TextSelection) {
    return sel.$from.node(sel.$from.depth - 1);
  } else if (sel instanceof NodeSelection) {
    return sel.$from.parent;
  } else {
    return;
  }
}

export function allowedToInsert(state: EditorState): boolean {
  const pluginState = INPUT_AREA_PLUGIN_KEY.getState(state);
  if (!pluginState) return false;
  const isTeacher = pluginState.teacher;
  // If the user is in teacher mode always return `true`, if not
  // we check wether they are in a input area.
  return isTeacher ? true : checkInputArea(state.selection);
}

/**
 * Helper function for checking if the selection is within an input area.
 * @returns Whether the selection is within an input area.
 */
export function checkInputArea(sel: Selection): boolean {
  const from = sel.$from;
  const depth = from.depth;
  // An input area can be at depth = 1 (top level) or depth = 2 (inside a container)
  if (depth < 1) return false;
  if (from.node(1).type === WaterproofSchema.nodes.input) return true;
  if (
    depth >= 2 &&
    from.node(1).type === WaterproofSchema.nodes.container &&
    from.node(2).type === WaterproofSchema.nodes.input
  )
    return true;
  return false;
}
