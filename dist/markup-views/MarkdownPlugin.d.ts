import { Schema, Node as ProseNode } from "prosemirror-model";
import { Plugin as ProsePlugin, PluginKey, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { MarkdownView } from "./MarkdownView";
export interface IRealMarkdownPluginState {
    macros: {
        [cmd: string]: string;
    };
    /** A list of currently active `NodeView`s, in insertion order. */
    activeNodeViews: MarkdownView[];
    /** The selection of the current cursor position */
    cursor: TextSelection | undefined;
}
export declare const REAL_MARKDOWN_PLUGIN_KEY: PluginKey<IRealMarkdownPluginState>;
/**
 * Returns a function suitable for passing as a field in `EditorProps.nodeViews`.
 * @see https://prosemirror.net/docs/ref/#view.EditorProps.nodeViews
 */
export declare function createRealMarkdownView(schema: Schema): (node: ProseNode, view: EditorView, getPos: (() => number | undefined)) => MarkdownView;
export declare const realMarkdownPlugin: (schema: Schema) => ProsePlugin<IRealMarkdownPluginState>;
//# sourceMappingURL=MarkdownPlugin.d.ts.map