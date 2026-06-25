import { Attrs, NodeType } from "prosemirror-model";
import {
  Command,
  EditorState,
  NodeSelection,
  TextSelection,
  Transaction,
} from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { liftTarget } from "prosemirror-transform";
import { WaterproofSchema } from "../schema";
import {
  closingTagStartsWithNewline,
  getParentAndIndex,
  needsNewlineAfter,
  needsNewlineBefore,
  openingTagEndsWithNewline,
} from "./utils";
import { TagConfiguration } from "../api";

export function wpLift(_tagConf: TagConfiguration): Command {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    const sel = state.selection;

    if (!(sel instanceof NodeSelection)) return false;

    const { $from, $to, node, from, to } = sel;
    const before = $from.nodeBefore;
    const after = $to.nodeAfter;

    const { type } = node;
    if (
      type !== WaterproofSchema.nodes.hint &&
      type !== WaterproofSchema.nodes.input &&
      type !== WaterproofSchema.nodes.container
    ) {
      // We can only lift hint, input area, or container nodes.
      return false;
    }

    // The schema enforces that the input/hint contains at least one child.
    // Retrieve the first and last child (may be the same)
    const { firstChild, lastChild, childCount } = node;
    if (!firstChild || !lastChild) return false;
    const firstIsNewline = firstChild.type === WaterproofSchema.nodes.newline;
    const lastIsNewline = lastChild.type === WaterproofSchema.nodes.newline;

    const beforeIsNewline =
      before === null ? false : before.type === WaterproofSchema.nodes.newline;
    const afterIsNewline =
      after === null ? false : after.type === WaterproofSchema.nodes.newline;

    const shouldRemoveNewlineBefore = beforeIsNewline && firstIsNewline;
    const shouldRemoveNewlineAfter =
      afterIsNewline && lastIsNewline && childCount > 1;

    // Create a block range that covers the content of the input/hint block
    const range = state.doc
      .resolve(from + 1)
      .blockRange(state.doc.resolve(to - 1));
    if (range === null) return false;

    // Compute the lifting depth given the range covering the content of the hint/input
    const target = liftTarget(range);
    if (target === null) return false;

    if (dispatch) {
      const tr = state.tr;
      tr.lift(range, target).scrollIntoView();
      if (shouldRemoveNewlineBefore) {
        tr.delete(tr.mapping.map(from), tr.mapping.map(from) + 1);
      }
      if (shouldRemoveNewlineAfter) {
        tr.delete(tr.mapping.map(to), tr.mapping.map(to) + 1);
      }
      // Dispatch the transaction
      dispatch(tr);
    }

    return true;
  };
}

function computeNodeSelectionDeleteRange(
  sel: NodeSelection,
  parentAndIndex: NonNullable<ReturnType<typeof getParentAndIndex>>,
  tagConf: TagConfiguration,
): [number, number] {
  const { parent, index } = parentAndIndex;
  const before = parent.maybeChild(index - 1);
  const after = parent.maybeChild(index + 1);
  const beforeSize = before === null ? 0 : before.nodeSize;
  const afterSize = after === null ? 0 : after.nodeSize;

  // node before before, node after after
  const befoore = parent.maybeChild(index - 2);
  const afteer = parent.maybeChild(index + 2);

  const beforeIsNewline =
    before !== null && before.type === WaterproofSchema.nodes.newline;
  const afterIsNewline =
    after !== null && after.type === WaterproofSchema.nodes.newline;
  const befooreNeedsNewlineAfter =
    befoore !== null && needsNewlineAfter(befoore.type, tagConf);
  const afteerNeedsNewlineBefore =
    afteer !== null && needsNewlineBefore(afteer.type, tagConf);

  const { from, to } = sel;

  // Both sides are newlines and both outer nodes need them: keep before newline, delete after
  if (
    beforeIsNewline &&
    afterIsNewline &&
    befooreNeedsNewlineAfter &&
    afteerNeedsNewlineBefore
  ) {
    return [from, to + afterSize];
  }
  // After is newline and outer node after needs it: keep after newline, delete before newline (if any)
  if (afterIsNewline && afteerNeedsNewlineBefore) {
    return [from - (beforeIsNewline ? beforeSize : 0), to];
  }
  // Before is newline and outer node before needs it: keep before newline, delete after newline (if any)
  if (beforeIsNewline && befooreNeedsNewlineAfter) {
    return [from, to + (afterIsNewline ? afterSize : 0)];
  }
  // Both sides are newlines but neither outer node needs them: delete both
  if (beforeIsNewline && afterIsNewline && !afteerNeedsNewlineBefore) {
    return [from - beforeSize, to + afterSize];
  }
  // Default: delete only the selected node
  return [from, to];
}

