import { Fragment, ResolvedPos, Slice } from "prosemirror-model";
import { DocChange, Mapping, NodeUpdateError, WaterproofDocument, WrappingDocChange } from "../../src/api";
import { configuration } from "../../src/markdown-defaults";
import { ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";
import { WaterproofSchema } from "../../src/schema";
import { NodeUpdate } from "../../src/mapping/nodeUpdate";
import { CodeBlock, ContainerBlock, HintBlock, InputAreaBlock, MarkdownBlock, NewlineBlock } from "../../src/document";
import { DefaultTagSerializer } from "../../src/serialization/DocumentSerializer";
import { sanityCheckTree } from "./util";
import { Node } from "prosemirror-model";

const config = configuration("coq");
const serializer = new DefaultTagSerializer(config);

const nodeMock : Node = new Node();

function createMapping(blocks: WaterproofDocument) {
  const mapping = new Mapping(blocks, 0, config, serializer);
  return mapping;
}

// Lean-like tag configuration with meaningful container tags (::::name\n / \n::::)
// so that wrapping/lifting a multilean cell actually changes line numbers.
const leanConfig = {
    code:     { openTag: "```lean\n",                        closeTag: "\n```",  openRequiresNewline: true,  closeRequiresNewline: true  },
    hint:     { openTag: (t: string) => `:::hint "${t}"\n`, closeTag: "\n:::",  openRequiresNewline: true,  closeRequiresNewline: true  },
    input:    { openTag: ":::input\n",                       closeTag: "\n:::",  openRequiresNewline: true,  closeRequiresNewline: true  },
    markdown: { openTag: "",                                 closeTag: "",       openRequiresNewline: false, closeRequiresNewline: false },
    math:     { openTag: "$$`",                              closeTag: "`",      openRequiresNewline: false, closeRequiresNewline: false },
    container:{ openTag: (n: string) => `::::${n}\n`,        closeTag: "\n::::", openRequiresNewline: true,  closeRequiresNewline: true  },
};
const leanSerializer = new DefaultTagSerializer(leanConfig);

function createLeanMapping(blocks: WaterproofDocument) {
    return new Mapping(blocks, 0, leanConfig, leanSerializer);
}

test("Insert code underneath markdown", () => {
    // # Hello
    const mapping = createMapping([new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, 0)]);
    const slice: Slice = new Slice(Fragment.from([WaterproofSchema.nodes.newline.create(), WaterproofSchema.nodes.code.create()]), 0, 0);
    const step: ReplaceStep = new ReplaceStep(9, 9, slice);

    const nodeUpdate = new NodeUpdate(config, serializer);
    jest.spyOn(serializer, "serializeDocument").mockReturnValue("# Hello")
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);

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
    // After inserting \n```coq\n\n```, the document becomes: # Hello\n```coq\n\n```
    // Line 0: # Hello, Line 1: ```coq, Line 2: (empty code content)
    // The new code block should start at line 2
    expect(newTree.root.children[2]).toMatchObject({
      type: 'code',
      contentRange: { from: 15, to: 15 },
      tagRange: { from: 8, to: 19 },
      title: '',
      prosemirrorStart: 11,
      prosemirrorEnd: 11,
      pmRange: { from: 10, to: 12 },
      lineStart: 2,
      children: []
    })

    expect(newTree.computeLineNumbers()).toStrictEqual([2]);
});

test("Insert code underneath markdown inside input area", () => {
    // <input-area># Hello</input-area>
    const mapping = createMapping([
        new InputAreaBlock("# Hello", 
            {from: 0, to: 32},
            {from: 12, to: 19},
            0,
            [
                new MarkdownBlock("# Hello", {from: 12, to: 19}, {from: 12, to: 19}, 0)
            ])]);
    const slice: Slice = new Slice(Fragment.from([WaterproofSchema.nodes.newline.create(), WaterproofSchema.nodes.code.create()]), 0, 0);
    const step: ReplaceStep = new ReplaceStep(10, 10, slice);

    const nodeUpdate = new NodeUpdate(config, serializer);
    jest.spyOn(serializer, "serializeDocument").mockReturnValue("<input-area># Hello</input-area>")
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);

    sanityCheckTree(newTree.root);
    expect(result).toStrictEqual<DocChange>({
        finalText: "\n```coq\n\n```",
        startInFile: 19,
        endInFile: 19 
    });

    // After inserting \n```coq\n\n``` at pos 19, document becomes:
    // <input-area># Hello\n```coq\n\n```</input-area>
    // Line 0: <input-area># Hello, Line 1: ```coq, Line 2: (empty code)
    // The new code block should start at line 2
    expect(newTree.computeLineNumbers()).toStrictEqual([2]);
});

test("Unwrap input area", () => {
    // <input-area># Hello</input-area>
    const mapping = createMapping([
        new InputAreaBlock("# Hello", 
            {from: 0, to: 32},
            {from: 12, to: 19},
            0,
            [
                new MarkdownBlock("# Hello", {from: 12, to: 19}, {from: 12, to: 19}, 0)
            ])]);

    const slice: Slice = new Slice(Fragment.from([ ]), 0, 0);
    const step = new ReplaceAroundStep(0, 11, 1, 10, slice, 0);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);
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

    expect(newTree.computeLineNumbers()).toStrictEqual([]);
});

