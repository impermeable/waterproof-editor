/**
 * @jest-environment jsdom
 */

// Integration tests for replaceRanges: unlike editor.test.ts, this file does
// not mock Mapping.

jest.mock("prosemirror-dev-tools", () => ({ applyDevTools: () => {} }));
jest.spyOn(global.console, "log").mockImplementation();

import { WaterproofEditor } from "../src/editor";
import {
  DocChange,
  HistoryChange,
  ThemeStyle,
  WaterproofEditorConfig,
  WrappingDocChange,
} from "../src/api";
import { configuration, parse } from "../src/markdown-defaults";

// A source document with two separate ```coq code blocks, so the parser
// produces two sibling CodeBlock nodes (two separate PM atom nodes).
const source = ["```coq", "Hello ", "```", "```coq", "world.", "```", ""].join(
  "\n",
);

const cfg: WaterproofEditorConfig = {
  api: {
    applyStepError: () => {},
    cursorChange: () => {},
    documentChange: () => {},
    editorReady: () => {},
    executeCommand: () => {},
    executeHelp: () => {},
    viewportHint: () => {},
  },
  completions: [],
  documentConstructor: (doc) => parse(doc, { language: "coq" }),
  symbols: [],
  tagConfiguration: configuration("coq"),
};

function makeEditor(
  customSource: string = source,
  overrides: Partial<WaterproofEditorConfig> = {},
) {
  const el = document.createElement("div");
  jest.spyOn(WaterproofEditor.prototype, "handleScroll").mockImplementation();
  jest
    //@ts-expect-error private method
    .spyOn(WaterproofEditor.prototype, "informCodemirrorViews")
    .mockImplementation();
  const editor = new WaterproofEditor(
    el,
    { ...cfg, ...overrides },
    ThemeStyle.Light,
  );
  editor.init(customSource);
  return editor;
}

