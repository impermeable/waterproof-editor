import { NodeRange } from "prosemirror-model";
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

            const beforeIsNewline = before !== null ? before.type === WaterproofSchema.nodes.newline : false;
            const afterIsNewline = after !== null ? after.type === WaterproofSchema.nodes.newline : false;

            if (beforeIsNewline && afterIsNewline && befoore !== null && afteer !== null && needsNewlineAfter(befoore.type, tagConf) && needsNewlineBefore(afteer.type, tagConf)) {
                console.log("Before and after are newlines, and befoore needs newline after and afteer needs newline before");
                // Before and after are newlines, and befoore needs newline after and afteer needs newline before
                // We need to keep one of the newlines, so we delete the node and the after newline
                if (dispatch) dispatch(state.tr.delete(state.selection.from, state.selection.to + afterSize).scrollIntoView());

                return true;
            } else if (afterIsNewline && afteer !== null && needsNewlineBefore(state.selection.node.type, tagConf)) {
                console.log("After is newline and afteer needs newline before");
                // After is newline and afteer needs newline before
                // We need to keep the after newline, so we delete the node and the before newline
                if (dispatch) dispatch(state.tr.delete(state.selection.from - beforeSize, state.selection.to).scrollIntoView());
                return true;
            } else if (beforeIsNewline && befoore !== null && needsNewlineAfter(befoore.type, tagConf)) {
                console.log("Before is newline and befoore needs newline after");
                // Before is newline and befoore needs newline after
                // We need to keep the before newline, so we delete the node and the after newline
                if (dispatch) dispatch(state.tr.delete(state.selection.from, state.selection.to + afterSize).scrollIntoView());
                return true;
            } else if (beforeIsNewline && afterIsNewline && (befoore === null || (befoore !== null && !needsNewlineAfter(befoore.type, tagConf))) && (afteer === null || (afteer !== null && !needsNewlineBefore(afteer.type, tagConf)))) {
                console.log("Before and after are newlines, but befoore does not need newline after and afteer does not need newline before");
                // Before and after are newlines, but befoore does not need newline after and afteer does not need newline before
                // We can delete both newlines
                if (dispatch) dispatch(state.tr.delete(state.selection.from - beforeSize, state.selection.to + afterSize).scrollIntoView());
                return true;
            } else {
                console.log("Deleting node selection");
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
