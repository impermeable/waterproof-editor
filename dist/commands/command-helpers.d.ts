import { NodeType, Node as PNode } from "prosemirror-model";
import { EditorState, Transaction, Selection } from "prosemirror-state";
/**
 * Get a selection type object from a user selection.
 * @param sel Input user selection.
 * @returns Object that stores booleans whether we have a text or node selection.
 */
export declare function selectionType(sel: Selection): {
    isTextSelection: boolean;
    isNodeSelection: boolean;
};
export declare function getNearestPosOutsideCoqblock(sel: Selection, _state: EditorState): {
    start: number;
    end: number;
};
/**
 * Helper function for inserting a new node above the currently selected one.
 * @param state The current editor state.
 * @param tr The current transaction for the state of the editor.
 * @param escapeContainingNode Whether to escape the containing node.
 * @param nodeType Array of nodes to insert. Depending on the node type this will be either one or more
 * (coqcode outside of a coqblock needs to be enclosed within a new coqblock)
 * @returns An insertion transaction.
 */
export declare function insertAbove(state: EditorState, tr: Transaction, ...nodeType: NodeType[]): Transaction;
/**
 * Helper function for inserting a new node underneath the currently selected one.
 * @param state The current editor state.
 * @param tr The current transaction for the state of the editor.
 * @param escapeContainingNode Whether to escape the containing node.
 * @param nodeType Array of nodes to insert. Depending on the node type this will be either one or more
 * (coqcode outside of a coqblock needs to be enclosed within a new coqblock)
 * @returns An insertion transaction.
 */
export declare function insertUnder(state: EditorState, tr: Transaction, ...nodeType: NodeType[]): Transaction;
/**
 * Returns the containing node for the current selection.
 * @param sel The user's selection.
 * @returns The node containing this selection. Will *not* return text nodes.
 */
export declare function getContainingNode(sel: Selection): PNode | undefined;
export declare function allowedToInsert(state: EditorState): boolean;
/**
 * Helper function for checking if the selection is within an input area.
 * @returns Whether the selection is within an input area.
 */
export declare function checkInputArea(sel: Selection): boolean;
//# sourceMappingURL=command-helpers.d.ts.map