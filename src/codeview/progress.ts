import { EditorView, gutter, GutterMarker } from "@codemirror/view"
import { StateField, StateEffect, RangeSet } from "@codemirror/state"

export const addProgressIndicatorEffect = StateEffect.define<number>({
    map: (pos, change) => change.mapPos(pos)
});
export const removeProgressIndicatorEffect = StateEffect.define();

const checkedMarker = new class extends GutterMarker {
    toDOM(_view: EditorView): Node {
        const el = document.createElement("div");
        el.id = "progress-marker";
        return el;
    }
}

export const progressIndicatorState = StateField.define<RangeSet<GutterMarker>>({
    create() {
        return RangeSet.empty;
    },
    update(set, tr) {
        set = set.map(tr.changes);
        for (const e of tr.effects) {
            if (e.is(addProgressIndicatorEffect)) {
                set = RangeSet.of(checkedMarker.range(e.value));
            } else if (e.is(removeProgressIndicatorEffect)) {
                set = RangeSet.empty;
            }
        }
        return set
    }
});

/**
 * The progress gutter is used to add an invisible element into the editor that is used to
 * display the progress line.
 */
export const progressGutter = gutter({
    side: "before",
    markers: v => v.state.field(progressIndicatorState),
});