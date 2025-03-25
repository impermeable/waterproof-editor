import { ReplaceStep } from "prosemirror-transform";
import { HtmlTagInfo, ParsedStep, StringCell } from "./types";
export declare class TextUpdate {
    /** This function is responsible for handling updates in prosemirror that happen exclusively as text edits and translating them to vscode text doc */
    static textUpdate(step: ReplaceStep, stringBlocks: Map<number, StringCell>, endHtmlMap: Map<number, HtmlTagInfo>, startHtmlMap: Map<number, HtmlTagInfo>): ParsedStep;
}
//# sourceMappingURL=textUpdate.d.ts.map