test("Unwrap hint area", () => {
    // <hint title="💡 Hint"># Hello</hint>
    const mapping = createMapping([
        new HintBlock("# Hello", "💡 Hint",
            {from: 0, to: 36},
            {from: 22, to: 29},
            0,
            [
                new MarkdownBlock("# Hello", {from: 22, to: 29}, {from: 22, to: 29}, 0)
            ])]);

    const slice: Slice = new Slice(Fragment.from([ ]), 0, 0);
    const step = new ReplaceAroundStep(0, 11, 1, 10, slice, 0);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);
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

    expect(newTree.computeLineNumbers()).toStrictEqual([]);
});

test("Unwrap hint area with content after", () => {
    // <hint title="💡 Hint"># Hello</hint>
    // # Hellotwo
    const mapping = createMapping([
        new HintBlock("# Hello", "💡 Hint",
            {from: 0, to: 36},
            {from: 22, to: 29},
            0,
            [
                new MarkdownBlock("# Hello", {from: 22, to: 29}, {from: 22, to: 29}, 0)
            ]),
        new MarkdownBlock("# Hellotwo", {from: 36, to: 43}, {from: 36, to: 43}, 0)]);

    const slice: Slice = new Slice(Fragment.from([ ]), 0, 0);
    const step = new ReplaceAroundStep(0, 11, 1, 10, slice, 0);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);
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

    expect(newTree.computeLineNumbers()).toStrictEqual([]);
});


test("Wrap markdown in hint area", () => {
    const mapping = createMapping([new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, 0)]);


    const slice: Slice = new Slice(Fragment.from([ WaterproofSchema.nodes.hint.create()]), 0, 0);
    const step = new ReplaceAroundStep(0, 9, 0, 9, slice, 1);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);
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

    expect(newTree.computeLineNumbers()).toStrictEqual([]);
})

test("Wrap markdown in input area", () => {
    const mapping = createMapping([new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, 0)]);


    const slice: Slice = new Slice(Fragment.from([ WaterproofSchema.nodes.input.create()]), 0, 0);
    const step = new ReplaceAroundStep(0, 9, 0, 9, slice, 1);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);
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

    expect(newTree.computeLineNumbers()).toStrictEqual([]);
})

function configureNodeMock (deletedString : string) {
    jest.spyOn(nodeMock, 'resolve').mockReturnValue(({ parent: { type: { name: 'doc' } } }) as ResolvedPos)
    jest.spyOn(nodeMock, 'slice').mockReturnValue({} as Slice)
    jest.spyOn(serializer, 'serializeFragment').mockReturnValue(deletedString)
}
test("Delete second codeblock in input", () => {
    // <input-area>\n```coq\n\n```\n```coq\n\n```\n</input-area>\n```coq\nQed.\n```\n
    // Generated with ./scripts/file-to-mapping.ts
    const mapping = createMapping([
        new InputAreaBlock("\n```coq\n\n```\n```coq\n\n```\n", {from: 0, to: 50}, {from: 12, to: 37}, 0, [
            new NewlineBlock({from: 12, to: 13}, {from: 12, to: 13}, 0),
            new CodeBlock("", {from: 13, to: 24}, {from: 20, to: 20}, 2),
            new NewlineBlock({from: 24, to: 25}, {from: 24, to: 25}, 0),
            new CodeBlock("", {from: 25, to: 36}, {from: 32, to: 32}, 5),
            new NewlineBlock({from: 36, to: 37}, {from: 36, to: 37}, 0)
        ])
    ]);

    const slice: Slice = new Slice(Fragment.from([]), 0, 0);
    const step = new ReplaceStep(5, 8, slice);

    configureNodeMock("```coq\n\n```\n")
    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);
    
    sanityCheckTree(newTree.root);
    expect(newTree.computeLineNumbers()).toStrictEqual([2])
})


test("Delete a code block between markdown blocks", () => {
    // Document: Hello```coq\nLemma.\n```Bye
    // Code block opens at position 5 with ```coq\n, lineStart = 1 (one \n in open tag)
    const blocks: WaterproofDocument = [
        new MarkdownBlock("Hello", {from: 0, to: 5}, {from: 0, to: 5}, 0),
        new CodeBlock("Lemma.", {from: 5, to: 22}, {from: 12, to: 18}, 1),
        new MarkdownBlock("Bye", {from: 22, to: 25}, {from: 22, to: 25}, 0)
    ];

    configureNodeMock("```coq\nLemma.\n```")

    const mapping = createMapping(blocks);
    const tree = mapping.getMapping();
    const codeNode = tree.root.children.find(node => node.type === "code");
    if (!codeNode) throw new Error("Test setup failed: missing code node");

    // Delete the entire code node (including its tags) using its ProseMirror range.
    const step = new ReplaceStep(codeNode.pmRange.from, codeNode.pmRange.to, Slice.empty);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const { newTree, result } = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);

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

    // After deleting the code block, no code remains
    expect(newTree.computeLineNumbers()).toStrictEqual([]);
});


