import { BLOCK_NAME, Block, BlockRange } from "./block";
export declare class InputAreaBlock implements Block {
    stringContent: string;
    range: BlockRange;
    type: BLOCK_NAME;
    innerBlocks: Block[];
    constructor(stringContent: string, range: BlockRange, innerBlockConstructor: (content: string) => Block[]);
    toProseMirror(): import("prosemirror-model").Node;
    debugPrint(level: number): void;
}
export declare class HintBlock implements Block {
    stringContent: string;
    title: string;
    range: BlockRange;
    type: BLOCK_NAME;
    innerBlocks: Block[];
    constructor(stringContent: string, title: string, range: BlockRange, innerBlockConstructor: (content: string) => Block[]);
    toProseMirror(): import("prosemirror-model").Node;
    debugPrint(level: number): void;
}
export declare class MathDisplayBlock implements Block {
    stringContent: string;
    range: BlockRange;
    type: BLOCK_NAME;
    constructor(stringContent: string, range: BlockRange);
    toProseMirror(): import("prosemirror-model").Node;
    debugPrint(level: number): void;
}
export declare class CoqBlock implements Block {
    stringContent: string;
    prePreWhite: string;
    prePostWhite: string;
    postPreWhite: string;
    postPostWhite: string;
    range: BlockRange;
    type: BLOCK_NAME;
    innerBlocks: Block[];
    constructor(stringContent: string, prePreWhite: string, prePostWhite: string, postPreWhite: string, postPostWhite: string, range: BlockRange, innerBlockConstructor: (content: string) => Block[]);
    toProseMirror(): import("prosemirror-model").Node;
    debugPrint(level: number): void;
}
export declare class MarkdownBlock implements Block {
    stringContent: string;
    range: BlockRange;
    type: BLOCK_NAME;
    isNewLineOnly: boolean;
    constructor(stringContent: string, range: BlockRange);
    toProseMirror(): import("prosemirror-model").Node;
    debugPrint(level: number): void;
}
export declare class CoqDocBlock implements Block {
    stringContent: string;
    preWhite: string;
    postWhite: string;
    range: BlockRange;
    type: BLOCK_NAME;
    innerBlocks: Block[];
    constructor(stringContent: string, preWhite: string, postWhite: string, range: BlockRange, innerBlockConstructor: (content: string) => Block[]);
    toProseMirror(): import("prosemirror-model").Node;
    debugPrint(level?: number): void;
}
export declare class CoqMarkdownBlock implements Block {
    stringContent: string;
    range: BlockRange;
    type: BLOCK_NAME;
    constructor(stringContent: string, range: BlockRange);
    toProseMirror(): import("prosemirror-model").Node;
    debugPrint(level: number): void;
}
export declare class CoqCodeBlock implements Block {
    stringContent: string;
    range: BlockRange;
    type: BLOCK_NAME;
    constructor(stringContent: string, range: BlockRange);
    toProseMirror(): import("prosemirror-model").Node;
    debugPrint(level: number): void;
}
//# sourceMappingURL=blocktypes.d.ts.map