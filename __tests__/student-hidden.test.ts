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
} from "../src/document/blocks";
import {
  Block,
  BlockRange,
  ContainerBlock,
  MarkdownBlock,
  StudentHiddenBlock,
  constructDocument,
} from "../src/document";
import { BLOCK_NAME } from "../src/document/blocks/block";
import { configuration } from "../src/markdown-defaults";
import {
  DefaultTagSerializer,
  SerializationError,
} from "../src/serialization/DocumentSerializer";
import { sanityCheckTree } from "./mapping/util";
import {
  createTestMapping,
  groupingChildCases,
  serializeBlocks,
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
// Parsing tests — like container, the .mv parser (statemachine.ts)
// does not produce student_hidden blocks; parsing is handled in
// waterproof-vscode.
// ============================================================

describe("student_hidden parsing (not supported by .mv parser)", () => {
  test("parser never produces student_hidden blocks", () => {
    const doc = `<student-hidden>
Some markdown content
</student-hidden>`;
    const blocks = parse(doc, { language: "lean4" });
    expect(blocks.every((b) => b.type !== BLOCK_NAME.STUDENT_HIDDEN)).toBe(
      true,
    );
  });
});

// ============================================================
// Block construction tests, parametrized over both grouping
// block classes (ContainerBlock and StudentHiddenBlock) since
// they share the same constructor contract.
// ============================================================

type ChildBlocksArg =
  | Block[]
  | ((
      innerContent: string,
      innerRange: BlockRange,
      lineStartOffset: number,
    ) => Block[]);

const groupingBlockClasses = [
  {
    blockClass: "ContainerBlock",
    nodeName: "container",
    make: (
      stringContent: string,
      range: BlockRange,
      innerRange: BlockRange,
      lineStart: number,
      childBlocks: ChildBlocksArg,
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
      childBlocks: ChildBlocksArg,
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
  test("existing typeguards do not match a StudentHiddenBlock", () => {
    const block = new StudentHiddenBlock(
      "",
      { from: 0, to: 0 },
      { from: 0, to: 0 },
      0,
      [],
    );
    expect(block.type).toBe(BLOCK_NAME.STUDENT_HIDDEN);
    expect(isContainerBlock(block)).toBe(false);
    expect(isInputAreaBlock(block)).toBe(false);
    expect(isHintBlock(block)).toBe(false);
    expect(isCodeBlock(block)).toBe(false);
    expect(isMarkdownBlock(block)).toBe(false);
    expect(isMathDisplayBlock(block)).toBe(false);
    expect(isNewlineBlock(block)).toBe(false);
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

      expect(tree.root.children.length).toBe(1);
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
  // KNOWN GAP: the serializer has no case for student_hidden nodes yet, so
  // serializing a document that contains one throws. This will be fixed
  // separately — when student_hidden serialization is implemented, replace
  // this test with one asserting the proper round-trip output.
  test("serializing a student_hidden node currently throws SerializationError", () => {
    const block = new StudentHiddenBlock(
      "Some text",
      { from: 0, to: 28 },
      { from: 14, to: 23 },
      0,
      [
        new MarkdownBlock(
          "Some text",
          { from: 14, to: 23 },
          { from: 14, to: 23 },
          0,
        ),
      ],
    );
    expect(() => serializeBlocks([block], serializer)).toThrow(
      SerializationError,
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
