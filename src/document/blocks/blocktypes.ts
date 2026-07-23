import { Node } from "prosemirror-model";
import { WaterproofSchema } from "../../schema";
import { BLOCK_NAME, Block, BlockRange } from "./block";
import {
  code,
  container,
  hint,
  inputArea,
  markdown,
  mathDisplay,
  newline,
  studentHidden,
} from "./schema";

const indentation = (level: number): string => "  ".repeat(level);
const debugInfo = (block: Block): string =>
  `{range=${block.range.from}-${block.range.to}}`;

/**
 * The child blocks of a grouping block: either an array of blocks, or a
 * function that constructs the child blocks given the inner content, inner
 * range, and line start.
 */
export type ChildBlocks =
  | Block[]
  | ((
      innerContent: string,
      innerRange: BlockRange,
      lineStartOffset: number,
    ) => Block[]);

/**
 * Base class for blocks that group child blocks together (input areas, hints,
 * containers, and student-hidden blocks).
 *
 * @param stringContent Content of the block
 * @param range The range (from position to to position in the original document) of the entire block, including its tags.
 * @param innerRange The range (from position to to position in the original document) of the inner content of the block, excluding its tags.
 * @param childBlocks Either an array of child blocks of this block, or a function that constructs the child blocks given the inner range and content.
 */
export abstract class GroupingBlock implements Block {
  abstract type: BLOCK_NAME;
  public innerBlocks: Block[];

  constructor(
    public stringContent: string,
    public range: BlockRange,
    public innerRange: BlockRange,
    public lineStart: number,
    childBlocks: ChildBlocks,
  ) {
    if (typeof childBlocks === "function") {
      this.innerBlocks = childBlocks(stringContent, innerRange, lineStart);
    } else {
      this.innerBlocks = childBlocks;
    }
  }

  /** Wrap the given ProseMirror child nodes in this block's node type. */
  protected abstract wrapChildNodes(childNodes: Node[]): Node;

  toProseMirror(): Node {
    const childNodes = this.innerBlocks.map((block) => block.toProseMirror());
    return this.wrapChildNodes(childNodes);
  }

  /** The part of the debug print line before the child block listing. */
  protected abstract debugHeader(): string;

  // Debug print function. // FIXME: Maybe remove?
  debugPrint(level: number): void {
    console.log(`${indentation(level)}${this.debugHeader()} [`);
    this.innerBlocks.forEach((block) => block.debugPrint(level + 1));
    console.log(`${indentation(level)}]`);
  }
}

/**
 * InputAreaBlocks are the parts of the document that should be editable by students.
 * Every input area has an accompanying status to indicate whether the input area is 'correct'.
 */
export class InputAreaBlock extends GroupingBlock {
  public type = BLOCK_NAME.INPUT_AREA;

  protected wrapChildNodes(childNodes: Node[]): Node {
    return inputArea(childNodes);
  }

  protected debugHeader(): string {
    return `InputAreaBlock {${debugInfo(this)}}`;
  }
}

/**
 * HintBlocks are foldable blocks that can be used to hide parts of the document by default.
 * Useful for giving hints to students or hiding import/configuration statements from the student.
 */
export class HintBlock extends GroupingBlock {
  public type = BLOCK_NAME.HINT;

  /**
   * Construct a new HintBlock.
   * @param title Title of the hint block (the part that is displayed in the document when folded)
   *
   * See {@linkcode GroupingBlock} for the other parameters.
   */
  constructor(
    stringContent: string,
    public title: string,
    range: BlockRange,
    innerRange: BlockRange,
    lineStart: number,
    childBlocks: ChildBlocks,
  ) {
    super(stringContent, range, innerRange, lineStart, childBlocks);
  }

  protected wrapChildNodes(childNodes: Node[]): Node {
    // We need to construct a hint node with a title and inner blocks.
    return hint(this.title, childNodes);
  }

  protected debugHeader(): string {
    return `HintBlock {${debugInfo(this)}} {title="${this.title}"}`;
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
export class ContainerBlock extends GroupingBlock {
  public type = BLOCK_NAME.CONTAINER;

  /**
   * Construct a new ContainerBlock.
   * @param name Name identifying the container type (e.g. "multilean")
   *
   * See {@linkcode GroupingBlock} for the other parameters.
   */
  constructor(
    stringContent: string,
    public name: string,
    range: BlockRange,
    innerRange: BlockRange,
    lineStart: number,
    childBlocks: ChildBlocks,
  ) {
    super(stringContent, range, innerRange, lineStart, childBlocks);
  }

  protected wrapChildNodes(childNodes: Node[]): Node {
    return container(this.name, childNodes);
  }

  protected debugHeader(): string {
    return `ContainerBlock(${this.name}) {${debugInfo(this)}}`;
  }
}

/**
 * The `StudentHiddenBlock` acts similar to the {@linkcode ContainerBlock} in the
 * sense that it groups child blocks together.
 *
 * The child blocks are only shown when in teacher mode and hence never visible
 * to students.
 */
export class StudentHiddenBlock extends GroupingBlock {
  public type = BLOCK_NAME.STUDENT_HIDDEN;

  protected wrapChildNodes(childNodes: Node[]): Node {
    return studentHidden(childNodes);
  }

  protected debugHeader(): string {
    return `StudentHiddenBlock {${debugInfo(this)}}`;
  }
}
