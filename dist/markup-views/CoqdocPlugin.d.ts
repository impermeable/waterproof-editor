import { Schema, Node as ProseNode } from "prosemirror-model";
import { Plugin as ProsePlugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { CoqdocView } from "./CoqdocView";
export interface ICoqdocPluginState {
    macros: {
        [cmd: string]: string;
    };
    /** A list of currently active `NodeView`s, in insertion order. */
    activeNodeViews: CoqdocView[];
}
export declare const COQDOC_PLUGIN_KEY: PluginKey<ICoqdocPluginState>;
/**
 * Returns a function suitable for passing as a field in `EditorProps.nodeViews`.
 * @see https://prosemirror.net/docs/ref/#view.EditorProps.nodeViews
 */
export declare function createCoqdocView(schema: Schema): (node: ProseNode, view: EditorView, getPos: () => number | undefined) => CoqdocView;
export declare const coqdocPlugin: (schema: Schema) => ProsePlugin<ICoqdocPluginState>;
//# sourceMappingURL=CoqdocPlugin.d.ts.map