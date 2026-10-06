import { Command, EditorState } from "prosemirror-state";
import { Node as PNode } from "prosemirror-model";
import {
  allowedToInsert,
  buildCompositeNodes,
  buildExerciseNodes,
  insertCompositeNodeBelow,
  insertCompositeNodeAbove,
} from "./command-helpers";
import { WaterproofSchema } from "../schema";
import { InsertionPlace } from "./types";
import { TagConfiguration, TemplateConfiguration } from "../api";

/**
 * Creates a command inserting the nodes from `buildNodes` above or below the selected node.
 * The command fails when the schema does not allow these nodes at that place.
 * @param buildNodes Builds the nodes to insert, or returns `undefined` when there is nothing to insert.
 */
function getCmdInsertComposite(
  place: InsertionPlace,
  tagConf: TagConfiguration,
  buildNodes: () => PNode[] | undefined,
): Command {
  const insert =
    place === InsertionPlace.Above
      ? insertCompositeNodeAbove
      : insertCompositeNodeBelow;

  return (state: EditorState, dispatch?): boolean => {
    // Early return when inserting is not allowed.
    if (!allowedToInsert(state)) return false;

    const nodes = buildNodes();
    if (nodes === undefined) return false;

    const trans = insert(state, state.tr, nodes, tagConf);
    if (trans === undefined) return false;

    // If dispatch is given, dispatch the transaction.
    if (dispatch) dispatch(trans);

    // Indicate that this command was successful.
    return true;
  };
}

export function getCmdInsertMarkdown(
  place: InsertionPlace,
  tagConf: TagConfiguration,
): Command {
  return getCmdInsertComposite(place, tagConf, () =>
    buildCompositeNodes(WaterproofSchema.nodes.markdown, undefined, "", ""),
  );
}

export function getCmdInsertLatex(
  place: InsertionPlace,
  tagConf: TagConfiguration,
): Command {
  return getCmdInsertComposite(place, tagConf, () =>
    buildCompositeNodes(WaterproofSchema.nodes.math_display, undefined, "", ""),
  );
}

export function getCmdInsertCode(
  place: InsertionPlace,
  tagConf: TagConfiguration,
): Command {
  return getCmdInsertComposite(place, tagConf, () =>
    buildCompositeNodes(WaterproofSchema.nodes.code, undefined, "", ""),
  );
}

export function getCmdInsertCodeHint(
  place: InsertionPlace,
  tagConf: TagConfiguration,
): Command {
  return getCmdInsertComposite(place, tagConf, () =>
    buildCompositeNodes(
      WaterproofSchema.nodes.code,
      WaterproofSchema.nodes.hint,
      "🛠️ Technical details",
      "",
    ),
  );
}

export function getCmdInsertTextHint(
  place: InsertionPlace,
  tagConf: TagConfiguration,
): Command {
  return getCmdInsertComposite(place, tagConf, () =>
    buildCompositeNodes(
      WaterproofSchema.nodes.markdown,
      WaterproofSchema.nodes.hint,
      "💡 Hint",
      "",
    ),
  );
}

export function getCmdInsertExample(
  place: InsertionPlace,
  tagConf: TagConfiguration,
  templates: TemplateConfiguration,
): Command {
  return getCmdInsertComposite(place, tagConf, () =>
    buildCompositeNodes(
      WaterproofSchema.nodes.code,
      undefined,
      "",
      templates.example,
    ),
  );
}

export function getCmdInsertExercise(
  place: InsertionPlace,
  tagConf: TagConfiguration,
  templates: TemplateConfiguration,
): Command {
  return getCmdInsertComposite(place, tagConf, () =>
    buildExerciseNodes(
      templates.containerOpenTag.length > 0
        ? templates.containerOpenTag
        : undefined,
      templates.exercise.statement,
      templates.exercise.closing,
    ),
  );
}
