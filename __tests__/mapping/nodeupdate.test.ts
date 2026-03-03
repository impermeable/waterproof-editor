import { Fragment, Slice } from "prosemirror-model";
import { DocChange, Mapping, WaterproofDocument, WrappingDocChange } from "../../src/api";
import { configuration } from "../../src/markdown-defaults";
import { ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";
import { WaterproofSchema } from "../../src/schema";
import { NodeUpdate } from "../../src/mapping/nodeUpdate";
import { CodeBlock, HintBlock, InputAreaBlock, MarkdownBlock, NewlineBlock } from "../../src/document";
import { DefaultTagSerializer } from "../../src/serialization/DocumentSerializer";
import { sanityCheckTree } from "./util";

const config = configuration("coq");
const serializer = new DefaultTagSerializer(config);

function createMapping(blocks: WaterproofDocument) {
  const mapping = new Mapping(blocks, 0, config, serializer);
  return mapping;
}

function createMappingForLang(lang: string, blocks: WaterproofDocument) {
  const langConfig = configuration(lang);
  const langSerializer = new DefaultTagSerializer(langConfig);
  return new Mapping(blocks, 0, langConfig, langSerializer);
}

function nodeUpdateForLang(lang: string) {
  const langConfig = configuration(lang);
  const langSerializer = new DefaultTagSerializer(langConfig);
  return new NodeUpdate(langConfig, langSerializer);
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

    // Content added is 3 newlines, 6 ticks and coq, so 12 characters, so 19 characters in total

    expect(newTree.root.contentRange).toEqual({from: 0, to: 19})

    // For prosemirror, the begin and end tags of the code node count as one, and each newline counts as one, so this gives 5 new prosemirror positions
    expect(newTree.root.prosemirrorStart).toEqual(0);
    expect(newTree.root.prosemirrorEnd).toEqual(12);
    expect(newTree.root.pmRange).toEqual({from: 0, to: 13})

    sanityCheckTree(newTree.root);

    
    expect(newTree.root.children[0]).toMatchObject({
        type: 'markdown',
        contentRange: { from: 0, to: 7 },
        tagRange: { from: 0, to: 7 },
        title: '',
        prosemirrorStart: 1,
        prosemirrorEnd: 8,
        pmRange: { from: 0, to: 9 },
        lineStart: 0,
        children: []
    })
    expect(newTree.root.children[1]).toMatchObject({
      type: 'newline',
      contentRange: { from: 7, to: 8 },
      tagRange: { from: 7, to: 8 },
      title: '',
      prosemirrorStart: 9,
      prosemirrorEnd: 9,
      pmRange: { from: 9, to: 10 },
      lineStart: 0,
      children: []
    })
    expect(newTree.root.children[2]).toMatchObject({
      type: 'code',
      contentRange: { from: 15, to: 15 },
      tagRange: { from: 8, to: 19 },
      title: '',
      prosemirrorStart: 11,
      prosemirrorEnd: 11,
      pmRange: { from: 10, to: 12 },
      lineStart: 0,
      children: []
    })
    console.log("New tree", newTree.root.children[3]) 
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
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping);
    console.log(JSON.stringify(newTree.root, null, " "))
    sanityCheckTree(newTree.root);
    expect(result).toStrictEqual<DocChange>({
        finalText: "\n```coq\n\n```",
        startInFile: 19,
        endInFile: 19 
    });

    // TODO: Check new tree structure
});

test("Unwrap input area", () => {
    // <input-area># Hello</input-area>
    const mapping = createMapping([
        new InputAreaBlock("# Hello", 
            {from: 0, to: 32},
            {from: 12, to: 19},
            PLACEHOLDER_LINENR,
            [
                new MarkdownBlock("# Hello", {from: 12, to: 19}, {from: 12, to: 19}, PLACEHOLDER_LINENR)
            ])]);

    const slice: Slice = new Slice(Fragment.from([ ]), 0, 0);
    const step = new ReplaceAroundStep(0, 11, 1, 10, slice, 0);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping);
    console.log(JSON.stringify(newTree.root, null, " "))
    sanityCheckTree(newTree.root);
    expect(result).toStrictEqual<WrappingDocChange>({
        firstEdit: {
            finalText: "",
            startInFile: 0,
            endInFile: 12 
        }, 
        secondEdit : {
            finalText: "",
            startInFile: 19,
            endInFile: 32
        }});
});

