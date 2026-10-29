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
  HistoryChange,
  OffsetMessageSegment,
  OffsetDiagnostic,
  Severity,
  ThemeStyle,
  WaterproofEditorConfig,
} from "../src/api";
import { CodeBlock } from "../src/document";
import { configuration } from "../src/markdown-defaults";
import { WaterproofSchema } from "../src";

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
    editor.setActiveDiagnostics([diag(0, 5, "present", Severity.Error)]);
    const removed = editor.removeDiagnostic(
      diag(10, 20, "absent", Severity.Warning),
    );
    expect(removed).toBe(false);
    expect(editor.getDiagnosticsInRange(0, 10).length).toBe(1);
  });

  test("only removes diagnostics that match on every field", () => {
    const editor = makeEditor();
    editor.setActiveDiagnostics([
      diag(0, 5, "present", Severity.Error),
      diag(0, 5, "other message", Severity.Error),
      diag(0, 5, "present", Severity.Warning),
    ]);
    const removed = editor.removeDiagnostic(
      diag(0, 5, "present", Severity.Error),
    );
    expect(removed).toBe(true);
    expect(
      editor.getDiagnosticsInRange(0, 10).map((d) => [d.message, d.severity]),
    ).toStrictEqual([
      ["other message", Severity.Error],
      ["present", Severity.Warning],
    ]);
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

// ── message segments ─────────────────────────────────────────────────────────

describe("diagnostics with message segments", () => {
  const segments: OffsetMessageSegment[] = [
    { text: "Try " },
    { text: "x", edit: { start: 0, end: 1, newText: "x" } },
  ];

  test("keeps the segments sent with setActiveDiagnostics", () => {
    const editor = makeEditor();
    editor.setActiveDiagnostics([{ ...diag(0, 5), segments }, diag(6, 8)], 1);

    const [first, second] = editor.getDiagnosticsInRange(0, 10);
    expect(first.segments).toStrictEqual(segments);
    expect(second.segments).toBeUndefined();
  });

  test("a later message replaces the segments", () => {
    const editor = makeEditor();
    editor.setActiveDiagnostics([{ ...diag(0, 5), segments }], 1);

    editor.setActiveDiagnostics([diag(0, 5)], 1);

    expect(editor.getDiagnosticsInRange(0, 5)[0].segments).toBeUndefined();
  });

  test("the diagnostics match the document only while its version is the one they were computed for", () => {
    const editor = makeEditor();
    expect(editor.diagnosticsMatchDocument).toBe(false);

    editor.setActiveDiagnostics([diag(0, 5)], 1);
    expect(editor.diagnosticsMatchDocument).toBe(true);

    editor.replaceRange(1, 6, "Hi");
    expect(editor.diagnosticsMatchDocument).toBe(false);

    editor.setActiveDiagnostics([diag(0, 5)], 2);
    expect(editor.diagnosticsMatchDocument).toBe(true);
  });

  test("diagnostics without a version never match the document", () => {
    const editor = makeEditor();
    editor.setActiveDiagnostics([diag(0, 5)]);
    expect(editor.diagnosticsMatchDocument).toBe(false);
  });
});

describe("applyEdit", () => {
  test("applies an edit at the mapped positions", () => {
    const editor = makeEditor();
    const before = editor.serializeDocument();
    expect(before).toContain("Hello world.");

    // "Hello" -> pm 1..6 (pm pos 0 is before the code node opens, pos 1 is the first
    // character, given the identity mapping).
    const ok = editor.applyEdit({ start: 1, end: 6, newText: "Hi" });

    expect(ok).toBe(true);
    expect(editor.serializeDocument()).toBe(
      before!.replace("Hello world.", "Hi world."),
    );
  });

  test("refuses an edit whose oldText does not match, without dispatching", () => {
    const editor = makeEditor();
    const before = editor.serializeDocument();
    // @ts-expect-error private field, used only to spy on the real view's dispatch
    const dispatchSpy = jest.spyOn(editor._view, "dispatch");

    const edit = { start: 1, end: 6, newText: "Hi", oldText: "Howdy" };
    expect(editor.canApplyEdit(edit)).toBe(false);
    expect(editor.applyEdit(edit)).toBe(false);

    expect(dispatchSpy).not.toHaveBeenCalled();
    expect(editor.serializeDocument()).toBe(before);
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

  test("applyEdit returns false", () => {
    expect(
      makeUninitializedEditor().applyEdit({ start: 0, end: 5, newText: "x" }),
    ).toBe(false);
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

// ── context menu removal ──────────────────────────────────────────────────────

describe("context menu removal", () => {
  test("constructing the editor does not install a custom context menu", () => {
    makeEditor();

    // No context menu element is added to the document...
    expect(document.querySelector(".context-menu")).toBeNull();

    // ...and the browser's native context menu is not suppressed.
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
