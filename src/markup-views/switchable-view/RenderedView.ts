import { EditorView } from "prosemirror-view"; // Kept for type definition of outerView if needed
import MarkdownIt from "markdown-it";
import { SwitchableView } from "./SwitchableView";
import { MarkdownOptions } from "../../api";
import { kbdPlugin } from "../../markdown-plugins/kbd";
import { mathPlugin as mdMathPlugin } from "../../markdown-plugins/math";
import { taskLists } from "../../markdown-plugins/taskLists";
import { katex as mdKatex } from "@mdit/plugin-katex";
import { alert } from "@mdit/plugin-alert";
import { imgSize } from "@mdit/plugin-img-size";

// import "@mdit/plugin-alert/style";

export class RenderedView {
  public target: HTMLElement;
  private _outerView: EditorView;
  private _parent: SwitchableView;

  constructor(
    target: HTMLElement,
    content: string,
    outerView: EditorView,
    parent: SwitchableView,
    _getPos: () => number | undefined,
    mdOptions: MarkdownOptions,
  ) {
    this.target = target;
    this._outerView = outerView;
    this._parent = parent;

    // Create a new MarkdownIt renderer with support for html
    // TODO: Don't reconstruct on every call to render :)
    const mdit = (() => {
      let md = new MarkdownIt({ html: mdOptions.enableHTML })
        .disable(mdOptions.disableMarkdownFeatures ?? [])
        .use(kbdPlugin)
        .use(mdMathPlugin)
        .use(taskLists, { enabled: true, label: false, labelAfter: false })
        .use(mdKatex)
        .use(imgSize)
        .use(alert);

      for (const plugin of mdOptions.plugins ?? []) {
        md = md.use(plugin);
      }
      return md;
    })();

    // Render the markdown directly into the target element as HTML
    const mditOutput = mdit.render(content);
    this.target.innerHTML = mditOutput;
  }

  setSelection(_anchor: number, _head: number, _root: Document | ShadowRoot) {
    // Selection handling can be adapted here using standard DOM ranges/selection
    // if needed, or left as a no-op since it's a static rendered view.
    this.target.focus();
  }

  update() {
    return true;
  }

  focus() {
    this.target.focus();
  }

  destroy() {
    this.target.innerHTML = "";
  }
}
