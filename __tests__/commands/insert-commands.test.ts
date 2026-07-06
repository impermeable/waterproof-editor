/**
 * @jest-environment jsdom
 */

import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { WaterproofSchema } from "../../src/schema";
import {
  getCmdInsertCode,
  getCmdInsertMarkdown,
  getCmdInsertLatex, 
  getCmdInsertCodeHint, 
  getCmdInsertTextHint, 
  getCmdInsertExample
} from "../../src/commands/insert-command";
import { InsertionPlace } from "../../src/commands";
import { configuration } from "../../src/markdown-defaults";
import { TagConfiguration } from "../../src/api";

const state = {
  doc: {
    type: "doc",
    content: [
      { type: "code", content: [{ type: "text", text: "Goal True." }] },
      { type: "newline" },
      { type: "code", content: [{ type: "text", text: "Goal False." }] },
    ],
  },
  selection: { type: "text", anchor: 25, head: 25 },
};
const tagConf = configuration("");

// Mock the plugin key to always return state teacher=true
jest.mock("../../src/inputArea.ts", () => ({
  INPUT_AREA_PLUGIN_KEY: {
    getState: jest.fn(() => ({ teacher: true })),
  },
}));

// A doc with a single code cell; selection inside the code content (position 11 = after 9 chars).
const stateOneCode = {
  doc: {
    type: "doc",
    content: [
      { type: "code", content: [{ type: "text", text: "Goal True." }] },
    ],
  },
  selection: { type: "text", anchor: 11, head: 11 },
};

test("Insert markdown below code cell adds a newline separator", () => {
  const view = new EditorView(null, {
    state: EditorState.fromJSON({ schema: WaterproofSchema }, stateOneCode),
  });

  const cmd = getCmdInsertMarkdown(InsertionPlace.Below, tagConf);
  const res = cmd(view.state, view.dispatch, view);

  expect(res).toBe(true);

  // The newline node between code and markdown is required so that the serializer
  // does not place markdown text on the same line as the closing code fence ("\n```").
  const expected = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "Goal True." }] },
        { type: "newline" },
        { type: "markdown" },
      ],
    },
    selection: { type: "text", anchor: 11, head: 11 },
  };
  expect(view.state.toJSON()).toStrictEqual(expected);
});

// A doc with a single code cell; selection inside the code content.
const stateOneCodeForAbove = {
  doc: {
    type: "doc",
    content: [
      { type: "code", content: [{ type: "text", text: "Goal True." }] },
    ],
  },
  selection: { type: "text", anchor: 11, head: 11 },
};

test("Insert markdown above code cell adds a newline separator", () => {
  const view = new EditorView(null, {
    state: EditorState.fromJSON(
      { schema: WaterproofSchema },
      stateOneCodeForAbove,
    ),
  });

  const cmd = getCmdInsertMarkdown(InsertionPlace.Above, tagConf);
  const res = cmd(view.state, view.dispatch, view);

  expect(res).toBe(true);

  // The newline node between markdown and code is required so that the serializer
  // does not place markdown text on the same line as the opening code fence ("```lean\n").
  const expected = {
    doc: {
      type: "doc",
      content: [
        { type: "markdown" },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "Goal True." }] },
      ],
    },
    selection: { type: "text", anchor: 14, head: 14 },
  };
  expect(view.state.toJSON()).toStrictEqual(expected);
});

test("Insert code below twice (selection static)", () => {
  const view = new EditorView(null, {
    state: EditorState.fromJSON({ schema: WaterproofSchema }, state),
  });

  const cmd = getCmdInsertCode(InsertionPlace.Below, tagConf);
  const res = cmd(view.state, view.dispatch, view);

  // We expect this to be true. Could be false in the case we are not in teacher-mode and hence not allowed to insert or when
  // something goes wrong with creating the editor.
  expect(res).toBe(true);

  const newState = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "Goal True." }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "Goal False." }] },
        { type: "newline" },
        { type: "code" }, // Should have added a newline node and a code node
      ],
    },
    selection: { type: "text", anchor: 25, head: 25 },
  };
  expect(view.state.toJSON()).toStrictEqual(newState);

  const res2 = cmd(view.state, view.dispatch, view);
  expect(res2).toBe(true);
  const newState2 = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "Goal True." }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "Goal False." }] },
        { type: "newline" },
        { type: "code" }, // Should have added a newline node and a code node
        { type: "newline" },
        { type: "code" },
      ],
    },
    selection: { type: "text", anchor: 25, head: 25 },
  };
  expect(view.state.toJSON()).toStrictEqual(newState2);
});

