/**
 * @jest-environment jsdom
*/
import { expect } from "@jest/globals";

jest.mock("prosemirror-dev-tools", () => ({ applyDevTools: () => {} }));

// We mock the mapping in order to not test against a possibly faulty mapping implementation
jest.mock('../src/mapping/mapping', () => {
  const actual = jest.requireActual('../src/mapping/mapping');
  return {
    ...actual,
    Mapping: class extends actual.Mapping {
        // We replace the two main functions with identity functions
        pmIndexToTextOffset = (x: number) => x;
        textOffsetToPmIndex = (x: number) => x;
    }
};
});

// Note that this prevents console log statements from showing
jest.spyOn(global.console, "log").mockImplementation();

import { DiagnosticObjectProse, WaterproofEditor } from "../src/editor";
import { configuration } from "../src/markdown-defaults";
import { OffsetDiagnostic, Severity, ThemeStyle, WaterproofEditorConfig } from "../src/api";
import { CodeBlock } from "../src/document";

const cfg: WaterproofEditorConfig = {
    api: {
        applyStepError: () => {},
        cursorChange: () => {},
        documentChange: () => {},
        editorReady: () => {},
        executeCommand: () => {},
        executeHelp: () => {},
        viewportHint: () => {},
    },
    completions: [],
    documentConstructor: () => [new CodeBlock("This is a very long sentence", {from: 0, to: 28}, {from: 0, to: 28}, 0)],
    symbols: [],
    tagConfiguration: configuration("coq")
}

type inType = Array<OffsetDiagnostic>;
type outType = Array<DiagnosticObjectProse>;

{
    const el = document.createElement('div');
    jest.spyOn(WaterproofEditor.prototype, "handleScroll").mockImplementation();
    
    test("Basic diagnostics in range", () => {
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
    
        expect(editor.getDiagnosticsInRange(0, 11)).toStrictEqual(expected);
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

    test("Add and remove", () => {
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

    test("Filter on levels", () => {
        const diags: inType = [{
            startOffset: 0, endOffset: 1,
            message: "error", severity: Severity.Error
        }, {
            startOffset: 0, endOffset: 1,
            message: "warning", severity: Severity.Warning
        }, {
            startOffset: 0, endOffset: 1,
            message: "info", severity: Severity.Information
        }, {
            startOffset: 0, endOffset: 1,
            message: "hint", severity: Severity.Hint
        }];

        //@ts-expect-error This method is private so no typing info available
        jest.spyOn(WaterproofEditor.prototype, 'informCodemirrorViews').mockImplementation();

        const editor = new WaterproofEditor(el, cfg, ThemeStyle.Light);
        editor.init("");
        expect(editor.diagnosticsVersion).toBe(0);

        editor.setActiveDiagnostics(diags);
        expect(editor.diagnosticsVersion).toBe(1);

        const truncateAtError = editor.getDiagnosticsInRange(0, 10, Severity.Error);
        const truncateAtWarning = editor.getPartialDiagnosticsInRange(0, 10, Severity.Warning);
        const truncateAtInfo = editor.getDiagnosticsInRange(0, 10, Severity.Information);
        const truncateAtHint = editor.getPartialDiagnosticsInRange(0, 10, Severity.Hint);

        expect(truncateAtError.length).toBe(1);
        expect(truncateAtWarning.length).toBe(2);
        expect(truncateAtInfo.length).toBe(3);
        expect(truncateAtHint.length).toBe(4);

        const err: DiagnosticObjectProse = {
            start: 0, end: 1,
            message: "error",
            severity: Severity.Error
        };
        const warn: DiagnosticObjectProse = {
            start: 0, end: 1,
            message: "warning",
            severity: Severity.Warning
        };
        const info: DiagnosticObjectProse = {
            start: 0, end: 1,
            message: "info",
            severity: Severity.Information
        };
        const hint: DiagnosticObjectProse = {
            start: 0, end: 1,
            message: "hint",
            severity: Severity.Hint
        }

        expect(truncateAtError).toStrictEqual([err]);
        expect(truncateAtWarning).toStrictEqual([err, warn]);
        expect(truncateAtInfo).toStrictEqual([err, warn, info]);
        expect(truncateAtHint).toStrictEqual([err, warn, info, hint]);
    });
}


