import { Decoration, EditorView, NodeView } from "prosemirror-view";
import { PluginKey } from "prosemirror-state";
import { Node as PNode, Schema } from "prosemirror-model";
/**
 * Abstract class for a switchable view.
 * Switchable views allow for editing and rendering.
 */
export declare abstract class SwitchableView implements NodeView {
    /** The DOM for this nodeview. */
    dom: HTMLElement;
    /** The currently active view. */
    private view;
    /** Whether we are in rendered mode */
    private inRenderMode;
    /** The place to insert the views into */
    private _place;
    /** The outer prosemirror editor */
    private _outerView;
    /** The node that is passed when constructing the NodeView */
    private _node;
    /** Represents whether the view is currently updating */
    private _updating;
    private _getPos;
    private _outerSchema;
    private _viewName;
    private _pluginKey;
    private _emptyClassName;
    private _viewClassName;
    private _editorClassName;
    private _renderedClassName;
    private _usingCoqdocSyntax;
    get content(): string;
    constructor(getPos: (() => number | undefined), outerView: EditorView, content: string, node: PNode, schema: Schema, pluginKey: PluginKey, viewName: string, usingCoqdocSyntax: boolean);
    /**
     * Returns whether this view is currently in the updating state.
     */
    get isUpdating(): boolean;
    /**
     * Overwrite the updating state of this node.
     */
    set updating(update: boolean);
    /**
     * Switch to the rendered view.
     * This destroys the view currently in place and then adds a new rendered view.
     */
    makeRenderedView(): void;
    /**
     * Switch to the editable view.
     * This destroys the view currently in place and then adds a new editable view.
     */
    makeEditableView(): void;
    abstract preprocessContentForEditing(input: string): string;
    abstract preprocessContentForRendering(input: string): string;
    update(node: PNode, decorations: readonly Decoration[]): boolean;
    selectNode(): void;
    deselectNode(): void;
    setSelection(anchor: number, head: number, root: Document | ShadowRoot): void;
    stopEvent(event: Event): boolean;
    ignoreMutation(): boolean;
    destroy(): void;
}
//# sourceMappingURL=SwitchableView.d.ts.map