// States for testing insertion adjacent to code blocks using the real configuration
// (code has openRequiresNewline: true, closeRequiresNewline: true)
//
// doc: [code("Content.")][newline][math_display("Content.")]
// Positions: code size=10 (pos 0-10), newline size=1 (pos 10), math_display starts at pos 11
const stateCodeNewlineMath_mathSelected = {
  doc: {
    type: "doc",
    content: [
      { type: "code", content: [{ type: "text", text: "Content." }] },
      { type: "newline" },
      { type: "math_display", content: [{ type: "text", text: "Content." }] },
    ],
  },
  selection: { type: "node", anchor: 11 },
};

// doc: [math_display("Content.")][newline][code("Content.")]
// math_display size=10 (pos 0-10), newline size=1 (pos 10), code starts at pos 11
const stateMathNewlineCode_mathSelected = {
  doc: {
    type: "doc",
    content: [
      { type: "math_display", content: [{ type: "text", text: "Content." }] },
      { type: "newline" },
      { type: "code", content: [{ type: "text", text: "Content." }] },
    ],
  },
  selection: { type: "node", anchor: 0 },
};

test("Insert markdown above math_display when code is before the newline adds extra newline", () => {
  const view = new EditorView(null, {
    state: EditorState.fromJSON(
      { schema: WaterproofSchema },
      stateCodeNewlineMath_mathSelected,
    ),
  });
  const cmd = getCmdInsertMarkdown(InsertionPlace.Above, tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  const content = view.state.toJSON().doc.content;
  expect(content).toStrictEqual([
    { type: "code", content: [{ type: "text", text: "Content." }] },
    { type: "newline" },
    { type: "markdown" },
    { type: "newline" },
    { type: "math_display", content: [{ type: "text", text: "Content." }] },
  ]);
});

test("Insert math above math_display when code is before the newline adds extra newline", () => {
  const view = new EditorView(null, {
    state: EditorState.fromJSON(
      { schema: WaterproofSchema },
      stateCodeNewlineMath_mathSelected,
    ),
  });
  const cmd = getCmdInsertLatex(InsertionPlace.Above, tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  const content = view.state.toJSON().doc.content;
  expect(content).toStrictEqual([
    { type: "code", content: [{ type: "text", text: "Content." }] },
    { type: "newline" },
    { type: "math_display" },
    { type: "newline" },
    { type: "math_display", content: [{ type: "text", text: "Content." }] },
  ]);
});

test("Insert markdown below math_display when code is after the newline adds extra newline", () => {
  const view = new EditorView(null, {
    state: EditorState.fromJSON(
      { schema: WaterproofSchema },
      stateMathNewlineCode_mathSelected,
    ),
  });
  const cmd = getCmdInsertMarkdown(InsertionPlace.Below, tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  const content = view.state.toJSON().doc.content;
  expect(content).toStrictEqual([
    { type: "math_display", content: [{ type: "text", text: "Content." }] },
    { type: "newline" },
    { type: "markdown" },
    { type: "newline" },
    { type: "code", content: [{ type: "text", text: "Content." }] },
  ]);
});

test("Insert math below math_display when code is after the newline adds extra newline", () => {
  const view = new EditorView(null, {
    state: EditorState.fromJSON(
      { schema: WaterproofSchema },
      stateMathNewlineCode_mathSelected,
    ),
  });
  const cmd = getCmdInsertLatex(InsertionPlace.Below, tagConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  const content = view.state.toJSON().doc.content;
  expect(content).toStrictEqual([
    { type: "math_display", content: [{ type: "text", text: "Content." }] },
    { type: "newline" },
    { type: "math_display" },
    { type: "newline" },
    { type: "code", content: [{ type: "text", text: "Content." }] },
  ]);
});
test("Insert code below twice (selection moves down)", () => {
  const view = new EditorView(null, {
    state: EditorState.fromJSON({ schema: WaterproofSchema }, state),
  });

  const cmd = getCmdInsertCode(InsertionPlace.Below, tagConf);
  const res = cmd(view.state, view.dispatch, view);

  // We expect this to be true. Could be false in the case we are not in teacher-mode and hence not allowed to insert or when
  // something goes wrong with creating the editor.
  expect(res).toBe(true);

  const newState = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "Goal True." }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "Goal False." }] },
        { type: "newline" },
        { type: "code" }, // Should have added a newline node and a code node
      ],
    },
    selection: { type: "text", anchor: 25, head: 25 },
  };
  expect(view.state.toJSON()).toStrictEqual(newState);

  const { tr, doc } = view.state;
  const $from = doc.resolve(28);
  view.dispatch(tr.setSelection(new TextSelection($from)));

  const stateAfterSelUpdate = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "Goal True." }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "Goal False." }] },
        { type: "newline" },
        { type: "code" },
      ],
    },
    selection: { type: "text", anchor: 28, head: 28 },
  }; // Selection moved into the new code node

  expect(view.state.toJSON()).toStrictEqual(stateAfterSelUpdate);

  const res2 = cmd(view.state, view.dispatch, view);
  expect(res2).toBe(true);
  const newState2 = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "Goal True." }] },
        { type: "newline" },
        { type: "code", content: [{ type: "text", text: "Goal False." }] },
        { type: "newline" },
        { type: "code" }, // Cursor was here
        { type: "newline" },
        { type: "code" }, // Should have added a newline node and a code node
      ],
    },
    selection: { type: "text", anchor: 28, head: 28 },
  };
  expect(view.state.toJSON()).toStrictEqual(newState2);
});

