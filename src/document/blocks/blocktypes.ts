import { Node } from "prosemirror-model";
import { WaterproofSchema } from "../../schema";
import { BLOCK_NAME, Block, BlockRange } from "./block";
import {
  code,
  container,
  hint,
  inputArea,
  interactiveCell,
  interactiveTable,
  markdown,
  mathDisplay,
  newline,
} from "./schema";

const indentation = (level: number): string => "  ".repeat(level);
const debugInfo = (block: Block): string =>
  `{range=${block.range.from}-${block.range.to}}`;

/**
 * InputAreaBlocks are the parts of the document that should be editable by students.
 * Every input area has an accompanying status to indicate whether the input area is 'correct'.
 */
export class InputAreaBlock implements Block {
  public type = BLOCK_NAME.INPUT_AREA;
  public innerBlocks: Block[];

  /**
   * Construct a new InputAreaBlock.
   * @param stringContent Content of the input area
   * @param range The range (from position to to position in the original document) of the entire input area block, including the its tags.
   * @param innerRange The range (from position to to position in the original document) of the inner content of the input area block, excluding its tags.
   * @param childBlocks Either an array of child blocks of this input area block, or a function that constructs the child blocks given the inner range and content.
   */
  constructor(
    public stringContent: string,
    public range: BlockRange,
    public innerRange: BlockRange,
    public lineStart: number,
    childBlocks:
      | Block[]
      | ((
          innerContent: string,
          innerRange: BlockRange,
          lineStartOffset: number,
        ) => Block[]),
  ) {
    if (typeof childBlocks === "function") {
      this.innerBlocks = childBlocks(stringContent, innerRange, lineStart);
    } else {
      this.innerBlocks = childBlocks;
    }
  }

  toProseMirror() {
    const childNodes = this.innerBlocks.map((block) => block.toProseMirror());
    return inputArea(childNodes);
  }

  // Debug print function. // FIXME: Maybe remove?
  debugPrint(level: number): void {
    console.log(`${indentation(level)}InputAreaBlock {${debugInfo(this)}} [`);
    this.innerBlocks.forEach((block) => block.debugPrint(level + 1));
    console.log(`${indentation(level)}]`);
  }
}

/**
 * HintBlocks are foldable blocks that can be used to hide parts of the document by default.
 * Useful for giving hints to students or hiding import/configuration statements from the student.
 */
export class HintBlock implements Block {
  public type = BLOCK_NAME.HINT;
  public innerBlocks: Block[];

  /**
   * Construct a new HintBlock.
   * @param stringContent Content of the hint block
   * @param title Title of the hint block (the part that is displayed in the document when folded)
   * @param range The range (from position to to position in the original document) of the entire hint block, including its tags.
   * @param innerRange The range (from position to to position in the original document) of the inner content of the hint block, excluding its tags.
   * @param childBlocks Either an array of child blocks of this hint block, or a function that constructs the child blocks given the inner range and content.
   */
  constructor(
    public stringContent: string,
    public title: string,
    public range: BlockRange,
    public innerRange: BlockRange,
    public lineStart: number,
    childBlocks:
      | Block[]
      | ((
          innerContent: string,
          innerRange: BlockRange,
          lineStartOffset: number,
        ) => Block[]),
  ) {
    if (typeof childBlocks === "function") {
      this.innerBlocks = childBlocks(stringContent, innerRange, lineStart);
    } else {
      this.innerBlocks = childBlocks;
    }
  }

  toProseMirror() {
    // We need to construct a hint node with a title and inner blocks.
    const childNodes = this.innerBlocks.map((block) => block.toProseMirror());
    return hint(this.title, childNodes);
  }

  // Debug print function.
  debugPrint(level: number): void {
    console.log(
      `${indentation(level)}HintBlock {${debugInfo(this)}} {title="${this.title}"} [`,
    );
    this.innerBlocks.forEach((block) => block.debugPrint(level + 1));
    console.log(`${indentation(level)}]`);
  }
}

/**
 * MathDisplayBlocks display LaTeX in display mode (i.e., centered and on its own line).
 */
export class MathDisplayBlock implements Block {
  public type = BLOCK_NAME.MATH_DISPLAY;
  constructor(
    public stringContent: string,
    public range: BlockRange,
    public innerRange: BlockRange,
    public lineStart: number,
  ) {}

  toProseMirror() {
    if (this.stringContent === "") {
      // If the string content is empty, we create an empty math display node.
      return WaterproofSchema.nodes.math_display.create();
    }
    return mathDisplay(this.stringContent);
  }

  // Debug print function.
  debugPrint(level: number): void {
    console.log(
      `${indentation(level)}MathDisplayBlock {${debugInfo(this)}}: {${this.stringContent.replaceAll("\n", "\\n")}}`,
    );
  }
}

/**
 * MarkdownBlocks contain markdown content (including inline LaTeX inside single dollars `$`).
 */
export class MarkdownBlock implements Block {
  public type = BLOCK_NAME.MARKDOWN;
  public isNewLineOnly = false;

  constructor(
    public stringContent: string,
    public range: BlockRange,
    public innerRange: BlockRange,
    public lineStart: number,
  ) {
    if (stringContent === "\n") this.isNewLineOnly = true;
  }

  toProseMirror() {
    if (this.stringContent === "") {
      // If the string content is empty, we create an empty markdown node.
      return WaterproofSchema.nodes.markdown.create();
    }
    return markdown(this.stringContent);
  }

