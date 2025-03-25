import { Block } from "./block";
import { CoqBlock, CoqCodeBlock, CoqDocBlock, CoqMarkdownBlock, HintBlock, InputAreaBlock, MarkdownBlock, MathDisplayBlock } from "./blocktypes";
export declare const isInputAreaBlock: (block: Block) => block is InputAreaBlock;
export declare const isHintBlock: (block: Block) => block is HintBlock;
export declare const isMathDisplayBlock: (block: Block) => block is MathDisplayBlock;
export declare const isCoqBlock: (block: Block) => block is CoqBlock;
export declare const isMarkdownBlock: (block: Block) => block is MarkdownBlock;
export declare const isCoqMarkdownBlock: (block: Block) => block is CoqMarkdownBlock;
export declare const isCoqDocBlock: (block: Block) => block is CoqDocBlock;
export declare const isCoqCodeBlock: (block: Block) => block is CoqCodeBlock;
//# sourceMappingURL=typeguards.d.ts.map