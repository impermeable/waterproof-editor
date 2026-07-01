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

const config = configuration("coq");
const serializer = new DefaultTagSerializer(config);

// The on-disk representation of an interactive table: a `<interactive-table>`
// containing `<interactive-cell>`s, each wrapping exactly one fenced code block.
const exampleDocument =
  '<interactive-table name="example">' +
  '<interactive-cell text="true">```coq\n' +
  "Definition example := true.\n" +
  "```</interactive-cell>" +
  '<interactive-cell text="false">```coq\n' +
  "Definition example := false.\n" +
  "```</interactive-cell>" +
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

test("interactive cell ranges are absolute offsets into the document", () => {
  const blocks = parse(exampleDocument, { language: "coq" });
  const table = blocks[0] as InteractiveTableBlock;

  // The table range should span the whole document.
  expect(table.range.from).toBe(0);
  expect(table.range.to).toBe(exampleDocument.length);

  // Each cell's range should point at its own tags in the original string.
  const [trueCell] = table.innerBlocks as InteractiveCellBlock[];
  expect(exampleDocument.slice(trueCell.range.from, trueCell.range.to)).toBe(
    '<interactive-cell text="true">```coq\n' +
      "Definition example := true.\n" +
      "```</interactive-cell>",
  );

  const code = trueCell.innerBlocks[0] as CodeBlock;
  expect(exampleDocument.slice(code.innerRange.from, code.innerRange.to)).toBe(
    "Definition example := true.",
  );
});