test("insertBelow with a non-cursor TextSelection computes pos from sel.from, not sel.to (new bug #3)", () => {
  // code("Goal True.") — nodeSize = 12.  Select positions 2–5 (3 chars, "oal").
  // sel.from=2, sel.to=5, sel.$from.parentOffset = 2−1 = 1.
  //
  // Fix:   pos = sel.from + (nodeSize − parentOffset) − 1 = 2 + 11 − 1 = 12  (valid)
  // Bug:   pos = sel.to  + (nodeSize − parentOffset) − 1 = 5 + 11 − 1 = 15  (past end of doc)
  //
  // With the bug, tr.insert(15, …) throws a RangeError because doc.content.size = 12.
  const stateJSON = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "Goal True." }] },
      ],
    },
    // Non-cursor selection: anchor=2, head=5 selects "oal"
    selection: { type: "text", anchor: 2, head: 5 },
  };

  const view = new EditorView(null, {
    state: EditorState.fromJSON({ schema: WaterproofSchema }, stateJSON),
  });
  const cmd = getCmdInsertCode(InsertionPlace.Below, tagConf);

  // Must not throw (with the bug it would throw a RangeError)
  let result: boolean = false;
  expect(() => {
    result = cmd(view.state, view.dispatch, view);
  }).not.toThrow();
  expect(result).toBe(true);

  // The new code node must appear after the existing code block, not in the middle of it.
  const resultDoc = view.state.doc.toJSON();
  expect(resultDoc.content.length).toBe(3); // code | newline | code
  expect(resultDoc.content[0].type).toBe("code");
  expect(resultDoc.content[1].type).toBe("newline");
  expect(resultDoc.content[2].type).toBe("code");
});

// State: input area containing a single empty markdown node.
// Positions: input opens at 0, markdown opens at 1, cursor at 2 (inside markdown), markdown closes at 2, input closes at 3.
const stateInputWithMarkdown = {
  doc: {
    type: "doc",
    content: [{ type: "input", content: [{ type: "markdown" }] }],
  },
  selection: { type: "text", anchor: 2, head: 2 },
};

