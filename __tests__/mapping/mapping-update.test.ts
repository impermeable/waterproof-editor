import { Fragment, Slice } from "prosemirror-model";
import { ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";
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

// Character deletions inside a code/markdown/math_display block must still be
// classified as text edits and routed to textUpdate, not to replaceDelete.
test("Regression: character deletion inside a code block is classified as a text edit", () => {
    // Document: one code block containing "abc"
    // ProseMirror layout: 0[code 1"a"2"b"3"c"4]5
    // Deleting "bc" = step.from=3, step.to=5 (empty slice, content is partially within the node)
    const docString = "```coq\nabc\n```";

    const blocks = parse(docString, {language: "coq"});
    const mapping = new Mapping(blocks, 0, config, serializer);
    const proseDoc = constructDocument(blocks);

    const tree = mapping.getMapping();
    const codeNode = tree.root.children.find(n => n.type === "code");
    if (!codeNode) throw new Error("Test setup: code node not found");

    // Delete "bc": step covers [3, 5), which is strictly inside the code node.
    // replaceDelete would find no whole nodes in this range and throw NodeUpdateError.
    // textUpdate correctly removes the two characters from the file.
    const step = new ReplaceStep(
        3, // 3 — one char into content, so this is a partial deletion
        5,        // 5 — end of content
        new Slice(Fragment.empty, 0, 0)
    );

    let result: DocChange | undefined;
    expect(() => {
        result = mapping.update(step, proseDoc) as DocChange;
    }).not.toThrow();

    // The file edit should remove "bc" (2 chars) from the code content.
    expect(result).toStrictEqual<DocChange>({
        finalText: "",
        startInFile: 9,
        endInFile: 11,
    });

    sanityCheckTree(mapping.getMapping().root);
});

// Regression: wpLift on an input node with surrounding newlines produces a 3-step transaction:
//   Step 1 — ReplaceAroundStep that lifts the input's content to the parent level
//   Step 2 — ReplaceStep that deletes the leading duplicate newline (now at step1.from)
//   Step 3 — ReplaceStep that deletes the trailing duplicate newline
//
// The bug: step 3's `from` position equals code2.prosemirrorEnd in the pre-transaction doc.
// mapping.update() used to resolve that position against the *pre-transaction* doc, find it inside
// a code node, and classifies the step as a text edit.  The cache then misses and
// tree.findNodeByProsePos() returns the newline node at that boundary, which is not
// text-editable → TextUpdateError is thrown.
test("Regression: wpLift newline-deduplication steps are not misclassified as text edits", () => {
    // Document: code("abc") | newline | input([ newline | code("def") | newline ]) | newline | code("ghi")
    // In coq format:
    //   ```coq\nabc\n```\n<input-area>\n```coq\ndef\n```\n</input-area>\n```coq\nghi\n```
    //
    // ProseMirror layout (pre-transaction):
    //   0[code1 1"abc"4]5  5(nl1)  6[input 7(nl_a) 8[code2 9"def"12]13 13(nl_b) 14]15  15(nl2)  16[code3 17"ghi"20]21
    const docString = "```coq\nabc\n```\n<input-area>\n```coq\ndef\n```\n</input-area>\n```coq\nghi\n```";

    const blocks = parse(docString, {language: "coq"});
    const mapping = new Mapping(blocks, 0, config, serializer);
    const proseDoc = constructDocument(blocks);

    const tree = mapping.getMapping();
    const inputNode = tree.root.children.find(n => n.type === "input");
    if (!inputNode) throw new Error("Test setup: input node not found");

    // Verify the expected pre-transaction positions so the test is self-checking.
    expect(inputNode.pmRange).toEqual({ from: 6, to: 15 });
    expect(inputNode.prosemirrorStart).toBe(7);
    expect(inputNode.prosemirrorEnd).toBe(14);

    // Step 1: lift — removes the input wrapper, promoting its three children (nl_a, code2, nl_b).
    const step1 = new ReplaceAroundStep(
        inputNode.pmRange.from,      // 6
        inputNode.pmRange.to,        // 15
        inputNode.prosemirrorStart,  // 7  (gapFrom: first inner content position)
        inputNode.prosemirrorEnd,    // 14 (gapTo:  last  inner content position)
        new Slice(Fragment.empty, 0, 0),
        0
    );

    // After step 1, nl_a lands at inputNode.pmRange.from (= 6).
    // Step 2: delete nl_a (leading duplicate: nl1 before input + nl_a as first child).
    const step2from = inputNode.pmRange.from; // 6
    const step2 = new ReplaceStep(step2from, step2from + 1, new Slice(Fragment.empty, 0, 0));

    // After steps 1 and 2, nl2 (the outer trailing newline) is at position
    //   inputNode.pmRange.to - 3  =  15 - 3  =  12.
    // This equals code2.prosemirrorEnd in the pre-transaction doc — the position that
    // triggers the misclassification bug when mapping.update() resolves it against proseDoc.
    const step3from = inputNode.pmRange.to - 3; // 12
    const step3 = new ReplaceStep(step3from, step3from + 1, new Slice(Fragment.empty, 0, 0));

    // All three steps must complete without throwing.
    // With the bug present, step 3 throws:
    //   TextUpdateError: "When attempting to refresh the text update node cache
    //                     we got a node that does not support text edits"
    expect(() => {
        mapping.update(step1, proseDoc);
        mapping.update(step2, proseDoc);
        mapping.update(step3, proseDoc);
    }).not.toThrow();

    sanityCheckTree(mapping.getMapping().root);

    // After wpLift the document is:
    //   ```coq\nabc\n```\n```coq\ndef\n```\n```coq\nghi\n```
    // Line numbers (0-indexed): code1 content on line 1, code2 on line 4, code3 on line 7.
    // Step 2 removes the leading duplicate newline (shifts code2 and code3 down by 1 line);
    // step 3 removes the trailing duplicate newline (shifts code3 down by 1 more line).
    expect(mapping.getMapping().computeLineNumbers()).toStrictEqual([1, 4, 7]);
});
