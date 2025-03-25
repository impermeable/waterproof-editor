import { Schema } from "prosemirror-model";
/**
 * The schema in use to render markdown.
 * Consists of the default prosemirror-markdown schema augmented with the
 * prosemirror-math `math_inline` nodes.
 */
export declare const markdownRenderingSchema: Schema<keyof import("orderedmap").default<import("prosemirror-model").NodeSpec>, keyof import("orderedmap").default<import("prosemirror-model").MarkSpec>>;
//# sourceMappingURL=MarkdownSchema.d.ts.map