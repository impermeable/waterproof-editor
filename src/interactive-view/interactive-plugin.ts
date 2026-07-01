import { NodeType, Node as PNode } from "prosemirror-model";
import {
  EditorState,
  EditorStateConfig,
  Plugin,
  Transaction,
} from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { findDescendantsWithType } from "../utilities";
import { WaterproofSchema } from "../schema";

/**
 * Function that returns the interactive-cell plugin.
 *
 * The plugin renders a toggle button in front of every `interactive_cell` node.
 * Clicking the button mutates the code cell contained in that interactive cell.
 * This is a prototype: the toggle simply flips `true` <-> `false` in the code,
 * demonstrating how a button can be mapped to (and rewrite) a code cell on disk.
 * @returns A `Plugin` that enables the interactive-cell functionality.
 */
export const createInteractivePlugin = (): Plugin => {
  const cellNodeType = WaterproofSchema.nodes.interactive_cell;

  return new Plugin<DecorationSet>({
    state: {
      init(_config: EditorStateConfig, instance: EditorState) {
        return getInteractiveDecorations(instance, cellNodeType);
      },
      apply(
        tr: Transaction,
        value: DecorationSet,
        _oldState: EditorState,
        newState: EditorState,
      ) {
        // Only recompute the button decorations when the document changed.
        return tr.docChanged
          ? getInteractiveDecorations(newState, cellNodeType)
          : value;
      },
    },
    props: {
      decorations(state: EditorState) {
        return this.getState(state);
      },
    },
  });
};

/**
 * Compute the set of toggle-button decorations for every interactive cell.
 * @param state The state of the editor.
 * @param cellNodeType The type of an interactive cell node as defined in the schema.
 * @returns A `DecorationSet` containing the button decorations.
 */
function getInteractiveDecorations(
  state: EditorState,
  cellNodeType: NodeType,
): DecorationSet {
  const cells = findDescendantsWithType(state.doc, true, cellNodeType);

  const decorations = cells.map((cell) =>
    // Place the button just inside the cell, before the code node (side: -1).
    Decoration.widget(cell.pos + 1, (view: EditorView) => createButtonDOM(view, cell), {
      side: -1,
    }),
  );

  return DecorationSet.create(state.doc, decorations);
}

/**
 * Toggle the code contained in `true` <-> `false`. Returns the original text
 * when neither token is present (so unrelated code is left untouched).
 */
function toggleCode(text: string): string {
  if (text.includes("true")) return text.replaceAll("true", "false");
  if (text.includes("false")) return text.replaceAll("false", "true");
  return text;
}

/**
 * Create the DOM for a single interactive cell's toggle button.
 * @param view The current editor view.
 * @param cell The interactive cell node together with its document position.
 */
function createButtonDOM(
  view: EditorView,
  cell: { node: PNode; pos: number },
): HTMLElement {
  const button = document.createElement("button");
  button.classList.add("interactive-cell-button");
  button.textContent = cell.node.attrs.cellText || "Toggle";

  button.addEventListener("click", (ev: MouseEvent) => {
    ev.preventDefault();

    // Re-resolve the cell node at click time; positions may have shifted.
    const cellNode = view.state.doc.nodeAt(cell.pos);
    if (!cellNode || cellNode.type !== WaterproofSchema.nodes.interactive_cell) {
      return;
    }
    const codeNode = cellNode.maybeChild(0);
    if (!codeNode || codeNode.type !== WaterproofSchema.nodes.code) return;

    // Content of the code node lives between codePos+1 and codePos+1+size.
    const codePos = cell.pos + 1;
    const contentFrom = codePos + 1;
    const contentTo = contentFrom + codeNode.content.size;

    const newText = toggleCode(codeNode.textContent);
    if (newText === codeNode.textContent) return;

    const tr =
      newText.length > 0
        ? view.state.tr.replaceWith(
            contentFrom,
            contentTo,
            WaterproofSchema.text(newText),
          )
        : view.state.tr.delete(contentFrom, contentTo);
    view.dispatch(tr);
  });

  return button;
}
