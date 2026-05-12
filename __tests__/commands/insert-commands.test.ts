/**
 * @jest-environment jsdom
*/

import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { WaterproofSchema } from "../../src/schema";
import { getCmdInsertCode, getCmdInsertMarkdown, getCmdInsertLatex } from "../../src/commands/insert-command";
import { InsertionPlace } from "../../src/commands";
import { configuration } from "../../src/markdown-defaults";

const state = {"doc":{"type":"doc","content":[{"type":"code","content":[{"type":"text","text":"Goal True."}]},{"type":"newline"},{"type":"code","content":[{"type":"text","text":"Goal False."}]}]},"selection":{"type":"text","anchor":25,"head":25}};
const tagConf = configuration("")

// Mock the plugin key to always return state teacher=true
jest.mock('../../src/inputArea.ts', () => ({
  INPUT_AREA_PLUGIN_KEY: {
    getState: jest.fn(() => ({ teacher: true }))
  }
}));

// A doc with a single code cell; selection inside the code content (position 11 = after 9 chars).
const stateOneCode = {"doc":{"type":"doc","content":[{"type":"code","content":[{"type":"text","text":"Goal True."}]}]},"selection":{"type":"text","anchor":11,"head":11}};

test("Insert markdown below code cell adds a newline separator", () => {
    const view = new EditorView(null, {state: EditorState.fromJSON({schema: WaterproofSchema}, stateOneCode)});

    const cmd = getCmdInsertMarkdown(InsertionPlace.Below, tagConf);
    const res = cmd(view.state, view.dispatch, view);

    expect(res).toBe(true);

    // The newline node between code and markdown is required so that the serializer
    // does not place markdown text on the same line as the closing code fence ("\n```").
    const expected = {"doc":{"type":"doc",
        "content":[
            {"type":"code","content":[{"type":"text","text":"Goal True."}]},
            {"type":"newline"},
            {"type":"markdown"}
        ]},
        "selection":{"type":"text","anchor":11,"head":11}};
    expect(view.state.toJSON()).toStrictEqual(expected);
});

// A doc with a single code cell; selection inside the code content.
const stateOneCodeForAbove = {"doc":{"type":"doc","content":[{"type":"code","content":[{"type":"text","text":"Goal True."}]}]},"selection":{"type":"text","anchor":11,"head":11}};

test("Insert markdown above code cell adds a newline separator", () => {
    const view = new EditorView(null, {state: EditorState.fromJSON({schema: WaterproofSchema}, stateOneCodeForAbove)});

    const cmd = getCmdInsertMarkdown(InsertionPlace.Above, tagConf);
    const res = cmd(view.state, view.dispatch, view);

    expect(res).toBe(true);

    // The newline node between markdown and code is required so that the serializer
    // does not place markdown text on the same line as the opening code fence ("```lean\n").
    const expected = {"doc":{"type":"doc",
        "content":[
            {"type":"markdown"},
            {"type":"newline"},
            {"type":"code","content":[{"type":"text","text":"Goal True."}]}
        ]},
        "selection":{"type":"text","anchor":14,"head":14}};
    expect(view.state.toJSON()).toStrictEqual(expected);
});

test("Insert code below twice (selection static)", () => {
    const view = new EditorView(null, {state: EditorState.fromJSON({schema: WaterproofSchema}, state)});

    const cmd = getCmdInsertCode(InsertionPlace.Below, tagConf);
    const res = cmd(view.state, view.dispatch, view);

    // We expect this to be true. Could be false in the case we are not in teacher-mode and hence not allowed to insert or when
    // something goes wrong with creating the editor.
    expect(res).toBe(true);

    const newState = {"doc":{"type":"doc",
        "content":[
            {"type":"code","content":[{"type":"text","text":"Goal True."}]},
            {"type":"newline"},
            {"type":"code","content":[{"type":"text","text":"Goal False."}]},    
            {"type": "newline" }, {"type": "code" } // Should have added a newline node and a code node
        ]},
        "selection":{"type":"text","anchor":25,"head":25}};
    expect(view.state.toJSON()).toStrictEqual(newState);

    const res2 = cmd(view.state, view.dispatch, view);
    expect(res2).toBe(true);
    const newState2 = {"doc":{"type":"doc",
        "content":[
            {"type":"code","content":[{"type":"text","text":"Goal True."}]},
            {"type":"newline"},
            {"type":"code","content":[{"type":"text","text":"Goal False."}]},
            {"type": "newline" }, {"type": "code"}, // Should have added a newline node and a code node
            {"type": "newline" }, {"type": "code"}
        ]},
        "selection":{"type":"text","anchor":25,"head":25}};
    expect(view.state.toJSON()).toStrictEqual(newState2);
});

