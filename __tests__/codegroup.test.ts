import { parse } from "../src/markdown-defaults";
import {
    isMarkdownBlock, isCodeBlock, isHintBlock, isInputAreaBlock,
    isMathDisplayBlock, isNewlineBlock, isContainerBlock
} from "../src/document/blocks";
import { HintBlock, ContainerBlock } from "../src/document";
import { Mapping, Range, WaterproofDocument } from "../src/api";
import { CodeBlock, InputAreaBlock, MarkdownBlock, MathDisplayBlock, NewlineBlock } from "../src/document";
import { configuration } from "../src/markdown-defaults";
import { DefaultTagSerializer } from "../src/serialization/DocumentSerializer";
import { constructDocument } from "../src/document";
import { sanityCheckTree } from "./mapping/util";
import { TagConfiguration } from "../src/api";
import { wrapInContainer, wpLift } from "../src/commands";

import { EditorState, NodeSelection } from "prosemirror-state";
import { Fragment } from "prosemirror-model";
import { WaterproofSchema } from "../src/schema";
import { checkInputArea } from "../src/commands/command-helpers";

const config = configuration("lean4");
const serializer = new DefaultTagSerializer(config);

const multileanConfig: TagConfiguration = {
    ...config,
    container: {
        openTag: (name: string) => `::::${name}\n`,
        closeTag: (_name: string) => "\n::::",
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
// handle container; parsing is handled in waterproof-vscode.
// ============================================================

describe("container parsing (not supported by .mv parser)", () => {
    test("parser does not recognize container syntax", () => {
        const doc = `::::multilean
Some markdown content
::::`;
        const blocks = parse(doc, { language: "lean4" });
        // Should be parsed as plain markdown, not as a container
        expect(blocks.every(b => !isContainerBlock(b))).toBe(true);
        expect(isMarkdownBlock(blocks[0])).toBe(true);
    });
});

// ============================================================
// Serialization tests — with empty tags, container serializes
// transparently (just the inner content, no wrapper).
// ============================================================

describe("container serialization", () => {
    test("serialize container with markdown", () => {
        const innerBlocks = [
            new MarkdownBlock("Some text", { from: 14, to: 23 }, { from: 14, to: 23 }, 0)
        ];
        const cg = new ContainerBlock(
            "Some text", "test",
            { from: 0, to: 28 }, { from: 14, to: 23 }, 0,
            innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = serializer.serializeDocument(doc);
        expect(result).toBe("Some text");
    });

    test("serialize container with code block", () => {
        const innerBlocks = [
            new CodeBlock("def x := 1", { from: 14, to: 37 }, { from: 21, to: 31 }, 0)
        ];
        const cg = new ContainerBlock(
            "```lean4\ndef x := 1\n```", "test",
            { from: 0, to: 42 }, { from: 14, to: 37 }, 0,
            innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = serializer.serializeDocument(doc);
        expect(result).toBe("```lean4\ndef x := 1\n```");
    });

    test("serialize container with input area", () => {
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
        const cg = new ContainerBlock(
            "<input-area>input text</input-area>", "test",
            { from: 0, to: 54 }, { from: 14, to: 49 }, 0,
            innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = serializer.serializeDocument(doc);
        expect(result).toBe("<input-area>input text</input-area>");
    });

    test("serialize container with hint", () => {
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
        const cg = new ContainerBlock(
            '<hint title="My Hint">hint text</hint>', "test",
            { from: 0, to: 61 }, { from: 14, to: 52 }, 0,
            innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = serializer.serializeDocument(doc);
        expect(result).toBe('<hint title="My Hint">hint text</hint>');
    });

    test("serialize container with math_display", () => {
        const innerBlocks = [
            new MathDisplayBlock("x^2", { from: 14, to: 21 }, { from: 16, to: 19 }, 0)
        ];
        const cg = new ContainerBlock(
            "$$x^2$$", "test",
            { from: 0, to: 26 }, { from: 14, to: 21 }, 0,
            innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = serializer.serializeDocument(doc);
        expect(result).toBe("$$x^2$$");
    });

    test("serialize container with non-empty tags (multilean)", () => {
        const innerBlocks = [
            new MarkdownBlock("Some content", { from: 14, to: 26 }, { from: 14, to: 26 }, 0)
        ];
        const cg = new ContainerBlock(
            "Some content", "multilean",
            { from: 0, to: 31 }, { from: 14, to: 26 }, 0,
            innerBlocks
        );
        const doc = constructDocument([cg]);
        const result = multileanSerializer.serializeDocument(doc);
        expect(result).toBe("::::multilean\nSome content\n::::");
    });

    test("serialize container with multiple children", () => {
        const innerBlocks = [
            new MarkdownBlock("intro", { from: 14, to: 19 }, { from: 14, to: 19 }, 0),
            new CodeBlock("def x := 1", { from: 19, to: 42 }, { from: 26, to: 36 }, 0),
        ];
        const cg = new ContainerBlock(
            "intro```lean4\ndef x := 1\n```", "test",
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

describe("container mapping", () => {
    test("mapping with container containing markdown", () => {
        const cg = new ContainerBlock(
            "Hello", "test",
            { from: 0, to: 24 },
            { from: 14, to: 19 },
            0,
            [new MarkdownBlock("Hello", { from: 14, to: 19 }, { from: 14, to: 19 }, 0)]
        );
        const tree = createTestMapping([cg]);

        expect(tree.root.children.length).toBe(1);
        const cgNode = tree.root.children[0];
        expect(cgNode.type).toBe("container");
        expect(cgNode.children.length).toBe(1);
        expect(cgNode.children[0].type).toBe("markdown");

        sanityCheckTree(tree.root);
    });

    test("mapping with container containing input area with code", () => {
        const codeInner = new CodeBlock("code", { from: 12, to: 25 }, { from: 19, to: 23 }, 0);
        const inputInner = new InputAreaBlock(
            "```lean4\ncode\n```",
            { from: 0, to: 38 }, { from: 12, to: 25 }, 0,
            [codeInner]
        );
        const cg = new ContainerBlock(
            "<input-area>```lean4\ncode\n```</input-area>", "test",
            { from: 0, to: 43 }, { from: 0, to: 38 }, 0,
            [inputInner]
        );

        const tree = createTestMapping([cg]);

        expect(tree.root.children.length).toBe(1);
        const cgNode = tree.root.children[0];
        expect(cgNode.type).toBe("container");
        expect(cgNode.children.length).toBe(1);

        const inputNode = cgNode.children[0];
        expect(inputNode.type).toBe("input");

        sanityCheckTree(tree.root);
    });

    test("mapping with container containing hint", () => {
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
        const cg = new ContainerBlock(
            '<hint title="Test">hint body</hint>', "test",
            { from: 0, to: 57 },
            { from: 14, to: 52 },
            0,
            [hintBlock]
        );
        const tree = createTestMapping([cg]);

        const cgNode = tree.root.children[0];
        expect(cgNode.type).toBe("container");
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

describe("container ProseMirror construction", () => {
    test("constructDocument with container", () => {
        const innerBlocks = [
            new MarkdownBlock("text", { from: 14, to: 18 }, { from: 14, to: 18 }, 0)
        ];
        const cg = new ContainerBlock(
            "text", "test", { from: 0, to: 23 }, { from: 14, to: 18 }, 0, innerBlocks
        );
        const doc = constructDocument([cg]);
        expect(doc.type.name).toBe("doc");
        expect(doc.content.childCount).toBe(1);
        expect(doc.content.firstChild!.type.name).toBe("container");
        expect(doc.content.firstChild!.content.childCount).toBe(1);
        expect(doc.content.firstChild!.content.firstChild!.type.name).toBe("markdown");
    });

    test("constructDocument with container containing input", () => {
        const inputInner = [
            new MarkdownBlock("answer", { from: 26, to: 32 }, { from: 26, to: 32 }, 0)
        ];
        const input = new InputAreaBlock(
            "answer", { from: 14, to: 45 }, { from: 26, to: 32 }, 0, inputInner
        );
        const cg = new ContainerBlock(
            "<input-area>answer</input-area>", "test",
            { from: 0, to: 50 }, { from: 14, to: 45 }, 0,
            [input]
        );
        const doc = constructDocument([cg]);

        const cgNode = doc.content.firstChild!;
        expect(cgNode.type.name).toBe("container");
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

describe("container typeguard", () => {
    test("isContainerBlock identifies correctly", () => {
        const cg = new ContainerBlock("", "test", { from: 0, to: 0 }, { from: 0, to: 0 }, 0, []);
        expect(isContainerBlock(cg)).toBe(true);
        expect(isInputAreaBlock(cg)).toBe(false);
        expect(isHintBlock(cg)).toBe(false);
        expect(isCodeBlock(cg)).toBe(false);
        expect(isMarkdownBlock(cg)).toBe(false);
        expect(isMathDisplayBlock(cg)).toBe(false);
        expect(isNewlineBlock(cg)).toBe(false);
    });
});

// ============================================================
// Rocq context tests (container serializes transparently)
// ============================================================

describe("container Rocq context", () => {
    test("serializer serializes container transparently in Rocq config", () => {
        const rocqConfig = configuration("coq");
        const rocqSerializer = new DefaultTagSerializer(rocqConfig);

        const innerBlocks = [
            new MarkdownBlock("text", { from: 14, to: 18 }, { from: 14, to: 18 }, 0)
        ];
        const cg = new ContainerBlock(
            "text", "test", { from: 0, to: 23 }, { from: 14, to: 18 }, 0, innerBlocks
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
describe("wrapInContainer command", () => {
    function makeStateWithMarkdown(): EditorState {
        const mdNode = WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text("hello"));
        const doc = WaterproofSchema.nodes.doc.create({}, mdNode);
        const state = EditorState.create({ doc });
        // Select the markdown node
        return state.apply(state.tr.setSelection(NodeSelection.create(state.doc, 0)));
    }

    test("wrapInContainer wraps selected node in a container", () => {
        const state = makeStateWithMarkdown();
        let newState: EditorState | null = null;
        const cmd = wrapInContainer(config, "multilean");
        cmd(state, (tr) => { newState = state.apply(tr); });

        expect(newState).not.toBeNull();
        const doc = newState!.doc;
        expect(doc.firstChild!.type.name).toBe("container");
        expect(doc.firstChild!.firstChild!.type.name).toBe("markdown");
    });

    test("wrapInContainer dry-run (no dispatch) returns true when node is selected", () => {
        // Per ProseMirror convention, returning true without dispatch means "I can execute".
        const state = makeStateWithMarkdown();
        const cmd = wrapInContainer(config, "multilean");
        const result = cmd(state, undefined);
        expect(result).toBe(true);
    });
});

describe("wpLift from container", () => {
    test("wpLift lifts child out of container", () => {
        const mdNode = WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text("hello"));
        const cgNode = WaterproofSchema.nodes.container.create({name: "test"}, mdNode);
        const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
        // Select the container node
        const state = EditorState.create({ doc });
        const stateWithSel = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, 0)));

        let newState: EditorState | null = null;
        const cmd = wpLift(config);
        cmd(stateWithSel, (tr) => { newState = stateWithSel.apply(tr); });

        expect(newState).not.toBeNull();
        // After lifting, the markdown should be at doc level (no container wrapper)
        expect(newState!.doc.firstChild!.type.name).toBe("markdown");
    });
});

describe("checkInputArea with container nesting", () => {
    test("returns true when selection is inside input nested in container", () => {
        const mdNode = WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text("ans"));
        const inputNode = WaterproofSchema.nodes.input.create({}, mdNode);
        const cgNode = WaterproofSchema.nodes.container.create({name: "test"}, inputNode);
        const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
        const state = EditorState.create({ doc });
        // Position 3 is inside the markdown text inside input inside container
        const resolvedPos = doc.resolve(3);
        const sel = state.tr.setSelection(
            // Text selection inside the markdown node
            state.tr.selection.constructor === NodeSelection
                ? NodeSelection.create(doc, 0)
                : state.tr.selection
        ).selection;
        // Manually test checkInputArea with the resolved position inside the input
        // depth: doc(0) > container(1) > input(2) > markdown(3) > text
        // from.node(1) = container, from.node(2) = input → should return true
        const innerSel = { $from: doc.resolve(3) } as any;
        expect(checkInputArea(innerSel)).toBe(true);
    });

    test("returns false when selection is in markdown directly inside container (no input)", () => {
        const mdNode = WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text("ans"));
        const cgNode = WaterproofSchema.nodes.container.create({name: "test"}, mdNode);
        const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
        // Position 2 is inside the markdown text directly inside container
        const innerSel = { $from: doc.resolve(2) } as any;
        expect(checkInputArea(innerSel)).toBe(false);
    });

    // T3 — Regression: the original code only checked depth=1 for input nodes.
    // This test exercises the depth>=2 branch: cursor exactly at the input boundary
    // inside a container (depth=2, before any inner block), which was missed pre-fix.
    test("returns true at depth 2 (cursor at input boundary inside container)", () => {
        const mdNode = WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text("ans"));
        const inputNode = WaterproofSchema.nodes.input.create({}, mdNode);
        const cgNode = WaterproofSchema.nodes.container.create({name: "test"}, inputNode);
        const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
        // pos 2: inside input (after input open token), depth=2
        // node(1)=container, node(2)=input → checkInputArea should return true
        const resolvedPos = doc.resolve(2);
        expect(resolvedPos.depth).toBe(2);
        const innerSel = { $from: resolvedPos } as any;
        expect(checkInputArea(innerSel)).toBe(true);
    });
});

// ============================================================
// Regression tests for feature/codegroup bugs
// ============================================================

// T1 — Regression: wrapInContainer must not absorb the preceding newline.
// The old implementation used tr.wrap(blockRange, ...) which, for a top-level
// NodeSelection, caused the preceding newline to be swept inside the container.
// The fix uses ReplaceAroundStep(sel.from, sel.to, sel.from, sel.to, ...).
describe("wrapInContainer newline regression", () => {
    test("newline before wrapped node stays outside container", () => {
        // Doc: [newline, code]
        // newline.nodeSize=1 → code is at pos 1
        const nlNode = WaterproofSchema.nodes.newline.create();
        const codeNode = WaterproofSchema.nodes.code.create();
        const doc = WaterproofSchema.nodes.doc.create({}, Fragment.from([nlNode, codeNode]));
        const state = EditorState.create({ doc });
        const stateWithSel = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, 1)));

        let newState: EditorState | null = null;
        wrapInContainer(multileanConfig, "multilean")(stateWithSel, (tr) => { newState = stateWithSel.apply(tr); });
        expect(newState).not.toBeNull();

        const newDoc = newState!.doc;
        // Buggy behaviour: newline gets absorbed → doc.childCount=1, container contains [newline, code]
        // Fixed behaviour: doc.childCount=2, newline stays as first child
        expect(newDoc.childCount).toBe(2);
        expect(newDoc.child(0).type.name).toBe("newline");
        expect(newDoc.child(1).type.name).toBe("container");
        expect(newDoc.child(1).firstChild!.type.name).toBe("code");
    });
});

// T2 — Regression: wrapping a container node inside another container must be rejected.
describe("wrapInContainer container-in-container prevention", () => {
    test("returns false when selected node is itself a container", () => {
        const mdNode = WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text("hello"));
        const cgNode = WaterproofSchema.nodes.container.create({name: "inner"}, mdNode);
        const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
        const state = EditorState.create({ doc });
        const stateWithSel = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, 0)));
        const result = wrapInContainer(multileanConfig, "multilean")(stateWithSel, undefined);
        expect(result).toBe(false);
    });
});

// T4 — Regression: a text edit inside the container after wrapping must not corrupt the doc.
// This exercises the position-mapping path that was broken by the old tr.wrap approach.
describe("wrapInContainer followed by content edit", () => {
    test("doc structure remains valid after wrap and text insert inside code", () => {
        // Doc: [newline, code, newline]
        const nlNode = WaterproofSchema.nodes.newline.create();
        const codeNode = WaterproofSchema.nodes.code.create();
        const nl2Node = WaterproofSchema.nodes.newline.create();
        const doc = WaterproofSchema.nodes.doc.create({}, Fragment.from([nlNode, codeNode, nl2Node]));
        const state = EditorState.create({ doc });
        const stateWithSel = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, 1)));

        let wrapped: EditorState | null = null;
        wrapInContainer(multileanConfig, "multilean")(stateWithSel, (tr) => { wrapped = stateWithSel.apply(tr); });
        expect(wrapped).not.toBeNull();

        // Verify structure after wrap: [newline, container[code], newline]
        const wrappedDoc = wrapped!.doc;
        expect(wrappedDoc.childCount).toBe(3);
        expect(wrappedDoc.child(0).type.name).toBe("newline");
        expect(wrappedDoc.child(1).type.name).toBe("container");
        expect(wrappedDoc.child(1).firstChild!.type.name).toBe("code");
        expect(wrappedDoc.child(2).type.name).toBe("newline");

        // Now insert text inside the code node (position 3: container open at 1,
        // code open at 2, code content starts at 3).
        const editTr = wrapped!.tr.insertText("x", 3);
        const edited = wrapped!.apply(editTr);
        const editedDoc = edited.doc;

        // Structure must still be [newline, container[code_with_text], newline]
        expect(editedDoc.childCount).toBe(3);
        expect(editedDoc.child(0).type.name).toBe("newline");
        expect(editedDoc.child(1).type.name).toBe("container");
        expect(editedDoc.child(1).firstChild!.type.name).toBe("code");
        expect(editedDoc.child(2).type.name).toBe("newline");
    });
});

// T5 — Regression: wrapInContainer must return false when openRequiresNewline is true
// and there is no preceding newline node.
describe("wrapInContainer openRequiresNewline enforcement", () => {
    test("returns false when container requires preceding newline but none present", () => {
        const strictConfig: TagConfiguration = {
            ...multileanConfig,
            container: {
                ...multileanConfig.container,
                openRequiresNewline: true,
            }
        };
        // Doc: [markdown, code] — no newline between them
        const mdNode = WaterproofSchema.nodes.markdown.create({});
        const codeNode = WaterproofSchema.nodes.code.create();
        const doc = WaterproofSchema.nodes.doc.create({}, Fragment.from([mdNode, codeNode]));
        const state = EditorState.create({ doc });
        // markdown.nodeSize = 2 (empty atom), so code is at pos 2
        const stateWithSel = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, 2)));
        const result = wrapInContainer(strictConfig, "multilean")(stateWithSel, undefined);
        expect(result).toBe(false);
    });
});

// T6 — Regression: wpLift must lift ALL children when container has multiple inner blocks.
describe("wpLift with multiple children", () => {
    test("lifts all children out of container when container has multiple inner blocks", () => {
        const mdNode = WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text("hello"));
        const nlNode = WaterproofSchema.nodes.newline.create();
        const codeNode = WaterproofSchema.nodes.code.create();
        const cgNode = WaterproofSchema.nodes.container.create(
            {name: "test"},
            Fragment.from([mdNode, nlNode, codeNode])
        );
        const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
        const state = EditorState.create({ doc });
        const stateWithSel = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, 0)));

        let newState: EditorState | null = null;
        wpLift(multileanConfig)(stateWithSel, (tr) => { newState = stateWithSel.apply(tr); });
        expect(newState).not.toBeNull();

        // Container is gone; children should be at doc level
        const newDoc = newState!.doc;
        expect(newDoc.firstChild!.type.name).toBe("markdown");
        // All three inner nodes (markdown, newline, code) are now direct children of doc
        const types = Array.from({ length: newDoc.childCount }, (_, i) => newDoc.child(i).type.name);
        expect(types).toContain("markdown");
        expect(types).toContain("newline");
        expect(types).toContain("code");
    });
});
