// LLM-generated unit tests that might codify existing bugs

import { parse } from "../src/markdown-defaults";
import {
  isMarkdownBlock,
  isCodeBlock,
  isHintBlock,
  isInputAreaBlock,
  isMathDisplayBlock,
  isNewlineBlock,
  isContainerBlock,
  isStudentHiddenBlock,
} from "../src/document/blocks";
import {
  Block,
  BlockRange,
  ChildBlocks,
  CodeBlock,
  ContainerBlock,
  MarkdownBlock,
  StudentHiddenBlock,
  constructDocument,
} from "../src/document";
import { BLOCK_NAME } from "../src/document/blocks/block";
import { configuration } from "../src/markdown-defaults";
import { TagConfiguration } from "../src/api";
import { DefaultTagSerializer } from "../src/serialization/DocumentSerializer";
import { sanityCheckTree } from "./mapping/util";
import { wpLift, wrapInStudentHidden } from "../src/commands";
import {
  applyCommand,
  createTestMapping,
  groupingChildCases,
  serializeBlocks,
  stateWithNodeSelAt,
} from "./helpers";

import { EditorState, Plugin } from "prosemirror-state";
import { Node as PNode } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import { WaterproofSchema } from "../src/schema";
import { studentHiddenPlugin } from "../src/student-hidden";
import { INPUT_AREA_PLUGIN_KEY, inputAreaPlugin } from "../src/inputArea";

const config = configuration("lean4");
const serializer = new DefaultTagSerializer(config);

// ============================================================
// Parsing tests — the .mv parser (statemachine.ts) recognizes
// <student-hidden> ... </student-hidden> tags.
// ============================================================

describe("student_hidden parsing (.mv)", () => {
  test("parses <student-hidden> into a StudentHiddenBlock", () => {
    const doc = "<student-hidden>Some text</student-hidden>";
    const blocks = parse(doc, { language: "lean4" });

    expect(blocks).toHaveLength(1);
    const block = blocks[0];
    expect(isStudentHiddenBlock(block)).toBe(true);
    expect(block.stringContent).toBe("Some text");
    expect(block.range).toEqual({ from: 0, to: doc.length });
    expect(block.innerRange).toEqual({ from: 16, to: 25 });
    expect(block.innerBlocks).toHaveLength(1);
    expect(isMarkdownBlock(block.innerBlocks![0])).toBe(true);
    expect(block.innerBlocks![0].stringContent).toBe("Some text");
  });

  test("parses code inside a student-hidden block", () => {
    const doc =
      "<student-hidden>\n```lean4\nsecret code\n```\n</student-hidden>";
    const blocks = parse(doc, { language: "lean4" });

    expect(blocks).toHaveLength(1);
    const block = blocks[0];
    expect(isStudentHiddenBlock(block)).toBe(true);
    const inner = block.innerBlocks!;
    expect(inner.map((b) => b.type)).toEqual([
      BLOCK_NAME.NEWLINE,
      BLOCK_NAME.CODE,
      BLOCK_NAME.NEWLINE,
    ]);
    expect(inner[1].stringContent).toBe("secret code");
  });

  test("round-trip: parse then serialize is the identity", () => {
    const doc =
      "Intro\n<student-hidden>\n```lean4\nsecret code\n```\n</student-hidden>\nAfter";
    const blocks = parse(doc, { language: "lean4" });
    expect(blocks.some((b) => isStudentHiddenBlock(b))).toBe(true);
    expect(serializeBlocks(blocks, serializer)).toBe(doc);
  });

  test("nested tags inside student-hidden are not recognized (flat nesting)", () => {
    // The .mv state machine only supports one level of nesting, so an input
    // area inside a student-hidden block stays plain markdown. Round-tripping
    // still preserves the document.
    const doc = "<student-hidden><input-area>x</input-area></student-hidden>";
    const blocks = parse(doc, { language: "lean4" });

    expect(blocks).toHaveLength(1);
    const block = blocks[0];
    expect(isStudentHiddenBlock(block)).toBe(true);
    expect(block.innerBlocks!.map((b) => b.type)).toEqual([
      BLOCK_NAME.MARKDOWN,
    ]);
    expect(serializeBlocks(blocks, serializer)).toBe(doc);
  });
});

