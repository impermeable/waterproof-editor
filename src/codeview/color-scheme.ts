import { EditorView } from "@codemirror/view";
import coqTheme from "./coqTheme.json";

/**
 * Inspired by:
 * https://github.com/codemirror/theme-one-dark/blob/main/src/one-dark.ts
 */
export function getCustomTheme(isDark: boolean) {
    return EditorView.theme(coqTheme, { dark: isDark });
}