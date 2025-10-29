
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
        Tactic, "Help",
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
        "Argument",
        "WeConclude",
        Tactic,
        "p",
        Sentence, Program
    ]);
});

test("One tactic after another", () => {
    const source = "It holds that True. We conclude that 3 = 3.";
    const tree = parser.parse(source);
    const trace = treeToTrace(tree);
    expect(trace).toStrictEqual([
        Program,
        Sentence,
            Tactic,
                "ItHoldsThat",
                    "Argument",
                "ItHoldsThat",
            Tactic,
            "p",
        Sentence,
        Sentence,
            Tactic,
                "WeConclude",
                    "Argument",
                "WeConclude",
            Tactic,
            "p",
        Sentence, Program
    ]);
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