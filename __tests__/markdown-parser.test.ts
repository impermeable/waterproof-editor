import { parser } from "../src/markdown-defaults";

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
    const blocks = parser(doc, "python");
    console.log(blocks);
    expect(blocks.length).toBe(9);
});