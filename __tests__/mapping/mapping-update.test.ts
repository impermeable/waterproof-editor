import { Fragment, Slice } from "prosemirror-model";
import { ReplaceStep } from "prosemirror-transform";
import { DocChange } from "../../src/api";
import { Block } from "../../src/document";
import { Mapping, TreeNode } from "../../src/mapping";
import { configuration, parse } from "../../src/markdown-defaults";
import { WaterproofSchema } from "../../src/schema";
import { DefaultTagSerializer } from "../../src/serialization/DocumentSerializer";
import { sanityCheckTree } from "./util";
import { Node as ProseNode } from "prosemirror-model";

const config = configuration("coq");
const serializer = new DefaultTagSerializer(config);

function root(childNodes: ProseNode[]) {
    return WaterproofSchema.nodes.doc.create({}, childNodes);
}

function constructDocument(blocks: Block[]): ProseNode {
    return root(blocks.map(block => block.toProseMirror()));
}

function findFirstCodeNode(root: TreeNode): TreeNode | null {
    let found: TreeNode | null = null;
    root.traverseDepthFirst((node: TreeNode) => {
        if (found || node.type !== "code") return;
        found = node;
    });
    return found;
}

test("Mapping.update text insert inside input shifts wrapper and later blocks", () => {
    // Assumption: parsing an input-area followed by plain text yields an input block and a markdown block.
    // Assumption: inserting text within a nested code block should expand the wrapper ranges and shift later blocks.
    const doc = "<input-area>\n```coq\nTest\n```\n</input-area>\nAfter";

    const blocks = parse(doc, {language: "coq"});
    const mapping = new Mapping(blocks, 0, config, serializer);
    const proseDoc = constructDocument(blocks);

    const tree = mapping.getMapping();
    const inputNode = tree.root.children.find(node => node.type === "input");
    const afterNode = tree.root.children.filter(node => node.type === "markdown").at(-1);
    if (!inputNode || !afterNode) throw new Error("Test setup failed: missing input or markdown node");

    const inputTagEnd = inputNode.tagRange.to;
    const inputContentEnd = inputNode.contentRange.to;
    const afterContentStart = afterNode.contentRange.from;
    const afterTagStart = afterNode.tagRange.from;

    const codeNode = findFirstCodeNode(inputNode);
    if (!codeNode) throw new Error("Test setup failed: missing code node");

    // Insert inside the code content (avoid boundary position).
    const insertPos = codeNode.prosemirrorStart + 1;
    const slice = new Slice(Fragment.from(WaterproofSchema.text("X")), 0, 0);
    const step = new ReplaceStep(insertPos, insertPos, slice);

    const beforeVersion = mapping.version;
    const result = mapping.update(step, proseDoc);

    expect(mapping.version).toBe(beforeVersion + 1);
    expect(result).toStrictEqual<DocChange>({
        finalText: "X",
        startInFile: codeNode.contentRange.from + 1,
        endInFile: codeNode.contentRange.from + 1
    });

    const updatedTree = mapping.getMapping();
    sanityCheckTree(updatedTree.root);

    const updatedInput = updatedTree.root.children.find(node => node.type === "input");
    const updatedAfter = updatedTree.root.children.filter(node => node.type === "markdown").at(-1);
    if (!updatedInput || !updatedAfter) throw new Error("Test setup failed: missing updated nodes");

    expect(updatedInput.tagRange.to).toBe(inputTagEnd + 1);
    expect(updatedInput.contentRange.to).toBe(inputContentEnd + 1);
    expect(updatedAfter.contentRange.from).toBe(afterContentStart + 1);
    expect(updatedAfter.tagRange.from).toBe(afterTagStart + 1);

    // Inserting "X" (no newlines) should preserve the code block's lineStart
    // The parser sets the code block lineStart to 2 for this document structure
    const updatedCode = findFirstCodeNode(updatedTree.root);
    expect(updatedCode).not.toBeNull();
    expect(updatedCode!.lineStart).toBe(2);
    expect(updatedTree.computeLineNumbers()).toStrictEqual([2]);
});