test("Unwrap hint area", () => {
    // <hint title="💡 Hint"># Hello</hint>
    const mapping = createMapping([
        new HintBlock("# Hello", "💡 Hint",
            {from: 0, to: 36},
            {from: 22, to: 29},
            PLACEHOLDER_LINENR,
            [
                new MarkdownBlock("# Hello", {from: 22, to: 29}, {from: 22, to: 29}, PLACEHOLDER_LINENR)
            ])]);

    const slice: Slice = new Slice(Fragment.from([ ]), 0, 0);
    const step = new ReplaceAroundStep(0, 11, 1, 10, slice, 0);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping);
    console.log(JSON.stringify(newTree.root, null, " "))
    sanityCheckTree(newTree.root);
    expect(result).toStrictEqual<WrappingDocChange>({
        firstEdit: {
            finalText: "",
            startInFile: 0,
            endInFile: 22 
        }, 
        secondEdit : {
            finalText: "",
            startInFile: 29,
            endInFile: 36
        }});
});

test("Unwrap hint area with content after", () => {
    // <hint title="💡 Hint"># Hello</hint>
    // # Hellotwo
    const mapping = createMapping([
        new HintBlock("# Hello", "💡 Hint",
            {from: 0, to: 36},
            {from: 22, to: 29},
            PLACEHOLDER_LINENR,
            [
                new MarkdownBlock("# Hello", {from: 22, to: 29}, {from: 22, to: 29}, PLACEHOLDER_LINENR)
            ]),
        new MarkdownBlock("# Hellotwo", {from: 36, to: 43}, {from: 36, to: 43}, PLACEHOLDER_LINENR)]);

    const slice: Slice = new Slice(Fragment.from([ ]), 0, 0);
    const step = new ReplaceAroundStep(0, 11, 1, 10, slice, 0);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping);
    console.log(JSON.stringify(newTree.root, null, " "))
    sanityCheckTree(newTree.root);
    expect(result).toStrictEqual<WrappingDocChange>({
        firstEdit: {
            finalText: "",
            startInFile: 0,
            endInFile: 22 
        }, 
        secondEdit : {
            finalText: "",
            startInFile: 29,
            endInFile: 36
        }});
});


test("Wrap markdown in hint area", () => {
    const mapping = createMapping([new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, PLACEHOLDER_LINENR)]);


    const slice: Slice = new Slice(Fragment.from([ WaterproofSchema.nodes.hint.create()]), 0, 0);
    const step = new ReplaceAroundStep(0, 9, 0, 9, slice, 1);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping);
    sanityCheckTree(newTree.root);

    expect(result).toStrictEqual<WrappingDocChange>({
        firstEdit : {
         finalText: "<hint title=\"💡 Hint\">",
        startInFile: 0,
        endInFile: 0   
        },
        secondEdit : {
        finalText: "</hint>",
        startInFile: 7,
        endInFile: 7
        }  
    })
})

test("Wrap markdown in input area", () => {
    const mapping = createMapping([new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, PLACEHOLDER_LINENR)]);


    const slice: Slice = new Slice(Fragment.from([ WaterproofSchema.nodes.input.create()]), 0, 0);
    const step = new ReplaceAroundStep(0, 9, 0, 9, slice, 1);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping);
    sanityCheckTree(newTree.root);

    expect(result).toStrictEqual<WrappingDocChange>({
        firstEdit : {
         finalText: "<input-area>",
        startInFile: 0,
        endInFile: 0   
        },
        secondEdit : {
        finalText: "</input-area>",
        startInFile: 7,
        endInFile: 7
        }  
    })
})

