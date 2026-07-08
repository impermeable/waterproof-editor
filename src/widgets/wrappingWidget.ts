import { Node } from "prosemirror-model";
import { AbstractWidget, WidgetInfo } from "./abstractWidget";
import { Transaction } from "prosemirror-state";

export abstract class WrappingWidget<
  State = unknown,
> extends AbstractWidget<State> {
  contentDOM: HTMLElement;

  constructor(info: WidgetInfo) {
    super(info);
    this.state = this.initState(info.node);
    const hole = document.createElement("div");
    this.contentDOM = hole;
    this.dom = this.createView(this.state, hole);
    console.log("IN THE CONSTRUCTOR");
  }

  protected abstract createView(
    state: State,
    contentHole: HTMLElement,
  ): HTMLElement;

  abstract initState(node: Node): State;

  protected dispatchTransaction(tr: Transaction) {
    this.view.dispatch(tr);
  }

  protected get tr(): Transaction {
    return this.info.view.state.tr;
  }
}
