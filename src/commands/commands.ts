import { NodeRange, NodeType } from "prosemirror-model";
import { Command, EditorState, NodeSelection, TextSelection, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { liftTarget } from "prosemirror-transform";
import { WaterproofSchema } from "../schema";
import { getParentAndIndex, needsNewlineAfter, needsNewlineBefore } from "./utils";
import { TagConfiguration } from "../api";

export const liftWrapper: Command = (state: EditorState, dispatch?: ((tr: Transaction) => void), _view?: EditorView): boolean => {
    const sel = state.selection;

    if (sel instanceof NodeSelection) {
        const {type} = sel.node;
        if (type === WaterproofSchema.nodes.hint || type === WaterproofSchema.nodes.input) {
            // Hardcoded +1 and -1 are here to move the selection into the input/hint. 
            // The hardcoded depth 1 is the depth of a hint or an input area node type.
            const range = new NodeRange(state.doc.resolve(sel.from + 1), state.doc.resolve(sel.to - 1), 1);

            const target = liftTarget(range);

            if (target === null) return false;

            if (dispatch) dispatch(state.tr.lift(range, target).scrollIntoView());

            return true;
        }
    }

    return false;
}

export function deleteSelection(tagConf: TagConfiguration): Command {
    return (state, dispatch) => {
        if (state.selection.empty) return false;
        if (state.selection instanceof TextSelection) {
            if (dispatch) dispatch(state.tr.deleteSelection().scrollIntoView());
            return true;
        } else if (state.selection instanceof NodeSelection) {
            // console.log("Deleting node selection");
            const {parent, index} = getParentAndIndex(state.selection.$from);
            // console.log("Parent and index:", parent, index);

            const before = parent.maybeChild(index - 1);
            const after = parent.maybeChild(index + 1);
            const beforeSize = before !== null ? before.nodeSize : 0;
            const afterSize = after !== null ? after.nodeSize : 0;
            // node before before
            const befoore = parent.maybeChild(index - 2);
            // node after after
            const afteer = parent.maybeChild(index + 2);
            // console.log("Before and after:", before, after);
            // console.log("Befoore and afteer:", befoore, afteer);
            // console.log("Before using nodeBefore and nodeAfter:", state.selection.$from.nodeBefore, state.selection.$to.nodeAfter);

            const beforeIsNewline = before !== null ? before.type === WaterproofSchema.nodes.newline : false;
            const afterIsNewline = after !== null ? after.type === WaterproofSchema.nodes.newline : false;

            if (beforeIsNewline && afterIsNewline && befoore !== null && afteer !== null && needsNewlineAfter(befoore.type, tagConf) && needsNewlineBefore(afteer.type, tagConf)) {
                // console.log("Before and after are newlines, and befoore needs newline after and afteer needs newline before");
                // Before and after are newlines, and befoore needs newline after and afteer needs newline before
                // We need to keep one of the newlines, so we delete the node and the after newline
                if (dispatch) dispatch(state.tr.delete(state.selection.from, state.selection.to + afterSize).scrollIntoView());

                return true;
            } else if (afterIsNewline && afteer !== null && needsNewlineBefore(state.selection.node.type, tagConf)) {
                // console.log("After is newline and afteer needs newline before");
                // After is newline and afteer needs newline before
                // We need to keep the after newline, so we delete the node and the before newline
                if (dispatch) dispatch(state.tr.delete(state.selection.from - beforeSize, state.selection.to).scrollIntoView());
                return true;
            } else if (beforeIsNewline && befoore !== null && needsNewlineAfter(befoore.type, tagConf)) {
                // console.log("Before is newline and befoore needs newline after");
                // Before is newline and befoore needs newline after
                // We need to keep the before newline, so we delete the node and the after newline
                if (dispatch) dispatch(state.tr.delete(state.selection.from, state.selection.to + afterSize).scrollIntoView());
                return true;
            } else if (beforeIsNewline && afterIsNewline && (befoore === null || (befoore !== null && !needsNewlineAfter(befoore.type, tagConf))) && (afteer === null || (afteer !== null && !needsNewlineBefore(afteer.type, tagConf)))) {
                // console.log("Before and after are newlines, but befoore does not need newline after and afteer does not need newline before");
                // Before and after are newlines, but befoore does not need newline after and afteer does not need newline before
                // We can delete both newlines
                if (dispatch) dispatch(state.tr.delete(state.selection.from - beforeSize, state.selection.to + afterSize).scrollIntoView());
                return true;
            } else {
                // console.log("Deleting node selection");
                if (dispatch) dispatch(state.tr.deleteSelection().scrollIntoView());
                return true;
            }
            // const before = index > 0 ? parent.child(index - 1) : null;
            // const after = index < parent.childCount - 1 ? parent.child(index + 1) : null;
            
            
            // const befoore = index > 1 ? parent.child(index - 2) : null;
            // const afteer = index < parent.childCount - 2 ? parent.child(index + 2) : null;


            // if (before && before.type == WaterproofSchema.nodes.newline) {
            //     // We have a newline before
            //     const befooreNeedsNewline = befoore !== null ? needsNewlineAfter(befoore.type, tagConf) : false;
            // }
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
            console.log(blockRange.startIndex, blockRange.endIndex);

            // We potentially have to insert newlines before or after the newly created input area.
            if (consumeBefore) {
                const nodeBeforeNewline = $start.nodeBefore;
                if (nodeBeforeNewline !== null && needsNewlineAfter(nodeBeforeNewline.type, tagConf)) {
                    // Inserting newline before the input area
                    tr.insert(tr.mapping.map($start.pos) - 1, WaterproofSchema.nodes.newline.create());
                }
            }
            if (consumeAfter) {
                const nodeAfterNewline = $end.nodeAfter;
                if (nodeAfterNewline !== null && needsNewlineBefore(nodeAfterNewline.type, tagConf)) {
                    // Inserting newline after the input area
                    tr.insert(tr.mapping.map($end.pos), WaterproofSchema.nodes.newline.create());
                }
            }

            // Finally, dispatch the transaction and set the selection to be the node selection of the newly created input area.
            tr.setSelection(NodeSelection.create(tr.doc, tr.mapping.map(sel.from)));
            dispatch(tr.scrollIntoView());
            return true;
        }
        return true;
    }
}