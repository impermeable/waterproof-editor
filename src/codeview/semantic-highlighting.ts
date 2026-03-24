import { EditorState, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { OffsetSemanticToken } from "../api";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

/** Dispatch this effect to replace the current set of semantic tokens. The tokens have to be sorted in document order. */
export const setSemanticTokens = StateEffect.define<OffsetSemanticToken[]>();

/** Dispatch this effect to clear all semantic tokens (e.g. on LSP disconnect). */
export const clearSemanticTokens = StateEffect.define<void>();

/** Holds the current semantic token for this CodeMirror instance. */
const semanticTokenField = StateField.define<OffsetSemanticToken[]>({
    create: () => [],
    update(tokens, tr) {
        for (const effect of tr.effects) {
            if (effect.is(setSemanticTokens)) return effect.value;
            if (effect.is(clearSemanticTokens)) return [];
        }

        if (tr.docChanged) {
            return [];
        } else {
            return tokens;
        }
    }
});

const semanticTokenPlugin = ViewPlugin.define(view => ({
    decorations: buildDecorations(view.state),
    update(update: ViewUpdate) {
        if (update.state.field(semanticTokenField) !== update.startState.field(semanticTokenField)) {
            this.decorations = buildDecorations(update.state); 
        }
    }

}), {
    decorations: v => v.decorations,
});

function buildDecorations(state: EditorState): DecorationSet {
    const tokens = state.field(semanticTokenField);
    if (tokens.length === 0) return Decoration.none;

    const documentLength = state.doc.length;
    const builder = new RangeSetBuilder<Decoration>();

    // Tokens must be added in document order, so we assume for now that the tokens provided are sorted in document order.

    for (const token of tokens) {
        if (token.startOffset < 0 || token.endOffset > documentLength || token.startOffset >= token.endOffset) {
            continue; // skip invalid tokens
        }

        try {
            builder.add(token.startOffset, token.endOffset, Decoration.mark({ class: `tok-${token.type}` }));
        } catch {
            continue; // skip tokens that are out of order or otherwise invalid
        }
    }

    return builder.finish();
}

const semanticTheme = EditorView.theme({
    // Keywords / control flow
    ".tok-keyword":       { color: "var(--wp-semanticKeyword)" },
    ".tok-macro":         { color: "var(--wp-semanticKeyword)" },
    ".tok-modifier":      { color: "var(--wp-semanticKeyword)" },
    ".tok-operator":      { color: "var(--wp-semanticKeyword)" },

    // Functions / callables
    ".tok-function":      { color: "var(--wp-semanticFunction)" },
    ".tok-method":        { color: "var(--wp-semanticFunction)" },
    ".tok-event":         { color: "var(--wp-semanticFunction)" },

    // Types / shapes
    ".tok-type":          { color: "var(--wp-semanticType)" },
    ".tok-class":         { color: "var(--wp-semanticType)" },
    ".tok-struct":        { color: "var(--wp-semanticType)" },
    ".tok-enum":          { color: "var(--wp-semanticType)" },
    ".tok-interface":     { color: "var(--wp-semanticType)" },
    ".tok-typeParameter": { color: "var(--wp-semanticType)" },
    ".tok-namespace":     { color: "var(--wp-semanticType)" },

    // Variables / bindings
    ".tok-variable":      { color: "var(--wp-semanticVariable)" },
    ".tok-parameter":     { color: "var(--wp-semanticVariable)" },

    // Properties / members
    ".tok-property":      { color: "var(--wp-semanticProperty)" },
    ".tok-enumMember":    { color: "var(--wp-semanticProperty)" },
    ".tok-decorator":     { color: "var(--wp-semanticProperty)" },

    // Literals / comments
    ".tok-string":        { color: "var(--wp-semanticLiteral)" },
    ".tok-number":        { color: "var(--wp-semanticLiteral)" },
    ".tok-regexp":        { color: "var(--wp-semanticLiteral)" },
    ".tok-comment":       { color: "var(--wp-semanticComment)" },

    // Lean-specific: sorry and sorry-like terms — highlighted in red to be conspicuous
    ".tok-leanSorryLike": { color: "var(--wp-semanticLeanSorryLike)" },
});

export function semanticTokenTheme() {
    return semanticTheme;
}

export function semanticHighlighting() {
    return [semanticTokenField, semanticTokenPlugin];
}