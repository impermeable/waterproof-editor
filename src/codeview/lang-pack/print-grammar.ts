import { parser } from "./syntax";

// const source = `Obtain such m.`;
const source = `Example example1_1_1 (a b c : ℤ) :
  c | b ⇒ b | a ⇒ c | a.
Proof.
Assume that c | b as (i).
Assume that b | a as (ii).
By (i) it holds that ∃ n ∈ ℤ, b = n * c.
Obtain such n.
By (ii) it holds that ∃ m ∈ ℤ, a = m * b.
Obtain such m.
It holds that c * (n * m) = a.
It suffices to show that ∃ k ∈ ℤ, a = k * c.
Choose k := n*m.
{ Indeed, k ∈ ℤ. }
We conclude that a = k * c.
Qed.`;
const tree = parser.parse(source);
console.log(tree.toString());