// States for testing insertion adjacent to code blocks using the real configuration
// (code has openRequiresNewline: true, closeRequiresNewline: true)
//
// doc: [code("Content.")][newline][math_display("Content.")]
// Positions: code size=10 (pos 0-10), newline size=1 (pos 10), math_display starts at pos 11
const stateCodeNewlineMath_mathSelected = {"doc":{"type":"doc","content":[{"type":"code","content":[{"type":"text","text":"Content."}]},{"type":"newline"},{"type":"math_display","content":[{"type":"text","text":"Content."}]}]},"selection":{"type":"node","anchor":11}};

// doc: [math_display("Content.")][newline][code("Content.")]
// math_display size=10 (pos 0-10), newline size=1 (pos 10), code starts at pos 11
const stateMathNewlineCode_mathSelected = {"doc":{"type":"doc","content":[{"type":"math_display","content":[{"type":"text","text":"Content."}]},{"type":"newline"},{"type":"code","content":[{"type":"text","text":"Content."}]}]},"selection":{"type":"node","anchor":0}};

test("Insert markdown above math_display when code is before the newline adds extra newline", () => {
    const view = new EditorView(null, {state: EditorState.fromJSON({schema: WaterproofSchema}, stateCodeNewlineMath_mathSelected)});
    const cmd = getCmdInsertMarkdown(InsertionPlace.Above, tagConf);
    expect(cmd(view.state, view.dispatch, view)).toBe(true);

    const content = view.state.toJSON().doc.content;
    expect(content).toStrictEqual([
        {"type":"code","content":[{"type":"text","text":"Content."}]},
        {"type":"newline"},
        {"type":"markdown"},
        {"type":"newline"},
        {"type":"math_display","content":[{"type":"text","text":"Content."}]}
    ]);
});

test("Insert math above math_display when code is before the newline adds extra newline", () => {
    const view = new EditorView(null, {state: EditorState.fromJSON({schema: WaterproofSchema}, stateCodeNewlineMath_mathSelected)});
    const cmd = getCmdInsertLatex(InsertionPlace.Above, tagConf);
    expect(cmd(view.state, view.dispatch, view)).toBe(true);

    const content = view.state.toJSON().doc.content;
    expect(content).toStrictEqual([
        {"type":"code","content":[{"type":"text","text":"Content."}]},
        {"type":"newline"},
        {"type":"math_display"},
        {"type":"newline"},
        {"type":"math_display","content":[{"type":"text","text":"Content."}]}
    ]);
});

test("Insert markdown below math_display when code is after the newline adds extra newline", () => {
    const view = new EditorView(null, {state: EditorState.fromJSON({schema: WaterproofSchema}, stateMathNewlineCode_mathSelected)});
    const cmd = getCmdInsertMarkdown(InsertionPlace.Below, tagConf);
    expect(cmd(view.state, view.dispatch, view)).toBe(true);

    const content = view.state.toJSON().doc.content;
    expect(content).toStrictEqual([
        {"type":"math_display","content":[{"type":"text","text":"Content."}]},
        {"type":"newline"},
        {"type":"markdown"},
        {"type":"newline"},
        {"type":"code","content":[{"type":"text","text":"Content."}]}
    ]);
});

