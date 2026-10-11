/**
 * @jest-environment jsdom
 */
import { expect } from "@jest/globals";
import { CodeBlockView } from "../src/codeview";
import { Severity, ThemeStyle } from "../src/api";
import { Node } from "prosemirror-model";
import { WaterproofSchema } from "../src/schema";
import { severityToString } from "../src/codeview/nodeview";

// Mock the plugin key to always return state teacher=true
jest.mock("../src/inputArea.ts", () => ({
  INPUT_AREA_PLUGIN_KEY: {
    getState: jest.fn(() => ({ teacher: true })),
  },
}));

const docText = "Qed.";
const docStart = 0;
const docEnd = docText.length;
const node: Node = WaterproofSchema.nodes["code"].create(
  null,
  WaterproofSchema.text(docText),
);

test("Basic diagnostic", () => {
  const nodeview = new CodeBlockView(
    node,
    //@ts-expect-error For test setup supply only the minimal needed to get a working CodeBlockView
    { editable: true },
    null,
    () => undefined,
    null,
    [],
    [],
    ThemeStyle.Light,
  );

  const diag = {
    start: docStart,
    end: docEnd,
    message: "test",
    severity: Severity.Error,
  };

  const result = nodeview.preprocessDiagnostic(
    diag.start,
    diag.end,
    diag.message,
    diag.severity,
  );

  expect(result.from).toBe(diag.start);
  expect(result.to).toBe(diag.end);
  expect(result.message).toBe(diag.message);
  expect(result.severity).toBe(severityToString(diag.severity));

  expect(result.actions).toBeDefined();
  expect(result.actions?.length).toBe(1);

  expect(result.actions?.at(0)?.name).toBe("📋");
});

describe("message segments", () => {
  const edit = { start: 0, end: 4, newText: "We apply h", oldText: "Qed." };
  const segments = [
    { text: "Help\n  • " },
    { text: "We apply h", edit },
    { text: "\n  done" },
  ];

  function makeSegmentView(editorInstance: object) {
    return new CodeBlockView(
      node,
      //@ts-expect-error For test setup supply only the minimal needed editor API
      { editable: true },
      editorInstance,
      () => undefined,
      null,
      [],
      [],
      ThemeStyle.Light,
    );
  }

  /** An editor on which every edit can be applied, unless `canApplyEdit` is overridden. */
  const makeEditorInstance = () => ({
    applyEdit: jest.fn(() => true),
    canApplyEdit: jest.fn(() => true),
  });

  const render = (diagnostic: { renderMessage?: unknown }) =>
    (diagnostic.renderMessage as () => HTMLElement)();

  test("renders suggestion segments as buttons in the message", () => {
    const nodeview = makeSegmentView(makeEditorInstance());

    const result = nodeview.preprocessDiagnostic(
      docStart,
      docEnd,
      "Help\n  • We apply h\n  done",
      Severity.Information,
      segments,
    );

    const element = render(result);
    expect(element.textContent).toBe("Help\n  • We apply h\n  done");
    const links = element.querySelectorAll(".cm-diagnosticSuggestion");
    expect(links).toHaveLength(1);
    expect(links[0].textContent).toBe("We apply h");
    expect(links[0].tagName).toBe("BUTTON");
    // The plain message is kept, e.g. for the copy action.
    expect(result.message).toBe("Help\n  • We apply h\n  done");
    expect(result.actions?.map((action) => action.name)).toStrictEqual(["📋"]);
  });

  test("clicking a suggestion applies its edit", () => {
    const editorInstance = makeEditorInstance();
    const nodeview = makeSegmentView(editorInstance);
    const result = nodeview.preprocessDiagnostic(
      docStart,
      docEnd,
      "Help",
      Severity.Information,
      segments,
    );

    render(result)
      .querySelector<HTMLElement>(".cm-diagnosticSuggestion")!
      .click();

    expect(editorInstance.applyEdit).toHaveBeenCalledTimes(1);
    expect(editorInstance.applyEdit).toHaveBeenCalledWith(edit, {
      requireEditable: true,
    });
  });

  test("shows a suggestion that can't be applied as plain text", () => {
    const editorInstance = makeEditorInstance();
    editorInstance.canApplyEdit.mockReturnValue(false);
    const nodeview = makeSegmentView(editorInstance);

    const result = nodeview.preprocessDiagnostic(
      docStart,
      docEnd,
      "Help",
      Severity.Information,
      segments,
    );

    expect(result.renderMessage).toBeUndefined();
    expect(editorInstance.canApplyEdit).toHaveBeenCalledWith(edit, {
      requireEditable: true,
    });
  });

  test("does not use a custom renderer when no segment is a suggestion", () => {
    const nodeview = makeSegmentView(makeEditorInstance());
    const result = nodeview.preprocessDiagnostic(
      docStart,
      docEnd,
      "Help",
      Severity.Information,
      [{ text: "Help" }],
    );

    expect(result.renderMessage).toBeUndefined();
  });

  test("suggestions are only offered while the diagnostics match the document", () => {
    const editorInstance = {
      ...makeEditorInstance(),
      diagnosticsMatchDocument: true,
      diagnosticsVersion: 1,
      getPartialDiagnosticsInRange: () => [
        {
          start: 1,
          end: 1 + docEnd,
          message: "Help\n  • We apply h\n  done",
          severity: Severity.Information,
          segments,
        },
      ],
    };
    const nodeview = makeSegmentView(editorInstance);
    //@ts-expect-error private; position the code block at the start of the document
    nodeview._getPos = () => 0;
    const lint = () =>
      //@ts-expect-error private
      nodeview.lintingFunction(nodeview._codemirror)[0];

    expect(lint().renderMessage).toBeDefined();

    // The document changed after the diagnostics were computed: their offsets are stale.
    editorInstance.diagnosticsMatchDocument = false;
    expect(lint().renderMessage).toBeUndefined();
    expect(lint().message).toBe("Help\n  • We apply h\n  done");
  });
});

