/**
 * @jest-environment jsdom
*/
import { Command, EditorState } from "prosemirror-state";
import { TagConfiguration } from "../../src/api";
import { InsertionPlace } from "../../src/commands";
import { getCmdInsertLatex, getCmdInsertCode, getCmdInsertMarkdown } from "../../src/commands/insert-command";
import { configuration } from "../../src/markdown-defaults";
import { EditorView } from "prosemirror-view";
import { WaterproofSchema } from "../../src/schema";

/* Note that this is not a real tag configuration, the multilean is exclusive to lean files */
const tagConf: TagConfiguration = {
    markdown: {
        openTag: "", closeTag: "",
        openRequiresNewline: false, closeRequiresNewline: false,
    }, 
    code: {
        openRequiresNewline: false,
        openTag: "```coq\n",
        closeTag: "\n```",
        closeRequiresNewline: false,
    },
    hint: {
        openTag: (title: string) => `<hint title="${title}">`,
        closeTag: "</hint>",
        openRequiresNewline: false, closeRequiresNewline: false,
    },
    input: {
        openTag: "<input-area>", closeTag: "</input-area>",
        openRequiresNewline: false, closeRequiresNewline: false,
    },
    math: {
        openTag: "$$", closeTag: "$$",
        openRequiresNewline: false, closeRequiresNewline: false
    },
    codeGroup: {
        openTag: "::::multilean\n", closeTag: "\n::::",
        openRequiresNewline: false, closeRequiresNewline: false,
    }
}

const initialStateCode = {"doc":{"type":"doc","content":[{"type":"code","content":[{"type":"text","text":"Content."}]}]},"selection":{"type":"text","anchor":9,"head":9}}
const initialStateMD = {"doc":{"type":"doc","content":[{"type":"markdown","content":[{"type":"text","text":"Content."}]}]},"selection":{"type":"node","anchor":0}}
const initialStateMath = {"doc":{"type":"doc","content":[{"type":"math_display","content":[{"type":"text","text":"Content."}]}]},"selection":{"type":"node","anchor":0}}

const startingCell: Array<[string, any]> = [
    ["Latex", initialStateMath],
    ["Markdown", initialStateMD],
    ["Code", initialStateCode],
];

const insertableTypes: Array<[string, (place: InsertionPlace, conf: TagConfiguration) => Command, string]> = [
    ["Latex", getCmdInsertLatex, "math_display"],
    ["Markdown", getCmdInsertMarkdown, "markdown"],
    ["Code", getCmdInsertCode, "code"]
];

const places: Array<[string, InsertionPlace]> = [
    ["above", InsertionPlace.Above],
    ["below", InsertionPlace.Below],
]

// Mock the plugin key to always return state teacher=true
jest.mock('../../src/inputArea.ts', () => ({
  INPUT_AREA_PLUGIN_KEY: {
    getState: jest.fn(() => ({ teacher: true }))
  }
}));

for (const cell of startingCell) {
    for (const toInsert of insertableTypes) {
        for (const place of places) {
            const testName = `Insert ${toInsert[0]} ${place[0]} ${cell[0]}`;
            test(testName, () => {
                const cmd = toInsert[1](place[1], tagConf);
                const view = new EditorView(null, {state: EditorState.fromJSON({schema: WaterproofSchema}, cell[1])});
                const res = cmd(view.state, view.dispatch, view);
                expect(res).toBe(true); // Check that the command returns true, indicating that it 'could' be executed.

                const newState = view.state.toJSON();
                
                const content = newState.doc.content; 
                
                const oldContent = cell[1].doc.content;
                if (place[1] === InsertionPlace.Above) {
                    expect(content).toStrictEqual([{type: toInsert[2]},...oldContent]);
                } else {
                    expect(content).toStrictEqual([...oldContent, {type: toInsert[2]}]);
                }
            });
        }
    }
}