import { EditorView } from "prosemirror-view";
import { Mapping, pmIndex } from "./mapping";

/**
 * Handles intersection observation of editor DOM nodes to compute and emit viewport hints.
 */
export class ViewportObserver {
  private observer: IntersectionObserver;
  private pmPosOfVisibleNodes: Set<number> = new Set();

  constructor(
    private readonly getView: () => EditorView | undefined,
    private readonly getMapping: () => Mapping | undefined,
    private readonly onViewportHint: (from: number, to: number) => void,
  ) {
    // See https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
    this.observer = new IntersectionObserver(
      (entries) => {
        const view = this.getView();
        if (view === undefined) return;
        for (const entry of entries) {
          const domNode = entry.target;
          const pos = view.posAtDOM(domNode, 0);
          if (entry.isIntersecting) {
            this.pmPosOfVisibleNodes.add(pos);
          } else {
            this.pmPosOfVisibleNodes.delete(pos);
          }
        }
        if (this.pmPosOfVisibleNodes.size > 0) {
          const sorted = Array.from(this.pmPosOfVisibleNodes).sort(
            (a, b) => a - b,
          );
          const mapping = this.getMapping();
          const from = mapping?.pmIndexToTextOffset(pmIndex(sorted[0]));
          const to = mapping?.pmIndexToTextOffset(
            pmIndex(sorted[sorted.length - 1]),
          );
          if (from === undefined || to === undefined) return;
          this.onViewportHint(from, to);
        }
      },
      {
        root: null, // use viewport
        threshold: 0.1,
      },
    );
  }

  public reobserve(domNode?: HTMLElement) {
    this.observer.disconnect();
    for (const child of domNode?.children ?? []) {
      this.observer.observe(child);
    }
  }
}
