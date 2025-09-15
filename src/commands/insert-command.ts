import { Command, EditorState, Transaction } from "prosemirror-state";
import { InsertionFunction, InsertionPlace } from "./types";
import { NodeType } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { allowedToInsert, getContainingNode, getNearestPosOutsideCoqblock } from "./command-helpers";

/**
 * Return a Markdown insertion command.
 * @param insertionFunction The function used to insert the node into the editor.
 * @param place Where to insert the node into the editor. Either Above or Underneath the currently selected node.
 * @param nodeType The node type of the markdown node.
 * @returns The insertion command.
 */
export function getMdInsertCommand(
    insertionFunction: InsertionFunction,
    place: InsertionPlace,
    nodeType: NodeType
): Command {
    return (state: EditorState, dispatch?: ((tr: Transaction) => void), _view?: EditorView): boolean => {
        // Early return when inserting is not allowed
        if (!allowedToInsert(state)) return false;

        // Get the containing node for this selection.
        const container = getContainingNode(state.selection);

        let trans: Transaction | undefined;
        if (container === undefined) return false;

        // Retrieve the name of the containing node.
        const { name } = container.type;

        if (name === "input" || name === "hint" || name === "doc") {
            // In the case of having `input`, `hint` or `doc` as parent node, we can insert directly
            // above or below the selected node.
            trans = insertionFunction(state, state.tr, nodeType);
        } else if (name === "coqblock" || name === "coqdoc") {
            // In the case that the user has a selection within a coqblock or coqdoc cell we need to do more work and
            // figure out where this block `starts` and `ends`.
            const { start, end } = getNearestPosOutsideCoqblock(state.selection, state);
            trans = state.tr.insert(place == InsertionPlace.Above ? start : end, nodeType.create());
        }

        // If the dispatch is given and transaction is not undefined dispatch it.
        if (dispatch && trans) dispatch(trans);

        // successful command.
        return true;
    }
}

/**
 * Returns an insertion command for insertion display latex into the editor.
 * @param insertionFunction The insertion function to use.
 * @param place The place to insert into, either Above or Underneath the currently selected node.
 * @param latexNodeType The node type for a 'display latex' node.
 * @returns The insertion command.
 */
export function getLatexInsertCommand(
    insertionFunction: InsertionFunction,
    place: InsertionPlace,
    latexNodeType: NodeType,
): Command {
    return (state: EditorState, dispatch?: ((tr: Transaction) => void), _view?: EditorView): boolean => {
        // Early return when inserting is not allowed.
        if (!allowedToInsert(state)) return false;
        // Containing node.
        const container = getContainingNode(state.selection);

        let trans: Transaction | undefined;
        if (container === undefined) return false;

        const { name } = container.type

        if (name === "input" || name === "hint" || name === "doc") {
            // `Easy` insertion since we can just insert directly above or below the selection.
            trans = insertionFunction(state, state.tr, latexNodeType);
        } else if (name === "coqblock" || name === "coqdoc") {
            // More difficult insertion since we have to `escape` the current coqblock.
            const { start, end } = getNearestPosOutsideCoqblock(state.selection, state);
            trans = state.tr.insert(place == InsertionPlace.Above ? start : end, latexNodeType.create());
        }

        // Dispatch the transaction when dispatch is given and transaction is not undefined.
        if (dispatch && trans) dispatch(trans);

        // Indicate successful command.
        return true;
    }
}

/**
 * Returns an insertion command for inserting a new coq code cell. Will create a new coqblock if necessary.
 * @param insertionFunction The insertion function to use.
 * @param place The place of insertion, either Above or Underneath the currently selected node.
 * @param codeNodeType The node type for a code cell.
 * @returns The insertion command.
 */
export function getCodeInsertCommand(
    insertionFunction: InsertionFunction,
    place: InsertionPlace,
    codeNodeType: NodeType
): Command {
    return (state: EditorState, dispatch?: ((tr: Transaction) => void), _view?: EditorView): boolean => {
        // Again, early return when inserting is not allowed. 
        if (!allowedToInsert(state)) return false;
        // Retrieve the name of the containing node of the selection.
        const name = getContainingNode(state.selection)?.type.name;
        if (name === undefined) return false;
        let trans: Transaction | undefined;
        
        if (name === "input" || name === "hint" || name === "doc") {
            // Create a new coqblock *and* coqcode cell and insert Above or Underneath the current selection.
            trans = insertionFunction(state, state.tr, codeNodeType);
        } else if (name === "coqblock" || name === "coqdoc") {
            // Find the position outside of the coqblock and insert a new coqblock and coqcode cell above or underneath.
            const {start, end} = getNearestPosOutsideCoqblock(state.selection, state);
            const pos = place == InsertionPlace.Above ? start : end;
            trans = state.tr.insert(pos, codeNodeType.create());
        }

        // If dispatch is given and transaction is set, dispatch the transaction.
        if (dispatch && trans) dispatch(trans);

        // Indicate that this command was successful.
        return true;    
    }
}