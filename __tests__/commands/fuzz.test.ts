/**
 * @jest-environment jsdom
 */
import { EditorState, TextSelection, NodeSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { WaterproofSchema } from "../../src/schema";
import { getCmdInsertCode, getCmdInsertMarkdown, getCmdInsertLatex } from "../../src/commands/insert-command";
import { InsertionPlace } from "../../src/commands";
import { deleteSelection, wrapInHint, wrapInInput, wrapInContainer, wpLift } from "../../src/commands/commands";
import { configuration } from "../../src/markdown-defaults";
import { needsNewlineBefore, needsNewlineAfter, openingTagEndsWithNewline, closingTagStartsWithNewline } from "../../src/commands/utils";

jest.mock('../../src/inputArea.ts', () => ({
  INPUT_AREA_PLUGIN_KEY: { getState: jest.fn(() => ({ teacher: true })) }
}));

const rocq = configuration("coq");
const NL = WaterproofSchema.nodes.newline;
const LEAF = ["code", "markdown", "math_display"];
const WRAPPABLE = ["code", "markdown", "math_display", "hint", "input", "container"];
const LIFTABLE = ["hint", "input", "container"];

// Structural newline invariant: a node whose open/close tag requires a newline must actually have
// one in the serialized output, supplied either by a `newline` sibling or by a document/container
// boundary. A violation means the serializer would glue the tag onto neighbouring content.
function violations(node: any, parentType: string, parentOpenEndsNL: boolean, parentCloseStartsNL: boolean, isDocRoot: boolean, path: string): string[] {
  const out: string[] = [];
  const content: any[] = node.content ? [...node.content] : [];
  content.forEach((child: any, i: number) => {
    const type = child.type;
    const cNode = WaterproofSchema.nodes[type];
    if (cNode && needsNewlineBefore(cNode, rocq)) {
      const prev = content[i - 1];
      const ok = (prev && prev.type === "newline") || (i === 0 && (isDocRoot || parentOpenEndsNL));
      if (!ok) out.push(`${path}[${i}] ${type}: missing newline BEFORE (prev=${prev?.type ?? "container-open:" + parentType})`);
    }
    if (cNode && needsNewlineAfter(cNode, rocq)) {
      const next = content[i + 1];
      const ok = (next && next.type === "newline") || (i === content.length - 1 && (isDocRoot || parentCloseStartsNL));
      if (!ok) out.push(`${path}[${i}] ${type}: missing newline AFTER (next=${next?.type ?? "container-close:" + parentType})`);
    }
    if (["input", "hint", "container"].includes(type)) {
      const t = WaterproofSchema.nodes[type];
      out.push(...violations(child, type, openingTagEndsWithNewline(t, rocq), closingTagStartsWithNewline(t, rocq), false, `${path}[${i}]${type}`));
    }
  });
  return out;
}

function check(docJson: any): string[] {
  return violations(docJson, "doc", false, false, true, "doc");
}

// child cells of a node (top-level descendants we can target)
function leafCursorPositions(doc: any): number[] {
  const ps: number[] = [];
  doc.descendants((n: any, pos: number) => { if (LEAF.includes(n.type.name)) ps.push(pos + 1); return true; });
  return ps;
}
function nodePositionsOfTypes(doc: any, types: string[]): number[] {
  const ps: number[] = [];
  doc.descendants((n: any, pos: number) => { if (types.includes(n.type.name)) ps.push(pos); return true; });
  return ps;
}

// All operations as (state) -> new EditorView | null, parameterised by target position.
type Op = { label: string; apply: (json: any) => any | null };

function withView(json: any, fn: (v: EditorView) => boolean): any | null {
  const view = new EditorView(null, { state: EditorState.fromJSON({ schema: WaterproofSchema }, json) });
  let ok = false;
  try { ok = fn(view); } catch { return null; }
  if (!ok) return null;
  return { doc: view.state.doc.toJSON(), selection: view.state.selection.toJSON() };
}

function enumerateOps(json: any): Op[] {
  const view = new EditorView(null, { state: EditorState.fromJSON({ schema: WaterproofSchema }, json) });
  const doc = view.state.doc;
  const ops: Op[] = [];

  const inserts = [
    { n: "code", f: getCmdInsertCode }, { n: "md", f: getCmdInsertMarkdown }, { n: "math", f: getCmdInsertLatex },
  ];
  for (const cpos of leafCursorPositions(doc)) {
    for (const place of [InsertionPlace.Above, InsertionPlace.Below]) {
      for (const ins of inserts) {
        const cmd = ins.f(place, rocq);
        ops.push({ label: `ins ${ins.n} ${place === InsertionPlace.Above ? "↑" : "↓"} @${cpos}`, apply: (j) => withView(j, (v) => {
          v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, cpos)));
          return cmd(v.state, v.dispatch, v);
        })});
      }
    }
  }
  for (const npos of nodePositionsOfTypes(doc, LEAF)) {
    const cmd = deleteSelection(rocq);
    ops.push({ label: `del @${npos}`, apply: (j) => withView(j, (v) => {
      v.dispatch(v.state.tr.setSelection(NodeSelection.create(v.state.doc, npos)));
      return cmd(v.state, v.dispatch, v);
    })});
  }
  for (const npos of nodePositionsOfTypes(doc, WRAPPABLE)) {
    for (const w of [{ n: "hint", c: wrapInHint(rocq) }, { n: "input", c: wrapInInput(rocq) }, { n: "container", c: wrapInContainer(rocq, "test") }]) {
      ops.push({ label: `wrap ${w.n} @${npos}`, apply: (j) => withView(j, (v) => {
        v.dispatch(v.state.tr.setSelection(NodeSelection.create(v.state.doc, npos)));
        return w.c(v.state, v.dispatch, v);
      })});
    }
  }
  for (const npos of nodePositionsOfTypes(doc, LIFTABLE)) {
    const cmd = wpLift(rocq);
    ops.push({ label: `lift @${npos}`, apply: (j) => withView(j, (v) => {
      v.dispatch(v.state.tr.setSelection(NodeSelection.create(v.state.doc, npos)));
      return cmd(v.state, v.dispatch, v);
    })});
  }
  return ops;
}

