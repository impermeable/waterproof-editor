import { EditorView, Decoration, DecorationSet, WidgetType, gutter, GutterMarker } from "@codemirror/view"
import { StateField, StateEffect, RangeSet, Range } from "@codemirror/state"

export const addProgressIndicatorEffect = StateEffect.define<{from: number, to: number}>({
  map: ({from, to}, change) => ({from: change.mapPos(from), to: change.mapPos(to)})
});

export const removeProgressIndicatorEffect = StateEffect.define();

export const underlineMark = Decoration.mark({
    attributes: {
        style: "background-color: yellow;",
    },
});

export class ProgressWidget extends WidgetType {
    toDOM(_view: EditorView): HTMLElement {
        const el = document.createElement("div");
        el.classList.add("loader");
        el.innerText = "Waterproof is busy checking the lines below...";
        return el;
    }
    eq(_widget: WidgetType): boolean {
        return true;
    }

}


export const progressWidget = Decoration.widget({ widget: new ProgressWidget(), side: 100 });

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
                add: [progressWidget.range(e.value.to, e.value.to)]
            });
        } else if (e.is(removeProgressIndicatorEffect)) {
            underlines = underlines.update({filter: () => false});
        }
    }

    return underlines
  },
  provide: f => EditorView.decorations.from(f)
});

const emptyMarker = new class extends GutterMarker {
  toDOM() { return document.createTextNode("✔️") }
}

const otherMarker = new class extends GutterMarker {
  toDOM() { 
    const node = document.createElement("span");
    node.innerText = " ";

    node.style.backgroundColor = "yellow";
    node.style.height = "100%";
    return node;
  }
}

export const breakpointState = StateField.define<RangeSet<GutterMarker>>({
  create() { return RangeSet.empty },

  update(set, transaction) {
    set = set.map(transaction.changes)

    for (const e of transaction.effects) {
        if (e.is(addProgressIndicatorEffect)) {
           const lines = transaction.state.doc.lines;
           const toAdd: Array<Range<GutterMarker>> = [];
           for (let i = 1; i <= lines; i++) {
                const line = transaction.state.doc.line(i);
                console.log("hello");
                if (line.to < e.value.from)
                    toAdd.push(emptyMarker.range(line.from));
                else
                    toAdd.push(otherMarker.range(line.from));
           }
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
})

export const progressGutter = gutter({
    side: "after",
    initialSpacer: () => emptyMarker,
    markers: v => v.state.field(breakpointState),
});