test("Delete adjacent code and markdown blocks", () => {
    // Document: A\n```coq\nX\n```B
    // Code block opens at position 2 with ```coq\n, lineStart = 1
    const blocks: WaterproofDocument = [
        new MarkdownBlock("A", {from: 0, to: 2}, {from: 0, to: 2}, 0),
        new CodeBlock("X", {from: 2, to: 14}, {from: 9, to: 10}, 1),
        new MarkdownBlock("B", {from: 14, to: 15}, {from: 14, to: 15}, 0)
    ];

    configureNodeMock("A\n```coq\nX\n```B")


    const mapping = createMapping(blocks);
    const tree = mapping.getMapping();
    const codeNode = tree.root.children.find(node => node.type === "code");
    const trailingMarkdown = tree.root.children.find(node => node.type === "markdown" && node.contentRange.from === 14);
    if (!codeNode || !trailingMarkdown) throw new Error("Test setup failed: missing code or trailing markdown node");

    const step = new ReplaceStep(codeNode.pmRange.from, trailingMarkdown.pmRange.to, Slice.empty);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const { newTree, result } = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);

    expect(result).toStrictEqual<DocChange>({
        finalText: "",
        startInFile: codeNode.tagRange.from,
        endInFile: trailingMarkdown.tagRange.to
    });

    sanityCheckTree(newTree.root);

    expect(newTree.root.children.length).toBe(1);
    expect(newTree.root.children[0].type).toBe("markdown");
    expect(newTree.root.children[0].contentRange).toStrictEqual({from: 0, to: 2});
    expect(newTree.root.contentRange.to).toBe(2);

    // After deleting code and markdown blocks, no code remains
    expect(newTree.computeLineNumbers()).toStrictEqual([]);
});

test("Delete markdown cell", () => {
    const mapping = createMapping([
        new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, 0),
        new MarkdownBlock("# Hello", {from: 7, to: 14}, {from: 7, to: 14}, 0)
         ]);

    const slice: Slice = new Slice(Fragment.from([]), 0, 0);

    const step = new ReplaceStep(9, 18, slice);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);
    sanityCheckTree(newTree.root);

    expect(result).toStrictEqual<DocChange>({
        finalText: "",
        startInFile: 7,
        endInFile: 14
    })

    expect(newTree.computeLineNumbers()).toStrictEqual([]);
})

test("Delete first of two codeblocks", () => {
    // Simulates the following:
    /* ```coq
       Code
       ```
       ```coq
       More
       ```
    */
    // Then deleting the first cell.
    
    configureNodeMock("```coq\nCode\n```\n")
    const mapping = createMapping([
        new CodeBlock("Code", {from: 0, to: 15}, {from: 7, to: 11}, 1),
        new NewlineBlock({from: 15, to: 16 }, {from: 15, to: 16}, 0),
        new CodeBlock("More", {from: 16, to: 31}, {from: 23, to: 27}, 4)
         ]);

    const slice: Slice = new Slice(Fragment.from([]), 0, 0);

    // PM layout: code={0,6} newline={6,7} code2={7,13}
    // Delete the first code block + trailing newline in PM space
    const step = new ReplaceStep(0, 7, slice);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);
    sanityCheckTree(newTree.root);

    expect(result).toStrictEqual<DocChange>({
        finalText: "",
        startInFile: 0,
        endInFile: 16
    })

    expect(newTree.computeLineNumbers()).toStrictEqual([1]);
})

test("Complex deletion", () => {
    // # Hello
    // <hint title="💡 Hint">
    // Md
    // <code>
    // Code
    // </code>
    // </hint>
    // Line counting: \n at pos 31 (after Md), \n at pos 38 (in ```coq\n) → code at line 2
    const mapping = createMapping([
        new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, 0),
        new HintBlock("Md", "💡 Hint",
            {from: 7, to: 54},
            {from: 29, to: 47},
            0,
            [
                new MarkdownBlock("Md", {from: 29, to: 31}, {from: 29, to: 31}, 0),
                new NewlineBlock({from: 31, to: 32}, {from: 31, to: 32}, 0),
                new CodeBlock("Code", {from: 32, to: 48}, {from: 39, to: 43}, 2)
            ])]);

    const slice: Slice = new Slice(Fragment.from([]), 0, 0);

    const step = new ReplaceStep(9, 22, slice);


    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);
    console.log(JSON.stringify(newTree.root, null, " "));
    sanityCheckTree(newTree.root);

    expect(result).toStrictEqual<DocChange>({
        finalText: "",
        startInFile: 7,
        endInFile: 54
    })

    // After deleting the entire hint block, no code blocks remain
    expect(newTree.computeLineNumbers()).toStrictEqual([]);
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
        new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, 0),
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
    
    jest.spyOn(serializer, "serializeDocument").mockReturnValue("# Hello")
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);
    console.log(JSON.stringify(newTree.root, null, " "));
    sanityCheckTree(newTree.root);

    expect(result).toStrictEqual<DocChange>({
        finalText: "<hint title=\"💡 Hint\">Md\n```coq\nCode\n```</hint>",
        startInFile: 7,
        endInFile: 7
    })
    // After reinserting the hint with code, the code block starts at line 2:
    // Line 0: # Hello<hint title="...">Md, Line 1: ```coq, Line 2: Code
    expect(newTree.computeLineNumbers()).toStrictEqual([2]);})

test("Insert code after markdown-newline-markdown: linecount reflects prior newline", () => {
    // Document: "# Hello\n# World" — one newline before the insertion point
    const mapping = createMapping([
        new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, 0),
        new NewlineBlock({from: 7, to: 8}, {from: 7, to: 8}, 0),
        new MarkdownBlock("# World", {from: 8, to: 15}, {from: 8, to: 15}, 0),
    ]);

    // Insert [newline, code] after "# World" (prose pos 19 = pmRange.to of "# World")
    const slice = new Slice(Fragment.from([WaterproofSchema.nodes.newline.create(), WaterproofSchema.nodes.code.create()]), 0, 0);
    const step = new ReplaceStep(19, 19, slice);

    const nodeUpdate = new NodeUpdate(config, serializer);
    jest.spyOn(serializer, "serializeDocument").mockReturnValue("# Hello\n# World")
    const {newTree} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);

    // The serialized doc has 1 newline before the insertion point (documentPos=15).
    // The inserted newline adds 1 more → lineCounter=2 when the code node is built.
    // The code open tag ("```coq\n") adds 1 more → contentLineStart=3.
    expect(newTree.computeLineNumbers()).toStrictEqual([3]);
});

