import { Step } from "prosemirror-transform";
import { StringCell } from "./types";
import { WaterproofMapping, DocChange, WrappingDocChange } from "../../api";
/**
 * A type to specify an HTML tag in the prosemirror content elem.
 */
interface TagInformation {
    /** The starting index of the tag in the input string */
    start: number;
    /** The ending index of the tag in the input string */
    end: number;
    /** The number of 'hidden' newlines the starting tag encodes in the original vscode document */
    preNumber: number;
    /** The number of 'hidden' newlines the ending tag encodes in the original vscode document */
    postNumber: number;
    /** The actual tag */
    content: string;
}
/**
 * We will preface this class with saying that this is most probably not 'the' smart approach. In fact,
 * it could possibly be simpler to do all this with the EditorState document node (textContent attribute).
 * However, we had thought this approach would be somewhat viable and nice for large documents, as you are not
 * sending the entire doc back and forth, but it comes at the cost of complexity.
 *
 * This class is responsible for keeping track of the mapping between the prosemirror state and the vscode Text
 * Document model
 */
export declare class TextDocMappingV implements WaterproofMapping {
    /** This stores the String cells of the entire document */
    private stringBlocks;
    /** This stores the inverted mapping of stringBlocks  */
    private invStringBlocks;
    /** This maps the AFTER prosemirror positions of all the HTML tags to positions in the textdocument */
    private endHtmlMap;
    /** This maps the BEFORE prosemirror positions of all the HTML tags to positions in the textdocument */
    private startHtmlMap;
    /** The version of the underlying textDocument */
    private _version;
    /** The different possible HTMLtags in kroqed-schema */
    private static HTMLtags;
    /**
     * Constructs a prosemirror view vsode mapping for the inputted prosemirror html elem
     *
     * @param inputString a string contatining the prosemirror content html elem
     */
    constructor(inputString: string, versionNum: number);
    /**
     * Returns the mapping to preserve integrity
     */
    getMapping(): Map<number, StringCell>;
    /**
     * Get the version of the underlying text document
     */
    get version(): number;
    /** Returns the vscode document model index of prosemirror index */
    findPosition(index: number): number;
    /** Returns the prosemirror index of vscode document model index */
    findInvPosition(index: number): number;
    /**
     * Initializes the mapping according to the inputed html content elem
     *
     * @param inputString the string of the html elem
     */
    private initialize;
    /** Checks whether the step takes place exclusively within a string cell */
    private inStringCell;
    /** Called whenever a step is made in the editor */
    update(step: Step): DocChange | WrappingDocChange;
    /** Constructs a map from stringBlocks that is indexed based on the vscode index instead of prose */
    private updateInvMapping;
    /**
     * This checks if the doc change actually changed the document, since vscode
     * does not register empty changes
     */
    private checkDocChange;
    /**
     * Function that returns the next valid html tag in a string.
     * Throws an error if no valid html tag is found.
     * @param The string that contains html tags
     * @returns The first valid html tag in the string and the position of this tag in the string
     */
    static getNextHTMLtag(input: string): TagInformation;
}
export {};
//# sourceMappingURL=vscodeMapping.d.ts.map