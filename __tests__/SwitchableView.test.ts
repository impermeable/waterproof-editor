/**
 * @jest-environment jsdom
 */

// AI-generated tests

import { Node as PNode } from "prosemirror-model";
import { INPUT_AREA_PLUGIN_KEY, inputAreaPlugin } from "../src/inputArea";
import { WaterproofSchema } from "../src/schema";
import { SWITCHABLE_VIEW_PLUGIN_KEY } from "../src/markup-views";
import { SwitchableView } from "../src/markup-views/switchable-view";
import { EditorView } from "prosemirror-view";
import { EditorState, Plugin } from "prosemirror-state";

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

function makeState(teacher: boolean, plugins: Plugin[] = [inputAreaPlugin]) {
  let state = EditorState.create({
    doc: buildDoc(),
    schema: WaterproofSchema,
    plugins,
  });
  state = state.apply(state.tr.setMeta(INPUT_AREA_PLUGIN_KEY, { teacher }));
  return state;
}

/** Position immediately before the first node matching `predicate` (the NodeView getPos contract). */
function findNodePos(doc: PNode, predicate: (n: PNode) => boolean): number {
  let result = -1;
  doc.descendants((node, pos) => {
    if (result !== -1) return false;
    if (predicate(node)) {
      result = pos;
      return false;
    }
    return true;
  });
  if (result === -1) throw new Error("node not found");
  return result;
}

/** Minimal fake outer view: SwitchableView only reads `.state` and calls `.dispatch`. */
function fakeOuterView(state: EditorState) {
  return {
    state,
    dispatch: jest.fn(),
    editable: true,
  } as unknown as EditorView;
}

function makeSwitchableView(state: EditorState, pos: number) {
  const node = state.doc.nodeAt(pos)!;
  const outerView = fakeOuterView(state);
  const sv = new SwitchableView(
    () => pos,
    outerView,
    node.textContent,
    node,
    SWITCHABLE_VIEW_PLUGIN_KEY,
    "markdown",
    (input) => input,
    [],
  );
  return { sv, outerView };
}

describe("SwitchableView click-to-edit locking", () => {
  test("student mode: clicking a cell outside the input area is a no-op", () => {
    const state = makeState(false);
    const pos = findNodePos(
      state.doc,
      (n) =>
        n.type === WaterproofSchema.nodes.markdown &&
        n.textContent === "outside",
    );
    const { sv, outerView } = makeSwitchableView(state, pos);

    sv.dom.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(outerView.dispatch).not.toHaveBeenCalled();
  });

  test("student mode: clicking a cell inside the input area selects it", () => {
    const state = makeState(false);
    const pos = findNodePos(
      state.doc,
      (n) =>
        n.type === WaterproofSchema.nodes.markdown &&
        n.textContent === "inside",
    );
    const { sv, outerView } = makeSwitchableView(state, pos);

    sv.dom.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(outerView.dispatch).toHaveBeenCalledTimes(1);
  });

  test("teacher mode: clicking a cell outside the input area still selects it", () => {
    const state = makeState(true);
    const pos = findNodePos(
      state.doc,
      (n) =>
        n.type === WaterproofSchema.nodes.markdown &&
        n.textContent === "outside",
    );
    const { sv, outerView } = makeSwitchableView(state, pos);

    sv.dom.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(outerView.dispatch).toHaveBeenCalledTimes(1);
  });
});
