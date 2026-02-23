/**
 * @jest-environment jsdom
*/
import { expect } from "@jest/globals";
import { CodeBlockView } from "../src/codeview";
import { Severity, ThemeStyle } from "../src/api";
import { Node } from "prosemirror-model";
import { WaterproofSchema } from "../src/schema";
import { severityToString } from "../src/codeview/nodeview";

// Mock the plugin key to always return state teacher=true
jest.mock('../src/inputArea.ts', () => ({
  INPUT_AREA_PLUGIN_KEY: {
    getState: jest.fn(() => ({ teacher: true }))
  }
}));

const docText = "Qed.";
const docStart = 0;
const docEnd = docText.length;
const node: Node = WaterproofSchema.nodes["code"].create(null, WaterproofSchema.text(docText));

test("Basic diagnostic", () => {
    //@ts-expect-error For test setup supply only the minimal needed to get a working CodeBlockView
    const nodeview = new CodeBlockView(node, {editable: true}, null, () => undefined, null, [], [], ThemeStyle.Light);

    const diag = {start: docStart, end: docEnd, message: "test", severity: Severity.Error};

    const result = nodeview.preprocessDiagnostic(diag.start, diag.end, diag.message, diag.severity);
    
    expect(result.from).toBe(diag.start);
    expect(result.to).toBe(diag.end);
    expect(result.message).toBe(diag.message);
    expect(result.severity).toBe(severityToString(diag.severity));

    expect(result.actions).toBeDefined();
    expect(result.actions?.length).toBe(1);

    expect(result.actions?.at(0)?.name).toBe("📋");
});

test("Severity to string", () => {
    expect(severityToString(Severity.Error)).toStrictEqual("error");
    expect(severityToString(Severity.Information)).toStrictEqual("info");
    expect(severityToString(Severity.Warning)).toStrictEqual("warning");
    expect(severityToString(Severity.Hint)).toStrictEqual("hint");
});

test("Hint Replace", () => {
    //@ts-expect-error For test setup supply only the minimal needed to get a working CodeBlockView
    const nodeview = new CodeBlockView(node, {editable: true}, null, () => undefined, null, [], [], ThemeStyle.Light);

    const value = "SOME_VALUE_WORTH_REPLACING";
    const diag = {start: docStart, end: docEnd, message: `Hint, replace with: ${value}`, severity: Severity.Error};

    const result = nodeview.preprocessDiagnostic(diag.start, diag.end, diag.message, diag.severity);
    
    // console.log(result);
    expect(result.from).toBe(diag.start);
    expect(result.to).toBe(diag.end);
    expect(result.message).toBe(value);
    expect(result.severity).toBe(severityToString(diag.severity));

    expect(result.actions).toBeDefined();
    expect(result.actions?.length).toBe(1);

    expect(result.actions?.at(0)?.name).toBe("Replace ↩️");

    //@ts-expect-error private
    expect(nodeview._codemirror?.state.doc.toString()).toStrictEqual(docText);
    //@ts-expect-error private
    result.actions?.at(0)?.apply(nodeview._codemirror, result.from, result.to);
    //@ts-expect-error private
    expect(nodeview._codemirror?.state.doc.toString()).toStrictEqual(value);
});

test("Hint Insert", () => {
    //@ts-expect-error For test setup supply only the minimal needed to get a working CodeBlockView
    const nodeview = new CodeBlockView(node, {editable: true}, null, () => undefined, null, [], [], ThemeStyle.Light);

    const value = "value-to-insert";
    const diag = {start: docStart, end: docEnd, message: `Hint, insert: ${value}`, severity: Severity.Error};

    const result = nodeview.preprocessDiagnostic(diag.start, diag.end, diag.message, diag.severity);
    
    // console.log(result);
    expect(result.from).toBe(diag.start);
    expect(result.to).toBe(diag.end);
    expect(result.message).toBe(value);
    expect(result.severity).toBe(severityToString(diag.severity));

    expect(result.actions).toBeDefined();
    expect(result.actions?.length).toBe(1);

    expect(result.actions?.at(0)?.name).toBe("Insert ⤵️");

    //@ts-expect-error private
    expect(nodeview._codemirror?.state.doc.toString()).toStrictEqual(docText);
    //@ts-expect-error private
    result.actions?.at(0)?.apply(nodeview._codemirror, result.from, result.to);
    //@ts-expect-error private
    expect(nodeview._codemirror?.state.doc.toString()).toStrictEqual(`${docText}\n${value}`);
});

test("Hint Delete", () => {
    //@ts-expect-error For test setup supply only the minimal needed to get a working CodeBlockView
    const nodeview = new CodeBlockView(node, {editable: true}, null, () => undefined, null, [], [], ThemeStyle.Light);

    const diag = {start: docStart, end: docEnd, message: `Remove this line lkdj`, severity: Severity.Error};

    const result = nodeview.preprocessDiagnostic(diag.start, diag.end, diag.message, diag.severity);
    
    // console.log(result);
    expect(result.from).toBe(diag.start);
    expect(result.to).toBe(diag.end);
    expect(result.message).toBe("Remove this line lkdj");
    expect(result.severity).toBe(severityToString(diag.severity));

    expect(result.actions).toBeDefined();
    expect(result.actions?.length).toBe(1);

    expect(result.actions?.at(0)?.name).toBe("Delete 🗑️");

    //@ts-expect-error private
    expect(nodeview._codemirror?.state.doc.toString()).toStrictEqual(docText);
    //@ts-expect-error private
    result.actions?.at(0)?.apply(nodeview._codemirror, result.from, result.to);
    //@ts-expect-error private
    expect(nodeview._codemirror?.state.doc.toString()).toStrictEqual("");
});


/** Construct a minimal CodeBlockView for testing. */
function makeView() {
    //@ts-expect-error supply only the minimal needed to get a working CodeBlockView
    return new CodeBlockView(node, {editable: true}, null, () => undefined, null, [], [], ThemeStyle.Light);
}

describe("CodeBlockView busy indicator", () => {
    test("removeBusyIndicator is a no-op when codemirror is absent", () => {
        const nv = makeView();
        //@ts-expect-error
        nv._codemirror = undefined;
        //@ts-expect-error
        const spy = jest.spyOn(nv.busyIndicator, "clearBusy");

        expect(() => nv.removeBusyIndicator()).not.toThrow();
        expect(spy).not.toHaveBeenCalled();
    });
});