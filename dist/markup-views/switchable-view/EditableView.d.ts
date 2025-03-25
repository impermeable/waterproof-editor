import { EditorView as CodeMirror, ViewUpdate } from "@codemirror/view";
import { Node, Schema } from "prosemirror-model";
import { PluginKey } from "prosemirror-state";
import { Decoration, EditorView } from "prosemirror-view";
import { SwitchableView } from "./SwitchableView";
import { EmbeddedCodeMirrorEditor } from "../../embedded-codemirror";
/**
 * Export CodeBlockView class that implements the custom codeblock nodeview.
 * Corresponds with the example as can be found here:
 * https://prosemirror.net/examples/codemirror/
 */
export declare class EditableView extends EmbeddedCodeMirrorEditor {
    view: CodeMirror;
    private _parent;
    private _pluginKey;
    constructor(node: Node, outerView: EditorView, schema: Schema, getPos: (() => number | undefined), place: HTMLElement, parent: SwitchableView, pluginKey: PluginKey);
    focus(): void;
    destroy(): void;
    forwardUpdate(update: ViewUpdate): void;
    update(node: Node, _decorations: readonly Decoration[]): boolean;
}
//# sourceMappingURL=EditableView.d.ts.map