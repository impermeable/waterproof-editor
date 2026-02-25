import { Mapping, Range, WaterproofDocument } from "../../src/api";
import { CodeBlock, HintBlock, InputAreaBlock, MarkdownBlock, NewlineBlock } from "../../src/document";
import { configuration } from "../../src/markdown-defaults";
import { DefaultTagSerializer } from "../../src/serialization/DocumentSerializer";

const config = configuration("lang");
const serializer = new DefaultTagSerializer(config);

function createTestMapping(blocks: WaterproofDocument) {
    const mapping = new Mapping(blocks, 1, config, serializer)
    const tree = mapping.getMapping();
    return tree;
}

const PLACEHOLDER_LINENR = 0;

test("testMapping markdown only", () => {
    const blocks = [new MarkdownBlock("Hello", {from: 0, to: 5}, {from: 0, to: 5}, 0)];
    const nodes = createTestMapping(blocks);

    expect(nodes.root.type).toBe("");

    expect(nodes.root.children.length).toBe(1);
    const markdownNode = nodes.root.children[0];

    expect(markdownNode.type).toBe("markdown");
    expect(markdownNode.contentRange).toStrictEqual<Range>({from: 0, to: 5});
    expect(markdownNode.tagRange).toStrictEqual<Range>({from: 0, to: 5});
    expect(markdownNode.prosemirrorStart).toBe(1);
    expect(markdownNode.prosemirrorEnd).toBe(6);
    expect(markdownNode.pmRange).toStrictEqual<Range>({from: 0, to: 7});
    expect(markdownNode.lineStart).toBe(0);
});

test("testMapping code", () => {
    const blocks = [new CodeBlock("Lemma test", {from: 0, to: 21}, {from: 7, to: 17}, 0)];
    const nodes = createTestMapping(blocks).root.children;
    
    expect(nodes.length).toBe(1);
    
    const codeNode = nodes[0];
    expect(codeNode.type).toBe("code");
    expect(codeNode.contentRange).toStrictEqual<Range>({from: 7, to: 17});
    expect(codeNode.tagRange).toStrictEqual<Range>({from: 0, to: 21});
    expect(codeNode.prosemirrorStart).toBe(1);
    expect(codeNode.prosemirrorEnd).toBe(11);
    expect(codeNode.pmRange).toStrictEqual<Range>({from: 0, to: 12});
    expect(codeNode.lineStart).toBe(0);
});

// TODO: Test for line nrs
test("Input-area with nested code", () => {
    // <input-area>\n```lan\nTest\n```\n</input-area>Hello
    const blocks = [
        new InputAreaBlock("```lan\nTest\n```", {from: 0, to: 42}, {from: 12, to: 29}, PLACEHOLDER_LINENR, [
            new NewlineBlock({from: 12, to: 13}, {from: 12, to: 13}, PLACEHOLDER_LINENR),
            new CodeBlock("Test", {from: 13, to: 28}, {from: 20, to: 24}, PLACEHOLDER_LINENR),
            new NewlineBlock({from: 28, to: 29}, {from: 28, to: 29}, PLACEHOLDER_LINENR)
        ]),
        new MarkdownBlock("Hello", {from: 42, to: 47}, {from: 42, to: 47}, PLACEHOLDER_LINENR)
    ];
    const nodes = createTestMapping(blocks).root.children;

    expect(nodes.length).toBe(2);
    
    // Input-area node
    const inputAreaNode = nodes[0];
    expect(inputAreaNode.type).toBe("input");
    expect(inputAreaNode.contentRange.from).toBe(12);
    expect(inputAreaNode.contentRange.to).toBe(29);
    expect(inputAreaNode.prosemirrorStart).toBe(1); 
    expect(inputAreaNode.prosemirrorEnd).toBe(9); 

    // Markdown node
    const markdownNode = nodes[1];
    expect(markdownNode.type).toBe("markdown");
    expect(markdownNode.contentRange).toStrictEqual<Range>({from: 42, to: 47});
    expect(markdownNode.tagRange).toStrictEqual<Range>({from: 42, to: 47});
    expect(markdownNode.prosemirrorStart).toBe(11); 
    expect(markdownNode.prosemirrorEnd).toBe(16);

    // Should be 3 children in the input area: newline, coqblock, newline
    expect(inputAreaNode.children.length).toBe(3);
    const [first, second, third] = inputAreaNode.children;
    
    expect(first.type).toBe("newline");
    expect(first.contentRange).toStrictEqual<Range>({from: 12, to: 13});
    expect(first.tagRange).toStrictEqual<Range>({from: 12, to: 13});
    expect(first.prosemirrorStart).toBe(1);
    expect(first.prosemirrorEnd).toBe(1);
    expect(first.pmRange).toStrictEqual<Range>({from: 1, to: 2});

    expect(second.type).toBe("code");
    expect(second.contentRange).toStrictEqual<Range>({from: 20, to: 24});
    expect(second.tagRange).toStrictEqual<Range>({from: 13, to: 28});
    expect(second.prosemirrorStart).toBe(3);
    expect(second.prosemirrorEnd).toBe(7);
    expect(second.pmRange).toStrictEqual<Range>({from: 2, to: 8});
    
    expect(third.type).toBe("newline");
    expect(third.contentRange).toStrictEqual<Range>({from: 28, to: 29});
    expect(third.tagRange).toStrictEqual<Range>({from: 28, to: 29});
    expect(third.prosemirrorStart).toBe(8);
    expect(third.prosemirrorEnd).toBe(8);
    expect(third.pmRange).toStrictEqual<Range>({from: 8, to: 9});
});