test("Deleting code cell above input area does not throw (Rocq config)", () => {
    // Reproduces bug: deleting a code cell directly above an input area causes
    // TextUpdateError("Step does not happen within cell").
    //
    // Text layout (coq config):
    //   [0,5]   "Hello"              markdown
    //   [5,6]   "\n"                 newline
    //   [6,23]  "```coq\ntactic\n```"  code block (tagRange); content at [13,19]
    //   [23,24] "\n"                 newline
    //   [24,62] "<input-area>...</input-area>"  input area
    //     [36,49] inner content
    //       [36,37] "\n"             inner newline
    //       [37,48] "```coq\n\n```"  inner empty code block; content at [44,44]
    //       [48,49] "\n"             inner newline
    const blocks: WaterproofDocument = [
        new MarkdownBlock("Hello", {from: 0, to: 5}, {from: 0, to: 5}, 0),
        new NewlineBlock({from: 5, to: 6}, {from: 5, to: 6}, 0),
        new CodeBlock("tactic", {from: 6, to: 23}, {from: 13, to: 19}, 1),
        new NewlineBlock({from: 23, to: 24}, {from: 23, to: 24}, 0),
        new InputAreaBlock(
            "\n```coq\n\n```\n",
            {from: 24, to: 62},
            {from: 36, to: 49},
            0,
            [
                new NewlineBlock({from: 36, to: 37}, {from: 36, to: 37}, 0),
                new CodeBlock("", {from: 37, to: 48}, {from: 44, to: 44}, 0),
                new NewlineBlock({from: 48, to: 49}, {from: 48, to: 49}, 0),
            ]
        ),
    ];

    // ProseMirror layout:
    //   markdown("Hello"): pmRange {0, 7}   (nodeSize = 1+5+1 = 7)
    //   newline:            pmRange {7, 8}   (nodeSize = 1)
    //   code("tactic"):    pmRange {8, 16}  (nodeSize = 1+6+1 = 8)
    //   newline:            pmRange {16, 17} (nodeSize = 1)
    //   input:              pmRange {17, 23} (nodeSize = 1+(1+2+1)+1 = 6)
    //
    // deleteSelection branch 2 fires for a NodeSelection of code("tactic"):
    //   selection.from=8, selection.to=16, beforeSize=1 (preceding newline nodeSize)
    //   → produces ReplaceStep(8−1=7, 16, Slice.empty)
    const proseDoc = WaterproofSchema.nodes.doc.create(null, [
        WaterproofSchema.nodes.markdown.create(null, WaterproofSchema.text("Hello")),
        WaterproofSchema.nodes.newline.create(),
        WaterproofSchema.nodes.code.create(null, WaterproofSchema.text("tactic")),
        WaterproofSchema.nodes.newline.create(),
        WaterproofSchema.nodes.input.create(null, [
            WaterproofSchema.nodes.newline.create(),
            WaterproofSchema.nodes.code.create(),
            WaterproofSchema.nodes.newline.create()
        ])
    ]);

    const mapping = createMapping(blocks);
    const step = new ReplaceStep(7, 16, Slice.empty);

    expect(() => mapping.update(step, proseDoc)).not.toThrow();
});

test("Insert code after existing code block: linecount accounts for all prior tags", () => {
    // Document: "Hello\n```coq\nCode\n```" — three newlines before the insertion point
    const mapping = createMapping([
        new MarkdownBlock("Hello", {from: 0, to: 5}, {from: 0, to: 5}, 0),
        new NewlineBlock({from: 5, to: 6}, {from: 5, to: 6}, 0),
        new CodeBlock("Code", {from: 6, to: 21}, {from: 13, to: 17}, 1),
    ]);

    // Insert [newline, code] after the existing code block (prose pos 14 = pmRange.to of CodeBlock)
    const slice = new Slice(Fragment.from([WaterproofSchema.nodes.newline.create(), WaterproofSchema.nodes.code.create()]), 0, 0);
    const step = new ReplaceStep(14, 14, slice);

    const nodeUpdate = new NodeUpdate(config, serializer);

    jest.spyOn(serializer, "serializeDocument").mockReturnValue("Hello\n```coq\nCode\n```")
    const {newTree} = nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock);

    // The serialized doc has 3 newlines before the insertion point (documentPos=21).
    // The inserted newline adds 1 more → lineCounter=4 when the code node is built.
    // The code open tag ("```coq\n") adds 1 more → contentLineStart=5.
    expect(newTree.computeLineNumbers()).toStrictEqual([1, 5]);
});

