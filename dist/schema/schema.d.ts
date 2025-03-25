import { Schema } from "prosemirror-model";
export declare const SchemaCell: {
    readonly InputArea: "input";
    readonly Markdown: "markdown";
    readonly MathDisplay: "math_display";
    readonly Code: "code";
};
export type SchemaKeys = keyof typeof SchemaCell;
export type SchemaNames = typeof SchemaCell[SchemaKeys];
/**
 * General schema obtained from `prosemirror-markdown`:
 * https://github.com/ProseMirror/prosemirror-markdown/blob/master/src/schema.ts
 *
 * Codeblock schema adapted from 'ProseMirror footnote example':
 * https://prosemirror.net/examples/footnote/
 *
 * math blocks obtained from `prosemirror-math`:
 * https://github.com/benrbray/prosemirror-math/blob/master/src/math-schema.ts
 *
 * see [notes](./notes.md)
 */
export declare const WaterproofSchema: Schema;
//# sourceMappingURL=schema.d.ts.map