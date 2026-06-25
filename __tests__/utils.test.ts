import { Block } from "../src/document/blocks";
import { BLOCK_NAME } from "../src/document/blocks/block";
import { text } from "../src/document/blocks/schema";
import {
  extractInterBlockRanges,
  iteratePairs,
  maskInputAndHints,
  sortBlocks,
} from "../src/document/utils";

const toProseMirror = () => text("null");
const debugPrint = () => null;
const innerRange = { from: 0, to: 0 };
const type = BLOCK_NAME.CODE;
const lineStart = 0;

const defaultBlock: Block = {
  stringContent: "",
  toProseMirror,
  debugPrint,
  innerRange,
  range: innerRange,
  type,
  lineStart,
};

test("Sort blocks #1", () => {
  const testBlocks: Array<Block> = [
    { ...defaultBlock, type: BLOCK_NAME.CODE, range: { from: 1, to: 2 } },
    { ...defaultBlock, type: BLOCK_NAME.INPUT_AREA, range: { from: 0, to: 1 } },
  ];

  const sorted = sortBlocks(testBlocks);
  expect(sorted.length).toBe(2);
  expect(sorted[0].type).toBe(BLOCK_NAME.INPUT_AREA);
  expect(sorted[1].type).toBe(BLOCK_NAME.CODE);
});

test("Sort blocks #2", () => {
  const testBlocks: Array<Block> = [
    { ...defaultBlock, type: BLOCK_NAME.CODE, range: { from: 1, to: 2 } },
    { ...defaultBlock, type: BLOCK_NAME.INPUT_AREA, range: { from: 0, to: 1 } },
    { ...defaultBlock, type: BLOCK_NAME.HINT, range: { from: 2, to: 3 } },
  ];

  const sorted = sortBlocks(testBlocks);
  expect(sorted.length).toBe(3);
  expect(sorted[0].type).toBe(BLOCK_NAME.INPUT_AREA);
  expect(sorted[1].type).toBe(BLOCK_NAME.CODE);
  expect(sorted[2].type).toBe(BLOCK_NAME.HINT);
});

// TODO: What is the expected behaviour in this case?
// test("Sort blocks with same range", () => {
//     const stringContent = "";
//     const toProseMirror = () => null;
//     const testBlocks = [
//         {type: "second", range: {from: 0, to: 1}, stringContent, toProseMirror},
//         {type: "first", range: {from: 0, to: 1}, stringContent, toProseMirror}
//     ];

//     const sorted = sortBlocks(testBlocks);
//     expect(sorted.length).toBe(2);
//     expect(sorted[0].type).toBe("second");
//     expect(sorted[1].type).toBe("first");
// });

test("Iterate pairs (normal)", () => {
  const input = [1, 2, 3, 4];
  const expectedResult = [3, 5, 7];
  const result = iteratePairs(input, (a, b) => a + b);
  expect(result).toEqual(expectedResult);
});

test("Iterate pairs (single element array)", () => {
  const input: never[] = [];
  const expectedResult: never[] = [];
  const result = iteratePairs(input, (a, b) => b);
  expect(result).toEqual(expectedResult);
});

test("Iterate pairs (single element array)", () => {
  const input = ["test"];
  const expectedResult: string[] = [];
  const result = iteratePairs(input, (a, b) => b.length);
  expect(result).toEqual(expectedResult);
});

test("Mask input and hints #1", () => {
  const inputDocument =
    "# Example\n<input-area>\n# Test input area\n</input-area>\n";
  const blocks: Array<Block> = [
    {
      ...defaultBlock,
      range: { from: 10, to: 54 },
      stringContent: "# Test input area",
    },
  ];

  const maskedString =
    "# Example\n                                            \n";
  expect(maskInputAndHints(inputDocument, blocks)).toEqual(maskedString);
});

test("Mask input and hints #2", () => {
  const inputDocument = `<hint title="test">\nThis is a test hint\n<\\hint>\n# Example\n<input-area>\n# Test input area\n</input-area>\n`;
  const blocks: Array<Block> = [
    {
      ...defaultBlock,
      range: { from: 0, to: 47 },
      stringContent: "This is a test hint",
    },
    {
      ...defaultBlock,
      range: { from: 58, to: 102 },
      stringContent: "# Test input area",
    },
  ];

  const maskedString =
    "                                               \n# Example\n                                            \n";
  expect(maskInputAndHints(inputDocument, blocks)).toEqual(maskedString);
});

test("Extract inter-block ranges", () => {
  const document =
    "Hello, this is a test document, I am testing this document. Test test test test.";

  const blocks: Array<Block> = [
    { ...defaultBlock, range: { from: 0, to: 10 } },
    { ...defaultBlock, range: { from: 15, to: 20 } },
    { ...defaultBlock, range: { from: 25, to: 30 } },
  ];

  const interBlockRanges = extractInterBlockRanges(blocks, document);

  expect(interBlockRanges.length).toBe(3);
  expect(interBlockRanges[0]).toEqual({ from: 10, to: 15 });
  expect(interBlockRanges[1]).toEqual({ from: 20, to: 25 });
  expect(interBlockRanges[2]).toEqual({ from: 30, to: document.length });
});

test("Extract inter-block ranges with touching blocks", () => {
  const document = "012345678901234567890123456789";

  const blocks: Block[] = [
    { ...defaultBlock, range: { from: 0, to: 10 } },
    { ...defaultBlock, range: { from: 10, to: 20 } },
    { ...defaultBlock, range: { from: 20, to: 30 } },
  ];

  const interBlockRanges = extractInterBlockRanges(blocks, document);
  expect(interBlockRanges.length).toBe(0);
});

test("Extract inter-block ranges with no blocks", () => {
  const document =
    "Hello, this is a test document, I am testing this document. Test test test test.";

  const blocks: Block[] = [];

  const interBlockRanges = extractInterBlockRanges(blocks, document);

  expect(interBlockRanges.length).toBe(1);
  expect(interBlockRanges[0]).toEqual({ from: 0, to: document.length });
});
