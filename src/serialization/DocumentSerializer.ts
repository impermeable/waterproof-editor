import { Node } from "prosemirror-model";
import { WaterproofSchema } from "../schema";
import { TagConfiguration } from "../api";

export class DocumentSerializer {
    constructor(private tagConf: TagConfiguration) {}

    /**
     * 
     * @param node 
     * @returns 
     */
    serializeNode(node: Node): string {
        
        let serialized: string = "";
        if (node.type == WaterproofSchema.nodes.markdown) {
            const serializerOutput = this.tagConf.markdown.openTag + node.textContent + this.tagConf.markdown.closeTag;
            serialized = serializerOutput;
        } else if (node.type == WaterproofSchema.nodes.code) {
            const serializerOutput = this.tagConf.code.openTag + node.textContent + this.tagConf.code.closeTag;
            serialized = serializerOutput;
        } else if (node.type == WaterproofSchema.nodes.hint) {
            const title = node.attrs.title;
            // Has child content
            const textContent: string[] = [];
            node.forEach(child => {
                const output = this.serializeNode(child);
                textContent.push(output);
            });
            serialized = this.tagConf.hint.openTag(title) + textContent.join("") + this.tagConf.hint.closeTag;
        } else if (node.type == WaterproofSchema.nodes.input) {
            // Has child content
            const textContent: string[] = [];
            node.forEach(child => {
                const output = this.serializeNode(child);
                textContent.push(output);
            });
            serialized = this.tagConf.input.openTag + textContent.join("") + this.tagConf.input.closeTag;
        } else if (node.type == WaterproofSchema.nodes.math_display) {
            const serializerOutput = this.tagConf.math.openTag + node.textContent + this.tagConf.math.closeTag;
            serialized += serializerOutput;
        } else if (node.type == WaterproofSchema.nodes.newline) {
            serialized = "\n";
        } else {  
            throw new Error(`[NodeSerializer] Encountered unsupported node type: ${node.type.name}`);
        }

        return serialized;
    }

    /**
     * 
     * @param node 
     */
    serializeDocument(node: Node) {
        const output: string[] = [];
        node.content.forEach(child => {
            output.push(this.serializeNode(child));
        });
        return output.join("");
    }
}