test("Severity to string", () => {
  expect(severityToString(Severity.Error)).toStrictEqual("error");
  expect(severityToString(Severity.Information)).toStrictEqual("info");
  expect(severityToString(Severity.Warning)).toStrictEqual("warning");
  expect(severityToString(Severity.Hint)).toStrictEqual("hint");
});

test("Hint Replace", () => {
  const nodeview = new CodeBlockView(
    node,
    //@ts-expect-error For test setup supply only the minimal needed to get a working CodeBlockView
    { editable: true },
    null,
    () => undefined,
    null,
    [],
    [],
    ThemeStyle.Light,
  );

  const value = "SOME_VALUE_WORTH_REPLACING";
  const diag = {
    start: docStart,
    end: docEnd,
    message: `Hint, replace with: ${value}`,
    severity: Severity.Error,
  };

  const result = nodeview.preprocessDiagnostic(
    diag.start,
    diag.end,
    diag.message,
    diag.severity,
  );

  // console.log(result);
  expect(result.from).toBe(diag.start);
  expect(result.to).toBe(diag.end);
  expect(result.message).toBe(value);
  expect(result.severity).toBe(severityToString(diag.severity));

  expect(result.actions).toBeDefined();
  expect(result.actions?.length).toBe(1);

  expect(result.actions?.at(0)?.name).toBe("Replace ↩️");

  //@ts-expect-error private
  expect(nodeview._codemirror?.state.doc.toString()).toStrictEqual(docText);
  //@ts-expect-error private
  result.actions?.at(0)?.apply(nodeview._codemirror, result.from, result.to);
  //@ts-expect-error private
  expect(nodeview._codemirror?.state.doc.toString()).toStrictEqual(value);
});

