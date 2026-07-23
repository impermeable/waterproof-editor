import { EditorState, NodeSelection } from "prosemirror-state";
import { Fragment } from "prosemirror-model";
import { WaterproofSchema } from "../../src/schema";
import { wrapInInput, wrapInHint, wrapInContainer } from "../../src/commands";
import { DefaultTagSerializer } from "../../src/serialization/DocumentSerializer";
import { TagConfiguration } from "../../src/api";
import { configuration } from "../../src/markdown-defaults";
import { Node } from "prosemirror-model";

// Lean-like tag configuration: input, hint, and code all require surrounding newlines.
const leanConfig: TagConfiguration = {
  code: {
    openTag: "```lean\n",
    closeTag: "\n```",
    openRequiresNewline: true,
    closeRequiresNewline: true,
  },
  hint: {
    openTag: (t: string) => `:::hint "${t}"\n`,
    closeTag: "\n:::",
    openRequiresNewline: true,
    closeRequiresNewline: true,
  },
  input: {
    openTag: ":::input\n",
    closeTag: "\n:::",
    openRequiresNewline: true,
    closeRequiresNewline: true,
  },
  markdown: {
    openTag: "",
    closeTag: "",
    openRequiresNewline: false,
    closeRequiresNewline: false,
  },
  math: {
    openTag: "$$`",
    closeTag: "`",
    openRequiresNewline: false,
    closeRequiresNewline: false,
  },
  container: {
    openTag: (n: string) => `::::${n}\n`,
    closeTag: "\n::::",
    openRequiresNewline: true,
    closeRequiresNewline: true,
  },
  studentHidden: {
    openTag: ":::studentHidden\n",
    closeTag: "\n:::",
    openRequiresNewline: true,
    closeRequiresNewline: true,
  },
};
const leanSerializer = new DefaultTagSerializer(leanConfig);

