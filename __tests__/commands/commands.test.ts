/**
 * @jest-environment jsdom
 */

// Note that these tests are LLM-generated. They might test existing bugs in the code.

import {
  EditorState,
  NodeSelection,
  TextSelection,
  Transaction,
} from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { WaterproofSchema } from "../../src/schema";
import {
  deleteSelection,
  wpLift,
  wrapInHint,
  wrapInInput,
} from "../../src/commands/commands";
import { configuration } from "../../src/markdown-defaults";

const tagConf = configuration("");

// Helper to create an EditorView from a JSON state
function viewFromJSON(json: object): EditorView {
  return new EditorView(null, {
    state: EditorState.fromJSON({ schema: WaterproofSchema }, json),
  });
}

// Helper to set a NodeSelection on the node at `pos`
function setNodeSelection(view: EditorView, pos: number): void {
  const { tr } = view.state;
  view.dispatch(tr.setSelection(NodeSelection.create(view.state.doc, pos)));
}

// ===================== deleteSelection =====================

// doc: code("abc") | newline | code("def")
// Positions: 0[code 1"abc"4]5 6(newline)6 7[code 8"def"11]12
const threeNodeDoc = {
  doc: {
    type: "doc",
    content: [
      { type: "code", content: [{ type: "text", text: "abc" }] },
      { type: "newline" },
      { type: "code", content: [{ type: "text", text: "def" }] },
    ],
  },
  selection: { type: "text", anchor: 2, head: 2 },
};

test("deleteSelection returns false for empty selection", () => {
  const view = viewFromJSON(threeNodeDoc);
  const cmd = deleteSelection(tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(false);
});

test("deleteSelection deletes a TextSelection range", () => {
  const state = EditorState.fromJSON(
    { schema: WaterproofSchema },
    threeNodeDoc,
  );
  // Select "bc" inside the first code cell (positions 2-4)
  const sel = TextSelection.create(state.doc, 2, 4);
  const stateWithSel = state.apply(state.tr.setSelection(sel));

  const cmd = deleteSelection(tagConf);
  // Capture the dispatched transaction without going through the view (avoids scrollIntoView DOM errors)
  let resultState = stateWithSel;
  const dispatch = (tr: Transaction) => {
    resultState = stateWithSel.apply(tr);
  };
  expect(cmd(stateWithSel, dispatch)).toBe(true);

  // First code cell should now contain just "a"
  const expected = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "a" }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "def" }] },
      ],
    },
    selection: { type: "text", anchor: 2, head: 2 },
  };
  expect(resultState.toJSON()).toStrictEqual(expected);
});

test("deleteSelection deletes a node-selected code cell between two newlines", () => {
  // doc: code("abc") | newline | code("del") | newline | code("ghi")
  // With tagConf, code needs newline before and after.
  // When deleting middle code, before=newline and after=newline, befoore=code and afteer=code.
  // code needs newline after (befoore) and newline before (afteer) → keep one newline, delete node + after newline
  const fiveNodeDoc = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "abc" }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "del" }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "ghi" }] },
      ],
    },
    selection: { type: "text", anchor: 2, head: 2 },
  };

  const view = viewFromJSON(fiveNodeDoc);
  // Node-select the middle code cell at pos 6
  setNodeSelection(view, 6);

  const cmd = deleteSelection(tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  // Middle code and one newline removed → code("abc") | newline | code("ghi")
  const resultDoc = view.state.doc.toJSON();
  expect(resultDoc.content.length).toBe(3);
  expect(resultDoc.content[0].type).toBe("code");
  expect(resultDoc.content[0].content[0].text).toBe("abc");
  expect(resultDoc.content[1].type).toBe("newline");
  expect(resultDoc.content[2].type).toBe("code");
  expect(resultDoc.content[2].content[0].text).toBe("ghi");
});

