import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  allowedToInsert,
  insertCompositeNodeBelow,
  insertCompositeNodeAbove,
} from "./command-helpers";
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

    const f =
      place === InsertionPlace.Above
        ? insertCompositeNodeAbove
        : insertCompositeNodeBelow;

    const trans = f(
      state,
      state.tr,
      WaterproofSchema.nodes.markdown,
      undefined,
      tagConf,
    );

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

    const f =
      place === InsertionPlace.Above
        ? insertCompositeNodeAbove
        : insertCompositeNodeBelow;
    const trans = f(
      state,
      state.tr,
      WaterproofSchema.nodes.math_display,
      undefined,
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

    const f =
      place === InsertionPlace.Above
        ? insertCompositeNodeAbove
        : insertCompositeNodeBelow;
    const trans = f(
      state,
      state.tr,
      WaterproofSchema.nodes.code,
      undefined,
      tagConf,
    );

    if (trans === undefined) {
      return false;
    }

    // If dispatch is given and transaction is set, dispatch the transaction.
    if (dispatch && trans) dispatch(trans);

    // Indicate that this command was successful.
    return true;
  };
}

export function getCmdInsertCodeHint(
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

    const f =
      place === InsertionPlace.Above
        ? insertCompositeNodeAbove
        : insertCompositeNodeBelow;

    const wrapper = WaterproofSchema.nodes.hint;
    const trans = f(
      state,
      state.tr,
      WaterproofSchema.nodes.code,
      wrapper,
      tagConf,
      "🛠️ Technical details",
    );

    if (trans === undefined) {
      return false;
    }

    // If dispatch is given and transaction is set, dispatch the transaction.
    if (dispatch && trans) dispatch(trans);

    // Indicate that this command was successful.
    return true;
  };
}

export function getCmdInsertTextHint(
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

    const f =
      place === InsertionPlace.Above
        ? insertCompositeNodeAbove
        : insertCompositeNodeBelow;

    const wrapper = WaterproofSchema.nodes.hint;
    const trans = f(
      state,
      state.tr,
      WaterproofSchema.nodes.markdown,
      wrapper,
      tagConf,
    );

    if (trans === undefined) {
      return false;
    }

    // If dispatch is given and transaction is set, dispatch the transaction.
    if (dispatch && trans) dispatch(trans);

    // Indicate that this command was successful.
    return true;
  };
}

export function getCmdInsertExample(
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

    const f =
      place === InsertionPlace.Above
        ? insertCompositeNodeAbove
        : insertCompositeNodeBelow;
    let content: string;
    if (tagConf.code.openTag === `\`\`\`coq\n`) {
      content = "Example example: True.\nProof.\n\nQed.";
    } else if (tagConf.code.openTag === `\`\`\`lean\n`) {
      content =
        'Example "example"\nGiven:\nAssume:\nConclusion:\nProof:\n\nQED';
    } else {
      return false; // No other language is currently supported besides rocq and lean.
    }

    const trans = f(
      state,
      state.tr,
      WaterproofSchema.nodes.code,
      undefined,
      tagConf,
      undefined,
      content,
    );

    if (trans === undefined) {
      return false;
    }

    // If dispatch is given and transaction is set, dispatch the transaction.
    if (dispatch && trans) dispatch(trans);

    // Indicate that this command was successful.
    return true;
  };
}
