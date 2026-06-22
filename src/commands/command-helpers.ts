/////// Helper functions /////////

import { NodeType, Node as PNode } from "prosemirror-model";
import { EditorState, TextSelection, Transaction, Selection, NodeSelection } from "prosemirror-state";
import { INPUT_AREA_PLUGIN_KEY } from "../inputArea";
import { WaterproofSchema } from "../schema";
import { newline } from "../document/blocks/schema";
import { closingTagStartsWithNewline, getParentAndIndex, needsNewlineAfter, needsNewlineBefore, openingTagEndsWithNewline } from "./utils";
import { TagConfiguration } from "../api";

/////// Helper functions /////////

/**
 * Helper function for inserting a new node above the currently selected one.
 * @param state The current editor state.
 * @param tr The current transaction for the state of the editor. 
 * @param nodeType The type of node to insert (one of `WaterproofSchema.nodes`)
 * @returns An insertion transaction.
 */
export function insertAbove(state: EditorState, tr: Transaction, nodeType: NodeType, tagConf: TagConfiguration): Transaction | undefined {
    const sel = state.selection;
    let trans: Transaction = tr;

    const insertNewlineBeforeIfNotExists = needsNewlineBefore(nodeType, tagConf);
    const insertNewlineAfterIfNotExists  = needsNewlineAfter(nodeType, tagConf);

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
        // This -1 is here to make sure we select the parent node
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

    // A newline is also required after the new node if the current node (now below) requires one before its open tag.
    const currentNode = parent.maybeChild(index);
    const currentNeedsNewlineBefore = tagConf && currentNode ? needsNewlineBefore(currentNode.type, tagConf) : false;

    const toInsert: PNode[] = [];

    const nodeAboveInsertion = beforeIsNewline ? beforeNewline : nodeAboveSelection;
    const newlineAlreadyAbove = beforeIsNewline ? hasNewlineBefore : false;
    const aboveNeedsNewlineAfter = nodeAboveInsertion !== null && needsNewlineAfter(nodeAboveInsertion.type, tagConf);

    // The new node's open tag requires a newline before it (e.g. code's "```coq") and, with no
    // existing newline reused above, it would glue directly onto whatever precedes it: either a
    // sibling cell, or the opening tag of a non-doc container that does not already end with a newline.
    const openTagWouldGlueToPreceding =
        insertNewlineBeforeIfNotExists && !beforeIsNewline &&
        (nodeAboveInsertion !== null ||
            (parent.type !== WaterproofSchema.nodes.doc && !openingTagEndsWithNewline(parent.type, tagConf)));

    if ((insertNewlineBeforeIfNotExists && !hasNewlineBefore && beforeIsNewline) ||
        (aboveNeedsNewlineAfter && !newlineAlreadyAbove) ||
        openTagWouldGlueToPreceding) {
        toInsert.push(newline());
    }
    toInsert.push(nodeType.create());
    if ((insertNewlineAfterIfNotExists || currentNeedsNewlineBefore) && !beforeIsNewline) {
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
export function insertBelow(state: EditorState, tr: Transaction, nodeType: NodeType, tagConf: TagConfiguration): Transaction | undefined {
    const sel = state.selection;
    let trans: Transaction = tr;

    const insertNewlineBeforeIfNotExists = needsNewlineBefore(nodeType, tagConf);
    const insertNewlineAfterIfNotExists  = needsNewlineAfter(nodeType, tagConf);

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
        pos = sel.from + (sel.$from.parent.nodeSize - sel.$from.parentOffset) - 1;
    } else {
        return;
    }

    if (afterIsNewline) {
        // Assumption: If a newline appears after a node the current node wants that.
        pos += 1; // We are going to insert after
    }

    const afterNewline = parent.maybeChild(index + 2);
    const hasNewlineAfter = afterNewline === null ? false : afterNewline.type === WaterproofSchema.nodes.newline;

    
    const nodeBelowInsertion = afterIsNewline ? afterNewline : nodeBelowSelection;
    const newlineAlreadyBelow = afterIsNewline ? hasNewlineAfter : false;
    const belowNeedsNewlineBefore = nodeBelowInsertion !== null && needsNewlineBefore(nodeBelowInsertion.type, tagConf);
    // A newline is also required before the new node if the current node's close tag requires one.
    const currentNode = parent.maybeChild(index);
    const currentNeedsNewlineAfter = tagConf && currentNode ? needsNewlineAfter(currentNode.type, tagConf) : false;

    // The new node's close tag requires a newline after it (e.g. code's "\n```") and, with no
    // existing newline reused below, it would glue directly onto whatever follows it: either a
    // sibling cell, or the closing tag of a non-doc container that does not already start with a newline.
    const closeTagWouldGlueToFollowing =
        insertNewlineAfterIfNotExists && !afterIsNewline &&
        (nodeBelowInsertion !== null ||
            (parent.type !== WaterproofSchema.nodes.doc && !closingTagStartsWithNewline(parent.type, tagConf)));

    const toInsert: PNode[] = [];
    if ((insertNewlineBeforeIfNotExists || currentNeedsNewlineAfter) && !afterIsNewline) {
        toInsert.push(newline());
    }
    toInsert.push(nodeType.create());
    // A trailing newline is needed when:
    // 1. The node is inserted after an existing newline and there is no newline further down, OR
    // 2. The node below the insertion point needs a newline before it, OR
    // 3. The new node's own close tag would otherwise glue onto what follows it.
    if ((insertNewlineAfterIfNotExists && !hasNewlineAfter && afterIsNewline) ||
        (belowNeedsNewlineBefore && !newlineAlreadyBelow) ||
        closeTagWouldGlueToFollowing) {
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
    // An input area can be at depth = 1 (top level) or depth = 2 (inside a container)
    if (depth < 1) return false;
    if (from.node(1).type === WaterproofSchema.nodes.input) return true;
    if (depth >= 2 && from.node(1).type === WaterproofSchema.nodes.container && from.node(2).type === WaterproofSchema.nodes.input) return true;
    return false;
}