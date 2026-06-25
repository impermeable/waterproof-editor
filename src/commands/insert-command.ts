import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { allowedToInsert, insertAbove, insertBelow } from "./command-helpers";
import { WaterproofSchema } from "../schema";
import { InsertionPlace } from "./types";
import { TagConfiguration } from "../api";

export function getCmdInsertMarkdown(
  place: InsertionPlace,
  tagConf: TagConfiguration,
) {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    // Early return when inserting is not allowed
    if (!allowedToInsert(state)) return false;

    // TODO: Can there be cases where this doesn't work?
    // Can we attempt this command in a case where our state and selection is such that
    // we can't actually add the node there?

    const f = place === InsertionPlace.Above ? insertAbove : insertBelow;

    const trans = f(state, state.tr, WaterproofSchema.nodes.markdown, tagConf);

    if (trans === undefined) {
      return false;
    }

    // If the dispatch is given and transaction is not undefined dispatch it.
    if (dispatch && trans) dispatch(trans);

    // successful command.
    return true;
  };
}

export function getCmdInsertLatex(
  place: InsertionPlace,
  tagConf: TagConfiguration,
) {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    // Early return when inserting is not allowed.
    if (!allowedToInsert(state)) return false;

    const f = place === InsertionPlace.Above ? insertAbove : insertBelow;
    const trans = f(
      state,
      state.tr,
      WaterproofSchema.nodes.math_display,
      tagConf,
    );

    if (trans === undefined) {
      return false;
    }

    // Dispatch the transaction when dispatch is given and transaction is not undefined.
    if (dispatch && trans) dispatch(trans);

    // Indicate successful command.
    return true;
  };
}

export function getCmdInsertCode(
  place: InsertionPlace,
  tagConf: TagConfiguration,
) {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    // Again, early return when inserting is not allowed.
    if (!allowedToInsert(state)) return false;

    const f = place === InsertionPlace.Above ? insertAbove : insertBelow;
    const trans = f(state, state.tr, WaterproofSchema.nodes.code, tagConf);

    if (trans === undefined) {
      return false;
    }

    // If dispatch is given and transaction is set, dispatch the transaction.
    if (dispatch && trans) dispatch(trans);

    // Indicate that this command was successful.
    return true;
  };
}
