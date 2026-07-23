/**
 * @jest-environment jsdom
 */

// AI-generated tests

jest.mock("prosemirror-dev-tools", () => ({ applyDevTools: () => {} }));

jest.mock("../src/mapping/mapping", () => {
  const actual = jest.requireActual("../src/mapping/mapping");
  return {
    ...actual,
    Mapping: class extends actual.Mapping {
      pmIndexToTextOffset = (x: number) => x;
      textOffsetToPmIndex = (x: number) => x;
    },
  };
});

jest.spyOn(global.console, "log").mockImplementation();

import { WaterproofEditor } from "../src/editor";
import {
  OffsetDiagnostic,
  Severity,
  ThemeStyle,
  WaterproofEditorConfig,
} from "../src/api";
import { CodeBlock } from "../src/document";
import { configuration } from "../src/markdown-defaults";
import { WaterproofSchema } from "../src";

import { EditorView } from "prosemirror-view";
import * as inputAreaModule from "../src/inputArea";
import { NodeType } from "prosemirror-model";

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
  documentConstructor: () => [
    new CodeBlock("Hello world.", { from: 0, to: 12 }, { from: 0, to: 12 }, 0),
  ],
  symbols: [],
  tagConfiguration: configuration("coq"),
};

function makeEditor(): WaterproofEditor {
  const el = document.createElement("div");
  jest.spyOn(WaterproofEditor.prototype, "handleScroll").mockImplementation();
  jest
    //@ts-expect-error private method
    .spyOn(WaterproofEditor.prototype, "informCodemirrorViews")
    .mockImplementation();
  const editor = new WaterproofEditor(el, cfg, ThemeStyle.Light);
  editor.init("");
  return editor;
}

function diag(
  startOffset: number,
  endOffset: number,
  message = "msg",
  severity = Severity.Error,
): OffsetDiagnostic {
  return { startOffset, endOffset, message, severity };
}

// ── clearDiagnostics ──────────────────────────────────────────────────────────

describe("clearDiagnostics", () => {
  test("removes all diagnostics and bumps version", () => {
    const editor = makeEditor();
    editor.setActiveDiagnostics([diag(0, 5), diag(6, 10)]);
    expect(editor.diagnosticsVersion).toBe(1);

    editor.clearDiagnostics();
    expect(editor.diagnosticsVersion).toBe(2);
    expect(editor.getDiagnosticsInRange(0, 100)).toStrictEqual([]);
  });

  test("is a no-op on an already-empty store", () => {
    const editor = makeEditor();
    editor.clearDiagnostics();
    expect(editor.diagnosticsVersion).toBe(1);
    expect(editor.getDiagnosticsInRange(0, 100)).toStrictEqual([]);
  });
});

// ── removeDiagnostic ──────────────────────────────────────────────────────────

describe("removeDiagnostic", () => {
  test("returns false when the diagnostic does not exist", () => {
    const editor = makeEditor();
    // removeDiagnostic filters out entries where ANY field matches, so to get a
    // true "not found" result we need a query that differs on every field.
    editor.setActiveDiagnostics([diag(0, 5, "present", Severity.Error)]);
    const removed = editor.removeDiagnostic(
      diag(10, 20, "absent", Severity.Warning),
    );
    expect(removed).toBe(false);
    expect(editor.getDiagnosticsInRange(0, 10).length).toBe(1);
  });
});

// ── getDiagnosticsInRange ─────────────────────────────────────────────────────

describe("getDiagnosticsInRange", () => {
  test("excludes a diagnostic whose start is before low", () => {
    const editor = makeEditor();
    editor.setActiveDiagnostics([diag(0, 8)]);
    // low=5: start(0) < low(5), so it should not be returned
    expect(editor.getDiagnosticsInRange(5, 10)).toStrictEqual([]);
  });

  test("excludes a diagnostic whose end is beyond high", () => {
    const editor = makeEditor();
    editor.setActiveDiagnostics([diag(3, 12)]);
    // high=10: end(12) > high(10), so it should not be returned
    expect(editor.getDiagnosticsInRange(0, 10)).toStrictEqual([]);
  });

  test("includes a diagnostic that exactly touches both boundaries", () => {
    const editor = makeEditor();
    editor.setActiveDiagnostics([diag(5, 10)]);
    const result = editor.getDiagnosticsInRange(5, 10);
    expect(result.length).toBe(1);
    expect(result[0].start).toBe(5);
    expect(result[0].end).toBe(10);
  });
});