test("Delete a code block between markdown blocks", () => {
    // Assumption: Code block tags are ```coq\n (length 7) and \n``` (length 4),
    // so tagRange length is content length + 11.
    // Assumption: Block ranges are contiguous in the document.
    const blocks: WaterproofDocument = [
        new MarkdownBlock("Hello", {from: 0, to: 5}, {from: 0, to: 5}, PLACEHOLDER_LINENR),
        new CodeBlock("Lemma.", {from: 5, to: 22}, {from: 12, to: 18}, PLACEHOLDER_LINENR),
        new MarkdownBlock("Bye", {from: 22, to: 25}, {from: 22, to: 25}, PLACEHOLDER_LINENR)
    ];

    const mapping = createMapping(blocks);
    const tree = mapping.getMapping();
    const codeNode = tree.root.children.find(node => node.type === "code");
    if (!codeNode) throw new Error("Test setup failed: missing code node");

    // Delete the entire code node (including its tags) using its ProseMirror range.
    const step = new ReplaceStep(codeNode.pmRange.from, codeNode.pmRange.to, Slice.empty);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const { newTree, result } = nodeUpdate.nodeUpdate(step, mapping);

    expect(result).toStrictEqual<DocChange>({
        finalText: "",
        startInFile: 5,
        endInFile: 22
    });

    sanityCheckTree(newTree.root);

    expect(newTree.root.children.length).toBe(2);
    expect(newTree.root.children[0].type).toBe("markdown");
    expect(newTree.root.children[1].type).toBe("markdown");

    // The trailing markdown shifts left by the deleted tagRange length (17).
    expect(newTree.root.children[1].contentRange).toStrictEqual({from: 5, to: 8});
    expect(newTree.root.children[1].tagRange).toStrictEqual({from: 5, to: 8});
    expect(newTree.root.contentRange.to).toBe(8);
});

test("Delete adjacent code and markdown blocks", () => {
    // Assumption: Block ranges are contiguous in the document.
    // Assumption: Deleting a prosemirror range that fully covers nodes removes those nodes entirely.
    const blocks: WaterproofDocument = [
        new MarkdownBlock("A", {from: 0, to: 1}, {from: 0, to: 1}, PLACEHOLDER_LINENR),
        new CodeBlock("X", {from: 1, to: 13}, {from: 8, to: 9}, PLACEHOLDER_LINENR),
        new MarkdownBlock("B", {from: 13, to: 14}, {from: 13, to: 14}, PLACEHOLDER_LINENR)
    ];

    const mapping = createMapping(blocks);
    const tree = mapping.getMapping();
    const codeNode = tree.root.children.find(node => node.type === "code");
    const trailingMarkdown = tree.root.children.find(node => node.type === "markdown" && node.contentRange.from === 13);
    if (!codeNode || !trailingMarkdown) throw new Error("Test setup failed: missing code or trailing markdown node");

    const step = new ReplaceStep(codeNode.pmRange.from, trailingMarkdown.pmRange.to, Slice.empty);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const { newTree, result } = nodeUpdate.nodeUpdate(step, mapping);

    expect(result).toStrictEqual<DocChange>({
        finalText: "",
        startInFile: codeNode.tagRange.from,
        endInFile: trailingMarkdown.tagRange.to
    });

    sanityCheckTree(newTree.root);

    expect(newTree.root.children.length).toBe(1);
    expect(newTree.root.children[0].type).toBe("markdown");
    expect(newTree.root.children[0].contentRange).toStrictEqual({from: 0, to: 1});
    expect(newTree.root.contentRange.to).toBe(1);
});

test("Delete markdown cell", () => {
    const mapping = createMapping([
        new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, PLACEHOLDER_LINENR),
        new MarkdownBlock("# Hello", {from: 7, to: 14}, {from: 7, to: 14}, PLACEHOLDER_LINENR)
         ]);

    const slice: Slice = new Slice(Fragment.from([]), 0, 0);

    const step = new ReplaceStep(9, 18, slice);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping);
    sanityCheckTree(newTree.root);

    expect(result).toStrictEqual<DocChange>({
        finalText: "",
        startInFile: 7,
        endInFile: 14
    })
})


