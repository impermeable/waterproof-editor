import { NodeType, Node as PNode } from "prosemirror-model";
/**
 * Helper function to get all descendants of a node with a given type.
 * @param node The parent node.
 * @param descend Whether to descend into the child nodes.
 * @param type The type of interest.
 * @returns An array containing all the descendant nodes with type `type`, together with their postions in the document.
 */
export declare function findDescendantsWithType(node: PNode, descend: boolean, type: NodeType): {
    node: PNode;
    pos: number;
}[];
//# sourceMappingURL=prosemirror.d.ts.map