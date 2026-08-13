/**
 * @jest-environment jsdom
 */

// AI-generated tests

import { EditorState, Plugin, TextSelection } from "prosemirror-state";
import { Node as PNode } from "prosemirror-model";
import {
  INPUT_AREA_PLUGIN_KEY,
  inputAreaPlugin,
  isPositionEditable,
} from "../src/inputArea";
import { WaterproofSchema } from "../src/schema";

/**
 * doc
 *  └─ markdown("outside")            -- sibling of `input`, never editable in student mode
 *  └─ input
 *      └─ markdown("inside")         -- inside `input`, editable in student mode
 */
function buildDoc(): PNode {
  const outsideMarkdown = WaterproofSchema.nodes.markdown.create(
    null,
    WaterproofSchema.text("outside"),
  );
  const insideMarkdown = WaterproofSchema.nodes.markdown.create(
    null,
    WaterproofSchema.text("inside"),
  );
  const inputNode = WaterproofSchema.nodes.input.create(null, insideMarkdown);
  return WaterproofSchema.nodes.doc.create(null, [outsideMarkdown, inputNode]);
}

/** Position of the first character of the text matching `text`, wherever it is in the doc. */
function textPos(doc: PNode, text: string): number {
  let found = -1;
  doc.descendants((node, pos) => {
    if (found !== -1) return false;
    if (node.isText && node.text === text) {
      found = pos;
      return false;
    }
    return true;
  });
  if (found === -1) throw new Error(`text not found: ${text}`);
  return found;
}

function makeState(teacher: boolean, plugins: Plugin[] = [inputAreaPlugin]) {
  let state = EditorState.create({
    doc: buildDoc(),
    schema: WaterproofSchema,
    plugins,
  });
  state = state.apply(state.tr.setMeta(INPUT_AREA_PLUGIN_KEY, { teacher }));
  return state;
}

describe("isPositionEditable", () => {
  test("teacher mode is editable everywhere, regardless of position", () => {
    const state = makeState(true);
    expect(isPositionEditable(state, textPos(state.doc, "outside"))).toBe(true);
    expect(isPositionEditable(state, textPos(state.doc, "inside"))).toBe(true);
  });

  test("student mode: editable inside an input node", () => {
    const state = makeState(false);
    expect(isPositionEditable(state, textPos(state.doc, "inside"))).toBe(true);
  });

  test("student mode: not editable outside an input node", () => {
    const state = makeState(false);
    expect(isPositionEditable(state, textPos(state.doc, "outside"))).toBe(
      false,
    );
  });

  test("falls back to student-mode rules when the plugin isn't registered", () => {
    const state = EditorState.create({
      doc: buildDoc(),
      schema: WaterproofSchema,
      plugins: [],
    });
    expect(isPositionEditable(state, textPos(state.doc, "inside"))).toBe(true);
    expect(isPositionEditable(state, textPos(state.doc, "outside"))).toBe(
      false,
    );
  });
});

describe("inputAreaPlugin editable prop", () => {
  test("tracks isPositionEditable at the current selection", () => {
    let state = makeState(false);
    const editableProp = inputAreaPlugin.props.editable as (
      s: EditorState,
    ) => boolean;

    state = state.apply(
      state.tr.setSelection(
        TextSelection.create(state.doc, textPos(state.doc, "outside")),
      ),
    );
    expect(editableProp(state)).toBe(false);

    state = state.apply(
      state.tr.setSelection(
        TextSelection.create(state.doc, textPos(state.doc, "inside")),
      ),
    );
    expect(editableProp(state)).toBe(true);
  });
});
