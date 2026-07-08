import { WaterproofDocument } from "../api";
import {
  Block,
  CodeBlock,
  HintBlock,
  InputAreaBlock,
  MarkdownBlock,
  MathDisplayBlock,
  NewlineBlock,
  WidgetBlock,
  WrappingWidgetBlock,
} from "../document";

enum ParserState {
  /** Parsing regular markdown content */
  Markdown,
  /** Parsing the contents of a code block ` ```langid ` to ` ``` ` */
  Code,
  /** Inside a LaTeX block (i.e. $$...$$) */
  LaTeX,
  /** Parsing a hint title (i.e. after `<hint title="` until `"`) */
  HintTitle,
  /** Parsing the opening tag attributes of a widget (i.e. after `<widget ` until `>`) */
  WidgetOpen,
  /** Parsing the raw text contents of a non-container widget */
  WidgetRaw,
}

enum NestedState {
  /** Not in a hint, input area, or widget */
  None,
  /** Parsing as part of a hint */
  Hint,
  /** Parsing as part of an input area */
  Input,
  /** Parsing as part of a container widget */
  Widget,
}

/**
 * Parser for markdown documents.
 *
 * Next to the regular markdown and code parts this parser has predefined 'tags' for hints, input areas, and widgets:
 * * The content between `<hint title="{title}">` and ` </hint>` is turned into a hint cell, `{title}` will turn into the title that is displayed in the editor.
 * * The content between `<input-area>` and `</input-area>` is turned into an input area.
 * * The content between `<widget data-type="{type}">` and `</widget>` is turned into a widget.
 * @param document The document to convert into a `WaterproofDocument`
 * @param config An object that may contain
 * - `language: string`: The language tag to use for the code cells. That is, the part of the ` ``` ` when opening a code block (` ```python ` for a python
 * code block). Defaults to `""`.
 * - `startParsingFrom: number`: An offset in `document` from where to start parsing the markdown document. Fox example, if you have a header in the
 * markdown file use offset to start the markdown parser after the header content. Defaults to `0`.
 * - `stopParsingAt: number`: Can be used to configure the parser to stop before the end of the file, when the file contains a footer for example.
 * When not specified, parsing will stop only at the end of the file.
 * @returns A array of `Block` that form a `WaterproofDocument`.
 */