// ============================================================
// Block construction tests, parametrized over both grouping
// block classes (ContainerBlock and StudentHiddenBlock) since
// they share the same constructor contract.
// ============================================================

const groupingBlockClasses = [
  {
    blockClass: "ContainerBlock",
    nodeName: "container",
    make: (
      stringContent: string,
      range: BlockRange,
      innerRange: BlockRange,
      lineStart: number,
      childBlocks: ChildBlocks,
    ): Block =>
      new ContainerBlock(
        stringContent,
        "test",
        range,
        innerRange,
        lineStart,
        childBlocks,
      ),
  },
  {
    blockClass: "StudentHiddenBlock",
    nodeName: "student_hidden",
    make: (
      stringContent: string,
      range: BlockRange,
      innerRange: BlockRange,
      lineStart: number,
      childBlocks: ChildBlocks,
    ): Block =>
      new StudentHiddenBlock(
        stringContent,
        range,
        innerRange,
        lineStart,
        childBlocks,
      ),
  },
];

describe.each(groupingBlockClasses)(
  "$blockClass construction",
  ({ nodeName, make }) => {
    test("constructor accepts an array of child blocks", () => {
      const child = new MarkdownBlock(
        "text",
        { from: 14, to: 18 },
        { from: 14, to: 18 },
        0,
      );
      const block = make("text", { from: 0, to: 23 }, { from: 14, to: 18 }, 0, [
        child,
      ]);
      expect(block.innerBlocks).toEqual([child]);
    });

    test("constructor accepts a child block factory function", () => {
      const innerRange = { from: 14, to: 18 };
      const factory = jest.fn(
        (innerContent: string, range: BlockRange, lineStartOffset: number) => [
          new MarkdownBlock(innerContent, range, range, lineStartOffset),
        ],
      );
      const block = make("text", { from: 0, to: 23 }, innerRange, 3, factory);

      // The factory receives the block's content, inner range and line start.
      expect(factory).toHaveBeenCalledWith("text", innerRange, 3);
      expect(block.innerBlocks).toHaveLength(1);
      expect(block.innerBlocks![0].stringContent).toBe("text");
    });

    test(`toProseMirror creates a ${nodeName} node containing the children`, () => {
      const block = make("text", { from: 0, to: 23 }, { from: 14, to: 18 }, 0, [
        new MarkdownBlock(
          "text",
          { from: 14, to: 18 },
          { from: 14, to: 18 },
          0,
        ),
      ]);
      const node = block.toProseMirror();
      expect(node.type.name).toBe(nodeName);
      expect(node.content.childCount).toBe(1);
      expect(node.content.firstChild!.type.name).toBe("markdown");
    });
  },
);

// ============================================================
// Typeguard tests
// ============================================================

describe("student_hidden typeguards", () => {
  test("isStudentHiddenBlock identifies correctly", () => {
    const block = new StudentHiddenBlock(
      "",
      { from: 0, to: 0 },
      { from: 0, to: 0 },
      0,
      [],
    );
    expect(block.type).toBe(BLOCK_NAME.STUDENT_HIDDEN);
    expect(isStudentHiddenBlock(block)).toBe(true);
    expect(isContainerBlock(block)).toBe(false);
    expect(isInputAreaBlock(block)).toBe(false);
    expect(isHintBlock(block)).toBe(false);
    expect(isCodeBlock(block)).toBe(false);
    expect(isMarkdownBlock(block)).toBe(false);
    expect(isMathDisplayBlock(block)).toBe(false);
    expect(isNewlineBlock(block)).toBe(false);
  });

  test("isStudentHiddenBlock rejects other block types", () => {
    const md = new MarkdownBlock("", { from: 0, to: 0 }, { from: 0, to: 0 }, 0);
    expect(isStudentHiddenBlock(md)).toBe(false);
  });
});

// ============================================================
// ProseMirror document construction tests
// ============================================================