export function deleteSelection(tagConf: TagConfiguration): Command {
  return (state, dispatch) => {
    const sel = state.selection;
    if (sel.empty) return false;

    if (sel instanceof TextSelection) {
      if (dispatch) dispatch(state.tr.deleteSelection().scrollIntoView());
      return true;
    }

    if (!(sel instanceof NodeSelection)) return false;

    const parentAndIndex = getParentAndIndex(sel);
    if (!parentAndIndex) return false;

    if (dispatch) {
      const [deleteFrom, deleteTo] = computeNodeSelectionDeleteRange(
        sel,
        parentAndIndex,
        tagConf,
      );
      dispatch(state.tr.delete(deleteFrom, deleteTo).scrollIntoView());
    }
    return true;
  };
}

/**
 * Returns true if the selected node or any of its descendants is one of `descendantTypes`, or if
 * any ancestor is one of `ancestorTypes`. Separating the two lists allows a type to be
 * forbidden as the wrap target / descendant without also blocking it as a parent context.
 */
function hasDisallowedParentOrChild(
  sel: NodeSelection,
  descentdantTypes: NodeType[],
  ancestorTypes: NodeType[],
): boolean {
  if (descentdantTypes.includes(sel.node.type)) return true;

  for (let d = sel.$from.depth; d >= 1; d--) {
    if (ancestorTypes.includes(sel.$from.node(d).type)) return true;
  }

  let found = false;
  sel.node.descendants((child) => {
    if (descentdantTypes.includes(child.type)) {
      found = true;
      return false;
    }
  });
  return found;
}

/**
 * Returns true when it is safe to wrap the current selection.
 * Requires a NodeSelection and checks that neither the selected node, its ancestors,
 * nor its descendants are of any of the given disallowed types.
 * Pass a separate `disallowedAncestorTypes` to use a narrower list for the ancestor check.
 */
function preWrapCheck(
  state: EditorState,
  disallowedTypes: NodeType[],
  disallowedAncestorTypes: NodeType[] = disallowedTypes,
): boolean {
  if (!(state.selection instanceof NodeSelection)) return false;
  return !hasDisallowedParentOrChild(
    state.selection,
    disallowedTypes,
    disallowedAncestorTypes,
  );
}

export function wrapInHint(tagConf: TagConfiguration): Command {
  return (state, dispatch) => {
    // container is disallowed as the wrap target (not in hintinputcontent) but is fine as an
    // ancestor — a hint can live inside a container.
    if (
      !preWrapCheck(
        state,
        [
          WaterproofSchema.nodes.hint,
          WaterproofSchema.nodes.input,
          WaterproofSchema.nodes.container,
        ],
        [WaterproofSchema.nodes.hint, WaterproofSchema.nodes.input],
      )
    )
      return false;
    return wpWrapIn(WaterproofSchema.nodes.hint, tagConf)(state, dispatch);
  };
}

export function wrapInInput(tagConf: TagConfiguration): Command {
  return (state, dispatch) => {
    if (
      !preWrapCheck(
        state,
        [
          WaterproofSchema.nodes.hint,
          WaterproofSchema.nodes.input,
          WaterproofSchema.nodes.container,
        ],
        [WaterproofSchema.nodes.hint, WaterproofSchema.nodes.input],
      )
    )
      return false;
    return wpWrapIn(WaterproofSchema.nodes.input, tagConf)(state, dispatch);
  };
}

