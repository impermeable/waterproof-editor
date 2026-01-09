// Importing necessary modules from the Codemirror library
import {
    HighlightStyle, LRLanguage, LanguageSupport, syntaxHighlighting
} from "@codemirror/language"
import { Tag, styleTags } from "@lezer/highlight"
import { ThemeStyle } from "../../api"

// Importing the parser for the Lean Verbose
import { parser } from "./syntax"

// Defining custom tags for specific elements of the Lean Verbose
const tags = {
    verbose: Tag.define(),
    argument: Tag.define(),
    param: Tag.define(),
    string: Tag.define(),
    comment: Tag.define(),
}

// Highlighting specific elements of the Lean Verbose
export const highlight_dark = HighlightStyle.define([
    { tag: tags.verbose, color: "#912828" },   
    { tag: tags.param, color: "#0077ee" },
    { tag: tags.string, colors: "#00aa00" },
    { tag: tags.comment, colors: "#665f5fff" },
 ])

// Highlighting specific elements of the Lean Verbose
export const highlight_light = HighlightStyle.define([
    { tag: tags.verbose, color: "#eb0808ff" },   
    { tag: tags.param, color: "#0077aa" },
    { tag: tags.string, colors: "#00aa00" },
    { tag: tags.comment, colors: "#3d3b3bff" },
]);

// Defining the Lean Verbose syntax, highlighting and indentation
export const leanVerboseLanguage = LRLanguage.define({
    parser: parser.configure({
        props: [
            styleTags({
                "Verbose": tags.verbose,
                // "Argument": tags.argument,
                "ProofBegin": tags.verbose,
                "Param": tags.param,
                "Comment": tags.comment,
                "String": tags.string,
            })
        ]
    }),
    name: "leanVerbose"
})

export function verbose() {
    return new LanguageSupport(leanVerboseLanguage)
}

export function verboseSyntaxHighlighting(themeStyle: ThemeStyle) {
    const highlight = themeStyle === ThemeStyle.Dark ? highlight_dark : highlight_light;
    return syntaxHighlighting(highlight);
}