// ── getPartialDiagnosticsInRange ──────────────────────────────────────────────

describe("getPartialDiagnosticsInRange", () => {
  test("clips a diagnostic that spans beyond both ends of the range", () => {
    const editor = makeEditor();
    editor.setActiveDiagnostics([diag(0, 20, "wide")]);
    const result = editor.getPartialDiagnosticsInRange(5, 15);
    expect(result.length).toBe(1);
    expect(result[0].start).toBe(5);
    expect(result[0].end).toBe(15);
  });

  test("excludes a diagnostic that does not overlap the range at all", () => {
    const editor = makeEditor();
    editor.setActiveDiagnostics([diag(20, 30)]);
    expect(editor.getPartialDiagnosticsInRange(0, 10)).toStrictEqual([]);
  });

  test("includes a diagnostic that only touches the range boundary", () => {
    const editor = makeEditor();
    editor.setActiveDiagnostics([diag(10, 20)]);
    // [0,10] and [10,20] share only the point 10
    const result = editor.getPartialDiagnosticsInRange(0, 10);
    expect(result.length).toBe(1);
    expect(result[0].start).toBe(10);
    expect(result[0].end).toBe(10);
  });
});

// ── early returns without an initialized view ─────────────────────────────────

describe("methods with no view initialised", () => {
  function makeUninitializedEditor(): WaterproofEditor {
    const el = document.createElement("div");
    return new WaterproofEditor(el, cfg, ThemeStyle.Light);
  }

  test("serializeDocument returns undefined", () => {
    expect(makeUninitializedEditor().serializeDocument()).toBeUndefined();
  });

  test("textContentOfInputAreas returns empty array", () => {
    expect(makeUninitializedEditor().textContentOfInputAreas()).toStrictEqual(
      [],
    );
  });

  test("replaceRange returns false", () => {
    expect(makeUninitializedEditor().replaceRange(0, 5, "x")).toBe(false);
  });

  test("insertSymbol returns false", () => {
    expect(makeUninitializedEditor().insertSymbol("α")).toBe(false);
  });
});

describe("handleMouseDown", () => {
  let isEditableSpy: jest.SpyInstance;
  let editor: WaterproofEditor;

  beforeEach(() => {
    jest.restoreAllMocks();
    editor = makeEditor();
    isEditableSpy = jest.spyOn(inputAreaModule, "isPositionEditable");
  });

  function simulateMouseDown(
    nodeType: NodeType | null,
    isEditable: boolean = false,
    targetIsNull = false,
  ) {
    isEditableSpy.mockReturnValue(isEditable);

    const fakeView = {
      posAtDOM: jest.fn().mockReturnValue(0),
      state: {
        doc: {
          resolve: jest.fn().mockReturnValue({
            node: () => ({ type: nodeType }),
          }),
        },
      },
    };

    const event = new MouseEvent("mousedown");
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");

    // Conditionally mock the target
    Object.defineProperty(event, "target", {
      value: targetIsNull ? null : document.createElement("span"),
    });

    //@ts-expect-error private method
    const result = editor.handleMouseDown(fakeView, event);

    return { result, preventDefaultSpy };
  }

  test("null target -> prevents default and returns undefined", () => {
    const { result, preventDefaultSpy } = simulateMouseDown(null, false, true);

    expect(result).toBeUndefined();
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(isEditableSpy).not.toHaveBeenCalled();
  });

  test("math_display + not editable -> returns true (event handled)", () => {
    const { result, preventDefaultSpy } = simulateMouseDown(
      WaterproofSchema.nodes.math_display,
      false,
    );

    expect(result).toBe(true);
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  test("math_display + editable -> returns false (event not handled)", () => {
    const { result, preventDefaultSpy } = simulateMouseDown(
      WaterproofSchema.nodes.math_display,
      true,
    );

    expect(result).toBe(false);
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  test("other nodes (e.g. code_block) -> prevents default and returns undefined", () => {
    const { result, preventDefaultSpy } = simulateMouseDown(
      WaterproofSchema.nodes.code_block,
      false,
    );

    expect(result).toBeUndefined();
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(isEditableSpy).not.toHaveBeenCalled();
  });
});
