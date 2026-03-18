import { Fragment, NodeType } from "prosemirror-model";
import { Command, EditorState, NodeSelection, TextSelection, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { liftTarget, ReplaceAroundStep } from "prosemirror-transform";
import { Slice } from "prosemirror-model";
import { WaterproofSchema } from "../schema";
import { getParentAndIndex, needsNewlineAfter, needsNewlineBefore } from "./utils";
import { TagConfiguration } from "../api";

export function wpLift(_tagConf: TagConfiguration): Command {
    return (state: EditorState, dispatch?: ((tr: Transaction) => void), _view?: EditorView): boolean => {
        const sel = state.selection;

        if (!(sel instanceof NodeSelection)) return false;

        const { $from, $to, node, from, to } = sel;
        const before = $from.nodeBefore;
        const after = $to.nodeAfter;
        
        const {type} = node;
        if (type !== WaterproofSchema.nodes.hint && type !== WaterproofSchema.nodes.input && type !== WaterproofSchema.nodes.container) {
            // We can only lift hint, input area, or container nodes.
            return false;
        }

        // The schema enforces that the input/hint contains at least one child.
        // Retrieve the first and last child (may be the same)
        const { firstChild, lastChild, childCount } = node;
        if (!firstChild || !lastChild) return false;
        const firstIsNewline = firstChild.type === WaterproofSchema.nodes.newline;
        const lastIsNewline = lastChild.type === WaterproofSchema.nodes.newline;



        const beforeIsNewline = before === null ? false : before.type === WaterproofSchema.nodes.newline;
        const afterIsNewline = after === null ? false : after.type === WaterproofSchema.nodes.newline;
        // Can we assume that the newlines in the dcuments are always there for some node?
        // const needsBefore = needsNewlineBefore(node.type, tagConf);
        // const needsAfter = needsNewlineAfter(node.type, tagConf);

        // console.log("first", firstIsNewline, "last", lastIsNewline, "before", beforeIsNewline, "after", afterIsNewline, "needsBefore", needsBefore, "needsAfter", needsAfter);

        const shouldRemoveNewlineBefore = beforeIsNewline && firstIsNewline;
        const shouldRemoveNewlineAfter = afterIsNewline && lastIsNewline && childCount > 1;

        // if (beforeIsNewline && firstIsNewline) {
        //     console.log("Both first child and before node are newlines");
        //     console.log("We are going to remove the node before");
        // }

        // if (afterIsNewline && lastIsNewline && childCount > 1) {
        //     console.log("Both the last node and the after node are newlines (and the first and last child are not the same)");
        //     console.log("We are going to remove the node after");
        // }

        // Create a block range that covers the content of the input/hint block
        const range = state.doc.resolve(from + 1).blockRange(state.doc.resolve(to - 1));
        if (range === null) return false;

        // Compute the lifting depth given the range covering the content of the hint/input
        const target = liftTarget(range);
        if (target === null) return false;

        if (dispatch) {
            const tr = state.tr;
            tr.lift(range, target).scrollIntoView();
            if (shouldRemoveNewlineBefore) {
                tr.delete(tr.mapping.map(from), tr.mapping.map(from) + 1);
            }
            if (shouldRemoveNewlineAfter) {
                tr.delete(tr.mapping.map(to), tr.mapping.map(to) + 1);
            }
            // Dispatch the transaction
            dispatch(tr);
        }

        return true;
    }
}

export function deleteSelection(tagConf: TagConfiguration): Command {
    return (state, dispatch) => {
        const sel = state.selection;
        if (sel.empty) return false;
        if (sel instanceof TextSelection) {
            if (dispatch) dispatch(state.tr.deleteSelection().scrollIntoView());
            return true;
        } else if (sel instanceof NodeSelection) {
            // const {parent, index} = getParentAndIndex(state.selection.$from);
            const parentAndIndex = getParentAndIndex(sel);
            if (!parentAndIndex) return false;
            const {parent, index} = parentAndIndex;

            const before = parent.maybeChild(index - 1);
            const after = parent.maybeChild(index + 1);
            const beforeSize = before === null ? 0 : before.nodeSize;
            const afterSize = after === null ? 0 : after.nodeSize;
            // node before before
            const befoore = parent.maybeChild(index - 2);
            // node after after
            const afteer = parent.maybeChild(index + 2);
            
            const beforeIsNewline = before === null ? false : before.type === WaterproofSchema.nodes.newline;
            const afterIsNewline = after === null ? false : after.type === WaterproofSchema.nodes.newline;

            if (beforeIsNewline && afterIsNewline && befoore !== null && afteer !== null && needsNewlineAfter(befoore.type, tagConf) && needsNewlineBefore(afteer.type, tagConf)) {
                // Before and after are newlines, and befoore needs newline after and afteer needs newline before
                // We need to keep one of the newlines, so we delete the node and the after newline
                if (dispatch) dispatch(state.tr.delete(state.selection.from, state.selection.to + afterSize).scrollIntoView());
                return true;
            } else if (afterIsNewline && afteer !== null && needsNewlineBefore(sel.node.type, tagConf)) {
                // After is newline and afteer needs newline before
                // We need to keep the after newline, so we delete the node and the before newline
                if (dispatch) dispatch(state.tr.delete(state.selection.from - beforeSize, state.selection.to).scrollIntoView());
                return true;
            } else if (beforeIsNewline && befoore !== null && needsNewlineAfter(befoore.type, tagConf)) {
                // Before is newline and befoore needs newline after
                // We need to keep the before newline, so we delete the node and the after newline
                if (dispatch) dispatch(state.tr.delete(state.selection.from, state.selection.to + afterSize).scrollIntoView());
                return true;
            } else if (beforeIsNewline && afterIsNewline && (befoore === null || (befoore !== null && !needsNewlineAfter(befoore.type, tagConf))) && (afteer === null || (afteer !== null && !needsNewlineBefore(afteer.type, tagConf)))) {
                // Before and after are newlines, but befoore does not need newline after and afteer does not need newline before
                // We can delete both newlines
                if (dispatch) dispatch(state.tr.delete(state.selection.from - beforeSize, state.selection.to + afterSize).scrollIntoView());
                return true;
            } else {
                if (dispatch) dispatch(state.tr.deleteSelection().scrollIntoView());
                return true;
            }
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

export function wrapInContainer(tagConf: TagConfiguration, name: string): Command {
    return (state, dispatch) => {
        const sel = state.selection;
        if (!(sel instanceof NodeSelection)) return false;

        // Don't wrap a container inside another container
        if (sel.node.type === WaterproofSchema.nodes.container) return false;

        const before = sel.$from.nodeBefore;
        const beforeIsNewline = before?.type === WaterproofSchema.nodes.newline;

        if (needsNewlineBefore(WaterproofSchema.nodes.container, tagConf) && !beforeIsNewline) return false;

        const blockRange = sel.$from.blockRange(sel.$to);
        if (blockRange === null) return false;

        if (dispatch) {
            const tr = state.tr;
            // Use ReplaceAroundStep directly: for a top-level NodeSelection,
            // blockRange computes range.start = -1 (boundary position math),
            // which causes tr.wrap to include the preceding newline inside the container.
            const containerNode = WaterproofSchema.nodes.container.create({name});
            const slice = new Slice(Fragment.from(containerNode), 0, 0);
            tr.step(new ReplaceAroundStep(sel.from, sel.to, sel.from, sel.to, slice, 1, true));
            tr.setSelection(NodeSelection.create(tr.doc, tr.mapping.map(sel.from)));
            tr.scrollIntoView();
            dispatch(tr);
        }
        return true;
    };
}

function wpWrapIn(nodeType: NodeType, tagConf: TagConfiguration): Command {
    return (state, dispatch) => {
        const sel = state.selection;
        if (!(sel instanceof NodeSelection)) return false;

        const before = sel.$from.nodeBefore;
        const after = sel.$to.nodeAfter;
        const beforeIsNewline = before !== null && before.type === WaterproofSchema.nodes.newline;
        const afterIsNewline  = after  !== null && after.type  === WaterproofSchema.nodes.newline;

        // If the wrapper requires a surrounding newline that is not already present,
        // we insert one rather than rejecting.  This handles the common Lean pattern
        // where markdown directly follows a code block with no intervening NewlineBlock.
        const addNewlineBefore = needsNewlineBefore(nodeType, tagConf) && !beforeIsNewline && before !== null;
        const addNewlineAfter  = needsNewlineAfter(nodeType, tagConf)  && !afterIsNewline  && after  !== null;

        if (dispatch) {
            const tr = state.tr;
            // Use ReplaceAroundStep directly, mirroring wrapInContainer.
            // tr.wrap(blockRange, …) computes a top-level blockRange with start=-1,
            // which causes it to absorb the preceding newline into the wrapper.
            const wrapperNode = nodeType.create();
            const slice = new Slice(Fragment.from(wrapperNode), 0, 0);
            tr.step(new ReplaceAroundStep(sel.from, sel.to, sel.from, sel.to, slice, 1, true));

            // Insert any missing newlines.  After ReplaceAroundStep the wrapper
            // occupies [sel.from, sel.to + 2] (one extra token on each side).
            // Insert the after-newline first (higher position) so that the
            // before-insert position is not shifted.
            if (addNewlineAfter) {
                tr.insert(sel.to + 2, WaterproofSchema.nodes.newline.create());
            }
            if (addNewlineBefore) {
                tr.insert(sel.from, WaterproofSchema.nodes.newline.create());
            }

            // The wrapper node is at sel.from + (1 if we inserted a newline before it).
            tr.setSelection(NodeSelection.create(tr.doc, sel.from + (addNewlineBefore ? 1 : 0)));
            tr.scrollIntoView();
            dispatch(tr);
        }
        return true;
    }
}