import { typeguards } from "../src/document";
import { parse } from "../src/markdown-defaults";

const doc = `# test
\`\`\`python
def example_function():
    return "Hello, World!"
\`\`\`
test
\`\`\`python
def example_function():
\`\`\`
<hint title="Important Hint">
This is a hint block with some **markdown** content.
</hint>`;

test("test", () => {
    const blocks = parse(doc, "python");

    expect(blocks.length).toBe(9);
    const [md1, nl1, py1, nl2, md2, nl3, py2, nl4, hint] = blocks;

    expect(typeguards.isMarkdownBlock(md1)).toBe(true);
    expect(typeguards.isNewlineBlock(nl1)).toBe(true);
    expect(typeguards.isCodeBlock(py1)).toBe(true);
    expect(typeguards.isNewlineBlock(nl2)).toBe(true);
    expect(typeguards.isMarkdownBlock(md2)).toBe(true);
    expect(typeguards.isNewlineBlock(nl3)).toBe(true);
    expect(typeguards.isCodeBlock(py2)).toBe(true);
    expect(typeguards.isNewlineBlock(nl4)).toBe(true);
    expect(typeguards.isHintBlock(hint)).toBe(true);
});