test("Insert code below markdown inside input area adds trailing newline after code cell (rocq version)", () => {
  // AI generated regression test
  // Reproduces bug: in the rocq version, inserting a code cell below a markdown cell
  // (both inside an input area) produces [markdown][newline][code] without a trailing
  // newline. The code node has closeRequiresNewline: true, so the missing newline
  // causes the serializer to emit the closing fence "```" without the required preceding
  // newline separator, breaking the document.
  const rocqConf = configuration("coq");
  const view = new EditorView(null, {
    state: EditorState.fromJSON(
      { schema: WaterproofSchema },
      stateInputWithMarkdown,
    ),
  });

  const cmd = getCmdInsertCode(InsertionPlace.Below, rocqConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  // Expected: [markdown][newline][code][newline]
  // Actual (bug): [markdown][newline][code]  ← missing trailing newline
  const content = view.state.toJSON().doc.content[0].content;
  expect(content).toStrictEqual([
    { type: "markdown" },
    { type: "newline" },
    { type: "code" },
    { type: "newline" },
  ]);
});

// Places the text cursor inside the `nth` (0-based) node whose type name is `typeName`.
function putCursorInside(view: EditorView, typeName: string, nth: number) {
  let seen = 0;
  let target: number | null = null;
  view.state.doc.descendants((node, pos) => {
    if (node.type.name === typeName) {
      if (seen === nth) target = pos + 1; // +1 = inside the node
      seen++;
    }
    return true;
  });
  if (target === null) throw new Error(`No ${typeName}[${nth}] found`);
  view.dispatch(
    view.state.tr.setSelection(TextSelection.create(view.state.doc, target)),
  );
}

test("Insert code between two adjacent cells keeps trailing newline after the code cell (rocq version)", () => {
  // AI-generated regression test for the bug reported on v0.14.1: a markdown cell can end up directly
  // after the closing fence of a code cell (no separating newline), which is invalid
  // because code.closeRequiresNewline is true (closeTag "\n```").
  //
  // Reproduction (Rocq configuration), starting from a single code cell:
  //   1. Insert markdown below the code cell      -> [code][newline][markdown]
  //   2. Insert markdown below the code cell again -> [code][newline][markdown][markdown]
  //      (the new markdown lands *after* the code's trailing newline, so the two markdown
  //       cells become directly adjacent siblings)
  //   3. Insert a code cell below the FIRST markdown cell.
  //
  // On step 3 the new code node's following sibling is a markdown cell (not a newline) and
  // the parent is `doc`, so insertBelow's trailing-newline clause is skipped and the code
  // node ends up glued to the next markdown cell: [...][code][markdown].
  const rocqConf = configuration("coq");
  const startSingleCode = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "Goal True." }] },
      ],
    },
    selection: { type: "text", anchor: 11, head: 11 },
  };
  const view = new EditorView(null, {
    state: EditorState.fromJSON({ schema: WaterproofSchema }, startSingleCode),
  });

  const insertMarkdownBelow = getCmdInsertMarkdown(
    InsertionPlace.Below,
    rocqConf,
  );
  const insertCodeBelow = getCmdInsertCode(InsertionPlace.Below, rocqConf);

  // Step 1 & 2: insert markdown below the code cell twice (cursor stays in the code cell).
  putCursorInside(view, "code", 0);
  expect(insertMarkdownBelow(view.state, view.dispatch, view)).toBe(true);
  putCursorInside(view, "code", 0);
  expect(insertMarkdownBelow(view.state, view.dispatch, view)).toBe(true);

  // Sanity: we now have two directly-adjacent markdown cells after the code's newline.
  expect(view.state.toJSON().doc.content).toStrictEqual([
    { type: "code", content: [{ type: "text", text: "Goal True." }] },
    { type: "newline" },
    { type: "markdown" },
    { type: "markdown" },
  ]);

  // Step 3: insert a code cell below the first markdown cell.
  putCursorInside(view, "markdown", 0);
  expect(insertCodeBelow(view.state, view.dispatch, view)).toBe(true);

  // The inserted code cell MUST be followed by a newline node so its closing fence
  // does not glue to the trailing markdown cell.
  expect(view.state.toJSON().doc.content).toStrictEqual([
    { type: "code", content: [{ type: "text", text: "Goal True." }] },
    { type: "newline" },
    { type: "markdown" },
    { type: "newline" },
    { type: "code" },
    { type: "newline" }, // <-- missing with the bug: code ends up directly before the markdown
    { type: "markdown" },
  ]);
});

