import { PluginKey } from "prosemirror-state";
import { SwitchableView } from "./switchable-view";
import { EditorView } from "prosemirror-view";
import { Node as PNode, Schema } from "prosemirror-model";
/**
 * CoqdocView class extends the SwitchableView class.
 *
 * Used to edit and render coqdoc syntax within the prosemirror editor.
 */
export declare class CoqdocView extends SwitchableView {
    constructor(getPos: (() => number | undefined), outerView: EditorView, content: string, node: PNode, schema: Schema, pluginKey: PluginKey, viewName: string);
    preprocessContentForEditing(input: string): string;
    preprocessContentForRendering(input: string): string;
}
//# sourceMappingURL=CoqdocView.d.ts.map