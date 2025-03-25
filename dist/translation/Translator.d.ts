/** Class that handles the translation from .mv | .v to prosemirror and vice versa. */
export declare class FileTranslator {
    constructor();
    /**
     * Convert an input file to a prosemirror compatible HTML representation.
     * Input format is set by `fileFormat` in the constructor.
     * @param inputDocument The input document read from disk.
     * @returns A prosemirror compatible HTML document (as string).
     */
    toProsemirror(inputDocument: string): string;
}
//# sourceMappingURL=Translator.d.ts.map