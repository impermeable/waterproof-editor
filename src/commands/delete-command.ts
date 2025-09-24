import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { WaterproofSchema } from "../schema";

export function deleteNodeIfEmpty(state: EditorState, dispatch?: ((tr: Transaction) => void), _view?: EditorView): boolean {
    if (state.selection.from !== state.selection.to) return false;
    const parent = state.selection.$from.parent;
    const {textContent, type} = parent;
    if (textContent === "" && 
        (type === WaterproofSchema.nodes.code || type === WaterproofSchema.nodes.markdown)) {
        // empty cell

        // Get the start and end position of the containing cell.
        const start = state.selection.$from.posAtIndex(0, state.selection.$from.depth - 1) - 1;
        const end = start + parent.nodeSize;
        // Create a deletion transaction.
        const trans = state.tr.delete(start, end);
        // Apply when `dispatch` is supplied.
        if (dispatch) dispatch(trans);
        return true;
    }
    return false;
}