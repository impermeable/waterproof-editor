/**
 * Convert a Waterproof file into a createMapping(…) snippet
 * ready to paste into a nodeupdate test.
 *
 * HOW TO RUN
 * ----------
 *   npx tsx scripts/file-to-mapping.ts <file>
 *
 * Example:
 *   npx tsx scripts/file-to-mapping.ts WaterproofDocument.lean
 *
 * The file path is resolved relative to the current working directory.
 * The snippet is printed to stdout.
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "../src/markdown-defaults/index.js";
import { Block, BLOCK_NAME } from "../src/document/blocks/block.js";
import { HintBlock, ContainerBlock } from "../src/document/index.js";

// ── code generation ──────────────────────────────────────────────────────────

function q(s: string): string {
  return JSON.stringify(s);
}

function r(range: { from: number; to: number }): string {
  return `{from: ${range.from}, to: ${range.to}}`;
}

function blockToCode(b: Block, indent: string): string {
  const inner = indent + "    ";

  switch (b.type) {
    case BLOCK_NAME.NEWLINE:
      return `${indent}new NewlineBlock(${r(b.range)}, ${r(b.innerRange)}, ${b.lineStart})`;

    case BLOCK_NAME.MARKDOWN:
      return `${indent}new MarkdownBlock(${q(b.stringContent)}, ${r(b.range)}, ${r(b.innerRange)}, ${b.lineStart})`;

    case BLOCK_NAME.CODE:
      return `${indent}new CodeBlock(${q(b.stringContent)}, ${r(b.range)}, ${r(b.innerRange)}, ${b.lineStart})`;

    case BLOCK_NAME.MATH_DISPLAY:
      return `${indent}new MathDisplayBlock(${q(b.stringContent)}, ${r(b.range)}, ${r(b.innerRange)}, ${b.lineStart})`;

    case BLOCK_NAME.INPUT_AREA: {
      const children = (b.innerBlocks ?? [])
        .map((c) => blockToCode(c, inner))
        .join(",\n");
      return (
        `${indent}new InputAreaBlock(${q(b.stringContent)}, ${r(b.range)}, ${r(b.innerRange)}, ${b.lineStart}, [\n` +
        children +
        `\n${indent}])`
      );
    }

    case BLOCK_NAME.HINT: {
      const title = q((b as HintBlock).title ?? "");
      const children = (b.innerBlocks ?? [])
        .map((c) => blockToCode(c, inner))
        .join(",\n");
      return (
        `${indent}new HintBlock(${q(b.stringContent)}, ${title}, ${r(b.range)}, ${r(b.innerRange)}, ${b.lineStart}, [\n` +
        children +
        `\n${indent}])`
      );
    }

    case BLOCK_NAME.CONTAINER: {
      const name = q((b as ContainerBlock).name ?? "");
      const children = (b.innerBlocks ?? [])
        .map((c) => blockToCode(c, inner))
        .join(",\n");
      return (
        `${indent}new ContainerBlock(${q(b.stringContent)}, ${name}, ${r(b.range)}, ${r(b.innerRange)}, ${b.lineStart}, [\n` +
        children +
        `\n${indent}])`
      );
    }

    default:
      return `${indent}/* unknown block type: ${(b as Block).type} */`;
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx tsx scripts/file-to-mapping.ts <file>");
  process.exit(1);
}

const resolved = path.resolve(process.cwd(), filePath);
const doc = fs.readFileSync(resolved, "utf8");
const blocks = parse(doc, { language: "coq" });

const indent = "    ";
const body = blocks.map((b) => blockToCode(b, indent)).join(",\n");

console.log(`const mapping = createMapping([\n${body}\n]);`);
