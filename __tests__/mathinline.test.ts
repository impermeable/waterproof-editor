import { defaultToMarkdown } from "../src/translation";

test("Replace $ inside of markdown", () => {
    expect(defaultToMarkdown("$\\text{math-inline}$")).toBe("<math-inline>\\text{math-inline}</math-inline>");
});

test("Replace $ inside of markdown with content", () => {
    expect(defaultToMarkdown("Content\n$\\text{math-inline}$ content in the line\nMore content")).toBe("Content\n<math-inline>\\text{math-inline}</math-inline> content in the line\nMore content");
});
