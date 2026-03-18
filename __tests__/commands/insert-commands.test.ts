/**
 * @jest-environment jsdom
*/

import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { WaterproofSchema } from "../../src/schema";
import { getCmdInsertCode, getCmdInsertMarkdown } from "../../src/commands/insert-command";
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
