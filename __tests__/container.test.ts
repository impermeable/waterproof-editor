import { parse } from "../src/markdown-defaults";
import {
  isMarkdownBlock,
  isCodeBlock,
  isHintBlock,
  isInputAreaBlock,
  isMathDisplayBlock,
  isNewlineBlock,
  isContainerBlock,
} from "../src/document/blocks";
import { HintBlock, ContainerBlock } from "../src/document";
import { CodeBlock, InputAreaBlock, MarkdownBlock } from "../src/document";
import { configuration } from "../src/markdown-defaults";
import { DefaultTagSerializer } from "../src/serialization/DocumentSerializer";
import { constructDocument } from "../src/document";
import { sanityCheckTree } from "./mapping/util";
import { TagConfiguration } from "../src/api";
import { wrapInContainer, wpLift } from "../src/commands";
import {
  applyCommand,
  createTestMapping,
  docChildTypes,
  groupingChildCases,
  serializeBlocks,
  stateWithNodeSelAt,
} from "./helpers";

import { EditorState } from "prosemirror-state";
import { Fragment } from "prosemirror-model";
import { WaterproofSchema } from "../src/schema";
import { checkInputArea } from "../src/commands/command-helpers";

const config = configuration("lean4");
const serializer = new DefaultTagSerializer(config);

const multileanConfig: TagConfiguration = {
  ...config,
  container: {
    openTag: (name: string) => `::::${name}\n`,
    closeTag: "\n::::",
    openRequiresNewline: false,
    closeRequiresNewline: false,
  },
};
const multileanSerializer = new DefaultTagSerializer(multileanConfig);

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
    expect(blocks.every((b) => !isContainerBlock(b))).toBe(true);
    expect(isMarkdownBlock(blocks[0])).toBe(true);
  });
});

// ============================================================
// Serialization tests — with empty tags, container serializes
// transparently (just the inner content, no wrapper).
// ============================================================

describe("container serialization", () => {
  // With empty tags, the expected output equals the container's string content.
  test.each(groupingChildCases())(
    "serialize container with $child",
    ({ stringContent, range, innerRange, innerBlocks }) => {
      const cg = new ContainerBlock(
        stringContent,
        "test",
        range,
        innerRange,
        0,
        innerBlocks,
      );
      expect(serializeBlocks([cg], serializer)).toBe(stringContent);
    },
  );

  test("serialize container with non-empty tags (multilean)", () => {
    const innerBlocks = [
      new MarkdownBlock(
        "Some content",
        { from: 14, to: 26 },
        { from: 14, to: 26 },
        0,
      ),
    ];
    const cg = new ContainerBlock(
      "Some content",
      "multilean",
      { from: 0, to: 31 },
      { from: 14, to: 26 },
      0,
      innerBlocks,
    );
    expect(serializeBlocks([cg], multileanSerializer)).toBe(
      "::::multilean\nSome content\n::::",
    );
  });
});

// ============================================================
// Mapping tests
// ============================================================