  // Debug print function.
  debugPrint(level: number): void {
    console.log(
      `${indentation(level)}MarkdownBlock {${debugInfo(this)}}: {${this.stringContent.replaceAll("\n", "\\n")}}`,
    );
  }
}

/**
 * CodeBlocks contain source code.
 */
export class CodeBlock implements Block {
  public type = BLOCK_NAME.CODE;

  constructor(
    public stringContent: string,
    public range: BlockRange,
    public innerRange: BlockRange,
    public lineStart: number,
  ) {}

  toProseMirror() {
    if (this.stringContent === "") {
      // If the string content is empty, we create an empty code node.
      return WaterproofSchema.nodes.code.create();
    }
    return code(this.stringContent);
  }

  // Debug print function.
  debugPrint(level: number): void {
    console.log(
      `${indentation(level)}CodeBlock {${debugInfo(this)}}: {${this.stringContent.replaceAll("\n", String.raw`\n`)}}`,
    );
  }
}

/**
 * NewlineBlock are blocks that take the place of a newline that is significant in the document.
 * That is, the newline should be preserved
 */
export class NewlineBlock implements Block {
  public type = BLOCK_NAME.NEWLINE;

  constructor(
    public range: BlockRange,
    public innerRange: BlockRange,
    public lineStart: number,
  ) {}

  stringContent: string = "";

  toProseMirror(): Node {
    return newline();
  }

  // Debug print function.
  debugPrint(level: number): void {
    console.log(`${indentation(level)}Newline`);
  }
}

/**
 * ContainerBlocks are generic container blocks that group multiple blocks together.
 * They carry a name to identify the container type.
 * In Lean context, multilean blocks are represented as containers with name "multilean".
 * They can contain both top-level blocks (input, hint) and leaf blocks (math, code, markdown).
 */
export class ContainerBlock implements Block {
  public type = BLOCK_NAME.CONTAINER;
  public innerBlocks: Block[];

  constructor(
    public stringContent: string,
    public name: string,
    public range: BlockRange,
    public innerRange: BlockRange,
    public lineStart: number,
    childBlocks:
      | Block[]
      | ((
          innerContent: string,
          innerRange: BlockRange,
          lineStartOffset: number,
        ) => Block[]),
  ) {
    if (typeof childBlocks === "function") {
      this.innerBlocks = childBlocks(stringContent, innerRange, lineStart);
    } else {
      this.innerBlocks = childBlocks;
    }
  }

  toProseMirror() {
    const childNodes = this.innerBlocks.map((block) => block.toProseMirror());
    return container(this.name, childNodes);
  }

  debugPrint(level: number): void {
    console.log(
      `${indentation(level)}ContainerBlock(${this.name}) {${debugInfo(this)}} [`,
    );
    this.innerBlocks.forEach((block) => block.debugPrint(level + 1));
    console.log(`${indentation(level)}]`);
  }
}

/**
 * InteractiveCellBlocks wrap a single code cell and render as a labelled toggle button.
 * Clicking the button (handled by the interactive plugin) mutates the inner code cell.
 * The `cellText` is the label displayed on the button.
 */
export class InteractiveCellBlock implements Block {
  public type = BLOCK_NAME.INTERACTIVE_CELL;
  public innerBlocks: Block[];

  constructor(
    public stringContent: string,
    public cellText: string,
    public hidden: boolean,
    public range: BlockRange,
    public innerRange: BlockRange,
    public lineStart: number,
    childBlocks:
      | Block[]
      | ((
          innerContent: string,
          innerRange: BlockRange,
          lineStartOffset: number,
        ) => Block[]),
  ) {
    if (typeof childBlocks === "function") {
      this.innerBlocks = childBlocks(stringContent, innerRange, lineStart);
    } else {
      this.innerBlocks = childBlocks;
    }
  }

  toProseMirror() {
    // An interactive cell contains exactly one code node (per the schema).
    const childNodes = this.innerBlocks.map((block) => block.toProseMirror());
    return interactiveCell(this.cellText, this.hidden, childNodes);
  }

  // Debug print function.
  debugPrint(level: number): void {
    console.log(
      `${indentation(level)}InteractiveCellBlock {${debugInfo(this)}} {cellText="${this.cellText}", hidden=${this.hidden}} [`,
    );
    this.innerBlocks.forEach((block) => block.debugPrint(level + 1));
    console.log(`${indentation(level)}]`);
  }
}

/**
 * InteractiveTableBlocks group multiple {@link InteractiveCellBlock}s together.
 * They carry a `name` to identify the table.
 */
export class InteractiveTableBlock implements Block {
  public type: BLOCK_NAME = BLOCK_NAME.INTERACTIVE_TABLE;
  public innerBlocks: Block[];

  constructor(
    public stringContent: string,
    public name: string,
    public range: BlockRange,
    public innerRange: BlockRange,
    public lineStart: number,
    childBlocks:
      | Block[]
      | ((
          innerContent: string,
          innerRange: BlockRange,
          lineStartOffset: number,
        ) => Block[]),
  ) {
    if (typeof childBlocks === "function") {
      this.innerBlocks = childBlocks(stringContent, innerRange, lineStart);
    } else {
      this.innerBlocks = childBlocks;
    }
  }

  toProseMirror() {
    const childNodes = this.innerBlocks.map((block) => block.toProseMirror());
    return interactiveTable(this.name, childNodes);
  }

  debugPrint(level: number): void {
    console.log(
      `${indentation(level)}InteractiveTableBlock(${this.name}) {${debugInfo(this)}} [`,
    );
    this.innerBlocks.forEach((block) => block.debugPrint(level + 1));
    console.log(`${indentation(level)}]`);
  }
}
