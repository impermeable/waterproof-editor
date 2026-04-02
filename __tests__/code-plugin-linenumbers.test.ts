import { EditorState } from "prosemirror-state";
import { CODE_PLUGIN_KEY, codePlugin } from "../src/codeview";
import { ThemeStyle } from "../src/api";
import { WaterproofSchema } from "../src/schema";

// The code plugin stores activeNodeViews in a Set<CodeBlockView>.
// After a ReplaceAroundStep (lift), ProseMirror may destroy and recreate a code
// NodeView.  The factory function adds the new view to the Set, but the old
// (stale) view is never removed — CodeBlockView has no destroy() method, and
// the code plugin only cleans up views for ReplaceStep, not ReplaceAroundStep.
//
// In the code plugin's `apply`, line numbers are only distributed to cells when
//   value.activeNodeViews.size == newlines.length
// A single stale view causes a permanent mismatch that silently blocks all
// future line-number updates.

// Mock the INPUT_AREA_PLUGIN_KEY required by CodeBlockView
jest.mock('../src/inputArea.ts', () => ({
    INPUT_AREA_PLUGIN_KEY: {
        getState: jest.fn(() => ({ teacher: true }))
    }
}));

test("After lift, stale NodeViews in activeNodeViews prevent line numbers from reaching cells", () => {
    // Create a document with 3 code blocks (simulating post-lift state)
    const doc = WaterproofSchema.nodes.doc.create({}, [
        WaterproofSchema.nodes.code.create(null, WaterproofSchema.text("abc")),
        WaterproofSchema.nodes.newline.create(),
        WaterproofSchema.nodes.code.create(null, WaterproofSchema.text("def")),
        WaterproofSchema.nodes.newline.create(),
        WaterproofSchema.nodes.code.create(null, WaterproofSchema.text("ghi")),
    ]);

    // Create the code plugin (dummy completions/symbols/editor — apply doesn't use them)
    const plugin = codePlugin([], [], null as any, ThemeStyle.Light);
    const state = EditorState.create({ schema: WaterproofSchema, plugins: [plugin], doc });

    const pluginState = CODE_PLUGIN_KEY.getState(state);
    if (!pluginState) throw new Error("Code plugin state not found");

    // Simulate 3 real NodeViews + 1 stale view left over from lift
    const mockViews = [
        { _getPos: () => 0, updateLineNumbers: jest.fn() },           // code1
        { _getPos: () => 6, updateLineNumbers: jest.fn() },           // code2 (recreated after lift)
        { _getPos: () => undefined, updateLineNumbers: jest.fn() },   // code2-old (stale — destroyed by PM, never removed)
        { _getPos: () => 12, updateLineNumbers: jest.fn() },          // code3
    ];
    mockViews.forEach(v => pluginState.activeNodeViews.add(v as any));

    // Dispatch line numbers computed by mapping.computeLineNumbers()
    // (3 code blocks → 3 line numbers)
    const lineNumbers = [1, 5, 9];
    const tr = state.tr.setMeta(CODE_PLUGIN_KEY, lineNumbers);
    state.apply(tr);

    // EXPECTED: the 3 real code cells should each receive their line number.
    // BUG: activeNodeViews.size (4) != lineNumbers.length (3), so the code plugin
    //       skips the entire distribution — NO cell gets any line number update.
    expect(mockViews[0].updateLineNumbers).toHaveBeenCalledWith(2, false);  // line 1 + 1
    expect(mockViews[1].updateLineNumbers).toHaveBeenCalledWith(6, false);  // line 5 + 1
    expect(mockViews[3].updateLineNumbers).toHaveBeenCalledWith(10, false); // line 9 + 1
});