describe("container mapping", () => {
  test("mapping with container containing markdown", () => {
    const cg = new ContainerBlock(
      "Hello",
      "test",
      { from: 0, to: 24 },
      { from: 14, to: 19 },
      0,
      [
        new MarkdownBlock(
          "Hello",
          { from: 14, to: 19 },
          { from: 14, to: 19 },
          0,
        ),
      ],
    );
    const tree = createTestMapping([cg], config, serializer);

    expect(tree.root.children.length).toBe(1);
    const cgNode = tree.root.children[0];
    expect(cgNode.type).toBe("container");
    expect(cgNode.children.length).toBe(1);
    expect(cgNode.children[0].type).toBe("markdown");

    sanityCheckTree(tree.root);
  });

  test("mapping with container containing input area with code", () => {
    const codeInner = new CodeBlock(
      "code",
      { from: 12, to: 25 },
      { from: 19, to: 23 },
      0,
    );
    const inputInner = new InputAreaBlock(
      "```lean4\ncode\n```",
      { from: 0, to: 38 },
      { from: 12, to: 25 },
      0,
      [codeInner],
    );
    const cg = new ContainerBlock(
      "<input-area>```lean4\ncode\n```</input-area>",
      "test",
      { from: 0, to: 43 },
      { from: 0, to: 38 },
      0,
      [inputInner],
    );

    const tree = createTestMapping([cg], config, serializer);

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
      new MarkdownBlock(
        "hint body",
        { from: 36, to: 45 },
        { from: 36, to: 45 },
        0,
      ),
    ];
    const hintBlock = new HintBlock(
      "hint body",
      "Test",
      { from: 14, to: 52 },
      { from: 36, to: 45 },
      0,
      hintInnerBlocks,
    );
    const cg = new ContainerBlock(
      '<hint title="Test">hint body</hint>',
      "test",
      { from: 0, to: 57 },
      { from: 14, to: 52 },
      0,
      [hintBlock],
    );
    const tree = createTestMapping([cg], config, serializer);

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
      new MarkdownBlock("text", { from: 14, to: 18 }, { from: 14, to: 18 }, 0),
    ];
    const cg = new ContainerBlock(
      "text",
      "test",
      { from: 0, to: 23 },
      { from: 14, to: 18 },
      0,
      innerBlocks,
    );
    const doc = constructDocument([cg]);
    expect(doc.type.name).toBe("doc");
    expect(doc.content.childCount).toBe(1);
    expect(doc.content.firstChild!.type.name).toBe("container");
    expect(doc.content.firstChild!.content.childCount).toBe(1);
    expect(doc.content.firstChild!.content.firstChild!.type.name).toBe(
      "markdown",
    );
  });

  test("constructDocument with container containing input", () => {
    const inputInner = [
      new MarkdownBlock(
        "answer",
        { from: 26, to: 32 },
        { from: 26, to: 32 },
        0,
      ),
    ];
    const input = new InputAreaBlock(
      "answer",
      { from: 14, to: 45 },
      { from: 26, to: 32 },
      0,
      inputInner,
    );
    const cg = new ContainerBlock(
      "<input-area>answer</input-area>",
      "test",
      { from: 0, to: 50 },
      { from: 14, to: 45 },
      0,
      [input],
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
    const cg = new ContainerBlock(
      "",
      "test",
      { from: 0, to: 0 },
      { from: 0, to: 0 },
      0,
      [],
    );
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
      new MarkdownBlock("text", { from: 14, to: 18 }, { from: 14, to: 18 }, 0),
    ];
    const cg = new ContainerBlock(
      "text",
      "test",
      { from: 0, to: 23 },
      { from: 14, to: 18 },
      0,
      innerBlocks,
    );
    expect(serializeBlocks([cg], rocqSerializer)).toBe("text");
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
    const mdNode = WaterproofSchema.nodes.markdown.create(
      {},
      WaterproofSchema.text("hello"),
    );
    const doc = WaterproofSchema.nodes.doc.create({}, mdNode);
    return stateWithNodeSelAt(doc, 0);
  }

  test("wrapInContainer wraps selected node in a container", () => {
    const state = makeStateWithMarkdown();
    const newState = applyCommand(state, wrapInContainer(config, "multilean"));

    expect(newState).not.toBeNull();
    const doc = newState!.doc;
    expect(doc.firstChild!.type.name).toBe("container");
    expect(doc.firstChild!.firstChild!.type.name).toBe("markdown");
  });

  test("wrapInContainer dry-run (no dispatch) returns true when node is selected", () => {
    // Per ProseMirror convention, returning true without dispatch means "I can execute".
    const state = makeStateWithMarkdown();
    const result = wrapInContainer(config, "multilean")(state, undefined);
    expect(result).toBe(true);
  });
});

describe("wpLift from container", () => {
  test("wpLift lifts child out of container", () => {
    const mdNode = WaterproofSchema.nodes.markdown.create(
      {},
      WaterproofSchema.text("hello"),
    );
    const cgNode = WaterproofSchema.nodes.container.create(
      { name: "test" },
      mdNode,
    );
    const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
    const stateWithSel = stateWithNodeSelAt(doc, 0);

    const newState = applyCommand(stateWithSel, wpLift(config));

    expect(newState).not.toBeNull();
    // After lifting, the markdown should be at doc level (no container wrapper)
    expect(newState!.doc.firstChild!.type.name).toBe("markdown");
  });
});

