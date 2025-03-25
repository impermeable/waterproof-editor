import { Fragment, Node, Slice } from "prosemirror-model";
export type NodeSerializer = (node: Node) => string;
export type MarkSerializer = (text: string) => string;
/**
 * Abstract class that describes a serializer for the conversion of the document
 */
export declare abstract class Serializer {
    abstract serializeFragment(fragment: Fragment): string;
    abstract serializeSlice(slice: Slice): string;
    serialize(input: Fragment | Slice): string | null;
}
//# sourceMappingURL=types.d.ts.map