describe("student_hidden ProseMirror construction", () => {
  test.each(groupingChildCases())(
    "constructDocument with student_hidden containing $child",
    ({ stringContent, range, innerRange, innerBlocks }) => {
      const block = new StudentHiddenBlock(
        stringContent,
        range,
        innerRange,
        0,
        innerBlocks,
      );
      const doc = constructDocument([block]);

      expect(doc.type.name).toBe("doc");
      expect(doc.content.childCount).toBe(1);
      const shNode = doc.content.firstChild!;
      expect(shNode.type.name).toBe("student_hidden");

      // The child node types mirror the child block types.
      const childTypes: string[] = [];
      shNode.content.forEach((child) => childTypes.push(child.type.name));
      expect(childTypes).toEqual(innerBlocks.map((b) => b.type));
    },
  );
});

// ============================================================
// Schema tests
// ============================================================

describe("student_hidden schema", () => {
  const markdownNode = () =>
    WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text("text"));

  test("student_hidden requires at least one child", () => {
    expect(() =>
      WaterproofSchema.nodes.student_hidden.createChecked({}, []),
    ).toThrow();
  });

  test("student_hidden cannot be nested inside student_hidden", () => {
    const inner = WaterproofSchema.nodes.student_hidden.createChecked(
      {},
      markdownNode(),
    );
    expect(() =>
      WaterproofSchema.nodes.student_hidden.createChecked({}, inner),
    ).toThrow();
  });

  test("student_hidden cannot be nested inside a container", () => {
    const inner = WaterproofSchema.nodes.student_hidden.createChecked(
      {},
      markdownNode(),
    );
    expect(() =>
      WaterproofSchema.nodes.container.createChecked({ name: "test" }, inner),
    ).toThrow();
  });

  test("student_hidden is allowed at document level", () => {
    const shNode = WaterproofSchema.nodes.student_hidden.createChecked(
      {},
      markdownNode(),
    );
    const doc = WaterproofSchema.nodes.doc.createChecked({}, shNode);
    expect(doc.firstChild!.type.name).toBe("student_hidden");
  });

  test("student_hidden accepts all containercontent children", () => {
    const children = [
      markdownNode(),
      WaterproofSchema.nodes.newline.create(),
      WaterproofSchema.nodes.code.create({}, WaterproofSchema.text("code")),
      WaterproofSchema.nodes.math_display.create(
        {},
        WaterproofSchema.text("x^2"),
      ),
      WaterproofSchema.nodes.input.createChecked({}, markdownNode()),
      WaterproofSchema.nodes.hint.createChecked(
        { title: "Hint" },
        markdownNode(),
      ),
    ];
    const shNode = WaterproofSchema.nodes.student_hidden.createChecked(
      {},
      children,
    );
    expect(shNode.content.childCount).toBe(children.length);
  });
});

// ============================================================
// Mapping tests
// ============================================================

describe("student_hidden mapping", () => {
  test.each(groupingChildCases())(
    "mapping with student_hidden containing $child",
    ({ stringContent, range, innerRange, innerBlocks }) => {
      const block = new StudentHiddenBlock(
        stringContent,
        range,
        innerRange,
        0,
        innerBlocks,
      );
      const tree = createTestMapping([block], config, serializer);

      expect(tree.root.children).toHaveLength(1);
      const shNode = tree.root.children[0];
      expect(shNode.type).toBe("student_hidden");
      expect(shNode.children.map((c) => c.type)).toEqual(
        innerBlocks.map((b) => b.type),
      );

      sanityCheckTree(tree.root);
    },
  );
});

// ============================================================
// Serialization tests
// ============================================================

describe("student_hidden serialization", () => {
  // The default configuration uses <student-hidden> tags, so the expected
  // output is the string content wrapped in those tags.
  test.each(groupingChildCases())(
    "serialize student_hidden with $child",
    ({ stringContent, range, innerRange, innerBlocks }) => {
      const block = new StudentHiddenBlock(
        stringContent,
        range,
        innerRange,
        0,
        innerBlocks,
      );
      expect(serializeBlocks([block], serializer)).toBe(
        `<student-hidden>${stringContent}</student-hidden>`,
      );
    },
  );

  test("serialize student_hidden with Lean-style tags", () => {
    // Mirrors the tag configuration used for Lean in waterproof-vscode.
    const leanStyleConfig: TagConfiguration = {
      ...config,
      studentHidden: {
        openTag: ":::studentHidden\n",
        closeTag: "\n:::",
        openRequiresNewline: true,
        closeRequiresNewline: true,
      },
    };
    const leanStyleSerializer = new DefaultTagSerializer(leanStyleConfig);

    const block = new StudentHiddenBlock(
      "```lean4\ndef x := 1\n```",
      { from: 0, to: 44 },
      { from: 17, to: 40 },
      0,
      [
        new CodeBlock(
          "def x := 1",
          { from: 17, to: 40 },
          { from: 26, to: 36 },
          0,
        ),
      ],
    );
    expect(serializeBlocks([block], leanStyleSerializer)).toBe(
      ":::studentHidden\n```lean4\ndef x := 1\n```\n:::",
    );
  });
});

