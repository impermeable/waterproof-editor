import { Node, NodeType } from "prosemirror-model";
import { TagConfiguration } from "../api";
import { WaterproofSchema } from "../schema";
import { NodeSelection, Selection, TextSelection } from "prosemirror-state";

export function getSurroundingNodes(sel: Selection): {before: Node | null; after: Node | null} {
    const parentAndIndex = getParentAndIndex(sel);
    if (parentAndIndex === null) return {before: null, after: null};
    const {parent, index} = parentAndIndex;
    return {
        before: parent.maybeChild(index - 1),
        after: parent.maybeChild(index + 1)
    };
}

export function getParentAndIndex(sel: Selection): {parent: Node; index: number} | null {
    if (sel instanceof NodeSelection) {
        const depth = sel.$from.depth;
        return {parent: sel.$from.parent, index: sel.$from.index(depth)};
    } else if (sel instanceof TextSelection) {
        const depth = sel.$from.depth;
        return {parent: sel.$from.node(depth - 1), index: sel.$from.index(depth - 1)};
    }
    // TODO: If the selection is not a node or text selection then it still can be AllSelection, which
    // we will ignore for now.
    return null;
}

export function needsNewlineBefore(nodeType: NodeType, tagConf: TagConfiguration): boolean {
    switch (nodeType) {
        case WaterproofSchema.nodes.code:
            return tagConf.code.openRequiresNewline;
        case WaterproofSchema.nodes.hint:
            return tagConf.hint.openRequiresNewline;
        case WaterproofSchema.nodes.input:
            return tagConf.input.openRequiresNewline;
        case WaterproofSchema.nodes.markdown:
            return tagConf.markdown.openRequiresNewline;
        case WaterproofSchema.nodes.math_display:
            return tagConf.math.openRequiresNewline;
        case WaterproofSchema.nodes.container:
            return tagConf.container.openRequiresNewline;
        default:
            return false;
    }
}

export function needsNewlineAfter(nodeType: NodeType, tagConf: TagConfiguration): boolean {
    switch (nodeType) {
        case WaterproofSchema.nodes.code:
            return tagConf.code.closeRequiresNewline;
        case WaterproofSchema.nodes.hint:
            return tagConf.hint.closeRequiresNewline;
        case WaterproofSchema.nodes.input:
            return tagConf.input.closeRequiresNewline;
        case WaterproofSchema.nodes.markdown:
            return tagConf.markdown.closeRequiresNewline;
        case WaterproofSchema.nodes.math_display:
            return tagConf.math.closeRequiresNewline;
        case WaterproofSchema.nodes.container:
            return tagConf.container.closeRequiresNewline;
        default:
            return false;
    }
}

export function openingTagEndsWithNewline(nodeType: NodeType, tagConf: TagConfiguration): boolean {
    switch (nodeType) {
        case WaterproofSchema.nodes.code:
            return tagConf.code.openTag.endsWith("\n")
        case WaterproofSchema.nodes.hint:
            return tagConf.hint.openTag("").endsWith("\n")
        case WaterproofSchema.nodes.input:
            return tagConf.input.openTag.endsWith("\n")
        case WaterproofSchema.nodes.markdown:
            return tagConf.markdown.openTag.endsWith("\n")
        case WaterproofSchema.nodes.math_display:
            return tagConf.math.openTag.endsWith("\n")
        case WaterproofSchema.nodes.container:
            return tagConf.container.openTag("").endsWith("\n")
        default:
            return false;
    }
}

export function closingTagStartsWithNewline(nodeType: NodeType, tagConf: TagConfiguration): boolean {
    switch (nodeType) {
        case WaterproofSchema.nodes.code:
            return tagConf.code.closeTag.startsWith("\n")
        case WaterproofSchema.nodes.hint:
            return tagConf.hint.closeTag.startsWith("\n")
        case WaterproofSchema.nodes.input:
            return tagConf.input.closeTag.startsWith("\n")
        case WaterproofSchema.nodes.markdown:
            return tagConf.markdown.closeTag.startsWith("\n")
        case WaterproofSchema.nodes.math_display:
            return tagConf.math.closeTag.startsWith("\n")
        case WaterproofSchema.nodes.container:
            return tagConf.container.closeTag("").startsWith("\n")
        default:
            return false;
    }
}
