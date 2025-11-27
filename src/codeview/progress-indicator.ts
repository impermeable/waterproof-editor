import { EditorView, Decoration, gutter, GutterMarker, DecorationSet } from "@codemirror/view"
import { StateField, StateEffect, RangeSet } from "@codemirror/state"

export const addProgressIndicatorEffect = StateEffect.define<number>({
    map: (pos, change) => change.mapPos(pos)
});
export const removeProgressIndicatorEffect = StateEffect.define();

export const addBusyIndicatorEffect = StateEffect.define<number>({
    map: (pos, change) => change.mapPos(pos)
});
export const removeBusyIndicatorEffect = StateEffect.define();

const checkedMarker = new class extends GutterMarker {
    toDOM(_view: EditorView): Node {
        const el = document.createElement("div");
        el.id = "progress-marker";
        el.style.height = "1em";
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

const delay = 2000; //ms

const loadingMarker = new class extends GutterMarker {
    toDOM() {
        const divEl = document.createElement("div");
        // The function of this timeout is to only show the loading animation
        // after the line has been processing for over delay ms.
        setTimeout(() => {
            divEl.classList.add("loader");
            divEl.title = "Waterproof is busy checking the statement(s) on this line...";
        }, delay);
        return divEl;
    }
}

export const busyIndicatorState = StateField.define<RangeSet<GutterMarker>>({
    create() { return RangeSet.empty },
    
    update(set, transaction) {
        set = set.map(transaction.changes)
        for (const e of transaction.effects) {
            if (e.is(addBusyIndicatorEffect)) {
                set = RangeSet.of(loadingMarker.range(e.value));
            } else if (e.is(removeBusyIndicatorEffect)) {
                set = RangeSet.empty;
            }
        }
        return set;
    }
});

/**
 * The busy indicator is used to display an indicator in the editor
 * for lines that take a long time.
 */
export const busyGutter = gutter({
    side: "after", // Display to the right of the editor content
    markers: v => v.state.field(busyIndicatorState),
});

/**
 * The progress gutter is used to add an invisible element into the editor that is used to
 * display the progress line.
 */
export const progressGutter = gutter({
    side: "before",
    markers: v => v.state.field(progressIndicatorState),
});