test("deleteSelection deletes a node-selected code cell at end of document", () => {
  // doc: code("abc") | newline | code("def")
  // Deleting last code. before=newline, after=null. befoore=code.
  // code needs newline after (befoore) → keep before newline, delete node + after(=nothing)
  // Actually: beforeIsNewline=true, afterIsNewline=false, befoore=code
  // Hits the branch: beforeIsNewline && befoore !== null && needsNewlineAfter(befoore.type)
  // → delete node and afterSize (0), i.e. just the node
  const view = viewFromJSON(threeNodeDoc);
  // Node-select the last code cell at pos 6
  setNodeSelection(view, 6);

  const cmd = deleteSelection(tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  const resultDoc = view.state.doc.toJSON();
  // code("abc") | newline remain; the last code is deleted
  // Actually: delete from sel.from to sel.to + afterSize(0) → just the code node
  expect(resultDoc.content.length).toBe(2);
  expect(resultDoc.content[0].type).toBe("code");
  expect(resultDoc.content[1].type).toBe("newline");
});

test("deleteSelection deletes a node-selected code cell at start of document", () => {
  // doc: code("abc") | newline | code("def")
  // Deleting first code. before=null, after=newline. afteer=code.
  // beforeIsNewline=false, afterIsNewline=true.
  // Hits the branch: afterIsNewline && afteer !== null && needsNewlineBefore(sel.node.type)
  // code needs newline before → delete before(=nothing) + node: from - 0 to to
  const view = viewFromJSON(threeNodeDoc);
  // Node-select the first code cell at pos 0
  setNodeSelection(view, 0);

  const cmd = deleteSelection(tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  const resultDoc = view.state.doc.toJSON();
  // newline | code("def") remain
  expect(resultDoc.content.length).toBe(2);
  expect(resultDoc.content[0].type).toBe("newline");
  expect(resultDoc.content[1].type).toBe("code");
});

// ===================== wpLift =====================

test("wpLift returns false for TextSelection", () => {
  const view = viewFromJSON(threeNodeDoc);
  const cmd = wpLift(tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(false);
});

test("wpLift returns false when selecting a non-hint/input node", () => {
  const view = viewFromJSON(threeNodeDoc);
  setNodeSelection(view, 0); // select the code node
  const cmd = wpLift(tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(false);
});

test("wpLift lifts an input area node", () => {
  // doc: code("abc") | newline | input(newline | code("def") | newline) | newline | code("ghi")
  // Positions:
  // 0[code 1"abc"4]5  5(newline)  6[input 7(newline) 8[code 9"def"12]13 13(newline) 14]15  15(newline)  16[code 17"ghi"20]21
  const docWithInput = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "abc" }] },
        { type: "newline" },
        {
          type: "input",
          content: [
            { type: "newline" },
            { type: "code", content: [{ type: "text", text: "def" }] },
            { type: "newline" },
          ],
        },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "ghi" }] },
      ],
    },
    selection: { type: "text", anchor: 2, head: 2 },
  };

  const view = viewFromJSON(docWithInput);
  // Node-select the input area node at pos 6
  setNodeSelection(view, 6);

  const cmd = wpLift(tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  // After lifting: the input wrapper is removed, its children are promoted.
  // Both input's first and last children are newlines, and
  // before input is newline and after input is newline → both duplicate newlines removed.
  // Result: code("abc") | newline | code("def") | newline | code("ghi")
  const resultDoc = view.state.doc.toJSON();
  expect(resultDoc.content.length).toBe(5);
  expect(resultDoc.content[0].type).toBe("code");
  expect(resultDoc.content[1].type).toBe("newline");
  expect(resultDoc.content[2].type).toBe("code");
  expect(resultDoc.content[2].content[0].text).toBe("def");
  expect(resultDoc.content[3].type).toBe("newline");
  expect(resultDoc.content[4].type).toBe("code");
});

test("wpLift without dispatch returns true (dry-run)", () => {
  const docWithInput = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "abc" }] },
        { type: "newline" },
        {
          type: "input",
          content: [
            { type: "newline" },
            { type: "code", content: [{ type: "text", text: "def" }] },
            { type: "newline" },
          ],
        },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "ghi" }] },
      ],
    },
    selection: { type: "text", anchor: 2, head: 2 },
  };

  const view = viewFromJSON(docWithInput);
  setNodeSelection(view, 6);

  const cmd = wpLift(tagConf);
  // Call without dispatch to test the "can we do this?" dry-run path
  expect(cmd(view.state, undefined, view)).toBe(true);
});

