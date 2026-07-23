/**
 * @jest-environment jsdom
 */

// AI-generated tests

import { Node as PNode } from "prosemirror-model";
import { INPUT_AREA_PLUGIN_KEY, inputAreaPlugin } from "../src/inputArea";
import { WaterproofSchema } from "../src/schema";
import { SWITCHABLE_VIEW_PLUGIN_KEY } from "../src/markup-views";
import { SwitchableView } from "../src/markup-views/switchable-view";
import { RenderedView } from "../src/markup-views/switchable-view/RenderedView";
import { EditableView } from "../src/markup-views/switchable-view/EditableView";
import { EditorState, Plugin } from "prosemirror-state";
import { fakeOuterView, findNodePos } from "./helpers";

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

describe("SwitchableView update", () => {
  function markdownNode(text: string): PNode {
    return WaterproofSchema.nodes.markdown.create(
      null,
      WaterproofSchema.text(text),
    );
  }

  /** A SwitchableView for the "outside" markdown cell, starting in rendered mode. */
  function makeRenderedSwitchableView() {
    const state = makeState(true);
    const pos = findNodePos(
      state.doc,
      (n) =>
        n.type === WaterproofSchema.nodes.markdown &&
        n.textContent === "outside",
    );
    return makeSwitchableView(state, pos);
  }

  test("returns false when the node markup differs", () => {
    const { sv } = makeRenderedSwitchableView();
    const codeNode = WaterproofSchema.nodes.code.create(
      null,
      WaterproofSchema.text("Qed."),
    );

    expect(sv.update(codeNode, [])).toBe(false);
  });

  test("rendered mode: keeps the existing rendered view when the content is unchanged", () => {
    const { sv } = makeRenderedSwitchableView();
    //@ts-expect-error private property
    const viewBefore = sv.view;
    expect(viewBefore).toBeInstanceOf(RenderedView);

    expect(sv.update(markdownNode("outside"), [])).toBe(true);

    //@ts-expect-error private property
    expect(sv.view).toBe(viewBefore);
  });

  test("rendered mode: re-renders when the content changed", () => {
    const { sv } = makeRenderedSwitchableView();
    //@ts-expect-error private property
    const viewBefore = sv.view;

    expect(sv.update(markdownNode("updated content"), [])).toBe(true);

    //@ts-expect-error private property
    expect(sv.view).toBeInstanceOf(RenderedView);
    //@ts-expect-error private property
    expect(sv.view).not.toBe(viewBefore);
    expect(sv.dom.textContent).toContain("updated content");
    expect(sv.dom.textContent).not.toContain("outside");
  });

  test("editable mode: delegates the update to the editable view", () => {
    const { sv } = makeRenderedSwitchableView();
    // Selecting the node switches to the editable (CodeMirror) view.
    sv.selectNode();
    //@ts-expect-error private property
    const editable = sv.view as EditableView;
    expect(editable).toBeInstanceOf(EditableView);
    expect(editable.view.state.doc.toString()).toBe("outside");

    expect(sv.update(markdownNode("changed"), [])).toBe(true);

    expect(editable.view.state.doc.toString()).toBe("changed");
  });
});
