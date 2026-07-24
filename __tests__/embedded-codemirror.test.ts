/**
 * @jest-environment jsdom
 */

// AI-generated tests

import { ViewUpdate } from "@codemirror/view";
import { EmbeddedCodeMirrorEditor } from "../src/embedded-codemirror";
import { WaterproofSchema } from "../src/schema";

/** Subclass exposing the protected `shouldForwardUpdate` decision method. */
class TestEditor extends EmbeddedCodeMirrorEditor {
  public decide(
    update: ViewUpdate,
    hasFocus: boolean,
    isUpdating: boolean,
  ): boolean {
    return this.shouldForwardUpdate(update, hasFocus, isUpdating);
  }
}

function makeEditor(): TestEditor {
  const node = WaterproofSchema.nodes.markdown.create(
    null,
    WaterproofSchema.text("content"),
  );
  //@ts-expect-error supply only the minimal needed for the decision logic
  return new TestEditor(node, null, () => undefined, WaterproofSchema);
}

/** Only `docChanged` is inspected by `shouldForwardUpdate`. */
function update(docChanged: boolean): ViewUpdate {
  return { docChanged } as ViewUpdate;
}

describe("EmbeddedCodeMirrorEditor shouldForwardUpdate", () => {
  test.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])(
    "suppresses updates while programmatically syncing (docChanged=%s, hasFocus=%s)",
    (docChanged, hasFocus) => {
      const editor = makeEditor();
      expect(editor.decide(update(docChanged), hasFocus, true)).toBe(false);
    },
  );

  test("suppresses selection-only updates when the editor is unfocused", () => {
    const editor = makeEditor();
    expect(editor.decide(update(false), false, false)).toBe(false);
  });

  test("forwards document changes even when the editor is unfocused (e.g. rmb -> cut)", () => {
    const editor = makeEditor();
    expect(editor.decide(update(true), false, false)).toBe(true);
  });

  test("forwards updates when the editor has focus", () => {
    const editor = makeEditor();
    expect(editor.decide(update(true), true, false)).toBe(true);
    expect(editor.decide(update(false), true, false)).toBe(true);
  });
});
