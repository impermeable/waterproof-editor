import { EditorState, NodeSelection, Transaction } from "prosemirror-state";
import { Node as PNode } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import {
  DocumentSerializer,
  Mapping,
  TagConfiguration,
  WaterproofDocument,
} from "../src/api";
import {
  Block,
  BlockRange,
  CodeBlock,
  HintBlock,
  InputAreaBlock,
  MarkdownBlock,
  MathDisplayBlock,
  constructDocument,
} from "../src/document";

// ============================================================
// Shared test utility helpers
// ============================================================

/** Constructs a document from blocks and serializes it with the given serializer. */
export function serializeBlocks(
  blocks: WaterproofDocument,
  serializer: DocumentSerializer,
): string {
  return serializer.serializeDocument(constructDocument(blocks));
}

/** Creates a Mapping for `blocks` and returns the underlying tree. */
export function createTestMapping(
  blocks: WaterproofDocument,
  config: TagConfiguration,
  serializer: DocumentSerializer,
) {
  const mapping = new Mapping(blocks, 1, config, serializer);
  return mapping.getMapping();
}

/** Creates an EditorState with a NodeSelection at `pos`. */
export function stateWithNodeSelAt(doc: PNode, pos: number): EditorState {
  const state = EditorState.create({ doc });
  return state.apply(
    state.tr.setSelection(NodeSelection.create(state.doc, pos)),
  );
}

/** Applies a ProseMirror command to `state`, returning the resulting state or null if not dispatched. */
export function applyCommand(
  state: EditorState,
  cmd: (s: EditorState, dispatch?: (tr: Transaction) => void) => boolean,
): EditorState | null {
  let newState: EditorState | null = null;
  cmd(state, (tr) => {
    newState = state.apply(tr);
  });
  return newState;
}

/** Position immediately before the first node matching `predicate` (the NodeView getPos contract). */
export function findNodePos(
  doc: PNode,
  predicate: (n: PNode) => boolean,
): number {
  let result = -1;
  doc.descendants((node, pos) => {
    if (result !== -1) return false;
    if (predicate(node)) {
      result = pos;
      return false;
    }
    return true;
  });
  if (result === -1) throw new Error("node not found");
  return result;
}

/** Minimal fake outer view for NodeView tests: only `.state`, `.dispatch` and `.editable` are read. */
export function fakeOuterView(state: EditorState) {
  return {
    state,
    dispatch: jest.fn(),
    editable: true,
  } as unknown as EditorView;
}

/**
 * Fake outer view whose `dispatch` applies the transaction to its state, so
 * tests can observe the resulting document. `dispatch` is a jest mock.
 */
export function applyingOuterView(initial: EditorState) {
  const holder = {
    state: initial,
    editable: true,
    dispatch: jest.fn((tr: Transaction) => {
      holder.state = holder.state.apply(tr);
    }),
  };
  return holder as unknown as EditorView & {
    state: EditorState;
    dispatch: jest.Mock;
  };
}

/** Returns the type names of all direct children of a doc node. */
export function docChildTypes(doc: PNode): string[] {
  const types: string[] = [];
  doc.forEach((child) => types.push(child.type.name));
  return types;
}

// ============================================================
// Shared fixtures for grouping blocks (container, student_hidden)
// ============================================================

export type GroupingChildCase = {
  /** Name of the (top-most) child block type, used in test titles. */
  child: string;
  /** The string content of the grouping block (its serialized children). */
  stringContent: string;
  /** Range of the entire grouping block, including its tags. */
  range: BlockRange;
  /** Range of the grouping block's inner content, excluding its tags. */
  innerRange: BlockRange;
  /** The child blocks of the grouping block. */
  innerBlocks: Block[];
};

/**
 * Inner-block fixtures for blocks that group child blocks together
 * (`ContainerBlock`, `StudentHiddenBlock`). Ranges assume the grouping
 * block's open tag occupies offsets 0-13 and are mutually consistent
 * (children exactly tile the parent's inner range), so the fixtures can be
 * used for serialization as well as mapping tests.
 * A fresh set of blocks is created on every call.
 */
export function groupingChildCases(): GroupingChildCase[] {
  return [
    {
      child: "markdown",
      stringContent: "Some text",
      range: { from: 0, to: 28 },
      innerRange: { from: 14, to: 23 },
      innerBlocks: [
        new MarkdownBlock(
          "Some text",
          { from: 14, to: 23 },
          { from: 14, to: 23 },
          0,
        ),
      ],
    },
    {
      child: "code",
      stringContent: "```lean4\ndef x := 1\n```",
      range: { from: 0, to: 42 },
      innerRange: { from: 14, to: 37 },
      innerBlocks: [
        new CodeBlock(
          "def x := 1",
          { from: 14, to: 37 },
          { from: 21, to: 31 },
          0,
        ),
      ],
    },
    {
      child: "input area",
      stringContent: "<input-area>input text</input-area>",
      range: { from: 0, to: 54 },
      innerRange: { from: 14, to: 49 },
      innerBlocks: [
        new InputAreaBlock(
          "input text",
          { from: 14, to: 49 },
          { from: 26, to: 36 },
          0,
          [
            new MarkdownBlock(
              "input text",
              { from: 26, to: 36 },
              { from: 26, to: 36 },
              0,
            ),
          ],
        ),
      ],
    },
    {
      child: "hint",
      stringContent: '<hint title="My Hint">hint text</hint>',
      range: { from: 0, to: 57 },
      innerRange: { from: 14, to: 52 },
      innerBlocks: [
        new HintBlock(
          "hint text",
          "My Hint",
          { from: 14, to: 52 },
          { from: 40, to: 49 },
          0,
          [
            new MarkdownBlock(
              "hint text",
              { from: 40, to: 49 },
              { from: 40, to: 49 },
              0,
            ),
          ],
        ),
      ],
    },
    {
      child: "math_display",
      stringContent: "$$x^2$$",
      range: { from: 0, to: 26 },
      innerRange: { from: 14, to: 21 },
      innerBlocks: [
        new MathDisplayBlock(
          "x^2",
          { from: 14, to: 21 },
          { from: 16, to: 19 },
          0,
        ),
      ],
    },
    {
      child: "multiple children (markdown + code)",
      stringContent: "intro```lean4\ndef x := 1\n```",
      range: { from: 0, to: 47 },
      innerRange: { from: 14, to: 42 },
      innerBlocks: [
        new MarkdownBlock(
          "intro",
          { from: 14, to: 19 },
          { from: 14, to: 19 },
          0,
        ),
        new CodeBlock(
          "def x := 1",
          { from: 19, to: 42 },
          { from: 26, to: 36 },
          0,
        ),
      ],
    },
  ];
}
