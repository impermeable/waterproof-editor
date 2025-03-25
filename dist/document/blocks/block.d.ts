import { Node as ProseNode } from "prosemirror-model";
export declare enum BLOCK_NAME {
    COQ = "coq",
    MATH_DISPLAY = "math_display",
    INPUT_AREA = "input_area",
    HINT = "hint",
    MARKDOWN = "markdown",
    COQ_MARKDOWN = "coqdown",
    COQ_CODE = "coq_code",
    COQ_DOC = "coq_doc"
}
export interface BlockRange {
    from: number;
    to: number;
}
export interface Block {
    type: string;
    stringContent: string;
    range: BlockRange;
    innerBlocks?: Block[];
    toProseMirror(): ProseNode;
    debugPrint(level: number): void;
}
//# sourceMappingURL=block.d.ts.map