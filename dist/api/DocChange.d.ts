/**
 * This object specifies a TextDocument change. As in prosemirror:
 * startInFile == endInFile: insert operation
 * else: replace or deletion with finalText
 */
export type DocChange = {
    startInFile: number;
    endInFile: number;
    finalText: string;
};
/**
 * This object specifies a wrapping TextDocument change. This happens when nodes
 * are wrapped with input or hint
 */
export type WrappingDocChange = {
    firstEdit: DocChange;
    secondEdit: DocChange;
};
//# sourceMappingURL=DocChange.d.ts.map