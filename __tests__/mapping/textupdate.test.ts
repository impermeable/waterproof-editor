import { Slice, Fragment } from "prosemirror-model";
import { ReplaceStep } from "prosemirror-transform";
import { DocChange, WaterproofDocument } from "../../src/api";
import { Mapping } from "../../src/mapping";
import { TextUpdate } from "../../src/mapping/textUpdate";
import { configuration } from "../../src/markdown-defaults";
import { WaterproofSchema } from "../../src/schema";
import { MarkdownBlock } from "../../src/document";
import { DefaultTagSerializer } from "../../src/serialization/DocumentSerializer";

function createMapping(doc: WaterproofDocument) {
  const mapping = new Mapping(doc, 0, configuration("coq"), new DefaultTagSerializer(configuration("coq")));
  return mapping;
}

test("ReplaceStep insert — inserts text into a block", () => {
  const blocks = [new MarkdownBlock("Hello", {from: 0, to: 5}, {from: 0, to: 5})];
  const mapping = createMapping(blocks);
  const slice: Slice = new Slice(Fragment.from(WaterproofSchema.text(" world")), 0, 0);
  const step: ReplaceStep = new ReplaceStep(6, 6, slice);
  console.log("here is the step", step);
  const textUpdate = new TextUpdate();
  const {newTree, result} = textUpdate.textUpdate(step, mapping);
  
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

const helloWorldMarkdownBlock = new MarkdownBlock("Hello world", {from: 0, to: 11}, {from: 0, to: 11});

test("ReplaceStep insert — inserts text in the middle of a block", () => {
  const mapping = createMapping([helloWorldMarkdownBlock]);
  const slice: Slice = new Slice(Fragment.from(WaterproofSchema.text("big ")), 0, 0);
  const step: ReplaceStep = new ReplaceStep(7, 7, slice);
  const textUpdate = new TextUpdate();
  const {newTree, result} = textUpdate.textUpdate(step, mapping);

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