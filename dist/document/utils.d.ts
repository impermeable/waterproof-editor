import { Block, BlockRange } from "./blocks";
/**
 * Convert a list of blocks to a prosemirror compatible node list.
 * @param blocks Input array of blocks.
 * @returns ProseMirror nodes.
 */
export declare function blocksToProseMirrorNodes(blocks: Block[]): import("prosemirror-model").Node[];
/**
 * Helper function to sort block type objects. Will sort based on the range object of the block.
 * Sorts in ascending (`range.from`) order.
 * @param blocks Blocks to sort.
 * @returns Sorted array of blocks.
 */
export declare function sortBlocks(blocks: Block[]): Block[];
/**
 * Map `f` over every consecutive pair from the `input` array.
 * @param input Input array.
 * @param f Function to map over the pairs.
 * @returns The result of mapping `f` over every consecutive pair. Will return an empty array if the input array has length < 2.
 */
export declare function iteratePairs<ArrayType, FunctionReturnType>(input: Array<ArrayType>, f: (a: ArrayType, b: ArrayType) => FunctionReturnType): FunctionReturnType[];
/**
 * Utility function to extract the ranges between blocks (ie. the ranges that are not covered by the blocks).
 * @param blocks The input array of block.
 * @param inputDocument The document the blocks are part of.
 * @returns The ranges between the blocks.
 */
export declare function extractInterBlockRanges(blocks: Array<Block>, inputDocument: string): BlockRange[];
/**
 * Utility function to mask regions of a document covered by blocks.
 * @param inputDocument The input document on which to apply the masking.
 * @param blocks The blocks that will mask content from the input document.
 * @param mask The mask to use (defaults to `" "`).
 * @returns The document (`string`) with the ranges covered by the blocks in `blocks` masked using `mask`.
 */
export declare function maskInputAndHints(inputDocument: string, blocks: Block[], mask?: string): string;
/**
 * Create blocks based on ranges.
 *
 * Extracts the text content of the ranges and creates blocks from them.
 */
export declare function extractBlocksUsingRanges<BlockType extends Block>(inputDocument: string, ranges: {
    from: number;
    to: number;
}[], BlockConstructor: new (content: string, range: {
    from: number;
    to: number;
}) => BlockType): BlockType[];
//# sourceMappingURL=utils.d.ts.map