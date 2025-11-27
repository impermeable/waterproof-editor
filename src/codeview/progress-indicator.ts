import { EditorView, Decoration, DecorationSet, gutter, GutterMarker } from "@codemirror/view"
import { StateField, StateEffect, RangeSet, Range } from "@codemirror/state"

export const addProgressIndicatorEffect = StateEffect.define<{from: number, to: number}>({
    map: ({from, to}, change) => ({from: change.mapPos(from), to: change.mapPos(to)})
});

export const removeProgressIndicatorEffect = StateEffect.define();

const checkedMarker = new class extends GutterMarker {
    toDOM(_view: EditorView): Node {
        const el = document.createElement("div");
        el.id = "progress-marker";
        return el;
    }
}

export const progressIndicatorField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none
    },
    update(underlines, tr) {
        underlines = underlines.map(tr.changes);
        
        
        for (const e of tr.effects) {
            if (e.is(addProgressIndicatorEffect)) {
                underlines = underlines.update({
                    // add: [underlineMark.range(e.value.from, e.value.to), progressWidget.range(e.value.to, e.value.to)]
                    // add: [progressWidget.range(e.value.from, e.value.from)]
                });
            } else if (e.is(removeProgressIndicatorEffect)) {
                underlines = underlines.update({filter: () => false});
            }
        }
        
        return underlines
    },
    provide: f => EditorView.decorations.from(f)
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
            if (e.is(addProgressIndicatorEffect)) {
                set = set.update({add: [loadingMarker.range(e.value.from)]});
            } else if (e.is(removeProgressIndicatorEffect)) {
                set = set.update({filter: () => false});
            }
        }
        return set
    }
})

export const progressState = StateField.define<RangeSet<GutterMarker>>({
  create() { return RangeSet.empty },

  update(set, transaction) {
    set = set.map(transaction.changes)

    for (const e of transaction.effects) {
        if (e.is(addProgressIndicatorEffect)) {
        //    const lines = transaction.state.doc.lines;
           const toAdd: Array<Range<GutterMarker>> = [];
           toAdd.push(checkedMarker.range(transaction.state.doc.lineAt(e.value.from).from));
        //    for (let i = 1; i <= lines; i++) {
        //         const line = transaction.state.doc.line(i);
        //         // console.log("hello");
        //         if (line.to < e.value.from)
        //             toAdd.push(checkedMarker.range(line.from));
        //    }
           set = set.update({add: toAdd});
        } else if (e.is(removeProgressIndicatorEffect)) {
            set = set.update({filter: () => false});
        }
    }

    // for (let e of transaction.effects) {
    //   if (e.is(breakpointEffect)) {
    //     if (e.value.on)
    //       set = set.update({add: [breakpointMarker.range(e.value.pos)]})
    //     else
    //       set = set.update({filter: from => from != e.value.pos})
    //   }
    // }
    return set
  }
});

export const progressGutter = gutter({
    side: "before",
    markers: v => v.state.field(progressState),
});

/**
 * The busy indicator is used to display a busy indicator in the editor
 * for lines that take a long time.
 */
export const busyGutter = gutter({
    side: "after", // Display to the right of the editor content
    markers: v => v.state.field(busyIndicatorState),
});
