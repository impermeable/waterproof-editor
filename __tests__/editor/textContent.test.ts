/**
 * @jest-environment jsdom
 */

// Test the textContent and textContentOfInputAreas functionality of the WaterproofEditor class.

jest.mock("prosemirror-dev-tools", () => ({ applyDevTools: () => {} }));

jest.spyOn(global.console, "log").mockImplementation();

import { WaterproofEditor } from "../../src/editor";
import {
  TextContentOfSpecifier,
  ThemeStyle,
  WaterproofEditorConfig,
} from "../../src/api";
import { configuration, parse } from "../../src/markdown-defaults";

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
  documentConstructor: (v) => parse(v, { language: "bla" }),
  symbols: [],
  tagConfiguration: configuration("bla"),
  templates: {
    containerOpenTag: "",
    example: "",
    exercise: { statement: "", closing: "" },
  },
};

function makeEditor(doc: string): WaterproofEditor {
  const el = document.createElement("div");
  jest.spyOn(WaterproofEditor.prototype, "handleScroll").mockImplementation();
  const editor = new WaterproofEditor(el, cfg, ThemeStyle.Light);
  editor.init(doc);
  return editor;
}

describe("textContent (just a code cell)", () => {
  const doc = "```bla\nHello, world!\n```";
  const editor = makeEditor(doc);

  test("with code flag should return text content", () => {
    const res = editor.textContent(TextContentOfSpecifier.CODE);
    expect(res).toHaveLength(1);
    expect(res[0]).toHaveLength(2);
    expect(res[0]).toStrictEqual([
      "Hello, world!",
      { start: 7, end: 20, parent: "doc" },
    ]);
  });

  for (let i = 0; i < 32; i++) {
    if ((i & 1) === 0) {
      test(`with other flags nothing is returned (flags = 0b${i.toString(2).padStart(5, "0")})`, () => {
        const res = editor.textContent(i);
        expect(res).toHaveLength(0);
      });
    }
  }
});

describe("textContent (mixed document)", () => {
  const doc =
    "md\n```bla\ncode\n```\nmd\n<input-area>\n```bla\ncode\n```\n</input-area>";
  const editor = makeEditor(doc);

  test("content of code", () => {
    const res = editor.textContent(TextContentOfSpecifier.CODE);
    expect(res).toHaveLength(2);
    expect(res[0]).toStrictEqual([
      "code",
      { parent: "doc", start: 10, end: 14 },
    ]);
    expect(res[1]).toStrictEqual([
      "code",
      { parent: "input", start: 42, end: 46 },
    ]);
  });

  test("content of empty selector", () => {
    const res = editor.textContent(0);
    expect(res).toHaveLength(0);
  });

  test("content of markdown", () => {
    const res = editor.textContent(TextContentOfSpecifier.MARKDOWN);
    expect(res).toHaveLength(2);
    expect(res[0]).toStrictEqual(["md", { parent: "doc", start: 0, end: 2 }]);
    expect(res[1]).toStrictEqual(["md", { parent: "doc", start: 16, end: 18 }]);
  });

  // test("content of code (input set)", () => {
  //   const res = editor.textContent(
  //     TextContentOfSpecifier.CODE | TextContentOfSpecifier.INPUT_AREA,
  //   );

  //   expect(res).toHaveLength(2);
  // });
});
