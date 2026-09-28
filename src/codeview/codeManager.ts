import { Completion } from "@codemirror/autocomplete";
import { WaterproofEditor } from "../editor";
import { LanguageConfiguration, ThemeStyle } from "../api";
import { Node } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { CodeBlockView } from "./nodeview";

/**
 * Class that manages the code cells in the Waterproof editor
 */
export class CodeManager {
  /** Sorted by position in the document */
  private activeViews: CodeBlockView[] = [];

  private showLineNumbers: boolean;
  private editorInstance: WaterproofEditor;
  private themeStyle: ThemeStyle;
  private languageConfig: LanguageConfiguration | undefined;
  private completions: Array<Completion>;
  private symbols: Array<Completion>;

  constructor(
    editor: WaterproofEditor,
    initialThemeStyle: ThemeStyle,
    completions: Array<Completion>,
    symbols: Array<Completion>,
    languageConfig?: LanguageConfiguration,
  ) {
    this.showLineNumbers = false;
    this.editorInstance = editor;
    this.themeStyle = initialThemeStyle;
    this.languageConfig = languageConfig;
    this.completions = completions;
    this.symbols = symbols;
  }

  public createCodeBlockView() {
    return (
      node: Node,
      view: EditorView,
      getPos: () => number | undefined,
    ): CodeBlockView => {
      const nodeView = new CodeBlockView(
        node,
        view,
        this.editorInstance,
        getPos,
        this.completions,
        this.symbols,
        this.themeStyle,
        this.languageConfig,
      );

      this.addView(nodeView);

      return nodeView;
    };
  }

  public setShowLinenumbers(show: boolean) {
    this.showLineNumbers = show;
  }

  public setLinenumbers(linenumbers: number[]) {
    if (linenumbers.length === this.activeViews.length) {
      // Remember the invariant!
      // The nodeviews are sorted based on the position within the document
      for (let i = 0; i < this.activeViews.length; i++) {
        this.activeViews[i].updateLineNumbers(
          linenumbers[i] + 1,
          this.showLineNumbers,
        );
      }
    }
  }

  private addView(nodeview: CodeBlockView) {
    const pos = nodeview._getPos() ?? -1;

    const idx = this.activeViews.findIndex((v) => (v._getPos() ?? -1) > pos);

    if (idx === -1) {
      // There is no view in activeviews where the pos is larger than the pos of the node we want to insert.
      this.activeViews.push(nodeview);
    } else {
      this.activeViews.splice(idx, 0, nodeview);
    }
  }
}