test("Insert math below math_display when code is after the newline adds extra newline", () => {
    const view = new EditorView(null, {state: EditorState.fromJSON({schema: WaterproofSchema}, stateMathNewlineCode_mathSelected)});
    const cmd = getCmdInsertLatex(InsertionPlace.Below, tagConf);
    expect(cmd(view.state, view.dispatch, view)).toBe(true);

    const content = view.state.toJSON().doc.content;
    expect(content).toStrictEqual([
        {"type":"math_display","content":[{"type":"text","text":"Content."}]},
        {"type":"newline"},
        {"type":"math_display"},
        {"type":"newline"},
        {"type":"code","content":[{"type":"text","text":"Content."}]}
    ]);
});
test("Insert code below twice (selection moves down)", () => {

    const view = new EditorView(null, {state: EditorState.fromJSON({schema: WaterproofSchema}, state)});

    const cmd = getCmdInsertCode(InsertionPlace.Below, tagConf);
    const res = cmd(view.state, view.dispatch, view);

    // We expect this to be true. Could be false in the case we are not in teacher-mode and hence not allowed to insert or when
    // something goes wrong with creating the editor.
    expect(res).toBe(true);

    const newState = {"doc":{"type":"doc",
        "content":[
            {"type":"code","content":[{"type":"text","text":"Goal True."}]},
            {"type":"newline"},
            {"type":"code","content":[{"type":"text","text":"Goal False."}]},    
            {"type": "newline" }, {"type": "code" } // Should have added a newline node and a code node
        ]},
        "selection":{"type":"text","anchor":25,"head":25}};
    expect(view.state.toJSON()).toStrictEqual(newState);

    const {tr, doc} = view.state;
    const $from = doc.resolve(28);
    view.dispatch(tr.setSelection(new TextSelection($from)));

    const stateAfterSelUpdate = {"doc":{"type":"doc",
        "content":[
            {"type":"code","content":[{"type":"text","text":"Goal True."}]},
            {"type":"newline"},
            {"type":"code","content":[{"type":"text","text":"Goal False."}]},    
            {"type": "newline" }, {"type": "code" }
        ]},
        "selection":{"type":"text","anchor":28,"head":28}}; // Selection moved into the new code node

    expect(view.state.toJSON()).toStrictEqual(stateAfterSelUpdate);
    
    const res2 = cmd(view.state, view.dispatch, view);
    expect(res2).toBe(true);
    const newState2 = {"doc":{"type":"doc",
        "content":[
            {"type":"code","content":[{"type":"text","text":"Goal True."}]},
            {"type":"newline"},
            {"type":"code","content":[{"type":"text","text":"Goal False."}]},
            {"type": "newline" }, {"type": "code"}, // Cursor was here
            {"type": "newline" }, {"type": "code"} // Should have added a newline node and a code node
        ]},
        "selection":{"type":"text","anchor":28,"head":28}};
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
        "doc": { "type": "doc", "content": [
            { "type": "code", "content": [{ "type": "text", "text": "Goal True." }] }
        ]},
        // Non-cursor selection: anchor=2, head=5 selects "oal"
        "selection": { "type": "text", "anchor": 2, "head": 5 }
    };

    const view = new EditorView(null, { state: EditorState.fromJSON({ schema: WaterproofSchema }, stateJSON) });
    const cmd = getCmdInsertCode(InsertionPlace.Below, tagConf);

    // Must not throw (with the bug it would throw a RangeError)
    let result: boolean = false;
    expect(() => { result = cmd(view.state, view.dispatch, view); }).not.toThrow();
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
    "doc": {"type": "doc", "content": [{"type": "input", "content": [{"type": "markdown"}]}]},
    "selection": {"type": "text", "anchor": 2, "head": 2}
};

test("Insert code below markdown inside input area adds trailing newline after code cell (rocq version)", () => {
    // AI generated regression test
    // Reproduces bug: in the rocq version, inserting a code cell below a markdown cell
    // (both inside an input area) produces [markdown][newline][code] without a trailing
    // newline. The code node has closeRequiresNewline: true, so the missing newline
    // causes the serializer to emit the closing fence "```" without the required preceding
    // newline separator, breaking the document.
    const rocqConf = configuration("coq");
    const view = new EditorView(null, {state: EditorState.fromJSON({schema: WaterproofSchema}, stateInputWithMarkdown)});

    const cmd = getCmdInsertCode(InsertionPlace.Below, rocqConf);
    expect(cmd(view.state, view.dispatch, view)).toBe(true);

    // Expected: [markdown][newline][code][newline]
    // Actual (bug): [markdown][newline][code]  ← missing trailing newline
    const content = view.state.toJSON().doc.content[0].content;
    expect(content).toStrictEqual([
        {"type": "markdown"},
        {"type": "newline"},
        {"type": "code"},
        {"type": "newline"}
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
    const view = new EditorView(null, {state: EditorState.fromJSON({schema: WaterproofSchema}, stateInputWithMarkdown)});

    const cmd = getCmdInsertCode(InsertionPlace.Above, rocqConf);
    expect(cmd(view.state, view.dispatch, view)).toBe(true);

    // Expected: [newline][code][newline][markdown]
    const content = view.state.toJSON().doc.content[0].content;
    expect(content).toStrictEqual([
        {"type": "newline"},
        {"type": "code"},
        {"type": "newline"},
        {"type": "markdown"}
    ]);
});
