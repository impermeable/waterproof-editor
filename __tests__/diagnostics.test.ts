/**
 * @jest-environment jsdom
 */
import { expect } from "@jest/globals";

import { WaterproofEditor } from "../src/editor";
import { DocChange, StringCell, ThemeStyle, WaterproofEditorConfig, WaterproofMapping } from "../src/api";

class idMapping extends WaterproofMapping {
    getMapping = () => new Map<number, StringCell>();
    get version() { return -1; }
    findPosition = (idx: number) => idx;
    findInvPosition = (idx: number) => idx;
    update = () => {
        const ch: DocChange = {
            endInFile: -1,
            startInFile: -1,
            finalText: ""
        };
        return ch;
    }
}

const cfg: WaterproofEditorConfig = {
    api: {
        applyStepError: () => {},
        cursorChange: () => {},
        documentChange: () => {},
        editorReady: () => {},
        executeCommand: () => {},
        executeHelp: () => {},
        lineNumbers: () => {},
        viewportHint: () => {},
    },
    completions: [],
    documentConstructor: () => [],
    mapping: idMapping,
    symbols: []
}


test("test", () => {


    const el = document.createElement('div');
    const _editor = new WaterproofEditor(el, cfg, ThemeStyle.Light);

      

    expect(true).toBe(true);
});