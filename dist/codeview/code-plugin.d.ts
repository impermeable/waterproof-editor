import { Schema, Node as ProseNode } from "prosemirror-model";
import { Plugin as ProsePlugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { CodeBlockView } from "./nodeview";
import { LineNumber, WaterproofCompletion, WaterproofSymbol } from "../api";
import { Completion } from "@codemirror/autocomplete";
export interface ICodePluginState {
    macros: {
        [cmd: string]: string;
    };
    /** A list of currently active `NodeView`s, in insertion order. */
    activeNodeViews: Set<CodeBlockView>;
    /** The schema of the outer editor */
    schema: Schema;
    /** Should the codemirror cells show line numbers */
    showLines: boolean;
    /** The lastest versioned linenumbers */
    lines: LineNumber;
}
export declare const CODE_PLUGIN_KEY: PluginKey<ICodePluginState>;
/**
 * Returns a function suitable for passing as a field in `EditorProps.nodeViews`.
 * @see https://prosemirror.net/docs/ref/#view.EditorProps.nodeViews
 */
export declare function createCoqCodeView(completions: Array<Completion>, symbols: Array<Completion>): (node: ProseNode, view: EditorView, getPos: () => number | undefined) => CodeBlockView;
export declare const codePlugin: (completions: Array<WaterproofCompletion>, symbols: Array<WaterproofSymbol>) => ProsePlugin<ICodePluginState>;
//# sourceMappingURL=code-plugin.d.ts.map