test("Insert code between two adjacent cells keeps leading newline before the code cell (rocq version)", () => {
  // AI-generated regression test: mirror of the trailing-newline bug, on the opening-fence side.
  // A code cell can end up directly after another cell with no separating newline, which is
  // invalid because code.openRequiresNewline is true (openTag "```coq\n"). The serializer would
  // then emit the previous cell's content immediately followed by the opening fence "```coq".
  //
  // Reproduction (Rocq configuration), starting from a single code cell:
  //   1. Insert markdown above the code cell      -> [markdown][newline][code]
  //   2. Insert markdown above the code cell again -> [markdown][markdown][newline][code]
  //      (the new markdown lands *before* the code's leading newline, so the two markdown
  //       cells become directly adjacent siblings)
  //   3. Insert a code cell above the SECOND markdown cell.
  //
  // On step 3 the new code node's preceding sibling is a markdown cell (not a newline) and
  // the parent is `doc`, so insertAbove's leading-newline clause is skipped and the code
  // node ends up glued after the first markdown cell: [markdown][code][...].
  const rocqConf = configuration("coq");
  const startSingleCode = {
    doc: {
      type: "doc",
      content: [
        { type: "code", content: [{ type: "text", text: "Goal True." }] },
      ],
    },
    selection: { type: "text", anchor: 11, head: 11 },
  };
  const view = new EditorView(null, {
    state: EditorState.fromJSON({ schema: WaterproofSchema }, startSingleCode),
  });

  const insertMarkdownAbove = getCmdInsertMarkdown(
    InsertionPlace.Above,
    rocqConf,
  );
  const insertCodeAbove = getCmdInsertCode(InsertionPlace.Above, rocqConf);

  // Step 1 & 2: insert markdown above the code cell twice (cursor stays in the code cell).
  putCursorInside(view, "code", 0);
  expect(insertMarkdownAbove(view.state, view.dispatch, view)).toBe(true);
  putCursorInside(view, "code", 0);
  expect(insertMarkdownAbove(view.state, view.dispatch, view)).toBe(true);

  // Sanity: we now have two directly-adjacent markdown cells before the code's newline.
  expect(view.state.toJSON().doc.content).toStrictEqual([
    { type: "markdown" },
    { type: "markdown" },
    { type: "newline" },
    { type: "code", content: [{ type: "text", text: "Goal True." }] },
  ]);

  // Step 3: insert a code cell above the second markdown cell.
  putCursorInside(view, "markdown", 1);
  expect(insertCodeAbove(view.state, view.dispatch, view)).toBe(true);

  // The inserted code cell MUST be preceded by a newline node so its opening fence
  // does not glue to the preceding markdown cell.
  expect(view.state.toJSON().doc.content).toStrictEqual([
    { type: "markdown" },
    { type: "newline" }, // <-- missing with the bug: code ends up directly after the markdown
    { type: "code" },
    { type: "newline" },
    { type: "markdown" },
    { type: "newline" },
    { type: "code", content: [{ type: "text", text: "Goal True." }] },
  ]);
});

test("Insert code above markdown inside input area adds leading newline before code cell (rocq version)", () => {
  // AI generated regression test
  // Symmetric to the insertBelow bug: when the new code cell becomes the first child of
  // an input area, no leading newline was added before it.  The code node has
  // openRequiresNewline: true, so the missing newline causes the serializer to emit the
  // opening fence "```coq" directly after "<input-area>" on the same line, breaking the
  // document.
  const rocqConf = configuration("coq");
  const view = new EditorView(null, {
    state: EditorState.fromJSON(
      { schema: WaterproofSchema },
      stateInputWithMarkdown,
    ),
  });

  const cmd = getCmdInsertCode(InsertionPlace.Above, rocqConf);
  expect(cmd(view.state, view.dispatch, view)).toBe(true);

  // Expected: [newline][code][newline][markdown]
  const content = view.state.toJSON().doc.content[0].content;
  expect(content).toStrictEqual([
    { type: "newline" },
    { type: "code" },
    { type: "newline" },
    { type: "markdown" },
  ]);
});

