/////// Helper functions /////////

import { NodeType, Node as PNode } from "prosemirror-model";
import { EditorState, TextSelection, Transaction, Selection, NodeSelection } from "prosemirror-state";
import { INPUT_AREA_PLUGIN_KEY } from "../inputArea";
import { WaterproofSchema } from "../schema";
import { newline } from "../document/blocks/schema";
import { getSurroundingNodes } from "./utils";

/////// Helper functions /////////

/**
 * Helper function for inserting a new node above the currently selected one.
 * @param state The current editor state.
 * @param tr The current transaction for the state of the editor. 
 * @param escapeContainingNode Whether to escape the containing node. 
 * @param nodeType ?
 * @returns An insertion transaction.
 */
export function insertAbove(state: EditorState, tr: Transaction, nodeType: NodeType, insertNewlineBeforeIfNotExists: boolean, insertNewlineAfterIfNotExists: boolean): Transaction | undefined {
    // console.log("INSERTING ABOVE");
    
    const sel = state.selection;
    let trans: Transaction = tr;

    const {before} = getSurroundingNodes(sel.$from);
    const beforeIsNewline = before !== null ? (before.type === WaterproofSchema.nodes.newline) : false;
    // console.log("Before", before?.type.name);

    let pos;

    if (sel instanceof NodeSelection) {
        // To and from point directly to beginning and end of node.
        pos = sel.from;
    } else if (sel instanceof TextSelection) {
        // TODO: This -1 is here to make sure that we do not insert 3 random code cells. 
        // I can't fully wrap my head around why it is needed at the moment though.
        pos = sel.from - sel.$from.parentOffset - 1;
    } else {
        return;
    }


    if (beforeIsNewline) {
        // Assumption: If a newline appears before a node the current node wants that.
        pos -= 1; // We are going to insert befofre
    }

    // console.log("Node at", state.doc.nodeAt(pos));

    const newBefore = getSurroundingNodes(state.doc.resolve(pos)).before;
    // console.log("newbefore", newBefore);

    const toInsert: PNode[] = [];

    if (insertNewlineBeforeIfNotExists && newBefore?.type !== WaterproofSchema.nodes.newline) {
        toInsert.push(newline());
    }
    toInsert.push(nodeType.create());
    if (insertNewlineAfterIfNotExists && !beforeIsNewline) {
        toInsert.push(newline());
    }

    trans = trans.insert(pos, toInsert);

    // if (insertNewlineBeforeIfNotExists && newBefore?.type !== WaterproofSchema.nodes.newline) {
    //     const node = newline();
    //     trans = trans.insert(pos, node);
    //     console.log("inserting newline before");
    //     // pos += 1;
    // }
    // const mainNode = nodeType.create();
    // trans = trans.insert(pos, mainNode);
    // // pos += 1;
    // if (insertNewlineAfterIfNotExists && !beforeIsNewline) {
    //     const node = newline();
    //     trans = trans.insert(pos, node);
    //     console.log("inserting newline after");
    //     // pos += 1;
    // }

    // console.log(trans);

    return trans;
}

/**
 * Helper function for inserting a new node underneath the currently selected one.
 * @param state The current editor state.
 * @param tr The current transaction for the state of the editor. 
 * @param escapeContainingNode Whether to escape the containing node. 
 * @param nodeType ?
 * @returns An insertion transaction.
 */
export function insertUnder(state: EditorState, tr: Transaction, nodeType: NodeType, insertNewlineBeforeIfNotExists: boolean, insertNewlineAfterIfNotExists: boolean): Transaction | undefined {
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

export function nodeFromSel(sel: Selection): PNode | undefined {
    if (sel instanceof TextSelection) {
        return sel.$from.node(sel.$from.depth);
    } else if (sel instanceof NodeSelection) {
        return sel.node;
    } else {
        return;
    }
}


// function getSurroundingNodes(sel: Selection): {before: PNode | null; after: PNode | null} {
//     // console.log(sel);
//     const depth = sel.$from.depth;
//     // console.log(depth);

//     let parent;
//     let index; 
//     if (depth === 0) {
//         parent = sel.$from.parent;
//         index = sel.$from.index(0);
//     } else {
//         parent = sel.$from.node(1);
//         index = sel.$from.index(1);
//     }
//     // console.log(parent);
    
//     // const parent = (thingie !== undefined ? thingie : sel.$from.parent);
//     // const index = sel.$from.index(1);

//     // console.log(index);
    
//     const before = index > 0 ? parent.child(index - 1) : null;
//     const after = index < parent.childCount - 1 ? parent.child(index + 1) : null;
//     return {before, after};
//     // if (sel instanceof TextSelection) {
//     //     const parent = sel.$from.node(1);
//     //     const index = sel.$from.index(1);
//     //     const before = index > 0 ? parent.child(index - 1) : null;
//     //     const after = index < parent.childCount - 1 ? parent.child(index + 1) : null;
//     //     return {before, after};
//     // } else if (sel instanceof NodeSelection) {
//     //     const parent = sel.$from.parent;
//     //     const index = sel.$from.index(1);
//     //     const before = 
//     // } 
//     // return {before: null, after: null};
// }

/**
 * Returns the containing node for the current selection.
 * @param sel The user's selection.
 * @returns The node containing this selection. Will *not* return text nodes.
 */
export function getContainingNode(sel: Selection): PNode | undefined {
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
    // top level node (see WaterproofSchema in `schema.ts`)
    if (depth < 1) return false;
    return from.node(1).type === WaterproofSchema.nodes.input;
}