test("Complex deletion", () => {
    // # Hello
    // <hint title="💡 Hint">
    // Md
    // <code>
    // Code
    // </code>
    // </hint>
    const mapping = createMapping([
        new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, PLACEHOLDER_LINENR),
        new HintBlock("Md", "💡 Hint",
            {from: 7, to: 54},
            {from: 29, to: 47},
            PLACEHOLDER_LINENR,
            [
                new MarkdownBlock("Md", {from: 29, to: 31}, {from: 29, to: 31}, PLACEHOLDER_LINENR),
                new NewlineBlock({from: 31, to: 32}, {from: 31, to: 32}, PLACEHOLDER_LINENR),
                new CodeBlock("Code", {from: 32, to: 48}, {from: 39, to: 43}, PLACEHOLDER_LINENR)
            ])]);

    const slice: Slice = new Slice(Fragment.from([]), 0, 0);

    const step = new ReplaceStep(9, 22, slice);


    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping);
    console.log(JSON.stringify(newTree.root, null, " "));
    sanityCheckTree(newTree.root);

    expect(result).toStrictEqual<DocChange>({
        finalText: "",
        startInFile: 7,
        endInFile: 54
    })
})

test("Complex deletion undo", () => {
    // # Hello
    // <hint title="💡 Hint">
    // Md
    // <code>
    // Code
    // </code>
    // </hint>
    // Then remove hint block and undo
    const mapping = createMapping([
        new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, PLACEHOLDER_LINENR),
    ]);

    const hint = WaterproofSchema.nodes.hint.create({title: "💡 Hint"}, 
        Fragment.from([
            WaterproofSchema.nodes.markdown.create(null, 
                Fragment.from([WaterproofSchema.text("Md")])
                    

            ),
            WaterproofSchema.nodes.newline.create(),
            WaterproofSchema.nodes.code.create(null, Fragment.from([WaterproofSchema.text("Code")]))
                    
                
        ])
    )

    const slice: Slice = new Slice(Fragment.from([hint]), 0, 0);

    const step = new ReplaceStep(9, 9, slice);


    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping);
    console.log(JSON.stringify(newTree.root, null, " "));
    sanityCheckTree(newTree.root);

    expect(result).toStrictEqual<DocChange>({
        finalText: "<hint title=\"💡 Hint\">Md\n```coq\nCode\n```</hint>",
        startInFile: 7,
        endInFile: 7
    })
})

// ── lean4 tests ─────────────────────────────────────────────────────────
// For lean, code block open tag is ```lean\n (8 chars) vs ```coq\n (7 chars).
// Close tag \n``` (4 chars) is the same. So code tag overhead is 12 vs 11.

test("Insert code underneath markdown (lean4)", () => {
    // # Hello
    const mapping = createMappingForLang("lean", [new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, PLACEHOLDER_LINENR)]);
    const slice: Slice = new Slice(Fragment.from([WaterproofSchema.nodes.newline.create(), WaterproofSchema.nodes.code.create()]), 0, 0);
    const step: ReplaceStep = new ReplaceStep(9, 9, slice);

    const update = nodeUpdateForLang("lean");
    const {newTree, result} = update.nodeUpdate(step, mapping);

    // \n```lean\n\n``` = 13 chars (1 extra vs coq)
    expect(result).toStrictEqual<DocChange>({
        finalText: "\n```lean\n\n```",
        startInFile: 7,
        endInFile: 7
    });

    expect(newTree.root.children.length).toBe(3);

    // Total document: "# Hello" (7) + "\n" (1) + "```lean\n\n```" (12) = 20
    expect(newTree.root.contentRange).toEqual({from: 0, to: 20});

    // ProseMirror positions are based on the node structure, not serialization, so they are the same as for coq.
    expect(newTree.root.prosemirrorStart).toEqual(0);
    expect(newTree.root.prosemirrorEnd).toEqual(12);
    expect(newTree.root.pmRange).toEqual({from: 0, to: 13});

    sanityCheckTree(newTree.root);

    expect(newTree.root.children[0]).toMatchObject({
        type: 'markdown',
        contentRange: { from: 0, to: 7 },
        tagRange: { from: 0, to: 7 },
        prosemirrorStart: 1,
        prosemirrorEnd: 8,
        pmRange: { from: 0, to: 9 },
    });
    expect(newTree.root.children[1]).toMatchObject({
        type: 'newline',
        contentRange: { from: 7, to: 8 },
        tagRange: { from: 7, to: 8 },
        prosemirrorStart: 9,
        prosemirrorEnd: 9,
        pmRange: { from: 9, to: 10 },
    });
    expect(newTree.root.children[2]).toMatchObject({
        type: 'code',
        contentRange: { from: 16, to: 16 },   // ```lean\n = 8 chars, so 8+8=16
        tagRange: { from: 8, to: 20 },         // 8 + 12 (overhead) = 20
        prosemirrorStart: 11,
        prosemirrorEnd: 11,
        pmRange: { from: 10, to: 12 },
    });
});

