/////// Helper functions /////////

import { NodeType, Node as PNode } from "prosemirror-model";
import { EditorState, TextSelection, Transaction, Selection, NodeSelection } from "prosemirror-state";
import { INPUT_AREA_PLUGIN_KEY } from "../inputArea";
import { WaterproofSchema } from "../schema";

/////// Helper functions /////////

/**
 * Helper function for inserting a new node above the currently selected one.
 * @param state The current editor state.
 * @param tr The current transaction for the state of the editor. 
 * @param escapeContainingNode Whether to escape the containing node. 
 * @param nodeType Array of nodes to insert. Depending on the node type this will be either one or more 
 * (coqcode outside of a coqblock needs to be enclosed within a new coqblock)
 * @returns An insertion transaction.
 */
export function insertAbove(state: EditorState, tr: Transaction, nodeType: NodeType): Transaction | undefined {
    const sel = state.selection;
    let trans: Transaction = tr;

    if (sel instanceof NodeSelection) {
        // To and from point directly to beginning and end of node.
        const pos = sel.from;
        trans = trans.insert(pos, nodeType.create());
        return trans;
    } else if (sel instanceof TextSelection) {
        // TODO: This -1 is here to make sure that we do not insert 3 random code cells. 
        // I can't fully wrap my head around why it is needed at the moment though.
        const from = sel.from - sel.$from.parentOffset - 1;
        trans = trans.insert(from, nodeType.create());
        return trans;
    }

    return;
}

/**
 * Helper function for inserting a new node underneath the currently selected one.
 * @param state The current editor state.
 * @param tr The current transaction for the state of the editor. 
 * @param escapeContainingNode Whether to escape the containing node. 
 * @param nodeType Array of nodes to insert. Depending on the node type this will be either one or more 
 * (coqcode outside of a coqblock needs to be enclosed within a new coqblock)
 * @returns An insertion transaction.
 */
export function insertUnder(state: EditorState, tr: Transaction, nodeType: NodeType): Transaction | undefined {
    const sel = state.selection;

    let trans: Transaction = tr;

    if (sel instanceof NodeSelection) {
        // To and from point directly to beginning and end of node.
        const pos = sel.to;
        trans = trans.insert(pos, nodeType.create());
        return trans;
    } else if (sel instanceof TextSelection) {
        const to = sel.to + (sel.$from.parent.nodeSize - sel.$from.parentOffset) - 1;

        if (to > state.doc.nodeSize) {
            console.log("The computed `to` value lies outside of the document");
            return;
        }

        trans = trans.insert(to, nodeType.create());
        return trans;
    }

    return;
}

/**
 * Returns the containing node for the current selection.
 * @param sel The user's selection.
 * @returns The node containing this selection. Will *not* return text nodes.
 */
export function getContainingNode(sel: Selection): PNode | undefined {
    // const {isTextSelection, isNodeSelection} = selectionType(sel);

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
    // If in global locking mode, disallow everything
    if (pluginState.globalLock) return false;
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
    // An input area can only ever have depth = 1, since it is a 
    // top level node (see TheSchema in `kroqed-schema.ts`)
    if (depth < 1) return false;
    return from.node(1).type === WaterproofSchema.nodes.input;
}