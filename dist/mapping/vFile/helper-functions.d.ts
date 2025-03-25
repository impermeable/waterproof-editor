import { Fragment } from "prosemirror-model";
import { OperationType } from "./types";
import { ReplaceStep } from "prosemirror-transform";
/** A helper function to get the in text representation (in vscode doc) of a ending tag */
export declare function getEndHtmlTagText(tagId: string | undefined): string;
/** A helper function to get the in text representation (in vscode doc) of a starting tag */
export declare function getStartHtmlTagText(tagId: string | undefined): string;
/** Used to parse a prosemirror fragment into a form that can be used to update the mapping */
export declare function parseFragment(frag: Fragment | undefined): {
    proseOffset: number;
    starttext: string;
    endtext: string;
    tags: Array<string>;
    stringCell: boolean;
};
/** This gets the offset in the vscode document that is being added (then >0) or removed (then <0) */
export declare function getTextOffset(type: OperationType, step: ReplaceStep): number;
//# sourceMappingURL=helper-functions.d.ts.map