describe("checkInputArea with container nesting", () => {
  test("returns true when selection is inside input nested in container", () => {
    const mdNode = WaterproofSchema.nodes.markdown.create(
      {},
      WaterproofSchema.text("ans"),
    );
    const inputNode = WaterproofSchema.nodes.input.create({}, mdNode);
    const cgNode = WaterproofSchema.nodes.container.create(
      { name: "test" },
      inputNode,
    );
    const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
    // Manually test checkInputArea with the resolved position inside the input
    // depth: doc(0) > container(1) > input(2) > markdown(3) > text
    // from.node(1) = container, from.node(2) = input → should return true
    const innerSel = { $from: doc.resolve(3) } as any;
    expect(checkInputArea(innerSel)).toBe(true);
  });

  test("returns false when selection is in markdown directly inside container (no input)", () => {
    const mdNode = WaterproofSchema.nodes.markdown.create(
      {},
      WaterproofSchema.text("ans"),
    );
    const cgNode = WaterproofSchema.nodes.container.create(
      { name: "test" },
      mdNode,
    );
    const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
    // Position 2 is inside the markdown text directly inside container
    const innerSel = { $from: doc.resolve(2) } as any;
    expect(checkInputArea(innerSel)).toBe(false);
  });

  // Regression: the original code only checked depth=1 for input nodes.
  // This test exercises the depth>=2 branch: cursor exactly at the input boundary
  // inside a container (depth=2, before any inner block), which was missed pre-fix.
  test("returns true at depth 2 (cursor at input boundary inside container)", () => {
    const mdNode = WaterproofSchema.nodes.markdown.create(
      {},
      WaterproofSchema.text("ans"),
    );
    const inputNode = WaterproofSchema.nodes.input.create({}, mdNode);
    const cgNode = WaterproofSchema.nodes.container.create(
      { name: "test" },
      inputNode,
    );
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
// Regression tests for container bugs
// ============================================================

// Regression: wrapInContainer must not absorb the preceding newline.
// The old implementation used tr.wrap(blockRange, ...) which, for a top-level
// NodeSelection, caused the preceding newline to be swept inside the container.
// The fix uses ReplaceAroundStep(sel.from, sel.to, sel.from, sel.to, ...).
describe("wrapInContainer newline regression", () => {
  test("newline before wrapped node stays outside container", () => {
    // Doc: [newline, code]
    // newline.nodeSize=1 → code is at pos 1
    const nlNode = WaterproofSchema.nodes.newline.create();
    const codeNode = WaterproofSchema.nodes.code.create();
    const doc = WaterproofSchema.nodes.doc.create(
      {},
      Fragment.from([nlNode, codeNode]),
    );
    const stateWithSel = stateWithNodeSelAt(doc, 1);

    const newState = applyCommand(
      stateWithSel,
      wrapInContainer(multileanConfig, "multilean"),
    );
    expect(newState).not.toBeNull();

    // Buggy behaviour: newline gets absorbed → doc.childCount=1, container contains [newline, code]
    // Fixed behaviour: doc.childCount=2, newline stays as first child
    const newDoc = newState!.doc;
    expect(docChildTypes(newDoc)).toEqual(["newline", "container"]);
    expect(newDoc.child(1).firstChild!.type.name).toBe("code");
  });
});

// Regression: wrapping a container node inside another container must be rejected.
describe("wrapInContainer container-in-container prevention", () => {
  test("returns false when selected node is itself a container", () => {
    const mdNode = WaterproofSchema.nodes.markdown.create(
      {},
      WaterproofSchema.text("hello"),
    );
    const cgNode = WaterproofSchema.nodes.container.create(
      { name: "inner" },
      mdNode,
    );
    const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
    const stateWithSel = stateWithNodeSelAt(doc, 0);
    const result = wrapInContainer(multileanConfig, "multilean")(
      stateWithSel,
      undefined,
    );
    expect(result).toBe(false);
  });
});

// Regression: a text edit inside the container after wrapping must not corrupt the doc.
// This exercises the position-mapping path that was broken by the old tr.wrap approach.
describe("wrapInContainer followed by content edit", () => {
  test("doc structure remains valid after wrap and text insert inside code", () => {
    // Doc: [newline, code, newline]
    const nlNode = WaterproofSchema.nodes.newline.create();
    const codeNode = WaterproofSchema.nodes.code.create();
    const nl2Node = WaterproofSchema.nodes.newline.create();
    const doc = WaterproofSchema.nodes.doc.create(
      {},
      Fragment.from([nlNode, codeNode, nl2Node]),
    );
    const stateWithSel = stateWithNodeSelAt(doc, 1);

    const wrapped = applyCommand(
      stateWithSel,
      wrapInContainer(multileanConfig, "multilean"),
    );
    expect(wrapped).not.toBeNull();

    // Verify structure after wrap: [newline, container[code], newline]
    expect(docChildTypes(wrapped!.doc)).toEqual([
      "newline",
      "container",
      "newline",
    ]);
    expect(wrapped!.doc.child(1).firstChild!.type.name).toBe("code");

    // Now insert text inside the code node (position 3: container open at 1,
    // code open at 2, code content starts at 3).
    const edited = wrapped!.apply(wrapped!.tr.insertText("x", 3));

    // Structure must still be [newline, container[code_with_text], newline]
    expect(docChildTypes(edited.doc)).toEqual([
      "newline",
      "container",
      "newline",
    ]);
    expect(edited.doc.child(1).firstChild!.type.name).toBe("code");
  });
});

// Regression: wpLift must lift ALL children when container has multiple inner blocks.
describe("wpLift with multiple children", () => {
  test("lifts all children out of container when container has multiple inner blocks", () => {
    const mdNode = WaterproofSchema.nodes.markdown.create(
      {},
      WaterproofSchema.text("hello"),
    );
    const nlNode = WaterproofSchema.nodes.newline.create();
    const codeNode = WaterproofSchema.nodes.code.create();
    const cgNode = WaterproofSchema.nodes.container.create(
      { name: "test" },
      Fragment.from([mdNode, nlNode, codeNode]),
    );
    const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
    const stateWithSel = stateWithNodeSelAt(doc, 0);

    const newState = applyCommand(stateWithSel, wpLift(multileanConfig));
    expect(newState).not.toBeNull();

    // Container is gone; children should be at doc level
    const types = docChildTypes(newState!.doc);
    expect(types).toContain("markdown");
    expect(types).toContain("newline");
    expect(types).toContain("code");
  });
});
