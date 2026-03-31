import { Fragment, Node } from "prosemirror-model";
import { WaterproofSchema } from "../schema";
import { TagConfiguration } from "../api";

export class SerializationError extends Error {
    constructor(message: string) {
        super("[SerializationError] " + message);
    }
}

export abstract class DocumentSerializer {
    /**
     * Describes how to turn a code node into a string representation.
     * @param codeNode The code node that is going to be serialized
     * @param parentNode The parent node of this node (if it has one)
     * @param neighbors Function that upon calling will return the neighbors of the node being serialized. When `skipNewlines` is set and the *direct* neighbors
     * of the node are newline nodes they will be skipped and the next nodes will be returned (if they exist).
     */
    abstract serializeCode(codeNode: Node, parentNode: string | null, neighbors: (skipNewlines: boolean) => {nodeAbove: string | null, nodeBelow: string | null}): string;
    /**
     * Describes how to turn a math node into a string representation.
     * @param mathNode The math node that is going to be serialized
     * @param parentNode The parent node of this node (if it has one)
     * @param neighbors Function that upon calling will return the neighbors of the node being serialized. When `skipNewlines` is set and the *direct* neighbors
     * of the node are newline nodes they will be skipped and the next nodes will be returned (if they exist).
     */
    abstract serializeMath(mathNode: Node, parentNode: string | null, neighbors: (skipNewlines: boolean) => {nodeAbove: string | null, nodeBelow: string | null}): string;
    /**
     * Describes how to turn a markdown node into a string representation.
     * @param codeNode The markdown node that is going to be serialized
     * @param parentNode The parent node of this node (if it has one)
     * @param neighbors Function that upon calling will return the neighbors of the node being serialized. When `skipNewlines` is set and the *direct* neighbors
     * of the node are newline nodes they will be skipped and the next nodes will be returned (if they exist).
     */
    abstract serializeMarkdown(markdownNode: Node, parentNode: string | null, neighbors: (skipNewlines: boolean) => {nodeAbove: string | null, nodeBelow: string | null}): string;
    /**
     * Describes how to turn a input node into a string representation. 
     * This node can have children, so you probably want to call `this.serializeNode` on every child node using
     * `inputNde.forEach((child) => {...})`
     * @param inputNode The input node that is going to be serialized
     * @param parentNode The parent node of this node (if it has one)
     * @param neighbors Function that upon calling will return the neighbors of the node being serialized. When `skipNewlines` is set and the *direct* neighbors
     * of the node are newline nodes they will be skipped and the next nodes will be returned (if they exist).
     */
    abstract serializeInput(inputNode: Node, parentNode: string | null, neighbors: (skipNewlines: boolean) => {nodeAbove: string | null, nodeBelow: string | null}): string;
    /**
     * Describes how to turn a hint node into a string representation. This function can query the title of the node via
     * `hint.attrs.title`. This node can have children, so you probably want to call `this.serializeNode` on every child node using
     * `hintNode.forEach((child) => {...})`
     * @param hintNode The hint node that is going to be serialized
     * @param parentNode The parent node of this node (if it has one)
     * @param neighbors Function that upon calling will return the neighbors of the node being serialized. When `skipNewlines` is set and the *direct* neighbors
     * of the node are newline nodes they will be skipped and the next nodes will be returned (if they exist).
     */
    abstract serializeHint(hintNode: Node, parentNode: string | null, neighbors: (skipNewlines: boolean) => {nodeAbove: string | null, nodeBelow: string | null}): string;
    
    serializeText(node: Node): string {
        return node.textContent;
    }

    serializeNewline(): string {
        return "\n";
    }

    /**
     * Serializes a node to its string representation.
     * @param node The node to serialize.
     * @param parent The type name of the parent node, or null if the node is at root level.
     * @param neighbors A function that returns the node types above and below the current node, with an option to skip newline nodes.
     * @returns The serialized (string) representation of the node.
     * @throws A {@linkcode SerializationError} when the node type is not supported.
     */
    public serializeNode(node: Node, parent: string | null, neighbors: (skipNewlines: boolean) => {nodeAbove: string | null, nodeBelow: string | null}): string {
        switch (node.type) {
            case WaterproofSchema.nodes.markdown: return this.serializeMarkdown(node, parent, neighbors);
            case WaterproofSchema.nodes.code: return this.serializeCode(node, parent, neighbors);
            case WaterproofSchema.nodes.math_display: return this.serializeMath(node, parent, neighbors);
            case WaterproofSchema.nodes.input: return this.serializeInput(node, parent, neighbors);
            case WaterproofSchema.nodes.hint: return this.serializeHint(node, parent, neighbors);
            case WaterproofSchema.nodes.text: return this.serializeText(node);
            case WaterproofSchema.nodes.newline: return this.serializeNewline();
            default:
                throw new SerializationError(`[SerializeNode] Node of type "${node.type.name}" not supported.`);
        }
    }
    
