import { parse } from "../src/markdown-defaults";
import {
    isMarkdownBlock, isCodeBlock, isHintBlock, isInputAreaBlock,
    isMathDisplayBlock, isNewlineBlock, isCodeGroupBlock
} from "../src/document/blocks";
import { HintBlock, CodeGroupBlock } from "../src/document";
import { Mapping, Range, WaterproofDocument } from "../src/api";
import { CodeBlock, InputAreaBlock, MarkdownBlock, MathDisplayBlock, NewlineBlock } from "../src/document";
import { configuration } from "../src/markdown-defaults";
import { DefaultTagSerializer } from "../src/serialization/DocumentSerializer";
import { constructDocument } from "../src/document";
import { sanityCheckTree } from "./mapping/util";
import { TagConfiguration } from "../src/api";
import { wrapInCodeGroup, wpLift } from "../src/commands";
import { EditorState, NodeSelection } from "prosemirror-state";
import { WaterproofSchema } from "../src/schema";
import { checkInputArea } from "../src/commands/command-helpers";

const config = configuration("lean4");
const serializer = new DefaultTagSerializer(config);

const multileanConfig: TagConfiguration = {
    ...config,
    codeGroup: {
        openTag: "::::multilean\n", closeTag: "\n::::",
        openRequiresNewline: false, closeRequiresNewline: false,
    }
};
const multileanSerializer = new DefaultTagSerializer(multileanConfig);

function createTestMapping(blocks: WaterproofDocument) {
    const mapping = new Mapping(blocks, 1, config, serializer);
    return mapping.getMapping();
}

// ============================================================
// Parsing tests — the .mv parser (statemachine.ts) does not
// handle code_group; parsing is handled in waterproof-vscode.
// ============================================================

describe("code_group parsing (not supported by .mv parser)", () => {
    test("parser does not recognize code_group syntax", () => {
        const doc = `::::multilean
Some markdown content
::::`;
        const blocks = parse(doc, { language: "lean4" });
        // Should be parsed as plain markdown, not as a code_group
        expect(blocks.every(b => !isCodeGroupBlock(b))).toBe(true);
        expect(isMarkdownBlock(blocks[0])).toBe(true);
    });
});

// ============================================================
// Serialization tests — with empty tags, code_group serializes
// transparently (just the inner content, no wrapper).
// ============================================================

