export class TreeNode {
    /** The type of this node, should be in the WaterproofSchema schema */
    type: string;
    /** The inner range of the node, that is, the range of the content */
    contentRange: {to: number, from: number};
    /** The outer range of the node, that is, the range of the content including possible tags */
    tagRange: {to: number, from: number};
    /** The title of a node, only relevant for hint nodes */
    title: string;
    /** The computed start position in ProseMirror, this is the prosemirror position at which the content starts. 
     * Thus, for nodes with content this includes a +1 due to stepping in to the node. 
     * For newlines, there is no content, so the start points directly before the newline.
     */
    prosemirrorStart: number;
    /** The computed end position in ProseMirror */
    prosemirrorEnd: number;
    pmRange: {from: number, to: number};
    /** Potential children of this tree node */
    children: TreeNode[];

    constructor(
        type: string,
        contentRange: {to: number, from: number},
        tagRange: {to: number, from: number},
        title: string,
        prosemirrorStart: number,
        prosemirrorEnd: number,
        pmRange: {to: number, from: number},
    ) {
        this.type = type;
        this.contentRange = contentRange;
        this.tagRange = tagRange;
        this.title = title;
        this.prosemirrorStart = prosemirrorStart;
        this.prosemirrorEnd = prosemirrorEnd;
        this.pmRange= pmRange;
        this.children = [];
    }

    addChild(child: TreeNode): void {
        this.children.push(child);
        // Sort children by pmRange to maintain order
        this.children.sort((a, b) => a.pmRange.from - b.pmRange.from);
    }

    removeChild(child: TreeNode): void {
        this.children = this.children.filter(c => c != child);
    }

    shiftCloseOffsets(offset: number, offsetProsemirror?: number): void {
        this.prosemirrorEnd += offsetProsemirror ?? offset;
        this.pmRange.to += offsetProsemirror ?? offset;
        this.contentRange.to += offset;
        this.tagRange.to += offset;
    }

    shiftOffsets(offset: number, offsetProsemirror?: number): void {
        this.prosemirrorStart += offsetProsemirror ?? offset;
        this.prosemirrorEnd += offsetProsemirror ?? offset;
        this.pmRange.from += offsetProsemirror ?? offset;
        this.pmRange.to += offsetProsemirror ?? offset;
        this.contentRange.from += offset;
        this.contentRange.to += offset;
        this.tagRange.from += offset;
        this.tagRange.to += offset;
    }

    traverseDepthFirst(callback: (node: TreeNode) => void): void {
        callback(this);
        for(const child of this.children) {
            child.traverseDepthFirst(callback);
        }
    }
}

export class Tree {
    root: TreeNode;
    
    constructor(
        type: string,
        contentRange: {from: number, to: number},
        range: {from: number, to: number},
        title: string,
        prosemirrorStart: number,
        prosemirrorEnd: number,
        pmRange: {from: number, to: number}
    ) {
        // Explicitly create new ranges for the TreeNode to avoid shared references
        this.root = new TreeNode(type, {from: contentRange.from, to: contentRange.to}, {from: range.from, to: range.to}, title, prosemirrorStart, prosemirrorEnd, {from: pmRange.from, to: pmRange.to});
    }

    traverseDepthFirst(callback: (node: TreeNode) => void, node: TreeNode = this.root): void {
        callback(node);
        for(const child of node.children) {
            child.traverseDepthFirst(callback);
        }
    }

    traverseBreadthFirst(callback: (node: TreeNode) => void): void {
        const queue: TreeNode[] = [this.root];
        while (queue.length > 0) {
            const node = queue.shift();
            if (node) {
                callback(node);
                queue.push(...node.children);
            }
        }
    }

    // Finds the highest (closest to root) node that contains the given prosemirror position
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


    findParent(target: TreeNode, node: TreeNode | null = this.root, parent: TreeNode | null = null): TreeNode | null {
        if (!node) return null;
        if (node === target) return parent;
        for (const child of node.children) {
            const result = this.findParent(target, child, node);
            if (result) return result;
        }
        return null;
    }

    findNodeByOriginalPosition(pos: number, node: TreeNode | null = this.root): TreeNode | null {
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

    findNodeByProsemirrorPosition(pos: number, node: TreeNode | null = this.root): TreeNode | null {
        if (!node) return null;
        if (pos >= node.prosemirrorStart && pos <= node.prosemirrorEnd) {
            for (const child of node.children) {
                const result = this.findNodeByProsemirrorPosition(pos, child);
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
                return node.children[mid-1];
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

    nodesInProseRange(from: number, to: number, node: TreeNode | null = this.root): TreeNode[] {
        const result: TreeNode[] = [];
        if (!node) return result;
        if (node.pmRange.to < from || node.pmRange.from > to) return result;
        if (node.pmRange.from >= from && node.pmRange.to <= to) {
            result.push(node);
        }
        result.push(...node.children.flatMap(child => this.nodesInProseRange(from, to, child)));
        return result;
    }

    insertByPosition(newNode: TreeNode): boolean {
        if (!this.root) return false;
        
        for (const rootNode of this.root.children) {
            if (newNode.contentRange.from >= rootNode.contentRange.from && newNode.contentRange.to <= rootNode.contentRange.to) {
                rootNode.addChild(newNode);
                return true;
            }
        }
        this.root.addChild(newNode);
        return true;
    }
}
