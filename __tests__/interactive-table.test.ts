import { parse, configuration } from "../src/markdown-defaults";
import {
  isCodeBlock,
  isInteractiveCellBlock,
  isInteractiveTableBlock,
} from "../src/document/blocks";
import {
  CodeBlock,
  InteractiveCellBlock,
  InteractiveTableBlock,
  constructDocument,
} from "../src/document";
import { DefaultTagSerializer } from "../src/serialization/DocumentSerializer";
import { Mapping, DocChange } from "../src/api";
import { WaterproofSchema } from "../src/schema";
import { EditorState } from "prosemirror-state";

const config = configuration("coq");
const serializer = new DefaultTagSerializer(config);

// The on-disk representation of an interactive table: a `<interactive-table>`
// containing `<interactive-cell>`s, each wrapping exactly one fenced code block.
// The code fence sits on its own lines (newline after the open tag, before the close tag).
const exampleDocument =
  '<interactive-table name="example">' +
  '<interactive-cell text="true">\n```coq\n' +
  "Definition example := true.\n" +
  "```\n</interactive-cell>" +
  '<interactive-cell text="false">\n```coq\n' +
  "Definition example := false.\n" +
  "```\n</interactive-cell>" +
  "</interactive-table>";

test("parses an interactive table into a table > cell > code tree", () => {
  const blocks = parse(exampleDocument, { language: "coq" });

  expect(blocks.length).toBe(1);
  const table = blocks[0];
  expect(isInteractiveTableBlock(table)).toBe(true);
  expect((table as InteractiveTableBlock).name).toBe("example");

  const cells = (table as InteractiveTableBlock).innerBlocks;
  expect(cells.length).toBe(2);
  expect(cells.every(isInteractiveCellBlock)).toBe(true);

  const [trueCell, falseCell] = cells as InteractiveCellBlock[];
  expect(trueCell.cellText).toBe("true");
  expect(falseCell.cellText).toBe("false");

  // Each cell wraps exactly one code block (satisfies schema `content: "code"`).
  expect(trueCell.innerBlocks.length).toBe(1);
  expect(isCodeBlock(trueCell.innerBlocks[0])).toBe(true);
  expect((trueCell.innerBlocks[0] as CodeBlock).stringContent).toBe(
    "Definition example := true.",
  );
  expect((falseCell.innerBlocks[0] as CodeBlock).stringContent).toBe(
    "Definition example := false.",
  );
});

test("interactive table round-trips through ProseMirror and serialization", () => {
  const blocks = parse(exampleDocument, { language: "coq" });
  const roundTripped = serializer.serializeDocument(constructDocument(blocks));
  expect(roundTripped).toBe(exampleDocument);
});

test("hidden attribute parses and round-trips", () => {
  const doc =
    '<interactive-table name="example">' +
    '<interactive-cell text="shown">\n```coq\n' +
    "Definition a := true.\n" +
    "```\n</interactive-cell>" +
    '<interactive-cell text="secret" hidden="true">\n```coq\n' +
    "Definition b := false.\n" +
    "```\n</interactive-cell>" +
    "</interactive-table>";

  const blocks = parse(doc, { language: "coq" });
  const [shownCell, hiddenCell] = (blocks[0] as InteractiveTableBlock)
    .innerBlocks as InteractiveCellBlock[];

  expect(shownCell.hidden).toBe(false);
  expect(hiddenCell.hidden).toBe(true);

  // The ProseMirror node carries the attribute, and it survives serialization.
  const pmDoc = constructDocument(blocks);
  let hiddenFlags: boolean[] = [];
  pmDoc.descendants((n) => {
    if (n.type.name === "interactive_cell") hiddenFlags.push(n.attrs.hidden);
    return true;
  });
  expect(hiddenFlags).toEqual([false, true]);

  expect(serializer.serializeDocument(pmDoc)).toBe(doc);
});

/**
 * Simulate the toggle button (see `interactive-view/interactive-plugin.ts`)
 * replacing the whole code content of the `cellIndex`-th interactive cell, and
 * return the text `DocChange` the mapping produces for that edit.
 */
function toggleCellChange(
  source: string,
  cellIndex: number,
  replace: (text: string) => string,
): DocChange {
  const blocks = parse(source, { language: "coq" });
  const mapping = new Mapping(blocks, 1, config, serializer);
  const pmDoc = constructDocument(blocks);
  const state = EditorState.create({ schema: WaterproofSchema, doc: pmDoc });

  const cellPositions: number[] = [];
  pmDoc.descendants((n, pos) => {
    if (n.type.name === "interactive_cell") cellPositions.push(pos);
    return true;
  });

  const cellPos = cellPositions[cellIndex];
  const codeNode = pmDoc.nodeAt(cellPos)!.child(0);
  const contentFrom = cellPos + 2; // + interactive_cell tag + code tag
  const contentTo = contentFrom + codeNode.content.size;

  const tr = state.tr.replaceWith(
    contentFrom,
    contentTo,
    WaterproofSchema.text(replace(codeNode.textContent)),
  );
  return mapping.update(tr.steps[0], state.doc) as DocChange;
}

test("toggling either cell maps to the correct on-disk range", () => {
  // First cell.
  const c0 = toggleCellChange(exampleDocument, 0, (t) =>
    t.replaceAll("true", "false"),
  );
  const start0 = exampleDocument.indexOf("Definition example := true.");
  expect(c0.startInFile).toBe(start0);
  expect(c0.endInFile).toBe(start0 + "Definition example := true.".length);
  expect(c0.finalText).toBe("Definition example := false.");

  // Second cell — exercises cumulative offsets past the first cell and its tags.
  const c1 = toggleCellChange(exampleDocument, 1, (t) =>
    t.replaceAll("false", "true"),
  );
  const start1 = exampleDocument.indexOf("Definition example := false.");
  expect(c1.startInFile).toBe(start1);
  expect(c1.endInFile).toBe(start1 + "Definition example := false.".length);
  expect(c1.finalText).toBe("Definition example := true.");

  // Applying the second change to the file yields exactly the toggled document.
  const updated =
    exampleDocument.slice(0, c1.startInFile) +
    c1.finalText +
    exampleDocument.slice(c1.endInFile);
  expect(updated).toBe(
    exampleDocument.replace(
      "Definition example := false.",
      "Definition example := true.",
    ),
  );
});

test("interactive cell ranges are absolute offsets into the document", () => {
  const blocks = parse(exampleDocument, { language: "coq" });
  const table = blocks[0] as InteractiveTableBlock;

  // The table range should span the whole document.
  expect(table.range.from).toBe(0);
  expect(table.range.to).toBe(exampleDocument.length);

  // Each cell's range should point at its own tags in the original string.
  const [trueCell] = table.innerBlocks as InteractiveCellBlock[];
  expect(exampleDocument.slice(trueCell.range.from, trueCell.range.to)).toBe(
    '<interactive-cell text="true">\n```coq\n' +
      "Definition example := true.\n" +
      "```\n</interactive-cell>",
  );

  const code = trueCell.innerBlocks[0] as CodeBlock;
  expect(exampleDocument.slice(code.innerRange.from, code.innerRange.to)).toBe(
    "Definition example := true.",
  );
});
