/* eslint-disable no-useless-escape */

import { parse } from "../src/markdown-defaults";
import { isMarkdownBlock, isCodeBlock, isHintBlock, isInputAreaBlock, isMathDisplayBlock, isNewlineBlock } from "../src/document/blocks";
import { HintBlock } from "../src/document";

const exampleDocument = `# Sample Document

Here is some introductory text.
\`\`\`python
def example_function():
    return "Hello, World!"
\`\`\`
<hint title="Important Hint">
This is a hint block with some **markdown** content.

\`\`\`python
# Nested code block inside hint
print("This is a nested code block")
\`\`\`
More hint text.
</hint><input-area>Some concluding text.
$$
E = mc^2
$$</input-area>`;

test("test", () => {
    const blocks = parse(exampleDocument, "python");

    expect(blocks.length).toBe(6);
    const [b1, nl1, b2, nl2, b3, b4] = blocks;
    expect(isMarkdownBlock(b1)).toBe(true);
    expect(isNewlineBlock(nl1)).toBe(true);
    expect(isCodeBlock(b2)).toBe(true);
    expect(isNewlineBlock(nl2)).toBe(true);
    expect(isHintBlock(b3)).toBe(true);
    expect(isInputAreaBlock(b4)).toBe(true);

    expect(b1.range.from).toBe(0);
    expect(b1.range.to).toBe(50);
    expect(b1.innerRange.from).toBe(0);
    expect(b1.innerRange.to).toBe(50);
    expect(b1.stringContent).toBe(`# Sample Document

Here is some introductory text.`);

    expect(b2.range.from).toBe(51);
    expect(b2.range.to).toBe(115);
    expect(b2.innerRange.from).toBe(61);
    expect(b2.innerRange.to).toBe(111);
    expect(b2.stringContent).toBe(`def example_function():
    return "Hello, World!"`);

    expect(b3.range.from).toBe(116);
    expect(b3.range.to).toBe(306);
    expect((b3 as HintBlock).title).toBe("Important Hint");
    expect(b3.innerRange.from).toBe(145);
    expect(b3.innerRange.to).toBe(299);

    expect(b4.range.from).toBe(306);
    expect(b4.range.to).toBe(367);
    expect(b4.innerRange.from).toBe(318);
    expect(b4.innerRange.to).toBe(354);

    expect(b3.innerBlocks?.length).toBe(5);
    const [hIn1, hIn_nl1, hIn2, hIn_nl2, hIn3] = b3.innerBlocks!;
    expect(isMarkdownBlock(hIn1)).toBe(true);
    expect(isNewlineBlock(hIn_nl1)).toBe(true);
    expect(isCodeBlock(hIn2)).toBe(true);
    expect(isNewlineBlock(hIn_nl2)).toBe(true);
    expect(isMarkdownBlock(hIn3)).toBe(true);
    
    expect(hIn1.stringContent).toBe(`
This is a hint block with some **markdown** content.
`);
    expect(hIn1.range.from).toBe(145);
    expect(hIn1.range.to).toBe(199);
    expect(hIn1.innerRange.from).toBe(145);
    expect(hIn1.innerRange.to).toBe(199);
    
    expect(hIn2.stringContent).toBe('# Nested code block inside hint\nprint("This is a nested code block")');
    expect(hIn2.range.from).toBe(200);
    expect(hIn2.range.to).toBe(282);
    expect(hIn2.innerRange.from).toBe(210);
    expect(hIn2.innerRange.to).toBe(278);

    expect(hIn3.stringContent).toBe('More hint text.\n');
    expect(hIn3.range.from).toBe(283);
    expect(hIn3.range.to).toBe(299);
    expect(hIn3.innerRange.from).toBe(283);
    expect(hIn3.innerRange.to).toBe(299);

    const [iIn1, iIn2] = b4.innerBlocks!;
    expect(isMarkdownBlock(iIn1)).toBe(true);
    expect(isMathDisplayBlock(iIn2)).toBe(true);
    
    expect(iIn1.stringContent).toBe('Some concluding text.\n');
    expect(iIn1.range.from).toBe(318);
    expect(iIn1.range.to).toBe(340);
    expect(iIn1.innerRange.from).toBe(318);
    expect(iIn1.innerRange.to).toBe(340);

    expect(iIn2.stringContent).toBe("\nE = mc^2\n");
    expect(iIn2.range.from).toBe(340);
    expect(iIn2.range.to).toBe(354);
    expect(iIn2.innerRange.from).toBe(342);
    expect(iIn2.innerRange.to).toBe(352);
});