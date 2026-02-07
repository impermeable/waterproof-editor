import { translateMvToProsemirror } from "./toProsemirror";

/** Class that handles the translation from .mv | .v to prosemirror and vice versa. */
export class FileTranslator {

    constructor() {}

    /**
     * Convert an input file to a prosemirror compatible HTML representation.
     * Input format is set by `fileFormat` in the constructor.
     * @param inputDocument The input document read from disk.
     * @returns A prosemirror compatible HTML document (as string).
     */
    public toProsemirror(inputDocument: string): string {
        return translateMvToProsemirror(inputDocument);
    }
}