// TODO: Test for line nrs
test("Hint block with code and markdown inside", () => {
    // <hint title=\"Import libraries\">\n```lan\nRequire Import Rbase.\n```\n</hint>
    const blocks = [
        new HintBlock("\n```lan\nRequire Import Rbase.\n```\n", "Import libraries", {from: 0, to: 72}, {from: 31, to: 65}, PLACEHOLDER_LINENR, [
            new NewlineBlock({from: 31, to: 32}, {from: 31, to: 32}, PLACEHOLDER_LINENR),
            new CodeBlock("Require Import Rbase.", {from: 32, to: 64}, {from: 39, to: 60}, PLACEHOLDER_LINENR),
            new NewlineBlock({from: 60, to: 61}, {from: 60, to: 61}, PLACEHOLDER_LINENR)
        ])
    ];

    const nodes = createTestMapping(blocks).root.children;
    
    expect(nodes.length).toBe(1);

    // Hint node
    const hintNode = nodes[0];
    expect(hintNode.type).toBe("hint");
    expect(hintNode.contentRange).toStrictEqual<Range>({from: 31, to: 65});
    expect(hintNode.tagRange).toStrictEqual<Range>({from: 0, to: 72});
    expect(hintNode.prosemirrorStart).toBe(1);
    expect(hintNode.prosemirrorEnd).toBe(26);
    expect(hintNode.pmRange).toStrictEqual<Range>({from: 0, to: 27});
    
    // Should be 3 children in the hint: newline, code, newline
    expect(hintNode.children.length).toBe(3);
    const [first, second, third] = hintNode.children;
    
    expect(first.type).toBe("newline");
    expect(first.contentRange).toStrictEqual<Range>({from: 31, to: 32});
    expect(first.tagRange).toStrictEqual<Range>({from: 31, to: 32});
    expect(first.prosemirrorStart).toBe(1);
    expect(first.prosemirrorEnd).toBe(1);
    expect(first.pmRange).toStrictEqual<Range>({from: 1, to: 2});
    
    expect(second.type).toBe("code");
    expect(second.contentRange).toStrictEqual<Range>({from: 39, to: 60});
    expect(second.tagRange).toStrictEqual<Range>({from: 32, to: 64});
    expect(second.prosemirrorStart).toBe(3);
    expect(second.prosemirrorEnd).toBe(24);
    expect(second.pmRange).toStrictEqual<Range>({from: 2, to: 25});
    
    expect(third.type).toBe("newline");
    expect(third.contentRange).toStrictEqual<Range>({from: 60, to: 61});
    expect(third.tagRange).toStrictEqual<Range>({from: 60, to: 61});
    expect(third.prosemirrorStart).toBe(25);
    expect(third.prosemirrorEnd).toBe(25);
    expect(third.pmRange).toStrictEqual<Range>({from: 25, to: 26});
});

