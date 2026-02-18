/**
 * @jest-environment jsdom
 */
import { EditorView, GutterMarker } from "@codemirror/view";
import { EditorState, RangeSet } from "@codemirror/state";
import { CodeBlockBusyIndicator } from "../src/codeview/progress-indicator";

// --- WaterproofEditor setup (inspired by diagnostics.test.ts) ---

jest.mock("prosemirror-dev-tools", () => ({ applyDevTools: () => {} }));

jest.mock('../src/mapping/mapping', () => {
    const actual = jest.requireActual('../src/mapping/mapping');
    return {
        ...actual,
        Mapping: class extends actual.Mapping {
            pmIndexToTextOffset = (x: number) => x + 67;
            textOffsetToPmIndex = (x: number) => x + 67;
        }
    };
});

jest.spyOn(global.console, "log").mockImplementation();

import { WaterproofEditor } from "../src/editor";
import { ThemeStyle, WaterproofEditorConfig } from "../src/api";
import { CodeBlock } from "../src/document";
import { configuration } from "../src/markdown-defaults";
import { CodeBlockView } from "../src/codeview";
import exp from "constants";

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
    documentConstructor: () => [new CodeBlock("Qed.", {from: 0, to: 4}, {from: 0, to: 4}, 0)],
    symbols: [],
    tagConfiguration: configuration("coq"),
};

function makeWaterproofEditor(): WaterproofEditor {
    const el = document.createElement("div");
    jest.spyOn(WaterproofEditor.prototype, "handleScroll").mockImplementation();
    const editor = new WaterproofEditor(el, cfg, ThemeStyle.Light);
    editor.init("");
    return editor;
}

// --- CodeMirror view helpers ---

/**
 * Build a minimal CodeMirror EditorView with the extensions from
 * CodeBlockBusyIndicator.getExtensions(). Mounted into a detached div so
 * jsdom is satisfied without a real DOM attachment.
 */
function makeView(indicator: CodeBlockBusyIndicator, doc = "line1\nline2\nline3"): EditorView {
    return new EditorView({
        state: EditorState.create({
            doc,
            extensions: indicator.getExtensions(),
        }),
        parent: document.createElement("div"),
    });
}

// Helper to extract the positions of all active busy markers from the view's state.
function getMarkerPositions(indicator: CodeBlockBusyIndicator, view: EditorView): number[] {
    const positions: number[] = [];
    //@ts-expect-error private
    const iter = view.state.field(indicator.busyState).iter();
    while (iter.value !== null) {
        positions.push(iter.from);
        iter.next();
    }
    return positions;
}


