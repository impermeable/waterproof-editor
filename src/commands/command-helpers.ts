/////// Helper functions /////////

import { NodeType, Node as PNode } from "prosemirror-model";
import { EditorState, TextSelection, Transaction, Selection, NodeSelection } from "prosemirror-state";
import { INPUT_AREA_PLUGIN_KEY } from "../inputArea";
import { WaterproofSchema } from "../schema";
import { newline } from "../document/blocks/schema";
import { getParentAndIndex } from "./utils";

/////// Helper functions /////////

/**
 * Helper function for inserting a new node above the currently selected one.
 * @param state The current editor state.
 * @param tr The current transaction for the state of the editor. 
 * @param nodeType The type of node to insert (one of `WaterproofSchema.nodes`)
 * @returns An insertion transaction.
 */
export function insertAbove(state: EditorState, tr: Transaction, nodeType: NodeType, insertNewlineBeforeIfNotExists: boolean, insertNewlineAfterIfNotExists: boolean): Transaction | undefined {    
    const sel = state.selection;
    let trans: Transaction = tr;

    const parentAndIndex = getParentAndIndex(sel);
    if (parentAndIndex === null) return;
    const {parent, index} = parentAndIndex;

    const nodeAboveSelection = parent.maybeChild(index - 1);
    const beforeIsNewline = nodeAboveSelection === null ? false : (nodeAboveSelection.type === WaterproofSchema.nodes.newline);

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
        pos -= 1; // We are going to insert before the newline node
    }

    const beforeNewline = parent.maybeChild(index - 2);
    const hasNewlineBefore = beforeNewline === null ? false : beforeNewline.type === WaterproofSchema.nodes.newline;

    const toInsert: PNode[] = [];

    if (insertNewlineBeforeIfNotExists && !hasNewlineBefore && beforeIsNewline) {
        toInsert.push(newline());
    }
    toInsert.push(nodeType.create());
    if (insertNewlineAfterIfNotExists && !beforeIsNewline) {
        toInsert.push(newline());
    }

    trans = trans.insert(pos, toInsert);

    return trans;
}

/**
 * Helper function for inserting a new node below the currently selected one.
 * @param state The current editor state.
 * @param tr The current transaction for the state of the editor. 
 * @param nodeType The type of node to insert (one of `WaterproofSchema.nodes`)
 * @returns An insertion transaction.
 */
export function insertBelow(state: EditorState, tr: Transaction, nodeType: NodeType, insertNewlineBeforeIfNotExists: boolean, insertNewlineAfterIfNotExists: boolean): Transaction | undefined {
    const sel = state.selection;
    let trans: Transaction = tr;
    
    const parentAndIndex = getParentAndIndex(sel);
    if (parentAndIndex === null) return;
    const {parent, index} = parentAndIndex;

    const nodeBelowSelection = parent.maybeChild(index + 1);
    const afterIsNewline = nodeBelowSelection === null ? false : (nodeBelowSelection.type === WaterproofSchema.nodes.newline);

    let pos;
    
    if (sel instanceof NodeSelection) {
        // To and from point directly to beginning and end of node.
        pos = sel.to;
    } else if (sel instanceof TextSelection) {
        pos = sel.to + (sel.$from.parent.nodeSize - sel.$from.parentOffset) - 1;
    } else {
        return;
    }

    if (afterIsNewline) {
        // Assumption: If a newline appears after a node the current node wants that.
        pos += 1; // We are going to insert after
    }
    
    const afterNewline = parent.maybeChild(index + 2);
    const hasNewlineAfter = afterNewline === null ? false : afterNewline.type === WaterproofSchema.nodes.newline;

    
    const toInsert: PNode[] = [];
    if (insertNewlineBeforeIfNotExists && !afterIsNewline) {
        toInsert.push(newline());
    }
    toInsert.push(nodeType.create());
    if (insertNewlineAfterIfNotExists && !hasNewlineAfter && afterIsNewline) {
        toInsert.push(newline());
    }

    trans = trans.insert(pos, toInsert);

    return trans;
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