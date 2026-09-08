import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  allowedToInsert,
  buildCompositeNodes,
  buildExerciseNodes,
  insertCompositeNodeBelow,
  insertCompositeNodeAbove,
  isInsideHintOrInput,
  isTopLevelSelection,
} from "./command-helpers";
import { WaterproofSchema } from "../schema";
import { InsertionPlace } from "./types";
import { TagConfiguration, TemplateConfiguration } from "../api";

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

    const nodes = buildCompositeNodes(
      WaterproofSchema.nodes.markdown,
      undefined,
      "",
      "",
    );

    const f =
      place === InsertionPlace.Above
        ? insertCompositeNodeAbove
        : insertCompositeNodeBelow;

    const trans = f(state, state.tr, nodes!, tagConf);

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

    const nodes = buildCompositeNodes(
      WaterproofSchema.nodes.math_display,
      undefined,
      "",
      "",
    );

    const f =
      place === InsertionPlace.Above
        ? insertCompositeNodeAbove
        : insertCompositeNodeBelow;
    const trans = f(state, state.tr, nodes!, tagConf);

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

    const nodes = buildCompositeNodes(
      WaterproofSchema.nodes.code,
      undefined,
      "",
      "",
    );

    const f =
      place === InsertionPlace.Above
        ? insertCompositeNodeAbove
        : insertCompositeNodeBelow;
    const trans = f(state, state.tr, nodes!, tagConf);

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
    if (!allowedToInsert(state) || isInsideHintOrInput(state.selection))
      return false;

    const nodes = buildCompositeNodes(
      WaterproofSchema.nodes.code,
      WaterproofSchema.nodes.hint,
      "🛠️ Technical details",
      "",
    );

    const f =
      place === InsertionPlace.Above
        ? insertCompositeNodeAbove
        : insertCompositeNodeBelow;

    const trans = f(state, state.tr, nodes!, tagConf);

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
    if (!allowedToInsert(state) || isInsideHintOrInput(state.selection))
      return false;
    const nodes = buildCompositeNodes(
      WaterproofSchema.nodes.markdown,
      WaterproofSchema.nodes.hint,
      "💡 Hint",
      "",
    );

    const f =
      place === InsertionPlace.Above
        ? insertCompositeNodeAbove
        : insertCompositeNodeBelow;

    const trans = f(state, state.tr, nodes!, tagConf);

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
  templates: TemplateConfiguration,
) {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    // Again, early return when inserting is not allowed.
    if (!allowedToInsert(state)) return false;

    const nodes = buildCompositeNodes(
      WaterproofSchema.nodes.code,
      undefined,
      "",
      templates.example,
    );

    const f =
      place === InsertionPlace.Above
        ? insertCompositeNodeAbove
        : insertCompositeNodeBelow;

    const trans = f(state, state.tr, nodes!, tagConf);

    if (trans === undefined) {
      return false;
    }

    // If dispatch is given and transaction is set, dispatch the transaction.
    if (dispatch && trans) dispatch(trans);

    // Indicate that this command was successful.
    return true;
  };
}

export function getCmdInsertExercise(
  place: InsertionPlace,
  tagConf: TagConfiguration,
  templates: TemplateConfiguration,
) {
  return (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView,
  ): boolean => {
    if (!allowedToInsert(state)) return false;

    const containerName =
      templates.containerOpenTag.length > 0
        ? templates.containerOpenTag
        : undefined;

    const refused =
      containerName !== undefined
        ? !isTopLevelSelection(state.selection)
        : isInsideHintOrInput(state.selection);
    if (refused) return false;

    const nodes = buildExerciseNodes(
      containerName,
      templates.exercise.statement,
      templates.exercise.proof,
    );

    const f =
      place === InsertionPlace.Above
        ? insertCompositeNodeAbove
        : insertCompositeNodeBelow;

    const trans = f(state, state.tr, nodes, tagConf);

    if (trans === undefined) {
      return false;
    }

    // If dispatch is given and transaction is set, dispatch the transaction.
    if (dispatch && trans) dispatch(trans);

    // Indicate that this command was successful.
    return true;
  };
}