describe("CodeBlockBusyIndicator", () => {
    describe("getExtensions()", () => {
        test("returns exactly two extensions (StateField + gutter)", () => {
            const indicator = new CodeBlockBusyIndicator();
            expect(indicator.getExtensions()).toHaveLength(2);
        });

        test("extensions are equal across multiple calls", () => {
            const indicator = new CodeBlockBusyIndicator();
            expect(indicator.getExtensions()).toBe(indicator.getExtensions());
        });
    });

    describe("setBusy()", () => {
        test("does nothing when blockStartPos is undefined", () => {
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);

            const dispatchSpy = jest.spyOn(view, 'dispatch');
            indicator.setBusy(view, 100, undefined);
            expect(dispatchSpy).toHaveBeenCalledTimes(0);
        });

        test("sets a marker when globalPos is inside the block", () => {
            // doc = "line1\nline2\nline3" (length = 17)
            // blockStartPos = 10, maxPos = 10 + 17 + 1 = 28
            // globalPos = 20 -> localOffset = 20 - 10 - 1 = 9 (inside "line2")
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);
            const dispatchSpy = jest.spyOn(view, 'dispatch');

            indicator.setBusy(view, 20, 10);

            expect(dispatchSpy).toHaveBeenCalledTimes(1);
        });

        test("places the marker at the beginning of the correct line", () => {
            // doc = "line1\nline2\nline3", blockStartPos = 10
            // globalPos = 17 -> localOffset = 6 -> lineAt(6).from = 6 (start of "line2")
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);

            indicator.setBusy(view, 17, 10);

            expect(getMarkerPositions(indicator, view)).toEqual([6]);
        });

        test("clears the marker when globalPos is before the block", () => {
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);

            indicator.setBusy(view, 20, 10);
            expect(getMarkerPositions(indicator, view)).toEqual([expect.any(Number)]);

            indicator.setBusy(view, 5, 10);
            expect(getMarkerPositions(indicator, view)).toEqual([]);
        });

        test("clears the marker when globalPos is after the block", () => {
            // doc length = 17, blockStartPos = 10, maxPos = 28
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);

            indicator.setBusy(view, 20, 10);
            expect(getMarkerPositions(indicator, view)).toEqual([expect.any(Number)]);

            indicator.setBusy(view, 100, 10); // 100 > maxPos=28
            expect(getMarkerPositions(indicator, view)).toEqual([]);
        });

        test("does NOT dispatch when globalPos maps to the same line twice (deduplication)", () => {
            // globalPos = 15 -> localOffset = 4 -> lineAt(4).from = 0  (line 1)
            // globalPos = 14 -> localOffset = 3 -> lineAt(3).from = 0  (line 1, same)
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);
            const dispatchSpy = jest.spyOn(view, "dispatch");

            indicator.setBusy(view, 15, 10);
            indicator.setBusy(view, 14, 10); // same line
            expect(dispatchSpy).toHaveBeenCalledTimes(1);

            dispatchSpy.mockRestore();
        });

        test("dispatches again when globalPos moves to a different line", () => {
            // globalPos = 15 -> line 1; globalPos = 17 -> line 2
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);
            const dispatchSpy = jest.spyOn(view, "dispatch");

            indicator.setBusy(view, 15, 10);
            indicator.setBusy(view, 17, 10);
            expect(dispatchSpy).toHaveBeenCalledTimes(2);

            dispatchSpy.mockRestore();
        });

        test("does not dispatch a clear when already empty and globalPos is outside", () => {
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);
            const dispatchSpy = jest.spyOn(view, "dispatch");

            indicator.setBusy(view, 5, 10); // outside, currentBusyPos === null
            expect(dispatchSpy).not.toHaveBeenCalled();

            dispatchSpy.mockRestore();
        });

        // --- Boundary conditions ---

        test("sets a marker when globalPos === blockStartPos (lower boundary, inclusive)", () => {
            // localOffset = 10 - 10 - 1 = -1 -> clamped to 0 -> line 1
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);

            indicator.setBusy(view, 10, 10);

            expect(getMarkerPositions(indicator, view)).toEqual([0]);
        });

        test("sets a marker when globalPos === maxPos (upper boundary, inclusive)", () => {
            // maxPos = 28, localOffset = 17 -> clamped to 17 -> lineAt(17).from = 12 (start of "line3")
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);

            indicator.setBusy(view, 28, 10);

            expect(getMarkerPositions(indicator, view)).toEqual([12]);
        });

        test("clears when globalPos === blockStartPos - 1 (just before lower boundary)", () => {
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);

            indicator.setBusy(view, 20, 10);
            indicator.setBusy(view, 9, 10); // 9 < blockStartPos=10
            expect(getMarkerPositions(indicator, view)).toEqual([]);
        });

        test("clears when globalPos === maxPos + 1 (just past upper boundary)", () => {
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);

            indicator.setBusy(view, 20, 10);
            indicator.setBusy(view, 29, 10); // 29 > maxPos=28
            expect(getMarkerPositions(indicator, view)).toEqual([]);
        });

        // --- Empty doc ---

        test("sets a marker on the single empty line when doc is empty and globalPos is inside", () => {
            // doc = "" (length = 0), blockStartPos = 10, maxPos = 11
            // globalPos in [10, 11] -> localOffset clamped to 0 -> the one empty line
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator, "");

            indicator.setBusy(view, 10, 10);

            expect(getMarkerPositions(indicator, view)).toEqual([0]);
        });

        test("does not place a marker when doc is empty and globalPos is outside the block", () => {
            // maxPos = 11; globalPos = 12 is outside
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator, "");

            indicator.setBusy(view, 12, 10);
            expect(getMarkerPositions(indicator, view)).toEqual([]);
        });
    });

    describe("clearBusy()", () => {
        test("removes a previously set marker", () => {
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);

            indicator.setBusy(view, 20, 10);
            indicator.clearBusy(view);
            expect(getMarkerPositions(indicator, view)).toEqual([]);
        });

        test("is idempotent when called on an already-clear indicator", () => {
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);

            expect(() => {
                indicator.clearBusy(view);
                indicator.clearBusy(view);
            }).not.toThrow();
            expect(getMarkerPositions(indicator, view)).toEqual([]);
        });

        test("resets the internal position cache so a subsequent setBusy dispatches", () => {
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);

            indicator.setBusy(view, 15, 10);
            indicator.clearBusy(view);

            const dispatchSpy = jest.spyOn(view, "dispatch");
            indicator.setBusy(view, 15, 10); // same localPos, but cache was cleared
            expect(dispatchSpy).toHaveBeenCalledTimes(1);

            dispatchSpy.mockRestore();
        });

        test("does not dispatch a clear when setBusy with an outside pos follows clearBusy", () => {
            // clearBusy sets currentBusyPos = null; a subsequent out-of-range
            // setBusy should not dispatch a redundant clear.
            const indicator = new CodeBlockBusyIndicator();
            const view = makeView(indicator);

            indicator.setBusy(view, 20, 10);
            indicator.clearBusy(view);

            const dispatchSpy = jest.spyOn(view, "dispatch");
            indicator.setBusy(view, 5, 10); // outside block, nothing to clear
            expect(dispatchSpy).not.toHaveBeenCalled();

            dispatchSpy.mockRestore();
        });
    });
});

