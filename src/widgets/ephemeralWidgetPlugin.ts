import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { Plugin, PluginKey, Transaction } from "prosemirror-state";

export type EphemeralWidgetContext = {
  pos: number;
  view: EditorView;
};

export type EphemeralWidgetSpec = {
  id: string;
  pos: number;
  side?: number;
  stopEvent?: (event: Event) => boolean;
  ignoreSelection?: boolean;
  render: (context: EphemeralWidgetContext) => HTMLElement;
};

type EphemeralWidgetPluginState = {
  widgets: EphemeralWidgetSpec[];
};

export const EPHEMERAL_WIDGET_PLUGIN_KEY =
  new PluginKey<EphemeralWidgetPluginState>(
    "waterproof-ephemeral-widget-plugin",
  );

export function setEphemeralWidgets(
  tr: Transaction,
  widgets: EphemeralWidgetSpec[],
): Transaction {
  return tr.setMeta(EPHEMERAL_WIDGET_PLUGIN_KEY, {
    widgets,
  } satisfies EphemeralWidgetPluginState);
}

function mapWidgets(
  widgets: EphemeralWidgetSpec[],
  tr: Transaction,
): EphemeralWidgetSpec[] {
  return widgets
    .map((widget) => {
      const mapped = tr.mapping.mapResult(widget.pos, widget.side ?? 1);
      if (mapped.deleted) return null;
      return { ...widget, pos: mapped.pos };
    })
    .filter((v) => {
      return v !== null;
    });
}

function widgetsToDecorations(widgets: EphemeralWidgetSpec[]): Decoration[] {
  return widgets.map((widget) => {
    return Decoration.widget(
      widget.pos,
      (view) => widget.render({ pos: widget.pos, view }),
      {
        key: widget.id,
        side: widget.side ?? 1,
        stopEvent: widget.stopEvent,
        ignoreSelection: widget.ignoreSelection,
      },
    );
  });
}

export const createEphemeralWidgetPlugin = (
  initialWidgets: EphemeralWidgetSpec[] = [],
) => {
  return new Plugin<EphemeralWidgetPluginState>({
    key: EPHEMERAL_WIDGET_PLUGIN_KEY,
    state: {
      init() {
        return {
          widgets: initialWidgets,
        };
      },
      apply(tr, value) {
        const meta = tr.getMeta(EPHEMERAL_WIDGET_PLUGIN_KEY) as
          | EphemeralWidgetPluginState
          | undefined;
        if (meta) {
          return {
            widgets: meta.widgets,
          };
        }

        if (!tr.docChanged) {
          return value;
        }

        return {
          widgets: mapWidgets(value.widgets, tr),
        };
      },
    },
    props: {
      decorations(state) {
        const pluginState = EPHEMERAL_WIDGET_PLUGIN_KEY.getState(state);
        if (!pluginState || pluginState.widgets.length === 0) return null;
        return DecorationSet.create(
          state.doc,
          widgetsToDecorations(pluginState.widgets),
        );
      },
    },
  });
};
