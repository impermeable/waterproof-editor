import { AbstractWidget, WidgetInfo } from "./abstractWidget";

export abstract class Widget<State = unknown> extends AbstractWidget<State> {
  constructor(info: WidgetInfo, nodeContent: string) {
    super(info);
    this.state = this.initState(nodeContent);
    this.dom = this.createView(this.state);
  }

  protected abstract createView(state: State): HTMLElement;

  abstract initState(nodeContent: string): State;

  /** Replace the text content owned by this widget node. */
  protected setContent(content: string) {
    const pos = this.getPos();
    if (pos === undefined) return;

    const from = pos + 1 + 1;
    const to = pos + this.node.nodeSize - 1 - 1;
    const transaction = this.view.state.tr;
    if (content.length === 0) {
      transaction.delete(from, to);
    } else {
      transaction.replaceWith(from, to, this.view.state.schema.text(content));
    }
    this.view.dispatch(transaction);
  }

  protected updateContent(updateFun: (oldContent: string) => string) {
    const oldContent = this.node.textContent;
    const newContent = updateFun(oldContent);
    this.setContent(newContent);
  }
}