test("Insert text hint below code", () => {
    const view = new EditorView(null, { state: EditorState.fromJSON({ schema: WaterproofSchema }, stateOneCode) });

    const cmd = getCmdInsertTextHint(InsertionPlace.Below, tagConf);
    const res = cmd(view.state, view.dispatch, view);

    // We expect this to be true. Could be false in the case we are not in teacher-mode and hence not allowed to insert or when
    // something goes wrong with creating the editor.
    expect(res).toBe(true);
    const content = view.state.doc.toJSON().content;
    expect(content[0].type).toBe("code");
    expect(content[1].type).toBe("newline");
    expect(content[2].type).toBe("hint");
    expect(content[2].attrs.title).toBe("💡 Hint");
    expect(content[2].content).toStrictEqual([
        { "type": "newline" }, { "type": "markdown" }, { "type": "newline" }
    ]);
    expect(content[0].content[0].text).toBe("Goal True.");
});

const stateOneMarkdown = {
  "doc": { "type": "doc", "content": [{ "type": "markdown", "content": [{ "type": "text", "text": "Content." }] }] },
  "selection": { "type": "text", "anchor": 2, "head": 2 }
};
test("Insert code hint above markdown", () => {
    const view = new EditorView(null, { state: EditorState.fromJSON({ schema: WaterproofSchema }, stateOneMarkdown) });

    const cmd = getCmdInsertCodeHint(InsertionPlace.Above, tagConf);
    expect(cmd(view.state, view.dispatch, view)).toBe(true);

    const content = view.state.doc.toJSON().content;
    expect(content[0].type).toBe("hint");
    expect(content[0].attrs.title).toBe("🛠️ Technical details");
    expect(content[0].content).toStrictEqual([
    { "type": "newline" }, { "type": "code" }, { "type": "newline" }
    ]);
    expect(content[1].type).toBe("markdown");
});

test("Insert rocq example below markdown", () => {
    const view = new EditorView(null, { state: EditorState.fromJSON({ schema: WaterproofSchema }, stateOneMarkdown) });
    const rocqConf = configuration("coq");
    const cmd = getCmdInsertExample(InsertionPlace.Below, rocqConf);
    expect(cmd(view.state, view.dispatch, view)).toBe(true);

    const content = view.state.doc.toJSON().content;
    expect(content[0].type).toBe("markdown");
    expect(content[1].type).toBe("newline");
    expect(content[2].type).toBe("code");
    expect(content[2].content[0].text).toBe("Example example: True.\nProof.\n\nQed.");
});

const leanConfig: TagConfiguration = {
    code:     { openTag: "```lean\n",                          closeTag: "\n```",  openRequiresNewline: true,  closeRequiresNewline: true  },
    hint:     { openTag: (t: string) => `:::hint "${t}"\n`,   closeTag: "\n:::",  openRequiresNewline: true,  closeRequiresNewline: true  },
    input:    { openTag: ":::input\n",                         closeTag: "\n:::",  openRequiresNewline: true,  closeRequiresNewline: true  },
    markdown: { openTag: "",                                   closeTag: "",       openRequiresNewline: false, closeRequiresNewline: false },
    math:     { openTag: "$$`",                                closeTag: "`",      openRequiresNewline: false, closeRequiresNewline: false },
    container:{ openTag: (n: string) => `::::${n}\n`,         closeTag: "\n::::", openRequiresNewline: true, closeRequiresNewline: true },
};

test("Insert lean example below markdown", () => {
    const view = new EditorView(null, { state: EditorState.fromJSON({ schema: WaterproofSchema }, stateOneMarkdown) });

    const cmd = getCmdInsertExample(InsertionPlace.Below, leanConfig);
    expect(cmd(view.state, view.dispatch, view)).toBe(true);

    const content = view.state.doc.toJSON().content;
    expect(content[0].type).toBe("markdown");
    expect(content[1].type).toBe("newline");
    expect(content[2].type).toBe("code");
    expect(content[2].content[0].text).toBe('Example "example"\nGiven:\nAssume:\nConclusion:\nProof:\n\nQED');
});