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
});
