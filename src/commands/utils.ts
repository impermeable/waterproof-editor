import { ResolvedPos, Node, NodeType } from "prosemirror-model";
import { TagConfiguration } from "../api";
import { WaterproofSchema } from "../schema";

export function getSurroundingNodes($pos: ResolvedPos): {before: Node | null; after: Node | null} {
    const depth = $pos.depth;
    let parent;
    let index; 
    if (depth === 0) {
        parent = $pos.parent;
        index = $pos.index(0);
    } else {
        parent = $pos.node(1);
        index = $pos.index(1);
    }    
    const before = index > 0 ? parent.child(index - 1) : null;
    const after = index < parent.childCount - 1 ? parent.child(index + 1) : null;
    return {before, after};
}

export function getParentAndIndex($pos: ResolvedPos): {parent: Node; index: number} {
    const depth = $pos.depth;
    let parent;
    let index;
    if (depth === 0) {
        parent = $pos.parent;
        index = $pos.index(0);
    }
    else {
        parent = $pos.node(1);
        index = $pos.index(1);
    }
    return {parent, index};
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
        default:
            return false;
    }
}