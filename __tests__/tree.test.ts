/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tree, TreeNode } from "../src/mapping";

function fromJSON(json: any): Tree {
    const parseNode = (obj: any): TreeNode => {
        const node = new TreeNode(
            obj.type,
            obj.innerRange,
            obj.range,
            obj.title,
            obj.prosemirrorStart,
            obj.prosemirrorEnd,
            obj.pmRange,
            obj.lineStart
        );
        if (obj.children && Array.isArray(obj.children)) {
            for (const childObj of obj.children) {
                node.addChild(parseNode(childObj));
            }
        }
        return node;
    }
    const rootObj = json.root;
    const tree = new Tree(
        rootObj.type,
        rootObj.innerRange,
        rootObj.range,
        rootObj.title,
        rootObj.prosemirrorStart,
        rootObj.prosemirrorEnd,
        rootObj.pmRange,
        rootObj.lineStart
    );
    for (const childObj of rootObj.children) {
        tree.root.addChild(parseNode(childObj));
    }
    return tree;
}

// TODO: Update the trees, add where the tree came from and test line number logic.
const treeJSON = {
    "root": {
        "type": "",
        "innerRange": {
            "from": 0,
            "to": 70
        },
        "range": {
            "from": 0,
            "to": 70
        },
        "title": "",
        "prosemirrorStart": 0,
        "prosemirrorEnd": 54,
        "pmRange": {
            "from": 0,
            "to": 55
        },
        "children": [
            {
                "type": "markdown",
                "innerRange": {
                    "from": 0,
                    "to": 4
                },
                "range": {
                    "from": 0,
                    "to": 4
                },
                "title": "",
                "prosemirrorStart": 1,
                "prosemirrorEnd": 5,
                "pmRange": {
                    "from": 0,
                    "to": 6
                },
                "children": []
            },
            {
                "type": "newline",
                "innerRange": {
                    "from": 4,
                    "to": 5
                },
                "range": {
                    "from": 4,
                    "to": 5
                },
                "title": "",
                "prosemirrorStart": 6,
                "prosemirrorEnd": 6,
                "pmRange": {
                    "from": 6,
                    "to": 7
                },
                "children": []
            },
            {
                "type": "code",
                "innerRange": {
                    "from": 12,
                    "to": 31
                },
                "range": {
                    "from": 5,
                    "to": 35
                },
                "title": "",
                "prosemirrorStart": 8,
                "prosemirrorEnd": 27,
                "pmRange": {
                    "from": 7,
                    "to": 28
                },
                "children": []
            },
            {
                "type": "newline",
                "innerRange": {
                    "from": 35,
                    "to": 36
                },
                "range": {
                    "from": 35,
                    "to": 36
                },
                "title": "",
                "prosemirrorStart": 28,
                "prosemirrorEnd": 28,
                "pmRange": {
                    "from": 28,
                    "to": 29
                },
                "children": []
            },
            {
                "type": "code",
                "innerRange": {
                    "from": 43,
                    "to": 66
                },
                "range": {
                    "from": 36,
                    "to": 70
                },
                "title": "",
                "prosemirrorStart": 30,
                "prosemirrorEnd": 53,
                "pmRange": {
                    "from": 29,
                    "to": 54
                },
                "children": []
            }
        ]
    }
};

test("treeFromJSON", () => {
    const tree = fromJSON(treeJSON);

    expect(tree.root.children.length).toBe(5);
    expect(tree.root.children[0].type).toBe("markdown");
    expect(tree.root.children[1].type).toBe("newline");
    expect(tree.root.children[2].type).toBe("code");
    expect(tree.root.children[3].type).toBe("newline");
    expect(tree.root.children[4].type).toBe("code");
});

test("findByProsemirrorPosition", () => {
    const tree = fromJSON(treeJSON);
    // Position clearly within the first markdown node
    const node1 = tree.findNodeByProsePos(4);
    expect(node1).not.toBeNull();
    expect(node1?.type).toBe("markdown");

    // This is on the boundary
    const node2 = tree.findNodeByProsePos(6);
    expect(node2).not.toBeNull();
    expect(node2?.type).toBe("markdown");

    const node3 = tree.findNodeByProsePos(28);
    expect(node3).not.toBeNull();
    expect(node3?.type).toBe("code");

    const node4 = tree.findNodeByProsePos(29);
    expect(node4).not.toBeNull();
    expect(node4?.type).toBe("newline");
});

