import { BLOCK_NAME, Block } from "./block";
import {
  CodeBlock,
  ContainerBlock,
  HintBlock,
  InputAreaBlock,
  MarkdownBlock,
  MathDisplayBlock,
  WidgetBlock,
  NewlineBlock,
} from "./blocktypes";

export const isInputAreaBlock = (block: Block): block is InputAreaBlock =>
  block.type === BLOCK_NAME.INPUT_AREA;
export const isHintBlock = (block: Block): block is HintBlock =>
  block.type === BLOCK_NAME.HINT;
export const isMathDisplayBlock = (block: Block): block is MathDisplayBlock =>
  block.type === BLOCK_NAME.MATH_DISPLAY;
export const isCodeBlock = (block: Block): block is CodeBlock =>
  block.type === BLOCK_NAME.CODE;
export const isWidgetBlock = (block: Block): block is WidgetBlock =>
  block.type === BLOCK_NAME.WIDGET;
export const isMarkdownBlock = (block: Block): block is MarkdownBlock =>
  block.type === BLOCK_NAME.MARKDOWN;
export const isNewlineBlock = (block: Block): block is NewlineBlock =>
  block.type === BLOCK_NAME.NEWLINE;
export const isContainerBlock = (block: Block): block is ContainerBlock =>
  block.type === BLOCK_NAME.CONTAINER;
