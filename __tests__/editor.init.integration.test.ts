/**
 * @jest-environment jsdom
 */

// Tests for rebuilding the editor with `init`, with the real Mapping.

jest.mock("prosemirror-dev-tools", () => ({ applyDevTools: () => {} }));
jest.spyOn(global.console, "log").mockImplementation();

import { TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { WaterproofEditor } from "../src/editor";
import { ThemeStyle, WaterproofEditorConfig } from "../src/api";
import { configuration, parse } from "../src/markdown-defaults";

const source = ["```coq", "Hello ", "```", "```coq", "world.", "```", ""].join(
  "\n",
);

function makeEditor(documentChange = jest.fn()) {
  const cfg: WaterproofEditorConfig = {
    api: {
      applyStepError: () => {},
      cursorChange: () => {},
      documentChange,
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
  const el = document.createElement("div");
  jest.spyOn(WaterproofEditor.prototype, "handleScroll").mockImplementation();
  jest
    //@ts-expect-error private method
    .spyOn(WaterproofEditor.prototype, "informCodemirrorViews")
    .mockImplementation();
  const editor = new WaterproofEditor(el, cfg, ThemeStyle.Light);
  editor.init(source, 1);
  return editor;
}

function viewOf(editor: WaterproofEditor): EditorView {
  //@ts-expect-error private field
  return editor._view;
}

describe("init", () => {
  test("replaces the content, also for the same version", () => {
    const editor = makeEditor();
    const other = source.replace("world.", "there.");

    editor.init(other, 1);

    expect(editor.serializeDocument()).toBe(other);
  });

  test("keeps the progress bar", () => {
    const editor = makeEditor();
    const parent = viewOf(editor).dom.parentElement!;
    document.body.appendChild(parent);
    expect(parent.querySelectorAll(".progress-bar").length).toBe(1);

    editor.init(source, 2);

    expect(parent.querySelectorAll(".progress-bar").length).toBe(1);
    parent.remove();
  });

  test("keeps the cursor at the same text offset when rebuilding", () => {
    const editor = makeEditor();
    const view = viewOf(editor);
    // Put the cursor in the second code block, after "wor".
    const offset = source.indexOf("world.") + 3;
    //@ts-expect-error private field
    const pos = editor._mapping.textOffsetToPmIndex(offset);
    view.dispatch(
      view.state.tr.setSelection(TextSelection.create(view.state.doc, pos)),
    );

    // Rebuild the view; the cursor stays at the same text offset.
    editor.init(source, 2);

    const newView = viewOf(editor);
    expect(newView).not.toBe(view);
    //@ts-expect-error private field
    const newOffset = editor._mapping.pmIndexToTextOffset(
      newView.state.selection.head,
    );
    expect(newOffset).toBe(offset);
  });

  test("removes the old view from the page", () => {
    const editor = makeEditor();
    const oldDom = viewOf(editor).dom;
    const parent = oldDom.parentElement!;
    editor.init(source, 2);
    expect(parent.contains(oldDom)).toBe(false);
    expect(parent.contains(viewOf(editor).dom)).toBe(true);
  });
});
