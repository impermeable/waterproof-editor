import { Node, NodeType } from "prosemirror-model";
import { TagConfiguration } from "../api";
import { WaterproofSchema } from "../schema";
import { NodeSelection, Selection, TextSelection } from "prosemirror-state";

export function getSurroundingNodes(sel: Selection): {
  before: Node | null;
  after: Node | null;
} {
  const parentAndIndex = getParentAndIndex(sel);
  if (parentAndIndex === null) return { before: null, after: null };
  const { parent, index } = parentAndIndex;
  return {
    before: parent.maybeChild(index - 1),
    after: parent.maybeChild(index + 1),
  };
}

export function getParentAndIndex(
  sel: Selection,
): { parent: Node; index: number } | null {
  if (sel instanceof NodeSelection) {
    const depth = sel.$from.depth;
    return { parent: sel.$from.parent, index: sel.$from.index(depth) };
  } else if (sel instanceof TextSelection) {
    const depth = sel.$from.depth;
    return {
      parent: sel.$from.node(depth - 1),
      index: sel.$from.index(depth - 1),
    };
  }
  // TODO: If the selection is not a node or text selection then it still can be AllSelection, which
  // we will ignore for now.
  return null;
}

function tagConfForNodeType(nodeType: NodeType, tagConf: TagConfiguration) {
  if (nodeType === WaterproofSchema.nodes.code) return tagConf.code;
  if (nodeType === WaterproofSchema.nodes.hint) return tagConf.hint;
  if (nodeType === WaterproofSchema.nodes.input) return tagConf.input;
  if (nodeType === WaterproofSchema.nodes.markdown) return tagConf.markdown;
  if (nodeType === WaterproofSchema.nodes.math_display) return tagConf.math;
  if (nodeType === WaterproofSchema.nodes.container) return tagConf.container;
  return null;
}

export function needsNewlineBefore(
  nodeType: NodeType,
  tagConf: TagConfiguration,
): boolean {
  return tagConfForNodeType(nodeType, tagConf)?.openRequiresNewline ?? false;
}

export function needsNewlineAfter(
  nodeType: NodeType,
  tagConf: TagConfiguration,
): boolean {
  return tagConfForNodeType(nodeType, tagConf)?.closeRequiresNewline ?? false;
}

export function openingTagEndsWithNewline(
  nodeType: NodeType,
  tagConf: TagConfiguration,
): boolean {
  const entry = tagConfForNodeType(nodeType, tagConf);
  if (!entry) return false;
  const openTag =
    typeof entry.openTag === "function" ? entry.openTag("") : entry.openTag;
  return openTag.endsWith("\n");
}

export function closingTagStartsWithNewline(
  nodeType: NodeType,
  tagConf: TagConfiguration,
): boolean {
  return (
    tagConfForNodeType(nodeType, tagConf)?.closeTag.startsWith("\n") ?? false
  );
}
