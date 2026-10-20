import { pmIndex, textOffset } from "../../src/mapping";
import { configuration, parse } from "../../src/markdown-defaults";
import { DefaultTagSerializer } from "../../src/serialization/DocumentSerializer";
import { constructDocAndMapping } from "../../src/constructFromDocString";
import { BoundaryResolutionStrategy } from "../../src/mapping/types";

const config = configuration("lang");
const serializer = new DefaultTagSerializer(config);

test("textOffsetToPmIndex", () => {
  const doc =
    "# Test\n```lan\nTest.\n```\n<input-area>\n```lan\nTestingtest.\n```\n</input-area>";

  const blocks = parse(doc, { language: "lan" });
  const [_, mapping] = constructDocAndMapping(blocks, 1, config, serializer);

  expect(mapping.textOffsetToPmIndex(textOffset(0))).toBe(1);
  expect(mapping.textOffsetToPmIndex(textOffset(3))).toBe(4);
  expect(mapping.textOffsetToPmIndex(textOffset(6))).toBe(7);

  // TODO: Should this work? Note that the newline is **not** part of the markdown, instead it is its own node.
  // expect(mapping.textOffsetToPmIndex(textOffset(7))).toBe(8);

  expect(mapping.textOffsetToPmIndex(textOffset(14))).toBe(10);
});

test("pmIndexToTextOffset", () => {
  const doc =
    "# Test\n```lan\nTest.\n```\n<input-area>\n```lan\nTestingtest.\n```\n</input-area>";

  const blocks = parse(doc, { language: "lan" });
  const [_, mapping] = constructDocAndMapping(blocks, 1, config, serializer);

  expect(mapping.pmIndexToTextOffset(pmIndex(1))).toBe(0);
  expect(mapping.pmIndexToTextOffset(pmIndex(2))).toBe(1);
  expect(mapping.pmIndexToTextOffset(pmIndex(7))).toBe(6);

  // expect(mapping.pmIndexToTextOffset(pmIndex(8))).toBe(7);

  expect(mapping.pmIndexToTextOffset(pmIndex(10))).toBe(14);
});

// describe("testing one way inverse", () => {
//   const doc =
//     "# Test\n```lan\nTest.\n```\n<input-area>\n```lan\nTestingtest.\n```\n</input-area>";

//   const blocks = parse(doc, { language: "lan" });
//   const [_, mapping] = constructDocAndMapping(blocks, 1, config, serializer);

//   const tree = mapping.getMapping();
//   {
//     const node = tree.findNodeByProsePos(8);

//     console.log(node);

//     expect(node).toBeDefined();
//     expect(node?.type).toBe("markdown");
//     expect(node?.prosemirrorStart).toBe(1);
//     expect(node?.contentRange.from).toBe(0);
//   }
//   {
//     const node = tree.findNodeByTextOffset(7);

//     expect(node).toBeDefined();
//     expect(node?.type).toBe("newline");
//     expect(node?.prosemirrorStart).toBe(9);
//     expect(node?.contentRange.from).toBe(6);
//   }
//   expect(mapping.pmIndexToTextOffset(pmIndex(8))).toBe(6); // LHS boundary resolution
//   expect(mapping.textOffsetToPmIndex(textOffset(6))).toBe(0);

//   // expect(mapping.textOffsetToPmIndex(textOffset))

//   // for (let i = 1; i <= 34; i++) {
//   //   test(`at pm index ${i}`, () => {
//   //     expect(
//   //       mapping.textOffsetToPmIndex(mapping.pmIndexToTextOffset(pmIndex(i))),
//   //     ).toBe(i);
//   //   });
//   // }
// });

