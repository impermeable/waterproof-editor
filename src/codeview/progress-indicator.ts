import { EditorView, gutter, GutterMarker } from "@codemirror/view";
import { StateField, StateEffect, RangeSet } from "@codemirror/state";

/**
 * Renders an animated "busy" spinner (`.loader` CSS class) in the gutter.
 * The {@link delay} prevents flickering for fast operations that complete
 * before the delay elapses.
 * Is exported for testing purposes.
 */
export class BusyIndicatorMarker extends GutterMarker {
  /**
   * @param delay Milliseconds to wait before making the spinner visible.
   *   This prevents flickering for sentences that finish checking quickly.
   * @param title Tooltip text shown on hover.
   */
  constructor(private readonly delay: number, private readonly title: string) {
    super();
  }

  /**
   * CodeMirror calls this to decide whether two markers are identical and the
   * DOM element can be reused without a re-render.
   * All {@link BusyIndicatorMarker} instances look the same, so any instance
   * is equal to any other.
   *
   * @param other The marker on the other side of the comparison.
   * @returns true when other is also a {@link BusyIndicatorMarker}.
   */
  eq(other: GutterMarker): boolean {
    return other instanceof BusyIndicatorMarker;
  }

  /**
   * Creates the DOM element that CodeMirror inserts into the gutter cell.
   * The element starts invisible; a timer adds the `.loader` class after
   * {@link delay} ms. If CodeMirror removes the element before the timer
   * fires (e.g. the sentence finished checking), the timer is cancelled so
   * the loader never flickers into view.
   *
   * @returns A `<div>` that animates into a busy spinner after the delay.
   */
  toDOM(): Node {
    const el = document.createElement("div");
    const timeoutId = setTimeout(() => {
      el.classList.add("loader");
      el.title = this.title;
    }, this.delay);
    // Cancel the timer if CodeMirror removes the element before it fires.
    el.addEventListener("remove", () => clearTimeout(timeoutId));
    return el;
  }
}

// --- Per-block indicator ---

// delay before showing the busy indicator, in milliseconds.
// This prevents flickering for fast operations.
export const BUSY_INDICATOR_DELAY_MS = 500;

/**
 * Owns the busy-indicator gutter for a single {@link CodeBlockView}.
 *
 * Each block gets its own instance so CodeMirror's effect/state-field identity.
 */
export class CodeBlockBusyIndicator {
  // --- CodeMirror effects ---

  /**
   * Moves the busy marker to a local (per-block CodeMirror) document offset.
   * The `map` function keeps the position valid as the document is edited.
   */
  private readonly setBusyEffect = StateEffect.define<number>({
    map: (pos, change) => change.mapPos(pos),
  });

  /**
   * Removes the busy marker unconditionally.
   */
  private readonly clearBusyEffect = StateEffect.define<void>();

  // --- CodeMirror extensions (registered via getExtensions) ---

  /**
   * A CodeMirror StateField that holds the `RangeSet` of at most one
   * {@link BusyIndicatorMarker} at the currently-checked line.
   */
  private readonly busyState: StateField<RangeSet<GutterMarker>>;

  /**
   * A CodeMirror gutter extension that renders the content of
   * {@link busyState} in a narrow fixed-width column to the right of the
   * editor content.
   */
  private readonly busyGutter: ReturnType<typeof gutter>;

  // --- Deduplication cache ---

  /**
   * The local CodeMirror offset at which the busy marker was last placed, or
   * null when the marker is not currently shown. Used to skip redundant
   * dispatches when the checked line hasn't changed.
   */
  private currentBusyPos: number | null = null;

  constructor() {
    const busyMarker = new BusyIndicatorMarker(
      BUSY_INDICATOR_DELAY_MS,
      "Waterproof is busy checking the statement(s) on this line...",
    );

    this.busyState = StateField.define<RangeSet<GutterMarker>>({
      create: () => RangeSet.empty,
      update: (set, tr) => {
        set = set.map(tr.changes); // keep marker in sync with edits
        for (const e of tr.effects) {
          if (e.is(this.setBusyEffect))
            set = RangeSet.of([busyMarker.range(e.value)]);
          // replace any existing marker with a new one at the specified position
          else if (e.is(this.clearBusyEffect)) set = RangeSet.empty; // clear all markers
        }
        return set;
      },
    });

    this.busyGutter = gutter({
      class: "cm-busy-gutter",
      markers: (v) => v.state.field(this.busyState),
      side: "after", // Display after the editor content (right side)

      // The code-mirror docs recommend using initialSpacer, however we are setting the intial space in the CSS,
      // because this does not take into account the box-shadow.
      // This should be fine since we know the width of the gutter and the loader,
      // so we can set the CSS variable to the correct value.

      // initialSpacer: () => busyMarker
    });
  }

  /**
   * Returns the CodeMirror extensions that must be included in this
   * block's editor config (called once during {@link CodeBlockView} construction).
   *
   * @returns An array containing the {@link busyState} StateField and the
   *   {@link busyGutter} gutter extension.
   */
  public getExtensions() {
    return [this.busyState, this.busyGutter];
  }

  // --- Public API ---

  /**
   * Show the busy indicator on the line that contains {@link globalPos}
   * (a ProseMirror document offset).
   *
   * - Translates the global ProseMirror offset to a local CodeMirror offset.
   * - Clamps it to the block's content range.
   * - Skips the dispatch if the indicator is already on the same line.
   * - Clears the indicator when {@link globalPos} falls outside this block.
   *
   * @param view The CodeMirror `EditorView` for this block.
   * @param globalPos The ProseMirror document offset of the sentence
   *   currently being checked. This is in the global ProseMirror coordinate
   *   space, not the local CodeMirror space.
   * @param blockStartPos The ProseMirror position of the start of this block, as
   *   returned by the ProseMirror `getPos()` callback. undefined means the
   *   node is no longer in the document.
   */
  public setBusy(
    view: EditorView,
    globalPos: number,
    blockStartPos: number | undefined,
  ): void {
    if (blockStartPos === undefined) return;
    const maxPos = view.state.doc.length + blockStartPos + 1;

    if (globalPos > maxPos || globalPos < blockStartPos) {
      // Outside this block - clear if we were previously showing.
      if (this.currentBusyPos !== null) this.dispatchClearBusy(view);
      return;
    }

    const localOffset = globalPos - blockStartPos - 1;
    const clamped = Math.max(0, Math.min(localOffset, view.state.doc.length));
    const localPos = view.state.doc.lineAt(clamped).from;

    // Skip if the busy indicator is already at the correct line.
    // Perhaps redundant because there is a similar check in the editor's setBusyIndicator,
    // but this prevents unnecessary dispatches and state updates when the offset has moved within the same line.
    if (this.currentBusyPos !== localPos) {
      view.dispatch({
        effects: this.setBusyEffect.of(localPos),
      });
      this.currentBusyPos = localPos;
    }
  }

  /**
   * Remove the busy indicator unconditionally.
   *
   * @param view The CodeMirror `EditorView` for this block.
   */
  public clearBusy(view: EditorView): void {
    this.dispatchClearBusy(view);
  }

  // --- Private helpers ---

  /**
   * Dispatches the {@link clearBusyEffect} to clear the busy indicator.
   *
   * @param view The CodeMirror `EditorView` to dispatch to.
   */
  private dispatchClearBusy(view: EditorView): void {
    view.dispatch({
      effects: this.clearBusyEffect.of(undefined),
    });
    this.currentBusyPos = null;
  }
}
