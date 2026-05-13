import { defaultToMarkdown } from "../src/translation";

test("Replace $ inside of markdown", () => {
    expect(defaultToMarkdown(String.raw`$\text{math-inline}$`)).toBe(String.raw`<math-inline>\text{math-inline}</math-inline>`);
});

test("Replace $ inside of markdown with content", () => {
    expect(defaultToMarkdown(String.raw`Content
$\text{math-inline}$ content in the line
More content`)).toBe(String.raw`Content
<math-inline>\text{math-inline}</math-inline> content in the line
More content`);
});
