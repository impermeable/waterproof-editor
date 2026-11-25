import { EditorView } from "prosemirror-view";
import { Mapping, pmIndex } from "./mapping";

/**
 * Handles intersection observation of editor DOM nodes to compute and emit viewport hints.
 */
export class ViewportObserver {
  private observer: IntersectionObserver;
  private pmPosOfVisibleNodes: Set<number> = new Set();

  /**
   * @param getView Function used to return the current view.
   * @param getMapping Function used to return the current mapping.
   * @param onViweportHint The `ViewportObserver` will use this callback to notify about a new viewport hint.
   */
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

        // `entries` contains all the DOM nodes that have a changed intersection state.
        for (const entry of entries) {
          const domNode = entry.target;
          const pos = view.posAtDOM(domNode, 0);
          if (entry.isIntersecting) {
            // This entry entered the viewport, we add its ProseMirror position to
            // visible node positions.
            this.pmPosOfVisibleNodes.add(pos);
          } else {
            // This entry exited the viewport, remove it from the visible positions.
            this.pmPosOfVisibleNodes.delete(pos);
          }
        }

        if (this.pmPosOfVisibleNodes.size > 0) {
          // TODO: This might not actually be needed, as the positions appear to always be inserted in the order of the DOM tree.
          const sorted = Array.from(this.pmPosOfVisibleNodes).sort(
            (a, b) => a - b,
          );
          // Use the mapping to compute the text offsets of the part of the document that is visible within the viewport.
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
        root: null, // Compare intersections against the viewport.
        threshold: 0.1, // Use a threshold of 10%
      },
    );
  }

  // This function should be called when the DOM nodes in the editor have changed.
  // For example after every node change (deletion, insertion, etc) that happens in the document.
  public reobserve(domNode?: HTMLElement) {
    // Disconnect the observer to remove all 'observed' DOM nodes.
    this.observer.disconnect();
    // Reobserve all direct child nodes of the editor DOM node.
    for (const child of domNode?.children ?? []) {
      this.observer.observe(child);
    }
  }
}