// ============================================================
// Plugin (decoration) tests
// ============================================================

describe("student_hidden plugin decorations", () => {
  /** Creates a student_hidden node containing a single markdown child. */
  function studentHiddenNode(text = "secret"): PNode {
    return WaterproofSchema.nodes.student_hidden.create(
      {},
      WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text(text)),
    );
  }

  function makeState(
    doc: PNode,
    plugins: Plugin[] = [inputAreaPlugin, studentHiddenPlugin],
  ): EditorState {
    return EditorState.create({ schema: WaterproofSchema, doc, plugins });
  }

  /** Invokes the plugin's decorations prop on `state` and returns the decorations. */
  function getDecorations(state: EditorState) {
    const decoProp = studentHiddenPlugin.props.decorations!;
    const decoSet = decoProp.call(studentHiddenPlugin, state) as DecorationSet;
    return decoSet.find();
  }

  /** Extracts the class attribute of a node decoration (internal API). */
  function decoClass(deco: ReturnType<typeof getDecorations>[number]): string {
    return (deco as unknown as { type: { attrs: { class: string } } }).type
      .attrs.class;
  }

  function setTeacherMode(state: EditorState, teacher: boolean): EditorState {
    return state.apply(state.tr.setMeta(INPUT_AREA_PLUGIN_KEY, { teacher }));
  }

  test("student mode (default): node is decorated with student-hidden-student", () => {
    const shNode = studentHiddenNode();
    const doc = WaterproofSchema.nodes.doc.create({}, [
      shNode,
      WaterproofSchema.nodes.newline.create(),
    ]);
    const decos = getDecorations(makeState(doc));

    expect(decos).toHaveLength(1);
    expect(decoClass(decos[0])).toBe("student-hidden-student");
    // The decoration spans the entire student_hidden node.
    expect(decos[0].from).toBe(0);
    expect(decos[0].to).toBe(shNode.nodeSize);
  });

  test("teacher mode: node is decorated with student-hidden-teacher", () => {
    const doc = WaterproofSchema.nodes.doc.create({}, [studentHiddenNode()]);
    const state = setTeacherMode(makeState(doc), true);
    const decos = getDecorations(state);

    expect(decos).toHaveLength(1);
    expect(decoClass(decos[0])).toBe("student-hidden-teacher");
  });

  test("toggling teacher mode off restores the student decoration", () => {
    const doc = WaterproofSchema.nodes.doc.create({}, [studentHiddenNode()]);
    let state = makeState(doc);
    state = setTeacherMode(state, true);
    state = setTeacherMode(state, false);
    const decos = getDecorations(state);

    expect(decos).toHaveLength(1);
    expect(decoClass(decos[0])).toBe("student-hidden-student");
  });

  test("without the input area plugin, defaults to student mode", () => {
    const doc = WaterproofSchema.nodes.doc.create({}, [studentHiddenNode()]);
    const state = makeState(doc, [studentHiddenPlugin]);
    const decos = getDecorations(state);

    expect(decos).toHaveLength(1);
    expect(decoClass(decos[0])).toBe("student-hidden-student");
  });

  test("documents without student_hidden nodes get no decorations", () => {
    const doc = WaterproofSchema.nodes.doc.create({}, [
      WaterproofSchema.nodes.markdown.create(
        {},
        WaterproofSchema.text("visible"),
      ),
    ]);
    expect(getDecorations(makeState(doc))).toHaveLength(0);
  });

  test("only the student_hidden node itself is decorated, not its children", () => {
    const shNode = WaterproofSchema.nodes.student_hidden.create({}, [
      WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text("a")),
      WaterproofSchema.nodes.newline.create(),
      WaterproofSchema.nodes.code.create({}, WaterproofSchema.text("b")),
    ]);
    const doc = WaterproofSchema.nodes.doc.create({}, [shNode]);
    const decos = getDecorations(makeState(doc));

    expect(decos).toHaveLength(1);
  });

  test("every student_hidden node in the document is decorated", () => {
    const sh1 = studentHiddenNode("one");
    const sh2 = studentHiddenNode("two");
    const doc = WaterproofSchema.nodes.doc.create({}, [
      sh1,
      WaterproofSchema.nodes.newline.create(),
      sh2,
    ]);
    const decos = getDecorations(makeState(doc));

    expect(decos).toHaveLength(2);
    expect(decos[0].from).toBe(0);
    expect(decos[0].to).toBe(sh1.nodeSize);
    // sh2 starts after sh1 and the newline (nodeSize 1).
    expect(decos[1].from).toBe(sh1.nodeSize + 1);
    expect(decos[1].to).toBe(sh1.nodeSize + 1 + sh2.nodeSize);
  });
});

