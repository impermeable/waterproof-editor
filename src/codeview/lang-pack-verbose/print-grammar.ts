import { parser } from "./syntax";

/////// MANUAL TEST FILE ///////////
//
// This file should be used for manually testing the grammar only!
//
// This file should **not** be imported anywhere and is hence
// not included in the output build.
//
// Run using `ts-node print-grammar.ts` 
//     see (https://www.npmjs.com/package/ts-node)
//
///////////////////////////////////

const source = `Example "ATC - 014"
  Given: (f : ℝ → ℝ) (u : ℕ → ℝ) (x₀ : ℝ)
  Assume: (hu :  u converges to x₀) (hf : f is continuous at x₀)
  Conclusion: (f ∘ u) converges to f x
Proof:
  Let's prove that ∀ ε > 0, ∃ N, ∀ n ≥ N, |f (u n) - f x₀| ≤ ε
  Fix ε > 0
  By hf applied to ε using that ε > 0 we get δ such that
    (δ_pos : δ > 0) and (Hf : ∀ x, |x - x₀| ≤ δ ⇒ |f x - f x₀| ≤ ε)
  By hu applied to δ using that δ > 0 we get N such that Hu : ∀ n ≥ N, |u n - x₀| ≤ δ
  Let's prove that N works : ∀ n ≥ N, |f (u n) - f x₀| ≤ ε
  Fix n ≥ N
  By Hf applied to u n it suffices to prove |u n - x₀| ≤ δ
  We conclude by Hu applied to n using that n ≥ N
QED

`;
const tree = parser.parse(source);
console.log(tree.toString());
