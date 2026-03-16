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
