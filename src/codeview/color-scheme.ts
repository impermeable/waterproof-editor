import { EditorView } from "@codemirror/view";
import codeTheme from "./codeTheme.json";

/**
 * Inspired by:
 * https://github.com/codemirror/theme-one-dark/blob/main/src/one-dark.ts
 */
export const customTheme = EditorView.theme(codeTheme, { dark: true });
