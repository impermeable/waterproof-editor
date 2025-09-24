import { NodeRange } from "prosemirror-model";
import { Command, EditorState, NodeSelection, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { liftTarget } from "prosemirror-transform";
import { WaterproofSchema } from "../schema";

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