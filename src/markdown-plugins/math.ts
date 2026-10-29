import MarkdownIt, { PluginSimple } from "markdown-it";
import StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";

const MARKER = "$";
const TAG = "math-inline";

/*
 * Add delimiters for double occurrences of MARKER_SYMBOL.
 */
function tokenize(state: StateInline, silent: boolean) {
  console.log("HELLO YES YES");
  if (silent) {
    return false;
  }
  console.log("TEST HERE");
  const start = state.pos;
  const max = state.posMax;

  let momChar = state.src.charAt(start);

  // We are looking for two times the open symbol.
  if (momChar !== MARKER) {
    console.log("NOT FOUND");
    return false;
  }

  // Find the end sequence
  let end = -1;
  for (let i = start + 1; i < max && end === -1; i++) {
    momChar = state.src.charAt(i);

    if (momChar === MARKER) {
      end = i;
    } else if (momChar === "\n") {
      // Found end of line before the end sequence. Thus, ignore our start sequence!
      return false;
    }
  }

  // Input ended before closing sequence.
  if (end === -1) {
    return false;
  }

  // start tag
  state.push("math_open", TAG, 1);
  // parse inner
  state.pos += 1;
  state.posMax = end;
  console.log("SOMEWHERE HERE");
  state.md.inline.tokenize(state);
  state.pos = end + 1;
  state.posMax = max;
  // end tag
  state.push("math_close", TAG, -1);
  return true;
}

export const mathPlugin: PluginSimple = (md: MarkdownIt) => {
  md.inline.ruler.before("link", "math", tokenize);
};
