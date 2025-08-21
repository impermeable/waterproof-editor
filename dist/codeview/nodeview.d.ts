import { Completion, CompletionSource } from "@codemirror/autocomplete";
import { Node, Schema } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { EmbeddedCodeMirrorEditor } from "../embedded-codemirror";
/**
 * Export CodeBlockView class that implements the custom codeblock nodeview.
 * Corresponds with the example as can be found here:
 * https://prosemirror.net/examples/codemirror/
 */
export declare class CodeBlockView extends EmbeddedCodeMirrorEditor {
    dom: HTMLElement;
    private _lineNumberCompartment;
    private _lineNumbersExtension;
    private _dynamicCompletions;
    private _readOnlyCompartment;
    private _diags;
    private debouncer;
    constructor(node: Node, view: EditorView, getPos: (() => number | undefined), schema: Schema, completions: Array<Completion>, symbols: Array<Completion>);
    private partOfInputArea;
    handleSnippet(template: string, posFrom: number, posTo: number): void;
    private lintingFunction;
    /**
     * set edit permission
     */
    setEditPermission(): void;
    /**
     * Update the line numbers extension
     */
    updateLineNumbers(firstLineNo: number, toggleState: boolean): void;
    /**
     * This method needs to be called with the new list to update it.
     */
    handleNewComplete(newCompletions: Completion[]): void;
    /**
     * (Dynamic) Completion Source.
     * Contains completions for defined theorems/lemmas/etc.
     */
    dynamicCompletionSource: CompletionSource;
    /**
         * Add a new coq error to this view
         * @param from The from position of the error.
         * @param to The to postion of the error (should be larger than `from`).
         * @param message The message attached to this error.
         * @param severity The severity attached to this error.
         */
    addCoqError(from: number, to: number, message: string, severity: number): void;
    private updateDiagnostics;
    private showCopyNotification;
    /**
     * Helper function that forces the linter function to run.
     * Should be called after an error has been added or after the errors have been cleared.
     */
    private forceUpdateLinting;
    /**
     * Clear all coq errors from this view.
     */
    clearCoqErrors(): void;
}
//# sourceMappingURL=nodeview.d.ts.map