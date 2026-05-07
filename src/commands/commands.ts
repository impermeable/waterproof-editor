import { Attrs, NodeType } from "prosemirror-model";
import { Command, EditorState, NodeSelection, TextSelection, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { liftTarget } from "prosemirror-transform";
import { WaterproofSchema } from "../schema";
import { closingTagStartsWithNewline, getParentAndIndex, needsNewlineAfter, needsNewlineBefore, openingTagEndsWithNewline } from "./utils";
import { TagConfiguration } from "../api";

export function wpLift(_tagConf: TagConfiguration): Command {
    return (state: EditorState, dispatch?: ((tr: Transaction) => void), _view?: EditorView): boolean => {
        const sel = state.selection;

        if (!(sel instanceof NodeSelection)) return false;

        const { $from, $to, node, from, to } = sel;
        const before = $from.nodeBefore;
        const after = $to.nodeAfter;
        
        const {type} = node;
        if (type !== WaterproofSchema.nodes.hint && type !== WaterproofSchema.nodes.input && type !== WaterproofSchema.nodes.container) {
            // We can only lift hint, input area, or container nodes.
            return false;
        }

        // The schema enforces that the input/hint contains at least one child.
        // Retrieve the first and last child (may be the same)
        const { firstChild, lastChild, childCount } = node;
        if (!firstChild || !lastChild) return false;
        const firstIsNewline = firstChild.type === WaterproofSchema.nodes.newline;
        const lastIsNewline = lastChild.type === WaterproofSchema.nodes.newline;

        const beforeIsNewline = before === null ? false : before.type === WaterproofSchema.nodes.newline;
        const afterIsNewline = after === null ? false : after.type === WaterproofSchema.nodes.newline;

        const shouldRemoveNewlineBefore = beforeIsNewline && firstIsNewline;
        const shouldRemoveNewlineAfter = afterIsNewline && lastIsNewline && childCount > 1;

        // Create a block range that covers the content of the input/hint block
        const range = state.doc.resolve(from + 1).blockRange(state.doc.resolve(to - 1));
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
    }
}

export function deleteSelection(tagConf: TagConfiguration): Command {
    return (state, dispatch) => {
        const sel = state.selection;
        if (sel.empty) return false;
        if (sel instanceof TextSelection) {
            if (dispatch) dispatch(state.tr.deleteSelection().scrollIntoView());
            return true;
        } else if (sel instanceof NodeSelection) {
            // const {parent, index} = getParentAndIndex(state.selection.$from);
            const parentAndIndex = getParentAndIndex(sel);
            if (!parentAndIndex) return false;
            const {parent, index} = parentAndIndex;

            const before = parent.maybeChild(index - 1);
            const after = parent.maybeChild(index + 1);
            const beforeSize = before === null ? 0 : before.nodeSize;
            const afterSize = after === null ? 0 : after.nodeSize;
            // node before before
            const befoore = parent.maybeChild(index - 2);
            // node after after
            const afteer = parent.maybeChild(index + 2);
            
            const beforeIsNewline = before === null ? false : before.type === WaterproofSchema.nodes.newline;
            const afterIsNewline = after === null ? false : after.type === WaterproofSchema.nodes.newline;

            if (beforeIsNewline && afterIsNewline && befoore !== null && afteer !== null && needsNewlineAfter(befoore.type, tagConf) && needsNewlineBefore(afteer.type, tagConf)) {
                // Before and after are newlines, and befoore needs newline after and afteer needs newline before
                // We need to keep one of the newlines, so we delete the node and the after newline
                if (dispatch) dispatch(state.tr.delete(state.selection.from, state.selection.to + afterSize).scrollIntoView());
                return true;
            } else if (afterIsNewline && afteer !== null && needsNewlineBefore(sel.node.type, tagConf)) {
                // After is newline and afteer needs newline before
                // We need to keep the after newline, so we delete the node and the before newline
                if (dispatch) dispatch(state.tr.delete(state.selection.from - beforeSize, state.selection.to).scrollIntoView());
                return true;
            } else if (beforeIsNewline && befoore !== null && needsNewlineAfter(befoore.type, tagConf)) {
                // Before is newline and befoore needs newline after
                // We need to keep the before newline, so we delete the node and the after newline
                if (dispatch) dispatch(state.tr.delete(state.selection.from, state.selection.to + afterSize).scrollIntoView());
                return true;
            } else if (beforeIsNewline && afterIsNewline && (befoore === null || (befoore !== null && !needsNewlineAfter(befoore.type, tagConf))) && (afteer === null || (afteer !== null && !needsNewlineBefore(afteer.type, tagConf)))) {
                // Before and after are newlines, but befoore does not need newline after and afteer does not need newline before
                // We can delete both newlines
                if (dispatch) dispatch(state.tr.delete(state.selection.from - beforeSize, state.selection.to + afterSize).scrollIntoView());
                return true;
            } else {
                if (dispatch) dispatch(state.tr.deleteSelection().scrollIntoView());
                return true;
            }
        }
        return false;
    }
}

/**
 * Returns true if the selected node, any of its ancestors, or any of its descendants
 * is of one of the given node types. Used to determine whether a wrap operation would
 * create a forbidden nesting structure.
 */
function hasDisallowedParentOrChild(sel: NodeSelection, types: NodeType[]): boolean {
    if (types.includes(sel.node.type)) return true;

    for (let d = sel.$from.depth; d >= 1; d--) {
        if (types.includes(sel.$from.node(d).type)) return true;
    }

    let found = false;
    sel.node.descendants((child) => {
        if (types.includes(child.type)) {
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
 */
function preWrapCheck(state: EditorState, disallowedTypes: NodeType[]): boolean {
    if (!(state.selection instanceof NodeSelection)) return false;
    return !hasDisallowedParentOrChild(state.selection, disallowedTypes);
}

export function wrapInHint(tagConf: TagConfiguration): Command {
    return (state, dispatch) => {
        if (!preWrapCheck(state, [WaterproofSchema.nodes.hint, WaterproofSchema.nodes.input])) return false;
        return wpWrapIn(WaterproofSchema.nodes.hint, tagConf)(state, dispatch);
    };
}

export function wrapInInput(tagConf: TagConfiguration): Command {
    return (state, dispatch) => {
        if (!preWrapCheck(state, [WaterproofSchema.nodes.hint, WaterproofSchema.nodes.input])) return false;
        return wpWrapIn(WaterproofSchema.nodes.input, tagConf)(state, dispatch);
    };
}

export function wrapInContainer(tagConf: TagConfiguration, name: string): Command {
    return (state, dispatch) => {
        if (!preWrapCheck(state, [WaterproofSchema.nodes.container])) return false;
        return wpWrapIn(WaterproofSchema.nodes.container, tagConf, {name})(state, dispatch);
    };
}

function wpWrapIn(nodeType: NodeType, tagConf: TagConfiguration, attrs? : Attrs): Command {
    return (state, dispatch) => {
        const sel = state.selection;
        if (!(sel instanceof NodeSelection)) return false;
        
        const before = sel.$from.nodeBefore;
        const after = sel.$to.nodeAfter;
        
        if (dispatch) {
            const beforeIsNewline = before === null ? false : before.type === WaterproofSchema.nodes.newline;
            const afterIsNewline = after === null ? false : after.type === WaterproofSchema.nodes.newline;
            const nodeBeingWrapped = sel.node;
            const needsBefore = needsNewlineBefore(nodeBeingWrapped.type, tagConf);
            const needsAfter = needsNewlineAfter(nodeBeingWrapped.type, tagConf);
            
            let $start = sel.$from;
            let $end = sel.$to;

            const consumeBefore = needsBefore && beforeIsNewline && !openingTagEndsWithNewline(nodeType, tagConf);
            const consumeAfter = needsAfter && afterIsNewline && !closingTagStartsWithNewline(nodeType, tagConf);

            if (before !== null && consumeBefore) {
                // extend the selection to incldue the before newline node
                $start = state.doc.resolve(sel.from - before.nodeSize);
            }
            if (after !== null && consumeAfter) {
                // extend the selection to include the after newline node
                $end = state.doc.resolve(sel.to + after.nodeSize);
            }
            
            // We extend the blockRange to include the newlines if they are being consumed.
            const blockRange = $start.blockRange($end);
            if (blockRange === null) return false;
            const tr = state.tr;
            tr.wrap(blockRange, [{type: nodeType, attrs}]);

            // If the wrapper's opening tag does not end with a newline, the wrapped node needs a
            // newline before it, and no surrounding newline was consumed into the wrapper, insert a
            // newline node as the first child of the wrapper so the content starts on its own line.
            if (!openingTagEndsWithNewline(nodeType, tagConf) && needsBefore && !consumeBefore) {
                const wrapperContentStart = tr.mapping.map(blockRange.start);
                tr.insert(wrapperContentStart, WaterproofSchema.nodes.newline.create());
            }

            // Symmetrically for the closing tag.
            if (!closingTagStartsWithNewline(nodeType, tagConf) && needsAfter && !consumeAfter) {
                const wrapperContentEnd = tr.mapping.map(blockRange.end) - 1;
                tr.insert(wrapperContentEnd, WaterproofSchema.nodes.newline.create());
            }

            // We potentially have to insert newlines before or after the newly created input area.
            const nodeBefore = $start.nodeBefore;
            if (nodeBefore !== null && nodeBefore.type !== WaterproofSchema.nodes.newline && (needsNewlineAfter(nodeBefore.type, tagConf) || needsNewlineBefore(nodeType, tagConf))) {
                // Inserting newline before the input area
                tr.insert(tr.mapping.map(blockRange.start) - 1, WaterproofSchema.nodes.newline.create());
            }
            
            const nodeAfter = $end.nodeAfter;
            if (nodeAfter !== null && nodeAfter.type !== WaterproofSchema.nodes.newline && (needsNewlineBefore(nodeAfter.type, tagConf) || needsNewlineAfter(nodeType, tagConf))) {
                // Inserting newline after the input area
                tr.insert(tr.mapping.map(blockRange.end), WaterproofSchema.nodes.newline.create());
            }

            // Finally, dispatch the transaction and set the selection to be the node selection of the newly created input area.
            tr.setSelection(NodeSelection.create(tr.doc, tr.mapping.map(sel.from)));
            tr.scrollIntoView();
            dispatch(tr);
            return true;
        }
        return true;
    }
}