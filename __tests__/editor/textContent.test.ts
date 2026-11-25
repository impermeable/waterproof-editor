/**
 * @jest-environment jsdom
 */

// Test the textContent and textContentOfInputAreas functionality of the WaterproofEditor class.

jest.mock("prosemirror-dev-tools", () => ({ applyDevTools: () => {} }));

jest.spyOn(global.console, "log").mockImplementation();

import { WaterproofEditor } from "../../src/editor";
import { TextContentOfSpecifier } from "../../src/api";
import { defaultWaterproofTextConfig } from "../defaultWaterproofTextConfig";
import { intersectionObserverMock } from "../intersectionObserverMock";

const cfg = defaultWaterproofTextConfig();

function makeEditor(doc: string): WaterproofEditor {
  const el = document.createElement("div");
  const editor = new WaterproofEditor(el, cfg);
  editor.init(doc);
  return editor;
}

//@ts-ignore
global.IntersectionObserver = intersectionObserverMock;

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
    "md\n```bla\ncode\n```\nmd<input-area>\n```bla\ncode\n```\nmd</input-area>";
  const editor = makeEditor(doc);

  test("content of code", () => {
    const res = editor.textContent(TextContentOfSpecifier.CODE);
    expect(res).toHaveLength(1);
    expect(res[0]).toStrictEqual([
      "code",
      { parent: "doc", start: 10, end: 14 },
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
    expect(res[1]).toStrictEqual(["md", { parent: "doc", start: 19, end: 21 }]);
  });

  describe("all", () => {
    test("no argument", () => {
      const res = editor.textContent();
      expect(res).toHaveLength(5);
      expect(res[0]).toStrictEqual(["md", { parent: "doc", start: 0, end: 2 }]);
      expect(res[1]).toStrictEqual([
        "code",
        { parent: "doc", start: 10, end: 14 },
      ]);
      expect(res[2]).toStrictEqual([
        "md",
        { parent: "doc", start: 19, end: 21 },
      ]);
      expect(res[3]).toStrictEqual([
        "code",
        { parent: "input", start: 41, end: 45 },
      ]);
      expect(res[4]).toStrictEqual([
        "md",
        { parent: "input", start: 50, end: 52 },
      ]);
    });

    test("explicit ALL option", () => {
      const res = editor.textContent(TextContentOfSpecifier.ALL);
      expect(res).toHaveLength(5);
      expect(res[0]).toStrictEqual(["md", { parent: "doc", start: 0, end: 2 }]);
      expect(res[1]).toStrictEqual([
        "code",
        { parent: "doc", start: 10, end: 14 },
      ]);
      expect(res[2]).toStrictEqual([
        "md",
        { parent: "doc", start: 19, end: 21 },
      ]);
      expect(res[3]).toStrictEqual([
        "code",
        { parent: "input", start: 41, end: 45 },
      ]);
      expect(res[4]).toStrictEqual([
        "md",
        { parent: "input", start: 50, end: 52 },
      ]);
    });
  });

  describe("content inside input areas is included when flagged", () => {
    test("markdown", () => {
      const res = editor.textContent(
        TextContentOfSpecifier.MARKDOWN | TextContentOfSpecifier.INPUT_AREA,
      );
      expect(res).toHaveLength(3);
      expect(res[0]).toStrictEqual(["md", { parent: "doc", start: 0, end: 2 }]);
      expect(res[1]).toStrictEqual([
        "md",
        { parent: "doc", start: 19, end: 21 },
      ]);
      expect(res[2]).toStrictEqual([
        "md",
        { parent: "input", start: 50, end: 52 },
      ]);
    });

    test("code", () => {
      const res = editor.textContent(
        TextContentOfSpecifier.CODE | TextContentOfSpecifier.INPUT_AREA,
      );

      expect(res).toHaveLength(2);
    });
  });
});
