/**
 * @jest-environment jsdom
*/
import { expect } from "@jest/globals";

import { DiagnosticObjectProse, WaterproofEditor } from "../src/editor";
import { DocChange, OffsetDiagnostic, StringCell, ThemeStyle, WaterproofEditorConfig, WaterproofMapping } from "../src/api";

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

type inType = Array<OffsetDiagnostic>;
type outType = Array<DiagnosticObjectProse>;

{
    const el = document.createElement('div');
    jest.spyOn(WaterproofEditor.prototype, "handleScroll").mockImplementation();
    
    test("test", () => {
        const diags: inType = [
            {
                startOffset: 2, endOffset: 8,
                message: "test", severity: 1
            }
        ]
        //@ts-expect-error This method is private so no typing info available
        const mockDiagsChanged = jest.spyOn(WaterproofEditor.prototype, 'informCodemirrorViews').mockImplementation();
        
        const editor = new WaterproofEditor(el, cfg, ThemeStyle.Light);
        editor.init("");
        expect(editor.diagnosticsVersion).toBe(0);
    
        editor.setActiveDiagnostics(diags);
        expect(editor.diagnosticsVersion).toBe(1);
    
        expect(mockDiagsChanged).toBeCalled();
    
        const expected: outType = [
            {
                start: 2, end: 8,
                message: "test",
                severity: 1
            }
        ]
    
        expect(editor.getPartialDiagnosticsInRange(0, 11)).toStrictEqual(expected);
    });

    test("Fit to size", () => {
        const diags: inType = [
            {
                startOffset: 0, endOffset: 10,
                message: "test", severity: 1
            },
            {
                startOffset: 1, endOffset: 3,
                message: "test 2", severity: 3
            }
        ]
        //@ts-expect-error This method is private so no typing info available
        const mockDiagnostics = jest.spyOn(WaterproofEditor.prototype, 'informCodemirrorViews').mockImplementation();
    
        const editor = new WaterproofEditor(el, cfg, ThemeStyle.Light);
        editor.init("");
        expect(editor.diagnosticsVersion).toBe(0);
    
        editor.setActiveDiagnostics(diags);
        expect(editor.diagnosticsVersion).toBe(1);  
    
        expect(mockDiagnostics).toBeCalled();
    
        const expected: outType = [
            {
                start: 0, end: 5,
                message: "test",
                severity: 1
            },
            {
                start: 1, end: 3,
                message: "test 2", severity: 3
            }
        ]
    
        expect(editor.getPartialDiagnosticsInRange(0, 5)).toStrictEqual(expected);
    });

    test("Push one", () => {
        const diags: inType = [
            {
                startOffset: 1, endOffset: 10,
                message: "test", severity: 1
            }
        ]
        //@ts-expect-error This method is private so no typing info available
        const mockDiagnostics = jest.spyOn(WaterproofEditor.prototype, 'informCodemirrorViews').mockImplementation();
    
        const editor = new WaterproofEditor(el, cfg, ThemeStyle.Light);
        editor.init("");

        expect(editor.diagnosticsVersion).toBe(0);
    
        editor.setActiveDiagnostics(diags);
        expect(editor.diagnosticsVersion).toBe(1);
        editor.pushDiagnostics({
            startOffset: 5, endOffset: 8,
            message: "new", severity: 0
        });
        expect(editor.diagnosticsVersion).toBe(2);
    
        expect(mockDiagnostics).toBeCalled();
    
        const expected: outType = [
            {
                start: 1, end: 10,
                message: "test",
                severity: 1
            },
            {
                start: 5, end: 8,
                message: "new",
                severity: 0 
            }
        ]
        
        const retVal = editor.getDiagnosticsInRange(0, 20);
        expect(retVal.length).toBe(2);
        expect(retVal).toStrictEqual(expected);
    });

    test("Add -> remove", () => {
        const diags: inType = [
            {
                startOffset: 0, endOffset: 10,
                message: "test", severity: 1
            }
        ];

        //@ts-expect-error This method is private so no typing info available
        const mockDiagnostics = jest.spyOn(WaterproofEditor.prototype, 'informCodemirrorViews').mockImplementation();
    
        const editor = new WaterproofEditor(el, cfg, ThemeStyle.Light);
        editor.init("");
        expect(editor.diagnosticsVersion).toBe(0);
    
        editor.setActiveDiagnostics(diags);
        expect(editor.diagnosticsVersion).toBe(1);

        // expect(mockDiagnostics).toHaveBeenCalledTimes(1);
        expect(mockDiagnostics).toHaveBeenCalled();

        const beforeRemove = editor.getDiagnosticsInRange(0, 10);
        expect(beforeRemove.length).toBe(1);
        expect(beforeRemove).toStrictEqual([{start: 0, end: 10, message: "test", severity: 1}]);

        const retVal = editor.removeDiagnostic({startOffset: 0, endOffset: 10, message: "test", severity: 1});
        expect(editor.diagnosticsVersion).toBe(2);
        expect(retVal).toBeTruthy();
        const afterRemove = editor.getDiagnosticsInRange(0, 10);
        expect(afterRemove.length).toBe(0);
        expect(afterRemove).toStrictEqual([]);
    });
}