// ===================== wrapInInput =====================

test("wrapInInput wraps a code node in an input area", () => {
  // doc: code("abc") | newline | code("def") | newline | code("ghi")
  // Selecting the middle code node at pos 6.
  // code needs newline before and after (in tagConf). before=newline, after=newline → consume both.
  const fiveNodeDoc = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "abc" }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "def" }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "ghi" }] },
      ],
    },
    selection: { type: "text", anchor: 2, head: 2 },
  };

  const view = viewFromJSON(fiveNodeDoc);
  setNodeSelection(view, 6);

  const cmd = wrapInInput(tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  const resultDoc = view.state.doc.toJSON();
  // The wrapping should consume surrounding newlines and wrap them inside the input.
  // Result should have: code("abc") | newline | input(newline | code("def") | newline) | newline | code("ghi")
  expect(resultDoc.content.length).toBe(5);
  expect(resultDoc.content[0].type).toBe("code");
  expect(resultDoc.content[1].type).toBe("newline");
  expect(resultDoc.content[2].type).toBe("input");
  expect(resultDoc.content[3].type).toBe("newline");
  expect(resultDoc.content[4].type).toBe("code");

  // The input should contain: newline | code("def") | newline
  const inputContent = resultDoc.content[2].content;
  expect(inputContent.length).toBe(3);
  expect(inputContent[0].type).toBe("newline");
  expect(inputContent[1].type).toBe("code");
  expect(inputContent[1].content[0].text).toBe("def");
  expect(inputContent[2].type).toBe("newline");
});

test("wrapInInput returns false for TextSelection", () => {
  const view = viewFromJSON(threeNodeDoc);
  const cmd = wrapInInput(tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(false);
});

// ===================== wrapInHint =====================

test("wrapInHint wraps a code node in a hint", () => {
  const fiveNodeDoc = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "abc" }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "def" }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "ghi" }] },
      ],
    },
    selection: { type: "text", anchor: 2, head: 2 },
  };

  const view = viewFromJSON(fiveNodeDoc);
  setNodeSelection(view, 6);

  const cmd = wrapInHint(tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  const resultDoc = view.state.doc.toJSON();
  // hint doesn't require newlines in tagConf, so only the code node is wrapped.
  // Result: code("abc") | newline | hint(code("def")) | newline | code("ghi")
  expect(resultDoc.content.length).toBe(5);
  expect(resultDoc.content[2].type).toBe("hint");
});

// AI generated regression test
// Bug: branch 2 used `sel.from - beforeSize` without checking whether `before` is actually a
// newline.  When the node directly before the selection is a non-newline block (e.g. a markdown
// cell), `beforeSize` is its full nodeSize and the deletion range wrongly ate that node.
test("deleteSelection branch2 regression: non-newline before-node is not deleted", () => {
  // Doc: markdown("X") | markdown("Y") | newline | code("C")
  //   NodeSelect markdown("Y") (offset 3).
  //   before  = markdown("X")  → beforeIsNewline = false,  beforeSize = 3
  //   after   = newline        → afterIsNewline  = true
  //   afteer  = code("C")      → needsNewlineBefore = true
  //   → branch 2 fires
  //
  // Bug: delete [3 − 3, 6] removes markdown("X") too → 2 nodes left.
  // Fix: delete [3 − 0, 6] removes only markdown("Y") → 3 nodes left.
  const docJSON = {
    doc: {
      type: "doc",
      content: [
        { type: "markdown", content: [{ type: "text", text: "X" }] },
        { type: "markdown", content: [{ type: "text", text: "Y" }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "C" }] },
      ],
    },
    selection: { type: "text", anchor: 1, head: 1 },
  };

  const view = viewFromJSON(docJSON);
  setNodeSelection(view, 3); // markdown("Y") is at offset 3

  const cmd = deleteSelection(tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  const result = view.state.doc.toJSON();
  // markdown("X") must survive; only markdown("Y") is deleted.
  expect(result.content.length).toBe(3);
  expect(result.content[0].type).toBe("markdown");
  expect(result.content[0].content[0].text).toBe("X");
  expect(result.content[1].type).toBe("newline");
  expect(result.content[2].type).toBe("code");
});

