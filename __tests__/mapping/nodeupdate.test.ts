import { Fragment, ResolvedPos, Slice } from "prosemirror-model";
import { DocChange, Mapping, WaterproofDocument, WrappingDocChange } from "../../src/api";
import { configuration } from "../../src/markdown-defaults";
import { ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";
import { WaterproofSchema } from "../../src/schema";
import { NodeUpdate } from "../../src/mapping/nodeUpdate";
import { CodeBlock, HintBlock, InputAreaBlock, MarkdownBlock, NewlineBlock } from "../../src/document";
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

test("Insert code underneath markdown", () => {
    // # Hello
    const mapping = createMapping([new MarkdownBlock("# Hello", {from: 0, to: 7}, {from: 0, to: 7}, 0)]);
    const slice: Slice = new Slice(Fragment.from([WaterproofSchema.nodes.newline.create(), WaterproofSchema.nodes.code.create()]), 0, 0);
    const step: ReplaceStep = new ReplaceStep(9, 9, slice);

    const nodeUpdate = new NodeUpdate(config, serializer);
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, "# Hello", serializer, nodeMock);

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
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, "<input-area># Hello</input-area>", serializer, nodeMock);
    console.log(JSON.stringify(newTree.root, null, " "))
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
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, "", serializer, nodeMock);
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
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, "", serializer, nodeMock);
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
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, "", serializer, nodeMock);
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
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, "", serializer, nodeMock);
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
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, "", serializer, nodeMock);
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
    const { newTree, result } = nodeUpdate.nodeUpdate(step, mapping, "", serializer, nodeMock);

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
    const { newTree, result } = nodeUpdate.nodeUpdate(step, mapping, "", serializer, nodeMock);

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
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, "", serializer, nodeMock);
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
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, "", serializer, nodeMock);
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
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, "", serializer, nodeMock);
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
    const {newTree, result} = nodeUpdate.nodeUpdate(step, mapping, "# Hello", serializer, nodeMock);
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
    const {newTree} = nodeUpdate.nodeUpdate(step, mapping, "# Hello\n# World", serializer, nodeMock);

    // The serialized doc has 1 newline before the insertion point (documentPos=15).
    // The inserted newline adds 1 more → lineCounter=2 when the code node is built.
    // The code open tag ("```coq\n") adds 1 more → contentLineStart=3.
    expect(newTree.computeLineNumbers()).toStrictEqual([3]);
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
    const {newTree} = nodeUpdate.nodeUpdate(step, mapping, "Hello\n```coq\nCode\n```", serializer, nodeMock);

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
    nodeUpdate.nodeUpdate(
        deleteStep, mapping, "```coq\nCode\n```\n# Hello", serializer, nodeMock
    );

    // Step 2: Undo — reinsert the code block at position 0.
    // The inverse of ReplaceStep(0, 6, empty) is ReplaceStep(0, 0, original_slice).
    const undoSlice = new Slice(Fragment.from([
        WaterproofSchema.nodes.code.create(null,
            Fragment.from([WaterproofSchema.text("Code")])
        ),
    ]), 0, 0);
    const undoStep = new ReplaceStep(0, 0, undoSlice);

    const { newTree, result } = nodeUpdate.nodeUpdate(
        undoStep, mapping, "# Hello", serializer, nodeMock
    );

    sanityCheckTree(newTree.root);

    expect(result).toStrictEqual<DocChange>({
        finalText: "```coq\nCode\n```",
        startInFile: 0,
        endInFile: 0
    });
});