// TODO: Test for line nrs
test("Mixed content: markdown, code, input-area, markdown", () => {
    // ### Example:\n```lan\nLemma\nTest\n```\n<input-area>\n```lan\n(* Your solution here *)\n```\n</input-area>
    const blocks = [
        new MarkdownBlock("### Example:", {from: 0, to: 12}, {from: 0, to: 12}, PLACEHOLDER_LINENR),
        new NewlineBlock({from: 12, to: 13}, {from: 12, to: 13}, PLACEHOLDER_LINENR),
        new CodeBlock("Lemma\nTest", {from: 13, to: 34}, {from: 20, to: 30}, PLACEHOLDER_LINENR),
        new NewlineBlock({from: 34, to: 35}, {from: 34, to: 35}, PLACEHOLDER_LINENR),
        new InputAreaBlock("```lan\n(* Your solution here *)\n```", {from: 35, to: 97}, {from: 47, to: 84}, PLACEHOLDER_LINENR, [
            new NewlineBlock({from: 47, to: 48}, {from: 47, to: 48}, PLACEHOLDER_LINENR),
            new CodeBlock("(* Your solution here *)", {from: 48, to: 83}, {from: 55, to: 79}, PLACEHOLDER_LINENR),
            new NewlineBlock({from: 83, to: 84}, {from: 83, to: 84}, PLACEHOLDER_LINENR)
        ])
    ];
    const nodes = createTestMapping(blocks).root.children;

    expect(nodes.length).toBe(5);

    const [md1, nl1, code1, nl2, ia] = nodes;

    // Markdown node
    expect(md1.type).toBe("markdown");
    expect(md1.contentRange).toStrictEqual<Range>({from: 0, to: 12});
    expect(md1.tagRange).toStrictEqual<Range>({from: 0, to: 12});
    expect(md1.prosemirrorStart).toBe(1);
    expect(md1.prosemirrorEnd).toBe(13);
    expect(md1.pmRange).toStrictEqual<Range>({from: 0, to: 14});

    // Newline node
    expect(nl1.type).toBe("newline");
    expect(nl1.contentRange).toStrictEqual<Range>({from: 12, to: 13});
    expect(nl1.tagRange).toStrictEqual<Range>({from: 12, to: 13});
    expect(nl1.prosemirrorStart).toBe(14);
    expect(nl1.prosemirrorEnd).toBe(14);
    expect(nl1.pmRange).toStrictEqual<Range>({from: 14, to: 15});

    // Code node
    expect(code1.type).toBe("code");
    expect(code1.contentRange).toStrictEqual<Range>({from: 20, to: 30});
    expect(code1.tagRange).toStrictEqual<Range>({from: 13, to: 34});
    expect(code1.prosemirrorStart).toBe(16);
    expect(code1.prosemirrorEnd).toBe(26);
    expect(code1.pmRange).toStrictEqual<Range>({from: 15, to: 27});

    // Newline node
    expect(nl2.type).toBe("newline");
    expect(nl2.contentRange).toStrictEqual<Range>({from: 34, to: 35});
    expect(nl2.tagRange).toStrictEqual<Range>({from: 34, to: 35});
    expect(nl2.prosemirrorStart).toBe(27);
    expect(nl2.prosemirrorEnd).toBe(27);
    expect(nl2.pmRange).toStrictEqual<Range>({from: 27, to: 28});

    // Input-area node
    expect(ia.type).toBe("input");
    expect(ia.contentRange).toStrictEqual<Range>({from: 47, to: 84});
    expect(ia.tagRange).toStrictEqual<Range>({from: 35, to: 97});
    expect(ia.prosemirrorStart).toBe(29);
    expect(ia.prosemirrorEnd).toBe(57);
    expect(ia.pmRange).toStrictEqual<Range>({from: 28, to: 58});
    
    // The input area should have 3 children: newline, code, newline
    expect(ia.children.length).toBe(3);
    const [ia_nl1, ia_code, ia_nl2] = ia.children;
    
    expect(ia_nl1.type).toBe("newline");
    expect(ia_nl1.contentRange).toStrictEqual<Range>({from: 47, to: 48});
    expect(ia_nl1.tagRange).toStrictEqual<Range>({from: 47, to: 48});
    expect(ia_nl1.prosemirrorStart).toBe(29);
    expect(ia_nl1.prosemirrorEnd).toBe(29);
    expect(ia_nl1.pmRange).toStrictEqual<Range>({from: 29, to: 30});
    
    expect(ia_code.type).toBe("code");
    expect(ia_code.contentRange).toStrictEqual<Range>({from: 55, to: 79});
    expect(ia_code.tagRange).toStrictEqual<Range>({from: 48, to: 83});
    expect(ia_code.prosemirrorStart).toBe(31);
    expect(ia_code.prosemirrorEnd).toBe(55);
    expect(ia_code.pmRange).toStrictEqual<Range>({from: 30, to: 56});
    
    expect(ia_nl2.type).toBe("newline");
    expect(ia_nl2.contentRange).toStrictEqual<Range>({from: 83, to: 84});
    expect(ia_nl2.tagRange).toStrictEqual<Range>({from: 83, to: 84});
    expect(ia_nl2.prosemirrorStart).toBe(56);
    expect(ia_nl2.prosemirrorEnd).toBe(56);
    expect(ia_nl2.pmRange).toStrictEqual<Range>({from: 56, to: 57});
});

test("Empty codeblock", () => {
    // ```lan\n\n```
    const blocks = [new CodeBlock("", {from: 0, to: 11}, {from: 7, to: 7}, 0)];
    const nodes = createTestMapping(blocks).root.children;
    expect(nodes.length).toBe(1);
    
    const code = nodes[0];
    expect(code.type).toBe("code");
    expect(code.contentRange).toStrictEqual<Range>({from: 7, to: 7});
    expect(code.tagRange).toStrictEqual<Range>({from: 0, to: 11});
    expect(code.prosemirrorStart).toBe(1);
    expect(code.prosemirrorEnd).toBe(1);
    expect(code.pmRange).toStrictEqual<Range>({from: 0, to: 2});
    expect(code.lineStart).toBe(0);
});