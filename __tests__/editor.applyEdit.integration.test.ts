/**
 * @jest-environment jsdom
 */

// Integration tests for applyEdit: unlike editor.test.ts, this file does
// not mock Mapping.

jest.mock("prosemirror-dev-tools", () => ({ applyDevTools: () => {} }));
jest.spyOn(global.console, "log").mockImplementation();

import { WaterproofEditor } from "../src/editor";
import { ThemeStyle, WaterproofEditorConfig } from "../src/api";
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
  templates: {
    example: "",
    exercise: { statement: "", closing: "" },
    containerOpenTag: "",
  },
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

describe("applyEdit with real text offsets (integration, real Mapping)", () => {
  test("lands an edit in a later code block", () => {
    const editor = makeEditor();
    const before = editor.serializeDocument()!;
    const start = before.indexOf("world.");

    const ok = editor.applyEdit({ start, end: start + 6, newText: "there." });

    expect(ok).toBe(true);
    expect(editor.serializeDocument()).toBe(before.replace("world.", "there."));
  });

  test("lands an edit in a code block nested in an input area", () => {
    const nestedSource = [
      "```coq",
      "abc",
      "```",
      "<input-area>",
      "```coq",
      "def",
      "```",
      "</input-area>",
      "",
    ].join("\n");
    const editor = makeEditor(nestedSource);
    const before = editor.serializeDocument()!;
    const start = before.indexOf("def");

    const ok = editor.applyEdit({
      start,
      end: start + 3,
      newText: "DEFINITELY",
    });

    expect(ok).toBe(true);
    expect(editor.serializeDocument()).toBe(
      before.replace("def", "DEFINITELY"),
    );
  });

  test("deletes a range (empty replacement) inside a code cell", () => {
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

describe("applyEdit guards against stale or forbidden edits", () => {
  const helpSource = ["```coq", "Lemma x.", "help.", "```", ""].join("\n");
  const inputAreaSource = [
    "<input-area>",
    "```coq",
    "help.",
    "```",
    "</input-area>",
    "",
  ].join("\n");

  test("applies an edit whose oldText still matches the document", () => {
    const editor = makeEditor(helpSource);
    const before = editor.serializeDocument()!;
    const start = before.indexOf("help");

    const ok = editor.applyEdit({
      start,
      end: start + 4,
      newText: "exact h",
      oldText: "help",
    });

    expect(ok).toBe(true);
    expect(editor.serializeDocument()).toBe(before.replace("help", "exact h"));
  });

  test("checks oldText against the editor content, not the serialized document", () => {
    // Serialization does not have to reproduce the file exactly: the Lean serializer writes
    // a placeholder document title, which shifts every offset after it.
    const editor = makeEditor(helpSource);
    const before = editor.serializeDocument()!;
    const start = before.indexOf("help");
    const serialize = jest
      .spyOn(editor, "serializeDocument")
      .mockReturnValue("a longer title\n" + before);

    const ok = editor.applyEdit({
      start,
      end: start + 4,
      newText: "exact h",
      oldText: "help",
    });

    serialize.mockRestore();
    expect(ok).toBe(true);
    expect(editor.serializeDocument()).toBe(before.replace("help", "exact h"));
  });

  test("refuses an edit computed before an earlier change shifted the text", () => {
    const editor = makeEditor(helpSource);
    const before = editor.serializeDocument()!;
    const start = before.indexOf("help");
    const edit = { start, end: start + 4, newText: "exact h", oldText: "help" };

    // The user types in front of the suggestion before clicking it.
    const lemma = before.indexOf("Lemma");
    editor.replaceRange(lemma, lemma, "AB");
    const afterTyping = editor.serializeDocument();

    expect(editor.canApplyEdit(edit)).toBe(false);
    expect(editor.applyEdit(edit)).toBe(false);
    expect(editor.serializeDocument()).toBe(afterTyping);
  });

  test("with requireEditable, refuses edits outside input areas in student mode", () => {
    const editor = makeEditor(helpSource);
    const before = editor.serializeDocument()!;
    const start = before.indexOf("help");
    const edit = { start, end: start + 4, newText: "exact h" };

    expect(editor.canApplyEdit(edit)).toBe(true);
    expect(editor.canApplyEdit(edit, { requireEditable: true })).toBe(false);
    expect(editor.applyEdit(edit, { requireEditable: true })).toBe(false);
    expect(editor.serializeDocument()).toBe(before);
  });

  test("with requireEditable, applies edits inside an input area", () => {
    const editor = makeEditor(inputAreaSource);
    const before = editor.serializeDocument()!;
    const start = before.indexOf("help");
    const edit = { start, end: start + 4, newText: "exact h", oldText: "help" };

    expect(editor.canApplyEdit(edit, { requireEditable: true })).toBe(true);
    expect(editor.applyEdit(edit, { requireEditable: true })).toBe(true);
    expect(editor.serializeDocument()).toBe(before.replace("help", "exact h"));
  });
});
