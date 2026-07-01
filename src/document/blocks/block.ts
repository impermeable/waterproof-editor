import { Node as ProseNode } from "prosemirror-model";

// The different types of blocks that can be constructed.
export enum BLOCK_NAME {
  MATH_DISPLAY = "math_display",
  INPUT_AREA = "input",
  HINT = "hint",
  MARKDOWN = "markdown",
  CODE = "code",
  NEWLINE = "newline",
  CONTAINER = "container",
  INTERACTIVE_TABLE = "interactive_table",
  INTERACTIVE_CELL = "interactive_cell"
}

export interface BlockRange {
  from: number;
  to: number;
}

// TODO: Here we still use innerRange and range
export interface Block {
  type: BLOCK_NAME;
  stringContent: string;
  /** Range in the original document, including possible tags (like <input-area>) */
  range: BlockRange;
  /** Range in the original document, but only the content within possible tags */
  innerRange: BlockRange;
  /** The linenumber (0 based) at the start of this block */
  lineStart: number;

  /** Blocks that are children of this block, only valid for InputArea, Hint, and Container Blocks. */
  innerBlocks?: Block[];

  /** Convert this block to the corresponding ProseMirror node. */
  toProseMirror(): ProseNode;
  debugPrint(level: number): void;
}
