import { EditorView } from "prosemirror-view";
import { SwitchableView } from "./switchable-view";
import { Node as PNode, Schema } from "prosemirror-model";
import { PluginKey } from "prosemirror-state";
/**
 * MarkdownView class extends the SwitchableView class.
 *
 * Used to edit and render markdown within the prosemirror editor.
 */
export declare class MarkdownView extends SwitchableView {
    constructor(getPos: (() => number | undefined), outerView: EditorView, content: string, node: PNode, schema: Schema, pluginKey: PluginKey, viewName: string);
    preprocessContentForEditing(input: string): string;
    preprocessContentForRendering(input: string): string;
}
//# sourceMappingURL=MarkdownView.d.ts.map