test("fuzz: no command sequence breaks the code-newline invariant", () => {
  const seeds = [
    { doc: { type: "doc", content: [{ type: "code", content: [{ type: "text", text: "C." }] }] }, selection: { type: "text", anchor: 1, head: 1 } },
    { doc: { type: "doc", content: [
      { type: "code", content: [{ type: "text", text: "C." }] }, { type: "newline" },
      { type: "markdown", content: [{ type: "text", text: "m" }] }, { type: "newline" },
      { type: "math_display", content: [{ type: "text", text: "x" }] },
    ] }, selection: { type: "text", anchor: 1, head: 1 } },
    // input area whose first child is code MUST start with a leading newline to be valid.
    { doc: { type: "doc", content: [{ type: "input", content: [
      { type: "newline" }, { type: "code", content: [{ type: "text", text: "C." }] }, { type: "newline" },
      { type: "markdown", content: [{ type: "text", text: "m" }] },
    ] }] }, selection: { type: "text", anchor: 3, head: 3 } },
    // input area whose first child is markdown (no leading newline needed).
    { doc: { type: "doc", content: [{ type: "input", content: [
      { type: "markdown", content: [{ type: "text", text: "m" }] }, { type: "newline" },
      { type: "code", content: [{ type: "text", text: "C." }] }, { type: "newline" },
    ] }] }, selection: { type: "text", anchor: 2, head: 2 } },
    // hint wrapping code.
    { doc: { type: "doc", content: [{ type: "hint", attrs: { title: "t" }, content: [
      { type: "newline" }, { type: "code", content: [{ type: "text", text: "C." }] }, { type: "newline" },
    ] }] }, selection: { type: "text", anchor: 3, head: 3 } },
  ];

  const seen = new Set<string>();
  const found: string[] = [];
  let frontier: { json: any; path: string }[] = seeds.map((s, i) => ({ json: s, path: `seed${i}` }));
  const DEPTH = 3;

  for (let d = 0; d < DEPTH && found.length < 25; d++) {
    const next: { json: any; path: string }[] = [];
    for (const item of frontier) {
      let ops: Op[];
      try { ops = enumerateOps(item.json); } catch { continue; }
      for (const op of ops) {
        const res = op.apply(item.json);
        if (res === null) continue;
        const key = JSON.stringify(res.doc.content);
        if (seen.has(key)) continue;
        seen.add(key);
        const v = check(res.doc);
        if (v.length > 0) {
          found.push(`PATH: ${item.path} > ${op.label}\n  ${v.join("\n  ")}\n  DOC: ${key}`);
          if (found.length >= 25) break;
        } else {
          next.push({ json: res, path: `${item.path} > ${op.label}` });
        }
      }
    }
    frontier = next;
  }

  // eslint-disable-next-line no-console
  console.log(`Explored ${seen.size} states. VIOLATIONS: ${found.length}\n` + found.join("\n========\n"));
  expect(found).toStrictEqual([]);
});