test("Undo deletion of first codeblock (without newline)", () => {
    // Simulates the document:
    // ```coq
    // Code
    // ```
    // # Hello
    //
    // The user deletes the first code cell, then presses undo.
    const mapping = createMapping([
        new CodeBlock("Code", {from: 0, to: 15}, {from: 7, to: 11}, 1),
        new NewlineBlock({from: 15, to: 16}, {from: 15, to: 16}, 0),
        new MarkdownBlock("# Hello", {from: 16, to: 23}, {from: 16, to: 23}, 0),
    ]);

    // Step 1: Delete the first code block.
    // ProseMirror's deleteSelection on a NodeSelection of the code block
    // generates ReplaceStep(0, code.pmRange.to) = ReplaceStep(0, 6).
    configureNodeMock("```coq\nCode\n```");
    const nodeUpdate = new NodeUpdate(config, serializer);
    const deleteStep = new ReplaceStep(0, 6, Slice.empty);

    jest.spyOn(serializer, "serializeDocument").mockReturnValue("Hello\n```coq\nCode\n# Hello```")
    nodeUpdate.nodeUpdate(
        deleteStep, mapping, serializer, nodeMock
    );

    // Step 2: Undo — reinsert the code block at position 0.
    // The inverse of ReplaceStep(0, 6, empty) is ReplaceStep(0, 0, original_slice).
    const undoSlice = new Slice(Fragment.from([
        WaterproofSchema.nodes.code.create(null,
            Fragment.from([WaterproofSchema.text("Code")])
        ),
    ]), 0, 0);
    const undoStep = new ReplaceStep(0, 0, undoSlice);

    jest.spyOn(serializer, "serializeDocument").mockReturnValue("# Hello```")
    const { newTree, result } = nodeUpdate.nodeUpdate(
        undoStep, mapping, serializer, nodeMock
    );

    sanityCheckTree(newTree.root);

    expect(result).toStrictEqual<DocChange>({
        finalText: "```coq\nCode\n```",
        startInFile: 0,
        endInFile: 0
    });
});

// ── multilean (container) wrap / lift ─────────────────────────────────────────
//
// The Lean container tag is  "::::multilean\n"  (14 chars, 1 newline) open and
// "\n::::" (5 chars, 1 newline) close, so these tests verify that the code
// block's lineStart is updated correctly when the container tags are added or
// removed.

test("Wrap code cell in multilean container shifts lineStart", () => {
    // Document (Lean format): ```lean\nLemma.\n```  (18 chars)
    // Line 0: ```lean  Line 1: Lemma.  ← code content starts at line 1
    const codeBlock = new CodeBlock(
        "Lemma.",
        { from: 0, to: 18 },   // "```lean\nLemma.\n```"
        { from: 8, to: 14 },   // content (after "```lean\n")
        1                       // lineStart: 1 newline in open tag
    );
    const mapping = createLeanMapping([codeBlock]);

    expect(mapping.getMapping().computeLineNumbers()).toStrictEqual([1]);

    // The code node occupies pmRange {0, 8} (nodeSize = 1+6+1 = 8).
    // wrap(blockRange, [{type: container, attrs:{name:"multilean"}}]) produces:
    //   ReplaceAroundStep(from=0, to=8, gapFrom=0, gapTo=8, slice=container, insert=1)
    const wrapSlice = new Slice(
        Fragment.from([WaterproofSchema.nodes.container.create({ name: "multilean" })]),
        0, 0
    );
    const wrapStep = new ReplaceAroundStep(0, 8, 0, 8, wrapSlice, 1);

    const nodeUpdate = new NodeUpdate(leanConfig, leanSerializer);
    const { newTree, result } = nodeUpdate.nodeUpdate(wrapStep, mapping, leanSerializer, nodeMock);

    sanityCheckTree(newTree.root);

    // The container tags "::::multilean\n" and "\n::::" are inserted at the
    // boundaries of the code block's original file range.
    expect(result).toStrictEqual<WrappingDocChange>({
        firstEdit:  { finalText: "::::multilean\n", startInFile: 0,  endInFile: 0  },
        secondEdit: { finalText: "\n::::",           startInFile: 18, endInFile: 18 },
    });

    // The container open tag adds 1 newline, so the code content now starts at
    // line 2: line 0 = "::::multilean", line 1 = "```lean", line 2 = "Lemma."
    expect(newTree.computeLineNumbers()).toStrictEqual([2]);
});

test("Lift code cell from multilean container restores lineStart", () => {
    // Document (Lean format):
    //   ::::multilean\n```lean\nLemma.\n```\n::::
    //   0             14       22     28   32  37
    // Line 0: ::::multilean  Line 1: ```lean  Line 2: Lemma.  ← lineStart = 2
    const innerCode = new CodeBlock(
        "Lemma.",
        { from: 14, to: 32 },  // tagRange inside container
        { from: 22, to: 28 },  // content range
        2                       // lineStart inside container
    );
    const containerBlock = new ContainerBlock(
        "```lean\nLemma.\n```",
        "multilean",
        { from: 0,  to: 37 },  // full range incl. container tags
        { from: 14, to: 32 },  // inner range (just the code block)
        0,                      // container's own lineStart
        [innerCode]
    );
    const mapping = createLeanMapping([containerBlock]);

    expect(mapping.getMapping().computeLineNumbers()).toStrictEqual([2]);

    // ProseMirror layout for container(code("Lemma.")):
    //   container.pmRange = {0, 10},  prosemirrorStart=1, prosemirrorEnd=9
    //   code.pmRange      = {1,  9},  prosemirrorStart=2, prosemirrorEnd=8
    // wpLift generates:
    //   ReplaceAroundStep(from=container.pmRange.from, to=container.pmRange.to,
    //                     gapFrom=container.prosemirrorStart, gapTo=container.prosemirrorEnd,
    //                     slice=empty, insert=0)
    const liftStep = new ReplaceAroundStep(0, 10, 1, 9, Slice.empty, 0);

    const nodeUpdate = new NodeUpdate(leanConfig, leanSerializer);
    const { newTree, result } = nodeUpdate.nodeUpdate(liftStep, mapping, leanSerializer, nodeMock);

    sanityCheckTree(newTree.root);

    // The container open tag "::::multilean\n" (positions 0–13) and close tag
    // "\n::::" (positions 32–36) are deleted.
    expect(result).toStrictEqual<WrappingDocChange>({
        firstEdit:  { finalText: "", startInFile: 0,  endInFile: 14 },
        secondEdit: { finalText: "", startInFile: 32, endInFile: 37 },
    });

    // After lifting, the code block is directly at the top level:
    //   ```lean\nLemma.\n```  →  line 1 = "Lemma."  →  lineStart = 1
    expect(newTree.computeLineNumbers()).toStrictEqual([1]);
});