// --- WaterproofEditor.setBusyIndicator ---

describe("WaterproofEditor.setBusyIndicator", () => {
    test("deduplicates: does not call mapping when busyPos is unchanged", () => {
        const editor = makeWaterproofEditor();
        const spy = jest.spyOn(CodeBlockView.prototype, 'setBusyIndicator');

        editor.setBusyIndicator(2);
        editor.setBusyIndicator(2); // duplicate - mapping must not be called again
        expect(spy).toHaveBeenCalledTimes(1);

        spy.mockRestore();
    });

    test("forwards again after position changes", () => {
        const editor = makeWaterproofEditor();
        const spy = jest.spyOn(CodeBlockView.prototype, 'setBusyIndicator');

        editor.setBusyIndicator(2);
        editor.setBusyIndicator(2); // duplicate, skipped
        editor.setBusyIndicator(3); // new position - must reach mapping
        expect(spy).toHaveBeenCalledTimes(2);

        spy.mockRestore();
    });

    test("is a no-op when mapping is undefined", () => {
        const editor = makeWaterproofEditor();
        //@ts-expect-error private
        editor._mapping = undefined;

        expect(() => editor.setBusyIndicator(2)).not.toThrow();
    });

    test("is a no-op when view is undefined", () => {
        const editor = makeWaterproofEditor();
        //@ts-expect-error private
        editor._view = undefined;

        expect(() => editor.setBusyIndicator(2)).not.toThrow();
    });
});

describe("WaterproofEditor.removeBusyIndicators", () => {

    test("calls removeBusyIndicator in the editor", () => {
        const editor = makeWaterproofEditor();
        const spy = jest.spyOn(CodeBlockView.prototype, 'removeBusyIndicator');

        editor.removeBusyIndicators();

        expect(spy).toHaveBeenCalledTimes(1);

        spy.mockRestore();
    });

    test("allows the same offset to be forwarded again after reset", () => {
        // Without the reset, setBusyIndicator(x) after removeBusyIndicators() 
        // is swallowed by the oldOffsetChecked === x guard.
        const editor = makeWaterproofEditor();
        const spySet = jest.spyOn(CodeBlockView.prototype, 'setBusyIndicator');
        const spyRemove = jest.spyOn(CodeBlockView.prototype, 'removeBusyIndicator');

        editor.setBusyIndicator(2);
        expect(spySet).toHaveBeenCalledTimes(1);

        editor.removeBusyIndicators();

        editor.setBusyIndicator(2); // must NOT be suppressed
        expect(spySet).toHaveBeenCalledTimes(2);
        expect(spyRemove).toHaveBeenCalledTimes(1);

        spySet.mockRestore();
        spyRemove.mockRestore();
    });

    test("does not throw when called before any setBusyIndicator", () => {
        const editor = makeWaterproofEditor();
        expect(() => editor.removeBusyIndicators()).not.toThrow();
    });
});