test("Mapping.update node insert shifts lineStart of subsequent code blocks", () => {
    // Document: ```coq\nFirst\n```\n```coq\nSecond\n```
    // Two code blocks: first at line 1, second at line 4
    const doc = "```coq\nFirst\n```\n```coq\nSecond\n```";

    const blocks = parse(doc, {language: "coq"});
    const mapping = new Mapping(blocks, 0, config, serializer);
    const proseDoc = constructDocument(blocks);

    const tree = mapping.getMapping();
    const codeNodes = tree.root.children.filter(node => node.type === "code");
    expect(codeNodes.length).toBe(2);
    const firstLineStart = codeNodes[0].lineStart;
    const secondLineStart = codeNodes[1].lineStart;
    expect(firstLineStart).toBe(1);
    expect(secondLineStart).toBe(4);

    // Insert a new code block before the first code block (at position 0)
    const slice = new Slice(Fragment.from([
        WaterproofSchema.nodes.code.create(null, Fragment.from(WaterproofSchema.text("New"))),
        WaterproofSchema.nodes.newline.create()
    ]), 0, 0);
    const step = new ReplaceStep(0, 0, slice);

    mapping.update(step, proseDoc);

    const updatedTree = mapping.getMapping();
    sanityCheckTree(updatedTree.root);

    const updatedCodeNodes: TreeNode[] = [];
    updatedTree.traverseDepthFirst(node => {
        if (node.type === "code") updatedCodeNodes.push(node);
    });

    expect(updatedCodeNodes.length).toBe(3);

    // The newly inserted code block should have a computed lineStart
    // ```coq\nNew\n``` starts at the beginning, so lineStart = 1
    expect(updatedCodeNodes[0].lineStart).toBe(1);

    // The original first code block should now be shifted by the newlines in the inserted content
    // Inserted text: "```coq\nNew\n```\n" = 3 newlines, so original first shifts from 1 to 1+3 = 4
    expect(updatedCodeNodes[1].lineStart).toBe(firstLineStart + 3);

    // The original second code block should also shift by the same amount
    expect(updatedCodeNodes[2].lineStart).toBe(secondLineStart + 3);

    expect(updatedTree.computeLineNumbers()).toStrictEqual([1, 4, 7]);
});

test("Mapping.update node insert in the middle shifts lineStart of later code blocks", () => {
    // Document: ```coq\nFirst\n```\n```coq\nSecond\n```
    // Two code blocks: first at line 1, second at line 4
    const doc = "```coq\nFirst\n```\n```coq\nSecond\n```";

    const blocks = parse(doc, {language: "coq"});
    const mapping = new Mapping(blocks, 0, config, serializer);
    const proseDoc = constructDocument(blocks);

    const tree = mapping.getMapping();
    const codeNodes = tree.root.children.filter(node => node.type === "code");
    expect(codeNodes.length).toBe(2);
    expect(codeNodes[0].lineStart).toBe(1);
    expect(codeNodes[1].lineStart).toBe(4);

    // Insert a new code block between the two existing ones
    // The newline between them is at pmRange {7, 8}, so inserting at position 8
    // places the new node right before the second code block
    const slice = new Slice(Fragment.from([
        WaterproofSchema.nodes.code.create(null, Fragment.from(WaterproofSchema.text("Middle"))),
        WaterproofSchema.nodes.newline.create()
    ]), 0, 0);
    const step = new ReplaceStep(8, 8, slice);

    mapping.update(step, proseDoc);

    const updatedTree = mapping.getMapping();
    sanityCheckTree(updatedTree.root);

    const updatedCodeNodes: TreeNode[] = [];
    updatedTree.traverseDepthFirst(node => {
        if (node.type === "code") updatedCodeNodes.push(node);
    });

    expect(updatedCodeNodes.length).toBe(3);

    // First code block is unchanged
    expect(updatedCodeNodes[0].lineStart).toBe(1);

    // Inserted code block: after "```coq\nFirst\n```\n" (3 newlines), so lineStart = 4
    // The open tag ```coq\n adds 1 more, content starts at line 5
    expect(updatedCodeNodes[1].lineStart).toBe(4);

    // Second code block shifted by 3 newlines (```coq\nMiddle\n```\n)
    expect(updatedCodeNodes[2].lineStart).toBe(4 + 3);

    expect(updatedTree.computeLineNumbers()).toStrictEqual([1, 4, 7]);
});