test("Lift container: code block after container gets lineStart corrected", () => {
    // Document (Lean format):
    //   ::::multilean\n```lean\nLemma.\n```\n::::\n```lean\nAfter.\n```
    //   0              14      22     28  32  37  38      46     52  56
    // Line 0: ::::multilean  Line 1: ```lean  Line 2: Lemma.
    // Line 3: ``` (from \n in code close tag)  Line 4: :::: (from \n in container close tag)
    // Line 5: ```lean (from \n newline block)  Line 6: After. (from \n in code open tag)
    // Newlines before afterCode open tag (pos 38): at 13,21,28,32,37 = 5 → lineStart = 5+1 = 6
    const innerCode = new CodeBlock(
        "Lemma.",
        { from: 14, to: 32 },  // tagRange inside container
        { from: 22, to: 28 },  // content range
        2                       // lineStart inside container
    );
    const containerBlock = new ContainerBlock(
        "```lean\nLemma.\n```",
        "multilean",
        { from: 0,  to: 37 },
        { from: 14, to: 32 },
        0,
        [innerCode]
    );
    // Newline block between the container and the following code block
    const newlineBlock = new NewlineBlock({ from: 37, to: 38 }, { from: 37, to: 38 }, 0);
    // After code: "```lean\n" (8) + "After." (6) + "\n```" (4) = 18 chars starting at 38
    const afterCode = new CodeBlock(
        "After.",
        { from: 38, to: 56 },
        { from: 46, to: 52 },
        6                       // lineStart: 5 newlines before + 1 in open tag
    );
    const mapping = createLeanMapping([containerBlock, newlineBlock, afterCode]);

    expect(mapping.getMapping().computeLineNumbers()).toStrictEqual([2, 6]);

    // Lift: remove container tags (open = 14 chars / 1 newline, close = 5 chars / 1 newline)
    const liftStep = new ReplaceAroundStep(0, 10, 1, 9, Slice.empty, 0);

    const nodeUpdate = new NodeUpdate(leanConfig, leanSerializer);
    const { newTree } = nodeUpdate.nodeUpdate(liftStep, mapping, leanSerializer, nodeMock);

    sanityCheckTree(newTree.root);

    // Inner code: lineStart reduced by countNewlines(openTag)=1 → lineStart=1
    // After code: lineStart reduced by countNewlines(openTag)+countNewlines(closeTag)=2 → lineStart=4
    expect(newTree.computeLineNumbers()).toStrictEqual([1, 4]);
});

test("Wrapping a hint (with tree-children) in a container does not corrupt the mapping tree", () => {
    // Regression test for a bug where transitive children from a container were not updated in the mapping
    // Document (Lean format): :::hint "💡 Hint"\nHi\n:::

    // leanConfig tags:
    //   hint open:      :::hint "💡 Hint"\n   = 18 chars (💡 = 2 code units in JS)
    //   hint close:     \n:::                 =  4 chars
    //   container open: ::::test\n            =  9 chars
    //   container close:\n::::                =  5 chars
    //   markdown:       no tags
    const hintTitle = "💡 Hint";
    const hintOpenTag  = leanConfig.hint.openTag(hintTitle);   // 18 chars
    const hintCloseTag = leanConfig.hint.closeTag;             //  4 chars
    // "Hi" = 2 chars; total text = 18 + 2 + 4 = 24 chars
    const hintBlock = new HintBlock(
        "Hi", hintTitle,
        { from: 0, to: hintOpenTag.length + 2 + hintCloseTag.length },   // tagRange  {0, 24}
        { from: hintOpenTag.length, to: hintOpenTag.length + 2 },         // innerRange {18, 20}
        0,
        [new MarkdownBlock("Hi",
            { from: hintOpenTag.length, to: hintOpenTag.length + 2 },
            { from: hintOpenTag.length, to: hintOpenTag.length + 2 },
            0)]
    );

    const mapping = createLeanMapping([hintBlock]);

    // Verify the tree was built with hint → markdown as expected
    const treeBeforeWrap = mapping.getMapping();
    const hintNodeBefore = treeBeforeWrap.root.children.find(n => n.type === "hint");
    expect(hintNodeBefore).toBeDefined();
    expect(hintNodeBefore!.children.length).toBe(1);
    expect(hintNodeBefore!.children[0].type).toBe("markdown");

    // PM layout before wrap:
    //   hint:     nodeSize = 1+4+1 = 6  →  pmRange {0, 6}
    //   markdown: nodeSize = 1+2+1 = 4  →  pmRange {1, 5}  (child of hint)
    //
    // ProseMirror's tr.wrap(hint_blockRange, [{type: container, attrs:{name:"test"}}])
    // produces ReplaceAroundStep(from=0, to=6, gapFrom=0, gapTo=6, slice=container, insert=1).
    const containerSlice = new Slice(
        Fragment.from([WaterproofSchema.nodes.container.create({ name: "test" })]),
        0, 0
    );
    const wrapStep = new ReplaceAroundStep(0, 6, 0, 6, containerSlice, 1);

    const nodeUpdate = new NodeUpdate(leanConfig, leanSerializer);
    const { newTree } = nodeUpdate.nodeUpdate(wrapStep, mapping, leanSerializer, nodeMock);

    // sanityCheckTree catches the structural corruption introduced by the bug:
    // with the bug the container's child list is [hint (to=33), markdown (from=27)]
    // and the contiguous-tagRange invariant (nextChild.from === child.to) fails.
    sanityCheckTree(newTree.root);

    // Structural assertions: root → container(1 child) → hint(1 child) → markdown
    expect(newTree.root.children.length).toBe(1);
    const container = newTree.root.children[0];
    expect(container.type).toBe("container");

    // With the bug the container ends up with 2 children (hint + spurious markdown).
    expect(container.children.length).toBe(1);
    const hint = container.children[0];
    expect(hint.type).toBe("hint");

    expect(hint.children.length).toBe(1);
    expect(hint.children[0].type).toBe("markdown");

    // Text-offset sanity: the markdown content sits at
    //   container_open (9) + hint_open (18) = 27 chars into the file.
    const containerOpenLen = leanConfig.container.openTag("test").length;  // 9
    expect(hint.children[0].contentRange.from).toBe(containerOpenLen + hintOpenTag.length);
});