const secondTreeJSON = {
    "root": {
        "type": "",
        "innerRange": {
            "from": 0,
            "to": 61
        },
        "range": {
            "from": 0,
            "to": 61
        },
        "title": "",
        "prosemirrorStart": 0,
        "prosemirrorEnd": 31,
        "pmRange": {
            "from": 0,
            "to": 32
        },
        "children": [
            {
                "type": "markdown",
                "innerRange": {
                    "from": 0,
                    "to": 4
                },
                "range": {
                    "from": 0,
                    "to": 4
                },
                "title": "",
                "prosemirrorStart": 1,
                "prosemirrorEnd": 5,
                "pmRange": {
                    "from": 0,
                    "to": 6
                },
                "children": []
            },
            {
                "type": "input",
                "innerRange": {
                    "from": 16,
                    "to": 48
                },
                "range": {
                    "from": 4,
                    "to": 61
                },
                "title": "",
                "prosemirrorStart": 7,
                "prosemirrorEnd": 30,
                "pmRange": {
                    "from": 6,
                    "to": 31
                },
                "children": [
                    {
                        "type": "newline",
                        "innerRange": {
                            "from": 16,
                            "to": 17
                        },
                        "range": {
                            "from": 16,
                            "to": 17
                        },
                        "title": "",
                        "prosemirrorStart": 7,
                        "prosemirrorEnd": 7,
                        "pmRange": {
                            "from": 7,
                            "to": 8
                        },
                        "children": []
                    },
                    {
                        "type": "code",
                        "innerRange": {
                            "from": 24,
                            "to": 43
                        },
                        "range": {
                            "from": 17,
                            "to": 47
                        },
                        "title": "",
                        "prosemirrorStart": 9,
                        "prosemirrorEnd": 28,
                        "pmRange": {
                            "from": 8,
                            "to": 29
                        },
                        "children": []
                    },
                    {
                        "type": "newline",
                        "innerRange": {
                            "from": 47,
                            "to": 48
                        },
                        "range": {
                            "from": 47,
                            "to": 48
                        },
                        "title": "",
                        "prosemirrorStart": 29,
                        "prosemirrorEnd": 29,
                        "pmRange": {
                            "from": 29,
                            "to": 30
                        },
                        "children": []
                    }
                ]
            }
        ]
    }
};

test("findByProsemirrorPosition with nested nodes", () => {
    const tree = fromJSON(secondTreeJSON);
    
    const node1 = tree.findNodeByProsePos(7);
    expect(node1).not.toBeNull();
    expect(node1?.type).toBe("newline");

    expect(tree.findNodeByProsePos(8)?.type).toBe("newline");

    expect(tree.findNodeByProsePos(6)?.type).toBe("markdown");

    expect(tree.findNodeByProsePos(31)?.type).toBe("input");
});

test("removeChild removes child and preserves order", () => {
    const tree = fromJSON(treeJSON);
    expect(tree.root.children.length).toBe(5);

    const secondNewline = tree.root.children[3];
    tree.root.removeChild(secondNewline);
    expect(tree.root.children.length).toBe(4);
    expect(tree.root.children.map(c => c.type)).toEqual(["markdown", "newline", "code", "code"]);
});

test("shiftCloseOffsets shifts end positions", () => {
    const tree = fromJSON(treeJSON);
    const code = tree.root.children[2]; // first code node
    const origEnd = code.prosemirrorEnd;
    const origPmTo = code.pmRange.to;
    const origContentTo = code.contentRange.to;
    const origTagTo = code.tagRange.to;

    code.shiftCloseOffsets(5, 3);

    expect(code.prosemirrorEnd).toBe(origEnd + 3);
    expect(code.pmRange.to).toBe(origPmTo + 3);
    expect(code.contentRange.to).toBe(origContentTo + 5);
    expect(code.tagRange.to).toBe(origTagTo + 5);
});

test("shiftCloseOffsets without prosemirror offset uses text offset", () => {
    const tree = fromJSON(treeJSON);
    const code = tree.root.children[2];
    const origEnd = code.prosemirrorEnd;
    const origPmTo = code.pmRange.to;

    code.shiftCloseOffsets(7);

    expect(code.prosemirrorEnd).toBe(origEnd + 7);
    expect(code.pmRange.to).toBe(origPmTo + 7);
});

test("shiftOffsets shifts all positions", () => {
    const tree = fromJSON(treeJSON);
    const code = tree.root.children[2];
    const origStart = code.prosemirrorStart;
    const origEnd = code.prosemirrorEnd;
    const origPmFrom = code.pmRange.from;
    const origPmTo = code.pmRange.to;
    const origContentFrom = code.contentRange.from;
    const origContentTo = code.contentRange.to;
    const origTagFrom = code.tagRange.from;
    const origTagTo = code.tagRange.to;

    code.shiftOffsets(4, 2);

    expect(code.prosemirrorStart).toBe(origStart + 2);
    expect(code.prosemirrorEnd).toBe(origEnd + 2);
    expect(code.pmRange.from).toBe(origPmFrom + 2);
    expect(code.pmRange.to).toBe(origPmTo + 2);
    expect(code.contentRange.from).toBe(origContentFrom + 4);
    expect(code.contentRange.to).toBe(origContentTo + 4);
    expect(code.tagRange.from).toBe(origTagFrom + 4);
    expect(code.tagRange.to).toBe(origTagTo + 4);
});

test("shiftLineStart shifts lineStart", () => {
    const tree = fromJSON(treeJSON);
    const code = tree.root.children[2];
    const origLineStart = code.lineStart;

    code.shiftLineStart(3);

    expect(code.lineStart).toBe(origLineStart + 3);
});

