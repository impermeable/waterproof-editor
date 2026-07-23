/**
 * @jest-environment jsdom
 */

// AI-generated tests

import { Node as PNode } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { WaterproofSchema } from "../src/schema";
import { SWITCHABLE_VIEW_PLUGIN_KEY } from "../src/markup-views";
import { SwitchableView } from "../src/markup-views/switchable-view";
import { EditableView } from "../src/markup-views/switchable-view/EditableView";
import { applyingOuterView } from "./helpers";

/**
 * Creates an EditableView (through SwitchableView.selectNode, as in production)
 * for a document containing a single markdown node with `text`. The outer view
 * applies dispatched transactions, so tests can observe the outer document.
 */
function makeEditableView(text: string) {
  const doc = WaterproofSchema.nodes.doc.create(
    null,
    WaterproofSchema.nodes.markdown.create(null, WaterproofSchema.text(text)),
  );
  const state = EditorState.create({ doc, schema: WaterproofSchema });
  const outerView = applyingOuterView(state);
  const node = state.doc.nodeAt(0) as PNode;
  const sv = new SwitchableView(
    () => 0,
    outerView,
    node.textContent,
    node,
    SWITCHABLE_VIEW_PLUGIN_KEY,
    "markdown",
    (input) => input,
    [],
  );
  // Selecting the node switches to the editable (CodeMirror) view.
  sv.selectNode();
  //@ts-expect-error private property
  const editable = sv.view as EditableView;
  expect(editable).toBeInstanceOf(EditableView);
  return { editable, outerView };
}

describe("EditableView forwardUpdate", () => {
  test("forwards a document change even when the CodeMirror view is unfocused (e.g. rmb -> cut)", () => {
    const { editable, outerView } = makeEditableView("abcdef");
    // In jsdom the CodeMirror view never has focus, matching the rmb -> cut scenario.
    expect(editable.view.hasFocus).toBe(false);

    editable.view.dispatch({ changes: { from: 0, to: 3 } });

    expect(outerView.dispatch).toHaveBeenCalledTimes(1);
    expect(outerView.state.doc.textContent).toBe("def");
  });

  test("does not forward a selection-only update when unfocused", () => {
    const { editable, outerView } = makeEditableView("abcdef");

    editable.view.dispatch({ selection: { anchor: 2 } });

    expect(outerView.dispatch).not.toHaveBeenCalled();
  });

  test("keeps later changes aligned when an earlier insertion shifts them (e.g. toggle comment)", () => {
    const { editable, outerView } = makeEditableView("ab\ncd");

    editable.view.dispatch({
      changes: [
        { from: 0, insert: "# " },
        { from: 3, insert: "# " },
      ],
    });

    expect(editable.view.state.doc.toString()).toBe("# ab\n# cd");
    expect(outerView.state.doc.textContent).toBe("# ab\n# cd");
  });

  test("keeps a deletion aligned after an earlier replacement shrank the document", () => {
    const { editable, outerView } = makeEditableView("abcdef");

    editable.view.dispatch({
      changes: [
        { from: 0, to: 2, insert: "Z" },
        { from: 4, to: 5 },
      ],
    });

    expect(editable.view.state.doc.toString()).toBe("Zcdf");
    expect(outerView.state.doc.textContent).toBe("Zcdf");
  });

  test("keeps later changes aligned after an earlier deletion", () => {
    const { editable, outerView } = makeEditableView("abcdef");

    editable.view.dispatch({
      changes: [
        { from: 0, to: 1 },
        { from: 3, to: 3, insert: "X" },
      ],
    });

    expect(editable.view.state.doc.toString()).toBe("bcXdef");
    expect(outerView.state.doc.textContent).toBe("bcXdef");
  });
});