    /**
     * Serializes a fragment of nodes into a string representation.
     * 
     * This method iterates through each child node in the fragment and serializes it individually.
     * For each node, it provides context about neighboring nodes to the serialization function,
     * with an option to skip newline nodes when determining context.
     * @param fragment The node content fragment to serialize
     * @param parent The parent node name, or null if there is no parent
     * @returns The serialized string representation of the fragment
     * @throws A {@linkcode SerializationError} when the document contains a node type that is not supported by the serializer.
     */
    public serializeFragment(fragment: Fragment, parent: string | null): string {
        const output: string[] = [];
        fragment.forEach((child, _, idx) => {
            const nodeDirectlyAbove = fragment.maybeChild(idx - 1);
            const nodeTwoAbove = fragment.maybeChild(idx - 2);

            const nodeDirectlyBelow = fragment.maybeChild(idx + 1);
            const nodeTwoBelow = fragment.maybeChild(idx + 2);

            const func = (skipNewlines: boolean): { nodeAbove: string | null; nodeBelow: string | null } => {
                let above = nodeDirectlyAbove?.type.name ?? null;
                let below = nodeDirectlyBelow?.type.name ?? null;

                if (above === "newline" && skipNewlines) above = nodeTwoAbove?.type.name ?? null;
                if (below === "newline" && skipNewlines) below = nodeTwoBelow?.type.name ?? null;

                return {nodeAbove: above, nodeBelow: below};
            };

            output.push(this.serializeNode(child, parent, func));
        });
        return output.join("");
    }

    /**
     * Serializes the whole ProseMirror document into its string representation.
     * 
     * @param node The document node to serialize, this should probably be the root (`doc`) node of the ProseMirror document.
     * @returns The string representation of the document
     * @throws A {@linkcode SerializationError} when the document contains a node type that is not supported by the serializer.
     */
    public serializeDocument(node: Node) {
        const output: string[] = [];
        node.content.forEach((child, _, idx) => {
            const nodeDirectlyAbove = node.maybeChild(idx - 1);
            const nodeTwoAbove = node.maybeChild(idx - 2);

            const nodeDirectlyBelow = node.maybeChild(idx + 1);
            const nodeTwoBelow = node.maybeChild(idx + 2);

            const func = (skipNewlines: boolean): { nodeAbove: string | null; nodeBelow: string | null } => {
                let above = nodeDirectlyAbove?.type.name ?? null;
                let below = nodeDirectlyBelow?.type.name ?? null;

                if (above === "newline" && skipNewlines) above = nodeTwoAbove?.type.name ?? null;
                if (below === "newline" && skipNewlines) below = nodeTwoBelow?.type.name ?? null;

                return {nodeAbove: above, nodeBelow: below};
            };

            output.push(this.serializeNode(child, node.type.name, func));
        });
        return output.join("");
    }
}

export class DefaultTagSerializer extends DocumentSerializer {

    constructor(private readonly tagConf: TagConfiguration) { 
        super(); 
    }

    serializeCode(node: Node): string {
        return this.tagConf.code.openTag + node.textContent + this.tagConf.code.closeTag;
    }

    serializeMath(node: Node): string {
        return this.tagConf.math.openTag + node.textContent + this.tagConf.math.closeTag;
    }

    serializeMarkdown(node: Node): string {
        return this.tagConf.markdown.openTag + node.textContent + this.tagConf.markdown.closeTag;
    }

    serializeInput(node: Node): string {
        // Has child content
        const textContent: string[] = [];
        node.forEach(child => {
            const output = this.serializeNode(child, "input", () => {return {nodeAbove: null, nodeBelow: null}} );
            textContent.push(output);
        });
        return this.tagConf.input.openTag + textContent.join("") + this.tagConf.input.closeTag;
    }

    serializeHint(node: Node): string {
        const title = node.attrs.title;
        // Has child content
        const textContent: string[] = [];
        node.forEach(child => {
            const output = this.serializeNode(child, "hint", () => {return {nodeAbove: null, nodeBelow: null}});
            textContent.push(output);
        });
        return this.tagConf.hint.openTag(title) + textContent.join("") + this.tagConf.hint.closeTag;
    }
}