describe("code_group serialization", () => {
    test("serialize code_group with markdown", () => {
        const innerBlocks = [
            new MarkdownBlock("Some text", { from: 14, to: 23 }, { from: 14, to: 23 }, 0)
        ];
        const cg = new CodeGroupBlock(
            "Some text",
            { from: 0, to: 28 }, { from: 14, to: 23 }, 0,
            innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = serializer.serializeDocument(doc);
        expect(result).toBe("Some text");
    });

    test("serialize code_group with code block", () => {
        const innerBlocks = [
            new CodeBlock("def x := 1", { from: 14, to: 37 }, { from: 21, to: 31 }, 0)
        ];
        const cg = new CodeGroupBlock(
            "```lean4\ndef x := 1\n```",
            { from: 0, to: 42 }, { from: 14, to: 37 }, 0,
            innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = serializer.serializeDocument(doc);
        expect(result).toBe("```lean4\ndef x := 1\n```");
    });

    test("serialize code_group with input area", () => {
        const inputInnerBlocks = [
            new MarkdownBlock("input text", { from: 26, to: 36 }, { from: 26, to: 36 }, 0)
        ];
        const innerBlocks = [
            new InputAreaBlock(
                "input text",
                { from: 14, to: 49 }, { from: 26, to: 36 }, 0,
                inputInnerBlocks
            )
        ];
        const cg = new CodeGroupBlock(
            "<input-area>input text</input-area>",
            { from: 0, to: 54 }, { from: 14, to: 49 }, 0,
            innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = serializer.serializeDocument(doc);
        expect(result).toBe("<input-area>input text</input-area>");
    });

    test("serialize code_group with hint", () => {
        const hintInnerBlocks = [
            new MarkdownBlock("hint text", { from: 40, to: 49 }, { from: 40, to: 49 }, 0)
        ];
        const innerBlocks = [
            new HintBlock(
                "hint text",
                "My Hint",
                { from: 14, to: 56 }, { from: 40, to: 49 }, 0,
                hintInnerBlocks
            )
        ];
        const cg = new CodeGroupBlock(
            '<hint title="My Hint">hint text</hint>',
            { from: 0, to: 61 }, { from: 14, to: 52 }, 0,
            innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = serializer.serializeDocument(doc);
        expect(result).toBe('<hint title="My Hint">hint text</hint>');
    });

    test("serialize code_group with math_display", () => {
        const innerBlocks = [
            new MathDisplayBlock("x^2", { from: 14, to: 21 }, { from: 16, to: 19 }, 0)
        ];
        const cg = new CodeGroupBlock(
            "$$x^2$$",
            { from: 0, to: 26 }, { from: 14, to: 21 }, 0,
            innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = serializer.serializeDocument(doc);
        expect(result).toBe("$$x^2$$");
    });

    test("serialize code_group with non-empty tags (multilean)", () => {
        const innerBlocks = [
            new MarkdownBlock("Some content", { from: 14, to: 26 }, { from: 14, to: 26 }, 0)
        ];
        const cg = new CodeGroupBlock(
            "Some content",
            { from: 0, to: 31 }, { from: 14, to: 26 }, 0,
            innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = multileanSerializer.serializeDocument(doc);
        expect(result).toBe("::::multilean\nSome content\n::::");
    });

    test("serialize code_group with multiple children", () => {
        const innerBlocks = [
            new MarkdownBlock("intro", { from: 14, to: 19 }, { from: 14, to: 19 }, 0),
            new CodeBlock("def x := 1", { from: 19, to: 42 }, { from: 26, to: 36 }, 0),
        ];
        const cg = new CodeGroupBlock(
            "intro```lean4\ndef x := 1\n```",
            { from: 0, to: 47 }, { from: 14, to: 42 }, 0,
            innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = serializer.serializeDocument(doc);
        expect(result).toBe("intro```lean4\ndef x := 1\n```");
    });
});

// ============================================================
// Mapping tests
// ============================================================

describe("code_group mapping", () => {
    test("mapping with code_group containing markdown", () => {
        const cg = new CodeGroupBlock(
            "Hello",
            { from: 0, to: 24 },
            { from: 14, to: 19 },
            0,
            [new MarkdownBlock("Hello", { from: 14, to: 19 }, { from: 14, to: 19 }, 0)]
        );
        const tree = createTestMapping([cg]);

        expect(tree.root.children.length).toBe(1);
        const cgNode = tree.root.children[0];
        expect(cgNode.type).toBe("code_group");
        expect(cgNode.children.length).toBe(1);
        expect(cgNode.children[0].type).toBe("markdown");

        sanityCheckTree(tree.root);
    });

    test("mapping with code_group containing input area with code", () => {
        const codeInner = new CodeBlock("code", { from: 12, to: 25 }, { from: 19, to: 23 }, 0);
        const inputInner = new InputAreaBlock(
            "```lean4\ncode\n```",
            { from: 0, to: 38 }, { from: 12, to: 25 }, 0,
            [codeInner]
        );
        const cg = new CodeGroupBlock(
            "<input-area>```lean4\ncode\n```</input-area>",
            { from: 0, to: 43 }, { from: 0, to: 38 }, 0,
            [inputInner]
        );

        const tree = createTestMapping([cg]);

        expect(tree.root.children.length).toBe(1);
        const cgNode = tree.root.children[0];
        expect(cgNode.type).toBe("code_group");
        expect(cgNode.children.length).toBe(1);

        const inputNode = cgNode.children[0];
        expect(inputNode.type).toBe("input");

        sanityCheckTree(tree.root);
    });

    test("mapping with code_group containing hint", () => {
        const hintInnerBlocks = [
            new MarkdownBlock("hint body", { from: 36, to: 45 }, { from: 36, to: 45 }, 0)
        ];
        const hintBlock = new HintBlock(
            "hint body",
            "Test",
            { from: 14, to: 52 },
            { from: 36, to: 45 },
            0,
            hintInnerBlocks
        );
        const cg = new CodeGroupBlock(
            '<hint title="Test">hint body</hint>',
            { from: 0, to: 57 },
            { from: 14, to: 52 },
            0,
            [hintBlock]
        );
        const tree = createTestMapping([cg]);

        const cgNode = tree.root.children[0];
        expect(cgNode.type).toBe("code_group");
        expect(cgNode.children.length).toBe(1);

        const hintNode = cgNode.children[0];
        expect(hintNode.type).toBe("hint");
        expect(hintNode.title).toBe("Test");
        expect(hintNode.children.length).toBe(1);
        expect(hintNode.children[0].type).toBe("markdown");

        sanityCheckTree(tree.root);
    });
});

// ============================================================
// ProseMirror document construction tests
// ============================================================

describe("code_group ProseMirror construction", () => {
    test("constructDocument with code_group", () => {
        const innerBlocks = [
            new MarkdownBlock("text", { from: 14, to: 18 }, { from: 14, to: 18 }, 0)
        ];
        const cg = new CodeGroupBlock(
            "text", { from: 0, to: 23 }, { from: 14, to: 18 }, 0, innerBlocks
        );
        const doc = constructDocument([cg]);
        expect(doc.type.name).toBe("doc");
        expect(doc.content.childCount).toBe(1);
        expect(doc.content.firstChild!.type.name).toBe("code_group");
        expect(doc.content.firstChild!.content.childCount).toBe(1);
        expect(doc.content.firstChild!.content.firstChild!.type.name).toBe("markdown");
    });

    test("constructDocument with code_group containing input", () => {
        const inputInner = [
            new MarkdownBlock("answer", { from: 26, to: 32 }, { from: 26, to: 32 }, 0)
        ];
        const input = new InputAreaBlock(
            "answer", { from: 14, to: 45 }, { from: 26, to: 32 }, 0, inputInner
        );
        const cg = new CodeGroupBlock(
            "<input-area>answer</input-area>",
            { from: 0, to: 50 }, { from: 14, to: 45 }, 0,
            [input]
        );
        const doc = constructDocument([cg]);

        const cgNode = doc.content.firstChild!;
        expect(cgNode.type.name).toBe("code_group");
        expect(cgNode.content.childCount).toBe(1);

        const inputNode = cgNode.content.firstChild!;
        expect(inputNode.type.name).toBe("input");
        expect(inputNode.content.childCount).toBe(1);
        expect(inputNode.content.firstChild!.type.name).toBe("markdown");
    });
});

// ============================================================
// Typeguard tests
// ============================================================

describe("code_group typeguard", () => {
    test("isCodeGroupBlock identifies correctly", () => {
        const cg = new CodeGroupBlock("", { from: 0, to: 0 }, { from: 0, to: 0 }, 0, []);
        expect(isCodeGroupBlock(cg)).toBe(true);
        expect(isInputAreaBlock(cg)).toBe(false);
        expect(isHintBlock(cg)).toBe(false);
        expect(isCodeBlock(cg)).toBe(false);
        expect(isMarkdownBlock(cg)).toBe(false);
        expect(isMathDisplayBlock(cg)).toBe(false);
        expect(isNewlineBlock(cg)).toBe(false);
    });
});

// ============================================================
// Rocq context tests (code_group serializes transparently)
// ============================================================

describe("code_group Rocq context", () => {
    test("serializer serializes code_group transparently in Rocq config", () => {
        const rocqConfig = configuration("coq");
        const rocqSerializer = new DefaultTagSerializer(rocqConfig);

        const innerBlocks = [
            new MarkdownBlock("text", { from: 14, to: 18 }, { from: 14, to: 18 }, 0)
        ];
        const cg = new CodeGroupBlock(
            "text", { from: 0, to: 23 }, { from: 14, to: 18 }, 0, innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = rocqSerializer.serializeDocument(doc);
        expect(result).toBe("text");
    });
});

// ============================================================
// Command tests
// ============================================================

/**
 * @jest-environment jsdom
 */
describe("wrapInCodeGroup command", () => {
    function makeStateWithMarkdown(): EditorState {
        const mdNode = WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text("hello"));
        const doc = WaterproofSchema.nodes.doc.create({}, mdNode);
        const state = EditorState.create({ doc });
        // Select the markdown node
        return state.apply(state.tr.setSelection(NodeSelection.create(state.doc, 0)));
    }

    test("wrapInCodeGroup wraps selected node in a code_group", () => {
        const state = makeStateWithMarkdown();
        let newState: EditorState | null = null;
        const cmd = wrapInCodeGroup(config);
        cmd(state, (tr) => { newState = state.apply(tr); });

        expect(newState).not.toBeNull();
        const doc = newState!.doc;
        expect(doc.firstChild!.type.name).toBe("code_group");
        expect(doc.firstChild!.firstChild!.type.name).toBe("markdown");
    });

    test("wrapInCodeGroup dry-run (no dispatch) returns true when node is selected", () => {
        // Per ProseMirror convention, returning true without dispatch means "I can execute".
        const state = makeStateWithMarkdown();
        const cmd = wrapInCodeGroup(config);
        const result = cmd(state, undefined);
        expect(result).toBe(true);
    });
});

describe("wpLift from code_group", () => {
    test("wpLift lifts child out of code_group", () => {
        const mdNode = WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text("hello"));
        const cgNode = WaterproofSchema.nodes.code_group.create({}, mdNode);
        const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
        // Select the code_group node
        const state = EditorState.create({ doc });
        const stateWithSel = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, 0)));

        let newState: EditorState | null = null;
        const cmd = wpLift(config);
        cmd(stateWithSel, (tr) => { newState = stateWithSel.apply(tr); });

        expect(newState).not.toBeNull();
        // After lifting, the markdown should be at doc level (no code_group wrapper)
        expect(newState!.doc.firstChild!.type.name).toBe("markdown");
    });
});

describe("checkInputArea with code_group nesting", () => {
    test("returns true when selection is inside input nested in code_group", () => {
        const mdNode = WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text("ans"));
        const inputNode = WaterproofSchema.nodes.input.create({}, mdNode);
        const cgNode = WaterproofSchema.nodes.code_group.create({}, inputNode);
        const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
        const state = EditorState.create({ doc });
        // Position 3 is inside the markdown text inside input inside code_group
        const resolvedPos = doc.resolve(3);
        const sel = state.tr.setSelection(
            // Text selection inside the markdown node
            state.tr.selection.constructor === NodeSelection
                ? NodeSelection.create(doc, 0)
                : state.tr.selection
        ).selection;
        // Manually test checkInputArea with the resolved position inside the input
        // depth: doc(0) > code_group(1) > input(2) > markdown(3) > text
        // from.node(1) = code_group, from.node(2) = input → should return true
        const innerSel = { $from: doc.resolve(3) } as any;
        expect(checkInputArea(innerSel)).toBe(true);
    });

    test("returns false when selection is in markdown directly inside code_group (no input)", () => {
        const mdNode = WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text("ans"));
        const cgNode = WaterproofSchema.nodes.code_group.create({}, mdNode);
        const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
        // Position 2 is inside the markdown text directly inside code_group
        const innerSel = { $from: doc.resolve(2) } as any;
        expect(checkInputArea(innerSel)).toBe(false);
    });
});