describe("replaceRanges across multiple prosemirror nodes (integration, real Mapping)", () => {
  test("edits computed from real text offsets in two different code blocks land correctly, regardless of array order", () => {
    const before = makeEditor().serializeDocument()!;
    const helloStart = before.indexOf("Hello ");
    const helloEnd = helloStart + "Hello ".length; // == contentRange.to of block 1
    const worldStart = before.indexOf("world.");
    const worldEnd = worldStart + "world.".length; // == contentRange.to of block 2
    const expected = before
      .replace("Hello ", "Hi ")
      .replace("world.", "WATERPROOF.");

    const inOrder = makeEditor();
    const okInOrder = inOrder.replaceRanges([
      { start: helloStart, end: helloEnd, newText: "Hi " },
      { start: worldStart, end: worldEnd, newText: "WATERPROOF." },
    ]);
    expect(okInOrder).toBe(true);
    expect(inOrder.serializeDocument()).toBe(expected);

    const reversed = makeEditor();
    const okReversed = reversed.replaceRanges([
      { start: worldStart, end: worldEnd, newText: "WATERPROOF." },
      { start: helloStart, end: helloEnd, newText: "Hi " },
    ]);
    expect(okReversed).toBe(true);
    expect(reversed.serializeDocument()).toBe(expected);
  });

  test("cross-node edit undoes as a single step", () => {
    const editor = makeEditor();
    const before = editor.serializeDocument();

    const helloStart = before!.indexOf("Hello");
    const worldStart = before!.indexOf("world");

    editor.replaceRanges([
      { start: helloStart, end: helloStart + 5, newText: "Hi" },
      { start: worldStart, end: worldStart + 5, newText: "WATERPROOF" },
    ]);
    expect(editor.serializeDocument()).toBe(
      before!.replace("Hello", "Hi").replace("world", "WATERPROOF"),
    );

    editor.handleHistoryChange(HistoryChange.Undo);

    expect(editor.serializeDocument()).toBe(before);
  });

  test("documentChange edits, applied in order to the original text, reproduce the correct on-disk result", () => {
    const changes: Array<DocChange | WrappingDocChange> = [];
    const editor = makeEditor(source, {
      api: { ...cfg.api, documentChange: (c) => changes.push(c) },
    });
    const before = editor.serializeDocument()!;

    const helloStart = before.indexOf("Hello");
    const worldStart = before.indexOf("world");

    editor.replaceRanges([
      { start: helloStart, end: helloStart + 5, newText: "Hi" },
      { start: worldStart, end: worldStart + 5, newText: "WATERPROOF" },
    ]);

    const isDocChange = (c: DocChange | WrappingDocChange): c is DocChange =>
      "finalText" in c;

    // Simulate a host applying each reported change to its own text buffer,
    // in the order the callback received them.
    let hostText = before;
    for (const change of changes) {
      expect(isDocChange(change)).toBe(true);
      if (!isDocChange(change)) continue;
      hostText =
        hostText.slice(0, change.startInFile) +
        change.finalText +
        hostText.slice(change.endInFile);
    }

    expect(hostText).toBe(
      before.replace("Hello", "Hi").replace("world", "WATERPROOF"),
    );
  });

  test("edit inside a nested input-area code block plus a later top-level code block", () => {
    const nestedSource = [
      "```coq",
      "abc",
      "```",
      "<input-area>",
      "```coq",
      "def",
      "```",
      "</input-area>",
      "```coq",
      "ghi",
      "```",
      "",
    ].join("\n");

    const editor = makeEditor(nestedSource);
    const before = editor.serializeDocument()!;

    const defStart = before.indexOf("def");
    const ghiStart = before.indexOf("ghi");

    const ok = editor.replaceRanges([
      { start: defStart, end: defStart + 3, newText: "DEFINITELY" },
      { start: ghiStart, end: ghiStart + 3, newText: "GH" },
    ]);

    expect(ok).toBe(true);
    expect(editor.serializeDocument()).toBe(
      before.replace("def", "DEFINITELY").replace("ghi", "GH"),
    );
  });

  test("two edits in sibling code blocks inside the same input-area", () => {
    const nestedSource = [
      "<input-area>",
      "```coq",
      "first",
      "```",
      "```coq",
      "second",
      "```",
      "</input-area>",
      "",
    ].join("\n");

    const editor = makeEditor(nestedSource);
    const before = editor.serializeDocument()!;

    const firstStart = before.indexOf("first");
    const secondStart = before.indexOf("second");

    const ok = editor.replaceRanges([
      { start: secondStart, end: secondStart + 6, newText: "2ND" },
      { start: firstStart, end: firstStart + 5, newText: "FIRST PLACE" },
    ]);

    expect(ok).toBe(true);
    expect(editor.serializeDocument()).toBe(
      before.replace("first", "FIRST PLACE").replace("second", "2ND"),
    );
  });

  test("edits in two directly adjacent code blocks with no gap between them", () => {
    const adjacentSource = "```coq\nfirst\n``````coq\nsecond\n```";

    const editor = makeEditor(adjacentSource);
    const before = editor.serializeDocument()!;

    const firstStart = before.indexOf("first");
    const secondStart = before.indexOf("second");

    const ok = editor.replaceRanges([
      { start: firstStart, end: firstStart + 5, newText: "FIRST PLACE" },
      { start: secondStart, end: secondStart + 6, newText: "2ND" },
    ]);

    expect(ok).toBe(true);
    expect(editor.serializeDocument()).toBe(
      before.replace("first", "FIRST PLACE").replace("second", "2ND"),
    );
  });

  test("edits spanning a code node and a markdown node", () => {
    const mixedSource = "```coq\ncode text\n```\nSome markdown text\n";

    const editor = makeEditor(mixedSource);
    const before = editor.serializeDocument()!;

    const codeStart = before.indexOf("code text");
    const mdStart = before.indexOf("markdown text");

    const ok = editor.replaceRanges([
      { start: mdStart, end: mdStart + 13, newText: "MD" },
      {
        start: codeStart,
        end: codeStart + 9,
        newText: "SOME LONGER CODE TEXT",
      },
    ]);

    expect(ok).toBe(true);
    expect(editor.serializeDocument()).toBe(
      before
        .replace("code text", "SOME LONGER CODE TEXT")
        .replace("markdown text", "MD"),
    );
  });

  test("deleting a range (empty replacement) inside a code cell", () => {
    const editor = makeEditor();
    const before = editor.serializeDocument()!;
    const helloStart = before.indexOf("Hello ");

    const ok = editor.replaceRange(
      helloStart,
      helloStart + "Hello ".length,
      "",
    );

    expect(ok).toBe(true);
    expect(editor.serializeDocument()).toBe(before.replace("Hello ", ""));
  });
});
