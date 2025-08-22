import { Step } from "prosemirror-transform";
import { DocChange, WrappingDocChange, Severity, WaterproofCompletion, WaterproofSymbol } from ".";
import { Block } from "../document";

/**
 * Represents an area of text, that is editable in the prosemirror view and its
 * mapping to the vscode document
 */
export type StringCell = {
    /** The prosemirror starting index of this cell */
    startProse: number,
    /** The prosemirror ending index of this cell */
    endProse: number,
    /** The starting index of this cell in the text document string vscode side */
    startText: number,
    /** The ending index of this cell in the text document string vscode side */
    endText: number,
};

export type Positioned<A> = {
    obj: A;
    pos: number | undefined;
};

/**
 * WaterproofDocument is a collection of blocks
 */
export type WaterproofDocument = Block[];

export type WaterproofCallbacks = {
    executeCommand: (command: string, time: number) => void,
    executeHelp: () => void,
    editorReady: () => void,
    documentChange: (change: DocChange | WrappingDocChange) => void,
    applyStepError: (errorMessage: string) => void,
    cursorChange: (cursorPosition: number) => void
    lineNumbers: (linenumbers: Array<number>, version: number) => void,
}

export abstract class WaterproofMapping {
    abstract getMapping: () => Map<number, StringCell>;
    abstract get version(): number;
    abstract findPosition: (index: number) => number;
    abstract findInvPosition: (index: number) => number;
    abstract update: (step: Step) => DocChange | WrappingDocChange;
}

/**
 * Configuration object for the WaterproofEditor.
 * 
 * - `api` contains the callbacks that the editor will use to communicate with the host application.
 * - `documentConstructor` is a function that takes a string and returns a WaterproofDocument (block representation of a ProseMirror document).
 * - `mapping` is a constructor for the WaterproofMapping class, which handles the mapping between the ProseMirror document and the text document in the host application.
 */
export type WaterproofEditorConfig = {
    /** Set of  (static) completions that should be shown to the user. */
    completions: Array<WaterproofCompletion>,
    /** Set of (static) symbol completions that should be shown to the user. */
    symbols: Array<WaterproofSymbol>,
    /** How the editor communicates to the parent process */
    api: WaterproofCallbacks,
    /** Determines how the editor document gets constructed from a string input */
    documentConstructor: (document: string) => WaterproofDocument,
    /** How to construct a mapping for this editor. The mapping is responsible for mapping changes from the underlying ProseMirror instance into changes that can be applied to the underlying document. */
    mapping: new (inputString: string, versionNum: number) => WaterproofMapping,
    /** THIS IS A TEMPORARY FEATURE THAT WILL GET REMOVED */
    documentPreprocessor?: (inputString: string) => {resultingDocument: string, documentChange: DocChange | WrappingDocChange | undefined},
}

export enum HistoryChange {
    Undo,
    Redo
}

export type SimpleProgressInfo = {
    /** Range for which the processing info was reported. */
    range: {
        start: { line: number, character: number },
        end: { line: number, character: number },
    };
    /** Kind of progress that was reported. */
    kind?: CoqFileProgressKind;
}

export type SimpleProgressParams = {
    numberOfLines: number;
    progress: SimpleProgressInfo[];
}

export enum CoqFileProgressKind {
    Processing = 1,
    FatalError
}

export interface OffsetDiagnostic {
    message: string;
    severity: Severity;
    startOffset: number;
    endOffset: number;
}

export type DiagnosticMessage = {
    positionedDiagnostics: OffsetDiagnostic[],
    version: number
}
