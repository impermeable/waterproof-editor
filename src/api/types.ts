import { HighlightStyle, LanguageSupport } from "@codemirror/language";
import { Block } from "../document";
import { DocumentSerializer } from "../serialization/DocumentSerializer";
import { WaterproofCompletion, WaterproofSymbol } from "./Completions";
import { DocChange, WrappingDocChange } from "./DocChange";
import { Severity } from "./Severity";

export type Positioned<A> = {
    obj: A;
    pos: number | undefined;
};

export type Range = {from: number, to: number};

/**
 * A `WaterproofDocument` is a collection of `Block`s. Every Block in this WaterproofDocument will get translated into some ProseMirror node. 
 * 
 * Supported blocks are `HintBlock`, `InputAreaBlock`, `MarkdownBlock`, `CoqBlock` and `MathDisplayBlock`.
 *
 * Also see [documentation/UsingWaterproofEditor.md](../../documentation/UsingWaterproofEditor.md)
 */
export type WaterproofDocument = Block[];

export type WaterproofCallbacks = {
    /** Used by the editor to execute a command in the document. */
    executeCommand: (command: string, time: number) => void,
    /** Executed by the editor when the user asks for help via the keybinding or the context menu entry. */
    executeHelp: () => void,
    /** Used by the editor to communicate that it is ready. */
    editorReady: () => void,
    /** The editor will call this function on every change that is made to the underlying document. 
     * 
     * The change can either be a regular document change or a wrapping document change.
     */
    documentChange: (change: DocChange | WrappingDocChange) => void,
    /** Only ever used by the editor once an unrecoverable error has occured when mapping changes */
    applyStepError: (errorMessage: string) => void,
    /** Used by the editor to communicate the current cursor position, `cursorPosition` is an offset based position into the document.  */
    cursorChange: (cursorPosition: number) => void,
    /** Fired by the editor when the viewport (the user visible part of the editor changes) */
    viewportHint: (start: number, end: number) => void,
}

/**
 * Type describing the open and close tag for a cell.
 */
export type OpenCloseTag = { 
    openTag: string, 
    closeTag: string 
}

export const enum TextContentOfSpecifier {
    CODE = 1, // = 001
    MARKDOWN = 2, // = 010
    MATH_DISPLAY = 4 // = 100
}

/**
 * Type describing whether the open tag requires a newline before and whether the closing tag requires a newline after.
 * 
 * Together with the string representation this will ensure that the tags marked with `true` will appear on their own line. 
 * 
 * Example: The ` ```language ` and ` ``` ` tags in a Markdown file should be placed on their own line (i.e. the first backtick should be placed as the first character on a line. )
 * We ensure this by setting the open and close tag (see {@linkcode OpenCloseTag}) to ` ```language\n ` and ` \n``` ` respectively and setting both `openRequiresNewline` and `closeRequiersNewline` to true.
 * 
 * When inserting new nodes into the document WaterproofEditor will ensure that the nodes marked with `openRequiresNewline = true` always have a newline before
 * and nodes marked with `closeRequiresNewline = true` always have a newline after.
 */
export type RequiresNewline = { openRequiresNewline: boolean, closeRequiresNewline: boolean };

/**
 * The `TagConfiguration` describes how the different parts of a document on disk are described/delimited. WaterproofEditor will use
 * these tags when generating edits and serializing the document.
 * 
 * _Note_: The tags described here should be the same as generating when 
 * 
 * For example in a Markdown file, code should be placed in between ` ```language ` and ` ``` `, where `language` denotes the language of the code.
 * 
 * Every type of cell representable in `WaterproofEditor` should receive some form of tag. If the content of some cell has no open or close tag use `""`.
 */
export type TagConfiguration = {
    markdown: OpenCloseTag & RequiresNewline,
    code: OpenCloseTag & RequiresNewline,
    hint:  { openTag: ((title: string) => string), closeTag: string } & RequiresNewline,
    input: OpenCloseTag & RequiresNewline,
    math: OpenCloseTag & RequiresNewline,
}

export class NodeUpdateError extends Error {
    constructor(message: string) { super("[NodeUpdateError]" + message); }
}

export class TextUpdateError extends Error {
    constructor(message: string) { super("[TextUpdateError]" + message); }
}

export class MappingError extends Error {
    constructor(message: string) { super("[MappingError] " + message); }
}

/**
 * Represents information about the progress of file processing.
 */
export type SimpleProgressInfo = {
    /** Range for which the processing info was reported. */
    range: {
        start: { line: number, character: number };
        end: { line: number, character: number };
    };
    /** Kind of progress that was reported. */
    kind?: FileProgressKind;
};

/**
 * Parameters for progress update messages.
 */
export type SimpleProgressParams = {
    numberOfLines: number;
    progress: SimpleProgressInfo[];
};

export enum FileProgressKind {
    Processing = 1,
    FatalError = 2,
}

export type MenuBarEntry = {
    /** The text to show in the menubar */
    title: string;
    /** The text to show on hover over the menubar entry */
    hoverText: string;
    /** The function to execute when the button is clicked */
    callback: () => void;
    /** Control the visibility of the entry */
    buttonVisibility?: {
        /** When set to true the entry will only be visible in teacher mode */
        teacherModeOnly?: boolean;
        /** When set to true the button will be displayed regardless of whether the menubar entries are hidden via the setting */
        showByDefault?: boolean;
    }
}

export type LanguageConfiguration = {
    languageSupport: LanguageSupport;
    highlightLight: HighlightStyle;
    highlightDark: HighlightStyle;
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
    /** Determines how the editor document gets constructed from a string input. */
    documentConstructor: (document: string) => WaterproofDocument,
    
    /**
     * The tag configuration to use for this editor.
     * 
     * See {@linkcode TagConfiguration} for more information.
     */
    tagConfiguration: TagConfiguration,

    /**
     * The serializer object is used to translate the ProseMirror nodes into 
     * text. When none is given we will create a default one from the given {@linkcode TagConfiguration}.
     * The serializer should extend the {@linkcode DocumentSerializer} class.
     */
    serializer?: DocumentSerializer,

    /** The name of the markdown node view, defaults to `"Markdown"`. 
     * This name will show up in the editor when editing text in 'Markdown' cells.
    */
    markdownName?: string,

    /**
     * A function that can be used to convert a different markup variant into Markdown. 
     * 
     * This function is also responsible for converting math-inline content (e.g. in Markdown this is the content between `$` and `$`) to math-inline
     * nodes. That is, the content should be placed inside `<math-inline>` and `</math-inline>`.
     * @param inputString The input string that should be converted to Markdown
     * @returns The output string should be valid Markdown, with possible inline LaTeX wrapped in the tags as described above.
     */
    toMarkdown?: (inputString: string) => string,
    /**
     * Disables MarkdownIt features. Will likely be removed in the future once there is a nice way to support non markdown markup languages.
     */
    disableMarkdownFeatures?: Array<string>,

    /**
     * Specify custom entries that should be added to the menubar
     */
    menubarEntries?: Array<MenuBarEntry>;

    languageConfig?: LanguageConfiguration;
}

export enum HistoryChange {
    Undo,
    Redo
}

export interface OffsetDiagnostic {
    message: string;
    severity: Severity;
    startOffset: number;
    endOffset: number;
}

export enum ThemeStyle {
    Light, Dark
}
