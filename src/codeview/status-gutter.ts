import { gutter, GutterMarker } from "@codemirror/view";

/** Empty marker; keeps the spacer gutter's reserved width. */
class StatusSpacerMarker extends GutterMarker {
  toDOM(): Node {
    return document.createElement("div");
  }
}

/**
 * Reserves the proof-status column on the far left of standalone codeblocks,
 * so their line numbers align with input-area codeblocks (which reserve it via
 * their `.inputarea` wrapper).
 */
export const statusIndicatorSpacer = gutter({
  class: "cm-status-spacer",
  initialSpacer: () => new StatusSpacerMarker(),
});