// ============================================================
// Command tests
// ============================================================

describe("wrapInStudentHidden command", () => {
  function makeStateWithMarkdown(): EditorState {
    const mdNode = WaterproofSchema.nodes.markdown.create(
      {},
      WaterproofSchema.text("hello"),
    );
    const doc = WaterproofSchema.nodes.doc.create({}, mdNode);
    return stateWithNodeSelAt(doc, 0);
  }

  test("wraps selected node in a student_hidden node", () => {
    const state = makeStateWithMarkdown();
    const newState = applyCommand(state, wrapInStudentHidden(config));

    expect(newState).not.toBeNull();
    const doc = newState!.doc;
    expect(doc.firstChild!.type.name).toBe("student_hidden");
    expect(doc.firstChild!.firstChild!.type.name).toBe("markdown");
  });

  test("dry-run (no dispatch) returns true when node is selected", () => {
    const state = makeStateWithMarkdown();
    expect(wrapInStudentHidden(config)(state, undefined)).toBe(true);
  });

  test("returns false when selected node is a container", () => {
    const mdNode = WaterproofSchema.nodes.markdown.create(
      {},
      WaterproofSchema.text("hello"),
    );
    const cgNode = WaterproofSchema.nodes.container.create(
      { name: "test" },
      mdNode,
    );
    const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
    const state = stateWithNodeSelAt(doc, 0);
    expect(wrapInStudentHidden(config)(state, undefined)).toBe(false);
  });

  test("returns false when selected node is already student_hidden", () => {
    const mdNode = WaterproofSchema.nodes.markdown.create(
      {},
      WaterproofSchema.text("hello"),
    );
    const shNode = WaterproofSchema.nodes.student_hidden.create({}, mdNode);
    const doc = WaterproofSchema.nodes.doc.create({}, shNode);
    const state = stateWithNodeSelAt(doc, 0);
    expect(wrapInStudentHidden(config)(state, undefined)).toBe(false);
  });

  test("returns false for a node inside a container (student_hidden is doc-level only)", () => {
    const mdNode = WaterproofSchema.nodes.markdown.create(
      {},
      WaterproofSchema.text("hello"),
    );
    const cgNode = WaterproofSchema.nodes.container.create(
      { name: "test" },
      mdNode,
    );
    const doc = WaterproofSchema.nodes.doc.create({}, cgNode);
    // Select the markdown node inside the container (pos 1).
    const state = stateWithNodeSelAt(doc, 1);
    expect(wrapInStudentHidden(config)(state, undefined)).toBe(false);
  });
});

describe("wpLift from student_hidden", () => {
  test("lifts child out of student_hidden", () => {
    const mdNode = WaterproofSchema.nodes.markdown.create(
      {},
      WaterproofSchema.text("hello"),
    );
    const shNode = WaterproofSchema.nodes.student_hidden.create({}, mdNode);
    const doc = WaterproofSchema.nodes.doc.create({}, shNode);
    const state = stateWithNodeSelAt(doc, 0);

    const newState = applyCommand(state, wpLift(config));

    expect(newState).not.toBeNull();
    // After lifting, the markdown should be at doc level (no wrapper left)
    expect(newState!.doc.firstChild!.type.name).toBe("markdown");
  });
});
