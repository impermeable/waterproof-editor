export function toMathInline(input: string): string {
    return input.replaceAll(/\$(.*?)\$/g, "<math-inline>$1</math-inline>");
}

export const defaultToMarkdown = toMathInline;