test("regression test: replaceAroundReplace – wrapping a node inside a container updates container close offsets", () => {
    // AI generated test
    // Document (leanConfig):  ::::test\nHi\n::::
    //   [0..8]  containerOpen  "::::test\n"   9 chars
    //   [9..10] "Hi"                           2 chars
    //   [11..15] containerClose "\n::::"       5 chars
    //   total 16 chars
    //
    // PM layout after computeProsemirrorOffsets:
    //   container  pmRange={0,6}  prosemirrorStart=1  prosemirrorEnd=5
    //   markdown   pmRange={1,5}  prosemirrorStart=2  prosemirrorEnd=4
    const hintTitle      = "💡 Hint";
    const containerName  = "test";
    const containerOpen  = leanConfig.container.openTag(containerName); // "::::test\n"  9 chars
    const containerClose = leanConfig.container.closeTag;               // "\n::::"      5 chars
    const hintOpen       = leanConfig.hint.openTag(hintTitle);          // 18 chars
    const hintClose      = leanConfig.hint.closeTag;                    // "\n:::"       4 chars
    const mdContent      = "Hi";                                        // 2 chars

    const containerBlock = new ContainerBlock(
        mdContent, containerName,
        { from: 0, to: containerOpen.length + mdContent.length + containerClose.length },
        { from: containerOpen.length, to: containerOpen.length + mdContent.length },
        0,
        [new MarkdownBlock(mdContent,
            { from: containerOpen.length, to: containerOpen.length + mdContent.length },
            { from: containerOpen.length, to: containerOpen.length + mdContent.length },
            0)]
    );

    const mapping           = createLeanMapping([containerBlock]);
    const tree              = mapping.getMapping();
    const containerNode     = tree.root.children[0];
    const markdownNode      = containerNode.children[0];
    const containerPmToOrig = containerNode.pmRange.to; // capture before mutation (tree is mutated in-place)

    // Wrap the markdown in a hint.
    // ProseMirror's tr.wrap generates ReplaceAroundStep(from, to, gapFrom, gapTo, slice, insert).
    const wrapSlice = new Slice(
        Fragment.from([WaterproofSchema.nodes.hint.create({ title: hintTitle })]),
        0, 0
    );
    const wrapStep = new ReplaceAroundStep(
        markdownNode.pmRange.from, markdownNode.pmRange.to,
        markdownNode.pmRange.from, markdownNode.pmRange.to,
        wrapSlice, 1
    );

    const nodeUpdate    = new NodeUpdate(leanConfig, leanSerializer);
    const { newTree }   = nodeUpdate.nodeUpdate(wrapStep, mapping, leanSerializer, nodeMock);

    // The hint's tags (18 + 4 = 22 chars text, 2 prose tokens) were inserted inside
    // the container.  The container's close offsets must be updated accordingly.
    // Bug: container.pmRange.to stays at 6 while hint.pmRange.to becomes 7 → sanityCheckTree fails.
    sanityCheckTree(newTree.root);

    const updatedContainer = newTree.root.children[0];
    expect(updatedContainer.contentRange.to).toBe(
        containerOpen.length + hintOpen.length + mdContent.length + hintClose.length  // 9+18+2+4=33
    );
    expect(updatedContainer.pmRange.to).toBe(containerPmToOrig + 2);
});

