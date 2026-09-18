export class TreeNode {
  /** The type of this node, should be in the WaterproofSchema schema */
  type: string;
  /** The inner range of the node, that is, the range of the content */
  contentRange: { to: number; from: number };
  /** The outer range of the node, that is, the range of the content including possible tags */
  tagRange: { to: number; from: number };
  /** The title of a node, only relevant for hint and container nodes */
  title: string | null;
  suffixSize: number;
  pmRange: { from: number; to: number };
  lineStart: number;
  /** Potential children of this tree node */
  children: TreeNode[];

  constructor(
    type: string,
    contentRange: { to: number; from: number },
    tagRange: { to: number; from: number },
    title: string | null,
    pmRange: { to: number; from: number },
    lineStart: number,
    children: TreeNode[],
  ) {
    this.type = type;
    this.contentRange = contentRange;
    this.tagRange = tagRange;
    this.title = title;
    this.pmRange = pmRange;
    this.lineStart = lineStart;
    this.children = children;
    // The only node that has zero index cost to exit is the 'newline' node
    this.suffixSize = type === "newline" ? 0 : 1;
  }

  addChild(child: TreeNode): void {
    this.children.push(child);
    // Sort children by pmRange to maintain order
    this.children.sort((a, b) => a.pmRange.from - b.pmRange.from);
  }

  removeChild(child: TreeNode): void {
    // Preserves order
    this.children = this.children.filter((c) => c != child);
  }

  shiftCloseOffsets(offset: number, offsetProsemirror?: number): void {
    this.pmRange.to += offsetProsemirror ?? offset;
    this.contentRange.to += offset;
    this.tagRange.to += offset;
  }

  shiftOffsets(offset: number, offsetProsemirror?: number): void {
    this.pmRange.from += offsetProsemirror ?? offset;
    this.pmRange.to += offsetProsemirror ?? offset;
    this.contentRange.from += offset;
    this.contentRange.to += offset;
    this.tagRange.from += offset;
    this.tagRange.to += offset;
  }

  shiftLineStart(offset: number): void {
    this.lineStart += offset;
  }

  traverseDepthFirst(callback: (node: TreeNode) => void): void {
    callback(this);
    for (const child of this.children) {
      child.traverseDepthFirst(callback);
    }
  }

  /** The ProseMirror index at which the content of this node starts (after entering the node) */
  get prosemirrorStart() {
    return this.pmRange.from + 1;
  }

  /** The ProseMirror index after the content of this node (but before escaping this node) */
  get prosemirrorEnd() {
    return this.pmRange.to - this.suffixSize;
  }
}

export class Tree {
  root: TreeNode;
  private linenrs: number[] = [];
  private shouldRecomputeLinenrs = true;

  constructor(
    contentRange: { from: number; to: number },
    range: { from: number; to: number },
    pmRange: { from: number; to: number },
    lineStart: number,
    subtrees: TreeNode[],
  ) {
    // Explicitly create new ranges for the TreeNode to avoid shared references
    // Sets the type to 'root' and the title to null by default
    this.root = new TreeNode(
      "root",
      { from: contentRange.from, to: contentRange.to },
      { from: range.from, to: range.to },
      null,
      { from: pmRange.from, to: pmRange.to },
      lineStart,
      subtrees,
    );
  }

  traverseDepthFirst(
    callback: (node: TreeNode) => void,
    node: TreeNode = this.root,
  ): void {
    callback(node);
    for (const child of node.children) {
      child.traverseDepthFirst(callback);
    }
  }

  /**
   * Finds the highest (closest to root) node that contains the given prosemirror position
   */
  findHighestContainingNode(pos: number, node: TreeNode = this.root): TreeNode {
    if (pos < node.prosemirrorStart || pos > node.prosemirrorEnd) {
      throw new Error("Position out of bounds");
    }
    for (const child of node.children) {
      if (pos >= child.prosemirrorStart && pos <= child.prosemirrorEnd) {
        return this.findHighestContainingNode(pos, child);
      }
    }
    return node;
  }

  findParent(
    target: TreeNode,
    node: TreeNode | null = this.root,
    parent: TreeNode | null = null,
  ): TreeNode | null {
    if (!node) return null;
    if (node === target) return parent;
    for (const child of node.children) {
      const result = this.findParent(target, child, node);
      if (result) return result;
    }
    return null;
  }

  findNodeByOriginalPosition(
    pos: number,
    node: TreeNode | null = this.root,
  ): TreeNode | null {
    if (!node) return null;
    if (pos >= node.contentRange.from && pos <= node.contentRange.to) {
      for (const child of node.children) {
        const result = this.findNodeByOriginalPosition(pos, child);
        if (result) return result;
      }
      return node;
    }
    return null;
  }

  /**
   * Find the most specific node that contains the given ProseMirror position, this function is biased to find the
   * first node (in terms of position) containing the position. I.e. in a tree with a code cell that ends at 28 and a newline that
   * starts at 28, we will return the code cell when searching for position 28.
   *
   * When using this method, be careful of the cases where you can get the first child of some node,
   * since these might need some special casing. We suspect that changing this function to have a
   * right-bias rather than a left-bias shifts the above issue to concern the final child.
   *
   * @param pos ProseMirror position to search for
   * @param node The node to start the search from, defaults to the root node of the tree
   * @returns The most specific node containing the position, or null if no such node exists
   */
  findNodeByProsePos(pos: number, node: TreeNode = this.root): TreeNode | null {
    if (pos < node.pmRange.from || pos > node.pmRange.to) return null;

    // Binary search among children
    let left = 0;
    let right = node.children.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const child = node.children[mid];
      if (pos === child.pmRange.from && mid > 0) {
        return node.children[mid - 1];
      } else if (pos >= child.pmRange.from && pos <= child.pmRange.to) {
        if (child.children.length === 0) return child;
        return this.findNodeByProsePos(pos, child);
      } else if (pos <= child.pmRange.to) {
        right = mid - 1;
      } else if (pos > child.pmRange.to) {
        left = mid + 1;
      }
    }
    // If no child contains pos, return current node
    return node;
  }

  /**
   * This function returns the nodes fully contained in a range, descendant from a given node, but NOT transitively.
   * i.e. if Node A is fully contained in Node B, and B is within the range, then A does not get returned.
   * @param from Start of the range
   * @param to End of range
   * @param node TreeNode to start from
   * @returns top-level TreeNodes contained in the range.
   */
  nodesInProseRange(
    from: number,
    to: number,
    node: TreeNode | null = this.root,
  ): TreeNode[] {
    const result: TreeNode[] = [];
    if (!node) return result;
    if (node.pmRange.to < from || node.pmRange.from > to) return result;
    if (
      node !== this.root &&
      node.pmRange.from >= from &&
      node.pmRange.to <= to
    ) {
      result.push(node);
      return result; // children travel with this node; don't add them separately
    }
    result.push(
      ...node.children.flatMap((child) =>
        this.nodesInProseRange(from, to, child),
      ),
    );
    return result;
  }

  invalidateLinenumberCache() {
    this.shouldRecomputeLinenrs = true;
  }

  shouldUpdateLinenumbers() {
    return this.shouldRecomputeLinenrs;
  }

  computeLineNumbers(): Array<number> {
    if (this.shouldRecomputeLinenrs) {
      this.linenrs = [];
      this.traverseDepthFirst((node) => {
        if (node.type === "code") {
          this.linenrs.push(node.lineStart);
        }
      });
    }
    this.shouldRecomputeLinenrs = false;
    return this.linenrs;
  }
}
