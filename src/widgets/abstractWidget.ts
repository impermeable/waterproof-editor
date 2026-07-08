import { EditorView, NodeView } from "prosemirror-view";
import { Node as ProseNode } from "prosemirror-model";

export type WidgetInfo = {
  getPos: () => number | undefined;
  node: ProseNode;
  view: EditorView;
};

export abstract class AbstractWidget<State = unknown> implements NodeView {
  protected state!: State; // Assigned by subclasses Widget and ContainerWidget

  info: WidgetInfo;

  dom!: HTMLElement; // Assigned by subclasses Widget and ContainerWidget

  /** TODO: If this node is not supposed to have any children, we should somehow enforce that this is always undefined */
  contentDOM?: HTMLElement;

  /** Default node selection styling. */
  selectNode() {
    // TODO:
    // this.dom.focus();
    this.dom.classList.add("ProseMirror-selectednode");
  }

  /** Default node deselection styling. */
  deselectNode() {
    this.dom.classList.remove("ProseMirror-selectednode");
  }

  setSelection?:
    | ((anchor: number, head: number, root: Document | ShadowRoot) => void)
    | undefined;

  stopEvent() {
    return true;
  }

  ignoreMutation?: ((mutation: MutationRecord) => boolean) | undefined;
  destroy?: (() => void) | undefined;

  // update?: ((node: ProseNode, decorations: readonly Decoration[], innerDecorations: DecorationSource) => boolean) | undefined;
  update(node: ProseNode): boolean {
    if (node.type !== this.info.node.type) return false;
    this.info.node = node;
    return true;
  }

  constructor(widgetInfo: WidgetInfo) {
    this.info = widgetInfo;
  }

  abstract updateState(): void;

  abstract updateView(): void;

  protected get view() {
    return this.info.view;
  }

  protected get node() {
    return this.info.node;
  }

  public getPos() {
    return this.info.getPos();
  }
}
