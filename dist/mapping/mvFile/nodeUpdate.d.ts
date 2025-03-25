import { ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";
import { HtmlTagInfo, ParsedStep, StringCell } from "./types";
export declare class NodeUpdate {
    /** Used to parse a step that causes nodes to be updated instead of just text */
    static nodeUpdate(step: ReplaceStep | ReplaceAroundStep, stringBlocks: Map<number, StringCell>, endHtmlMap: Map<number, HtmlTagInfo>, startHtmlMap: Map<number, HtmlTagInfo>): ParsedStep;
    private static replaceStepDelete;
    /** Converts a replace step that is a pure node update to a DocChange */
    private static replaceStepInsert;
    /** Setups the wrapping doc change for the suceeding functions */
    private static setupWrapper;
    private static replaceAroundStepDelete;
    private static replaceAroundStepInsert;
}
//# sourceMappingURL=nodeUpdate.d.ts.map