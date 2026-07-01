import { Node as PNode, Schema } from "prosemirror-model";

export const SchemaCell = {
  InputArea: "input",
  Hint: "hint",
  Markdown: "markdown",
  MathDisplay: "math_display",
  Code: "code",
  Newline: "newline",
  Container: "container",
  InteractiveTable: "interactive_table",
  InteractiveCell: "interactive_cell"
} as const;

export type SchemaKeys = keyof typeof SchemaCell;
export type SchemaNames = (typeof SchemaCell)[SchemaKeys];

/**
 * General schema obtained from `prosemirror-markdown`:
 * https://github.com/ProseMirror/prosemirror-markdown/blob/master/src/schema.ts
 *
 * Codeblock schema adapted from 'ProseMirror footnote example':
 * https://prosemirror.net/examples/footnote/
 *
 * math blocks obtained from `prosemirror-math`:
 * https://github.com/benrbray/prosemirror-math/blob/master/src/math-schema.ts
 */
export const WaterproofSchema = new Schema<SchemaNames | "doc" | "text">({
  nodes: {
    doc: {
      content: "cell+",
    },

    text: {
      group: "inline",
    },

    /////// MARKDOWN ////////
    //#region Markdown
    markdown: {
      block: true,
      content: "text*",
      group: "cell hintinputcontent containercontent",
      parseDOM: [{ tag: "markdown", preserveWhitespace: "full" }],
      atom: true,
      toDOM: () => {
        return ["WaterproofMarkdown", 0];
      },
    },
    //#endregion

    /////// HINT //////
    //#region Hint
    hint: {
      content: "hintinputcontent+",
      group: "cell containercontent",
      attrs: {
        title: { default: "💡 Hint" },
        shown: { default: false },
      },
      toDOM(node: PNode) {
        return ["div", { class: "hint", shown: node.attrs.shown }, 0];
      },
    },
    //#endregion

    /////// Input Area //////
    //#region input
    input: {
      content: "hintinputcontent+",
      group: "cell containercontent",
      attrs: {
        status: { default: null },
      },
      toDOM: () => {
        return ["WaterproofInput", { class: "inputarea" }, 0];
      },
    },
    //#endregion

    ////// Code //////
    //#region Code
    code: {
      content: "text*", // content is of type text
      group: "cell hintinputcontent containercontent",
      code: true,
      atom: true, // doesn't have directly editable content (content is edited through codemirror)
      toDOM(node) {
        return ["WaterproofCode", node.attrs, 0];
      }, // <WaterproofCode></WaterproofCode> cells
    },

    //#endregion

    /////// MATH DISPLAY //////
    //#region math-display
    math_display: {
      group: "math cell hintinputcontent containercontent",
      content: "text*",
      atom: true,
      code: true,
      toDOM(node) {
        return [
          "math-display",
          { ...{ class: "math-node" }, ...node.attrs },
          0,
        ];
      },
    },
    //#endregion

    newline: {
      group: "cell hintinputcontent containercontent",
      toDOM(node) {
        return ["WaterproofNewline", node.attrs];
      },
      selectable: false,
    },

    /////// CONTAINER //////
    //#region container
    container: {
      content: "containercontent+",
      group: "cell",
      attrs: {
        name: { default: "" },
      },
      toDOM: (node) => {
        return ["div", { class: "container", "data-name": node.attrs.name }, 0];
      },
    },
    //#endregion

    /////// INTERACTIVE_CELL //////
    //#region interactive_cell
    // A single interactive cell: renders as a container holding a code cell.
    // A toggle button is injected in front of the code by the interactive plugin
    // (see `src/interactive-view`). The `cellText` attribute is the button label.
    interactive_cell: {
      content: "code",
      group: "interactive_cell",
      attrs: {
        cellText: { default: "" },
        // When true, the inner code cell is hidden in the editor (only the
        // button is shown). The code still lives on disk and is executed.
        hidden: { default: false },
      },
      toDOM: (node) => {
        const cls = node.attrs.hidden
          ? "interactive-cell interactive-cell--hidden"
          : "interactive-cell";
        return ["div", { class: cls, "data-cell-text": node.attrs.cellText }, 0];
      },
    },
    //#endregion

    /////// INTERACTIVE_TABLE //////
    //#region interactive_table
    // Groups multiple interactive cells together (each rendered with its own button).
    interactive_table: {
      content: "interactive_cell+",
      group: "cell",
      attrs: {
        name: { default: "" },
      },
      toDOM: (node) => {
        return [
          "div",
          { class: "interactive-table", "data-name": node.attrs.name },
          0,
        ];
      },
    },
    //#endregion
  },
});
