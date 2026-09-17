import { Node } from "prosemirror-model";
import { DocumentSerializer, Mapping, TagConfiguration } from "./api";
import { Block, typeguards } from "./document";
import { root } from "./document/blocks/schema";
import { Tree, TreeNode } from "./mapping";

export function constructProseMirrorDocument(
  blocks: Block[],
  version: number,
  tagConf: TagConfiguration,
  serializer: DocumentSerializer,
): [Node, Mapping] {
  console.log("Blocks");
  console.log(blocks);

  // Start building the tree and document for the blocks on the top level.
  // Blocks in our representation are not stored in a 'doc' or 'root' node.

  const [docNodes, treeNodes] = docAndTreeForBlocks(0, blocks);

  const proseDoc = root(docNodes);
  const tree = new Tree(
    { from: 0, to: blocks.at(-1)!.range.to }, // contentRange
    { from: 0, to: blocks.at(-1)!.range.to }, // tagRange
    { from: 0, to: proseDoc.nodeSize - 1 }, // pmRange
    0,
    treeNodes,
  );
  console.log(proseDoc.toJSON());
  console.log(tree);

  const mapping = new Mapping(version, tagConf, serializer, tree);

  console.log("TREE UNDERNEATH");
  console.log(JSON.stringify(mapping.getMapping()));

  return [proseDoc, mapping];
}

/**
 * Constructs the document and tree nodes for a single block
 * @param offset
 * @param block
 * @returns
 */
function docAndTreeForBlock(offset: number, block: Block): [Node, TreeNode] {
  const docNode = block.toProseMirror([]);
  const treeNode = treeNodeForBlock(offset, block, docNode.nodeSize, []);
  return [docNode, treeNode];
}

/**
 * Constructs the document and tree nodes for a sequence of consecutive blocks
 * @param startOffset
 * @param blocks
 * @returns
 */
function docAndTreeForBlocks(
  startOffset: number,
  blocks: Block[],
): [Node[], TreeNode[]] {
  const treeNodes: TreeNode[] = [];
  const docNodes: Node[] = [];

  let accumulatedOffset = startOffset;

  // For every block on this level
  for (const block of blocks) {
    // We split into two cases. Either the block contains child blocks or not.
    if (block.innerBlocks && block.innerBlocks.length > 0) {
      // In the case that this block contains child blocks
      // we make a recursive call on the children blocks first
      const [childDocNodes, childTreeNodes] = docAndTreeForBlocks(
        accumulatedOffset + 1, // Entering this nodes accounts for one
        block.innerBlocks,
      );
      // Determine the size (in ProseMirror) indices of the child nodes
      const totalChildSize = childDocNodes.reduce(
        (acc, n) => acc + n.nodeSize,
        0,
      );

      // Convert this block to a ProseMirror node, add the child nodes and add
      // the node to the array of nodes for this level.
      const docNode = block.toProseMirror(childDocNodes);
      docNodes.push(docNode);

      // Similarly for the tree nodes at this level
      const treeNode = treeNodeForBlock(
        accumulatedOffset, // The offset at the start of this node
        block,
        docNode.nodeSize,
        childTreeNodes,
      );
      treeNodes.push(treeNode);

      // The +2 here accounts for the entering and exiting of this block/node
      accumulatedOffset += totalChildSize + 2;
    } else {
      // This block does not contain further blocks
      const [docNode, treeNode] = docAndTreeForBlock(accumulatedOffset, block);

      docNodes.push(docNode);
      treeNodes.push(treeNode);

      const size = docNode.nodeSize;
      accumulatedOffset += size;
    }
  }

  return [docNodes, treeNodes];
}

function treeNodeForBlock(
  offset: number,
  block: Block,
  size: number,
  childNodes: TreeNode[],
): TreeNode {
  const title = typeguards.isHintBlock(block)
    ? block.title
    : typeguards.isContainerBlock(block)
      ? block.name
      : null;

  const node = new TreeNode(
    block.type,
    // Explicit dereferencing of object properties to avoid shared references to innerRange and range
    { from: block.innerRange.from, to: block.innerRange.to },
    { from: block.range.from, to: block.range.to },
    title,
    { from: offset, to: offset + size },
    block.lineStart,
    childNodes,
  );

  return node;
}
