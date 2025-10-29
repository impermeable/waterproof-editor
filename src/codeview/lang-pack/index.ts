// Importing necessary modules from the Codemirror library
import {
    HighlightStyle, LRLanguage, LanguageSupport, syntaxHighlighting
} from "@codemirror/language"
import { Tag, styleTags } from "@lezer/highlight"

// Importing the parser for the Coq language
import { parser } from "./syntax"

// Defining custom tags for specific elements of the Coq language
const tags = {
    tactic: Tag.define(),
    argument: Tag.define(),
    lemma: Tag.define(),
    comment: Tag.define(),
    proof: Tag.define(),
    qed: Tag.define(),
    vernac: Tag.define(),
    bullet: Tag.define(),
    focusBrace: Tag.define(),
}

// Highlighting specific elements of the Coq language
export const highlight_dark = HighlightStyle.define([
    { tag: tags.tactic, color: "#6b9affff" },
    { tag: tags.argument, color: "#CCCCCC" },
    { tag: tags.lemma, color: "#e45649" },
    { tag: tags.comment, color: "#9ea0b1ff" },
    { tag: tags.vernac, color: "#e45649" },
    { tag: tags.bullet, color: "#ff7300ff" },
    { tag: tags.focusBrace, color: "#ff7300ff" },
])

// Highlighting specific elements of the Coq language
export const highlight_light = HighlightStyle.define([
    { tag: tags.tactic, color: "#4078f2" },    
    { tag: tags.argument, color: "#333333" },         
    { tag: tags.lemma, color: "#e45649" },               
    { tag: tags.comment, color: "#787c99" },           
    { tag: tags.vernac, color: "#e45649" },
    { tag: tags.bullet, color: "#ff7300ff" },
    { tag: tags.focusBrace, color: "#ff7300ff" },
]);

// Defining the Coq language syntax, highlighting and indentation
export const coqLanguage = LRLanguage.define({
    parser: parser.configure({
        props: [
            // indentNodeProp.add({
            //     Application: delimitedIndent({ closing: ")", align: false })
            // }),
            // foldNodeProp.add({
            //     Application: foldInside
            // }),
            styleTags({
                // LemmaKeyword
                "Lemma": tags.lemma,
                "Theorem": tags.lemma,
                "Definition": tags.lemma,
                "Example": tags.lemma,
                // Other
                "Comment": tags.comment,
                "Argument": tags.argument,
                "p": tags.tactic,
                // Bullet and brace
                "Bullet": tags.bullet,
                "FocusBrace": tags.focusBrace,
                "UnfocusBrace": tags.focusBrace,
                // Vernac
                "Proof": tags.vernac,
                "Qed": tags.vernac,
                "Admitted": tags.vernac,
                "Defined": tags.vernac,
                "RequireImport": tags.vernac,
                "Waterproof": tags.vernac,
                "SetDefault": tags.vernac,
                "OpenScope": tags.vernac,
                "Notation": tags.vernac,
                "Section": tags.vernac,
                "Variable": tags.vernac,
                "Parameter": tags.vernac,
                // WaterproofTactic
                "Help": tags.tactic,
                "WeArgueByContradiction": tags.tactic,
                "Contradiction": tags.tactic,
                "WeShowBothStatements": tags.tactic,
                "WeShowBothDirections": tags.tactic,
                "WeNowShowTheInductionStep": tags.tactic,
                "Take": tags.tactic,
                "WeNeedToShowThat": tags.tactic,
                "WeConclude": tags.tactic,
                "Case": tags.tactic,
                "AssumeThat": tags.tactic,
                "ItSufficesToShowThat": tags.tactic,
                "ItHoldsThat": tags.tactic,
                "WeClaimThat": tags.tactic,
                "WeUseInductionOn": tags.tactic,
                "Indeed": tags.tactic,
                "Use": tags.tactic,
                "Choose": tags.tactic,
                "WeFirstShowTheBaseCase": tags.tactic,
                "Expand": tags.tactic,
                "Obtain": tags.tactic,
                "ByItHoldsThat": tags.tactic,
                "ByItSufficesToShowThat": tags.tactic,
                "ByWeConcludeThat": tags.tactic,
                "Define": tags.tactic,
                "Since": tags.tactic,
                "Because": tags.tactic,
                "Either": tags.tactic,
                "WeNeedToVerifyThat": tags.tactic,
                // The tokens that appear in the middle of tactics
                "ArgumentEnd": tags.tactic,
                "It": tags.tactic,
                "As": tags.tactic,
                "Both": tags.tactic,
                "And": tags.tactic,
                "Or": tags.tactic,
                "In": tags.tactic,
                "We": tags.tactic,
                "All": tags.tactic,
                "DefineSymbol": tags.tactic,
                "Magic": tags.tactic,
                "SuchAn": tags.tactic,
                "AccordingTo": tags.tactic
            })
        ]
    })
})

export function coq() {
    return new LanguageSupport(coqLanguage)
}

export function coqSyntaxHighlighting(theme: string) {
    const highlight = theme === "dark" ? highlight_dark : highlight_light;
    return syntaxHighlighting(highlight);
}