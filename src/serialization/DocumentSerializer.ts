import { Node } from "prosemirror-model";
import { WaterproofSchema } from "../schema";
import { TagConfiguration } from "../api";

export abstract class DocumentSerializer {
    /**
     * Describes how to turn a code node into a string representation.
     * @param codeNode The code node that is going to be serialized
     * @param parentNode The parent node of this node (if it has one)
     * @param nodeAbove The node above this node (if there is one)
     * @param nodeBelow The node below this node (if there is one)
     */
    abstract serializeCode(codeNode: Node, parentNode: string | null, nodeAbove: string | null, nodeBelow: string | null): string;
    /**
     * Describes how to turn a math node into a string representation.
     * @param mathNode The math node that is going to be serialized
     * @param parentNode The parent node of this node (if it has one)
     * @param nodeAbove The node above this node (if there is one)
     * @param nodeBelow The node below this node (if there is one)
     */
    abstract serializeMath(mathNode: Node, parentNode: string | null, nodeAbove: string | null, nodeBelow: string | null): string;
    /**
     * Describes how to turn a markdown node into a string representation.
     * @param codeNode The markdown node that is going to be serialized
     * @param parentNode The parent node of this node (if it has one)
     * @param nodeAbove The node above this node (if there is one)
     * @param nodeBelow The node below this node (if there is one)
     */
    abstract serializeMarkdown(markdownNode: Node, parentNode: string | null, nodeAbove: string | null, nodeBelow: string | null): string;
    /**
     * Describes how to turn a input node into a string representation. 
     * This node can have children, so you probably want to call `this.serializeNode` on every child node using
     * `inputNde.forEach((child) => {...})`
     * @param inputNode The input node that is going to be serialized
     * @param parentNode The parent node of this node (if it has one)
     * @param nodeAbove The node above this node (if there is one)
     * @param nodeBelow The node below this node (if there is one)
     */
    abstract serializeInput(inputNode: Node, parentNode: string | null, nodeAbove: string | null, nodeBelow: string | null): string;
    /**
     * Describes how to turn a hint node into a string representation. This function can query the title of the node via
     * `hint.attrs.title`. This node can have children, so you probably want to call `this.serializeNode` on every child node using
     * `hintNode.forEach((child) => {...})`
     * @param hintNode The hint node that is going to be serialized
     * @param parentNode The parent node of this node (if it has one)
     * @param nodeAbove The node above this node (if there is one)
     * @param nodeBelow The node below this node (if there is one)
     */
    abstract serializeHint(hintNode: Node, parentNode: string | null, nodeAbove: string | null, nodeBelow: string | null): string;
    
    serializeText(node: Node): string {
        return node.textContent;
    }

    serializeNewline(): string {
        return "\n";
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    public serializeNode(node: Node, parent: string | null, nodeAbove: string | null, nodeBelow: string | null): string {
        switch (node.type) {
            case WaterproofSchema.nodes.markdown: return this.serializeMarkdown(node, parent, nodeAbove, nodeBelow);
            case WaterproofSchema.nodes.code: return this.serializeCode(node, parent, nodeAbove, nodeBelow);
            case WaterproofSchema.nodes.math_display: return this.serializeMath(node, parent, nodeAbove, nodeBelow);
            case WaterproofSchema.nodes.input: return this.serializeInput(node, parent, nodeAbove, nodeBelow);
            case WaterproofSchema.nodes.hint: return this.serializeHint(node, parent, nodeAbove, nodeBelow);
            case WaterproofSchema.nodes.text: return this.serializeText(node);
            case WaterproofSchema.nodes.newline: return this.serializeNewline();
            default:
                throw Error(`[SerializeNode] Node of type "${node.type.name}" not supported.`);
        }
    }

    /**
     * 
     * @param node 
     */
    public serializeDocument(node: Node) {
        const output: string[] = [];
        node.content.forEach((child, _, idx) => {
            const nodeAbove = node.maybeChild(idx - 1);
            const nodeBelow = node.maybeChild(idx + 1);
            output.push(this.serializeNode(child, node.type.name, nodeAbove?.type.name ?? null, nodeBelow?.type.name ?? null));
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
            const output = this.serializeNode(child, null, null, null);
            textContent.push(output);
        });
        return this.tagConf.input.openTag + textContent.join("") + this.tagConf.input.closeTag;
    }

    serializeHint(node: Node): string {
        const title = node.attrs.title;
        // Has child content
        const textContent: string[] = [];
        node.forEach(child => {
            const output = this.serializeNode(child, null, null, null);
            textContent.push(output);
        });
        return this.tagConf.hint.openTag(title) + textContent.join("") + this.tagConf.hint.closeTag;
    }
}