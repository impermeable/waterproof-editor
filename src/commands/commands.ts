import { NodeType } from "prosemirror-model";
import { Command, EditorState, NodeSelection, TextSelection, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { liftTarget } from "prosemirror-transform";
import { WaterproofSchema } from "../schema";
import { getParentAndIndex, needsNewlineAfter, needsNewlineBefore } from "./utils";
import { TagConfiguration } from "../api";

export function wpLift(_tagConf: TagConfiguration): Command {
    return (state: EditorState, dispatch?: ((tr: Transaction) => void), _view?: EditorView): boolean => {
        const sel = state.selection;

        if (!(sel instanceof NodeSelection)) return false;

        const { $from, $to, node, from, to } = sel;
        const before = $from.nodeBefore;
        const after = $to.nodeAfter;
        
        const {type} = node;
        if (type !== WaterproofSchema.nodes.hint && type !== WaterproofSchema.nodes.input) {
            // We can only lift hint or input area nodes.
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
        // Can we assume that the newlines in the dcuments are always there for some node?
        // const needsBefore = needsNewlineBefore(node.type, tagConf);
        // const needsAfter = needsNewlineAfter(node.type, tagConf);

        // console.log("first", firstIsNewline, "last", lastIsNewline, "before", beforeIsNewline, "after", afterIsNewline, "needsBefore", needsBefore, "needsAfter", needsAfter);

        const shouldRemoveNewlineBefore = beforeIsNewline && firstIsNewline;
        const shouldRemoveNewlineAfter = afterIsNewline && lastIsNewline && childCount > 1;

        // if (beforeIsNewline && firstIsNewline) {
        //     console.log("Both first child and before node are newlines");
        //     console.log("We are going to remove the node before");
        // }

        // if (afterIsNewline && lastIsNewline && childCount > 1) {
        //     console.log("Both the last node and the after node are newlines (and the first and last child are not the same)");
        //     console.log("We are going to remove the node after");
        // }

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
        if (state.selection.empty) return false;
        if (state.selection instanceof TextSelection) {
            if (dispatch) dispatch(state.tr.deleteSelection().scrollIntoView());
            return true;
        } else if (state.selection instanceof NodeSelection) {
            const {parent, index} = getParentAndIndex(state.selection.$from);

            const before = parent.maybeChild(index - 1);
            const after = parent.maybeChild(index + 1);
            const beforeSize = before !== null ? before.nodeSize : 0;
            const afterSize = after !== null ? after.nodeSize : 0;
            // node before before
            const befoore = parent.maybeChild(index - 2);
            // node after after
            const afteer = parent.maybeChild(index + 2);
            
            const beforeIsNewline = before !== null ? before.type === WaterproofSchema.nodes.newline : false;
            const afterIsNewline = after !== null ? after.type === WaterproofSchema.nodes.newline : false;

            if (beforeIsNewline && afterIsNewline && befoore !== null && afteer !== null && needsNewlineAfter(befoore.type, tagConf) && needsNewlineBefore(afteer.type, tagConf)) {
                // Before and after are newlines, and befoore needs newline after and afteer needs newline before
                // We need to keep one of the newlines, so we delete the node and the after newline
                if (dispatch) dispatch(state.tr.delete(state.selection.from, state.selection.to + afterSize).scrollIntoView());
                return true;
            } else if (afterIsNewline && afteer !== null && needsNewlineBefore(state.selection.node.type, tagConf)) {
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

export function wrapInHint(tagConf: TagConfiguration): Command {
    return wpWrapIn(WaterproofSchema.nodes.hint, tagConf);
}

export function wrapInInput(tagConf: TagConfiguration): Command {
    return wpWrapIn(WaterproofSchema.nodes.input, tagConf);
}

function wpWrapIn(nodeType: NodeType, tagConf: TagConfiguration): Command {
    return (state, dispatch) => {
        const sel = state.selection;
        if (!(sel instanceof NodeSelection)) return false;
        
        const before = sel.$from.nodeBefore;
        const after = sel.$to.nodeAfter;
        
        if (dispatch) {
            const beforeIsNewline = before !== null ? before.type === WaterproofSchema.nodes.newline : false;
            const afterIsNewline = after !== null ? after.type === WaterproofSchema.nodes.newline : false;
            const nodeBeingWrapped = sel.node;
            const needsBefore = needsNewlineBefore(nodeBeingWrapped.type, tagConf);
            const needsAfter = needsNewlineAfter(nodeBeingWrapped.type, tagConf);
            
            if ((needsBefore && !beforeIsNewline) || (needsAfter && !afterIsNewline)) {
                return false;
            }
            
            let $start = sel.$from;
            let $end = sel.$to;
            const consumeBefore = needsBefore && beforeIsNewline;
            const consumeAfter = needsAfter && afterIsNewline;
            // console.log("Consume before and after:", consumeBefore, consumeAfter);
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
            tr.wrap(blockRange, [{type: nodeType}]);

            // We potentially have to insert newlines before or after the newly created input area.
            if (consumeBefore) {
                const nodeBeforeNewline = $start.nodeBefore;
                if (nodeBeforeNewline !== null && needsNewlineAfter(nodeBeforeNewline.type, tagConf)) {
                    // Inserting newline before the input area
                    tr.insert(tr.mapping.map(blockRange.start) - 1, WaterproofSchema.nodes.newline.create());
                }
            }
            
            if (consumeAfter) {
                const nodeAfterNewline = $end.nodeAfter;
                if (nodeAfterNewline !== null && needsNewlineBefore(nodeAfterNewline.type, tagConf)) {
                    // Inserting newline after the input area
                    tr.insert(tr.mapping.map(blockRange.end), WaterproofSchema.nodes.newline.create());
                }
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