test("Insert code underneath markdown inside input area (lean4)", () => {
    // <input-area># Hello</input-area>
    const mapping = createMappingForLang("lean", [
        new InputAreaBlock("# Hello",
            {from: 0, to: 32},
            {from: 12, to: 19},
            PLACEHOLDER_LINENR,
            [
                new MarkdownBlock("# Hello", {from: 12, to: 19}, {from: 12, to: 19}, PLACEHOLDER_LINENR)
            ])]);
    const slice: Slice = new Slice(Fragment.from([WaterproofSchema.nodes.newline.create(), WaterproofSchema.nodes.code.create()]), 0, 0);
    const step: ReplaceStep = new ReplaceStep(10, 10, slice);

    const update = nodeUpdateForLang("lean");
    const {newTree, result} = update.nodeUpdate(step, mapping);
    sanityCheckTree(newTree.root);
    expect(result).toStrictEqual<DocChange>({
        finalText: "\n```lean\n\n```",
        startInFile: 19,
        endInFile: 19
    });
});

test("Delete a code block between markdown blocks (lean4)", () => {
    // For lean, code block open tag ```lean\n is 8 chars, close \n``` is 4 chars.
    // "Lemma." (6 chars) → tagRange length = 8 + 6 + 4 = 18.
    const blocks: WaterproofDocument = [
        new MarkdownBlock("Hello", {from: 0, to: 5}, {from: 0, to: 5}, PLACEHOLDER_LINENR),
        new CodeBlock("Lemma.", {from: 5, to: 23}, {from: 13, to: 19}, PLACEHOLDER_LINENR),
        new MarkdownBlock("Bye", {from: 23, to: 26}, {from: 23, to: 26}, PLACEHOLDER_LINENR)
    ];

    const mapping = createMappingForLang("lean", blocks);
    const tree = mapping.getMapping();
    const codeNode = tree.root.children.find(node => node.type === "code");
    if (!codeNode) throw new Error("Test setup failed: missing code node");

    const step = new ReplaceStep(codeNode.pmRange.from, codeNode.pmRange.to, Slice.empty);

    const update = nodeUpdateForLang("lean");
    const { newTree, result } = update.nodeUpdate(step, mapping);

    expect(result).toStrictEqual<DocChange>({
        finalText: "",
        startInFile: 5,
        endInFile: 23
    });

    sanityCheckTree(newTree.root);

    expect(newTree.root.children.length).toBe(2);
    expect(newTree.root.children[0].type).toBe("markdown");
    expect(newTree.root.children[1].type).toBe("markdown");

    // Trailing markdown shifts left by the deleted tagRange length (18).
    expect(newTree.root.children[1].contentRange).toStrictEqual({from: 5, to: 8});
    expect(newTree.root.children[1].tagRange).toStrictEqual({from: 5, to: 8});
    expect(newTree.root.contentRange.to).toBe(8);
});

