/*---------------------------------------------------------
 *  Adapted from https://github.com/benrbray/prosemirror-math/blob/master/src/math-plugin.ts
 *--------------------------------------------------------*/

// prosemirror imports
import { Schema, Node as ProseNode } from "prosemirror-model";
import {
  Plugin as ProsePlugin,
  PluginKey,
  PluginSpec,
} from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { CodeBlockView } from "./nodeview";
import { ReplaceStep } from "prosemirror-transform";
import {
  LanguageConfiguration,
  ThemeStyle,
  WaterproofCompletion,
  WaterproofSymbol,
} from "../api";
import { Completion, snippetCompletion } from "@codemirror/autocomplete";
import { WaterproofEditor } from "../editor";

////////////////////////////////////////////////////////////

export interface ICodePluginState {
  macros: { [cmd: string]: string };
  /** A set of currently active `NodeView`s in insertion order. Note that insertion order does not necessarily match document order */
  activeNodeViews: Set<CodeBlockView>;
  /** The schema of the outer editor */
  schema: Schema;
  /** Should the codemirror cells show line numbers */
  showLines: boolean;
  /** The lastest versioned linenumbers */
  lines: Array<number>;
}

export const CODE_PLUGIN_KEY = new PluginKey<ICodePluginState>(
  "waterproof-editor-code-plugin",
);

/**
 * Returns a function suitable for passing as a field in `EditorProps.nodeViews`.
 * @see https://prosemirror.net/docs/ref/#view.EditorProps.nodeViews
 */
export function createCodeBlockView(
  completions: Array<Completion>,
  symbols: Array<Completion>,
  editorInstance: WaterproofEditor,
  initialThemeStyle: ThemeStyle,
  languageConfig?: LanguageConfiguration,
) {
  return (
    node: ProseNode,
    view: EditorView,
    getPos: () => number | undefined,
  ): CodeBlockView => {
    /** @todo is this necessary?
     * Docs says that for any function proprs, the current plugin instance
     * will be bound to `this`.  However, the typings don't reflect this.
     */
    const pluginState = CODE_PLUGIN_KEY.getState(view.state);
    if (!pluginState) {
      throw new Error("no codemirror code plugin!");
    }
    const nodeViews = pluginState.activeNodeViews;

    // set up NodeView
    const nodeView = new CodeBlockView(
      node,
      view,
      editorInstance,
      getPos,
      pluginState.schema,
      completions,
      symbols,
      initialThemeStyle,
      languageConfig,
    );

    nodeViews.add(nodeView);

    return nodeView;
  };
}

const codePluginSpec = (
  completions: Array<Completion>,
  symbols: Array<Completion>,
  editorInstance: WaterproofEditor,
  initialThemeStyle: ThemeStyle,
  languageConfig?: LanguageConfiguration,
): PluginSpec<ICodePluginState> => {
  return {
    key: CODE_PLUGIN_KEY,
    state: {
      init(config, instance) {
        return {
          macros: {},
          activeNodeViews: new Set<CodeBlockView>(),
          showLines: false,
          schema: instance.schema,
          lines: [],
        };
      },
      apply(tr, value, _oldState, _newState) {
        // produce updated state field for this plugin
        let lineState = value.showLines;
        let newlines = value.lines;
        // Check if a node has been deleted
        if (tr.steps.length > 0) {
          for (const step of tr.steps) {
            if (
              step instanceof ReplaceStep &&
              step.slice.content.firstChild === null
            ) {
              for (const view of value.activeNodeViews) {
                const pos = view._getPos();
                if (pos === undefined || (pos >= step.from && pos < step.to)) {
                  value.activeNodeViews.delete(view);
                }
              }
            }
          }
        }

        // Prune stale views whose NodeView was destroyed by ProseMirror
        // (e.g. after a ReplaceAroundStep / lift that recreates a NodeView).
        for (const view of value.activeNodeViews) {
          if (view._getPos() === undefined) {
            value.activeNodeViews.delete(view);
          }
        }

        // Update the state
        const meta = tr.getMeta(CODE_PLUGIN_KEY);
        if (meta) {
          if (meta.setting === "update") lineState = meta.show;
          else newlines = meta;

          if (value.activeNodeViews.size == newlines.length) {
            // Sort by document position so line numbers align with computeLineNumbers() order
            const sorted = [...value.activeNodeViews].sort(
              (a, b) => (a._getPos() ?? 0) - (b._getPos() ?? 0),
            );
            for (let i = 0; i < sorted.length; i++) {
              sorted[i].updateLineNumbers(newlines[i] + 1, lineState);
            }
          }
        }
        return {
          // these values are left unchanged
          activeNodeViews: value.activeNodeViews,
          macros: value.macros,
          schema: value.schema,
          showLines: lineState,
          lines: newlines,
        };
      },
    },
    props: {
      nodeViews: {
        code: createCodeBlockView(
          completions,
          symbols,
          editorInstance,
          initialThemeStyle,
          languageConfig,
        ),
      },
    },
  };
};

export const codePlugin = (
  completions: Array<WaterproofCompletion>,
  symbols: Array<WaterproofSymbol>,
  editorInstance: WaterproofEditor,
  initialThemeStyle: ThemeStyle,
  languageConfig?: LanguageConfiguration,
) => {
  // Here we turn the waterproof completions into proper codemirror completions
  //   with template 'holes'
  const cmCompletions = completions.map((value) => {
    return snippetCompletion(value.template, value);
  });
  return new ProsePlugin(
    codePluginSpec(
      cmCompletions,
      symbols,
      editorInstance,
      initialThemeStyle,
      languageConfig,
    ),
  );
};