test("traverseDepthFirst visits all nodes depth-first", () => {
    const tree = fromJSON(secondTreeJSON);
    const visited: string[] = [];
    tree.traverseDepthFirst(node => visited.push(node.type));

    // root ("") -> markdown -> input -> newline -> code -> newline
    expect(visited).toEqual(["", "markdown", "input", "newline", "code", "newline"]);
});

test("findParent returns parent of node", () => {
    const tree = fromJSON(secondTreeJSON);
    const inputNode = tree.root.children[1]; // input node
    const codeInsideInput = inputNode.children[1]; // code inside input

    expect(tree.findParent(inputNode)).toBe(tree.root);
    expect(tree.findParent(codeInsideInput)).toBe(inputNode);
    expect(tree.findParent(tree.root)).toBeNull();
});

test("findNodeByOriginalPosition finds deepest node at position", () => {
    const tree = fromJSON(treeJSON);

    // Position 2 is within the first markdown (contentRange 0-4)
    const node = tree.findNodeByOriginalPosition(2);
    expect(node).not.toBeNull();
    expect(node?.type).toBe("markdown");

    // Position 20 is within the first code (contentRange 12-31)
    const node2 = tree.findNodeByOriginalPosition(20);
    expect(node2).not.toBeNull();
    expect(node2?.type).toBe("code");

    // Position 50 is within the second code (contentRange 43-66)
    const node3 = tree.findNodeByOriginalPosition(50);
    expect(node3).not.toBeNull();
    expect(node3?.type).toBe("code");
});

test("findNodeByOriginalPosition finds nested node", () => {
    const tree = fromJSON(secondTreeJSON);

    // Position 30 is inside code within input (code contentRange 24-43)
    const node = tree.findNodeByOriginalPosition(30);
    expect(node).not.toBeNull();
    expect(node?.type).toBe("code");
});

test("nodesInProseRange returns nodes within range", () => {
    const tree = fromJSON(treeJSON);

    // Range covering the whole document (pmRange 0-55) should include all children
    const allNodes = tree.nodesInProseRange(0, 55);
    const allTypes = allNodes.map(n => n.type);
    expect(allTypes).toContain("markdown");
    expect(allTypes).toContain("newline");
    expect(allTypes).toContain("code");

    // Range covering only the first markdown node (pmRange 0-6)
    const markdownOnly = tree.nodesInProseRange(0, 6);
    expect(markdownOnly.map(n => n.type)).toEqual(["markdown"]);
});

test("nodesInProseRange returns empty for out-of-range", () => {
    const tree = fromJSON(treeJSON);
    const nodes = tree.nodesInProseRange(100, 200);
    expect(nodes).toEqual([]);
});

test("computeLineNumbers collects lineStart for code nodes", () => {
    const tree = fromJSON(treeJSON);
    // The tree has two code nodes
    const lineNumbers = tree.computeLineNumbers();
    expect(lineNumbers.length).toBe(2);
    expect(lineNumbers[0]).toBe(tree.root.children[2].lineStart);
    expect(lineNumbers[1]).toBe(tree.root.children[4].lineStart);
});

// ===================== nodesInProseRange — new bug #4 regression =====================

test("nodesInProseRange returns only top-level nodes in range, not their children too (new bug #4)", () => {
    // Tree structure:
    //   root           pmRange {0, 20}
    //     container    pmRange {0, 10}
    //       child1     pmRange {1,  5}
    //       child2     pmRange {5,  9}
    //     sibling      pmRange {10, 20}
    //
    // Query nodesInProseRange(0, 10): the container is fully in [0,10],
    // and so are child1 and child2 (they are descendants of container).
    //
    // With the bug: [container, child1, child2] are all returned because the
    // recursion pushes the container and then recurses into its children, which
    // are also fully contained.
    //
    // With the fix: only [container] is returned — the children travel with
    // their parent; callers must not double-process them.
    const tree = new Tree(
        "", {from: 0, to: 20}, {from: 0, to: 20}, "", 0, 19, {from: 0, to: 20}, 0
    );
    const container = new TreeNode(
        "container", {from: 1, to: 9}, {from: 0, to: 10}, "", 1, 9, {from: 0, to: 10}, 0
    );
    const child1 = new TreeNode(
        "markdown", {from: 2, to: 4}, {from: 1, to: 5}, "", 2, 4, {from: 1, to: 5}, 0
    );
    const child2 = new TreeNode(
        "markdown", {from: 6, to: 8}, {from: 5, to: 9}, "", 6, 8, {from: 5, to: 9}, 0
    );
    container.addChild(child1);
    container.addChild(child2);

    const sibling = new TreeNode(
        "markdown", {from: 11, to: 19}, {from: 10, to: 20}, "", 11, 19, {from: 10, to: 20}, 0
    );
    tree.root.addChild(container);
    tree.root.addChild(sibling);

    const result = tree.nodesInProseRange(0, 10);

    // Only the container should be in the result — not child1 and child2.
    // If the bug is present, result.length would be 3.
    expect(result.length).toBe(1);
    expect(result[0]).toBe(container);
});