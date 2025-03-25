import { DocChange, WrappingDocChange } from "../../api";
/**
 * In prosemirror, every step is a replace step. This enum is used to classify
 * the steps into the given 'pure' operations
 */
export declare enum OperationType {
    insert = "insert",
    delete = "delete",
    replace = "replace"
}
/**
 * The type returned by the functions converting steps to Document Changes of the
 * underlying vscode model of the document
 */
export type ParsedStep = {
    /** The document change that will be forwarded to vscode */
    result: DocChange | WrappingDocChange;
    /** The new map mapping starting positions of HtmlTags in prosemirror */
    newHtmlMapS: Map<number, HtmlTagInfo>;
    /** The new map mapping ending positions of HtmlTags in prosemirror */
    newHtmlMap: Map<number, HtmlTagInfo>;
    /** The new map of stringBlocks */
    newMap: Map<number, StringCell>;
};
/**
 * Represents an area of text, that is editable in the prosemirror view and its
 * mapping to the vscode document
 */
export type StringCell = {
    /** The prosemirror starting index of this cell */
    startProse: number;
    /** The prosemirror ending index of this cell */
    endProse: number;
    /** The starting index of this cell in the text document string vscode side */
    startText: number;
    /** The ending index of this cell in the text document string vscode side */
    endText: number;
};
/**
 * Represents the details of a tags starting or ending position needed
 * to map it correctly from prosemirror to the vscode text document
 */
export type HtmlTagInfo = {
    /** The index within the text document string vscode side */
    offsetText: number;
    /** The prosemirror index */
    offsetProse: number;
    /** The length of text this tag represents in vscode */
    textCost: number;
};
/** This stores the characters that each 'starting' HTML tag represents in the orginal document */
export declare const textStartHTML: Map<string, string>;
/** This stores the characters that each 'ending' HTML tag represents the orginal document */
export declare const textEndHTML: Map<string, string>;
//# sourceMappingURL=types.d.ts.map