export function parse(
  document: string,
  config: {
    language?: string;
    startParsingFrom?: number;
    stopParsingAt?: number;
  },
): WaterproofDocument {
  // Stack to store the produced blocks
  const blocks: Block[] = [];

  const language = config.language ?? "";
  const startParsingFrom = config.startParsingFrom ?? 0;
  const stopParsingAt = config.stopParsingAt ?? document.length;

  // Whether we are in a nested state, initially set to none.
  let nested: NestedState = NestedState.None;

  let innerBlocks: Block[] = [];
  let state: ParserState = ParserState.Markdown;
  let rangeStart = startParsingFrom; // Range of the entire block
  let innerRangeStart = startParsingFrom; // Range of the content

  let rangeStartNested = startParsingFrom;
  let innerRangeStartNested = startParsingFrom;
  let lineStartCounter = 0;

  let hintTitle = "";
  let widgetType = "";
  let widgetAttributesStr = "";

  let i = startParsingFrom;
  let newlineCounter = 0;

  // Stores the offset of a codeblock (1 if we have an extra \n, 0 otherwise)
  let codeBlockOffset = 0;

  // Define the tags and their length.
  const hintOpen = '<hint title="',
    hintOpenLength = hintOpen.length;
  const hintClose = "</hint>",
    hintCloseLength = hintClose.length;
  const widgetOpen = "<widget ",
    widgetOpenLength = widgetOpen.length;
  const widgetClose = "</widget>",
    widgetCloseLength = widgetClose.length;
  const inputAreaOpen = "<input-area>",
    inputAreaOpenLength = inputAreaOpen.length;
  const inputAreaClose = "</input-area>",
    inputAreaCloseLength = inputAreaClose.length;
  const codeBlockOpen = "```" + language + "\n",
    codeBlockOpenLength = codeBlockOpen.length;
  const codeBlockClose = "\n```",
    codeBlockCloseLength = codeBlockClose.length;
  const latexBlockOpenClose = "$$",
    latexBlockOpenCloseLength = latexBlockOpenClose.length;

  // Push block to the stack.
  function pushBlock(block: Block) {
    // When in nested mode we push to the innerBlock stack, otherwise we push to the block stack
    if (nested === NestedState.None) {
      blocks.push(block);
    } else {
      innerBlocks.push(block);
    }
  }

  function setRangeStart() {
    if (nested === NestedState.None) {
      rangeStart = i;
    } else {
      rangeStartNested = i;
    }
  }

  function setInnerRangeStart() {
    if (nested === NestedState.None) {
      innerRangeStart = i;
    } else {
      innerRangeStartNested = i;
    }
  }

  function setLineStart() {
    lineStartCounter = newlineCounter;
  }

  function getRangeStart(): number {
    return nested === NestedState.None ? rangeStart : rangeStartNested;
  }

  function getInnerRangeStart(): number {
    return nested === NestedState.None
      ? innerRangeStart
      : innerRangeStartNested;
  }

  function getLineStart() {
    return lineStartCounter;
  }

  function lookAhead(str: string): boolean {
    return document.slice(i, i + str.length) === str;
  }

  function opensCodeBlock(): boolean {
    // Check for both ```lang and \n```lang
    if (lookAhead("\n" + codeBlockOpen)) {
      codeBlockOffset = 1;
      return true;
    } else if (lookAhead(codeBlockOpen)) {
      codeBlockOffset = 0;
      return true;
    }
    return false;
  }

  function opensHintBlock(): boolean {
    return lookAhead(hintOpen);
  }

  function opensWidgetBlock(): boolean {
    return lookAhead(widgetOpen);
  }

  function opensInputAreaBlock(): boolean {
    return lookAhead(inputAreaOpen);
  }

  function opensLaTeXBlock(): boolean {
    return lookAhead(latexBlockOpenClose);
  }

  function closesCodeBlock(): boolean {
    // Check for both \n``` and \n```\n
    if (lookAhead(codeBlockClose + "\n")) {
      codeBlockOffset = 1;
      return true;
    } else if (lookAhead(codeBlockClose)) {
      codeBlockOffset = 0;
      return true;
    }
    return false;
  }

  function closesHintBlock(): boolean {
    return lookAhead(hintClose);
  }

  function closesWidgetBlock(): boolean {
    return lookAhead(widgetClose);
  }

  function closesInputAreaBlock(): boolean {
    return lookAhead(inputAreaClose);
  }

  function closesLaTeXBlock(): boolean {
    return lookAhead(latexBlockOpenClose);
  }

  function backToMarkdown(clearNestedBlocks: boolean = false) {
    state = ParserState.Markdown;
    setRangeStart();
    setInnerRangeStart();
    setLineStart();
    if (clearNestedBlocks) {
      innerBlocks = [];
    }
  }

  function closeMarkdown() {
    // If there is content in the buffer range then we create a markdown block
    if (i > getRangeStart()) {
      const from = getRangeStart();
      const to = i;
      const markdownBlock = new MarkdownBlock(
        document.slice(getRangeStart(), i),
        { from, to },
        { from, to },
        0,
      );
      pushBlock(markdownBlock);
    }
  }

  function checkNewlineAndIncrementI(): void {
    if (document[i] === "\n") newlineCounter++;
    i++;
  }

  function handleMarkdownCase(): void {
    if (opensCodeBlock()) {
      closeMarkdown();
      // Set parser state to start parsing the code block contents.
      state = ParserState.Code;
      setRangeStart();
      i += codeBlockOffset + codeBlockOpenLength;
      newlineCounter += codeBlockOffset;
      newlineCounter++;
      setInnerRangeStart();
      setLineStart();
    } else if (opensLaTeXBlock()) {
      closeMarkdown();
      state = ParserState.LaTeX;
      setRangeStart();
      i += latexBlockOpenCloseLength; // Skip the $$
      setInnerRangeStart();
      setLineStart();
    } else if (nested === NestedState.None && opensHintBlock()) {
      closeMarkdown();
      setRangeStart();
      setLineStart();
      i += hintOpenLength; // Skip the <hint title="
      innerRangeStartNested = i;
      rangeStartNested = i;
      state = ParserState.HintTitle;
      nested = NestedState.Hint;
    } else if (nested === NestedState.None && opensWidgetBlock()) {
      closeMarkdown();
      setRangeStart();
      setLineStart();
      i += widgetOpenLength; // Skip the `<widget `
      widgetAttributesStr = "";
      state = ParserState.WidgetOpen;
    } else if (nested === NestedState.None && opensInputAreaBlock()) {
      closeMarkdown();
      setRangeStart();
      i += inputAreaOpenLength;
      setInnerRangeStart();
      setLineStart();
      innerRangeStartNested = i;
      rangeStartNested = i;
      nested = NestedState.Input;
    } else if (nested === NestedState.Hint && closesHintBlock()) {
      closeMarkdown();
      nested = NestedState.None; // MUST UN-NEST BEFORE EXTRACTING RANGES

      const range = { from: getRangeStart(), to: i + hintCloseLength };
      const innerRange = { from: getInnerRangeStart(), to: i };

      const hintBlock = new HintBlock(
        document.slice(innerRange.from, innerRange.to),
        hintTitle,
        range,
        innerRange,
        0,
        innerBlocks,
      );
      pushBlock(hintBlock);
      i += hintCloseLength; // Skip the </hint>
      backToMarkdown(true);
      hintTitle = "";
    } else if (nested === NestedState.Widget && closesWidgetBlock()) {
      closeMarkdown();
      nested = NestedState.None; // MUST UN-NEST BEFORE EXTRACTING RANGES

      const range = { from: getRangeStart(), to: i + widgetCloseLength };
      const innerRange = { from: getInnerRangeStart(), to: i };

      const widgetBlock = new WrappingWidgetBlock(
        document.slice(innerRange.from, innerRange.to),
        widgetType,
        range,
        innerRange,
        getLineStart(),
        innerBlocks,
      );
      pushBlock(widgetBlock);
      i += widgetCloseLength; // Skip the </widget>
      backToMarkdown(true);
      widgetType = "";
    } else if (nested === NestedState.Input && closesInputAreaBlock()) {
      closeMarkdown();
      nested = NestedState.None; // MUST UN-NEST BEFORE EXTRACTING RANGES

      const range = { from: getRangeStart(), to: i + inputAreaCloseLength };
      const innerRange = { from: getInnerRangeStart(), to: i };

      const inputAreaBlock = new InputAreaBlock(
        document.slice(innerRange.from, innerRange.to),
        range,
        innerRange,
        0,
        innerBlocks,
      );
      pushBlock(inputAreaBlock);
      i += inputAreaCloseLength; // Skip the </input-area>
      backToMarkdown(true);
    } else {
      checkNewlineAndIncrementI();
    }
  }

  function handleCodeCase(): void {
    if (closesCodeBlock()) {
      // End of this code block
      newlineCounter++;

      // Check if we have a newline before this block
      const newlineBefore = document[getRangeStart()] === "\n";
      const range = {
        from: getRangeStart() + (newlineBefore ? 1 : 0),
        to: i + codeBlockCloseLength,
      };
      const innerRange = { from: getInnerRangeStart(), to: i };
      const codeBlock = new CodeBlock(
        document.slice(innerRange.from, innerRange.to),
        range,
        innerRange,
        getLineStart(),
      );

      // Add a newline block before the block if needed
      if (newlineBefore) {
        pushBlock(
          new NewlineBlock(
            { from: getRangeStart(), to: getRangeStart() + 1 },
            { from: getRangeStart(), to: getRangeStart() + 1 },
            0,
          ),
        );
      }
      pushBlock(codeBlock);
      // Add a newline block after the block if needed
      if (codeBlockOffset) {
        newlineCounter++;
        pushBlock(
          new NewlineBlock(
            { from: range.to, to: range.to + 1 },
            { from: range.to, to: range.to + 1 },
            0,
          ),
        );
      }

      i += codeBlockCloseLength + codeBlockOffset; // Skip the closing ``` and possible \n
      backToMarkdown();
    } else {
      checkNewlineAndIncrementI();
    }
  }

  function handleLaTeXCase(): void {
    if (closesLaTeXBlock()) {
      // End of this LaTeX block
      const range = {
        from: getRangeStart(),
        to: i + latexBlockOpenCloseLength,
      };
      const innerRange = { from: getInnerRangeStart(), to: i };
      const mathBlock = new MathDisplayBlock(
        document.slice(getInnerRangeStart(), i),
        range,
        innerRange,
        0,
      );
      pushBlock(mathBlock);
      i += latexBlockOpenCloseLength; // Skip the closing $$
      backToMarkdown();
    } else {
      checkNewlineAndIncrementI();
    }
  }

  function handleHintTitleCase(): void {
    // Parse until we find the closing quote and >
    while (i < document.length) {
      const char = document[i];
      if (char === '"' && document[i + 1] === ">") {
        i += 2; // Skip the closing quote and >
        // Back to parsing markdown
        backToMarkdown();
        // The inner range of the hint starts here.
        innerRangeStart = i;
        break;
      } else {
        hintTitle += char;
        checkNewlineAndIncrementI();
      }
    }
  }

  function handleWidgetOpenCase(): void {
    while (i < document.length) {
      const char = document[i];
      if (char === ">") {
        // Parse attributes out of the extracted opening tag string
        const typeMatch = widgetAttributesStr.match(/data-type="([^"]*)"/);
        widgetType = typeMatch ? typeMatch[1] : "";

        const containerMatch = widgetAttributesStr.match(
          /data-is-container="([^"]*)"/,
        );
        const isContainer = containerMatch
          ? containerMatch[1] === "true"
          : false;

        i++; // Skip the '>'

        if (isContainer) {
          nested = NestedState.Widget;
          backToMarkdown(); // Initializes the inner block tracking variables
          innerRangeStart = i; // Records where the widget's content starts for the outer block
        } else {
          state = ParserState.WidgetRaw;
          innerRangeStart = i;
          setLineStart();
        }
        break;
      } else {
        widgetAttributesStr += char;
        checkNewlineAndIncrementI();
      }
    }
  }

  while (i < stopParsingAt) {
    switch (state as ParserState) {
      case ParserState.Markdown:
        handleMarkdownCase();
        break;
      case ParserState.Code:
        handleCodeCase();
        break;
      case ParserState.LaTeX:
        handleLaTeXCase();
        break;
      case ParserState.HintTitle:
        handleHintTitleCase();
        break;
      case ParserState.WidgetOpen:
        handleWidgetOpenCase();
        break;
      case ParserState.WidgetRaw:
        if (closesWidgetBlock()) {
          const range = { from: getRangeStart(), to: i + widgetCloseLength };
          const innerRange = { from: getInnerRangeStart(), to: i };
          const content = document.slice(innerRange.from, innerRange.to);

          const widgetBlock = new WidgetBlock(
            content,
            widgetType,
            range,
            innerRange,
            getLineStart(),
          );
          pushBlock(widgetBlock);
          i += widgetCloseLength;
          backToMarkdown();
          widgetType = "";
        } else {
          checkNewlineAndIncrementI();
        }
        break;
    }
  }

  // If there is still content then we should create a final markdown block.
  closeMarkdown();
  return blocks;
}
