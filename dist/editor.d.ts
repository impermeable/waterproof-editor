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
    constructor(editorElement: HTMLElement, config: WaterproofEditorConfig);
    init(content: string, version?: number): void;
    get state(): EditorState | undefined;
    createProseMirrorEditor(proseDoc: ProseNode): void;
    /** Create initial prosemirror state */
    createState(proseDoc: ProseNode): EditorState;
    /** Create the array of plugins used by the prosemirror editor */
    createPluginsArray(): Plugin[];
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
     * Insert a symbol at the cursor position (or overwrite the current selection).
     *
     * @param symbolUnicode The unicode character to insert.
     * @returns Whether the operation was a success.
     */
    insertSymbol(symbolUnicode: string): boolean;
    /**
     * Toggles line numbers for all codeblocks.
     */
    setShowLineNumbers(show: boolean): void;
    setShowMenuItems(show: boolean): void;
    private createAndDispatchInsertionTransaction;
    /**
     * Called whenever a message describing the configuration of user is sent
     *
     * @param isTeacher Whether teacher mode is enabled
     */
    updateLockingState(isTeacher: boolean): void;
    updateProgressBar(progressParams: SimpleProgressParams): void;
    updateQedStatus(status: InputAreaStatus[]): void;
    parseCoqDiagnostics(msg: DiagnosticMessage): void;
    getDiagnosticsInRange(low: number, high: number, truncationLevel?: number): Array<DiagnosticObjectProse>;
    executeCommand(command: string): void;
    executeHelp(): void;
}
export {};
//# sourceMappingURL=editor.d.ts.map