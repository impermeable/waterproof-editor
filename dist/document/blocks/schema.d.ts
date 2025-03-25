import { Node as ProseNode } from "prosemirror-model";
/** Construct basic prosemirror text node. */
export declare const text: (content: string) => ProseNode;
/** Construct coq markdown prosemirror node. */
export declare const coqMarkdown: (content: string) => ProseNode;
/** Construct math display prosemirror node. */
export declare const mathDisplay: (content: string) => ProseNode;
/** Construct markdown prosemirror node. */
export declare const markdown: (content: string) => ProseNode;
/** Construct coqcode prosemirror node. */
export declare const coqCode: (content: string) => ProseNode;
/** Construct input area prosemirror node. */
export declare const inputArea: (childNodes: ProseNode[]) => ProseNode;
/** Construct hint prosemirror node. */
export declare const hint: (title: string, childNodes: ProseNode[]) => ProseNode;
/** Construct coq prosemirror node. */
export declare const coqblock: (childNodes: ProseNode[], prePreWhite: string, prePostWhite: string, postPreWhite: string, postPostWhite: string) => ProseNode;
/** Construct coqdoc prosemirror node. */
export declare const coqDoc: (childNodes: ProseNode[], preWhite: string, postWhite: string) => ProseNode;
export declare const root: (childNodes: ProseNode[]) => ProseNode;
//# sourceMappingURL=schema.d.ts.map