/** Build a doc from an array of nodes and select the node at the given index. */
function makeStateWithSelection(
  nodes: Node[],
  selectedIndex: number,
): EditorState {
  const doc = WaterproofSchema.nodes.doc.create({}, Fragment.from(nodes));
  const pos = nodes
    .slice(0, selectedIndex)
    .reduce((acc, n) => acc + n.nodeSize, 0);
  const state = EditorState.create({ doc });
  return state.apply(
    state.tr.setSelection(NodeSelection.create(state.doc, pos)),
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────
const nl = () => WaterproofSchema.nodes.newline.create();
const code = (text = "") =>
  text
    ? WaterproofSchema.nodes.code.create({}, WaterproofSchema.text(text))
    : WaterproofSchema.nodes.code.create();
const markdown = (text = "") =>
  text
    ? WaterproofSchema.nodes.markdown.create({}, WaterproofSchema.text(text))
    : WaterproofSchema.nodes.markdown.create();
const input = (children: Node[]) =>
  WaterproofSchema.nodes.input.create({}, children);
const hint = (children: Node[]) =>
  WaterproofSchema.nodes.hint.create({ title: "💡 Hint" }, children);
const container = (children: Node[], name = "test") =>
  WaterproofSchema.nodes.container.create({ name }, children);

/** Build a doc from top-level nodes and select the node at the given absolute position. */
function makeStateWithSelectionAt(nodes: Node[], pos: number): EditorState {
  const doc = WaterproofSchema.nodes.doc.create({}, Fragment.from(nodes));
  const state = EditorState.create({ doc });
  return state.apply(
    state.tr.setSelection(NodeSelection.create(state.doc, pos)),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dry-run correctness (no dispatch)
// ─────────────────────────────────────────────────────────────────────────────

describe("wrapInInput dry-run with Lean config", () => {
  test("returns true even without a preceding newline (will be inserted on dispatch)", () => {
    const state = makeStateWithSelection([code()], 0);
    expect(wrapInInput(leanConfig)(state, undefined)).toBe(true);
  });

  test("returns true even without a following newline (will be inserted on dispatch)", () => {
    const state = makeStateWithSelection([nl(), code()], 1);
    expect(wrapInInput(leanConfig)(state, undefined)).toBe(true);
  });

  test("returns true when both surrounding newlines are already present", () => {
    const state = makeStateWithSelection([nl(), code(), nl()], 1);
    expect(wrapInInput(leanConfig)(state, undefined)).toBe(true);
  });

  test("returns true for markdown node without preceding newline", () => {
    const state = makeStateWithSelection([markdown()], 0);
    expect(wrapInInput(leanConfig)(state, undefined)).toBe(true);
  });

  test("returns false for wrapping a code cell inside a hint", () => {
    // pos 1 selects the code node that sits inside the hint
    const state = makeStateWithSelectionAt([hint([code()])], 1);
    expect(wrapInInput(leanConfig)(state, undefined)).toBe(false);
  });
});

describe("wrapInHint dry-run with Lean config", () => {
  test("returns true even without a preceding newline", () => {
    const state = makeStateWithSelection([code()], 0);
    expect(wrapInHint(leanConfig)(state, undefined)).toBe(true);
  });

  test("returns true when both surrounding newlines are present", () => {
    const state = makeStateWithSelection([nl(), code(), nl()], 1);
    expect(wrapInHint(leanConfig)(state, undefined)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// preWrapCheck: disallowed nesting (dry-run)
// ─────────────────────────────────────────────────────────────────────────────

describe("wrapInHint / wrapInInput disallow hint or input ancestors", () => {
  test("wrapInInput returns false when code is inside a hint", () => {
    const state = makeStateWithSelectionAt([hint([code()])], 1);
    expect(wrapInInput(leanConfig)(state, undefined)).toBe(false);
  });

  test("wrapInHint returns false when code is inside an input", () => {
    const state = makeStateWithSelectionAt([input([code()])], 1);
    expect(wrapInHint(leanConfig)(state, undefined)).toBe(false);
  });

  test("wrapInInput returns false when code is inside an input", () => {
    const state = makeStateWithSelectionAt([input([code()])], 1);
    expect(wrapInInput(leanConfig)(state, undefined)).toBe(false);
  });

  test("wrapInHint returns false when code is inside a hint", () => {
    const state = makeStateWithSelectionAt([hint([code()])], 1);
    expect(wrapInHint(leanConfig)(state, undefined)).toBe(false);
  });

  test("wrapInInput returns false when selected node is a hint (disallowed child)", () => {
    // Wrapping the hint itself is blocked because the selected node type is disallowed.
    const state = makeStateWithSelectionAt([hint([code()])], 0);
    expect(wrapInInput(leanConfig)(state, undefined)).toBe(false);
  });

  test("wrapInHint returns false when selected node is an input (disallowed child)", () => {
    const state = makeStateWithSelectionAt([input([code()])], 0);
    expect(wrapInHint(leanConfig)(state, undefined)).toBe(false);
  });
});

describe("wrapInContainer disallows container ancestors", () => {
  test("returns false when code is inside a container", () => {
    const state = makeStateWithSelectionAt([container([code()])], 1);
    expect(wrapInContainer(leanConfig, "test")(state, undefined)).toBe(false);
  });

  test("returns false when the selected node is a container", () => {
    const state = makeStateWithSelectionAt([container([code()])], 0);
    expect(wrapInContainer(leanConfig, "test")(state, undefined)).toBe(false);
  });

  test("returns true when a top-level code node is selected", () => {
    const state = makeStateWithSelectionAt([code()], 0);
    expect(wrapInContainer(leanConfig, "test")(state, undefined)).toBe(true);
  });

  test("returns true when wrapping a hint inside a container", () => {
    // hint is not a container, so nesting it in a container is allowed
    const state = makeStateWithSelectionAt([hint([code()])], 0);
    expect(wrapInContainer(leanConfig, "test")(state, undefined)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug: outer before-newline placed inside wrapper (default config)
// ─────────────────────────────────────────────────────────────────────────────

describe("wrapInInput with default config — outer newline must be OUTSIDE the wrapper", () => {
  const defaultConfig = configuration("");
  const defaultSerializer = new DefaultTagSerializer(defaultConfig);

  test("outer before-newline is placed before the input, not inside it", () => {
    // Default config: input opening tag "<input-area>" has no trailing newline.
    // code needs a newline before it (openRequiresNewline: true).
    // With no preceding newline, wpWrapIn inserts BOTH an inner newline (first child of
    // the wrapper) AND an outer newline (between the preceding node and the wrapper).
    // The outer newline must end up OUTSIDE the wrapper.
    const state = makeStateWithSelection([code("a"), code("b")], 1);

    let newState: EditorState | null = null;
    wrapInInput(defaultConfig)(state, (tr) => {
      newState = state.apply(tr);
    });

    expect(newState).not.toBeNull();
    const doc = newState!.doc;

    // Expected: [code("a"), newline, input([newline, code("b"), newline])]
    // Buggy:    [code("a"), input([newline_misplaced, newline, code("b"), newline])]
    expect(doc.childCount).toBe(3);
    expect(doc.child(0).type.name).toBe("code");
    expect(doc.child(1).type.name).toBe("newline");
    expect(doc.child(2).type.name).toBe("input");

    const inputNode = doc.child(2);
    expect(inputNode.childCount).toBe(3);
    expect(inputNode.child(0).type.name).toBe("newline");
    expect(inputNode.child(1).type.name).toBe("code");
    expect(inputNode.child(2).type.name).toBe("newline");
  });

  test("serialized output is well-formed with no misplaced newline inside the tag", () => {
    const state = makeStateWithSelection([code("a"), code("b")], 1);

    let newState: EditorState | null = null;
    wrapInInput(defaultConfig)(state, (tr) => {
      newState = state.apply(tr);
    });

    const result = defaultSerializer.serializeDocument(newState!.doc);
    // Expected: ```\na\n```\n<input-area>\n```\nb\n```\n</input-area>
    expect(result).toStrictEqual(
      "```\na\n```\n<input-area>\n```\nb\n```\n</input-area>",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug: wrapInHint / wrapInInput must also block container as selected node
// ─────────────────────────────────────────────────────────────────────────────

describe("wrapInHint / wrapInInput disallow container as selected node", () => {
  test("wrapInHint returns false when a container node is selected", () => {
    // container is not in hintinputcontent; wrapping it in a hint is schema-invalid
    const state = makeStateWithSelectionAt([container([code()])], 0);
    expect(wrapInHint(leanConfig)(state, undefined)).toBe(false);
  });

  test("wrapInInput returns false when a container node is selected", () => {
    const state = makeStateWithSelectionAt([container([code()])], 0);
    expect(wrapInInput(leanConfig)(state, undefined)).toBe(false);
  });

  test("wrapInHint returns true when code inside a container is selected", () => {
    // hint IS in containercontent, so wrapping code (inside a container) in a hint is valid
    const state = makeStateWithSelectionAt([container([code()])], 1);
    expect(wrapInHint(leanConfig)(state, undefined)).toBe(true);
  });

  test("wrapInInput returns true when code inside a container is selected", () => {
    const state = makeStateWithSelectionAt([container([code()])], 1);
    expect(wrapInInput(leanConfig)(state, undefined)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Document structure after wrapping
// ─────────────────────────────────────────────────────────────────────────────

describe("wrapInInput document structure (Lean config)", () => {
  test("surrounding newlines stay OUTSIDE the input, not inside", () => {
    // Doc: [nl, code, nl]  ← the code is surrounded by the required newlines
    const state = makeStateWithSelection([nl(), code(), nl()], 1);

    let newState: EditorState | null = null;
    wrapInInput(leanConfig)(state, (tr) => {
      newState = state.apply(tr);
    });

    expect(newState).not.toBeNull();
    const doc = newState!.doc;

    // Expected: [nl, input([code]), nl]  — 3 top-level children
    // Buggy:    [input([nl, code, nl])]  — 1 top-level child (whole doc swallowed)
    expect(doc.childCount).toBe(3);
    expect(doc.child(0).type.name).toBe("newline");
    expect(doc.child(1).type.name).toBe("input");
    expect(doc.child(2).type.name).toBe("newline");

    const inputNode = doc.child(1);
    // The input must contain exactly the code node — no extra newline wrappers.
    expect(inputNode.childCount).toBe(1);
    expect(inputNode.child(0).type.name).toBe("code");
  });

  test("wrapping a code cell inside a larger document leaves neighbours intact", () => {
    // Doc: [code("a"), nl, code("b"), nl, code("c")]
    // Select code("b") and wrap in input.
    const state = makeStateWithSelection(
      [code("a"), nl(), code("b"), nl(), code("c")],
      2, // index 2 = code("b")
    );

    let newState: EditorState | null = null;
    wrapInInput(leanConfig)(state, (tr) => {
      newState = state.apply(tr);
    });

    expect(newState).not.toBeNull();
    const doc = newState!.doc;

    // Expected: [code("a"), nl, input([code("b")]), nl, code("c")]
    expect(doc.childCount).toBe(5);
    expect(doc.child(0).type.name).toBe("code");
    expect(doc.child(1).type.name).toBe("newline");
    expect(doc.child(2).type.name).toBe("input");
    expect(doc.child(3).type.name).toBe("newline");
    expect(doc.child(4).type.name).toBe("code");

    expect(doc.child(2).childCount).toBe(1);
    expect(doc.child(2).child(0).type.name).toBe("code");
  });
});

describe("wrapInHint document structure (Lean config)", () => {
  test("surrounding newlines stay OUTSIDE the hint, not inside", () => {
    const state = makeStateWithSelection([nl(), code(), nl()], 1);

    let newState: EditorState | null = null;
    wrapInHint(leanConfig)(state, (tr) => {
      newState = state.apply(tr);
    });

    expect(newState).not.toBeNull();
    const doc = newState!.doc;

    expect(doc.childCount).toBe(3);
    expect(doc.child(0).type.name).toBe("newline");
    expect(doc.child(1).type.name).toBe("hint");
    expect(doc.child(2).type.name).toBe("newline");

    const hintNode = doc.child(1);
    expect(hintNode.childCount).toBe(1);
    expect(hintNode.child(0).type.name).toBe("code");
  });

  test("hint node receives default title attribute", () => {
    const state = makeStateWithSelection([nl(), code(), nl()], 1);

    let newState: EditorState | null = null;
    wrapInHint(leanConfig)(state, (tr) => {
      newState = state.apply(tr);
    });

    const hintNode = newState!.doc.child(1);
    expect(hintNode.attrs.title).toBe("💡 Hint");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Serialization round-trip
// ─────────────────────────────────────────────────────────────────────────────

describe("wrapInInput serialization (Lean config)", () => {
  test("serialized output has no double-newline inside :::input block", () => {
    // Doc: [code("a"), nl, code("b"), nl, code("c")]  — wrap code("b")
    const state = makeStateWithSelection(
      [code("a"), nl(), code("b"), nl(), code("c")],
      2,
    );

    let newState: EditorState | null = null;
    wrapInInput(leanConfig)(state, (tr) => {
      newState = state.apply(tr);
    });

    const result = leanSerializer.serializeDocument(newState!.doc);

    // Correct: single \n at the boundary between :::input and the code fence
    expect(result).toBe(
      "```lean\na\n```\n:::input\n```lean\nb\n```\n:::\n```lean\nc\n```",
    );
    // The buggy output would be:
    // "```lean\na\n```\n:::input\n\n```lean\nb\n```\n\n:::\n```lean\nc\n```"
    expect(result).not.toContain(":::input\n\n");
    expect(result).not.toContain("\n\n:::");
  });
});

describe("wrapInHint serialization (Lean config)", () => {
  test("serialized output has no double-newline inside :::hint block", () => {
    const state = makeStateWithSelection(
      [code("a"), nl(), code("b"), nl(), code("c")],
      2,
    );

    let newState: EditorState | null = null;
    wrapInHint(leanConfig)(state, (tr) => {
      newState = state.apply(tr);
    });

    const result = leanSerializer.serializeDocument(newState!.doc);

    expect(result).toBe(
      `\`\`\`lean\na\n\`\`\`\n:::hint "💡 Hint"\n\`\`\`lean\nb\n\`\`\`\n:::\n\`\`\`lean\nc\n\`\`\``,
    );
    expect(result).not.toContain(':::hint "💡 Hint"\n\n');
    expect(result).not.toContain("\n\n:::");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Wrapping markdown nodes (Regression tests)
// ─────────────────────────────────────────────────────────────────────────────

describe("wrapInInput on markdown after code (no preceding newline)", () => {
  test("dry-run returns true even without a preceding newline", () => {
    // Typical Lean structure: code followed immediately by markdown, no NewlineBlock.
    const state = makeStateWithSelection([code("x"), markdown("hello")], 1);
    // Currently returns false — the command incorrectly rejects instead of inserting
    // the required newline.
    expect(wrapInInput(leanConfig)(state, undefined)).toBe(true);
  });

  test("inserts a newline before the input when none was present", () => {
    const state = makeStateWithSelection([code("x"), markdown("hello")], 1);

    let newState: EditorState | null = null;
    wrapInInput(leanConfig)(state, (tr) => {
      newState = state.apply(tr);
    });

    expect(newState).not.toBeNull();
    const doc = newState!.doc;

    // Expected: [code, newline, input([markdown])]
    // (No trailing newline needed: nothing follows the input)
    expect(doc.childCount).toBe(3);
    expect(doc.child(0).type.name).toBe("code");
    expect(doc.child(1).type.name).toBe("newline");
    expect(doc.child(2).type.name).toBe("input");
    expect(doc.child(2).childCount).toBe(1);
    expect(doc.child(2).child(0).type.name).toBe("markdown");
  });

  test("serializes correctly — no double-newline, valid Lean syntax", () => {
    // Doc: [code("a"), markdown("text"), newline, code("b")]
    // markdown has no preceding newline (Lean document pattern).
    const state = makeStateWithSelection(
      [code("a"), markdown("text"), nl(), code("b")],
      1, // select the markdown
    );

    let newState: EditorState | null = null;
    wrapInInput(leanConfig)(state, (tr) => {
      newState = state.apply(tr);
    });

    const result = leanSerializer.serializeDocument(newState!.doc);

    // The missing newline before :::input must be added; the existing newline
    // after the input (before code("b")) must be preserved.
    expect(result).toBe(
      "```lean\na\n```\n:::input\ntext\n:::\n```lean\nb\n```",
    );
  });
});

describe("wrapInHint on markdown after code (no preceding newline)", () => {
  test("dry-run returns true even without a preceding newline", () => {
    const state = makeStateWithSelection([code("x"), markdown("hello")], 1);
    expect(wrapInHint(leanConfig)(state, undefined)).toBe(true);
  });

  test("inserts a newline before the hint when none was present", () => {
    const state = makeStateWithSelection([code("x"), markdown("hello")], 1);

    let newState: EditorState | null = null;
    wrapInHint(leanConfig)(state, (tr) => {
      newState = state.apply(tr);
    });

    expect(newState).not.toBeNull();
    const doc = newState!.doc;

    expect(doc.childCount).toBe(3);
    expect(doc.child(0).type.name).toBe("code");
    expect(doc.child(1).type.name).toBe("newline");
    expect(doc.child(2).type.name).toBe("hint");
    expect(doc.child(2).childCount).toBe(1);
    expect(doc.child(2).child(0).type.name).toBe("markdown");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rocq / coq config regression: code cell inside hint must be on its own line
// ─────────────────────────────────────────────────────────────────────────────

describe("wrapInHint serialization (Rocq/coq config)", () => {
  const rocqConfig = configuration("coq");
  const rocqSerializer = new DefaultTagSerializer(rocqConfig);

  test("code cell is NOT placed on the same line as the hint opening or closing tag", () => {
    // Document with a single code cell — the minimal Rocq document that triggers the bug.
    const state = makeStateWithSelection([code("example")], 0);

    let newState: EditorState | null = null;
    wrapInHint(rocqConfig)(state, (tr) => {
      newState = state.apply(tr);
    });

    expect(newState).not.toBeNull();
    const result = rocqSerializer.serializeDocument(newState!.doc);

    // The hint opening tag must be followed by a newline before the code fence
    // The hint closing tag must be preceded by a newline after the code fence
    expect(result).toStrictEqual(
      '<hint title="💡 Hint">\n```coq\nexample\n```\n</hint>',
    );
  });
});
