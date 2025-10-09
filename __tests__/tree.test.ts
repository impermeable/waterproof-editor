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
            obj.pmRange
        );
        if (obj.children && Array.isArray(obj.children)) {
            obj.children.forEach((childObj: any) => {
                node.addChild(parseNode(childObj));
            });
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
        rootObj.pmRange
    );
    rootObj.children.forEach((childObj: any) => {
        tree.root.addChild(parseNode(childObj));
    });
    return tree;
}

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
    // console.log(JSON.stringify(tree, null, 1));

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

    // expect(tree.findNodeByProsePos(7)?.type).toBe("newline");

    expect(tree.findNodeByProsePos(8)?.type).toBe("newline");

    expect(tree.findNodeByProsePos(6)?.type).toBe("markdown");

    expect(tree.findNodeByProsePos(31)?.type).toBe("input");
});