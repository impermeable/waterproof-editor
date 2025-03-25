import { EditorView as CodeMirror, Command, KeyBinding, ViewUpdate } from "@codemirror/view";
import { Node as PNode, Schema } from "prosemirror-model";
import { Decoration, DecorationSource, EditorView, NodeView } from "prosemirror-view";
import { MovementDirection, MovementUnit } from "./types";
/**
 * A class implementing everything required to create an embedded codemirror editor for prosemirror.
 * Implements the `NodeView` prosemirror class. Can be extended to create custom codemirror editors like
 * the one used to edit markdown or coq.
 */
export declare class EmbeddedCodeMirrorEditor implements NodeView {
    _getPos: (() => number | undefined);
    protected updating: boolean;
    protected _codemirror: CodeMirror | undefined;
    protected _outerView: EditorView;
    protected _schema: Schema;
    protected _node: PNode;
    constructor(node: PNode, view: EditorView, getPos: (() => number | undefined), schema: Schema);
    dom: Node;
    contentDOM?: HTMLElement | null | undefined;
    update(node: PNode, _decorations: readonly Decoration[], _innerDecorations: DecorationSource): boolean;
    selectNode?: (() => void) | undefined;
    deselectNode?: (() => void) | undefined;
    setSelection(anchor: number, head: number, _root: Document | ShadowRoot): void;
    stopEvent?: ((event: Event) => boolean) | undefined;
    ignoreMutation?: ((mutation: MutationRecord) => boolean) | undefined;
    destroy?(): void;
    forwardUpdate(update: ViewUpdate): void;
    /**
     * Do a movement, but first check if we escape the current view.
     *
     * The command returns false when we **will not** escape the current view.
     *
     * @param unit The movement unit (could be a line (up and down) or a character (left to right))
     * @param dir The direction either forward or backward.
     * @returns A command handling the escaping.
     */
    maybeEscape(unit: MovementUnit, dir: MovementDirection): Command;
    embeddedCodeMirrorKeymap(): KeyBinding[];
}
//# sourceMappingURL=embeddedCodemirror.d.ts.map