describe("text offsets not within tag map into text nodes", () => {
  const doc =
    "# Test\n```lan\nTest.\n```\n<input-area>\n```lan\nTestingtest.\n```\n</input-area>";

  const blocks = parse(doc, { language: "lan" });
  const [proseDoc, mapping] = constructDocAndMapping(
    blocks,
    1,
    config,
    serializer,
  );

  const textOffsets = [
    0, 1, 2, 3, 4, 5, 6, 14, 15, 16, 17, 18, 19, 44, 45, 46, 47, 48, 49, 50, 51,
    52, 53, 54, 55, 56,
  ];
  const afterShouldFail = [6, 19, 56];

  it.each(textOffsets)("maps text offset %i into a text node", (offset) => {
    const pos = mapping.textOffsetToPmIndex(textOffset(offset));
    const $pos = proseDoc.resolve(pos);

    const nodeAfter = $pos.nodeAfter;
    if (nodeAfter === null) {
      expect(afterShouldFail).toContain(offset);
      expect($pos.nodeBefore).not.toBeNull();
      expect($pos.nodeBefore!.type.name).toBe("text");
    } else {
      expect(nodeAfter.type.name).toBe("text");
    }
  });

  it.each(textOffsets)("has an inverse at text offset %i", (offset) => {
    const pos = mapping.textOffsetToPmIndex(textOffset(offset));

    expect(mapping.pmIndexToTextOffset(pmIndex(pos))).toBe(offset);
  });
});

test("findNodeByTextOffset", () => {
  const doc =
    "# Test\n```lan\nTest.\n```\n<input-area>\n```lan\nTestingtest.\n```\n</input-area>";

  const blocks = parse(doc, { language: "lan" });
  const [_, mapping] = constructDocAndMapping(blocks, 1, config, serializer);

  const tree = mapping.getMapping();

  {
    const node = tree.findNodeByTextOffset(1);
    expect(node).toBeDefined();
    expect(node!.type).toBe("markdown");
    expect(node!.children).toHaveLength(0);
    expect(node!.contentRange).toStrictEqual({ from: 0, to: 6 });
    expect(node!.tagRange).toStrictEqual({ from: 0, to: 6 });
    expect(node!.pmRange).toStrictEqual({ from: 0, to: 8 });
    expect(node!.suffixSize).toBe(1);
    expect(node!.title).toBe(null);
  }
});

test("findNodeByProsePos", () => {
  const doc =
    "# Test\n```lan\nTest.\n```\n<input-area>\n```lan\nTestingtest.\n```\n</input-area>";

  const blocks = parse(doc, { language: "lan" });
  const [_, mapping] = constructDocAndMapping(blocks, 1, config, serializer);

  const tree = mapping.getMapping();

  {
    const node = tree.findNodeByProsePos(1);
    expect(node).toBeDefined();
    expect(node!.type).toBe("markdown");
    expect(node!.children).toHaveLength(0);
    expect(node!.contentRange).toStrictEqual({ from: 0, to: 6 });
    expect(node!.tagRange).toStrictEqual({ from: 0, to: 6 });
    expect(node!.pmRange).toStrictEqual({ from: 0, to: 8 });
    expect(node!.suffixSize).toBe(1);
    expect(node!.title).toBe(null);
  }
  {
    const node = tree.findNodeByProsePos(8);
    expect(node).toBeDefined();
    expect(node!.type).toBe("markdown");
    expect(node!.children).toHaveLength(0);
    expect(node!.contentRange).toStrictEqual({ from: 0, to: 6 });
    expect(node!.tagRange).toStrictEqual({ from: 0, to: 6 });
    expect(node!.pmRange).toStrictEqual({ from: 0, to: 8 });
    expect(node!.suffixSize).toBe(1);
    expect(node!.title).toBe(null);
  }
  // Note here that the document looks as follows
  //   (0 markdown (1 Text (# Test) 7) 8) (8 newline 9)
  // So pm position 8 can refer to the left side of the markdown *or* the
  // right side of the newline.
  {
    const node = tree.findNodeByProsePos(8, BoundaryResolutionStrategy.Right);
    expect(node).toBeDefined();
    expect(node!.type).toBe("newline");
    expect(node!.children).toHaveLength(0);
    expect(node!.contentRange).toStrictEqual({ from: 6, to: 7 });
    expect(node!.tagRange).toStrictEqual({ from: 6, to: 7 });
    expect(node!.pmRange).toStrictEqual({ from: 8, to: 9 });
    expect(node!.suffixSize).toBe(0);
    expect(node!.title).toBe(null);
  }
});
