import { EditorView } from "prosemirror-view";
import { SwitchableView } from "./SwitchableView";
export declare class RenderedView {
    view: EditorView;
    private _outerView;
    private _parent;
    constructor(target: HTMLElement, content: string, outerView: EditorView, parent: SwitchableView, usingCoqdocSyntax: boolean, _getPos: (() => number | undefined));
    setSelection(anchor: number, head: number, _root: Document | ShadowRoot): void;
    update(): boolean;
    focus(): void;
    destroy(): void;
}
//# sourceMappingURL=RenderedView.d.ts.map