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
    tactic: Tag.define(),
    argument: Tag.define(),
    param: Tag.define(),
    string: Tag.define(),
    comment: Tag.define(),
    bracket: Tag.define(),
}

// Highlighting specific elements of the Lean Verbose
export const highlight_dark = HighlightStyle.define([
    { tag: tags.verbose, color: "#912828" },
    { tag: tags.tactic, color: "#56b3ffff" },
    { tag: tags.param, color: "#0077ee" },
    { tag: tags.string, color: "#00aa00" },
    { tag: tags.comment, color: "#9ea0b1ff" },
    { tag: tags.bracket, color: "#ff0000" },
])

// Highlighting specific elements of the Lean Verbose
export const highlight_light = HighlightStyle.define([
    { tag: tags.verbose, color: "#eb0808ff" },
    { tag: tags.tactic, color: "#004cf0ff" },
    { tag: tags.param, color: "#0077aa" },
    { tag: tags.string, color: "#00aa00" },
    { tag: tags.comment, color: "#787c99" },
    { tag: tags.bracket, color: "#ff0000" },
]);

// Defining the Lean Verbose syntax, highlighting and indentation
export const leanVerboseLanguage = LRLanguage.define({
    parser: parser.configure({
        props: [
            styleTags({
                // structure
                "Example": tags.verbose,
                "Exercise": tags.verbose,
                "Proof": tags.verbose,
                "QED": tags.verbose,
                
                "Given": tags.param,
                "Assume": tags.param,
                "Conclusion": tags.param,

                // tactics / connectors / english keywords
                "Fix": tags.tactic,
                "By": tags.tactic,
                "Lets": tags.tactic,
                "Let": tags.tactic,
                "Us": tags.tactic,
                "Prove": tags.tactic,
                "That": tags.tactic,
                "We": tags.tactic,
                "Compute": tags.tactic,
                "Conclude": tags.tactic,
                "ByWord": tags.tactic,
                "Applied": tags.tactic,
                "To": tags.tactic,
                "Using": tags.tactic,
                "Get": tags.tactic,
                "Such": tags.tactic,
                "It": tags.tactic,
                "Suffices": tags.tactic,

                // generic
                "Chunk": tags.argument,
                "Comment": tags.comment,
                "String": tags.string,

                // punctuation
                "LParen": tags.bracket,
                "RParen": tags.bracket,
                "LBrace": tags.bracket,
                "RBrace": tags.bracket,
                "LBracket": tags.bracket,
                "RBracket": tags.bracket,
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