test("Hint Insert", () => {
  const nodeview = new CodeBlockView(
    node,
    //@ts-expect-error For test setup supply only the minimal needed to get a working CodeBlockView
    { editable: true },
    null,
    () => undefined,
    null,
    [],
    [],
    ThemeStyle.Light,
  );

  const value = "value-to-insert";
  const diag = {
    start: docStart,
    end: docEnd,
    message: `Hint, insert: ${value}`,
    severity: Severity.Error,
  };

  const result = nodeview.preprocessDiagnostic(
    diag.start,
    diag.end,
    diag.message,
    diag.severity,
  );

  // console.log(result);
  expect(result.from).toBe(diag.start);
  expect(result.to).toBe(diag.end);
  expect(result.message).toBe(value);
  expect(result.severity).toBe(severityToString(diag.severity));

  expect(result.actions).toBeDefined();
  expect(result.actions?.length).toBe(1);

  expect(result.actions?.at(0)?.name).toBe("Insert ⤵️");

  //@ts-expect-error private
  expect(nodeview._codemirror?.state.doc.toString()).toStrictEqual(docText);
  //@ts-expect-error private
  result.actions?.at(0)?.apply(nodeview._codemirror, result.from, result.to);
  //@ts-expect-error private
  expect(nodeview._codemirror?.state.doc.toString()).toStrictEqual(
    `${docText}\n${value}`,
  );
});

test("Hint Delete", () => {
  const nodeview = new CodeBlockView(
    node,
    //@ts-expect-error For test setup supply only the minimal needed to get a working CodeBlockView
    { editable: true },
    null,
    () => undefined,
    null,
    [],
    [],
    ThemeStyle.Light,
  );

  const diag = {
    start: docStart,
    end: docEnd,
    message: `Remove this line lkdj`,
    severity: Severity.Error,
  };

  const result = nodeview.preprocessDiagnostic(
    diag.start,
    diag.end,
    diag.message,
    diag.severity,
  );

  // console.log(result);
  expect(result.from).toBe(diag.start);
  expect(result.to).toBe(diag.end);
  expect(result.message).toBe("Remove this line lkdj");
  expect(result.severity).toBe(severityToString(diag.severity));

  expect(result.actions).toBeDefined();
  expect(result.actions?.length).toBe(1);

  expect(result.actions?.at(0)?.name).toBe("Delete 🗑️");

  //@ts-expect-error private
  expect(nodeview._codemirror?.state.doc.toString()).toStrictEqual(docText);
  //@ts-expect-error private
  result.actions?.at(0)?.apply(nodeview._codemirror, result.from, result.to);
  //@ts-expect-error private
  expect(nodeview._codemirror?.state.doc.toString()).toStrictEqual("");
});

/** Construct a minimal CodeBlockView for testing. */
function makeView() {
  return new CodeBlockView(
    node,
    //@ts-expect-error supply only the minimal needed to get a working CodeBlockView
    { editable: true },
    null,
    () => undefined,
    null,
    [],
    [],
    ThemeStyle.Light,
  );
}

/** This functionality ensures that the selection is displayed (in particular when using the ctrl+. shortcut to select) */
describe("CodeBlockView selectNode / deselectNode", () => {
  test("selectNode adds ProseMirror-selectednode class", () => {
    const nv = makeView();
    expect(nv.dom).toBeInstanceOf(HTMLElement);
    expect(
      (nv.dom as HTMLElement).classList.contains("ProseMirror-selectednode"),
    ).toBe(false);

    nv.selectNode();
    expect(
      (nv.dom as HTMLElement).classList.contains("ProseMirror-selectednode"),
    ).toBe(true);
  });

  test("deselectNode removes ProseMirror-selectednode class", () => {
    const nv = makeView();
    (nv.dom as HTMLElement).classList.add("ProseMirror-selectednode");

    nv.deselectNode();
    expect(
      (nv.dom as HTMLElement).classList.contains("ProseMirror-selectednode"),
    ).toBe(false);
  });

  test("selectNode then deselectNode round-trips correctly", () => {
    const nv = makeView();

    nv.selectNode();
    expect(
      (nv.dom as HTMLElement).classList.contains("ProseMirror-selectednode"),
    ).toBe(true);

    nv.deselectNode();
    expect(
      (nv.dom as HTMLElement).classList.contains("ProseMirror-selectednode"),
    ).toBe(false);
  });
});

describe("CodeBlockView busy indicator", () => {
  test("removeBusyIndicator is a no-op when codemirror is absent", () => {
    const nv = makeView();
    //@ts-expect-error
    nv._codemirror = undefined;
    //@ts-expect-error
    const spy = jest.spyOn(nv.busyIndicator, "clearBusy");

    expect(() => nv.removeBusyIndicator()).not.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });
});