test("regression test: replaceAroundDelete – unwrapping a hint inside a container updates container close offsets", () => {
    // AI-generated test
    // Document (leanConfig):  ::::test\n:::hint "💡 Hint"\nHi\n:::\n::::
    //   [0..8]   containerOpen  "::::test\n"            9 chars
    //   [9..26]  hintOpen       ":::hint \"💡 Hint\"\n" 18 chars
    //   [27..28] "Hi"                                    2 chars
    //   [29..32] hintClose      "\n:::"                  4 chars
    //   [33..37] containerClose "\n::::"                  5 chars
    //   total 38 chars
    //
    // PM layout:
    //   container  pmRange={0,8}  prosemirrorStart=1  prosemirrorEnd=7
    //   hint       pmRange={1,7}  prosemirrorStart=2  prosemirrorEnd=6
    //   markdown   pmRange={2,6}  prosemirrorStart=3  prosemirrorEnd=5
    const hintTitle      = "💡 Hint";
    const containerName  = "test";
    const containerOpen  = leanConfig.container.openTag(containerName); // 9 chars
    const containerClose = leanConfig.container.closeTag;               // 5 chars
    const hintOpen       = leanConfig.hint.openTag(hintTitle);          // 18 chars
    const hintClose      = leanConfig.hint.closeTag;                    //  4 chars
    const mdContent      = "Hi";                                        //  2 chars

    const hintTagFrom     = containerOpen.length;                                                       // 9
    const hintContentFrom = containerOpen.length + hintOpen.length;                                     // 27
    const hintContentTo   = hintContentFrom + mdContent.length;                                         // 29
    const hintTagTo       = hintContentTo + hintClose.length;                                           // 33
    const containerTagTo  = hintTagTo + containerClose.length;                                          // 38

    const markdownBlock = new MarkdownBlock(
        mdContent,
        { from: hintContentFrom, to: hintContentTo },
        { from: hintContentFrom, to: hintContentTo },
        0
    );
    const hintBlock = new HintBlock(
        mdContent, hintTitle,
        { from: hintTagFrom,       to: hintTagTo       },
        { from: hintContentFrom,   to: hintContentTo   },
        0, [markdownBlock]
    );
    const containerBlock = new ContainerBlock(
        hintOpen + mdContent + hintClose, containerName,
        { from: 0,                       to: containerTagTo           },
        { from: containerOpen.length,    to: hintTagTo                },
        0, [hintBlock]
    );

    const mapping         = createLeanMapping([containerBlock]);
    const tree            = mapping.getMapping();
    const containerNode   = tree.root.children[0];
    const hintNode        = containerNode.children[0];
    const containerPmTo   = containerNode.pmRange.to; // 8 – capture before mutation

    expect(hintNode.type).toBe("hint");

    // wpLift generates ReplaceAroundStep(from, to, gapFrom=prosemirrorStart, gapTo=prosemirrorEnd, empty, 0).
    const liftStep = new ReplaceAroundStep(
        hintNode.pmRange.from,      // 1
        hintNode.pmRange.to,        // 7
        hintNode.prosemirrorStart,  // 2
        hintNode.prosemirrorEnd,    // 6
        Slice.empty, 0
    );

    const nodeUpdate          = new NodeUpdate(leanConfig, leanSerializer);
    const { newTree, result } = nodeUpdate.nodeUpdate(liftStep, mapping, leanSerializer, nodeMock);

    // After lifting, the container shrinks by the hint's tag sizes (22 chars / 2 prose tokens).
    // Bug: container's contentRange.to / pmRange.to are not decremented → sanityCheckTree fails.
    sanityCheckTree(newTree.root);

    const updatedContainer = newTree.root.children[0];
    expect(updatedContainer.contentRange).toStrictEqual({
        from: containerOpen.length,
        to:   containerOpen.length + mdContent.length,   // 9..11
    });
    expect(updatedContainer.tagRange.to).toBe(containerOpen.length + mdContent.length + containerClose.length); // 16
    expect(updatedContainer.pmRange.to).toBe(containerPmTo - 2);  // 8-2=6

    expect(result).toStrictEqual<WrappingDocChange>({
        firstEdit:  { finalText: "", startInFile: hintTagFrom,     endInFile: hintContentFrom },
        secondEdit: { finalText: "", startInFile: hintContentTo,   endInFile: hintTagTo       },
    });
});

test("regression test: replaceDelete does not include a node whose opening tag lies outside the step range", () => {
    // AI-generated test
    // Setup: markdown (pmRange={0,7}) followed by a code block (pmRange={7,15}).
    //   markdown  contentRange={0,5}  tagRange={0,5}
    //   code      contentRange={12,18} tagRange={5,22}  (coq config: "```coq\n"=7 + "Lemma."=6 + "\n```"=4 = 17 chars → tagRange={5,22})
    //
    // PM layout:
    //   markdown  pmRange={0,7}   prosemirrorStart=1   prosemirrorEnd=6
    //   code      pmRange={7,15}  prosemirrorStart=8   prosemirrorEnd=14
    //
    // The step starts at code.prosemirrorStart=8 (one past code.pmRange.from=7).
    // The code node's opening tag occupies positions [7,8) in prose / [5,12) in text.
    // Since the opening tag is outside [step.from=8, step.to=15), the code node
    // should NOT be considered fully contained in the deleted range.
    //
    // Bug:  prosemirrorStart(8) >= step.from(8) is true  → code is wrongly included.
    // Fix:  pmRange.from(7)     >= step.from(8) is false → code is correctly excluded,
    //       nodesToDelete is empty → NodeUpdateError is thrown.
    const blocks: WaterproofDocument = [
        new MarkdownBlock("Hello", { from: 0, to: 5 }, { from: 0, to: 5 }, 0),
        new CodeBlock("Lemma.", { from: 5, to: 22 }, { from: 12, to: 18 }, 1),
    ];

    const mapping  = createMapping(blocks);
    const tree     = mapping.getMapping();
    const codeNode = tree.root.children.find(n => n.type === "code")!;

    // step.from is deliberately set to prosemirrorStart, NOT pmRange.from
    const step = new ReplaceStep(codeNode.prosemirrorStart, codeNode.pmRange.to, Slice.empty);

    configureNodeMock("");
    const nodeUpdate = new NodeUpdate(config, serializer);

    expect(() => nodeUpdate.nodeUpdate(step, mapping, serializer, nodeMock)).toThrow(NodeUpdateError);
});