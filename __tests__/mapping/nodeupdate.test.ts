import { Fragment, Slice } from "prosemirror-model";
import { DocChange, Mapping, WaterproofDocument } from "../../src/api";
import { configuration } from "../../src/markdown-defaults";
import { ReplaceStep } from "prosemirror-transform";
import { WaterproofSchema } from "../../src/schema";
import { NodeUpdate } from "../../src/mapping/nodeUpdate";
import { InputAreaBlock, MarkdownBlock } from "../../src/document";
import { DefaultTagSerializer } from "../../src/serialization/DocumentSerializer";

const config = configuration("coq");
const serializer = new DefaultTagSerializer(config);

function createMapping(blocks: WaterproofDocument) {
  const mapping = new Mapping(blocks, 0, config, serializer);
  return mapping;
}

const PLACEHOLDER_LINENR = 0;

// TODO: Test linenrs
test("Insert code underneath markdown", () => {
    // # Hello
    const mapping = createMapping([new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, PLACEHOLDER_LINENR)]);
    const slice: Slice = new Slice(Fragment.from([WaterproofSchema.nodes.newline.create(), WaterproofSchema.nodes.code.create()]), 0, 0);
    const step: ReplaceStep = new ReplaceStep(9, 9, slice);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping);

    expect(result).toStrictEqual<DocChange>({
        finalText: "\n```coq\n\n```",
        startInFile: 7,
        endInFile: 7 
    });

    expect(newTree.root.children.length).toBe(3);
    
    // TODO: Check new tree structure
});

// TODO: Test linenrs
test("Insert code underneath markdown inside input area", () => {
    // <input-area># Hello</input-area>
    const mapping = createMapping([
        new InputAreaBlock("# Hello", 
            {from: 0, to: 32},
            {from: 12, to: 19},
            PLACEHOLDER_LINENR,
            [
                new MarkdownBlock("# Hello", {from: 12, to: 19}, {from: 12, to: 19}, PLACEHOLDER_LINENR)
            ])]);
    const slice: Slice = new Slice(Fragment.from([WaterproofSchema.nodes.newline.create(), WaterproofSchema.nodes.code.create()]), 0, 0);
    const step: ReplaceStep = new ReplaceStep(10, 10, slice);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {result} = nodeUpdate.nodeUpdate(step, mapping);

    expect(result).toStrictEqual<DocChange>({
        finalText: "\n```coq\n\n```",
        startInFile: 19,
        endInFile: 19 
    });

    // TODO: Check new tree structure
});