test("Delete adjacent code and markdown blocks (lean4)", () => {
    // For lean, CodeBlock("X") → tag: 8 + 1 + 4 = 13 chars.
    const blocks: WaterproofDocument = [
        new MarkdownBlock("A", {from: 0, to: 1}, {from: 0, to: 1}, PLACEHOLDER_LINENR),
        new CodeBlock("X", {from: 1, to: 14}, {from: 9, to: 10}, PLACEHOLDER_LINENR),
        new MarkdownBlock("B", {from: 14, to: 15}, {from: 14, to: 15}, PLACEHOLDER_LINENR)
    ];

    const mapping = createMappingForLang("lean", blocks);
    const tree = mapping.getMapping();
    const codeNode = tree.root.children.find(node => node.type === "code");
    const trailingMarkdown = tree.root.children.find(node => node.type === "markdown" && node.contentRange.from === 14);
    if (!codeNode || !trailingMarkdown) throw new Error("Test setup failed: missing code or trailing markdown node");

    const step = new ReplaceStep(codeNode.pmRange.from, trailingMarkdown.pmRange.to, Slice.empty);

    const update = nodeUpdateForLang("lean");
    const { newTree, result } = update.nodeUpdate(step, mapping);

    expect(result).toStrictEqual<DocChange>({
        finalText: "",
        startInFile: codeNode.tagRange.from,
        endInFile: trailingMarkdown.tagRange.to
    });

    sanityCheckTree(newTree.root);

    expect(newTree.root.children.length).toBe(1);
    expect(newTree.root.children[0].type).toBe("markdown");
    expect(newTree.root.children[0].contentRange).toStrictEqual({from: 0, to: 1});
    expect(newTree.root.contentRange.to).toBe(1);
});

test("Complex deletion (lean4)", () => {
    // # Hello
    // <hint title="💡 Hint">
    // Md
    // <code>  ← ```lean\n (8 chars open tag)
    // Code
    // </code>
    // </hint>
    // For lean, CodeBlock("Code") tag: 8 + 4 + 4 = 16 chars → {32, 48}
    // Hint innerRange: {29, 48}, hint tag: {7, 55}
    const mapping = createMappingForLang("lean", [
        new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, PLACEHOLDER_LINENR),
        new HintBlock("Md", "💡 Hint",
            {from: 7, to: 55},
            {from: 29, to: 48},
            PLACEHOLDER_LINENR,
            [
                new MarkdownBlock("Md", {from: 29, to: 31}, {from: 29, to: 31}, PLACEHOLDER_LINENR),
                new NewlineBlock({from: 31, to: 32}, {from: 31, to: 32}, PLACEHOLDER_LINENR),
                new CodeBlock("Code", {from: 32, to: 48}, {from: 40, to: 44}, PLACEHOLDER_LINENR)
            ])]);

    const slice: Slice = new Slice(Fragment.from([]), 0, 0);
    const step = new ReplaceStep(9, 22, slice);

    const update = nodeUpdateForLang("lean");
    const {newTree, result} = update.nodeUpdate(step, mapping);
    sanityCheckTree(newTree.root);

    expect(result).toStrictEqual<DocChange>({
        finalText: "",
        startInFile: 7,
        endInFile: 55
    });
});

test("Complex deletion undo (lean4)", () => {
    const mapping = createMappingForLang("lean", [
        new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, PLACEHOLDER_LINENR),
    ]);

    const hint = WaterproofSchema.nodes.hint.create({title: "💡 Hint"},
        Fragment.from([
            WaterproofSchema.nodes.markdown.create(null,
                Fragment.from([WaterproofSchema.text("Md")])
            ),
            WaterproofSchema.nodes.newline.create(),
            WaterproofSchema.nodes.code.create(null, Fragment.from([WaterproofSchema.text("Code")]))
        ])
    );

    const slice: Slice = new Slice(Fragment.from([hint]), 0, 0);
    const step = new ReplaceStep(9, 9, slice);

    const update = nodeUpdateForLang("lean");
    const {newTree, result} = update.nodeUpdate(step, mapping);
    sanityCheckTree(newTree.root);

    expect(result).toStrictEqual<DocChange>({
        finalText: "<hint title=\"💡 Hint\">Md\n```lean\nCode\n```</hint>",
        startInFile: 7,
        endInFile: 7
    });
});