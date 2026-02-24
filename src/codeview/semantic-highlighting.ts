import { StateEffect, StateField, RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { ThemeStyle } from "../api";

// ─── Types ──────────────────────────────────────────────

/**
 * A semantic token positioned with **CodeMirror-local** offsets
 * (i.e. 0-based within the code block, not document-global).
 */
export interface LocalSemanticToken {
  /** Start offset within the CodeMirror document (inclusive). */
  from: number;
  /** End offset within the CodeMirror document (exclusive). */
  to: number;
  /** The semantic token type as reported by the LSP. */
  tokenType: string;
}

// ─── State Effects ──────────────────────────────────────

/** Dispatch this effect to replace the current set of semantic tokens. */
export const setSemanticTokens = StateEffect.define<LocalSemanticToken[]>();

/** Dispatch this effect to clear all semantic tokens (e.g. on LSP disconnect). */
export const clearSemanticTokens = StateEffect.define<void>();

// ─── State Field ────────────────────────────────────────

/**
 * Holds the current semantic tokens for this CodeMirror instance.
 * Updated via {@link setSemanticTokens} and {@link clearSemanticTokens}.
 */
export const semanticTokenField = StateField.define<LocalSemanticToken[]>({
  create: () => [],
  update(tokens, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setSemanticTokens)) return effect.value;
      if (effect.is(clearSemanticTokens)) return [];
    }
    // When the document changes we invalidate tokens.
    // The host application is expected to send a new set after the LSP responds.
    if (tr.docChanged) return [];
    return tokens;
  },
});

// ─── Decoration CSS classes ─────────────────────────────

/** Map of token type to CSS class name. */
const tokenClassMap: Record<string, string> = {
  variable: "tok-variable",
  parameter: "tok-parameter",
  function: "tok-function",
  type: "tok-type",
  namespace: "tok-namespace",
  keyword: "tok-keyword",
  property: "tok-property",
  theorem: "tok-theorem",
  tactic: "tok-tactic",
  comment: "tok-comment",
  string: "tok-string",
  number: "tok-number",
  operator: "tok-operator",
  macro: "tok-macro",
};

/** Cache of created mark decorations so we don't recreate them on every render. */
const decorationCache = new Map<string, Decoration>();

function getDecoration(tokenType: string): Decoration {
  let deco = decorationCache.get(tokenType);
  if (deco) return deco;

  const cls = tokenClassMap[tokenType] ?? `tok-${tokenType}`;
  deco = Decoration.mark({ class: cls });
  decorationCache.set(tokenType, deco);
  return deco;
}

// ─── View Plugin ────────────────────────────────────────

/**
 * Builds a {@link DecorationSet} from the current semantic tokens stored in the state field.
 * Decorations use CSS classes so they layer on top of grammar-based highlighting.
 */
const semanticTokenPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      const oldTokens = update.startState.field(semanticTokenField);
      const newTokens = update.state.field(semanticTokenField);
      // Only rebuild when the token list reference changes or the document changed
      if (oldTokens !== newTokens || update.docChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const tokens = view.state.field(semanticTokenField);
      if (tokens.length === 0) return Decoration.none;

      const docLength = view.state.doc.length;
      const builder = new RangeSetBuilder<Decoration>();

      // Tokens must be added in document order.
      // We sort a shallow copy to avoid mutating the state field.
      const sorted = [...tokens].sort((a, b) => a.from - b.from || a.to - b.to);

      for (const token of sorted) {
        // Guard against out-of-bounds tokens (stale data from before a doc change)
        if (token.from < 0 || token.to > docLength || token.from >= token.to)
          continue;
        builder.add(token.from, token.to, getDecoration(token.tokenType));
      }

      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// ─── Theme (CSS) ─────────────────────────────────────────

// Dark theme — designed to complement the grammar palette:
//   Grammar tactic blue: #56b3ff    Grammar structural red: #912828
//   Grammar param blue:  #0077ee    Grammar comment gray:   #9ea0b1
//   Grammar string green:#00aa00
const darkSemanticTheme = EditorView.theme(
  {
    // Identifiers: light steel blue — clearly colored, distinct from plain text
    ".tok-variable": { color: "#a0c4e8" },
    ".tok-parameter": { color: "#a0c4e8", fontStyle: "italic" },
    // Functions: warm gold — stands out for callable names
    ".tok-function": { color: "#e0c070" },
    // Types: teal green — distinct from blue tactics, clearly a "type"
    ".tok-type": { color: "#50c0a0" },
    ".tok-namespace": { color: "#50c0a0" },
    // Keywords: match grammar tactic blue for consistency
    ".tok-keyword": { color: "#56b3ff" },
    // Properties: soft blue — slightly different hue from variables
    ".tok-property": { color: "#8ab8d8" },
    // Theorems/lemmas: light purple — stands out for reference names
    ".tok-theorem": { color: "#cca0e0" },
    // Tactics: match grammar tactic blue
    ".tok-tactic": { color: "#56b3ff" },
    // Comments: match grammar comment gray
    ".tok-comment": { color: "#9ea0b1" },
    // Strings: match grammar string green
    ".tok-string": { color: "#00aa00" },
    // Numbers: light green — clearly numeric
    ".tok-number": { color: "#90c870" },
    // Operators: soft warm gray — visible but not distracting
    ".tok-operator": { color: "#c8c4b8" },
    // Macros: warm gold italic
    ".tok-macro": { color: "#e0c070", fontStyle: "italic" },
  },
  { dark: true }
);

// Light theme — designed to complement the grammar palette:
//   Grammar tactic blue: #004cf0    Grammar structural red: #eb0808
//   Grammar param blue:  #0077aa    Grammar comment gray:   #787c99
//   Grammar string green:#00aa00
const lightSemanticTheme = EditorView.theme(
  {
    // Identifiers: medium blue — clearly colored, not just black text
    ".tok-variable": { color: "#2060a0" },
    ".tok-parameter": { color: "#2060a0", fontStyle: "italic" },
    // Functions: rich brown — warm, clearly distinct from blue
    ".tok-function": { color: "#8a5e20" },
    // Types: teal — cool, distinct from tactic blue
    ".tok-type": { color: "#18806a" },
    ".tok-namespace": { color: "#18806a" },
    // Keywords: match grammar tactic blue
    ".tok-keyword": { color: "#004cf0" },
    // Properties: slate blue
    ".tok-property": { color: "#406090" },
    // Theorems/lemmas: medium purple — distinctive for references
    ".tok-theorem": { color: "#8040b0" },
    // Tactics: match grammar tactic blue
    ".tok-tactic": { color: "#004cf0" },
    // Comments: match grammar comment gray
    ".tok-comment": { color: "#787c99" },
    // Strings: match grammar string green
    ".tok-string": { color: "#00aa00" },
    // Numbers: forest green
    ".tok-number": { color: "#1a7040" },
    // Operators: medium gray — visible but not distracting
    ".tok-operator": { color: "#505050" },
    // Macros: rich brown italic
    ".tok-macro": { color: "#8a5e20", fontStyle: "italic" },
  },
  { dark: false }
);

// ─── Public API ─────────────────────────────────────────

/**
 * Returns the CodeMirror extensions required for semantic token highlighting.
 * Add these to a CodeMirror instance alongside the grammar-based highlighting.
 */
export function semanticHighlighting() {
  return [semanticTokenField, semanticTokenPlugin];
}

/**
 * Returns the theme extension for semantic token CSS classes.
 * @param themeStyle Whether the editor is in dark or light mode.
 */
export function semanticTokenTheme(themeStyle: ThemeStyle) {
  return themeStyle === ThemeStyle.Dark
    ? darkSemanticTheme
    : lightSemanticTheme;
}
