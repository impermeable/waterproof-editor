
import { expect } from "@jest/globals";

import { parser } from "../../src/codeview/lang-pack/syntax";
import { Tree } from "@lezer/common";
import tactics from "./tactics.json";

const Program = "Program",
    Sentence = "Sentence",
    Tactic = "WaterproofTactic";


function treeToTrace(input: Tree) {
    const trace: string[] = [];
    input.iterate({
        enter(node) {
            trace.push(node.type.name);
        },
        leave(node) {
            // Skip adding leaf nodes twice
            if (trace.at(-1) !== node.type.name)
                trace.push(node.type.name);
        }
    });
    return trace;
}

test("Help", () => {
    const source = "Help.";
    const tree = parser.parse(source);
    const trace = treeToTrace(tree);
    expect(trace).toStrictEqual([
        Program, Sentence, 
        Tactic, 
            "Help",
        Tactic, "p",
        Sentence, Program]);
});

test("We conclude", () => {
    const source = "We conclude that 3 = 3.";
    const tree = parser.parse(source);
    const trace = treeToTrace(tree);
    expect(trace).toStrictEqual([
        Program, Sentence,
        Tactic,
            "WeConclude",
                "That",
                "Argument",
            "WeConclude",
        Tactic, "p",
        Sentence, Program
    ]);
});

test("'We conclude' after 'It holds that'", () => {
    const source = "It holds that True. We conclude that 3 = 3.";
    const tree = parser.parse(source);
    const trace = treeToTrace(tree);
    expect(trace).toStrictEqual([
        Program,
        Sentence,
            Tactic,
                "ItHolds",
                    "That",
                    "Argument",
                "ItHolds",
            Tactic,
            "p",
        Sentence,
        Sentence,
            Tactic,
                "WeConclude",
                    "That",
                    "Argument",
                "WeConclude",
            Tactic,
            "p",
        Sentence, Program
    ]);
});

test("Lorem Ipsum", () => {
    const source = "Lorem ipsum dolor sit amet.";
    const tree = parser.parse(source);
    // Whatever the lorem ipsum text parses as, it should **not** be
    // a valid waterproof tactic.
    expect(tree.resolveStack(1).next!.node.type.name).not.toBe(Tactic);
});

test("Sentence without period", () => {
    // Resembles partial user input (no tactics underneath yet).
    const source = "Contradiction";
    const tree = parser.parse(source);
    expect(tree.resolveStack(1).next!.node.type.name).toBe(Tactic);
});

test("Sentence without period followed by another sentence", () => {
    // The first tactic should still (partially) parse.
    // The second tactic will probably be invalid.
    const source = "Since i it holds \nWe conclude that True.";
    const tree = parser.parse(source);
    expect(tree.resolveStack(1).next!.node.type.name).toBe(Tactic);
});

test("Parse a Lemma", () => {
    const source = `Lemma example_use_there_exists :
  ∀ x ∈ ℝ,
    (∃ y > 10, y < x) ⇒
      10 < x.`
    const tree = parser.parse(source);
    const trace = treeToTrace(tree);
    expect(trace).toStrictEqual([
        Program, Sentence,
        "Lemmas",
            "LemmaKeyword", "Lemma", "LemmaKeyword",
            "Argument",
        "Lemmas",
        "p",
        Sentence, Program
    ])
});

test("Parse a Theorem", () => {
    const source = `Theorem example_use_there_exists :
  ∀ x ∈ ℝ,
    (∃ y > 10, y < x) ⇒
      10 < x.`
    const tree = parser.parse(source);
    const trace = treeToTrace(tree);
    expect(trace).toStrictEqual([
        Program, Sentence,
        "Lemmas",
            "LemmaKeyword", "Theorem", "LemmaKeyword",
            "Argument",
        "Lemmas",
        "p",
        Sentence, Program
    ])
});

test("Parse a definition", () => {
    const source = "Definition square (x : ℝ) := x^2.";
    const tree = parser.parse(source);
    const trace = treeToTrace(tree);
    expect(trace).toStrictEqual([
        Program, Sentence,
        "Definitions",
            "DefinitionKeyword", "Definition", "DefinitionKeyword",
            "Argument",
            "DefineSymbol",
            "Argument",
        "Definitions",
        "p",
        Sentence, Program
    ])
});

for (const tactic of tactics) {
    if (tactic.label === "& 3 < 5 = 2 + 3 ≤ 7 (chain of (in)equalities, with opening parenthesis)" ||
        tactic.label === "& 3 < 5 = 2 + 3 ≤ 7 (chain of (in)equalities)")
        continue;

    test(`'${tactic.label}' should parse as WaterproofTactic`, () => {
        const source = tactic.label;
        const tree = parser.parse(source);
        expect(tree.resolveStack(1).next!.node.type.name).toBe(Tactic);
    });
    test(`'${tactic.label}' should parse as WaterproofTactic (with argument containing spaces)`, () => {
        const source = tactic.label.replaceAll(/\(\*[^*]*\*\)/g, "(tactic input with spaces)");
        const tree = parser.parse(source);
        expect(tree.resolveStack(1).next!.node.type.name).toBe(Tactic);
    });
}