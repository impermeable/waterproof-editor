import { TreeNode } from "../../src/mapping";

export function sanityCheckTree(node: TreeNode, parent?: TreeNode) {
    // Assumption: All ranges are nested within the parent ranges.
    if (parent) {
        expect(node.contentRange.from).toBeGreaterThanOrEqual(parent.contentRange.from);
        expect(node.contentRange.to).toBeLessThanOrEqual(parent.contentRange.to);
        expect(node.tagRange.from).toBeGreaterThanOrEqual(parent.tagRange.from);
        expect(node.tagRange.to).toBeLessThanOrEqual(parent.tagRange.to);
        expect(node.pmRange.from).toBeGreaterThanOrEqual(parent.pmRange.from);
        expect(node.pmRange.to).toBeLessThanOrEqual(parent.pmRange.to);
    }

    // Assumption: The contentRange is contained in the tagRange
    expect(node.contentRange.from).toBeGreaterThanOrEqual(node.tagRange.from);
    expect(node.contentRange.to).toBeLessThanOrEqual(node.tagRange.to);

    // Assumption: Root node proseMirrorStart starts at pmRange.from; newlines do too, others start one position later.
    const expectedStart = !parent
        ? node.pmRange.from
        : node.type === "newline" ? node.pmRange.from : node.pmRange.from + 1;
    expect(node.prosemirrorStart).toBe(expectedStart);
    // Assumption: For all nodes, prosemirrorEnd is one less than pmRange.to
    expect(node.prosemirrorEnd).toBe(node.pmRange.to - 1);

    if (node.children.length > 0) {
        // Assumption: The tagRange is contiguous (each starts where the previous tag ends)
        node.children.forEach((child, index) => {
            const nextChild = node.children[index + 1];
            // Assumption: Children are ordered from end to start in contentRange.
            if (nextChild) {
                expect(nextChild.tagRange.from).toBe(child.tagRange.to);
            }
            else {
                // Assumption the last child ends exactly where the parent content ends
                expect(child.tagRange.to).toBe(node.contentRange.to);
            }

            if (index === 0) {
                // Assumption: The first child begins exactly where the parent content begins
                expect(child.tagRange.from).toBe(node.contentRange.from);
            }
        });
    }

    node.children.forEach((child) => sanityCheckTree(child, node));
}
