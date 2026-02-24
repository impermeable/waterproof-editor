import { EditorState, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { OffsetSemanticToken, ThemeStyle } from "../api";
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

        builder.add(token.startOffset, token.endOffset, Decoration.mark({ class: `tok-${token.type}` }));
    }

    return builder.finish();
}

// TODO: use the themes defined elsewhere and provide them here + adapt them to the expected class names.
const darkSemanticTheme = EditorView.theme({
    ".tok-keyword":        { color: "#56b3ff" },  // matches grammar tactic blue
    ".tok-variable":       { color: "#a0c4e8" },  // light steel blue
    ".tok-property":       { color: "#8ab8d8" },  // softer blue
    ".tok-function":       { color: "#e0c070" },  // warm gold
}, { dark: true });

const lightSemanticTheme = EditorView.theme({
    ".tok-keyword":        { color: "#004cf0" },  // matches grammar tactic blue
    ".tok-variable":       { color: "#2060a0" },  // medium blue
    ".tok-property":       { color: "#406090" },  // slate blue
    ".tok-function":       { color: "#8a5e20" },  // rich brown
}, { dark: false });

export function semanticTokenTheme(theme: ThemeStyle) {
    return theme === ThemeStyle.Dark ? darkSemanticTheme : lightSemanticTheme;
}

export function semanticHighlighting() {
    return [semanticTokenField, semanticTokenPlugin];
}