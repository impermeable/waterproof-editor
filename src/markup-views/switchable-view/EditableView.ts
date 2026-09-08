import {
  EditorView as CodeMirror,
  keymap as cmKeymap,
  placeholder,
} from "@codemirror/view";

import { Node, Schema } from "prosemirror-model";
import { PluginKey, TextSelection, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { SwitchableView } from "./SwitchableView";
import { editorTheme } from "./EditorTheme";
import { renderIcon } from "../../autocomplete";
import { autocompletion } from "@codemirror/autocomplete";
import { EmbeddedCodeMirrorEditor } from "../../embedded-codemirror";

/**
 * Export CodeBlockView class that implements the custom codeblock nodeview.
 * Corresponds with the example as can be found here:
 * https://prosemirror.net/examples/codemirror/
 */

export class EditableView extends EmbeddedCodeMirrorEditor {
  public view: CodeMirror;
  private _parent: SwitchableView;
  private _pluginKey: PluginKey;

  constructor(
    node: Node,
    outerView: EditorView,
    schema: Schema,
    getPos: () => number | undefined,
    place: HTMLElement,
    parent: SwitchableView,
    pluginKey: PluginKey,
  ) {
    super(node, outerView, getPos, schema);
    this._node = node;
    this._parent = parent;
    this._outerView = outerView;
    this._getPos = getPos;
    this._schema = schema;
    this._pluginKey = pluginKey;
    this.view = new CodeMirror({
      doc: this._node.textContent,
      extensions: [
        cmKeymap.of([...this.embeddedCodeMirrorKeymap()]),
        CodeMirror.updateListener.of((update) => this.forwardUpdate(update)),
        placeholder("Empty..."),
        autocompletion({
          // In the markdown / code editing add the symbol and emoji completions.
          // override: [symbolCompletionSource],
          icons: false,
          addToOptions: [renderIcon],
        }),
        CodeMirror.lineWrapping,
        editorTheme,
      ],
    });
    place.appendChild(this.view.dom);
  }

  focus() {
    this.view.focus();
  }
  destroy() {
    this.view.destroy();
  }

  // The shared EmbeddedCodeMirrorEditor logic operates on `this.view`...
  protected get innerEditor(): CodeMirror {
    return this.view;
  }

  // ...tracks the syncing state on the parent SwitchableView...
  protected get isSyncing(): boolean {
    return this._parent.updating;
  }

  protected set isSyncing(value: boolean) {
    this._parent.updating = value;
  }

  // ...and records the resulting selection as plugin metadata instead of
  // setting it on the transaction directly.
  protected applySelection(tr: Transaction, selection: TextSelection): void {
    tr.setMeta(this._pluginKey, selection);
  }
}
