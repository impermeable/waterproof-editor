import { DocumentSerializer, Mapping, WaterproofDocument } from "../../src/api";
import { CodeBlock, MarkdownBlock } from "../../src/document";
import { configuration } from "../../src/markdown-defaults";

const config = configuration("coq");
const serializer = new DocumentSerializer(config);

function createTestMapping(blocks: WaterproofDocument) {
    const mapping = new Mapping(blocks, 1, config, serializer)
    const tree = mapping.getMapping();
    return tree;
}

test("testMapping markdown only", () => {
    const blocks = [new MarkdownBlock("Hello", {from: 0, to: 5}, {from: 0, to: 5})];
    const nodes = createTestMapping(blocks);

    expect(nodes.root.type).toBe("");

    expect(nodes.root.children.length).toBe(1);
    const markdownNode = nodes.root.children[0];

    expect(markdownNode.type).toBe("markdown");
    expect(markdownNode.innerRange).toStrictEqual<{from: number, to: number}>({from: 0, to: 5});
    expect(markdownNode.range).toStrictEqual<{from: number, to: number}>({from: 0, to: 5});
    expect(markdownNode.prosemirrorStart).toBe(1);
    expect(markdownNode.prosemirrorEnd).toBe(6);
    expect(markdownNode.pmRange).toStrictEqual<{from: number, to: number}>({from: 0, to: 7});
});

test("testMapping coqblock with code", () => {
    const blocks = [new CodeBlock("Lemma test", {from: 0, to: 21}, {from: 7, to: 17})];
    const nodes = createTestMapping(blocks).root.children;
    
    expect(nodes.length).toBe(1);
    
    // Parent coqblock
    const coqblockNode = nodes[0];
    expect(coqblockNode.type).toBe("code");
    expect(coqblockNode.innerRange).toStrictEqual<{from: number, to: number}>({from: 7, to: 17});
    expect(coqblockNode.range).toStrictEqual<{from: number, to: number}>({from: 0, to: 21});
    expect(coqblockNode.prosemirrorStart).toBe(1);
    expect(coqblockNode.prosemirrorEnd).toBe(11);
    expect(coqblockNode.pmRange).toStrictEqual<{from: number, to: number}>({from: 0, to: 12});
});

// test("Input-area with nested coqblock", () => {
//     const content = "<input-area>\n```coq\nTest\n```\n</input-area>Hello";
//     const nodes = createTestMapping(content).root.children;
    
//     expect(nodes.length).toBe(2);
    
//     // Input-area node
//     const inputAreaNode = nodes[0];
//     expect(inputAreaNode.type).toBe("input");
//     expect(inputAreaNode.innerRange.from).toBe(12);
//     expect(inputAreaNode.innerRange.to).toBe(29);
//     expect(inputAreaNode.prosemirrorStart).toBe(1); 
//     expect(inputAreaNode.prosemirrorEnd).toBe(9); 
    
//     // Nested coqblock
//     // const coqblockNode = nodes[3];
//     // console.log(nodes)
//     // expect(coqblockNode.type).toBe("code");
//     // expect(coqblockNode.innerRange.from).toBe(20); 
//     // expect(coqblockNode.innerRange.to).toBe(24);
//     // expect(coqblockNode.prosemirrorStart).toBe(3);
//     // expect(coqblockNode.prosemirrorEnd).toBe(7);

// });

// test("Hint block with coqblock and markdown inside", () => {
//     const content = "<hint title=\"Import libraries\">\n```coq\nRequire Import Rbase.\n```\n</hint>";
//     const nodes = createTestMapping(content);
    
//     expect(nodes.length).toBe(3);
    
//     // Hint node
//     const hintNode = nodes[1];
//     expect(hintNode.type).toBe("hint");
//     expect(hintNode.innerRange.from).toBe(31);
//     expect(hintNode.innerRange.to).toBe(65);
//     expect(hintNode.prosemirrorStart).toBe(1);
//     expect(hintNode.prosemirrorEnd).toBe(31);
//     // Nested coqblock
//     const coqblockNode = nodes[2];
//     expect(coqblockNode.innerRange.from).toBe(39); 
//     expect(coqblockNode.innerRange.to).toBe(60);
// });

// test("Mixed content section", () => {
//     const content = `### Example:
// \`\`\`coq
// Lemma
// Test
// \`\`\`
// <input-area>
// \`\`\`coq
// (* Your solution here *)
// \`\`\`
// </input-area>`;
//     const nodes = createTestMapping(content);
//     console.log(nodes)
    
//     // Expected nodes: markdown (header), coqblock, input-area (with coqblock)
//     expect(nodes.length).toBe(5);
    
//     // Verify markdown header
//     const headerNode = nodes[1];
//     expect(headerNode.type).toBe("markdown");
//     expect(headerNode.stringContent).toContain("### Example:");
//     expect(headerNode.innerRange.from).toBe(0)
//     expect(headerNode.innerRange.to).toBe(12)
//     expect(headerNode.prosemirrorStart).toBe(1)
//     expect(headerNode.prosemirrorEnd).toBe(13)
    
//     // Example coqblock
//     const exampleCoqblock = nodes[2];
//     expect(exampleCoqblock.type).toBe("code");
//     expect(exampleCoqblock.innerRange.from).toBe(20)
//     expect(exampleCoqblock.innerRange.to).toBe(30)
//     expect(exampleCoqblock.prosemirrorStart).toBe(15)
//     expect(exampleCoqblock.prosemirrorEnd).toBe(25)
    
//     // Input-area
//     const inputAreaNode = nodes[3];
//     expect(inputAreaNode.type).toBe("input_area");
    
//     // Nested coqblock inside input-area
//     const nestedCoqblock = nodes[4];
//     expect(nestedCoqblock.type).toBe("code");
//     expect(nestedCoqblock.innerRange.from).toBe(55)
//     expect(nestedCoqblock.innerRange.to).toBe(79)
//     expect(nestedCoqblock.prosemirrorStart).toBe(28)
//     expect(nestedCoqblock.prosemirrorEnd).toBe(52)
// });

// test("Empty coqblock", () => {
//     const content = "```coq\n```";
//     const nodes = createTestMapping(content);
    
//     expect(nodes.length).toBe(2);
    
//     // Child coqcode (empty)
//     const coqcodeNode = nodes[1];
//     expect(coqcodeNode.stringContent).toBe("");
// });