import { Node as ProseNode } from "prosemirror-model";
import { ReplaceStep } from "prosemirror-transform";
import { Plugin, PluginKey, PluginSpec } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Widgets } from "../api";
import { Widget } from "./widget";
import { AbstractWidget } from "./abstractWidget";

type WidgetPluginState = {
  activeNodeViews: Set<AbstractWidget>;
};

export const WIDGET_PLUGIN_KEY = new PluginKey<WidgetPluginState>(
  "waterproof-widget-plugin",
);

class WidgetError extends Error {
  constructor(message: string) {
    super("[WidgetError] " + message);
  }
}

function widgetTypeFromNode(node: ProseNode): string {
  const widgetType = node.attrs.type;
  return typeof widgetType === "string" ? widgetType : "";
}

function createWidgetInstance(widgetDefinitions: Required<Widgets>) {
  // Function that given a prosenode constructs a widget
  return (
    node: ProseNode,
    view: EditorView,
    getPos: () => number | undefined,
  ): AbstractWidget => {
    const pluginState = WIDGET_PLUGIN_KEY.getState(view.state);
    if (!pluginState) {
      throw new WidgetError("Could not retrieve widget plugin state");
    }

    const widgetType: string = widgetTypeFromNode(node);
    console.log("TRYING TO CREATE", widgetType);
    const widgetConstructor = widgetDefinitions.simple[widgetType];
    if (widgetConstructor === undefined) {
      const containerWidgetConstructor =
        widgetDefinitions.container[widgetType];
      if (containerWidgetConstructor === undefined) {
        throw new WidgetError(`No widget registered for type "${widgetType}"`);
      }
      const widget = new containerWidgetConstructor(
        { node, getPos, view },
        node,
      );
      pluginState.activeNodeViews.add(widget);
      return widget;
    }

    const widget = new widgetConstructor(
      { node, getPos, view },
      node.textContent,
    );

    pluginState.activeNodeViews.add(widget);

    return widget;
  };
}

const widgetPluginSpec = (
  widgetDefinitions: Required<Widgets>,
): PluginSpec<WidgetPluginState> => {
  return {
    key: WIDGET_PLUGIN_KEY,
    state: {
      init() {
        return {
          activeNodeViews: new Set<Widget>(),
        };
      },
      apply(tr, value) {
        if (tr.steps.length > 0) {
          for (const step of tr.steps) {
            if (
              step instanceof ReplaceStep &&
              step.slice.content.firstChild === null
            ) {
              for (const widget of Array.from(value.activeNodeViews)) {
                const pos = widget.getPos();
                if (pos === undefined || (pos >= step.from && pos < step.to)) {
                  value.activeNodeViews.delete(widget);
                }
              }
            }
          }
        }

        for (const widget of Array.from(value.activeNodeViews)) {
          if (widget.getPos() === undefined) {
            value.activeNodeViews.delete(widget);
          }
        }

        return value;
      },
    },
    props: {
      nodeViews: {
        widget: createWidgetInstance(widgetDefinitions),
        containerWidget: createWidgetInstance(widgetDefinitions),
      },
    },
  };
};

export const widgetPlugin = (widgetDefinitions: Required<Widgets>) => {
  return new Plugin(widgetPluginSpec(widgetDefinitions));
};