// AI generated regression test
// Bug: branch 3 used `sel.to + afterSize` without checking whether `after` is actually a
// newline.  When the node directly after the selection is a non-newline block, the deletion
// range wrongly extended forward to swallow it.
test("deleteSelection branch3 regression: non-newline after-node is not deleted", () => {
  // Doc: code("A") | newline | markdown("M") | markdown("Z")
  //   NodeSelect markdown("M") (offset 4).
  //   before  = newline        → beforeIsNewline = true
  //   befoore = code("A")      → needsNewlineAfter = true
  //   after   = markdown("Z")  → afterIsNewline  = false,  afterSize = 3
  //   afteer  = null
  //   → branch 3 fires
  //
  // Bug: delete [4, 7 + 3] removes markdown("Z") too → 2 nodes left.
  // Fix: delete [4, 7 + 0] removes only markdown("M") → 3 nodes left.
  const docJSON = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "A" }] },
        { type: "newline" },
        { type: "markdown", content: [{ type: "text", text: "M" }] },
        { type: "markdown", content: [{ type: "text", text: "Z" }] },
      ],
    },
    selection: { type: "text", anchor: 1, head: 1 },
  };

  const view = viewFromJSON(docJSON);
  setNodeSelection(view, 4); // markdown("M") is at offset 4

  const cmd = deleteSelection(tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  const result = view.state.doc.toJSON();
  // markdown("Z") must survive; only markdown("M") is deleted.
  expect(result.content.length).toBe(3);
  expect(result.content[0].type).toBe("code");
  expect(result.content[1].type).toBe("newline");
  expect(result.content[2].type).toBe("markdown");
  expect(result.content[2].content[0].text).toBe("Z");
});

test("deleteSelection: deleting markdown between newlines removes the before-newline when afteer=code needs one", () => {
  // AI generated regression test
  // Doc: markdown("A") | newline | markdown("B") | newline | code("C")
  //
  // NodeSelection is on markdown("B"). Neighbours:
  //   before  = newline,      befoore = markdown("A")  (needsNewlineAfter = false)
  //   after   = newline,      afteer  = code("C")      (needsNewlineBefore = true)
  //
  // Correct branch (condition 2 with the fix): afterIsNewline && afteer !== null &&
  //   needsNewlineBefore(afteer.type=code) = true
  //   → delete from sel.from−beforeSize to sel.to (removes the before-newline + selected markdown)
  //   → result: markdown("A") | newline | code("C")   (3 nodes)
  //
  // With the bug the condition checks needsNewlineBefore(sel.node.type=markdown) = false,
  // so no branch fires and only markdown("B") is deleted:
  //   → result: markdown("A") | newline | newline | code("C")  (4 nodes, double newline)
  const docJSON = {
    doc: {
      type: "doc",
      content: [
        { type: "markdown", content: [{ type: "text", text: "A" }] },
        { type: "newline" },
        { type: "markdown", content: [{ type: "text", text: "B" }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "C" }] },
      ],
    },
    selection: { type: "text", anchor: 2, head: 2 },
  };

  const view = viewFromJSON(docJSON);
  // markdown("A") has nodeSize 3 (pmRange {0,3}), newline has nodeSize 1 (pmRange {3,4}).
  // markdown("B") starts at pmRange.from = 4.
  setNodeSelection(view, 4);

  const cmd = deleteSelection(tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  const resultDoc = view.state.doc.toJSON();
  // With the fix: before-newline and markdown("B") are deleted; after-newline is kept for code("C").
  expect(resultDoc.content.length).toBe(3);
  expect(resultDoc.content[0].type).toBe("markdown");
  expect(resultDoc.content[0].content[0].text).toBe("A");
  expect(resultDoc.content[1].type).toBe("newline");
  expect(resultDoc.content[2].type).toBe("code");
  expect(resultDoc.content[2].content[0].text).toBe("C");
});
