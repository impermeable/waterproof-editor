import { Slice, Fragment } from "prosemirror-model";
import { ReplaceStep } from "prosemirror-transform";
import { DocChange, WaterproofDocument } from "../../src/api";
import { Mapping } from "../../src/mapping";
import { TextUpdate } from "../../src/mapping/textUpdate";
import { configuration } from "../../src/markdown-defaults";
import { WaterproofSchema } from "../../src/schema";
import { CodeBlock, InputAreaBlock, MarkdownBlock, NewlineBlock } from "../../src/document";
import { DefaultTagSerializer } from "../../src/serialization/DocumentSerializer";
import { sanityCheckTree } from "./util";
import { TreeNode } from "../../src/mapping";

function createMapping(doc: WaterproofDocument) {
  const mapping = new Mapping(doc, 0, configuration("coq"), new DefaultTagSerializer(configuration("coq")));
  return mapping;
}

const PLACEHOLDER_LINENR = 0;

function findFirstCodeNode(root: TreeNode): TreeNode | null {
  let found: TreeNode | null = null;
  root.traverseDepthFirst((node: TreeNode) => {
    if (found || node.type !== "code") return;
    found = node;
  });
  return found;
}

// TODO: Test linenrs
test("ReplaceStep insert — inserts text into a block", () => {
  const blocks = [new MarkdownBlock("Hello", {from: 0, to: 5}, {from: 0, to: 5}, PLACEHOLDER_LINENR)];
  const mapping = createMapping(blocks);
  const slice: Slice = new Slice(Fragment.from(WaterproofSchema.text(" world")), 0, 0);
  const step: ReplaceStep = new ReplaceStep(6, 6, slice);
  console.log("here is the step", step);
  const textUpdate = new TextUpdate();
  const {newTree, result} = textUpdate.textUpdate(step, mapping);

  sanityCheckTree(newTree.root);
  
  const md = newTree.root.children[0];
  expect(md.contentRange.from).toBe(0);
  expect(md.contentRange.to).toBe(11);
  expect(md.tagRange.from).toBe(0);
  expect(md.tagRange.to).toBe(11);
  expect(md.prosemirrorStart).toBe(1);
  expect(md.prosemirrorEnd).toBe(12);
  
  expect(result).toStrictEqual<DocChange>({
    finalText: " world",
    startInFile: 5,
    endInFile: 5
  });
});

const helloWorldMarkdownBlock = new MarkdownBlock("Hello world", {from: 0, to: 11}, {from: 0, to: 11}, PLACEHOLDER_LINENR);

// TODO: Test linenrs
test("ReplaceStep insert — inserts text in the middle of a block", () => {
  const mapping = createMapping([helloWorldMarkdownBlock]);
  const slice: Slice = new Slice(Fragment.from(WaterproofSchema.text("big ")), 0, 0);
  const step: ReplaceStep = new ReplaceStep(7, 7, slice);
  const textUpdate = new TextUpdate();
  const {newTree, result} = textUpdate.textUpdate(step, mapping);

  sanityCheckTree(newTree.root);

  const md = newTree.root.children[0];
  
  expect(md.contentRange.from).toBe(0);
  expect(md.contentRange.to).toBe(15);
  expect(md.tagRange.from).toBe(0);
  expect(md.tagRange.to).toBe(15);
  expect(md.prosemirrorStart).toBe(1);
  expect(md.prosemirrorEnd).toBe(16);
  
  expect(result).toStrictEqual<DocChange>({
    finalText: "big ",
    startInFile: 6,
    endInFile: 6
  });
});

test("ReplaceStep delete — deletes part of a block", () => {
  const mapping = createMapping([helloWorldMarkdownBlock]);
  const step: ReplaceStep = new ReplaceStep(7, 12, Slice.empty);
  const textUpdate = new TextUpdate();
  const {newTree, result} = textUpdate.textUpdate(step, mapping);

  sanityCheckTree(newTree.root);

  const md = newTree.root.children[0];
  expect(md.contentRange.from).toBe(0);
  expect(md.contentRange.to).toBe(6);
  expect(md.tagRange.from).toBe(0);
  expect(md.tagRange.to).toBe(6);
  expect(md.prosemirrorStart).toBe(1);
  expect(md.prosemirrorEnd).toBe(7);

  expect(result).toStrictEqual<DocChange>({
    finalText: "",
    startInFile: 6,
    endInFile: 11
  })
});


test("ReplaceStep replace — replaces part of a block", () => {
  const mapping = createMapping([helloWorldMarkdownBlock]);
  const slice: Slice = new Slice(Fragment.from(WaterproofSchema.text("there")), 0, 0);
  const step: ReplaceStep = new ReplaceStep(7, 12, slice);
  const textUpdate = new TextUpdate();
  const {newTree, result} = textUpdate.textUpdate(step, mapping);

  sanityCheckTree(newTree.root);

  const md = newTree.root.children[0];
  expect(md.contentRange.from).toBe(0);
  expect(md.contentRange.to).toBe(11);
  expect(md.tagRange.from).toBe(0);
  expect(md.tagRange.to).toBe(11);
  expect(md.prosemirrorStart).toBe(1);
  expect(md.prosemirrorEnd).toBe(12);

  // Check that the resulting document change has the correct type (is a DocChange) and has the correct properties.
  expect(result).toStrictEqual<DocChange>({
    finalText: "there",
    startInFile: 6,
    endInFile: 11
  });
});

test("ReplaceStep insert — nested code inside input shifts wrapper and later blocks", () => {
  // Assumption: Input areas contain newline, code, newline blocks in order.
  // Assumption: Block ranges are contiguous in the document.
  const blocks = [
    new InputAreaBlock("```coq\nTest\n```", {from: 0, to: 42}, {from: 12, to: 29}, PLACEHOLDER_LINENR, [
      new NewlineBlock({from: 12, to: 13}, {from: 12, to: 13}, PLACEHOLDER_LINENR),
      new CodeBlock("Test", {from: 13, to: 28}, {from: 20, to: 24}, PLACEHOLDER_LINENR),
      new NewlineBlock({from: 28, to: 29}, {from: 28, to: 29}, PLACEHOLDER_LINENR)
    ]),
    new MarkdownBlock("After", {from: 42, to: 47}, {from: 42, to: 47}, PLACEHOLDER_LINENR)
  ];

  const mapping = createMapping(blocks);
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

  const insertPos = codeNode.prosemirrorStart + 1;
  const slice: Slice = new Slice(Fragment.from(WaterproofSchema.text("X")), 0, 0);
  const step: ReplaceStep = new ReplaceStep(insertPos, insertPos, slice);

  const textUpdate = new TextUpdate();
  const { newTree, result } = textUpdate.textUpdate(step, mapping);

  sanityCheckTree(newTree.root);

  expect(result).toStrictEqual<DocChange>({
    finalText: "X",
    startInFile: codeNode.contentRange.from + 1,
    endInFile: codeNode.contentRange.from + 1
  });

  const updatedInput = newTree.root.children.find(node => node.type === "input");
  const updatedAfter = newTree.root.children.filter(node => node.type === "markdown").at(-1);
  if (!updatedInput || !updatedAfter) throw new Error("Test setup failed: missing updated nodes");

  expect(updatedInput.tagRange.to).toBe(inputTagEnd + 1);
  expect(updatedInput.contentRange.to).toBe(inputContentEnd + 1);
  expect(updatedAfter.contentRange.from).toBe(afterContentStart + 1);
  expect(updatedAfter.tagRange.from).toBe(afterTagStart + 1);
});