import { ResolvedPos, Node as ProseNode } from "prosemirror-model";
import { EditorState, Plugin, Selection } from "prosemirror-state";
import { LineNumber, InputAreaStatus, SimpleProgressParams, HistoryChange, Severity } from "./api";
import "katex/dist/katex.min.css";
import "prosemirror-view/style/prosemirror.css";
import "./styles";
import { WaterproofEditorConfig, DiagnosticMessage } from "./api/types";
import { Completion } from "@codemirror/autocomplete";
/** Type that contains a coq diagnostics object fit for use in the ProseMirror editor context. */
type DiagnosticObjectProse = {
    message: string;
    start: number;
    end: number;
    $start: ResolvedPos;
    $end: ResolvedPos;
    severity: Severity;
};
/**
 * WaterproofEditor class. Configured via the WaterproofEditorConfig object.
 */
export declare class WaterproofEditor {
    private _editorConfig;
    private _schema;
    private _editorElem;
    private _view;
    private _translator;
    private _mapping;
    private readonly _userOS;
    private currentProseDiagnostics;
    private _lineNumbersShown;
    /**
     * Create a new WaterproofEditor instance.
     * @param editorElement The HTML element where the editor will be inserted in the document
     * @param config The configuration of the editor to use.
     */
    constructor(editorElement: HTMLElement, config: WaterproofEditorConfig);
    init(content: string, version?: number): void;
    get state(): EditorState | undefined;
    createProseMirrorEditor(proseDoc: ProseNode): void;
    /** Create initial prosemirror state */
    createState(proseDoc: ProseNode): EditorState;
    /** Create the array of plugins used by the prosemirror editor */
    createPluginsArray(): Plugin[];
    /**
     * Handle a snippet that should be inserted into the editor.
     * @param template The template string of the snippet that should be inserted.
     */
    handleSnippet(template: string): void;
    /** Called on every selection update. */
    updateCursor(pos: Selection): void;
    /** Called on every transaction update in which the textdocument was modified */
    sendLineNumbers(): void;
    /**
     * Updates the dynamic autocomplete suggestions shown in the editor.
     * @param completions Array of completions.
     */
    handleCompletions(completions: Array<Completion>): void;
    /** Called whenever a line number message is received from vscode to update line numbers of codemirror cells */
    setLineNumbers(msg: LineNumber): void;
    /**
     * Execute a history change (undo/redo) in the editor.
     * @param type Type of the change
     */
    handleHistoryChange(type: HistoryChange): void;
    /**
     * Insert a symbol at the cursor position (replaces the current selection if there is one).
     *
     * @param symbolUnicode The unicode character to insert.
     * @returns Whether the operation was a success.
     */
    insertSymbol(symbolUnicode: string): boolean;
    /**
     * Toggles line numbers for all codeblocks.
     * @param show The editor will show line numbers in the code cells when set to `true`.
     */
    setShowLineNumbers(show: boolean): void;
    /**
     * Toggles showing menu items in the editor for students.
     * @param show The editor will show menu items to students when set to `true`.
     */
    setShowMenuItems(show: boolean): void;
    private createAndDispatchInsertionTransaction;
    /**
     * Called whenever a message describing the configuration of user is sent
     *
     * @param isTeacher Whether teacher mode is enabled
     */
    updateLockingState(isTeacher: boolean): void;
    /**
     * Updates the state of the progress bar in the editor.
     *
     * @param progressParams The type used to store information on the status of the checking of the current file
     */
    updateProgressBar(progressParams: SimpleProgressParams): void;
    /**
     * Updates the status of the input areas in the editor.
     *
     * @param status Array containing the status of the input areas within the current document, where `status[i]` corresponds to the i-th input area (starting at zero for the first input area).
     */
    updateQedStatus(status: InputAreaStatus[]): void;
    /**
     * Updates the current set of diagnostics in the document. This function takes in the set of all diagnostics in the current document and assigns them to the correct code cell in the document.
     *
     * @param msg The set of diagnostics for the current document.
     */
    parseCoqDiagnostics(msg: DiagnosticMessage): void;
    getDiagnosticsInRange(low: number, high: number, truncationLevel?: number): Array<DiagnosticObjectProse>;
    executeCommand(command: string): void;
    executeHelp(): void;
}
export {};
//# sourceMappingURL=editor.d.ts.map