export function wrapInContainer(
  tagConf: TagConfiguration,
  name: string,
): Command {
  return (state, dispatch) => {
    if (!preWrapCheck(state, [WaterproofSchema.nodes.container])) return false;
    return wpWrapIn(WaterproofSchema.nodes.container, tagConf, { name })(
      state,
      dispatch,
    );
  };
}

function wpWrapIn(
  nodeType: NodeType,
  tagConf: TagConfiguration,
  attrs?: Attrs,
): Command {
  return (state, dispatch) => {
    const sel = state.selection;
    // Double check, but needed for typechecking
    if (!(sel instanceof NodeSelection)) return false;

    const before = sel.$from.nodeBefore;
    const after = sel.$to.nodeAfter;
    const beforeIsNewline =
      before !== null && before.type === WaterproofSchema.nodes.newline;
    const afterIsNewline =
      after !== null && after.type === WaterproofSchema.nodes.newline;
    const needsBefore = needsNewlineBefore(sel.node.type, tagConf);
    const needsAfter = needsNewlineAfter(sel.node.type, tagConf);

    // Only consume a surrounding newline into the block range when the wrapper's opening/
    // closing tag does NOT already supply a newline — otherwise the tag's own newline and
    // the consumed newline would produce a double-newline in serialised output.
    const consumeBefore =
      needsBefore &&
      beforeIsNewline &&
      !openingTagEndsWithNewline(nodeType, tagConf);
    const consumeAfter =
      needsAfter &&
      afterIsNewline &&
      !closingTagStartsWithNewline(nodeType, tagConf);

    let $start = sel.$from;
    let $end = sel.$to;
    if (before !== null && consumeBefore)
      $start = state.doc.resolve(sel.from - before.nodeSize);
    if (after !== null && consumeAfter)
      $end = state.doc.resolve(sel.to + after.nodeSize);

    const blockRange = $start.blockRange($end);
    if (blockRange === null) return false;

    if (dispatch) {
      const tr = state.tr;
      tr.wrap(blockRange, [{ type: nodeType, attrs }]);

      const wrapperStart = tr.mapping.map(blockRange.start);

      // If the wrapper's opening tag has no trailing newline but the wrapped node needs
      // one before it and no surrounding newline was consumed, insert one inside the wrapper.
      if (
        !openingTagEndsWithNewline(nodeType, tagConf) &&
        needsBefore &&
        !consumeBefore
      ) {
        tr.insert(wrapperStart, WaterproofSchema.nodes.newline.create());
      }
      // Symmetrically for the closing tag.
      if (
        !closingTagStartsWithNewline(nodeType, tagConf) &&
        needsAfter &&
        !consumeAfter
      ) {
        tr.insert(
          tr.mapping.map(blockRange.end) - 1,
          WaterproofSchema.nodes.newline.create(),
        );
      }

      // Insert an outer newline before the wrapper when the preceding node needs one after
      // it, or the wrapper type needs one before it, and no newline is already there.
      const nodeBefore = $start.nodeBefore;
      if (
        nodeBefore !== null &&
        nodeBefore.type !== WaterproofSchema.nodes.newline &&
        (needsNewlineAfter(nodeBefore.type, tagConf) ||
          needsNewlineBefore(nodeType, tagConf))
      ) {
        tr.insert(wrapperStart - 1, WaterproofSchema.nodes.newline.create());
      }
      // Symmetrically after the wrapper.
      const nodeAfter = $end.nodeAfter;
      if (
        nodeAfter !== null &&
        nodeAfter.type !== WaterproofSchema.nodes.newline &&
        (needsNewlineBefore(nodeAfter.type, tagConf) ||
          needsNewlineAfter(nodeType, tagConf))
      ) {
        tr.insert(
          tr.mapping.map(blockRange.end),
          WaterproofSchema.nodes.newline.create(),
        );
      }

      tr.setSelection(NodeSelection.create(tr.doc, tr.mapping.map(sel.from)));
      tr.scrollIntoView();
      dispatch(tr);
    }
    return true;
  };
}
