// src/api/InputAreaStatus.ts
var InputAreaStatus = /* @__PURE__ */ ((InputAreaStatus2) => {
  InputAreaStatus2["Proven"] = "proven";
  InputAreaStatus2["Incomplete"] = "incomplete";
  InputAreaStatus2["Invalid"] = "invalid";
  return InputAreaStatus2;
})(InputAreaStatus || {});

// src/api/Severity.ts
var Severity = /* @__PURE__ */ ((Severity2) => {
  Severity2[Severity2["Error"] = 0] = "Error";
  Severity2[Severity2["Warning"] = 1] = "Warning";
  Severity2[Severity2["Information"] = 2] = "Information";
  Severity2[Severity2["Hint"] = 3] = "Hint";
  return Severity2;
})(Severity || {});
var SeverityLabelMap = {
  [0 /* Error */]: "error",
  [1 /* Warning */]: "warning",
  [2 /* Information */]: "info",
  [3 /* Hint */]: "hint"
};

// src/api/FileFormat.ts
var FileFormat = /* @__PURE__ */ ((FileFormat2) => {
  FileFormat2["MarkdownV"] = "MarkdownV";
  FileFormat2["RegularV"] = "RegularV";
  return FileFormat2;
})(FileFormat || {});

// src/api/types.ts
var WaterproofMapping = class {
};
var HistoryChange = /* @__PURE__ */ ((HistoryChange2) => {
  HistoryChange2[HistoryChange2["Undo"] = 0] = "Undo";
  HistoryChange2[HistoryChange2["Redo"] = 1] = "Redo";
  return HistoryChange2;
})(HistoryChange || {});
var CoqFileProgressKind = /* @__PURE__ */ ((CoqFileProgressKind2) => {
  CoqFileProgressKind2[CoqFileProgressKind2["Processing"] = 1] = "Processing";
  CoqFileProgressKind2[CoqFileProgressKind2["FatalError"] = 2] = "FatalError";
  return CoqFileProgressKind2;
})(CoqFileProgressKind || {});

// node_modules/prosemirror-model/dist/index.js
function findDiffStart(a, b, pos) {
  for (let i = 0; ; i++) {
    if (i == a.childCount || i == b.childCount)
      return a.childCount == b.childCount ? null : pos;
    let childA = a.child(i), childB = b.child(i);
    if (childA == childB) {
      pos += childA.nodeSize;
      continue;
    }
    if (!childA.sameMarkup(childB))
      return pos;
    if (childA.isText && childA.text != childB.text) {
      for (let j = 0; childA.text[j] == childB.text[j]; j++)
        pos++;
      return pos;
    }
    if (childA.content.size || childB.content.size) {
      let inner = findDiffStart(childA.content, childB.content, pos + 1);
      if (inner != null)
        return inner;
    }
    pos += childA.nodeSize;
  }
}
function findDiffEnd(a, b, posA, posB) {
  for (let iA = a.childCount, iB = b.childCount; ; ) {
    if (iA == 0 || iB == 0)
      return iA == iB ? null : { a: posA, b: posB };
    let childA = a.child(--iA), childB = b.child(--iB), size = childA.nodeSize;
    if (childA == childB) {
      posA -= size;
      posB -= size;
      continue;
    }
    if (!childA.sameMarkup(childB))
      return { a: posA, b: posB };
    if (childA.isText && childA.text != childB.text) {
      let same = 0, minSize = Math.min(childA.text.length, childB.text.length);
      while (same < minSize && childA.text[childA.text.length - same - 1] == childB.text[childB.text.length - same - 1]) {
        same++;
        posA--;
        posB--;
      }
      return { a: posA, b: posB };
    }
    if (childA.content.size || childB.content.size) {
      let inner = findDiffEnd(childA.content, childB.content, posA - 1, posB - 1);
      if (inner)
        return inner;
    }
    posA -= size;
    posB -= size;
  }
}
var Fragment = class {
  /**
  @internal
  */
  constructor(content, size) {
    this.content = content;
    this.size = size || 0;
    if (size == null)
      for (let i = 0; i < content.length; i++)
        this.size += content[i].nodeSize;
  }
  /**
  Invoke a callback for all descendant nodes between the given two
  positions (relative to start of this fragment). Doesn't descend
  into a node when the callback returns `false`.
  */
  nodesBetween(from, to, f, nodeStart = 0, parent) {
    for (let i = 0, pos = 0; pos < to; i++) {
      let child = this.content[i], end = pos + child.nodeSize;
      if (end > from && f(child, nodeStart + pos, parent || null, i) !== false && child.content.size) {
        let start = pos + 1;
        child.nodesBetween(Math.max(0, from - start), Math.min(child.content.size, to - start), f, nodeStart + start);
      }
      pos = end;
    }
  }
  /**
  Call the given callback for every descendant node. `pos` will be
  relative to the start of the fragment. The callback may return
  `false` to prevent traversal of a given node's children.
  */
  descendants(f) {
    this.nodesBetween(0, this.size, f);
  }
  /**
  Extract the text between `from` and `to`. See the same method on
  [`Node`](https://prosemirror.net/docs/ref/#model.Node.textBetween).
  */
  textBetween(from, to, blockSeparator, leafText) {
    let text = "", first = true;
    this.nodesBetween(from, to, (node, pos) => {
      let nodeText = node.isText ? node.text.slice(Math.max(from, pos) - pos, to - pos) : !node.isLeaf ? "" : leafText ? typeof leafText === "function" ? leafText(node) : leafText : node.type.spec.leafText ? node.type.spec.leafText(node) : "";
      if (node.isBlock && (node.isLeaf && nodeText || node.isTextblock) && blockSeparator) {
        if (first)
          first = false;
        else
          text += blockSeparator;
      }
      text += nodeText;
    }, 0);
    return text;
  }
  /**
  Create a new fragment containing the combined content of this
  fragment and the other.
  */
  append(other) {
    if (!other.size)
      return this;
    if (!this.size)
      return other;
    let last = this.lastChild, first = other.firstChild, content = this.content.slice(), i = 0;
    if (last.isText && last.sameMarkup(first)) {
      content[content.length - 1] = last.withText(last.text + first.text);
      i = 1;
    }
    for (; i < other.content.length; i++)
      content.push(other.content[i]);
    return new Fragment(content, this.size + other.size);
  }
  /**
  Cut out the sub-fragment between the two given positions.
  */
  cut(from, to = this.size) {
    if (from == 0 && to == this.size)
      return this;
    let result = [], size = 0;
    if (to > from)
      for (let i = 0, pos = 0; pos < to; i++) {
        let child = this.content[i], end = pos + child.nodeSize;
        if (end > from) {
          if (pos < from || end > to) {
            if (child.isText)
              child = child.cut(Math.max(0, from - pos), Math.min(child.text.length, to - pos));
            else
              child = child.cut(Math.max(0, from - pos - 1), Math.min(child.content.size, to - pos - 1));
          }
          result.push(child);
          size += child.nodeSize;
        }
        pos = end;
      }
    return new Fragment(result, size);
  }
  /**
  @internal
  */
  cutByIndex(from, to) {
    if (from == to)
      return Fragment.empty;
    if (from == 0 && to == this.content.length)
      return this;
    return new Fragment(this.content.slice(from, to));
  }
  /**
  Create a new fragment in which the node at the given index is
  replaced by the given node.
  */
  replaceChild(index, node) {
    let current = this.content[index];
    if (current == node)
      return this;
    let copy = this.content.slice();
    let size = this.size + node.nodeSize - current.nodeSize;
    copy[index] = node;
    return new Fragment(copy, size);
  }
  /**
  Create a new fragment by prepending the given node to this
  fragment.
  */
  addToStart(node) {
    return new Fragment([node].concat(this.content), this.size + node.nodeSize);
  }
  /**
  Create a new fragment by appending the given node to this
  fragment.
  */
  addToEnd(node) {
    return new Fragment(this.content.concat(node), this.size + node.nodeSize);
  }
  /**
  Compare this fragment to another one.
  */
  eq(other) {
    if (this.content.length != other.content.length)
      return false;
    for (let i = 0; i < this.content.length; i++)
      if (!this.content[i].eq(other.content[i]))
        return false;
    return true;
  }
  /**
  The first child of the fragment, or `null` if it is empty.
  */
  get firstChild() {
    return this.content.length ? this.content[0] : null;
  }
  /**
  The last child of the fragment, or `null` if it is empty.
  */
  get lastChild() {
    return this.content.length ? this.content[this.content.length - 1] : null;
  }
  /**
  The number of child nodes in this fragment.
  */
  get childCount() {
    return this.content.length;
  }
  /**
  Get the child node at the given index. Raise an error when the
  index is out of range.
  */
  child(index) {
    let found2 = this.content[index];
    if (!found2)
      throw new RangeError("Index " + index + " out of range for " + this);
    return found2;
  }
  /**
  Get the child node at the given index, if it exists.
  */
  maybeChild(index) {
    return this.content[index] || null;
  }
  /**
  Call `f` for every child node, passing the node, its offset
  into this parent node, and its index.
  */
  forEach(f) {
    for (let i = 0, p = 0; i < this.content.length; i++) {
      let child = this.content[i];
      f(child, p, i);
      p += child.nodeSize;
    }
  }
  /**
  Find the first position at which this fragment and another
  fragment differ, or `null` if they are the same.
  */
  findDiffStart(other, pos = 0) {
    return findDiffStart(this, other, pos);
  }
  /**
  Find the first position, searching from the end, at which this
  fragment and the given fragment differ, or `null` if they are
  the same. Since this position will not be the same in both
  nodes, an object with two separate positions is returned.
  */
  findDiffEnd(other, pos = this.size, otherPos = other.size) {
    return findDiffEnd(this, other, pos, otherPos);
  }
  /**
  Find the index and inner offset corresponding to a given relative
  position in this fragment. The result object will be reused
  (overwritten) the next time the function is called. @internal
  */
  findIndex(pos, round = -1) {
    if (pos == 0)
      return retIndex(0, pos);
    if (pos == this.size)
      return retIndex(this.content.length, pos);
    if (pos > this.size || pos < 0)
      throw new RangeError(`Position ${pos} outside of fragment (${this})`);
    for (let i = 0, curPos = 0; ; i++) {
      let cur = this.child(i), end = curPos + cur.nodeSize;
      if (end >= pos) {
        if (end == pos || round > 0)
          return retIndex(i + 1, end);
        return retIndex(i, curPos);
      }
      curPos = end;
    }
  }
  /**
  Return a debugging string that describes this fragment.
  */
  toString() {
    return "<" + this.toStringInner() + ">";
  }
  /**
  @internal
  */
  toStringInner() {
    return this.content.join(", ");
  }
  /**
  Create a JSON-serializeable representation of this fragment.
  */
  toJSON() {
    return this.content.length ? this.content.map((n) => n.toJSON()) : null;
  }
  /**
  Deserialize a fragment from its JSON representation.
  */
  static fromJSON(schema, value) {
    if (!value)
      return Fragment.empty;
    if (!Array.isArray(value))
      throw new RangeError("Invalid input for Fragment.fromJSON");
    return new Fragment(value.map(schema.nodeFromJSON));
  }
  /**
  Build a fragment from an array of nodes. Ensures that adjacent
  text nodes with the same marks are joined together.
  */
  static fromArray(array) {
    if (!array.length)
      return Fragment.empty;
    let joined, size = 0;
    for (let i = 0; i < array.length; i++) {
      let node = array[i];
      size += node.nodeSize;
      if (i && node.isText && array[i - 1].sameMarkup(node)) {
        if (!joined)
          joined = array.slice(0, i);
        joined[joined.length - 1] = node.withText(joined[joined.length - 1].text + node.text);
      } else if (joined) {
        joined.push(node);
      }
    }
    return new Fragment(joined || array, size);
  }
  /**
  Create a fragment from something that can be interpreted as a
  set of nodes. For `null`, it returns the empty fragment. For a
  fragment, the fragment itself. For a node or array of nodes, a
  fragment containing those nodes.
  */
  static from(nodes) {
    if (!nodes)
      return Fragment.empty;
    if (nodes instanceof Fragment)
      return nodes;
    if (Array.isArray(nodes))
      return this.fromArray(nodes);
    if (nodes.attrs)
      return new Fragment([nodes], nodes.nodeSize);
    throw new RangeError("Can not convert " + nodes + " to a Fragment" + (nodes.nodesBetween ? " (looks like multiple versions of prosemirror-model were loaded)" : ""));
  }
};
Fragment.empty = new Fragment([], 0);
var found = { index: 0, offset: 0 };
function retIndex(index, offset) {
  found.index = index;
  found.offset = offset;
  return found;
}
function compareDeep(a, b) {
  if (a === b)
    return true;
  if (!(a && typeof a == "object") || !(b && typeof b == "object"))
    return false;
  let array = Array.isArray(a);
  if (Array.isArray(b) != array)
    return false;
  if (array) {
    if (a.length != b.length)
      return false;
    for (let i = 0; i < a.length; i++)
      if (!compareDeep(a[i], b[i]))
        return false;
  } else {
    for (let p in a)
      if (!(p in b) || !compareDeep(a[p], b[p]))
        return false;
    for (let p in b)
      if (!(p in a))
        return false;
  }
  return true;
}
var Mark = class {
  /**
  @internal
  */
  constructor(type, attrs) {
    this.type = type;
    this.attrs = attrs;
  }
  /**
  Given a set of marks, create a new set which contains this one as
  well, in the right position. If this mark is already in the set,
  the set itself is returned. If any marks that are set to be
  [exclusive](https://prosemirror.net/docs/ref/#model.MarkSpec.excludes) with this mark are present,
  those are replaced by this one.
  */
  addToSet(set) {
    let copy, placed = false;
    for (let i = 0; i < set.length; i++) {
      let other = set[i];
      if (this.eq(other))
        return set;
      if (this.type.excludes(other.type)) {
        if (!copy)
          copy = set.slice(0, i);
      } else if (other.type.excludes(this.type)) {
        return set;
      } else {
        if (!placed && other.type.rank > this.type.rank) {
          if (!copy)
            copy = set.slice(0, i);
          copy.push(this);
          placed = true;
        }
        if (copy)
          copy.push(other);
      }
    }
    if (!copy)
      copy = set.slice();
    if (!placed)
      copy.push(this);
    return copy;
  }
  /**
  Remove this mark from the given set, returning a new set. If this
  mark is not in the set, the set itself is returned.
  */
  removeFromSet(set) {
    for (let i = 0; i < set.length; i++)
      if (this.eq(set[i]))
        return set.slice(0, i).concat(set.slice(i + 1));
    return set;
  }
  /**
  Test whether this mark is in the given set of marks.
  */
  isInSet(set) {
    for (let i = 0; i < set.length; i++)
      if (this.eq(set[i]))
        return true;
    return false;
  }
  /**
  Test whether this mark has the same type and attributes as
  another mark.
  */
  eq(other) {
    return this == other || this.type == other.type && compareDeep(this.attrs, other.attrs);
  }
  /**
  Convert this mark to a JSON-serializeable representation.
  */
  toJSON() {
    let obj = { type: this.type.name };
    for (let _ in this.attrs) {
      obj.attrs = this.attrs;
      break;
    }
    return obj;
  }
  /**
  Deserialize a mark from JSON.
  */
  static fromJSON(schema, json) {
    if (!json)
      throw new RangeError("Invalid input for Mark.fromJSON");
    let type = schema.marks[json.type];
    if (!type)
      throw new RangeError(`There is no mark type ${json.type} in this schema`);
    let mark = type.create(json.attrs);
    type.checkAttrs(mark.attrs);
    return mark;
  }
  /**
  Test whether two sets of marks are identical.
  */
  static sameSet(a, b) {
    if (a == b)
      return true;
    if (a.length != b.length)
      return false;
    for (let i = 0; i < a.length; i++)
      if (!a[i].eq(b[i]))
        return false;
    return true;
  }
  /**
  Create a properly sorted mark set from null, a single mark, or an
  unsorted array of marks.
  */
  static setFrom(marks) {
    if (!marks || Array.isArray(marks) && marks.length == 0)
      return Mark.none;
    if (marks instanceof Mark)
      return [marks];
    let copy = marks.slice();
    copy.sort((a, b) => a.type.rank - b.type.rank);
    return copy;
  }
};
Mark.none = [];
var ReplaceError = class extends Error {
};
var Slice = class {
  /**
  Create a slice. When specifying a non-zero open depth, you must
  make sure that there are nodes of at least that depth at the
  appropriate side of the fragment—i.e. if the fragment is an
  empty paragraph node, `openStart` and `openEnd` can't be greater
  than 1.
  
  It is not necessary for the content of open nodes to conform to
  the schema's content constraints, though it should be a valid
  start/end/middle for such a node, depending on which sides are
  open.
  */
  constructor(content, openStart, openEnd) {
    this.content = content;
    this.openStart = openStart;
    this.openEnd = openEnd;
  }
  /**
  The size this slice would add when inserted into a document.
  */
  get size() {
    return this.content.size - this.openStart - this.openEnd;
  }
  /**
  @internal
  */
  insertAt(pos, fragment) {
    let content = insertInto(this.content, pos + this.openStart, fragment);
    return content && new Slice(content, this.openStart, this.openEnd);
  }
  /**
  @internal
  */
  removeBetween(from, to) {
    return new Slice(removeRange(this.content, from + this.openStart, to + this.openStart), this.openStart, this.openEnd);
  }
  /**
  Tests whether this slice is equal to another slice.
  */
  eq(other) {
    return this.content.eq(other.content) && this.openStart == other.openStart && this.openEnd == other.openEnd;
  }
  /**
  @internal
  */
  toString() {
    return this.content + "(" + this.openStart + "," + this.openEnd + ")";
  }
  /**
  Convert a slice to a JSON-serializable representation.
  */
  toJSON() {
    if (!this.content.size)
      return null;
    let json = { content: this.content.toJSON() };
    if (this.openStart > 0)
      json.openStart = this.openStart;
    if (this.openEnd > 0)
      json.openEnd = this.openEnd;
    return json;
  }
  /**
  Deserialize a slice from its JSON representation.
  */
  static fromJSON(schema, json) {
    if (!json)
      return Slice.empty;
    let openStart = json.openStart || 0, openEnd = json.openEnd || 0;
    if (typeof openStart != "number" || typeof openEnd != "number")
      throw new RangeError("Invalid input for Slice.fromJSON");
    return new Slice(Fragment.fromJSON(schema, json.content), openStart, openEnd);
  }
  /**
  Create a slice from a fragment by taking the maximum possible
  open value on both side of the fragment.
  */
  static maxOpen(fragment, openIsolating = true) {
    let openStart = 0, openEnd = 0;
    for (let n = fragment.firstChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.firstChild)
      openStart++;
    for (let n = fragment.lastChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.lastChild)
      openEnd++;
    return new Slice(fragment, openStart, openEnd);
  }
};
Slice.empty = new Slice(Fragment.empty, 0, 0);
function removeRange(content, from, to) {
  let { index, offset } = content.findIndex(from), child = content.maybeChild(index);
  let { index: indexTo, offset: offsetTo } = content.findIndex(to);
  if (offset == from || child.isText) {
    if (offsetTo != to && !content.child(indexTo).isText)
      throw new RangeError("Removing non-flat range");
    return content.cut(0, from).append(content.cut(to));
  }
  if (index != indexTo)
    throw new RangeError("Removing non-flat range");
  return content.replaceChild(index, child.copy(removeRange(child.content, from - offset - 1, to - offset - 1)));
}
function insertInto(content, dist, insert, parent) {
  let { index, offset } = content.findIndex(dist), child = content.maybeChild(index);
  if (offset == dist || child.isText) {
    if (parent && !parent.canReplace(index, index, insert))
      return null;
    return content.cut(0, dist).append(insert).append(content.cut(dist));
  }
  let inner = insertInto(child.content, dist - offset - 1, insert);
  return inner && content.replaceChild(index, child.copy(inner));
}
function replace($from, $to, slice) {
  if (slice.openStart > $from.depth)
    throw new ReplaceError("Inserted content deeper than insertion position");
  if ($from.depth - slice.openStart != $to.depth - slice.openEnd)
    throw new ReplaceError("Inconsistent open depths");
  return replaceOuter($from, $to, slice, 0);
}
function replaceOuter($from, $to, slice, depth) {
  let index = $from.index(depth), node = $from.node(depth);
  if (index == $to.index(depth) && depth < $from.depth - slice.openStart) {
    let inner = replaceOuter($from, $to, slice, depth + 1);
    return node.copy(node.content.replaceChild(index, inner));
  } else if (!slice.content.size) {
    return close(node, replaceTwoWay($from, $to, depth));
  } else if (!slice.openStart && !slice.openEnd && $from.depth == depth && $to.depth == depth) {
    let parent = $from.parent, content = parent.content;
    return close(parent, content.cut(0, $from.parentOffset).append(slice.content).append(content.cut($to.parentOffset)));
  } else {
    let { start, end } = prepareSliceForReplace(slice, $from);
    return close(node, replaceThreeWay($from, start, end, $to, depth));
  }
}
function checkJoin(main, sub) {
  if (!sub.type.compatibleContent(main.type))
    throw new ReplaceError("Cannot join " + sub.type.name + " onto " + main.type.name);
}
function joinable($before, $after, depth) {
  let node = $before.node(depth);
  checkJoin(node, $after.node(depth));
  return node;
}
function addNode(child, target) {
  let last = target.length - 1;
  if (last >= 0 && child.isText && child.sameMarkup(target[last]))
    target[last] = child.withText(target[last].text + child.text);
  else
    target.push(child);
}
function addRange($start, $end, depth, target) {
  let node = ($end || $start).node(depth);
  let startIndex = 0, endIndex = $end ? $end.index(depth) : node.childCount;
  if ($start) {
    startIndex = $start.index(depth);
    if ($start.depth > depth) {
      startIndex++;
    } else if ($start.textOffset) {
      addNode($start.nodeAfter, target);
      startIndex++;
    }
  }
  for (let i = startIndex; i < endIndex; i++)
    addNode(node.child(i), target);
  if ($end && $end.depth == depth && $end.textOffset)
    addNode($end.nodeBefore, target);
}
function close(node, content) {
  node.type.checkContent(content);
  return node.copy(content);
}
function replaceThreeWay($from, $start, $end, $to, depth) {
  let openStart = $from.depth > depth && joinable($from, $start, depth + 1);
  let openEnd = $to.depth > depth && joinable($end, $to, depth + 1);
  let content = [];
  addRange(null, $from, depth, content);
  if (openStart && openEnd && $start.index(depth) == $end.index(depth)) {
    checkJoin(openStart, openEnd);
    addNode(close(openStart, replaceThreeWay($from, $start, $end, $to, depth + 1)), content);
  } else {
    if (openStart)
      addNode(close(openStart, replaceTwoWay($from, $start, depth + 1)), content);
    addRange($start, $end, depth, content);
    if (openEnd)
      addNode(close(openEnd, replaceTwoWay($end, $to, depth + 1)), content);
  }
  addRange($to, null, depth, content);
  return new Fragment(content);
}
function replaceTwoWay($from, $to, depth) {
  let content = [];
  addRange(null, $from, depth, content);
  if ($from.depth > depth) {
    let type = joinable($from, $to, depth + 1);
    addNode(close(type, replaceTwoWay($from, $to, depth + 1)), content);
  }
  addRange($to, null, depth, content);
  return new Fragment(content);
}
function prepareSliceForReplace(slice, $along) {
  let extra = $along.depth - slice.openStart, parent = $along.node(extra);
  let node = parent.copy(slice.content);
  for (let i = extra - 1; i >= 0; i--)
    node = $along.node(i).copy(Fragment.from(node));
  return {
    start: node.resolveNoCache(slice.openStart + extra),
    end: node.resolveNoCache(node.content.size - slice.openEnd - extra)
  };
}
var ResolvedPos = class {
  /**
  @internal
  */
  constructor(pos, path, parentOffset) {
    this.pos = pos;
    this.path = path;
    this.parentOffset = parentOffset;
    this.depth = path.length / 3 - 1;
  }
  /**
  @internal
  */
  resolveDepth(val) {
    if (val == null)
      return this.depth;
    if (val < 0)
      return this.depth + val;
    return val;
  }
  /**
  The parent node that the position points into. Note that even if
  a position points into a text node, that node is not considered
  the parent—text nodes are ‘flat’ in this model, and have no content.
  */
  get parent() {
    return this.node(this.depth);
  }
  /**
  The root node in which the position was resolved.
  */
  get doc() {
    return this.node(0);
  }
  /**
  The ancestor node at the given level. `p.node(p.depth)` is the
  same as `p.parent`.
  */
  node(depth) {
    return this.path[this.resolveDepth(depth) * 3];
  }
  /**
  The index into the ancestor at the given level. If this points
  at the 3rd node in the 2nd paragraph on the top level, for
  example, `p.index(0)` is 1 and `p.index(1)` is 2.
  */
  index(depth) {
    return this.path[this.resolveDepth(depth) * 3 + 1];
  }
  /**
  The index pointing after this position into the ancestor at the
  given level.
  */
  indexAfter(depth) {
    depth = this.resolveDepth(depth);
    return this.index(depth) + (depth == this.depth && !this.textOffset ? 0 : 1);
  }
  /**
  The (absolute) position at the start of the node at the given
  level.
  */
  start(depth) {
    depth = this.resolveDepth(depth);
    return depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
  }
  /**
  The (absolute) position at the end of the node at the given
  level.
  */
  end(depth) {
    depth = this.resolveDepth(depth);
    return this.start(depth) + this.node(depth).content.size;
  }
  /**
  The (absolute) position directly before the wrapping node at the
  given level, or, when `depth` is `this.depth + 1`, the original
  position.
  */
  before(depth) {
    depth = this.resolveDepth(depth);
    if (!depth)
      throw new RangeError("There is no position before the top-level node");
    return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1];
  }
  /**
  The (absolute) position directly after the wrapping node at the
  given level, or the original position when `depth` is `this.depth + 1`.
  */
  after(depth) {
    depth = this.resolveDepth(depth);
    if (!depth)
      throw new RangeError("There is no position after the top-level node");
    return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1] + this.path[depth * 3].nodeSize;
  }
  /**
  When this position points into a text node, this returns the
  distance between the position and the start of the text node.
  Will be zero for positions that point between nodes.
  */
  get textOffset() {
    return this.pos - this.path[this.path.length - 1];
  }
  /**
  Get the node directly after the position, if any. If the position
  points into a text node, only the part of that node after the
  position is returned.
  */
  get nodeAfter() {
    let parent = this.parent, index = this.index(this.depth);
    if (index == parent.childCount)
      return null;
    let dOff = this.pos - this.path[this.path.length - 1], child = parent.child(index);
    return dOff ? parent.child(index).cut(dOff) : child;
  }
  /**
  Get the node directly before the position, if any. If the
  position points into a text node, only the part of that node
  before the position is returned.
  */
  get nodeBefore() {
    let index = this.index(this.depth);
    let dOff = this.pos - this.path[this.path.length - 1];
    if (dOff)
      return this.parent.child(index).cut(0, dOff);
    return index == 0 ? null : this.parent.child(index - 1);
  }
  /**
  Get the position at the given index in the parent node at the
  given depth (which defaults to `this.depth`).
  */
  posAtIndex(index, depth) {
    depth = this.resolveDepth(depth);
    let node = this.path[depth * 3], pos = depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
    for (let i = 0; i < index; i++)
      pos += node.child(i).nodeSize;
    return pos;
  }
  /**
  Get the marks at this position, factoring in the surrounding
  marks' [`inclusive`](https://prosemirror.net/docs/ref/#model.MarkSpec.inclusive) property. If the
  position is at the start of a non-empty node, the marks of the
  node after it (if any) are returned.
  */
  marks() {
    let parent = this.parent, index = this.index();
    if (parent.content.size == 0)
      return Mark.none;
    if (this.textOffset)
      return parent.child(index).marks;
    let main = parent.maybeChild(index - 1), other = parent.maybeChild(index);
    if (!main) {
      let tmp = main;
      main = other;
      other = tmp;
    }
    let marks = main.marks;
    for (var i = 0; i < marks.length; i++)
      if (marks[i].type.spec.inclusive === false && (!other || !marks[i].isInSet(other.marks)))
        marks = marks[i--].removeFromSet(marks);
    return marks;
  }
  /**
  Get the marks after the current position, if any, except those
  that are non-inclusive and not present at position `$end`. This
  is mostly useful for getting the set of marks to preserve after a
  deletion. Will return `null` if this position is at the end of
  its parent node or its parent node isn't a textblock (in which
  case no marks should be preserved).
  */
  marksAcross($end) {
    let after = this.parent.maybeChild(this.index());
    if (!after || !after.isInline)
      return null;
    let marks = after.marks, next = $end.parent.maybeChild($end.index());
    for (var i = 0; i < marks.length; i++)
      if (marks[i].type.spec.inclusive === false && (!next || !marks[i].isInSet(next.marks)))
        marks = marks[i--].removeFromSet(marks);
    return marks;
  }
  /**
  The depth up to which this position and the given (non-resolved)
  position share the same parent nodes.
  */
  sharedDepth(pos) {
    for (let depth = this.depth; depth > 0; depth--)
      if (this.start(depth) <= pos && this.end(depth) >= pos)
        return depth;
    return 0;
  }
  /**
  Returns a range based on the place where this position and the
  given position diverge around block content. If both point into
  the same textblock, for example, a range around that textblock
  will be returned. If they point into different blocks, the range
  around those blocks in their shared ancestor is returned. You can
  pass in an optional predicate that will be called with a parent
  node to see if a range into that parent is acceptable.
  */
  blockRange(other = this, pred) {
    if (other.pos < this.pos)
      return other.blockRange(this);
    for (let d = this.depth - (this.parent.inlineContent || this.pos == other.pos ? 1 : 0); d >= 0; d--)
      if (other.pos <= this.end(d) && (!pred || pred(this.node(d))))
        return new NodeRange(this, other, d);
    return null;
  }
  /**
  Query whether the given position shares the same parent node.
  */
  sameParent(other) {
    return this.pos - this.parentOffset == other.pos - other.parentOffset;
  }
  /**
  Return the greater of this and the given position.
  */
  max(other) {
    return other.pos > this.pos ? other : this;
  }
  /**
  Return the smaller of this and the given position.
  */
  min(other) {
    return other.pos < this.pos ? other : this;
  }
  /**
  @internal
  */
  toString() {
    let str = "";
    for (let i = 1; i <= this.depth; i++)
      str += (str ? "/" : "") + this.node(i).type.name + "_" + this.index(i - 1);
    return str + ":" + this.parentOffset;
  }
  /**
  @internal
  */
  static resolve(doc, pos) {
    if (!(pos >= 0 && pos <= doc.content.size))
      throw new RangeError("Position " + pos + " out of range");
    let path = [];
    let start = 0, parentOffset = pos;
    for (let node = doc; ; ) {
      let { index, offset } = node.content.findIndex(parentOffset);
      let rem = parentOffset - offset;
      path.push(node, index, start + offset);
      if (!rem)
        break;
      node = node.child(index);
      if (node.isText)
        break;
      parentOffset = rem - 1;
      start += offset + 1;
    }
    return new ResolvedPos(pos, path, parentOffset);
  }
  /**
  @internal
  */
  static resolveCached(doc, pos) {
    let cache = resolveCache.get(doc);
    if (cache) {
      for (let i = 0; i < cache.elts.length; i++) {
        let elt = cache.elts[i];
        if (elt.pos == pos)
          return elt;
      }
    } else {
      resolveCache.set(doc, cache = new ResolveCache());
    }
    let result = cache.elts[cache.i] = ResolvedPos.resolve(doc, pos);
    cache.i = (cache.i + 1) % resolveCacheSize;
    return result;
  }
};
var ResolveCache = class {
  constructor() {
    this.elts = [];
    this.i = 0;
  }
};
var resolveCacheSize = 12;
var resolveCache = /* @__PURE__ */ new WeakMap();
var NodeRange = class {
  /**
  Construct a node range. `$from` and `$to` should point into the
  same node until at least the given `depth`, since a node range
  denotes an adjacent set of nodes in a single parent node.
  */
  constructor($from, $to, depth) {
    this.$from = $from;
    this.$to = $to;
    this.depth = depth;
  }
  /**
  The position at the start of the range.
  */
  get start() {
    return this.$from.before(this.depth + 1);
  }
  /**
  The position at the end of the range.
  */
  get end() {
    return this.$to.after(this.depth + 1);
  }
  /**
  The parent node that the range points into.
  */
  get parent() {
    return this.$from.node(this.depth);
  }
  /**
  The start index of the range in the parent node.
  */
  get startIndex() {
    return this.$from.index(this.depth);
  }
  /**
  The end index of the range in the parent node.
  */
  get endIndex() {
    return this.$to.indexAfter(this.depth);
  }
};
var emptyAttrs = /* @__PURE__ */ Object.create(null);
var Node = class {
  /**
  @internal
  */
  constructor(type, attrs, content, marks = Mark.none) {
    this.type = type;
    this.attrs = attrs;
    this.marks = marks;
    this.content = content || Fragment.empty;
  }
  /**
  The size of this node, as defined by the integer-based [indexing
  scheme](/docs/guide/#doc.indexing). For text nodes, this is the
  amount of characters. For other leaf nodes, it is one. For
  non-leaf nodes, it is the size of the content plus two (the
  start and end token).
  */
  get nodeSize() {
    return this.isLeaf ? 1 : 2 + this.content.size;
  }
  /**
  The number of children that the node has.
  */
  get childCount() {
    return this.content.childCount;
  }
  /**
  Get the child node at the given index. Raises an error when the
  index is out of range.
  */
  child(index) {
    return this.content.child(index);
  }
  /**
  Get the child node at the given index, if it exists.
  */
  maybeChild(index) {
    return this.content.maybeChild(index);
  }
  /**
  Call `f` for every child node, passing the node, its offset
  into this parent node, and its index.
  */
  forEach(f) {
    this.content.forEach(f);
  }
  /**
  Invoke a callback for all descendant nodes recursively between
  the given two positions that are relative to start of this
  node's content. The callback is invoked with the node, its
  position relative to the original node (method receiver),
  its parent node, and its child index. When the callback returns
  false for a given node, that node's children will not be
  recursed over. The last parameter can be used to specify a
  starting position to count from.
  */
  nodesBetween(from, to, f, startPos = 0) {
    this.content.nodesBetween(from, to, f, startPos, this);
  }
  /**
  Call the given callback for every descendant node. Doesn't
  descend into a node when the callback returns `false`.
  */
  descendants(f) {
    this.nodesBetween(0, this.content.size, f);
  }
  /**
  Concatenates all the text nodes found in this fragment and its
  children.
  */
  get textContent() {
    return this.isLeaf && this.type.spec.leafText ? this.type.spec.leafText(this) : this.textBetween(0, this.content.size, "");
  }
  /**
  Get all text between positions `from` and `to`. When
  `blockSeparator` is given, it will be inserted to separate text
  from different block nodes. If `leafText` is given, it'll be
  inserted for every non-text leaf node encountered, otherwise
  [`leafText`](https://prosemirror.net/docs/ref/#model.NodeSpec^leafText) will be used.
  */
  textBetween(from, to, blockSeparator, leafText) {
    return this.content.textBetween(from, to, blockSeparator, leafText);
  }
  /**
  Returns this node's first child, or `null` if there are no
  children.
  */
  get firstChild() {
    return this.content.firstChild;
  }
  /**
  Returns this node's last child, or `null` if there are no
  children.
  */
  get lastChild() {
    return this.content.lastChild;
  }
  /**
  Test whether two nodes represent the same piece of document.
  */
  eq(other) {
    return this == other || this.sameMarkup(other) && this.content.eq(other.content);
  }
  /**
  Compare the markup (type, attributes, and marks) of this node to
  those of another. Returns `true` if both have the same markup.
  */
  sameMarkup(other) {
    return this.hasMarkup(other.type, other.attrs, other.marks);
  }
  /**
  Check whether this node's markup correspond to the given type,
  attributes, and marks.
  */
  hasMarkup(type, attrs, marks) {
    return this.type == type && compareDeep(this.attrs, attrs || type.defaultAttrs || emptyAttrs) && Mark.sameSet(this.marks, marks || Mark.none);
  }
  /**
  Create a new node with the same markup as this node, containing
  the given content (or empty, if no content is given).
  */
  copy(content = null) {
    if (content == this.content)
      return this;
    return new Node(this.type, this.attrs, content, this.marks);
  }
  /**
  Create a copy of this node, with the given set of marks instead
  of the node's own marks.
  */
  mark(marks) {
    return marks == this.marks ? this : new Node(this.type, this.attrs, this.content, marks);
  }
  /**
  Create a copy of this node with only the content between the
  given positions. If `to` is not given, it defaults to the end of
  the node.
  */
  cut(from, to = this.content.size) {
    if (from == 0 && to == this.content.size)
      return this;
    return this.copy(this.content.cut(from, to));
  }
  /**
  Cut out the part of the document between the given positions, and
  return it as a `Slice` object.
  */
  slice(from, to = this.content.size, includeParents = false) {
    if (from == to)
      return Slice.empty;
    let $from = this.resolve(from), $to = this.resolve(to);
    let depth = includeParents ? 0 : $from.sharedDepth(to);
    let start = $from.start(depth), node = $from.node(depth);
    let content = node.content.cut($from.pos - start, $to.pos - start);
    return new Slice(content, $from.depth - depth, $to.depth - depth);
  }
  /**
  Replace the part of the document between the given positions with
  the given slice. The slice must 'fit', meaning its open sides
  must be able to connect to the surrounding content, and its
  content nodes must be valid children for the node they are placed
  into. If any of this is violated, an error of type
  [`ReplaceError`](https://prosemirror.net/docs/ref/#model.ReplaceError) is thrown.
  */
  replace(from, to, slice) {
    return replace(this.resolve(from), this.resolve(to), slice);
  }
  /**
  Find the node directly after the given position.
  */
  nodeAt(pos) {
    for (let node = this; ; ) {
      let { index, offset } = node.content.findIndex(pos);
      node = node.maybeChild(index);
      if (!node)
        return null;
      if (offset == pos || node.isText)
        return node;
      pos -= offset + 1;
    }
  }
  /**
  Find the (direct) child node after the given offset, if any,
  and return it along with its index and offset relative to this
  node.
  */
  childAfter(pos) {
    let { index, offset } = this.content.findIndex(pos);
    return { node: this.content.maybeChild(index), index, offset };
  }
  /**
  Find the (direct) child node before the given offset, if any,
  and return it along with its index and offset relative to this
  node.
  */
  childBefore(pos) {
    if (pos == 0)
      return { node: null, index: 0, offset: 0 };
    let { index, offset } = this.content.findIndex(pos);
    if (offset < pos)
      return { node: this.content.child(index), index, offset };
    let node = this.content.child(index - 1);
    return { node, index: index - 1, offset: offset - node.nodeSize };
  }
  /**
  Resolve the given position in the document, returning an
  [object](https://prosemirror.net/docs/ref/#model.ResolvedPos) with information about its context.
  */
  resolve(pos) {
    return ResolvedPos.resolveCached(this, pos);
  }
  /**
  @internal
  */
  resolveNoCache(pos) {
    return ResolvedPos.resolve(this, pos);
  }
  /**
  Test whether a given mark or mark type occurs in this document
  between the two given positions.
  */
  rangeHasMark(from, to, type) {
    let found2 = false;
    if (to > from)
      this.nodesBetween(from, to, (node) => {
        if (type.isInSet(node.marks))
          found2 = true;
        return !found2;
      });
    return found2;
  }
  /**
  True when this is a block (non-inline node)
  */
  get isBlock() {
    return this.type.isBlock;
  }
  /**
  True when this is a textblock node, a block node with inline
  content.
  */
  get isTextblock() {
    return this.type.isTextblock;
  }
  /**
  True when this node allows inline content.
  */
  get inlineContent() {
    return this.type.inlineContent;
  }
  /**
  True when this is an inline node (a text node or a node that can
  appear among text).
  */
  get isInline() {
    return this.type.isInline;
  }
  /**
  True when this is a text node.
  */
  get isText() {
    return this.type.isText;
  }
  /**
  True when this is a leaf node.
  */
  get isLeaf() {
    return this.type.isLeaf;
  }
  /**
  True when this is an atom, i.e. when it does not have directly
  editable content. This is usually the same as `isLeaf`, but can
  be configured with the [`atom` property](https://prosemirror.net/docs/ref/#model.NodeSpec.atom)
  on a node's spec (typically used when the node is displayed as
  an uneditable [node view](https://prosemirror.net/docs/ref/#view.NodeView)).
  */
  get isAtom() {
    return this.type.isAtom;
  }
  /**
  Return a string representation of this node for debugging
  purposes.
  */
  toString() {
    if (this.type.spec.toDebugString)
      return this.type.spec.toDebugString(this);
    let name = this.type.name;
    if (this.content.size)
      name += "(" + this.content.toStringInner() + ")";
    return wrapMarks(this.marks, name);
  }
  /**
  Get the content match in this node at the given index.
  */
  contentMatchAt(index) {
    let match = this.type.contentMatch.matchFragment(this.content, 0, index);
    if (!match)
      throw new Error("Called contentMatchAt on a node with invalid content");
    return match;
  }
  /**
  Test whether replacing the range between `from` and `to` (by
  child index) with the given replacement fragment (which defaults
  to the empty fragment) would leave the node's content valid. You
  can optionally pass `start` and `end` indices into the
  replacement fragment.
  */
  canReplace(from, to, replacement = Fragment.empty, start = 0, end = replacement.childCount) {
    let one = this.contentMatchAt(from).matchFragment(replacement, start, end);
    let two = one && one.matchFragment(this.content, to);
    if (!two || !two.validEnd)
      return false;
    for (let i = start; i < end; i++)
      if (!this.type.allowsMarks(replacement.child(i).marks))
        return false;
    return true;
  }
  /**
  Test whether replacing the range `from` to `to` (by index) with
  a node of the given type would leave the node's content valid.
  */
  canReplaceWith(from, to, type, marks) {
    if (marks && !this.type.allowsMarks(marks))
      return false;
    let start = this.contentMatchAt(from).matchType(type);
    let end = start && start.matchFragment(this.content, to);
    return end ? end.validEnd : false;
  }
  /**
  Test whether the given node's content could be appended to this
  node. If that node is empty, this will only return true if there
  is at least one node type that can appear in both nodes (to avoid
  merging completely incompatible nodes).
  */
  canAppend(other) {
    if (other.content.size)
      return this.canReplace(this.childCount, this.childCount, other.content);
    else
      return this.type.compatibleContent(other.type);
  }
  /**
  Check whether this node and its descendants conform to the
  schema, and raise an exception when they do not.
  */
  check() {
    this.type.checkContent(this.content);
    this.type.checkAttrs(this.attrs);
    let copy = Mark.none;
    for (let i = 0; i < this.marks.length; i++) {
      let mark = this.marks[i];
      mark.type.checkAttrs(mark.attrs);
      copy = mark.addToSet(copy);
    }
    if (!Mark.sameSet(copy, this.marks))
      throw new RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map((m) => m.type.name)}`);
    this.content.forEach((node) => node.check());
  }
  /**
  Return a JSON-serializeable representation of this node.
  */
  toJSON() {
    let obj = { type: this.type.name };
    for (let _ in this.attrs) {
      obj.attrs = this.attrs;
      break;
    }
    if (this.content.size)
      obj.content = this.content.toJSON();
    if (this.marks.length)
      obj.marks = this.marks.map((n) => n.toJSON());
    return obj;
  }
  /**
  Deserialize a node from its JSON representation.
  */
  static fromJSON(schema, json) {
    if (!json)
      throw new RangeError("Invalid input for Node.fromJSON");
    let marks = void 0;
    if (json.marks) {
      if (!Array.isArray(json.marks))
        throw new RangeError("Invalid mark data for Node.fromJSON");
      marks = json.marks.map(schema.markFromJSON);
    }
    if (json.type == "text") {
      if (typeof json.text != "string")
        throw new RangeError("Invalid text node in JSON");
      return schema.text(json.text, marks);
    }
    let content = Fragment.fromJSON(schema, json.content);
    let node = schema.nodeType(json.type).create(json.attrs, content, marks);
    node.type.checkAttrs(node.attrs);
    return node;
  }
};
Node.prototype.text = void 0;
function wrapMarks(marks, str) {
  for (let i = marks.length - 1; i >= 0; i--)
    str = marks[i].type.name + "(" + str + ")";
  return str;
}
var ContentMatch = class {
  /**
  @internal
  */
  constructor(validEnd) {
    this.validEnd = validEnd;
    this.next = [];
    this.wrapCache = [];
  }
  /**
  @internal
  */
  static parse(string, nodeTypes) {
    let stream = new TokenStream(string, nodeTypes);
    if (stream.next == null)
      return ContentMatch.empty;
    let expr = parseExpr(stream);
    if (stream.next)
      stream.err("Unexpected trailing text");
    let match = dfa(nfa(expr));
    checkForDeadEnds(match, stream);
    return match;
  }
  /**
  Match a node type, returning a match after that node if
  successful.
  */
  matchType(type) {
    for (let i = 0; i < this.next.length; i++)
      if (this.next[i].type == type)
        return this.next[i].next;
    return null;
  }
  /**
  Try to match a fragment. Returns the resulting match when
  successful.
  */
  matchFragment(frag, start = 0, end = frag.childCount) {
    let cur = this;
    for (let i = start; cur && i < end; i++)
      cur = cur.matchType(frag.child(i).type);
    return cur;
  }
  /**
  @internal
  */
  get inlineContent() {
    return this.next.length != 0 && this.next[0].type.isInline;
  }
  /**
  Get the first matching node type at this match position that can
  be generated.
  */
  get defaultType() {
    for (let i = 0; i < this.next.length; i++) {
      let { type } = this.next[i];
      if (!(type.isText || type.hasRequiredAttrs()))
        return type;
    }
    return null;
  }
  /**
  @internal
  */
  compatible(other) {
    for (let i = 0; i < this.next.length; i++)
      for (let j = 0; j < other.next.length; j++)
        if (this.next[i].type == other.next[j].type)
          return true;
    return false;
  }
  /**
  Try to match the given fragment, and if that fails, see if it can
  be made to match by inserting nodes in front of it. When
  successful, return a fragment of inserted nodes (which may be
  empty if nothing had to be inserted). When `toEnd` is true, only
  return a fragment if the resulting match goes to the end of the
  content expression.
  */
  fillBefore(after, toEnd = false, startIndex = 0) {
    let seen = [this];
    function search(match, types) {
      let finished = match.matchFragment(after, startIndex);
      if (finished && (!toEnd || finished.validEnd))
        return Fragment.from(types.map((tp) => tp.createAndFill()));
      for (let i = 0; i < match.next.length; i++) {
        let { type, next } = match.next[i];
        if (!(type.isText || type.hasRequiredAttrs()) && seen.indexOf(next) == -1) {
          seen.push(next);
          let found2 = search(next, types.concat(type));
          if (found2)
            return found2;
        }
      }
      return null;
    }
    return search(this, []);
  }
  /**
  Find a set of wrapping node types that would allow a node of the
  given type to appear at this position. The result may be empty
  (when it fits directly) and will be null when no such wrapping
  exists.
  */
  findWrapping(target) {
    for (let i = 0; i < this.wrapCache.length; i += 2)
      if (this.wrapCache[i] == target)
        return this.wrapCache[i + 1];
    let computed = this.computeWrapping(target);
    this.wrapCache.push(target, computed);
    return computed;
  }
  /**
  @internal
  */
  computeWrapping(target) {
    let seen = /* @__PURE__ */ Object.create(null), active = [{ match: this, type: null, via: null }];
    while (active.length) {
      let current = active.shift(), match = current.match;
      if (match.matchType(target)) {
        let result = [];
        for (let obj = current; obj.type; obj = obj.via)
          result.push(obj.type);
        return result.reverse();
      }
      for (let i = 0; i < match.next.length; i++) {
        let { type, next } = match.next[i];
        if (!type.isLeaf && !type.hasRequiredAttrs() && !(type.name in seen) && (!current.type || next.validEnd)) {
          active.push({ match: type.contentMatch, type, via: current });
          seen[type.name] = true;
        }
      }
    }
    return null;
  }
  /**
  The number of outgoing edges this node has in the finite
  automaton that describes the content expression.
  */
  get edgeCount() {
    return this.next.length;
  }
  /**
  Get the _n_​th outgoing edge from this node in the finite
  automaton that describes the content expression.
  */
  edge(n) {
    if (n >= this.next.length)
      throw new RangeError(`There's no ${n}th edge in this content match`);
    return this.next[n];
  }
  /**
  @internal
  */
  toString() {
    let seen = [];
    function scan(m) {
      seen.push(m);
      for (let i = 0; i < m.next.length; i++)
        if (seen.indexOf(m.next[i].next) == -1)
          scan(m.next[i].next);
    }
    scan(this);
    return seen.map((m, i) => {
      let out = i + (m.validEnd ? "*" : " ") + " ";
      for (let i2 = 0; i2 < m.next.length; i2++)
        out += (i2 ? ", " : "") + m.next[i2].type.name + "->" + seen.indexOf(m.next[i2].next);
      return out;
    }).join("\n");
  }
};
ContentMatch.empty = new ContentMatch(true);
var TokenStream = class {
  constructor(string, nodeTypes) {
    this.string = string;
    this.nodeTypes = nodeTypes;
    this.inline = null;
    this.pos = 0;
    this.tokens = string.split(/\s*(?=\b|\W|$)/);
    if (this.tokens[this.tokens.length - 1] == "")
      this.tokens.pop();
    if (this.tokens[0] == "")
      this.tokens.shift();
  }
  get next() {
    return this.tokens[this.pos];
  }
  eat(tok) {
    return this.next == tok && (this.pos++ || true);
  }
  err(str) {
    throw new SyntaxError(str + " (in content expression '" + this.string + "')");
  }
};
function parseExpr(stream) {
  let exprs = [];
  do {
    exprs.push(parseExprSeq(stream));
  } while (stream.eat("|"));
  return exprs.length == 1 ? exprs[0] : { type: "choice", exprs };
}
function parseExprSeq(stream) {
  let exprs = [];
  do {
    exprs.push(parseExprSubscript(stream));
  } while (stream.next && stream.next != ")" && stream.next != "|");
  return exprs.length == 1 ? exprs[0] : { type: "seq", exprs };
}
function parseExprSubscript(stream) {
  let expr = parseExprAtom(stream);
  for (; ; ) {
    if (stream.eat("+"))
      expr = { type: "plus", expr };
    else if (stream.eat("*"))
      expr = { type: "star", expr };
    else if (stream.eat("?"))
      expr = { type: "opt", expr };
    else if (stream.eat("{"))
      expr = parseExprRange(stream, expr);
    else
      break;
  }
  return expr;
}
function parseNum(stream) {
  if (/\D/.test(stream.next))
    stream.err("Expected number, got '" + stream.next + "'");
  let result = Number(stream.next);
  stream.pos++;
  return result;
}
function parseExprRange(stream, expr) {
  let min = parseNum(stream), max = min;
  if (stream.eat(",")) {
    if (stream.next != "}")
      max = parseNum(stream);
    else
      max = -1;
  }
  if (!stream.eat("}"))
    stream.err("Unclosed braced range");
  return { type: "range", min, max, expr };
}
function resolveName(stream, name) {
  let types = stream.nodeTypes, type = types[name];
  if (type)
    return [type];
  let result = [];
  for (let typeName in types) {
    let type2 = types[typeName];
    if (type2.groups.indexOf(name) > -1)
      result.push(type2);
  }
  if (result.length == 0)
    stream.err("No node type or group '" + name + "' found");
  return result;
}
function parseExprAtom(stream) {
  if (stream.eat("(")) {
    let expr = parseExpr(stream);
    if (!stream.eat(")"))
      stream.err("Missing closing paren");
    return expr;
  } else if (!/\W/.test(stream.next)) {
    let exprs = resolveName(stream, stream.next).map((type) => {
      if (stream.inline == null)
        stream.inline = type.isInline;
      else if (stream.inline != type.isInline)
        stream.err("Mixing inline and block content");
      return { type: "name", value: type };
    });
    stream.pos++;
    return exprs.length == 1 ? exprs[0] : { type: "choice", exprs };
  } else {
    stream.err("Unexpected token '" + stream.next + "'");
  }
}
function nfa(expr) {
  let nfa2 = [[]];
  connect(compile(expr, 0), node());
  return nfa2;
  function node() {
    return nfa2.push([]) - 1;
  }
  function edge(from, to, term) {
    let edge2 = { term, to };
    nfa2[from].push(edge2);
    return edge2;
  }
  function connect(edges, to) {
    edges.forEach((edge2) => edge2.to = to);
  }
  function compile(expr2, from) {
    if (expr2.type == "choice") {
      return expr2.exprs.reduce((out, expr3) => out.concat(compile(expr3, from)), []);
    } else if (expr2.type == "seq") {
      for (let i = 0; ; i++) {
        let next = compile(expr2.exprs[i], from);
        if (i == expr2.exprs.length - 1)
          return next;
        connect(next, from = node());
      }
    } else if (expr2.type == "star") {
      let loop = node();
      edge(from, loop);
      connect(compile(expr2.expr, loop), loop);
      return [edge(loop)];
    } else if (expr2.type == "plus") {
      let loop = node();
      connect(compile(expr2.expr, from), loop);
      connect(compile(expr2.expr, loop), loop);
      return [edge(loop)];
    } else if (expr2.type == "opt") {
      return [edge(from)].concat(compile(expr2.expr, from));
    } else if (expr2.type == "range") {
      let cur = from;
      for (let i = 0; i < expr2.min; i++) {
        let next = node();
        connect(compile(expr2.expr, cur), next);
        cur = next;
      }
      if (expr2.max == -1) {
        connect(compile(expr2.expr, cur), cur);
      } else {
        for (let i = expr2.min; i < expr2.max; i++) {
          let next = node();
          edge(cur, next);
          connect(compile(expr2.expr, cur), next);
          cur = next;
        }
      }
      return [edge(cur)];
    } else if (expr2.type == "name") {
      return [edge(from, void 0, expr2.value)];
    } else {
      throw new Error("Unknown expr type");
    }
  }
}
function cmp(a, b) {
  return b - a;
}
function nullFrom(nfa2, node) {
  let result = [];
  scan(node);
  return result.sort(cmp);
  function scan(node2) {
    let edges = nfa2[node2];
    if (edges.length == 1 && !edges[0].term)
      return scan(edges[0].to);
    result.push(node2);
    for (let i = 0; i < edges.length; i++) {
      let { term, to } = edges[i];
      if (!term && result.indexOf(to) == -1)
        scan(to);
    }
  }
}
function dfa(nfa2) {
  let labeled = /* @__PURE__ */ Object.create(null);
  return explore(nullFrom(nfa2, 0));
  function explore(states) {
    let out = [];
    states.forEach((node) => {
      nfa2[node].forEach(({ term, to }) => {
        if (!term)
          return;
        let set;
        for (let i = 0; i < out.length; i++)
          if (out[i][0] == term)
            set = out[i][1];
        nullFrom(nfa2, to).forEach((node2) => {
          if (!set)
            out.push([term, set = []]);
          if (set.indexOf(node2) == -1)
            set.push(node2);
        });
      });
    });
    let state = labeled[states.join(",")] = new ContentMatch(states.indexOf(nfa2.length - 1) > -1);
    for (let i = 0; i < out.length; i++) {
      let states2 = out[i][1].sort(cmp);
      state.next.push({ type: out[i][0], next: labeled[states2.join(",")] || explore(states2) });
    }
    return state;
  }
}
function checkForDeadEnds(match, stream) {
  for (let i = 0, work = [match]; i < work.length; i++) {
    let state = work[i], dead = !state.validEnd, nodes = [];
    for (let j = 0; j < state.next.length; j++) {
      let { type, next } = state.next[j];
      nodes.push(type.name);
      if (dead && !(type.isText || type.hasRequiredAttrs()))
        dead = false;
      if (work.indexOf(next) == -1)
        work.push(next);
    }
    if (dead)
      stream.err("Only non-generatable nodes (" + nodes.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
  }
}

// node_modules/prosemirror-transform/dist/index.js
var lower16 = 65535;
var factor16 = Math.pow(2, 16);
function makeRecover(index, offset) {
  return index + offset * factor16;
}
function recoverIndex(value) {
  return value & lower16;
}
function recoverOffset(value) {
  return (value - (value & lower16)) / factor16;
}
var DEL_BEFORE = 1;
var DEL_AFTER = 2;
var DEL_ACROSS = 4;
var DEL_SIDE = 8;
var MapResult = class {
  /**
  @internal
  */
  constructor(pos, delInfo, recover) {
    this.pos = pos;
    this.delInfo = delInfo;
    this.recover = recover;
  }
  /**
  Tells you whether the position was deleted, that is, whether the
  step removed the token on the side queried (via the `assoc`)
  argument from the document.
  */
  get deleted() {
    return (this.delInfo & DEL_SIDE) > 0;
  }
  /**
  Tells you whether the token before the mapped position was deleted.
  */
  get deletedBefore() {
    return (this.delInfo & (DEL_BEFORE | DEL_ACROSS)) > 0;
  }
  /**
  True when the token after the mapped position was deleted.
  */
  get deletedAfter() {
    return (this.delInfo & (DEL_AFTER | DEL_ACROSS)) > 0;
  }
  /**
  Tells whether any of the steps mapped through deletes across the
  position (including both the token before and after the
  position).
  */
  get deletedAcross() {
    return (this.delInfo & DEL_ACROSS) > 0;
  }
};
var StepMap = class {
  /**
  Create a position map. The modifications to the document are
  represented as an array of numbers, in which each group of three
  represents a modified chunk as `[start, oldSize, newSize]`.
  */
  constructor(ranges, inverted = false) {
    this.ranges = ranges;
    this.inverted = inverted;
    if (!ranges.length && StepMap.empty)
      return StepMap.empty;
  }
  /**
  @internal
  */
  recover(value) {
    let diff = 0, index = recoverIndex(value);
    if (!this.inverted)
      for (let i = 0; i < index; i++)
        diff += this.ranges[i * 3 + 2] - this.ranges[i * 3 + 1];
    return this.ranges[index * 3] + diff + recoverOffset(value);
  }
  mapResult(pos, assoc = 1) {
    return this._map(pos, assoc, false);
  }
  map(pos, assoc = 1) {
    return this._map(pos, assoc, true);
  }
  /**
  @internal
  */
  _map(pos, assoc, simple) {
    let diff = 0, oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
    for (let i = 0; i < this.ranges.length; i += 3) {
      let start = this.ranges[i] - (this.inverted ? diff : 0);
      if (start > pos)
        break;
      let oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex], end = start + oldSize;
      if (pos <= end) {
        let side = !oldSize ? assoc : pos == start ? -1 : pos == end ? 1 : assoc;
        let result = start + diff + (side < 0 ? 0 : newSize);
        if (simple)
          return result;
        let recover = pos == (assoc < 0 ? start : end) ? null : makeRecover(i / 3, pos - start);
        let del = pos == start ? DEL_AFTER : pos == end ? DEL_BEFORE : DEL_ACROSS;
        if (assoc < 0 ? pos != start : pos != end)
          del |= DEL_SIDE;
        return new MapResult(result, del, recover);
      }
      diff += newSize - oldSize;
    }
    return simple ? pos + diff : new MapResult(pos + diff, 0, null);
  }
  /**
  @internal
  */
  touches(pos, recover) {
    let diff = 0, index = recoverIndex(recover);
    let oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
    for (let i = 0; i < this.ranges.length; i += 3) {
      let start = this.ranges[i] - (this.inverted ? diff : 0);
      if (start > pos)
        break;
      let oldSize = this.ranges[i + oldIndex], end = start + oldSize;
      if (pos <= end && i == index * 3)
        return true;
      diff += this.ranges[i + newIndex] - oldSize;
    }
    return false;
  }
  /**
  Calls the given function on each of the changed ranges included in
  this map.
  */
  forEach(f) {
    let oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
    for (let i = 0, diff = 0; i < this.ranges.length; i += 3) {
      let start = this.ranges[i], oldStart = start - (this.inverted ? diff : 0), newStart = start + (this.inverted ? 0 : diff);
      let oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex];
      f(oldStart, oldStart + oldSize, newStart, newStart + newSize);
      diff += newSize - oldSize;
    }
  }
  /**
  Create an inverted version of this map. The result can be used to
  map positions in the post-step document to the pre-step document.
  */
  invert() {
    return new StepMap(this.ranges, !this.inverted);
  }
  /**
  @internal
  */
  toString() {
    return (this.inverted ? "-" : "") + JSON.stringify(this.ranges);
  }
  /**
  Create a map that moves all positions by offset `n` (which may be
  negative). This can be useful when applying steps meant for a
  sub-document to a larger document, or vice-versa.
  */
  static offset(n) {
    return n == 0 ? StepMap.empty : new StepMap(n < 0 ? [0, -n, 0] : [0, 0, n]);
  }
};
StepMap.empty = new StepMap([]);
var stepsByID = /* @__PURE__ */ Object.create(null);
var Step = class {
  /**
  Get the step map that represents the changes made by this step,
  and which can be used to transform between positions in the old
  and the new document.
  */
  getMap() {
    return StepMap.empty;
  }
  /**
  Try to merge this step with another one, to be applied directly
  after it. Returns the merged step when possible, null if the
  steps can't be merged.
  */
  merge(other) {
    return null;
  }
  /**
  Deserialize a step from its JSON representation. Will call
  through to the step class' own implementation of this method.
  */
  static fromJSON(schema, json) {
    if (!json || !json.stepType)
      throw new RangeError("Invalid input for Step.fromJSON");
    let type = stepsByID[json.stepType];
    if (!type)
      throw new RangeError(`No step type ${json.stepType} defined`);
    return type.fromJSON(schema, json);
  }
  /**
  To be able to serialize steps to JSON, each step needs a string
  ID to attach to its JSON representation. Use this method to
  register an ID for your step classes. Try to pick something
  that's unlikely to clash with steps from other modules.
  */
  static jsonID(id, stepClass) {
    if (id in stepsByID)
      throw new RangeError("Duplicate use of step JSON ID " + id);
    stepsByID[id] = stepClass;
    stepClass.prototype.jsonID = id;
    return stepClass;
  }
};
var StepResult = class {
  /**
  @internal
  */
  constructor(doc, failed) {
    this.doc = doc;
    this.failed = failed;
  }
  /**
  Create a successful step result.
  */
  static ok(doc) {
    return new StepResult(doc, null);
  }
  /**
  Create a failed step result.
  */
  static fail(message) {
    return new StepResult(null, message);
  }
  /**
  Call [`Node.replace`](https://prosemirror.net/docs/ref/#model.Node.replace) with the given
  arguments. Create a successful result if it succeeds, and a
  failed one if it throws a `ReplaceError`.
  */
  static fromReplace(doc, from, to, slice) {
    try {
      return StepResult.ok(doc.replace(from, to, slice));
    } catch (e) {
      if (e instanceof ReplaceError)
        return StepResult.fail(e.message);
      throw e;
    }
  }
};
function mapFragment(fragment, f, parent) {
  let mapped = [];
  for (let i = 0; i < fragment.childCount; i++) {
    let child = fragment.child(i);
    if (child.content.size)
      child = child.copy(mapFragment(child.content, f, child));
    if (child.isInline)
      child = f(child, parent, i);
    mapped.push(child);
  }
  return Fragment.fromArray(mapped);
}
var AddMarkStep = class extends Step {
  /**
  Create a mark step.
  */
  constructor(from, to, mark) {
    super();
    this.from = from;
    this.to = to;
    this.mark = mark;
  }
  apply(doc) {
    let oldSlice = doc.slice(this.from, this.to), $from = doc.resolve(this.from);
    let parent = $from.node($from.sharedDepth(this.to));
    let slice = new Slice(mapFragment(oldSlice.content, (node, parent2) => {
      if (!node.isAtom || !parent2.type.allowsMarkType(this.mark.type))
        return node;
      return node.mark(this.mark.addToSet(node.marks));
    }, parent), oldSlice.openStart, oldSlice.openEnd);
    return StepResult.fromReplace(doc, this.from, this.to, slice);
  }
  invert() {
    return new RemoveMarkStep(this.from, this.to, this.mark);
  }
  map(mapping) {
    let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
    if (from.deleted && to.deleted || from.pos >= to.pos)
      return null;
    return new AddMarkStep(from.pos, to.pos, this.mark);
  }
  merge(other) {
    if (other instanceof AddMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from)
      return new AddMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
    return null;
  }
  toJSON() {
    return {
      stepType: "addMark",
      mark: this.mark.toJSON(),
      from: this.from,
      to: this.to
    };
  }
  /**
  @internal
  */
  static fromJSON(schema, json) {
    if (typeof json.from != "number" || typeof json.to != "number")
      throw new RangeError("Invalid input for AddMarkStep.fromJSON");
    return new AddMarkStep(json.from, json.to, schema.markFromJSON(json.mark));
  }
};
Step.jsonID("addMark", AddMarkStep);
var RemoveMarkStep = class extends Step {
  /**
  Create a mark-removing step.
  */
  constructor(from, to, mark) {
    super();
    this.from = from;
    this.to = to;
    this.mark = mark;
  }
  apply(doc) {
    let oldSlice = doc.slice(this.from, this.to);
    let slice = new Slice(mapFragment(oldSlice.content, (node) => {
      return node.mark(this.mark.removeFromSet(node.marks));
    }, doc), oldSlice.openStart, oldSlice.openEnd);
    return StepResult.fromReplace(doc, this.from, this.to, slice);
  }
  invert() {
    return new AddMarkStep(this.from, this.to, this.mark);
  }
  map(mapping) {
    let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
    if (from.deleted && to.deleted || from.pos >= to.pos)
      return null;
    return new RemoveMarkStep(from.pos, to.pos, this.mark);
  }
  merge(other) {
    if (other instanceof RemoveMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from)
      return new RemoveMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
    return null;
  }
  toJSON() {
    return {
      stepType: "removeMark",
      mark: this.mark.toJSON(),
      from: this.from,
      to: this.to
    };
  }
  /**
  @internal
  */
  static fromJSON(schema, json) {
    if (typeof json.from != "number" || typeof json.to != "number")
      throw new RangeError("Invalid input for RemoveMarkStep.fromJSON");
    return new RemoveMarkStep(json.from, json.to, schema.markFromJSON(json.mark));
  }
};
Step.jsonID("removeMark", RemoveMarkStep);
var AddNodeMarkStep = class extends Step {
  /**
  Create a node mark step.
  */
  constructor(pos, mark) {
    super();
    this.pos = pos;
    this.mark = mark;
  }
  apply(doc) {
    let node = doc.nodeAt(this.pos);
    if (!node)
      return StepResult.fail("No node at mark step's position");
    let updated = node.type.create(node.attrs, null, this.mark.addToSet(node.marks));
    return StepResult.fromReplace(doc, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
  }
  invert(doc) {
    let node = doc.nodeAt(this.pos);
    if (node) {
      let newSet = this.mark.addToSet(node.marks);
      if (newSet.length == node.marks.length) {
        for (let i = 0; i < node.marks.length; i++)
          if (!node.marks[i].isInSet(newSet))
            return new AddNodeMarkStep(this.pos, node.marks[i]);
        return new AddNodeMarkStep(this.pos, this.mark);
      }
    }
    return new RemoveNodeMarkStep(this.pos, this.mark);
  }
  map(mapping) {
    let pos = mapping.mapResult(this.pos, 1);
    return pos.deletedAfter ? null : new AddNodeMarkStep(pos.pos, this.mark);
  }
  toJSON() {
    return { stepType: "addNodeMark", pos: this.pos, mark: this.mark.toJSON() };
  }
  /**
  @internal
  */
  static fromJSON(schema, json) {
    if (typeof json.pos != "number")
      throw new RangeError("Invalid input for AddNodeMarkStep.fromJSON");
    return new AddNodeMarkStep(json.pos, schema.markFromJSON(json.mark));
  }
};
Step.jsonID("addNodeMark", AddNodeMarkStep);
var RemoveNodeMarkStep = class extends Step {
  /**
  Create a mark-removing step.
  */
  constructor(pos, mark) {
    super();
    this.pos = pos;
    this.mark = mark;
  }
  apply(doc) {
    let node = doc.nodeAt(this.pos);
    if (!node)
      return StepResult.fail("No node at mark step's position");
    let updated = node.type.create(node.attrs, null, this.mark.removeFromSet(node.marks));
    return StepResult.fromReplace(doc, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
  }
  invert(doc) {
    let node = doc.nodeAt(this.pos);
    if (!node || !this.mark.isInSet(node.marks))
      return this;
    return new AddNodeMarkStep(this.pos, this.mark);
  }
  map(mapping) {
    let pos = mapping.mapResult(this.pos, 1);
    return pos.deletedAfter ? null : new RemoveNodeMarkStep(pos.pos, this.mark);
  }
  toJSON() {
    return { stepType: "removeNodeMark", pos: this.pos, mark: this.mark.toJSON() };
  }
  /**
  @internal
  */
  static fromJSON(schema, json) {
    if (typeof json.pos != "number")
      throw new RangeError("Invalid input for RemoveNodeMarkStep.fromJSON");
    return new RemoveNodeMarkStep(json.pos, schema.markFromJSON(json.mark));
  }
};
Step.jsonID("removeNodeMark", RemoveNodeMarkStep);
var ReplaceStep = class extends Step {
  /**
  The given `slice` should fit the 'gap' between `from` and
  `to`—the depths must line up, and the surrounding nodes must be
  able to be joined with the open sides of the slice. When
  `structure` is true, the step will fail if the content between
  from and to is not just a sequence of closing and then opening
  tokens (this is to guard against rebased replace steps
  overwriting something they weren't supposed to).
  */
  constructor(from, to, slice, structure = false) {
    super();
    this.from = from;
    this.to = to;
    this.slice = slice;
    this.structure = structure;
  }
  apply(doc) {
    if (this.structure && contentBetween(doc, this.from, this.to))
      return StepResult.fail("Structure replace would overwrite content");
    return StepResult.fromReplace(doc, this.from, this.to, this.slice);
  }
  getMap() {
    return new StepMap([this.from, this.to - this.from, this.slice.size]);
  }
  invert(doc) {
    return new ReplaceStep(this.from, this.from + this.slice.size, doc.slice(this.from, this.to));
  }
  map(mapping) {
    let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
    if (from.deletedAcross && to.deletedAcross)
      return null;
    return new ReplaceStep(from.pos, Math.max(from.pos, to.pos), this.slice);
  }
  merge(other) {
    if (!(other instanceof ReplaceStep) || other.structure || this.structure)
      return null;
    if (this.from + this.slice.size == other.from && !this.slice.openEnd && !other.slice.openStart) {
      let slice = this.slice.size + other.slice.size == 0 ? Slice.empty : new Slice(this.slice.content.append(other.slice.content), this.slice.openStart, other.slice.openEnd);
      return new ReplaceStep(this.from, this.to + (other.to - other.from), slice, this.structure);
    } else if (other.to == this.from && !this.slice.openStart && !other.slice.openEnd) {
      let slice = this.slice.size + other.slice.size == 0 ? Slice.empty : new Slice(other.slice.content.append(this.slice.content), other.slice.openStart, this.slice.openEnd);
      return new ReplaceStep(other.from, this.to, slice, this.structure);
    } else {
      return null;
    }
  }
  toJSON() {
    let json = { stepType: "replace", from: this.from, to: this.to };
    if (this.slice.size)
      json.slice = this.slice.toJSON();
    if (this.structure)
      json.structure = true;
    return json;
  }
  /**
  @internal
  */
  static fromJSON(schema, json) {
    if (typeof json.from != "number" || typeof json.to != "number")
      throw new RangeError("Invalid input for ReplaceStep.fromJSON");
    return new ReplaceStep(json.from, json.to, Slice.fromJSON(schema, json.slice), !!json.structure);
  }
};
Step.jsonID("replace", ReplaceStep);
var ReplaceAroundStep = class extends Step {
  /**
  Create a replace-around step with the given range and gap.
  `insert` should be the point in the slice into which the content
  of the gap should be moved. `structure` has the same meaning as
  it has in the [`ReplaceStep`](https://prosemirror.net/docs/ref/#transform.ReplaceStep) class.
  */
  constructor(from, to, gapFrom, gapTo, slice, insert, structure = false) {
    super();
    this.from = from;
    this.to = to;
    this.gapFrom = gapFrom;
    this.gapTo = gapTo;
    this.slice = slice;
    this.insert = insert;
    this.structure = structure;
  }
  apply(doc) {
    if (this.structure && (contentBetween(doc, this.from, this.gapFrom) || contentBetween(doc, this.gapTo, this.to)))
      return StepResult.fail("Structure gap-replace would overwrite content");
    let gap = doc.slice(this.gapFrom, this.gapTo);
    if (gap.openStart || gap.openEnd)
      return StepResult.fail("Gap is not a flat range");
    let inserted = this.slice.insertAt(this.insert, gap.content);
    if (!inserted)
      return StepResult.fail("Content does not fit in gap");
    return StepResult.fromReplace(doc, this.from, this.to, inserted);
  }
  getMap() {
    return new StepMap([
      this.from,
      this.gapFrom - this.from,
      this.insert,
      this.gapTo,
      this.to - this.gapTo,
      this.slice.size - this.insert
    ]);
  }
  invert(doc) {
    let gap = this.gapTo - this.gapFrom;
    return new ReplaceAroundStep(this.from, this.from + this.slice.size + gap, this.from + this.insert, this.from + this.insert + gap, doc.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure);
  }
  map(mapping) {
    let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
    let gapFrom = this.from == this.gapFrom ? from.pos : mapping.map(this.gapFrom, -1);
    let gapTo = this.to == this.gapTo ? to.pos : mapping.map(this.gapTo, 1);
    if (from.deletedAcross && to.deletedAcross || gapFrom < from.pos || gapTo > to.pos)
      return null;
    return new ReplaceAroundStep(from.pos, to.pos, gapFrom, gapTo, this.slice, this.insert, this.structure);
  }
  toJSON() {
    let json = {
      stepType: "replaceAround",
      from: this.from,
      to: this.to,
      gapFrom: this.gapFrom,
      gapTo: this.gapTo,
      insert: this.insert
    };
    if (this.slice.size)
      json.slice = this.slice.toJSON();
    if (this.structure)
      json.structure = true;
    return json;
  }
  /**
  @internal
  */
  static fromJSON(schema, json) {
    if (typeof json.from != "number" || typeof json.to != "number" || typeof json.gapFrom != "number" || typeof json.gapTo != "number" || typeof json.insert != "number")
      throw new RangeError("Invalid input for ReplaceAroundStep.fromJSON");
    return new ReplaceAroundStep(json.from, json.to, json.gapFrom, json.gapTo, Slice.fromJSON(schema, json.slice), json.insert, !!json.structure);
  }
};
Step.jsonID("replaceAround", ReplaceAroundStep);
function contentBetween(doc, from, to) {
  let $from = doc.resolve(from), dist = to - from, depth = $from.depth;
  while (dist > 0 && depth > 0 && $from.indexAfter(depth) == $from.node(depth).childCount) {
    depth--;
    dist--;
  }
  if (dist > 0) {
    let next = $from.node(depth).maybeChild($from.indexAfter(depth));
    while (dist > 0) {
      if (!next || next.isLeaf)
        return true;
      next = next.firstChild;
      dist--;
    }
  }
  return false;
}
var AttrStep = class extends Step {
  /**
  Construct an attribute step.
  */
  constructor(pos, attr, value) {
    super();
    this.pos = pos;
    this.attr = attr;
    this.value = value;
  }
  apply(doc) {
    let node = doc.nodeAt(this.pos);
    if (!node)
      return StepResult.fail("No node at attribute step's position");
    let attrs = /* @__PURE__ */ Object.create(null);
    for (let name in node.attrs)
      attrs[name] = node.attrs[name];
    attrs[this.attr] = this.value;
    let updated = node.type.create(attrs, null, node.marks);
    return StepResult.fromReplace(doc, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
  }
  getMap() {
    return StepMap.empty;
  }
  invert(doc) {
    return new AttrStep(this.pos, this.attr, doc.nodeAt(this.pos).attrs[this.attr]);
  }
  map(mapping) {
    let pos = mapping.mapResult(this.pos, 1);
    return pos.deletedAfter ? null : new AttrStep(pos.pos, this.attr, this.value);
  }
  toJSON() {
    return { stepType: "attr", pos: this.pos, attr: this.attr, value: this.value };
  }
  static fromJSON(schema, json) {
    if (typeof json.pos != "number" || typeof json.attr != "string")
      throw new RangeError("Invalid input for AttrStep.fromJSON");
    return new AttrStep(json.pos, json.attr, json.value);
  }
};
Step.jsonID("attr", AttrStep);
var DocAttrStep = class extends Step {
  /**
  Construct an attribute step.
  */
  constructor(attr, value) {
    super();
    this.attr = attr;
    this.value = value;
  }
  apply(doc) {
    let attrs = /* @__PURE__ */ Object.create(null);
    for (let name in doc.attrs)
      attrs[name] = doc.attrs[name];
    attrs[this.attr] = this.value;
    let updated = doc.type.create(attrs, doc.content, doc.marks);
    return StepResult.ok(updated);
  }
  getMap() {
    return StepMap.empty;
  }
  invert(doc) {
    return new DocAttrStep(this.attr, doc.attrs[this.attr]);
  }
  map(mapping) {
    return this;
  }
  toJSON() {
    return { stepType: "docAttr", attr: this.attr, value: this.value };
  }
  static fromJSON(schema, json) {
    if (typeof json.attr != "string")
      throw new RangeError("Invalid input for DocAttrStep.fromJSON");
    return new DocAttrStep(json.attr, json.value);
  }
};
Step.jsonID("docAttr", DocAttrStep);
var TransformError = class extends Error {
};
TransformError = function TransformError2(message) {
  let err = Error.call(this, message);
  err.__proto__ = TransformError2.prototype;
  return err;
};
TransformError.prototype = Object.create(Error.prototype);
TransformError.prototype.constructor = TransformError;
TransformError.prototype.name = "TransformError";
export {
  CoqFileProgressKind,
  FileFormat,
  Fragment,
  HistoryChange,
  InputAreaStatus,
  ReplaceAroundStep,
  ReplaceStep,
  Severity,
  SeverityLabelMap,
  Step,
  WaterproofMapping
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2FwaS9JbnB1dEFyZWFTdGF0dXMudHMiLCAiLi4vLi4vc3JjL2FwaS9TZXZlcml0eS50cyIsICIuLi8uLi9zcmMvYXBpL0ZpbGVGb3JtYXQudHMiLCAiLi4vLi4vc3JjL2FwaS90eXBlcy50cyIsICIuLi8uLi9ub2RlX21vZHVsZXMvcHJvc2VtaXJyb3ItbW9kZWwvZGlzdC9pbmRleC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvcHJvc2VtaXJyb3ItdHJhbnNmb3JtL2Rpc3QvaW5kZXguanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogVGhlIHByb29mIHN0YXR1cyBvZiBhbiBpbnB1dCBhcmVhLlxuICovXG5leHBvcnQgZW51bSBJbnB1dEFyZWFTdGF0dXMge1xuICAgIC8qKiBUaGUgcHJvb2YgaXMgY29ycmVjdC4gKi9cbiAgICBQcm92ZW4gPSBcInByb3ZlblwiLFxuICAgIC8qKiBUaGUgcHJvb2YgaXMgdW5maW5pc2hlZCBvciBjb250YWlucyBhbiBlcnJvci4gKi9cbiAgICBJbmNvbXBsZXRlID0gXCJpbmNvbXBsZXRlXCIsXG4gICAgLyoqIFRoZSBpbnB1dCBhcmVhIGRvZXMgbm90IGNvbnRhaW4gYFFlZC5gIGF0IHRoZSBlbmQsIHNvIHRoZSBzdGF0dXMgY2Fubm90IGJlIGRldGVybWluZWQuICovXG4gICAgSW52YWxpZCA9IFwiaW52YWxpZFwiLFxufSIsICJcbi8qKlxuICogU2V2ZXJpdHkgb2YgcmVwb3J0ZWQgZGlhZ25vc3RpY3NcbiAqL1xuZXhwb3J0IGVudW0gU2V2ZXJpdHkge1xuXHRFcnJvciA9IDAsXG5cdFdhcm5pbmcgPSAxLFxuXHRJbmZvcm1hdGlvbiA9IDIsXG4gICAgSGludCA9IDNcbn1cblxuZXhwb3J0IHR5cGUgU2V2ZXJpdHlMYWJlbCA9IFwiaGludFwiIHwgXCJpbmZvXCIgfCBcIndhcm5pbmdcIiB8IFwiZXJyb3JcIjtcblxuZXhwb3J0IGNvbnN0IFNldmVyaXR5TGFiZWxNYXA6IFJlY29yZDxTZXZlcml0eSwgU2V2ZXJpdHlMYWJlbD4gPSB7XG5cdFtTZXZlcml0eS5FcnJvcl06IFwiZXJyb3JcIixcblx0W1NldmVyaXR5Lldhcm5pbmddOiBcIndhcm5pbmdcIixcblx0W1NldmVyaXR5LkluZm9ybWF0aW9uXTogXCJpbmZvXCIsXG5cdFtTZXZlcml0eS5IaW50XTogXCJoaW50XCJcbn07XG4iLCAiLyoqXG4gKiBUaGUgZGlmZmVyZW50IHN1cHBvcnRlZCBpbnB1dC9vdXRwdXQgZmlsZSB0eXBlc1xuICovXG5leHBvcnQgZW51bSBGaWxlRm9ybWF0IHtcbiAgICAvKiogTWFya2Rvd24gZW5hYmxlZCBjb3EgZmlsZSAoZXh0ZW5zaW9uOiBgLm12YCkgKi9cbiAgICBNYXJrZG93blYgPSBcIk1hcmtkb3duVlwiLFxuICAgIC8qKiBSZWd1bGFyIGNvcSBmaWxlLCB3aXRoIHRoZSBwb3NzaWJpbGl0eSBmb3IgY29xZG9jIGNvbW1lbnRzIChleHRlbnNpb246IGAudmApICovXG4gICAgUmVndWxhclYgPSBcIlJlZ3VsYXJWXCJcbn1cbiIsICJpbXBvcnQgeyBTdGVwIH0gZnJvbSBcInByb3NlbWlycm9yLXRyYW5zZm9ybVwiO1xuaW1wb3J0IHsgRG9jQ2hhbmdlLCBXcmFwcGluZ0RvY0NoYW5nZSwgU2V2ZXJpdHksIFdhdGVycHJvb2ZDb21wbGV0aW9uIH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IEJsb2NrIH0gZnJvbSBcIi4uL2RvY3VtZW50XCI7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBhcmVhIG9mIHRleHQsIHRoYXQgaXMgZWRpdGFibGUgaW4gdGhlIHByb3NlbWlycm9yIHZpZXcgYW5kIGl0c1xuICogbWFwcGluZyB0byB0aGUgdnNjb2RlIGRvY3VtZW50XG4gKi9cbmV4cG9ydCB0eXBlIFN0cmluZ0NlbGwgPSB7XG4gICAgLyoqIFRoZSBwcm9zZW1pcnJvciBzdGFydGluZyBpbmRleCBvZiB0aGlzIGNlbGwgKi9cbiAgICBzdGFydFByb3NlOiBudW1iZXIsXG4gICAgLyoqIFRoZSBwcm9zZW1pcnJvciBlbmRpbmcgaW5kZXggb2YgdGhpcyBjZWxsICovXG4gICAgZW5kUHJvc2U6IG51bWJlcixcbiAgICAvKiogVGhlIHN0YXJ0aW5nIGluZGV4IG9mIHRoaXMgY2VsbCBpbiB0aGUgdGV4dCBkb2N1bWVudCBzdHJpbmcgdnNjb2RlIHNpZGUgKi9cbiAgICBzdGFydFRleHQ6IG51bWJlcixcbiAgICAvKiogVGhlIGVuZGluZyBpbmRleCBvZiB0aGlzIGNlbGwgaW4gdGhlIHRleHQgZG9jdW1lbnQgc3RyaW5nIHZzY29kZSBzaWRlICovXG4gICAgZW5kVGV4dDogbnVtYmVyLFxufTtcblxuZXhwb3J0IHR5cGUgUG9zaXRpb25lZDxBPiA9IHtcbiAgICBvYmo6IEE7XG4gICAgcG9zOiBudW1iZXIgfCB1bmRlZmluZWQ7XG59O1xuXG4vKipcbiAqIFdhdGVycHJvb2ZEb2N1bWVudCBpcyBhIGNvbGxlY3Rpb24gb2YgYmxvY2tzXG4gKi9cbmV4cG9ydCB0eXBlIFdhdGVycHJvb2ZEb2N1bWVudCA9IEJsb2NrW107XG5cbmV4cG9ydCB0eXBlIFdhdGVycHJvb2ZDYWxsYmFja3MgPSB7XG4gICAgZXhlY3V0ZUNvbW1hbmQ6IChjb21tYW5kOiBzdHJpbmcsIHRpbWU6IG51bWJlcikgPT4gdm9pZCxcbiAgICBleGVjdXRlSGVscDogKCkgPT4gdm9pZCxcbiAgICBlZGl0b3JSZWFkeTogKCkgPT4gdm9pZCxcbiAgICBkb2N1bWVudENoYW5nZTogKGNoYW5nZTogRG9jQ2hhbmdlIHwgV3JhcHBpbmdEb2NDaGFuZ2UpID0+IHZvaWQsXG4gICAgYXBwbHlTdGVwRXJyb3I6IChlcnJvck1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZCxcbiAgICBjdXJzb3JDaGFuZ2U6IChjdXJzb3JQb3NpdGlvbjogbnVtYmVyKSA9PiB2b2lkXG4gICAgbGluZU51bWJlcnM6IChsaW5lbnVtYmVyczogQXJyYXk8bnVtYmVyPiwgdmVyc2lvbjogbnVtYmVyKSA9PiB2b2lkLFxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgV2F0ZXJwcm9vZk1hcHBpbmcge1xuICAgIGFic3RyYWN0IGdldE1hcHBpbmc6ICgpID0+IE1hcDxudW1iZXIsIFN0cmluZ0NlbGw+O1xuICAgIGFic3RyYWN0IGdldCB2ZXJzaW9uKCk6IG51bWJlcjtcbiAgICBhYnN0cmFjdCBmaW5kUG9zaXRpb246IChpbmRleDogbnVtYmVyKSA9PiBudW1iZXI7XG4gICAgYWJzdHJhY3QgZmluZEludlBvc2l0aW9uOiAoaW5kZXg6IG51bWJlcikgPT4gbnVtYmVyO1xuICAgIGFic3RyYWN0IHVwZGF0ZTogKHN0ZXA6IFN0ZXApID0+IERvY0NoYW5nZSB8IFdyYXBwaW5nRG9jQ2hhbmdlO1xufVxuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciB0aGUgV2F0ZXJwcm9vZkVkaXRvci5cbiAqIFxuICogLSBgYXBpYCBjb250YWlucyB0aGUgY2FsbGJhY2tzIHRoYXQgdGhlIGVkaXRvciB3aWxsIHVzZSB0byBjb21tdW5pY2F0ZSB3aXRoIHRoZSBob3N0IGFwcGxpY2F0aW9uLlxuICogLSBgZG9jdW1lbnRDb25zdHJ1Y3RvcmAgaXMgYSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgc3RyaW5nIGFuZCByZXR1cm5zIGEgV2F0ZXJwcm9vZkRvY3VtZW50IChibG9jayByZXByZXNlbnRhdGlvbiBvZiBhIFByb3NlTWlycm9yIGRvY3VtZW50KS5cbiAqIC0gYG1hcHBpbmdgIGlzIGEgY29uc3RydWN0b3IgZm9yIHRoZSBXYXRlcnByb29mTWFwcGluZyBjbGFzcywgd2hpY2ggaGFuZGxlcyB0aGUgbWFwcGluZyBiZXR3ZWVuIHRoZSBQcm9zZU1pcnJvciBkb2N1bWVudCBhbmQgdGhlIHRleHQgZG9jdW1lbnQgaW4gdGhlIGhvc3QgYXBwbGljYXRpb24uXG4gKi9cbmV4cG9ydCB0eXBlIFdhdGVycHJvb2ZFZGl0b3JDb25maWcgPSB7XG4gICAgY29tcGxldGlvbnM6IEFycmF5PFdhdGVycHJvb2ZDb21wbGV0aW9uPixcbiAgICBhcGk6IFdhdGVycHJvb2ZDYWxsYmFja3MsXG4gICAgZG9jdW1lbnRDb25zdHJ1Y3RvcjogKGRvY3VtZW50OiBzdHJpbmcpID0+IFdhdGVycHJvb2ZEb2N1bWVudCxcbiAgICBtYXBwaW5nOiBuZXcgKGlucHV0U3RyaW5nOiBzdHJpbmcsIHZlcnNpb25OdW06IG51bWJlcikgPT4gV2F0ZXJwcm9vZk1hcHBpbmcsXG4gICAgLyoqIFRISVMgSVMgQSBURU1QT1JBUlkgRkVBVFVSRSBUSEFUIFdJTEwgR0VUIFJFTU9WRUQgKi9cbiAgICBkb2N1bWVudFByZXByb2Nlc3Nvcj86IChpbnB1dFN0cmluZzogc3RyaW5nKSA9PiB7cmVzdWx0aW5nRG9jdW1lbnQ6IHN0cmluZywgZG9jdW1lbnRDaGFuZ2U6IERvY0NoYW5nZSB8IFdyYXBwaW5nRG9jQ2hhbmdlIHwgdW5kZWZpbmVkfSxcbn1cblxuZXhwb3J0IGVudW0gSGlzdG9yeUNoYW5nZSB7XG4gICAgVW5kbyxcbiAgICBSZWRvXG59XG5cbmV4cG9ydCB0eXBlIFNpbXBsZVByb2dyZXNzSW5mbyA9IHtcbiAgICAvKiogUmFuZ2UgZm9yIHdoaWNoIHRoZSBwcm9jZXNzaW5nIGluZm8gd2FzIHJlcG9ydGVkLiAqL1xuICAgIHJhbmdlOiB7XG4gICAgICAgIHN0YXJ0OiB7IGxpbmU6IG51bWJlciwgY2hhcmFjdGVyOiBudW1iZXIgfSxcbiAgICAgICAgZW5kOiB7IGxpbmU6IG51bWJlciwgY2hhcmFjdGVyOiBudW1iZXIgfSxcbiAgICB9O1xuICAgIC8qKiBLaW5kIG9mIHByb2dyZXNzIHRoYXQgd2FzIHJlcG9ydGVkLiAqL1xuICAgIGtpbmQ/OiBDb3FGaWxlUHJvZ3Jlc3NLaW5kO1xufVxuXG5leHBvcnQgdHlwZSBTaW1wbGVQcm9ncmVzc1BhcmFtcyA9IHtcbiAgICBudW1iZXJPZkxpbmVzOiBudW1iZXI7XG4gICAgcHJvZ3Jlc3M6IFNpbXBsZVByb2dyZXNzSW5mb1tdO1xufVxuXG5leHBvcnQgZW51bSBDb3FGaWxlUHJvZ3Jlc3NLaW5kIHtcbiAgICBQcm9jZXNzaW5nID0gMSxcbiAgICBGYXRhbEVycm9yXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT2Zmc2V0RGlhZ25vc3RpYyB7XG4gICAgbWVzc2FnZTogc3RyaW5nO1xuICAgIHNldmVyaXR5OiBTZXZlcml0eTtcbiAgICBzdGFydE9mZnNldDogbnVtYmVyO1xuICAgIGVuZE9mZnNldDogbnVtYmVyO1xufVxuXG5leHBvcnQgdHlwZSBEaWFnbm9zdGljTWVzc2FnZSA9IHtcbiAgICBwb3NpdGlvbmVkRGlhZ25vc3RpY3M6IE9mZnNldERpYWdub3N0aWNbXSxcbiAgICB2ZXJzaW9uOiBudW1iZXJcbn1cbiIsICJpbXBvcnQgT3JkZXJlZE1hcCBmcm9tICdvcmRlcmVkbWFwJztcblxuZnVuY3Rpb24gZmluZERpZmZTdGFydChhLCBiLCBwb3MpIHtcbiAgICBmb3IgKGxldCBpID0gMDs7IGkrKykge1xuICAgICAgICBpZiAoaSA9PSBhLmNoaWxkQ291bnQgfHwgaSA9PSBiLmNoaWxkQ291bnQpXG4gICAgICAgICAgICByZXR1cm4gYS5jaGlsZENvdW50ID09IGIuY2hpbGRDb3VudCA/IG51bGwgOiBwb3M7XG4gICAgICAgIGxldCBjaGlsZEEgPSBhLmNoaWxkKGkpLCBjaGlsZEIgPSBiLmNoaWxkKGkpO1xuICAgICAgICBpZiAoY2hpbGRBID09IGNoaWxkQikge1xuICAgICAgICAgICAgcG9zICs9IGNoaWxkQS5ub2RlU2l6ZTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY2hpbGRBLnNhbWVNYXJrdXAoY2hpbGRCKSlcbiAgICAgICAgICAgIHJldHVybiBwb3M7XG4gICAgICAgIGlmIChjaGlsZEEuaXNUZXh0ICYmIGNoaWxkQS50ZXh0ICE9IGNoaWxkQi50ZXh0KSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgY2hpbGRBLnRleHRbal0gPT0gY2hpbGRCLnRleHRbal07IGorKylcbiAgICAgICAgICAgICAgICBwb3MrKztcbiAgICAgICAgICAgIHJldHVybiBwb3M7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoaWxkQS5jb250ZW50LnNpemUgfHwgY2hpbGRCLmNvbnRlbnQuc2l6ZSkge1xuICAgICAgICAgICAgbGV0IGlubmVyID0gZmluZERpZmZTdGFydChjaGlsZEEuY29udGVudCwgY2hpbGRCLmNvbnRlbnQsIHBvcyArIDEpO1xuICAgICAgICAgICAgaWYgKGlubmVyICE9IG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlubmVyO1xuICAgICAgICB9XG4gICAgICAgIHBvcyArPSBjaGlsZEEubm9kZVNpemU7XG4gICAgfVxufVxuZnVuY3Rpb24gZmluZERpZmZFbmQoYSwgYiwgcG9zQSwgcG9zQikge1xuICAgIGZvciAobGV0IGlBID0gYS5jaGlsZENvdW50LCBpQiA9IGIuY2hpbGRDb3VudDs7KSB7XG4gICAgICAgIGlmIChpQSA9PSAwIHx8IGlCID09IDApXG4gICAgICAgICAgICByZXR1cm4gaUEgPT0gaUIgPyBudWxsIDogeyBhOiBwb3NBLCBiOiBwb3NCIH07XG4gICAgICAgIGxldCBjaGlsZEEgPSBhLmNoaWxkKC0taUEpLCBjaGlsZEIgPSBiLmNoaWxkKC0taUIpLCBzaXplID0gY2hpbGRBLm5vZGVTaXplO1xuICAgICAgICBpZiAoY2hpbGRBID09IGNoaWxkQikge1xuICAgICAgICAgICAgcG9zQSAtPSBzaXplO1xuICAgICAgICAgICAgcG9zQiAtPSBzaXplO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjaGlsZEEuc2FtZU1hcmt1cChjaGlsZEIpKVxuICAgICAgICAgICAgcmV0dXJuIHsgYTogcG9zQSwgYjogcG9zQiB9O1xuICAgICAgICBpZiAoY2hpbGRBLmlzVGV4dCAmJiBjaGlsZEEudGV4dCAhPSBjaGlsZEIudGV4dCkge1xuICAgICAgICAgICAgbGV0IHNhbWUgPSAwLCBtaW5TaXplID0gTWF0aC5taW4oY2hpbGRBLnRleHQubGVuZ3RoLCBjaGlsZEIudGV4dC5sZW5ndGgpO1xuICAgICAgICAgICAgd2hpbGUgKHNhbWUgPCBtaW5TaXplICYmIGNoaWxkQS50ZXh0W2NoaWxkQS50ZXh0Lmxlbmd0aCAtIHNhbWUgLSAxXSA9PSBjaGlsZEIudGV4dFtjaGlsZEIudGV4dC5sZW5ndGggLSBzYW1lIC0gMV0pIHtcbiAgICAgICAgICAgICAgICBzYW1lKys7XG4gICAgICAgICAgICAgICAgcG9zQS0tO1xuICAgICAgICAgICAgICAgIHBvc0ItLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IGE6IHBvc0EsIGI6IHBvc0IgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hpbGRBLmNvbnRlbnQuc2l6ZSB8fCBjaGlsZEIuY29udGVudC5zaXplKSB7XG4gICAgICAgICAgICBsZXQgaW5uZXIgPSBmaW5kRGlmZkVuZChjaGlsZEEuY29udGVudCwgY2hpbGRCLmNvbnRlbnQsIHBvc0EgLSAxLCBwb3NCIC0gMSk7XG4gICAgICAgICAgICBpZiAoaW5uZXIpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlubmVyO1xuICAgICAgICB9XG4gICAgICAgIHBvc0EgLT0gc2l6ZTtcbiAgICAgICAgcG9zQiAtPSBzaXplO1xuICAgIH1cbn1cblxuLyoqXG5BIGZyYWdtZW50IHJlcHJlc2VudHMgYSBub2RlJ3MgY29sbGVjdGlvbiBvZiBjaGlsZCBub2Rlcy5cblxuTGlrZSBub2RlcywgZnJhZ21lbnRzIGFyZSBwZXJzaXN0ZW50IGRhdGEgc3RydWN0dXJlcywgYW5kIHlvdVxuc2hvdWxkIG5vdCBtdXRhdGUgdGhlbSBvciB0aGVpciBjb250ZW50LiBSYXRoZXIsIHlvdSBjcmVhdGUgbmV3XG5pbnN0YW5jZXMgd2hlbmV2ZXIgbmVlZGVkLiBUaGUgQVBJIHRyaWVzIHRvIG1ha2UgdGhpcyBlYXN5LlxuKi9cbmNsYXNzIEZyYWdtZW50IHtcbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgY29udGVudCwgc2l6ZSkge1xuICAgICAgICB0aGlzLmNvbnRlbnQgPSBjb250ZW50O1xuICAgICAgICB0aGlzLnNpemUgPSBzaXplIHx8IDA7XG4gICAgICAgIGlmIChzaXplID09IG51bGwpXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRlbnQubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICAgICAgdGhpcy5zaXplICs9IGNvbnRlbnRbaV0ubm9kZVNpemU7XG4gICAgfVxuICAgIC8qKlxuICAgIEludm9rZSBhIGNhbGxiYWNrIGZvciBhbGwgZGVzY2VuZGFudCBub2RlcyBiZXR3ZWVuIHRoZSBnaXZlbiB0d29cbiAgICBwb3NpdGlvbnMgKHJlbGF0aXZlIHRvIHN0YXJ0IG9mIHRoaXMgZnJhZ21lbnQpLiBEb2Vzbid0IGRlc2NlbmRcbiAgICBpbnRvIGEgbm9kZSB3aGVuIHRoZSBjYWxsYmFjayByZXR1cm5zIGBmYWxzZWAuXG4gICAgKi9cbiAgICBub2Rlc0JldHdlZW4oZnJvbSwgdG8sIGYsIG5vZGVTdGFydCA9IDAsIHBhcmVudCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgcG9zID0gMDsgcG9zIDwgdG87IGkrKykge1xuICAgICAgICAgICAgbGV0IGNoaWxkID0gdGhpcy5jb250ZW50W2ldLCBlbmQgPSBwb3MgKyBjaGlsZC5ub2RlU2l6ZTtcbiAgICAgICAgICAgIGlmIChlbmQgPiBmcm9tICYmIGYoY2hpbGQsIG5vZGVTdGFydCArIHBvcywgcGFyZW50IHx8IG51bGwsIGkpICE9PSBmYWxzZSAmJiBjaGlsZC5jb250ZW50LnNpemUpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnQgPSBwb3MgKyAxO1xuICAgICAgICAgICAgICAgIGNoaWxkLm5vZGVzQmV0d2VlbihNYXRoLm1heCgwLCBmcm9tIC0gc3RhcnQpLCBNYXRoLm1pbihjaGlsZC5jb250ZW50LnNpemUsIHRvIC0gc3RhcnQpLCBmLCBub2RlU3RhcnQgKyBzdGFydCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb3MgPSBlbmQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgQ2FsbCB0aGUgZ2l2ZW4gY2FsbGJhY2sgZm9yIGV2ZXJ5IGRlc2NlbmRhbnQgbm9kZS4gYHBvc2Agd2lsbCBiZVxuICAgIHJlbGF0aXZlIHRvIHRoZSBzdGFydCBvZiB0aGUgZnJhZ21lbnQuIFRoZSBjYWxsYmFjayBtYXkgcmV0dXJuXG4gICAgYGZhbHNlYCB0byBwcmV2ZW50IHRyYXZlcnNhbCBvZiBhIGdpdmVuIG5vZGUncyBjaGlsZHJlbi5cbiAgICAqL1xuICAgIGRlc2NlbmRhbnRzKGYpIHtcbiAgICAgICAgdGhpcy5ub2Rlc0JldHdlZW4oMCwgdGhpcy5zaXplLCBmKTtcbiAgICB9XG4gICAgLyoqXG4gICAgRXh0cmFjdCB0aGUgdGV4dCBiZXR3ZWVuIGBmcm9tYCBhbmQgYHRvYC4gU2VlIHRoZSBzYW1lIG1ldGhvZCBvblxuICAgIFtgTm9kZWBdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5Ob2RlLnRleHRCZXR3ZWVuKS5cbiAgICAqL1xuICAgIHRleHRCZXR3ZWVuKGZyb20sIHRvLCBibG9ja1NlcGFyYXRvciwgbGVhZlRleHQpIHtcbiAgICAgICAgbGV0IHRleHQgPSBcIlwiLCBmaXJzdCA9IHRydWU7XG4gICAgICAgIHRoaXMubm9kZXNCZXR3ZWVuKGZyb20sIHRvLCAobm9kZSwgcG9zKSA9PiB7XG4gICAgICAgICAgICBsZXQgbm9kZVRleHQgPSBub2RlLmlzVGV4dCA/IG5vZGUudGV4dC5zbGljZShNYXRoLm1heChmcm9tLCBwb3MpIC0gcG9zLCB0byAtIHBvcylcbiAgICAgICAgICAgICAgICA6ICFub2RlLmlzTGVhZiA/IFwiXCJcbiAgICAgICAgICAgICAgICAgICAgOiBsZWFmVGV4dCA/ICh0eXBlb2YgbGVhZlRleHQgPT09IFwiZnVuY3Rpb25cIiA/IGxlYWZUZXh0KG5vZGUpIDogbGVhZlRleHQpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG5vZGUudHlwZS5zcGVjLmxlYWZUZXh0ID8gbm9kZS50eXBlLnNwZWMubGVhZlRleHQobm9kZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFwiXCI7XG4gICAgICAgICAgICBpZiAobm9kZS5pc0Jsb2NrICYmIChub2RlLmlzTGVhZiAmJiBub2RlVGV4dCB8fCBub2RlLmlzVGV4dGJsb2NrKSAmJiBibG9ja1NlcGFyYXRvcikge1xuICAgICAgICAgICAgICAgIGlmIChmaXJzdClcbiAgICAgICAgICAgICAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRleHQgKz0gYmxvY2tTZXBhcmF0b3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZXh0ICs9IG5vZGVUZXh0O1xuICAgICAgICB9LCAwKTtcbiAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfVxuICAgIC8qKlxuICAgIENyZWF0ZSBhIG5ldyBmcmFnbWVudCBjb250YWluaW5nIHRoZSBjb21iaW5lZCBjb250ZW50IG9mIHRoaXNcbiAgICBmcmFnbWVudCBhbmQgdGhlIG90aGVyLlxuICAgICovXG4gICAgYXBwZW5kKG90aGVyKSB7XG4gICAgICAgIGlmICghb3RoZXIuc2l6ZSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICBpZiAoIXRoaXMuc2l6ZSlcbiAgICAgICAgICAgIHJldHVybiBvdGhlcjtcbiAgICAgICAgbGV0IGxhc3QgPSB0aGlzLmxhc3RDaGlsZCwgZmlyc3QgPSBvdGhlci5maXJzdENoaWxkLCBjb250ZW50ID0gdGhpcy5jb250ZW50LnNsaWNlKCksIGkgPSAwO1xuICAgICAgICBpZiAobGFzdC5pc1RleHQgJiYgbGFzdC5zYW1lTWFya3VwKGZpcnN0KSkge1xuICAgICAgICAgICAgY29udGVudFtjb250ZW50Lmxlbmd0aCAtIDFdID0gbGFzdC53aXRoVGV4dChsYXN0LnRleHQgKyBmaXJzdC50ZXh0KTtcbiAgICAgICAgICAgIGkgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoOyBpIDwgb3RoZXIuY29udGVudC5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIGNvbnRlbnQucHVzaChvdGhlci5jb250ZW50W2ldKTtcbiAgICAgICAgcmV0dXJuIG5ldyBGcmFnbWVudChjb250ZW50LCB0aGlzLnNpemUgKyBvdGhlci5zaXplKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3V0IG91dCB0aGUgc3ViLWZyYWdtZW50IGJldHdlZW4gdGhlIHR3byBnaXZlbiBwb3NpdGlvbnMuXG4gICAgKi9cbiAgICBjdXQoZnJvbSwgdG8gPSB0aGlzLnNpemUpIHtcbiAgICAgICAgaWYgKGZyb20gPT0gMCAmJiB0byA9PSB0aGlzLnNpemUpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdLCBzaXplID0gMDtcbiAgICAgICAgaWYgKHRvID4gZnJvbSlcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBwb3MgPSAwOyBwb3MgPCB0bzsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNoaWxkID0gdGhpcy5jb250ZW50W2ldLCBlbmQgPSBwb3MgKyBjaGlsZC5ub2RlU2l6ZTtcbiAgICAgICAgICAgICAgICBpZiAoZW5kID4gZnJvbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9zIDwgZnJvbSB8fCBlbmQgPiB0bykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLmlzVGV4dClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGNoaWxkLmN1dChNYXRoLm1heCgwLCBmcm9tIC0gcG9zKSwgTWF0aC5taW4oY2hpbGQudGV4dC5sZW5ndGgsIHRvIC0gcG9zKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBjaGlsZC5jdXQoTWF0aC5tYXgoMCwgZnJvbSAtIHBvcyAtIDEpLCBNYXRoLm1pbihjaGlsZC5jb250ZW50LnNpemUsIHRvIC0gcG9zIC0gMSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgc2l6ZSArPSBjaGlsZC5ub2RlU2l6ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcG9zID0gZW5kO1xuICAgICAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEZyYWdtZW50KHJlc3VsdCwgc2l6ZSk7XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgY3V0QnlJbmRleChmcm9tLCB0bykge1xuICAgICAgICBpZiAoZnJvbSA9PSB0bylcbiAgICAgICAgICAgIHJldHVybiBGcmFnbWVudC5lbXB0eTtcbiAgICAgICAgaWYgKGZyb20gPT0gMCAmJiB0byA9PSB0aGlzLmNvbnRlbnQubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIHJldHVybiBuZXcgRnJhZ21lbnQodGhpcy5jb250ZW50LnNsaWNlKGZyb20sIHRvKSk7XG4gICAgfVxuICAgIC8qKlxuICAgIENyZWF0ZSBhIG5ldyBmcmFnbWVudCBpbiB3aGljaCB0aGUgbm9kZSBhdCB0aGUgZ2l2ZW4gaW5kZXggaXNcbiAgICByZXBsYWNlZCBieSB0aGUgZ2l2ZW4gbm9kZS5cbiAgICAqL1xuICAgIHJlcGxhY2VDaGlsZChpbmRleCwgbm9kZSkge1xuICAgICAgICBsZXQgY3VycmVudCA9IHRoaXMuY29udGVudFtpbmRleF07XG4gICAgICAgIGlmIChjdXJyZW50ID09IG5vZGUpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgbGV0IGNvcHkgPSB0aGlzLmNvbnRlbnQuc2xpY2UoKTtcbiAgICAgICAgbGV0IHNpemUgPSB0aGlzLnNpemUgKyBub2RlLm5vZGVTaXplIC0gY3VycmVudC5ub2RlU2l6ZTtcbiAgICAgICAgY29weVtpbmRleF0gPSBub2RlO1xuICAgICAgICByZXR1cm4gbmV3IEZyYWdtZW50KGNvcHksIHNpemUpO1xuICAgIH1cbiAgICAvKipcbiAgICBDcmVhdGUgYSBuZXcgZnJhZ21lbnQgYnkgcHJlcGVuZGluZyB0aGUgZ2l2ZW4gbm9kZSB0byB0aGlzXG4gICAgZnJhZ21lbnQuXG4gICAgKi9cbiAgICBhZGRUb1N0YXJ0KG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGcmFnbWVudChbbm9kZV0uY29uY2F0KHRoaXMuY29udGVudCksIHRoaXMuc2l6ZSArIG5vZGUubm9kZVNpemUpO1xuICAgIH1cbiAgICAvKipcbiAgICBDcmVhdGUgYSBuZXcgZnJhZ21lbnQgYnkgYXBwZW5kaW5nIHRoZSBnaXZlbiBub2RlIHRvIHRoaXNcbiAgICBmcmFnbWVudC5cbiAgICAqL1xuICAgIGFkZFRvRW5kKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGcmFnbWVudCh0aGlzLmNvbnRlbnQuY29uY2F0KG5vZGUpLCB0aGlzLnNpemUgKyBub2RlLm5vZGVTaXplKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ29tcGFyZSB0aGlzIGZyYWdtZW50IHRvIGFub3RoZXIgb25lLlxuICAgICovXG4gICAgZXEob3RoZXIpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGVudC5sZW5ndGggIT0gb3RoZXIuY29udGVudC5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jb250ZW50Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaWYgKCF0aGlzLmNvbnRlbnRbaV0uZXEob3RoZXIuY29udGVudFtpXSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgVGhlIGZpcnN0IGNoaWxkIG9mIHRoZSBmcmFnbWVudCwgb3IgYG51bGxgIGlmIGl0IGlzIGVtcHR5LlxuICAgICovXG4gICAgZ2V0IGZpcnN0Q2hpbGQoKSB7IHJldHVybiB0aGlzLmNvbnRlbnQubGVuZ3RoID8gdGhpcy5jb250ZW50WzBdIDogbnVsbDsgfVxuICAgIC8qKlxuICAgIFRoZSBsYXN0IGNoaWxkIG9mIHRoZSBmcmFnbWVudCwgb3IgYG51bGxgIGlmIGl0IGlzIGVtcHR5LlxuICAgICovXG4gICAgZ2V0IGxhc3RDaGlsZCgpIHsgcmV0dXJuIHRoaXMuY29udGVudC5sZW5ndGggPyB0aGlzLmNvbnRlbnRbdGhpcy5jb250ZW50Lmxlbmd0aCAtIDFdIDogbnVsbDsgfVxuICAgIC8qKlxuICAgIFRoZSBudW1iZXIgb2YgY2hpbGQgbm9kZXMgaW4gdGhpcyBmcmFnbWVudC5cbiAgICAqL1xuICAgIGdldCBjaGlsZENvdW50KCkgeyByZXR1cm4gdGhpcy5jb250ZW50Lmxlbmd0aDsgfVxuICAgIC8qKlxuICAgIEdldCB0aGUgY2hpbGQgbm9kZSBhdCB0aGUgZ2l2ZW4gaW5kZXguIFJhaXNlIGFuIGVycm9yIHdoZW4gdGhlXG4gICAgaW5kZXggaXMgb3V0IG9mIHJhbmdlLlxuICAgICovXG4gICAgY2hpbGQoaW5kZXgpIHtcbiAgICAgICAgbGV0IGZvdW5kID0gdGhpcy5jb250ZW50W2luZGV4XTtcbiAgICAgICAgaWYgKCFmb3VuZClcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiSW5kZXggXCIgKyBpbmRleCArIFwiIG91dCBvZiByYW5nZSBmb3IgXCIgKyB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgIH1cbiAgICAvKipcbiAgICBHZXQgdGhlIGNoaWxkIG5vZGUgYXQgdGhlIGdpdmVuIGluZGV4LCBpZiBpdCBleGlzdHMuXG4gICAgKi9cbiAgICBtYXliZUNoaWxkKGluZGV4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnRbaW5kZXhdIHx8IG51bGw7XG4gICAgfVxuICAgIC8qKlxuICAgIENhbGwgYGZgIGZvciBldmVyeSBjaGlsZCBub2RlLCBwYXNzaW5nIHRoZSBub2RlLCBpdHMgb2Zmc2V0XG4gICAgaW50byB0aGlzIHBhcmVudCBub2RlLCBhbmQgaXRzIGluZGV4LlxuICAgICovXG4gICAgZm9yRWFjaChmKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBwID0gMDsgaSA8IHRoaXMuY29udGVudC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IGNoaWxkID0gdGhpcy5jb250ZW50W2ldO1xuICAgICAgICAgICAgZihjaGlsZCwgcCwgaSk7XG4gICAgICAgICAgICBwICs9IGNoaWxkLm5vZGVTaXplO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgIEZpbmQgdGhlIGZpcnN0IHBvc2l0aW9uIGF0IHdoaWNoIHRoaXMgZnJhZ21lbnQgYW5kIGFub3RoZXJcbiAgICBmcmFnbWVudCBkaWZmZXIsIG9yIGBudWxsYCBpZiB0aGV5IGFyZSB0aGUgc2FtZS5cbiAgICAqL1xuICAgIGZpbmREaWZmU3RhcnQob3RoZXIsIHBvcyA9IDApIHtcbiAgICAgICAgcmV0dXJuIGZpbmREaWZmU3RhcnQodGhpcywgb3RoZXIsIHBvcyk7XG4gICAgfVxuICAgIC8qKlxuICAgIEZpbmQgdGhlIGZpcnN0IHBvc2l0aW9uLCBzZWFyY2hpbmcgZnJvbSB0aGUgZW5kLCBhdCB3aGljaCB0aGlzXG4gICAgZnJhZ21lbnQgYW5kIHRoZSBnaXZlbiBmcmFnbWVudCBkaWZmZXIsIG9yIGBudWxsYCBpZiB0aGV5IGFyZVxuICAgIHRoZSBzYW1lLiBTaW5jZSB0aGlzIHBvc2l0aW9uIHdpbGwgbm90IGJlIHRoZSBzYW1lIGluIGJvdGhcbiAgICBub2RlcywgYW4gb2JqZWN0IHdpdGggdHdvIHNlcGFyYXRlIHBvc2l0aW9ucyBpcyByZXR1cm5lZC5cbiAgICAqL1xuICAgIGZpbmREaWZmRW5kKG90aGVyLCBwb3MgPSB0aGlzLnNpemUsIG90aGVyUG9zID0gb3RoZXIuc2l6ZSkge1xuICAgICAgICByZXR1cm4gZmluZERpZmZFbmQodGhpcywgb3RoZXIsIHBvcywgb3RoZXJQb3MpO1xuICAgIH1cbiAgICAvKipcbiAgICBGaW5kIHRoZSBpbmRleCBhbmQgaW5uZXIgb2Zmc2V0IGNvcnJlc3BvbmRpbmcgdG8gYSBnaXZlbiByZWxhdGl2ZVxuICAgIHBvc2l0aW9uIGluIHRoaXMgZnJhZ21lbnQuIFRoZSByZXN1bHQgb2JqZWN0IHdpbGwgYmUgcmV1c2VkXG4gICAgKG92ZXJ3cml0dGVuKSB0aGUgbmV4dCB0aW1lIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQuIEBpbnRlcm5hbFxuICAgICovXG4gICAgZmluZEluZGV4KHBvcywgcm91bmQgPSAtMSkge1xuICAgICAgICBpZiAocG9zID09IDApXG4gICAgICAgICAgICByZXR1cm4gcmV0SW5kZXgoMCwgcG9zKTtcbiAgICAgICAgaWYgKHBvcyA9PSB0aGlzLnNpemUpXG4gICAgICAgICAgICByZXR1cm4gcmV0SW5kZXgodGhpcy5jb250ZW50Lmxlbmd0aCwgcG9zKTtcbiAgICAgICAgaWYgKHBvcyA+IHRoaXMuc2l6ZSB8fCBwb3MgPCAwKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYFBvc2l0aW9uICR7cG9zfSBvdXRzaWRlIG9mIGZyYWdtZW50ICgke3RoaXN9KWApO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgY3VyUG9zID0gMDs7IGkrKykge1xuICAgICAgICAgICAgbGV0IGN1ciA9IHRoaXMuY2hpbGQoaSksIGVuZCA9IGN1clBvcyArIGN1ci5ub2RlU2l6ZTtcbiAgICAgICAgICAgIGlmIChlbmQgPj0gcG9zKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVuZCA9PSBwb3MgfHwgcm91bmQgPiAwKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0SW5kZXgoaSArIDEsIGVuZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldEluZGV4KGksIGN1clBvcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJQb3MgPSBlbmQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgUmV0dXJuIGEgZGVidWdnaW5nIHN0cmluZyB0aGF0IGRlc2NyaWJlcyB0aGlzIGZyYWdtZW50LlxuICAgICovXG4gICAgdG9TdHJpbmcoKSB7IHJldHVybiBcIjxcIiArIHRoaXMudG9TdHJpbmdJbm5lcigpICsgXCI+XCI7IH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHRvU3RyaW5nSW5uZXIoKSB7IHJldHVybiB0aGlzLmNvbnRlbnQuam9pbihcIiwgXCIpOyB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgSlNPTi1zZXJpYWxpemVhYmxlIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgZnJhZ21lbnQuXG4gICAgKi9cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnQubGVuZ3RoID8gdGhpcy5jb250ZW50Lm1hcChuID0+IG4udG9KU09OKCkpIDogbnVsbDtcbiAgICB9XG4gICAgLyoqXG4gICAgRGVzZXJpYWxpemUgYSBmcmFnbWVudCBmcm9tIGl0cyBKU09OIHJlcHJlc2VudGF0aW9uLlxuICAgICovXG4gICAgc3RhdGljIGZyb21KU09OKHNjaGVtYSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKCF2YWx1ZSlcbiAgICAgICAgICAgIHJldHVybiBGcmFnbWVudC5lbXB0eTtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiSW52YWxpZCBpbnB1dCBmb3IgRnJhZ21lbnQuZnJvbUpTT05cIik7XG4gICAgICAgIHJldHVybiBuZXcgRnJhZ21lbnQodmFsdWUubWFwKHNjaGVtYS5ub2RlRnJvbUpTT04pKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQnVpbGQgYSBmcmFnbWVudCBmcm9tIGFuIGFycmF5IG9mIG5vZGVzLiBFbnN1cmVzIHRoYXQgYWRqYWNlbnRcbiAgICB0ZXh0IG5vZGVzIHdpdGggdGhlIHNhbWUgbWFya3MgYXJlIGpvaW5lZCB0b2dldGhlci5cbiAgICAqL1xuICAgIHN0YXRpYyBmcm9tQXJyYXkoYXJyYXkpIHtcbiAgICAgICAgaWYgKCFhcnJheS5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gRnJhZ21lbnQuZW1wdHk7XG4gICAgICAgIGxldCBqb2luZWQsIHNpemUgPSAwO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgbm9kZSA9IGFycmF5W2ldO1xuICAgICAgICAgICAgc2l6ZSArPSBub2RlLm5vZGVTaXplO1xuICAgICAgICAgICAgaWYgKGkgJiYgbm9kZS5pc1RleHQgJiYgYXJyYXlbaSAtIDFdLnNhbWVNYXJrdXAobm9kZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWpvaW5lZClcbiAgICAgICAgICAgICAgICAgICAgam9pbmVkID0gYXJyYXkuc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICAgICAgam9pbmVkW2pvaW5lZC5sZW5ndGggLSAxXSA9IG5vZGVcbiAgICAgICAgICAgICAgICAgICAgLndpdGhUZXh0KGpvaW5lZFtqb2luZWQubGVuZ3RoIC0gMV0udGV4dCArIG5vZGUudGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChqb2luZWQpIHtcbiAgICAgICAgICAgICAgICBqb2luZWQucHVzaChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEZyYWdtZW50KGpvaW5lZCB8fCBhcnJheSwgc2l6ZSk7XG4gICAgfVxuICAgIC8qKlxuICAgIENyZWF0ZSBhIGZyYWdtZW50IGZyb20gc29tZXRoaW5nIHRoYXQgY2FuIGJlIGludGVycHJldGVkIGFzIGFcbiAgICBzZXQgb2Ygbm9kZXMuIEZvciBgbnVsbGAsIGl0IHJldHVybnMgdGhlIGVtcHR5IGZyYWdtZW50LiBGb3IgYVxuICAgIGZyYWdtZW50LCB0aGUgZnJhZ21lbnQgaXRzZWxmLiBGb3IgYSBub2RlIG9yIGFycmF5IG9mIG5vZGVzLCBhXG4gICAgZnJhZ21lbnQgY29udGFpbmluZyB0aG9zZSBub2Rlcy5cbiAgICAqL1xuICAgIHN0YXRpYyBmcm9tKG5vZGVzKSB7XG4gICAgICAgIGlmICghbm9kZXMpXG4gICAgICAgICAgICByZXR1cm4gRnJhZ21lbnQuZW1wdHk7XG4gICAgICAgIGlmIChub2RlcyBpbnN0YW5jZW9mIEZyYWdtZW50KVxuICAgICAgICAgICAgcmV0dXJuIG5vZGVzO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShub2RlcykpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mcm9tQXJyYXkobm9kZXMpO1xuICAgICAgICBpZiAobm9kZXMuYXR0cnMpXG4gICAgICAgICAgICByZXR1cm4gbmV3IEZyYWdtZW50KFtub2Rlc10sIG5vZGVzLm5vZGVTaXplKTtcbiAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJDYW4gbm90IGNvbnZlcnQgXCIgKyBub2RlcyArIFwiIHRvIGEgRnJhZ21lbnRcIiArXG4gICAgICAgICAgICAobm9kZXMubm9kZXNCZXR3ZWVuID8gXCIgKGxvb2tzIGxpa2UgbXVsdGlwbGUgdmVyc2lvbnMgb2YgcHJvc2VtaXJyb3ItbW9kZWwgd2VyZSBsb2FkZWQpXCIgOiBcIlwiKSk7XG4gICAgfVxufVxuLyoqXG5BbiBlbXB0eSBmcmFnbWVudC4gSW50ZW5kZWQgdG8gYmUgcmV1c2VkIHdoZW5ldmVyIGEgbm9kZSBkb2Vzbid0XG5jb250YWluIGFueXRoaW5nIChyYXRoZXIgdGhhbiBhbGxvY2F0aW5nIGEgbmV3IGVtcHR5IGZyYWdtZW50IGZvclxuZWFjaCBsZWFmIG5vZGUpLlxuKi9cbkZyYWdtZW50LmVtcHR5ID0gbmV3IEZyYWdtZW50KFtdLCAwKTtcbmNvbnN0IGZvdW5kID0geyBpbmRleDogMCwgb2Zmc2V0OiAwIH07XG5mdW5jdGlvbiByZXRJbmRleChpbmRleCwgb2Zmc2V0KSB7XG4gICAgZm91bmQuaW5kZXggPSBpbmRleDtcbiAgICBmb3VuZC5vZmZzZXQgPSBvZmZzZXQ7XG4gICAgcmV0dXJuIGZvdW5kO1xufVxuXG5mdW5jdGlvbiBjb21wYXJlRGVlcChhLCBiKSB7XG4gICAgaWYgKGEgPT09IGIpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIGlmICghKGEgJiYgdHlwZW9mIGEgPT0gXCJvYmplY3RcIikgfHxcbiAgICAgICAgIShiICYmIHR5cGVvZiBiID09IFwib2JqZWN0XCIpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgbGV0IGFycmF5ID0gQXJyYXkuaXNBcnJheShhKTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShiKSAhPSBhcnJheSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChhcnJheSkge1xuICAgICAgICBpZiAoYS5sZW5ndGggIT0gYi5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIGlmICghY29tcGFyZURlZXAoYVtpXSwgYltpXSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZm9yIChsZXQgcCBpbiBhKVxuICAgICAgICAgICAgaWYgKCEocCBpbiBiKSB8fCAhY29tcGFyZURlZXAoYVtwXSwgYltwXSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBmb3IgKGxldCBwIGluIGIpXG4gICAgICAgICAgICBpZiAoIShwIGluIGEpKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuQSBtYXJrIGlzIGEgcGllY2Ugb2YgaW5mb3JtYXRpb24gdGhhdCBjYW4gYmUgYXR0YWNoZWQgdG8gYSBub2RlLFxuc3VjaCBhcyBpdCBiZWluZyBlbXBoYXNpemVkLCBpbiBjb2RlIGZvbnQsIG9yIGEgbGluay4gSXQgaGFzIGFcbnR5cGUgYW5kIG9wdGlvbmFsbHkgYSBzZXQgb2YgYXR0cmlidXRlcyB0aGF0IHByb3ZpZGUgZnVydGhlclxuaW5mb3JtYXRpb24gKHN1Y2ggYXMgdGhlIHRhcmdldCBvZiB0aGUgbGluaykuIE1hcmtzIGFyZSBjcmVhdGVkXG50aHJvdWdoIGEgYFNjaGVtYWAsIHdoaWNoIGNvbnRyb2xzIHdoaWNoIHR5cGVzIGV4aXN0IGFuZCB3aGljaFxuYXR0cmlidXRlcyB0aGV5IGhhdmUuXG4qL1xuY2xhc3MgTWFyayB7XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAvKipcbiAgICBUaGUgdHlwZSBvZiB0aGlzIG1hcmsuXG4gICAgKi9cbiAgICB0eXBlLCBcbiAgICAvKipcbiAgICBUaGUgYXR0cmlidXRlcyBhc3NvY2lhdGVkIHdpdGggdGhpcyBtYXJrLlxuICAgICovXG4gICAgYXR0cnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgICAgdGhpcy5hdHRycyA9IGF0dHJzO1xuICAgIH1cbiAgICAvKipcbiAgICBHaXZlbiBhIHNldCBvZiBtYXJrcywgY3JlYXRlIGEgbmV3IHNldCB3aGljaCBjb250YWlucyB0aGlzIG9uZSBhc1xuICAgIHdlbGwsIGluIHRoZSByaWdodCBwb3NpdGlvbi4gSWYgdGhpcyBtYXJrIGlzIGFscmVhZHkgaW4gdGhlIHNldCxcbiAgICB0aGUgc2V0IGl0c2VsZiBpcyByZXR1cm5lZC4gSWYgYW55IG1hcmtzIHRoYXQgYXJlIHNldCB0byBiZVxuICAgIFtleGNsdXNpdmVdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5NYXJrU3BlYy5leGNsdWRlcykgd2l0aCB0aGlzIG1hcmsgYXJlIHByZXNlbnQsXG4gICAgdGhvc2UgYXJlIHJlcGxhY2VkIGJ5IHRoaXMgb25lLlxuICAgICovXG4gICAgYWRkVG9TZXQoc2V0KSB7XG4gICAgICAgIGxldCBjb3B5LCBwbGFjZWQgPSBmYWxzZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBvdGhlciA9IHNldFtpXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmVxKG90aGVyKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0O1xuICAgICAgICAgICAgaWYgKHRoaXMudHlwZS5leGNsdWRlcyhvdGhlci50eXBlKSkge1xuICAgICAgICAgICAgICAgIGlmICghY29weSlcbiAgICAgICAgICAgICAgICAgICAgY29weSA9IHNldC5zbGljZSgwLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG90aGVyLnR5cGUuZXhjbHVkZXModGhpcy50eXBlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIXBsYWNlZCAmJiBvdGhlci50eXBlLnJhbmsgPiB0aGlzLnR5cGUucmFuaykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNvcHkpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3B5ID0gc2V0LnNsaWNlKDAsIGkpO1xuICAgICAgICAgICAgICAgICAgICBjb3B5LnB1c2godGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjb3B5KVxuICAgICAgICAgICAgICAgICAgICBjb3B5LnB1c2gob3RoZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghY29weSlcbiAgICAgICAgICAgIGNvcHkgPSBzZXQuc2xpY2UoKTtcbiAgICAgICAgaWYgKCFwbGFjZWQpXG4gICAgICAgICAgICBjb3B5LnB1c2godGhpcyk7XG4gICAgICAgIHJldHVybiBjb3B5O1xuICAgIH1cbiAgICAvKipcbiAgICBSZW1vdmUgdGhpcyBtYXJrIGZyb20gdGhlIGdpdmVuIHNldCwgcmV0dXJuaW5nIGEgbmV3IHNldC4gSWYgdGhpc1xuICAgIG1hcmsgaXMgbm90IGluIHRoZSBzZXQsIHRoZSBzZXQgaXRzZWxmIGlzIHJldHVybmVkLlxuICAgICovXG4gICAgcmVtb3ZlRnJvbVNldChzZXQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZXQubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBpZiAodGhpcy5lcShzZXRbaV0pKVxuICAgICAgICAgICAgICAgIHJldHVybiBzZXQuc2xpY2UoMCwgaSkuY29uY2F0KHNldC5zbGljZShpICsgMSkpO1xuICAgICAgICByZXR1cm4gc2V0O1xuICAgIH1cbiAgICAvKipcbiAgICBUZXN0IHdoZXRoZXIgdGhpcyBtYXJrIGlzIGluIHRoZSBnaXZlbiBzZXQgb2YgbWFya3MuXG4gICAgKi9cbiAgICBpc0luU2V0KHNldCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNldC5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIGlmICh0aGlzLmVxKHNldFtpXSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLyoqXG4gICAgVGVzdCB3aGV0aGVyIHRoaXMgbWFyayBoYXMgdGhlIHNhbWUgdHlwZSBhbmQgYXR0cmlidXRlcyBhc1xuICAgIGFub3RoZXIgbWFyay5cbiAgICAqL1xuICAgIGVxKG90aGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzID09IG90aGVyIHx8XG4gICAgICAgICAgICAodGhpcy50eXBlID09IG90aGVyLnR5cGUgJiYgY29tcGFyZURlZXAodGhpcy5hdHRycywgb3RoZXIuYXR0cnMpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ29udmVydCB0aGlzIG1hcmsgdG8gYSBKU09OLXNlcmlhbGl6ZWFibGUgcmVwcmVzZW50YXRpb24uXG4gICAgKi9cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIGxldCBvYmogPSB7IHR5cGU6IHRoaXMudHlwZS5uYW1lIH07XG4gICAgICAgIGZvciAobGV0IF8gaW4gdGhpcy5hdHRycykge1xuICAgICAgICAgICAgb2JqLmF0dHJzID0gdGhpcy5hdHRycztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuICAgIC8qKlxuICAgIERlc2VyaWFsaXplIGEgbWFyayBmcm9tIEpTT04uXG4gICAgKi9cbiAgICBzdGF0aWMgZnJvbUpTT04oc2NoZW1hLCBqc29uKSB7XG4gICAgICAgIGlmICghanNvbilcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiSW52YWxpZCBpbnB1dCBmb3IgTWFyay5mcm9tSlNPTlwiKTtcbiAgICAgICAgbGV0IHR5cGUgPSBzY2hlbWEubWFya3NbanNvbi50eXBlXTtcbiAgICAgICAgaWYgKCF0eXBlKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYFRoZXJlIGlzIG5vIG1hcmsgdHlwZSAke2pzb24udHlwZX0gaW4gdGhpcyBzY2hlbWFgKTtcbiAgICAgICAgbGV0IG1hcmsgPSB0eXBlLmNyZWF0ZShqc29uLmF0dHJzKTtcbiAgICAgICAgdHlwZS5jaGVja0F0dHJzKG1hcmsuYXR0cnMpO1xuICAgICAgICByZXR1cm4gbWFyaztcbiAgICB9XG4gICAgLyoqXG4gICAgVGVzdCB3aGV0aGVyIHR3byBzZXRzIG9mIG1hcmtzIGFyZSBpZGVudGljYWwuXG4gICAgKi9cbiAgICBzdGF0aWMgc2FtZVNldChhLCBiKSB7XG4gICAgICAgIGlmIChhID09IGIpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKGEubGVuZ3RoICE9IGIubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBpZiAoIWFbaV0uZXEoYltpXSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgcHJvcGVybHkgc29ydGVkIG1hcmsgc2V0IGZyb20gbnVsbCwgYSBzaW5nbGUgbWFyaywgb3IgYW5cbiAgICB1bnNvcnRlZCBhcnJheSBvZiBtYXJrcy5cbiAgICAqL1xuICAgIHN0YXRpYyBzZXRGcm9tKG1hcmtzKSB7XG4gICAgICAgIGlmICghbWFya3MgfHwgQXJyYXkuaXNBcnJheShtYXJrcykgJiYgbWFya3MubGVuZ3RoID09IDApXG4gICAgICAgICAgICByZXR1cm4gTWFyay5ub25lO1xuICAgICAgICBpZiAobWFya3MgaW5zdGFuY2VvZiBNYXJrKVxuICAgICAgICAgICAgcmV0dXJuIFttYXJrc107XG4gICAgICAgIGxldCBjb3B5ID0gbWFya3Muc2xpY2UoKTtcbiAgICAgICAgY29weS5zb3J0KChhLCBiKSA9PiBhLnR5cGUucmFuayAtIGIudHlwZS5yYW5rKTtcbiAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgfVxufVxuLyoqXG5UaGUgZW1wdHkgc2V0IG9mIG1hcmtzLlxuKi9cbk1hcmsubm9uZSA9IFtdO1xuXG4vKipcbkVycm9yIHR5cGUgcmFpc2VkIGJ5IFtgTm9kZS5yZXBsYWNlYF0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGUucmVwbGFjZSkgd2hlblxuZ2l2ZW4gYW4gaW52YWxpZCByZXBsYWNlbWVudC5cbiovXG5jbGFzcyBSZXBsYWNlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG59XG4vKlxuUmVwbGFjZUVycm9yID0gZnVuY3Rpb24odGhpczogYW55LCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgbGV0IGVyciA9IEVycm9yLmNhbGwodGhpcywgbWVzc2FnZSlcbiAgOyhlcnIgYXMgYW55KS5fX3Byb3RvX18gPSBSZXBsYWNlRXJyb3IucHJvdG90eXBlXG4gIHJldHVybiBlcnJcbn0gYXMgYW55XG5cblJlcGxhY2VFcnJvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSlcblJlcGxhY2VFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBSZXBsYWNlRXJyb3JcblJlcGxhY2VFcnJvci5wcm90b3R5cGUubmFtZSA9IFwiUmVwbGFjZUVycm9yXCJcbiovXG4vKipcbkEgc2xpY2UgcmVwcmVzZW50cyBhIHBpZWNlIGN1dCBvdXQgb2YgYSBsYXJnZXIgZG9jdW1lbnQuIEl0XG5zdG9yZXMgbm90IG9ubHkgYSBmcmFnbWVudCwgYnV0IGFsc28gdGhlIGRlcHRoIHVwIHRvIHdoaWNoIG5vZGVzIG9uXG5ib3RoIHNpZGUgYXJlIFx1MjAxOG9wZW5cdTIwMTkgKGN1dCB0aHJvdWdoKS5cbiovXG5jbGFzcyBTbGljZSB7XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgc2xpY2UuIFdoZW4gc3BlY2lmeWluZyBhIG5vbi16ZXJvIG9wZW4gZGVwdGgsIHlvdSBtdXN0XG4gICAgbWFrZSBzdXJlIHRoYXQgdGhlcmUgYXJlIG5vZGVzIG9mIGF0IGxlYXN0IHRoYXQgZGVwdGggYXQgdGhlXG4gICAgYXBwcm9wcmlhdGUgc2lkZSBvZiB0aGUgZnJhZ21lbnRcdTIwMTRpLmUuIGlmIHRoZSBmcmFnbWVudCBpcyBhblxuICAgIGVtcHR5IHBhcmFncmFwaCBub2RlLCBgb3BlblN0YXJ0YCBhbmQgYG9wZW5FbmRgIGNhbid0IGJlIGdyZWF0ZXJcbiAgICB0aGFuIDEuXG4gICAgXG4gICAgSXQgaXMgbm90IG5lY2Vzc2FyeSBmb3IgdGhlIGNvbnRlbnQgb2Ygb3BlbiBub2RlcyB0byBjb25mb3JtIHRvXG4gICAgdGhlIHNjaGVtYSdzIGNvbnRlbnQgY29uc3RyYWludHMsIHRob3VnaCBpdCBzaG91bGQgYmUgYSB2YWxpZFxuICAgIHN0YXJ0L2VuZC9taWRkbGUgZm9yIHN1Y2ggYSBub2RlLCBkZXBlbmRpbmcgb24gd2hpY2ggc2lkZXMgYXJlXG4gICAgb3Blbi5cbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgIFRoZSBzbGljZSdzIGNvbnRlbnQuXG4gICAgKi9cbiAgICBjb250ZW50LCBcbiAgICAvKipcbiAgICBUaGUgb3BlbiBkZXB0aCBhdCB0aGUgc3RhcnQgb2YgdGhlIGZyYWdtZW50LlxuICAgICovXG4gICAgb3BlblN0YXJ0LCBcbiAgICAvKipcbiAgICBUaGUgb3BlbiBkZXB0aCBhdCB0aGUgZW5kLlxuICAgICovXG4gICAgb3BlbkVuZCkge1xuICAgICAgICB0aGlzLmNvbnRlbnQgPSBjb250ZW50O1xuICAgICAgICB0aGlzLm9wZW5TdGFydCA9IG9wZW5TdGFydDtcbiAgICAgICAgdGhpcy5vcGVuRW5kID0gb3BlbkVuZDtcbiAgICB9XG4gICAgLyoqXG4gICAgVGhlIHNpemUgdGhpcyBzbGljZSB3b3VsZCBhZGQgd2hlbiBpbnNlcnRlZCBpbnRvIGEgZG9jdW1lbnQuXG4gICAgKi9cbiAgICBnZXQgc2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudC5zaXplIC0gdGhpcy5vcGVuU3RhcnQgLSB0aGlzLm9wZW5FbmQ7XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgaW5zZXJ0QXQocG9zLCBmcmFnbWVudCkge1xuICAgICAgICBsZXQgY29udGVudCA9IGluc2VydEludG8odGhpcy5jb250ZW50LCBwb3MgKyB0aGlzLm9wZW5TdGFydCwgZnJhZ21lbnQpO1xuICAgICAgICByZXR1cm4gY29udGVudCAmJiBuZXcgU2xpY2UoY29udGVudCwgdGhpcy5vcGVuU3RhcnQsIHRoaXMub3BlbkVuZCk7XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgcmVtb3ZlQmV0d2Vlbihmcm9tLCB0bykge1xuICAgICAgICByZXR1cm4gbmV3IFNsaWNlKHJlbW92ZVJhbmdlKHRoaXMuY29udGVudCwgZnJvbSArIHRoaXMub3BlblN0YXJ0LCB0byArIHRoaXMub3BlblN0YXJ0KSwgdGhpcy5vcGVuU3RhcnQsIHRoaXMub3BlbkVuZCk7XG4gICAgfVxuICAgIC8qKlxuICAgIFRlc3RzIHdoZXRoZXIgdGhpcyBzbGljZSBpcyBlcXVhbCB0byBhbm90aGVyIHNsaWNlLlxuICAgICovXG4gICAgZXEob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudC5lcShvdGhlci5jb250ZW50KSAmJiB0aGlzLm9wZW5TdGFydCA9PSBvdGhlci5vcGVuU3RhcnQgJiYgdGhpcy5vcGVuRW5kID09IG90aGVyLm9wZW5FbmQ7XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnQgKyBcIihcIiArIHRoaXMub3BlblN0YXJ0ICsgXCIsXCIgKyB0aGlzLm9wZW5FbmQgKyBcIilcIjtcbiAgICB9XG4gICAgLyoqXG4gICAgQ29udmVydCBhIHNsaWNlIHRvIGEgSlNPTi1zZXJpYWxpemFibGUgcmVwcmVzZW50YXRpb24uXG4gICAgKi9cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIGlmICghdGhpcy5jb250ZW50LnNpemUpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgbGV0IGpzb24gPSB7IGNvbnRlbnQ6IHRoaXMuY29udGVudC50b0pTT04oKSB9O1xuICAgICAgICBpZiAodGhpcy5vcGVuU3RhcnQgPiAwKVxuICAgICAgICAgICAganNvbi5vcGVuU3RhcnQgPSB0aGlzLm9wZW5TdGFydDtcbiAgICAgICAgaWYgKHRoaXMub3BlbkVuZCA+IDApXG4gICAgICAgICAgICBqc29uLm9wZW5FbmQgPSB0aGlzLm9wZW5FbmQ7XG4gICAgICAgIHJldHVybiBqc29uO1xuICAgIH1cbiAgICAvKipcbiAgICBEZXNlcmlhbGl6ZSBhIHNsaWNlIGZyb20gaXRzIEpTT04gcmVwcmVzZW50YXRpb24uXG4gICAgKi9cbiAgICBzdGF0aWMgZnJvbUpTT04oc2NoZW1hLCBqc29uKSB7XG4gICAgICAgIGlmICghanNvbilcbiAgICAgICAgICAgIHJldHVybiBTbGljZS5lbXB0eTtcbiAgICAgICAgbGV0IG9wZW5TdGFydCA9IGpzb24ub3BlblN0YXJ0IHx8IDAsIG9wZW5FbmQgPSBqc29uLm9wZW5FbmQgfHwgMDtcbiAgICAgICAgaWYgKHR5cGVvZiBvcGVuU3RhcnQgIT0gXCJudW1iZXJcIiB8fCB0eXBlb2Ygb3BlbkVuZCAhPSBcIm51bWJlclwiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbnZhbGlkIGlucHV0IGZvciBTbGljZS5mcm9tSlNPTlwiKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTbGljZShGcmFnbWVudC5mcm9tSlNPTihzY2hlbWEsIGpzb24uY29udGVudCksIG9wZW5TdGFydCwgb3BlbkVuZCk7XG4gICAgfVxuICAgIC8qKlxuICAgIENyZWF0ZSBhIHNsaWNlIGZyb20gYSBmcmFnbWVudCBieSB0YWtpbmcgdGhlIG1heGltdW0gcG9zc2libGVcbiAgICBvcGVuIHZhbHVlIG9uIGJvdGggc2lkZSBvZiB0aGUgZnJhZ21lbnQuXG4gICAgKi9cbiAgICBzdGF0aWMgbWF4T3BlbihmcmFnbWVudCwgb3Blbklzb2xhdGluZyA9IHRydWUpIHtcbiAgICAgICAgbGV0IG9wZW5TdGFydCA9IDAsIG9wZW5FbmQgPSAwO1xuICAgICAgICBmb3IgKGxldCBuID0gZnJhZ21lbnQuZmlyc3RDaGlsZDsgbiAmJiAhbi5pc0xlYWYgJiYgKG9wZW5Jc29sYXRpbmcgfHwgIW4udHlwZS5zcGVjLmlzb2xhdGluZyk7IG4gPSBuLmZpcnN0Q2hpbGQpXG4gICAgICAgICAgICBvcGVuU3RhcnQrKztcbiAgICAgICAgZm9yIChsZXQgbiA9IGZyYWdtZW50Lmxhc3RDaGlsZDsgbiAmJiAhbi5pc0xlYWYgJiYgKG9wZW5Jc29sYXRpbmcgfHwgIW4udHlwZS5zcGVjLmlzb2xhdGluZyk7IG4gPSBuLmxhc3RDaGlsZClcbiAgICAgICAgICAgIG9wZW5FbmQrKztcbiAgICAgICAgcmV0dXJuIG5ldyBTbGljZShmcmFnbWVudCwgb3BlblN0YXJ0LCBvcGVuRW5kKTtcbiAgICB9XG59XG4vKipcblRoZSBlbXB0eSBzbGljZS5cbiovXG5TbGljZS5lbXB0eSA9IG5ldyBTbGljZShGcmFnbWVudC5lbXB0eSwgMCwgMCk7XG5mdW5jdGlvbiByZW1vdmVSYW5nZShjb250ZW50LCBmcm9tLCB0bykge1xuICAgIGxldCB7IGluZGV4LCBvZmZzZXQgfSA9IGNvbnRlbnQuZmluZEluZGV4KGZyb20pLCBjaGlsZCA9IGNvbnRlbnQubWF5YmVDaGlsZChpbmRleCk7XG4gICAgbGV0IHsgaW5kZXg6IGluZGV4VG8sIG9mZnNldDogb2Zmc2V0VG8gfSA9IGNvbnRlbnQuZmluZEluZGV4KHRvKTtcbiAgICBpZiAob2Zmc2V0ID09IGZyb20gfHwgY2hpbGQuaXNUZXh0KSB7XG4gICAgICAgIGlmIChvZmZzZXRUbyAhPSB0byAmJiAhY29udGVudC5jaGlsZChpbmRleFRvKS5pc1RleHQpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIlJlbW92aW5nIG5vbi1mbGF0IHJhbmdlXCIpO1xuICAgICAgICByZXR1cm4gY29udGVudC5jdXQoMCwgZnJvbSkuYXBwZW5kKGNvbnRlbnQuY3V0KHRvKSk7XG4gICAgfVxuICAgIGlmIChpbmRleCAhPSBpbmRleFRvKVxuICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIlJlbW92aW5nIG5vbi1mbGF0IHJhbmdlXCIpO1xuICAgIHJldHVybiBjb250ZW50LnJlcGxhY2VDaGlsZChpbmRleCwgY2hpbGQuY29weShyZW1vdmVSYW5nZShjaGlsZC5jb250ZW50LCBmcm9tIC0gb2Zmc2V0IC0gMSwgdG8gLSBvZmZzZXQgLSAxKSkpO1xufVxuZnVuY3Rpb24gaW5zZXJ0SW50byhjb250ZW50LCBkaXN0LCBpbnNlcnQsIHBhcmVudCkge1xuICAgIGxldCB7IGluZGV4LCBvZmZzZXQgfSA9IGNvbnRlbnQuZmluZEluZGV4KGRpc3QpLCBjaGlsZCA9IGNvbnRlbnQubWF5YmVDaGlsZChpbmRleCk7XG4gICAgaWYgKG9mZnNldCA9PSBkaXN0IHx8IGNoaWxkLmlzVGV4dCkge1xuICAgICAgICBpZiAocGFyZW50ICYmICFwYXJlbnQuY2FuUmVwbGFjZShpbmRleCwgaW5kZXgsIGluc2VydCkpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgcmV0dXJuIGNvbnRlbnQuY3V0KDAsIGRpc3QpLmFwcGVuZChpbnNlcnQpLmFwcGVuZChjb250ZW50LmN1dChkaXN0KSk7XG4gICAgfVxuICAgIGxldCBpbm5lciA9IGluc2VydEludG8oY2hpbGQuY29udGVudCwgZGlzdCAtIG9mZnNldCAtIDEsIGluc2VydCk7XG4gICAgcmV0dXJuIGlubmVyICYmIGNvbnRlbnQucmVwbGFjZUNoaWxkKGluZGV4LCBjaGlsZC5jb3B5KGlubmVyKSk7XG59XG5mdW5jdGlvbiByZXBsYWNlKCRmcm9tLCAkdG8sIHNsaWNlKSB7XG4gICAgaWYgKHNsaWNlLm9wZW5TdGFydCA+ICRmcm9tLmRlcHRoKVxuICAgICAgICB0aHJvdyBuZXcgUmVwbGFjZUVycm9yKFwiSW5zZXJ0ZWQgY29udGVudCBkZWVwZXIgdGhhbiBpbnNlcnRpb24gcG9zaXRpb25cIik7XG4gICAgaWYgKCRmcm9tLmRlcHRoIC0gc2xpY2Uub3BlblN0YXJ0ICE9ICR0by5kZXB0aCAtIHNsaWNlLm9wZW5FbmQpXG4gICAgICAgIHRocm93IG5ldyBSZXBsYWNlRXJyb3IoXCJJbmNvbnNpc3RlbnQgb3BlbiBkZXB0aHNcIik7XG4gICAgcmV0dXJuIHJlcGxhY2VPdXRlcigkZnJvbSwgJHRvLCBzbGljZSwgMCk7XG59XG5mdW5jdGlvbiByZXBsYWNlT3V0ZXIoJGZyb20sICR0bywgc2xpY2UsIGRlcHRoKSB7XG4gICAgbGV0IGluZGV4ID0gJGZyb20uaW5kZXgoZGVwdGgpLCBub2RlID0gJGZyb20ubm9kZShkZXB0aCk7XG4gICAgaWYgKGluZGV4ID09ICR0by5pbmRleChkZXB0aCkgJiYgZGVwdGggPCAkZnJvbS5kZXB0aCAtIHNsaWNlLm9wZW5TdGFydCkge1xuICAgICAgICBsZXQgaW5uZXIgPSByZXBsYWNlT3V0ZXIoJGZyb20sICR0bywgc2xpY2UsIGRlcHRoICsgMSk7XG4gICAgICAgIHJldHVybiBub2RlLmNvcHkobm9kZS5jb250ZW50LnJlcGxhY2VDaGlsZChpbmRleCwgaW5uZXIpKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIXNsaWNlLmNvbnRlbnQuc2l6ZSkge1xuICAgICAgICByZXR1cm4gY2xvc2Uobm9kZSwgcmVwbGFjZVR3b1dheSgkZnJvbSwgJHRvLCBkZXB0aCkpO1xuICAgIH1cbiAgICBlbHNlIGlmICghc2xpY2Uub3BlblN0YXJ0ICYmICFzbGljZS5vcGVuRW5kICYmICRmcm9tLmRlcHRoID09IGRlcHRoICYmICR0by5kZXB0aCA9PSBkZXB0aCkgeyAvLyBTaW1wbGUsIGZsYXQgY2FzZVxuICAgICAgICBsZXQgcGFyZW50ID0gJGZyb20ucGFyZW50LCBjb250ZW50ID0gcGFyZW50LmNvbnRlbnQ7XG4gICAgICAgIHJldHVybiBjbG9zZShwYXJlbnQsIGNvbnRlbnQuY3V0KDAsICRmcm9tLnBhcmVudE9mZnNldCkuYXBwZW5kKHNsaWNlLmNvbnRlbnQpLmFwcGVuZChjb250ZW50LmN1dCgkdG8ucGFyZW50T2Zmc2V0KSkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbGV0IHsgc3RhcnQsIGVuZCB9ID0gcHJlcGFyZVNsaWNlRm9yUmVwbGFjZShzbGljZSwgJGZyb20pO1xuICAgICAgICByZXR1cm4gY2xvc2Uobm9kZSwgcmVwbGFjZVRocmVlV2F5KCRmcm9tLCBzdGFydCwgZW5kLCAkdG8sIGRlcHRoKSk7XG4gICAgfVxufVxuZnVuY3Rpb24gY2hlY2tKb2luKG1haW4sIHN1Yikge1xuICAgIGlmICghc3ViLnR5cGUuY29tcGF0aWJsZUNvbnRlbnQobWFpbi50eXBlKSlcbiAgICAgICAgdGhyb3cgbmV3IFJlcGxhY2VFcnJvcihcIkNhbm5vdCBqb2luIFwiICsgc3ViLnR5cGUubmFtZSArIFwiIG9udG8gXCIgKyBtYWluLnR5cGUubmFtZSk7XG59XG5mdW5jdGlvbiBqb2luYWJsZSgkYmVmb3JlLCAkYWZ0ZXIsIGRlcHRoKSB7XG4gICAgbGV0IG5vZGUgPSAkYmVmb3JlLm5vZGUoZGVwdGgpO1xuICAgIGNoZWNrSm9pbihub2RlLCAkYWZ0ZXIubm9kZShkZXB0aCkpO1xuICAgIHJldHVybiBub2RlO1xufVxuZnVuY3Rpb24gYWRkTm9kZShjaGlsZCwgdGFyZ2V0KSB7XG4gICAgbGV0IGxhc3QgPSB0YXJnZXQubGVuZ3RoIC0gMTtcbiAgICBpZiAobGFzdCA+PSAwICYmIGNoaWxkLmlzVGV4dCAmJiBjaGlsZC5zYW1lTWFya3VwKHRhcmdldFtsYXN0XSkpXG4gICAgICAgIHRhcmdldFtsYXN0XSA9IGNoaWxkLndpdGhUZXh0KHRhcmdldFtsYXN0XS50ZXh0ICsgY2hpbGQudGV4dCk7XG4gICAgZWxzZVxuICAgICAgICB0YXJnZXQucHVzaChjaGlsZCk7XG59XG5mdW5jdGlvbiBhZGRSYW5nZSgkc3RhcnQsICRlbmQsIGRlcHRoLCB0YXJnZXQpIHtcbiAgICBsZXQgbm9kZSA9ICgkZW5kIHx8ICRzdGFydCkubm9kZShkZXB0aCk7XG4gICAgbGV0IHN0YXJ0SW5kZXggPSAwLCBlbmRJbmRleCA9ICRlbmQgPyAkZW5kLmluZGV4KGRlcHRoKSA6IG5vZGUuY2hpbGRDb3VudDtcbiAgICBpZiAoJHN0YXJ0KSB7XG4gICAgICAgIHN0YXJ0SW5kZXggPSAkc3RhcnQuaW5kZXgoZGVwdGgpO1xuICAgICAgICBpZiAoJHN0YXJ0LmRlcHRoID4gZGVwdGgpIHtcbiAgICAgICAgICAgIHN0YXJ0SW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgkc3RhcnQudGV4dE9mZnNldCkge1xuICAgICAgICAgICAgYWRkTm9kZSgkc3RhcnQubm9kZUFmdGVyLCB0YXJnZXQpO1xuICAgICAgICAgICAgc3RhcnRJbmRleCsrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDwgZW5kSW5kZXg7IGkrKylcbiAgICAgICAgYWRkTm9kZShub2RlLmNoaWxkKGkpLCB0YXJnZXQpO1xuICAgIGlmICgkZW5kICYmICRlbmQuZGVwdGggPT0gZGVwdGggJiYgJGVuZC50ZXh0T2Zmc2V0KVxuICAgICAgICBhZGROb2RlKCRlbmQubm9kZUJlZm9yZSwgdGFyZ2V0KTtcbn1cbmZ1bmN0aW9uIGNsb3NlKG5vZGUsIGNvbnRlbnQpIHtcbiAgICBub2RlLnR5cGUuY2hlY2tDb250ZW50KGNvbnRlbnQpO1xuICAgIHJldHVybiBub2RlLmNvcHkoY29udGVudCk7XG59XG5mdW5jdGlvbiByZXBsYWNlVGhyZWVXYXkoJGZyb20sICRzdGFydCwgJGVuZCwgJHRvLCBkZXB0aCkge1xuICAgIGxldCBvcGVuU3RhcnQgPSAkZnJvbS5kZXB0aCA+IGRlcHRoICYmIGpvaW5hYmxlKCRmcm9tLCAkc3RhcnQsIGRlcHRoICsgMSk7XG4gICAgbGV0IG9wZW5FbmQgPSAkdG8uZGVwdGggPiBkZXB0aCAmJiBqb2luYWJsZSgkZW5kLCAkdG8sIGRlcHRoICsgMSk7XG4gICAgbGV0IGNvbnRlbnQgPSBbXTtcbiAgICBhZGRSYW5nZShudWxsLCAkZnJvbSwgZGVwdGgsIGNvbnRlbnQpO1xuICAgIGlmIChvcGVuU3RhcnQgJiYgb3BlbkVuZCAmJiAkc3RhcnQuaW5kZXgoZGVwdGgpID09ICRlbmQuaW5kZXgoZGVwdGgpKSB7XG4gICAgICAgIGNoZWNrSm9pbihvcGVuU3RhcnQsIG9wZW5FbmQpO1xuICAgICAgICBhZGROb2RlKGNsb3NlKG9wZW5TdGFydCwgcmVwbGFjZVRocmVlV2F5KCRmcm9tLCAkc3RhcnQsICRlbmQsICR0bywgZGVwdGggKyAxKSksIGNvbnRlbnQpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKG9wZW5TdGFydClcbiAgICAgICAgICAgIGFkZE5vZGUoY2xvc2Uob3BlblN0YXJ0LCByZXBsYWNlVHdvV2F5KCRmcm9tLCAkc3RhcnQsIGRlcHRoICsgMSkpLCBjb250ZW50KTtcbiAgICAgICAgYWRkUmFuZ2UoJHN0YXJ0LCAkZW5kLCBkZXB0aCwgY29udGVudCk7XG4gICAgICAgIGlmIChvcGVuRW5kKVxuICAgICAgICAgICAgYWRkTm9kZShjbG9zZShvcGVuRW5kLCByZXBsYWNlVHdvV2F5KCRlbmQsICR0bywgZGVwdGggKyAxKSksIGNvbnRlbnQpO1xuICAgIH1cbiAgICBhZGRSYW5nZSgkdG8sIG51bGwsIGRlcHRoLCBjb250ZW50KTtcbiAgICByZXR1cm4gbmV3IEZyYWdtZW50KGNvbnRlbnQpO1xufVxuZnVuY3Rpb24gcmVwbGFjZVR3b1dheSgkZnJvbSwgJHRvLCBkZXB0aCkge1xuICAgIGxldCBjb250ZW50ID0gW107XG4gICAgYWRkUmFuZ2UobnVsbCwgJGZyb20sIGRlcHRoLCBjb250ZW50KTtcbiAgICBpZiAoJGZyb20uZGVwdGggPiBkZXB0aCkge1xuICAgICAgICBsZXQgdHlwZSA9IGpvaW5hYmxlKCRmcm9tLCAkdG8sIGRlcHRoICsgMSk7XG4gICAgICAgIGFkZE5vZGUoY2xvc2UodHlwZSwgcmVwbGFjZVR3b1dheSgkZnJvbSwgJHRvLCBkZXB0aCArIDEpKSwgY29udGVudCk7XG4gICAgfVxuICAgIGFkZFJhbmdlKCR0bywgbnVsbCwgZGVwdGgsIGNvbnRlbnQpO1xuICAgIHJldHVybiBuZXcgRnJhZ21lbnQoY29udGVudCk7XG59XG5mdW5jdGlvbiBwcmVwYXJlU2xpY2VGb3JSZXBsYWNlKHNsaWNlLCAkYWxvbmcpIHtcbiAgICBsZXQgZXh0cmEgPSAkYWxvbmcuZGVwdGggLSBzbGljZS5vcGVuU3RhcnQsIHBhcmVudCA9ICRhbG9uZy5ub2RlKGV4dHJhKTtcbiAgICBsZXQgbm9kZSA9IHBhcmVudC5jb3B5KHNsaWNlLmNvbnRlbnQpO1xuICAgIGZvciAobGV0IGkgPSBleHRyYSAtIDE7IGkgPj0gMDsgaS0tKVxuICAgICAgICBub2RlID0gJGFsb25nLm5vZGUoaSkuY29weShGcmFnbWVudC5mcm9tKG5vZGUpKTtcbiAgICByZXR1cm4geyBzdGFydDogbm9kZS5yZXNvbHZlTm9DYWNoZShzbGljZS5vcGVuU3RhcnQgKyBleHRyYSksXG4gICAgICAgIGVuZDogbm9kZS5yZXNvbHZlTm9DYWNoZShub2RlLmNvbnRlbnQuc2l6ZSAtIHNsaWNlLm9wZW5FbmQgLSBleHRyYSkgfTtcbn1cblxuLyoqXG5Zb3UgY2FuIFtfcmVzb2x2ZV9dKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5Ob2RlLnJlc29sdmUpIGEgcG9zaXRpb24gdG8gZ2V0IG1vcmVcbmluZm9ybWF0aW9uIGFib3V0IGl0LiBPYmplY3RzIG9mIHRoaXMgY2xhc3MgcmVwcmVzZW50IHN1Y2ggYVxucmVzb2x2ZWQgcG9zaXRpb24sIHByb3ZpZGluZyB2YXJpb3VzIHBpZWNlcyBvZiBjb250ZXh0XG5pbmZvcm1hdGlvbiwgYW5kIHNvbWUgaGVscGVyIG1ldGhvZHMuXG5cblRocm91Z2hvdXQgdGhpcyBpbnRlcmZhY2UsIG1ldGhvZHMgdGhhdCB0YWtlIGFuIG9wdGlvbmFsIGBkZXB0aGBcbnBhcmFtZXRlciB3aWxsIGludGVycHJldCB1bmRlZmluZWQgYXMgYHRoaXMuZGVwdGhgIGFuZCBuZWdhdGl2ZVxubnVtYmVycyBhcyBgdGhpcy5kZXB0aCArIHZhbHVlYC5cbiovXG5jbGFzcyBSZXNvbHZlZFBvcyB7XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAvKipcbiAgICBUaGUgcG9zaXRpb24gdGhhdCB3YXMgcmVzb2x2ZWQuXG4gICAgKi9cbiAgICBwb3MsIFxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgcGF0aCwgXG4gICAgLyoqXG4gICAgVGhlIG9mZnNldCB0aGlzIHBvc2l0aW9uIGhhcyBpbnRvIGl0cyBwYXJlbnQgbm9kZS5cbiAgICAqL1xuICAgIHBhcmVudE9mZnNldCkge1xuICAgICAgICB0aGlzLnBvcyA9IHBvcztcbiAgICAgICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICAgICAgdGhpcy5wYXJlbnRPZmZzZXQgPSBwYXJlbnRPZmZzZXQ7XG4gICAgICAgIHRoaXMuZGVwdGggPSBwYXRoLmxlbmd0aCAvIDMgLSAxO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHJlc29sdmVEZXB0aCh2YWwpIHtcbiAgICAgICAgaWYgKHZhbCA9PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVwdGg7XG4gICAgICAgIGlmICh2YWwgPCAwKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVwdGggKyB2YWw7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuICAgIC8qKlxuICAgIFRoZSBwYXJlbnQgbm9kZSB0aGF0IHRoZSBwb3NpdGlvbiBwb2ludHMgaW50by4gTm90ZSB0aGF0IGV2ZW4gaWZcbiAgICBhIHBvc2l0aW9uIHBvaW50cyBpbnRvIGEgdGV4dCBub2RlLCB0aGF0IG5vZGUgaXMgbm90IGNvbnNpZGVyZWRcbiAgICB0aGUgcGFyZW50XHUyMDE0dGV4dCBub2RlcyBhcmUgXHUyMDE4ZmxhdFx1MjAxOSBpbiB0aGlzIG1vZGVsLCBhbmQgaGF2ZSBubyBjb250ZW50LlxuICAgICovXG4gICAgZ2V0IHBhcmVudCgpIHsgcmV0dXJuIHRoaXMubm9kZSh0aGlzLmRlcHRoKTsgfVxuICAgIC8qKlxuICAgIFRoZSByb290IG5vZGUgaW4gd2hpY2ggdGhlIHBvc2l0aW9uIHdhcyByZXNvbHZlZC5cbiAgICAqL1xuICAgIGdldCBkb2MoKSB7IHJldHVybiB0aGlzLm5vZGUoMCk7IH1cbiAgICAvKipcbiAgICBUaGUgYW5jZXN0b3Igbm9kZSBhdCB0aGUgZ2l2ZW4gbGV2ZWwuIGBwLm5vZGUocC5kZXB0aClgIGlzIHRoZVxuICAgIHNhbWUgYXMgYHAucGFyZW50YC5cbiAgICAqL1xuICAgIG5vZGUoZGVwdGgpIHsgcmV0dXJuIHRoaXMucGF0aFt0aGlzLnJlc29sdmVEZXB0aChkZXB0aCkgKiAzXTsgfVxuICAgIC8qKlxuICAgIFRoZSBpbmRleCBpbnRvIHRoZSBhbmNlc3RvciBhdCB0aGUgZ2l2ZW4gbGV2ZWwuIElmIHRoaXMgcG9pbnRzXG4gICAgYXQgdGhlIDNyZCBub2RlIGluIHRoZSAybmQgcGFyYWdyYXBoIG9uIHRoZSB0b3AgbGV2ZWwsIGZvclxuICAgIGV4YW1wbGUsIGBwLmluZGV4KDApYCBpcyAxIGFuZCBgcC5pbmRleCgxKWAgaXMgMi5cbiAgICAqL1xuICAgIGluZGV4KGRlcHRoKSB7IHJldHVybiB0aGlzLnBhdGhbdGhpcy5yZXNvbHZlRGVwdGgoZGVwdGgpICogMyArIDFdOyB9XG4gICAgLyoqXG4gICAgVGhlIGluZGV4IHBvaW50aW5nIGFmdGVyIHRoaXMgcG9zaXRpb24gaW50byB0aGUgYW5jZXN0b3IgYXQgdGhlXG4gICAgZ2l2ZW4gbGV2ZWwuXG4gICAgKi9cbiAgICBpbmRleEFmdGVyKGRlcHRoKSB7XG4gICAgICAgIGRlcHRoID0gdGhpcy5yZXNvbHZlRGVwdGgoZGVwdGgpO1xuICAgICAgICByZXR1cm4gdGhpcy5pbmRleChkZXB0aCkgKyAoZGVwdGggPT0gdGhpcy5kZXB0aCAmJiAhdGhpcy50ZXh0T2Zmc2V0ID8gMCA6IDEpO1xuICAgIH1cbiAgICAvKipcbiAgICBUaGUgKGFic29sdXRlKSBwb3NpdGlvbiBhdCB0aGUgc3RhcnQgb2YgdGhlIG5vZGUgYXQgdGhlIGdpdmVuXG4gICAgbGV2ZWwuXG4gICAgKi9cbiAgICBzdGFydChkZXB0aCkge1xuICAgICAgICBkZXB0aCA9IHRoaXMucmVzb2x2ZURlcHRoKGRlcHRoKTtcbiAgICAgICAgcmV0dXJuIGRlcHRoID09IDAgPyAwIDogdGhpcy5wYXRoW2RlcHRoICogMyAtIDFdICsgMTtcbiAgICB9XG4gICAgLyoqXG4gICAgVGhlIChhYnNvbHV0ZSkgcG9zaXRpb24gYXQgdGhlIGVuZCBvZiB0aGUgbm9kZSBhdCB0aGUgZ2l2ZW5cbiAgICBsZXZlbC5cbiAgICAqL1xuICAgIGVuZChkZXB0aCkge1xuICAgICAgICBkZXB0aCA9IHRoaXMucmVzb2x2ZURlcHRoKGRlcHRoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnQoZGVwdGgpICsgdGhpcy5ub2RlKGRlcHRoKS5jb250ZW50LnNpemU7XG4gICAgfVxuICAgIC8qKlxuICAgIFRoZSAoYWJzb2x1dGUpIHBvc2l0aW9uIGRpcmVjdGx5IGJlZm9yZSB0aGUgd3JhcHBpbmcgbm9kZSBhdCB0aGVcbiAgICBnaXZlbiBsZXZlbCwgb3IsIHdoZW4gYGRlcHRoYCBpcyBgdGhpcy5kZXB0aCArIDFgLCB0aGUgb3JpZ2luYWxcbiAgICBwb3NpdGlvbi5cbiAgICAqL1xuICAgIGJlZm9yZShkZXB0aCkge1xuICAgICAgICBkZXB0aCA9IHRoaXMucmVzb2x2ZURlcHRoKGRlcHRoKTtcbiAgICAgICAgaWYgKCFkZXB0aClcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiVGhlcmUgaXMgbm8gcG9zaXRpb24gYmVmb3JlIHRoZSB0b3AtbGV2ZWwgbm9kZVwiKTtcbiAgICAgICAgcmV0dXJuIGRlcHRoID09IHRoaXMuZGVwdGggKyAxID8gdGhpcy5wb3MgOiB0aGlzLnBhdGhbZGVwdGggKiAzIC0gMV07XG4gICAgfVxuICAgIC8qKlxuICAgIFRoZSAoYWJzb2x1dGUpIHBvc2l0aW9uIGRpcmVjdGx5IGFmdGVyIHRoZSB3cmFwcGluZyBub2RlIGF0IHRoZVxuICAgIGdpdmVuIGxldmVsLCBvciB0aGUgb3JpZ2luYWwgcG9zaXRpb24gd2hlbiBgZGVwdGhgIGlzIGB0aGlzLmRlcHRoICsgMWAuXG4gICAgKi9cbiAgICBhZnRlcihkZXB0aCkge1xuICAgICAgICBkZXB0aCA9IHRoaXMucmVzb2x2ZURlcHRoKGRlcHRoKTtcbiAgICAgICAgaWYgKCFkZXB0aClcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiVGhlcmUgaXMgbm8gcG9zaXRpb24gYWZ0ZXIgdGhlIHRvcC1sZXZlbCBub2RlXCIpO1xuICAgICAgICByZXR1cm4gZGVwdGggPT0gdGhpcy5kZXB0aCArIDEgPyB0aGlzLnBvcyA6IHRoaXMucGF0aFtkZXB0aCAqIDMgLSAxXSArIHRoaXMucGF0aFtkZXB0aCAqIDNdLm5vZGVTaXplO1xuICAgIH1cbiAgICAvKipcbiAgICBXaGVuIHRoaXMgcG9zaXRpb24gcG9pbnRzIGludG8gYSB0ZXh0IG5vZGUsIHRoaXMgcmV0dXJucyB0aGVcbiAgICBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBwb3NpdGlvbiBhbmQgdGhlIHN0YXJ0IG9mIHRoZSB0ZXh0IG5vZGUuXG4gICAgV2lsbCBiZSB6ZXJvIGZvciBwb3NpdGlvbnMgdGhhdCBwb2ludCBiZXR3ZWVuIG5vZGVzLlxuICAgICovXG4gICAgZ2V0IHRleHRPZmZzZXQoKSB7IHJldHVybiB0aGlzLnBvcyAtIHRoaXMucGF0aFt0aGlzLnBhdGgubGVuZ3RoIC0gMV07IH1cbiAgICAvKipcbiAgICBHZXQgdGhlIG5vZGUgZGlyZWN0bHkgYWZ0ZXIgdGhlIHBvc2l0aW9uLCBpZiBhbnkuIElmIHRoZSBwb3NpdGlvblxuICAgIHBvaW50cyBpbnRvIGEgdGV4dCBub2RlLCBvbmx5IHRoZSBwYXJ0IG9mIHRoYXQgbm9kZSBhZnRlciB0aGVcbiAgICBwb3NpdGlvbiBpcyByZXR1cm5lZC5cbiAgICAqL1xuICAgIGdldCBub2RlQWZ0ZXIoKSB7XG4gICAgICAgIGxldCBwYXJlbnQgPSB0aGlzLnBhcmVudCwgaW5kZXggPSB0aGlzLmluZGV4KHRoaXMuZGVwdGgpO1xuICAgICAgICBpZiAoaW5kZXggPT0gcGFyZW50LmNoaWxkQ291bnQpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgbGV0IGRPZmYgPSB0aGlzLnBvcyAtIHRoaXMucGF0aFt0aGlzLnBhdGgubGVuZ3RoIC0gMV0sIGNoaWxkID0gcGFyZW50LmNoaWxkKGluZGV4KTtcbiAgICAgICAgcmV0dXJuIGRPZmYgPyBwYXJlbnQuY2hpbGQoaW5kZXgpLmN1dChkT2ZmKSA6IGNoaWxkO1xuICAgIH1cbiAgICAvKipcbiAgICBHZXQgdGhlIG5vZGUgZGlyZWN0bHkgYmVmb3JlIHRoZSBwb3NpdGlvbiwgaWYgYW55LiBJZiB0aGVcbiAgICBwb3NpdGlvbiBwb2ludHMgaW50byBhIHRleHQgbm9kZSwgb25seSB0aGUgcGFydCBvZiB0aGF0IG5vZGVcbiAgICBiZWZvcmUgdGhlIHBvc2l0aW9uIGlzIHJldHVybmVkLlxuICAgICovXG4gICAgZ2V0IG5vZGVCZWZvcmUoKSB7XG4gICAgICAgIGxldCBpbmRleCA9IHRoaXMuaW5kZXgodGhpcy5kZXB0aCk7XG4gICAgICAgIGxldCBkT2ZmID0gdGhpcy5wb3MgLSB0aGlzLnBhdGhbdGhpcy5wYXRoLmxlbmd0aCAtIDFdO1xuICAgICAgICBpZiAoZE9mZilcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5jaGlsZChpbmRleCkuY3V0KDAsIGRPZmYpO1xuICAgICAgICByZXR1cm4gaW5kZXggPT0gMCA/IG51bGwgOiB0aGlzLnBhcmVudC5jaGlsZChpbmRleCAtIDEpO1xuICAgIH1cbiAgICAvKipcbiAgICBHZXQgdGhlIHBvc2l0aW9uIGF0IHRoZSBnaXZlbiBpbmRleCBpbiB0aGUgcGFyZW50IG5vZGUgYXQgdGhlXG4gICAgZ2l2ZW4gZGVwdGggKHdoaWNoIGRlZmF1bHRzIHRvIGB0aGlzLmRlcHRoYCkuXG4gICAgKi9cbiAgICBwb3NBdEluZGV4KGluZGV4LCBkZXB0aCkge1xuICAgICAgICBkZXB0aCA9IHRoaXMucmVzb2x2ZURlcHRoKGRlcHRoKTtcbiAgICAgICAgbGV0IG5vZGUgPSB0aGlzLnBhdGhbZGVwdGggKiAzXSwgcG9zID0gZGVwdGggPT0gMCA/IDAgOiB0aGlzLnBhdGhbZGVwdGggKiAzIC0gMV0gKyAxO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluZGV4OyBpKyspXG4gICAgICAgICAgICBwb3MgKz0gbm9kZS5jaGlsZChpKS5ub2RlU2l6ZTtcbiAgICAgICAgcmV0dXJuIHBvcztcbiAgICB9XG4gICAgLyoqXG4gICAgR2V0IHRoZSBtYXJrcyBhdCB0aGlzIHBvc2l0aW9uLCBmYWN0b3JpbmcgaW4gdGhlIHN1cnJvdW5kaW5nXG4gICAgbWFya3MnIFtgaW5jbHVzaXZlYF0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk1hcmtTcGVjLmluY2x1c2l2ZSkgcHJvcGVydHkuIElmIHRoZVxuICAgIHBvc2l0aW9uIGlzIGF0IHRoZSBzdGFydCBvZiBhIG5vbi1lbXB0eSBub2RlLCB0aGUgbWFya3Mgb2YgdGhlXG4gICAgbm9kZSBhZnRlciBpdCAoaWYgYW55KSBhcmUgcmV0dXJuZWQuXG4gICAgKi9cbiAgICBtYXJrcygpIHtcbiAgICAgICAgbGV0IHBhcmVudCA9IHRoaXMucGFyZW50LCBpbmRleCA9IHRoaXMuaW5kZXgoKTtcbiAgICAgICAgLy8gSW4gYW4gZW1wdHkgcGFyZW50LCByZXR1cm4gdGhlIGVtcHR5IGFycmF5XG4gICAgICAgIGlmIChwYXJlbnQuY29udGVudC5zaXplID09IDApXG4gICAgICAgICAgICByZXR1cm4gTWFyay5ub25lO1xuICAgICAgICAvLyBXaGVuIGluc2lkZSBhIHRleHQgbm9kZSwganVzdCByZXR1cm4gdGhlIHRleHQgbm9kZSdzIG1hcmtzXG4gICAgICAgIGlmICh0aGlzLnRleHRPZmZzZXQpXG4gICAgICAgICAgICByZXR1cm4gcGFyZW50LmNoaWxkKGluZGV4KS5tYXJrcztcbiAgICAgICAgbGV0IG1haW4gPSBwYXJlbnQubWF5YmVDaGlsZChpbmRleCAtIDEpLCBvdGhlciA9IHBhcmVudC5tYXliZUNoaWxkKGluZGV4KTtcbiAgICAgICAgLy8gSWYgdGhlIGBhZnRlcmAgZmxhZyBpcyB0cnVlIG9mIHRoZXJlIGlzIG5vIG5vZGUgYmVmb3JlLCBtYWtlXG4gICAgICAgIC8vIHRoZSBub2RlIGFmdGVyIHRoaXMgcG9zaXRpb24gdGhlIG1haW4gcmVmZXJlbmNlLlxuICAgICAgICBpZiAoIW1haW4pIHtcbiAgICAgICAgICAgIGxldCB0bXAgPSBtYWluO1xuICAgICAgICAgICAgbWFpbiA9IG90aGVyO1xuICAgICAgICAgICAgb3RoZXIgPSB0bXA7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVXNlIGFsbCBtYXJrcyBpbiB0aGUgbWFpbiBub2RlLCBleGNlcHQgdGhvc2UgdGhhdCBoYXZlXG4gICAgICAgIC8vIGBpbmNsdXNpdmVgIHNldCB0byBmYWxzZSBhbmQgYXJlIG5vdCBwcmVzZW50IGluIHRoZSBvdGhlciBub2RlLlxuICAgICAgICBsZXQgbWFya3MgPSBtYWluLm1hcmtzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hcmtzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaWYgKG1hcmtzW2ldLnR5cGUuc3BlYy5pbmNsdXNpdmUgPT09IGZhbHNlICYmICghb3RoZXIgfHwgIW1hcmtzW2ldLmlzSW5TZXQob3RoZXIubWFya3MpKSlcbiAgICAgICAgICAgICAgICBtYXJrcyA9IG1hcmtzW2ktLV0ucmVtb3ZlRnJvbVNldChtYXJrcyk7XG4gICAgICAgIHJldHVybiBtYXJrcztcbiAgICB9XG4gICAgLyoqXG4gICAgR2V0IHRoZSBtYXJrcyBhZnRlciB0aGUgY3VycmVudCBwb3NpdGlvbiwgaWYgYW55LCBleGNlcHQgdGhvc2VcbiAgICB0aGF0IGFyZSBub24taW5jbHVzaXZlIGFuZCBub3QgcHJlc2VudCBhdCBwb3NpdGlvbiBgJGVuZGAuIFRoaXNcbiAgICBpcyBtb3N0bHkgdXNlZnVsIGZvciBnZXR0aW5nIHRoZSBzZXQgb2YgbWFya3MgdG8gcHJlc2VydmUgYWZ0ZXIgYVxuICAgIGRlbGV0aW9uLiBXaWxsIHJldHVybiBgbnVsbGAgaWYgdGhpcyBwb3NpdGlvbiBpcyBhdCB0aGUgZW5kIG9mXG4gICAgaXRzIHBhcmVudCBub2RlIG9yIGl0cyBwYXJlbnQgbm9kZSBpc24ndCBhIHRleHRibG9jayAoaW4gd2hpY2hcbiAgICBjYXNlIG5vIG1hcmtzIHNob3VsZCBiZSBwcmVzZXJ2ZWQpLlxuICAgICovXG4gICAgbWFya3NBY3Jvc3MoJGVuZCkge1xuICAgICAgICBsZXQgYWZ0ZXIgPSB0aGlzLnBhcmVudC5tYXliZUNoaWxkKHRoaXMuaW5kZXgoKSk7XG4gICAgICAgIGlmICghYWZ0ZXIgfHwgIWFmdGVyLmlzSW5saW5lKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGxldCBtYXJrcyA9IGFmdGVyLm1hcmtzLCBuZXh0ID0gJGVuZC5wYXJlbnQubWF5YmVDaGlsZCgkZW5kLmluZGV4KCkpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hcmtzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaWYgKG1hcmtzW2ldLnR5cGUuc3BlYy5pbmNsdXNpdmUgPT09IGZhbHNlICYmICghbmV4dCB8fCAhbWFya3NbaV0uaXNJblNldChuZXh0Lm1hcmtzKSkpXG4gICAgICAgICAgICAgICAgbWFya3MgPSBtYXJrc1tpLS1dLnJlbW92ZUZyb21TZXQobWFya3MpO1xuICAgICAgICByZXR1cm4gbWFya3M7XG4gICAgfVxuICAgIC8qKlxuICAgIFRoZSBkZXB0aCB1cCB0byB3aGljaCB0aGlzIHBvc2l0aW9uIGFuZCB0aGUgZ2l2ZW4gKG5vbi1yZXNvbHZlZClcbiAgICBwb3NpdGlvbiBzaGFyZSB0aGUgc2FtZSBwYXJlbnQgbm9kZXMuXG4gICAgKi9cbiAgICBzaGFyZWREZXB0aChwb3MpIHtcbiAgICAgICAgZm9yIChsZXQgZGVwdGggPSB0aGlzLmRlcHRoOyBkZXB0aCA+IDA7IGRlcHRoLS0pXG4gICAgICAgICAgICBpZiAodGhpcy5zdGFydChkZXB0aCkgPD0gcG9zICYmIHRoaXMuZW5kKGRlcHRoKSA+PSBwb3MpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlcHRoO1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgLyoqXG4gICAgUmV0dXJucyBhIHJhbmdlIGJhc2VkIG9uIHRoZSBwbGFjZSB3aGVyZSB0aGlzIHBvc2l0aW9uIGFuZCB0aGVcbiAgICBnaXZlbiBwb3NpdGlvbiBkaXZlcmdlIGFyb3VuZCBibG9jayBjb250ZW50LiBJZiBib3RoIHBvaW50IGludG9cbiAgICB0aGUgc2FtZSB0ZXh0YmxvY2ssIGZvciBleGFtcGxlLCBhIHJhbmdlIGFyb3VuZCB0aGF0IHRleHRibG9ja1xuICAgIHdpbGwgYmUgcmV0dXJuZWQuIElmIHRoZXkgcG9pbnQgaW50byBkaWZmZXJlbnQgYmxvY2tzLCB0aGUgcmFuZ2VcbiAgICBhcm91bmQgdGhvc2UgYmxvY2tzIGluIHRoZWlyIHNoYXJlZCBhbmNlc3RvciBpcyByZXR1cm5lZC4gWW91IGNhblxuICAgIHBhc3MgaW4gYW4gb3B0aW9uYWwgcHJlZGljYXRlIHRoYXQgd2lsbCBiZSBjYWxsZWQgd2l0aCBhIHBhcmVudFxuICAgIG5vZGUgdG8gc2VlIGlmIGEgcmFuZ2UgaW50byB0aGF0IHBhcmVudCBpcyBhY2NlcHRhYmxlLlxuICAgICovXG4gICAgYmxvY2tSYW5nZShvdGhlciA9IHRoaXMsIHByZWQpIHtcbiAgICAgICAgaWYgKG90aGVyLnBvcyA8IHRoaXMucG9zKVxuICAgICAgICAgICAgcmV0dXJuIG90aGVyLmJsb2NrUmFuZ2UodGhpcyk7XG4gICAgICAgIGZvciAobGV0IGQgPSB0aGlzLmRlcHRoIC0gKHRoaXMucGFyZW50LmlubGluZUNvbnRlbnQgfHwgdGhpcy5wb3MgPT0gb3RoZXIucG9zID8gMSA6IDApOyBkID49IDA7IGQtLSlcbiAgICAgICAgICAgIGlmIChvdGhlci5wb3MgPD0gdGhpcy5lbmQoZCkgJiYgKCFwcmVkIHx8IHByZWQodGhpcy5ub2RlKGQpKSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOb2RlUmFuZ2UodGhpcywgb3RoZXIsIGQpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgLyoqXG4gICAgUXVlcnkgd2hldGhlciB0aGUgZ2l2ZW4gcG9zaXRpb24gc2hhcmVzIHRoZSBzYW1lIHBhcmVudCBub2RlLlxuICAgICovXG4gICAgc2FtZVBhcmVudChvdGhlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3MgLSB0aGlzLnBhcmVudE9mZnNldCA9PSBvdGhlci5wb3MgLSBvdGhlci5wYXJlbnRPZmZzZXQ7XG4gICAgfVxuICAgIC8qKlxuICAgIFJldHVybiB0aGUgZ3JlYXRlciBvZiB0aGlzIGFuZCB0aGUgZ2l2ZW4gcG9zaXRpb24uXG4gICAgKi9cbiAgICBtYXgob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIG90aGVyLnBvcyA+IHRoaXMucG9zID8gb3RoZXIgOiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICBSZXR1cm4gdGhlIHNtYWxsZXIgb2YgdGhpcyBhbmQgdGhlIGdpdmVuIHBvc2l0aW9uLlxuICAgICovXG4gICAgbWluKG90aGVyKSB7XG4gICAgICAgIHJldHVybiBvdGhlci5wb3MgPCB0aGlzLnBvcyA/IG90aGVyIDogdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgbGV0IHN0ciA9IFwiXCI7XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHRoaXMuZGVwdGg7IGkrKylcbiAgICAgICAgICAgIHN0ciArPSAoc3RyID8gXCIvXCIgOiBcIlwiKSArIHRoaXMubm9kZShpKS50eXBlLm5hbWUgKyBcIl9cIiArIHRoaXMuaW5kZXgoaSAtIDEpO1xuICAgICAgICByZXR1cm4gc3RyICsgXCI6XCIgKyB0aGlzLnBhcmVudE9mZnNldDtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBzdGF0aWMgcmVzb2x2ZShkb2MsIHBvcykge1xuICAgICAgICBpZiAoIShwb3MgPj0gMCAmJiBwb3MgPD0gZG9jLmNvbnRlbnQuc2l6ZSkpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIlBvc2l0aW9uIFwiICsgcG9zICsgXCIgb3V0IG9mIHJhbmdlXCIpO1xuICAgICAgICBsZXQgcGF0aCA9IFtdO1xuICAgICAgICBsZXQgc3RhcnQgPSAwLCBwYXJlbnRPZmZzZXQgPSBwb3M7XG4gICAgICAgIGZvciAobGV0IG5vZGUgPSBkb2M7Oykge1xuICAgICAgICAgICAgbGV0IHsgaW5kZXgsIG9mZnNldCB9ID0gbm9kZS5jb250ZW50LmZpbmRJbmRleChwYXJlbnRPZmZzZXQpO1xuICAgICAgICAgICAgbGV0IHJlbSA9IHBhcmVudE9mZnNldCAtIG9mZnNldDtcbiAgICAgICAgICAgIHBhdGgucHVzaChub2RlLCBpbmRleCwgc3RhcnQgKyBvZmZzZXQpO1xuICAgICAgICAgICAgaWYgKCFyZW0pXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBub2RlID0gbm9kZS5jaGlsZChpbmRleCk7XG4gICAgICAgICAgICBpZiAobm9kZS5pc1RleHQpXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBwYXJlbnRPZmZzZXQgPSByZW0gLSAxO1xuICAgICAgICAgICAgc3RhcnQgKz0gb2Zmc2V0ICsgMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFJlc29sdmVkUG9zKHBvcywgcGF0aCwgcGFyZW50T2Zmc2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBzdGF0aWMgcmVzb2x2ZUNhY2hlZChkb2MsIHBvcykge1xuICAgICAgICBsZXQgY2FjaGUgPSByZXNvbHZlQ2FjaGUuZ2V0KGRvYyk7XG4gICAgICAgIGlmIChjYWNoZSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjYWNoZS5lbHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGVsdCA9IGNhY2hlLmVsdHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGVsdC5wb3MgPT0gcG9zKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZUNhY2hlLnNldChkb2MsIGNhY2hlID0gbmV3IFJlc29sdmVDYWNoZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3VsdCA9IGNhY2hlLmVsdHNbY2FjaGUuaV0gPSBSZXNvbHZlZFBvcy5yZXNvbHZlKGRvYywgcG9zKTtcbiAgICAgICAgY2FjaGUuaSA9IChjYWNoZS5pICsgMSkgJSByZXNvbHZlQ2FjaGVTaXplO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cbmNsYXNzIFJlc29sdmVDYWNoZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZWx0cyA9IFtdO1xuICAgICAgICB0aGlzLmkgPSAwO1xuICAgIH1cbn1cbmNvbnN0IHJlc29sdmVDYWNoZVNpemUgPSAxMiwgcmVzb2x2ZUNhY2hlID0gbmV3IFdlYWtNYXAoKTtcbi8qKlxuUmVwcmVzZW50cyBhIGZsYXQgcmFuZ2Ugb2YgY29udGVudCwgaS5lLiBvbmUgdGhhdCBzdGFydHMgYW5kXG5lbmRzIGluIHRoZSBzYW1lIG5vZGUuXG4qL1xuY2xhc3MgTm9kZVJhbmdlIHtcbiAgICAvKipcbiAgICBDb25zdHJ1Y3QgYSBub2RlIHJhbmdlLiBgJGZyb21gIGFuZCBgJHRvYCBzaG91bGQgcG9pbnQgaW50byB0aGVcbiAgICBzYW1lIG5vZGUgdW50aWwgYXQgbGVhc3QgdGhlIGdpdmVuIGBkZXB0aGAsIHNpbmNlIGEgbm9kZSByYW5nZVxuICAgIGRlbm90ZXMgYW4gYWRqYWNlbnQgc2V0IG9mIG5vZGVzIGluIGEgc2luZ2xlIHBhcmVudCBub2RlLlxuICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgLyoqXG4gICAgQSByZXNvbHZlZCBwb3NpdGlvbiBhbG9uZyB0aGUgc3RhcnQgb2YgdGhlIGNvbnRlbnQuIE1heSBoYXZlIGFcbiAgICBgZGVwdGhgIGdyZWF0ZXIgdGhhbiB0aGlzIG9iamVjdCdzIGBkZXB0aGAgcHJvcGVydHksIHNpbmNlXG4gICAgdGhlc2UgYXJlIHRoZSBwb3NpdGlvbnMgdGhhdCB3ZXJlIHVzZWQgdG8gY29tcHV0ZSB0aGUgcmFuZ2UsXG4gICAgbm90IHJlLXJlc29sdmVkIHBvc2l0aW9ucyBkaXJlY3RseSBhdCBpdHMgYm91bmRhcmllcy5cbiAgICAqL1xuICAgICRmcm9tLCBcbiAgICAvKipcbiAgICBBIHBvc2l0aW9uIGFsb25nIHRoZSBlbmQgb2YgdGhlIGNvbnRlbnQuIFNlZVxuICAgIGNhdmVhdCBmb3IgW2AkZnJvbWBdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5Ob2RlUmFuZ2UuJGZyb20pLlxuICAgICovXG4gICAgJHRvLCBcbiAgICAvKipcbiAgICBUaGUgZGVwdGggb2YgdGhlIG5vZGUgdGhhdCB0aGlzIHJhbmdlIHBvaW50cyBpbnRvLlxuICAgICovXG4gICAgZGVwdGgpIHtcbiAgICAgICAgdGhpcy4kZnJvbSA9ICRmcm9tO1xuICAgICAgICB0aGlzLiR0byA9ICR0bztcbiAgICAgICAgdGhpcy5kZXB0aCA9IGRlcHRoO1xuICAgIH1cbiAgICAvKipcbiAgICBUaGUgcG9zaXRpb24gYXQgdGhlIHN0YXJ0IG9mIHRoZSByYW5nZS5cbiAgICAqL1xuICAgIGdldCBzdGFydCgpIHsgcmV0dXJuIHRoaXMuJGZyb20uYmVmb3JlKHRoaXMuZGVwdGggKyAxKTsgfVxuICAgIC8qKlxuICAgIFRoZSBwb3NpdGlvbiBhdCB0aGUgZW5kIG9mIHRoZSByYW5nZS5cbiAgICAqL1xuICAgIGdldCBlbmQoKSB7IHJldHVybiB0aGlzLiR0by5hZnRlcih0aGlzLmRlcHRoICsgMSk7IH1cbiAgICAvKipcbiAgICBUaGUgcGFyZW50IG5vZGUgdGhhdCB0aGUgcmFuZ2UgcG9pbnRzIGludG8uXG4gICAgKi9cbiAgICBnZXQgcGFyZW50KCkgeyByZXR1cm4gdGhpcy4kZnJvbS5ub2RlKHRoaXMuZGVwdGgpOyB9XG4gICAgLyoqXG4gICAgVGhlIHN0YXJ0IGluZGV4IG9mIHRoZSByYW5nZSBpbiB0aGUgcGFyZW50IG5vZGUuXG4gICAgKi9cbiAgICBnZXQgc3RhcnRJbmRleCgpIHsgcmV0dXJuIHRoaXMuJGZyb20uaW5kZXgodGhpcy5kZXB0aCk7IH1cbiAgICAvKipcbiAgICBUaGUgZW5kIGluZGV4IG9mIHRoZSByYW5nZSBpbiB0aGUgcGFyZW50IG5vZGUuXG4gICAgKi9cbiAgICBnZXQgZW5kSW5kZXgoKSB7IHJldHVybiB0aGlzLiR0by5pbmRleEFmdGVyKHRoaXMuZGVwdGgpOyB9XG59XG5cbmNvbnN0IGVtcHR5QXR0cnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuLyoqXG5UaGlzIGNsYXNzIHJlcHJlc2VudHMgYSBub2RlIGluIHRoZSB0cmVlIHRoYXQgbWFrZXMgdXAgYVxuUHJvc2VNaXJyb3IgZG9jdW1lbnQuIFNvIGEgZG9jdW1lbnQgaXMgYW4gaW5zdGFuY2Ugb2YgYE5vZGVgLCB3aXRoXG5jaGlsZHJlbiB0aGF0IGFyZSBhbHNvIGluc3RhbmNlcyBvZiBgTm9kZWAuXG5cbk5vZGVzIGFyZSBwZXJzaXN0ZW50IGRhdGEgc3RydWN0dXJlcy4gSW5zdGVhZCBvZiBjaGFuZ2luZyB0aGVtLCB5b3VcbmNyZWF0ZSBuZXcgb25lcyB3aXRoIHRoZSBjb250ZW50IHlvdSB3YW50LiBPbGQgb25lcyBrZWVwIHBvaW50aW5nXG5hdCB0aGUgb2xkIGRvY3VtZW50IHNoYXBlLiBUaGlzIGlzIG1hZGUgY2hlYXBlciBieSBzaGFyaW5nXG5zdHJ1Y3R1cmUgYmV0d2VlbiB0aGUgb2xkIGFuZCBuZXcgZGF0YSBhcyBtdWNoIGFzIHBvc3NpYmxlLCB3aGljaCBhXG50cmVlIHNoYXBlIGxpa2UgdGhpcyAod2l0aG91dCBiYWNrIHBvaW50ZXJzKSBtYWtlcyBlYXN5LlxuXG4qKkRvIG5vdCoqIGRpcmVjdGx5IG11dGF0ZSB0aGUgcHJvcGVydGllcyBvZiBhIGBOb2RlYCBvYmplY3QuIFNlZVxuW3RoZSBndWlkZV0oL2RvY3MvZ3VpZGUvI2RvYykgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4qL1xuY2xhc3MgTm9kZSB7XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAvKipcbiAgICBUaGUgdHlwZSBvZiBub2RlIHRoYXQgdGhpcyBpcy5cbiAgICAqL1xuICAgIHR5cGUsIFxuICAgIC8qKlxuICAgIEFuIG9iamVjdCBtYXBwaW5nIGF0dHJpYnV0ZSBuYW1lcyB0byB2YWx1ZXMuIFRoZSBraW5kIG9mXG4gICAgYXR0cmlidXRlcyBhbGxvd2VkIGFuZCByZXF1aXJlZCBhcmVcbiAgICBbZGV0ZXJtaW5lZF0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGVTcGVjLmF0dHJzKSBieSB0aGUgbm9kZSB0eXBlLlxuICAgICovXG4gICAgYXR0cnMsIFxuICAgIC8vIEEgZnJhZ21lbnQgaG9sZGluZyB0aGUgbm9kZSdzIGNoaWxkcmVuLlxuICAgIGNvbnRlbnQsIFxuICAgIC8qKlxuICAgIFRoZSBtYXJrcyAodGhpbmdzIGxpa2Ugd2hldGhlciBpdCBpcyBlbXBoYXNpemVkIG9yIHBhcnQgb2YgYVxuICAgIGxpbmspIGFwcGxpZWQgdG8gdGhpcyBub2RlLlxuICAgICovXG4gICAgbWFya3MgPSBNYXJrLm5vbmUpIHtcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgICAgdGhpcy5hdHRycyA9IGF0dHJzO1xuICAgICAgICB0aGlzLm1hcmtzID0gbWFya3M7XG4gICAgICAgIHRoaXMuY29udGVudCA9IGNvbnRlbnQgfHwgRnJhZ21lbnQuZW1wdHk7XG4gICAgfVxuICAgIC8qKlxuICAgIFRoZSBzaXplIG9mIHRoaXMgbm9kZSwgYXMgZGVmaW5lZCBieSB0aGUgaW50ZWdlci1iYXNlZCBbaW5kZXhpbmdcbiAgICBzY2hlbWVdKC9kb2NzL2d1aWRlLyNkb2MuaW5kZXhpbmcpLiBGb3IgdGV4dCBub2RlcywgdGhpcyBpcyB0aGVcbiAgICBhbW91bnQgb2YgY2hhcmFjdGVycy4gRm9yIG90aGVyIGxlYWYgbm9kZXMsIGl0IGlzIG9uZS4gRm9yXG4gICAgbm9uLWxlYWYgbm9kZXMsIGl0IGlzIHRoZSBzaXplIG9mIHRoZSBjb250ZW50IHBsdXMgdHdvICh0aGVcbiAgICBzdGFydCBhbmQgZW5kIHRva2VuKS5cbiAgICAqL1xuICAgIGdldCBub2RlU2l6ZSgpIHsgcmV0dXJuIHRoaXMuaXNMZWFmID8gMSA6IDIgKyB0aGlzLmNvbnRlbnQuc2l6ZTsgfVxuICAgIC8qKlxuICAgIFRoZSBudW1iZXIgb2YgY2hpbGRyZW4gdGhhdCB0aGUgbm9kZSBoYXMuXG4gICAgKi9cbiAgICBnZXQgY2hpbGRDb3VudCgpIHsgcmV0dXJuIHRoaXMuY29udGVudC5jaGlsZENvdW50OyB9XG4gICAgLyoqXG4gICAgR2V0IHRoZSBjaGlsZCBub2RlIGF0IHRoZSBnaXZlbiBpbmRleC4gUmFpc2VzIGFuIGVycm9yIHdoZW4gdGhlXG4gICAgaW5kZXggaXMgb3V0IG9mIHJhbmdlLlxuICAgICovXG4gICAgY2hpbGQoaW5kZXgpIHsgcmV0dXJuIHRoaXMuY29udGVudC5jaGlsZChpbmRleCk7IH1cbiAgICAvKipcbiAgICBHZXQgdGhlIGNoaWxkIG5vZGUgYXQgdGhlIGdpdmVuIGluZGV4LCBpZiBpdCBleGlzdHMuXG4gICAgKi9cbiAgICBtYXliZUNoaWxkKGluZGV4KSB7IHJldHVybiB0aGlzLmNvbnRlbnQubWF5YmVDaGlsZChpbmRleCk7IH1cbiAgICAvKipcbiAgICBDYWxsIGBmYCBmb3IgZXZlcnkgY2hpbGQgbm9kZSwgcGFzc2luZyB0aGUgbm9kZSwgaXRzIG9mZnNldFxuICAgIGludG8gdGhpcyBwYXJlbnQgbm9kZSwgYW5kIGl0cyBpbmRleC5cbiAgICAqL1xuICAgIGZvckVhY2goZikgeyB0aGlzLmNvbnRlbnQuZm9yRWFjaChmKTsgfVxuICAgIC8qKlxuICAgIEludm9rZSBhIGNhbGxiYWNrIGZvciBhbGwgZGVzY2VuZGFudCBub2RlcyByZWN1cnNpdmVseSBiZXR3ZWVuXG4gICAgdGhlIGdpdmVuIHR3byBwb3NpdGlvbnMgdGhhdCBhcmUgcmVsYXRpdmUgdG8gc3RhcnQgb2YgdGhpc1xuICAgIG5vZGUncyBjb250ZW50LiBUaGUgY2FsbGJhY2sgaXMgaW52b2tlZCB3aXRoIHRoZSBub2RlLCBpdHNcbiAgICBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgb3JpZ2luYWwgbm9kZSAobWV0aG9kIHJlY2VpdmVyKSxcbiAgICBpdHMgcGFyZW50IG5vZGUsIGFuZCBpdHMgY2hpbGQgaW5kZXguIFdoZW4gdGhlIGNhbGxiYWNrIHJldHVybnNcbiAgICBmYWxzZSBmb3IgYSBnaXZlbiBub2RlLCB0aGF0IG5vZGUncyBjaGlsZHJlbiB3aWxsIG5vdCBiZVxuICAgIHJlY3Vyc2VkIG92ZXIuIFRoZSBsYXN0IHBhcmFtZXRlciBjYW4gYmUgdXNlZCB0byBzcGVjaWZ5IGFcbiAgICBzdGFydGluZyBwb3NpdGlvbiB0byBjb3VudCBmcm9tLlxuICAgICovXG4gICAgbm9kZXNCZXR3ZWVuKGZyb20sIHRvLCBmLCBzdGFydFBvcyA9IDApIHtcbiAgICAgICAgdGhpcy5jb250ZW50Lm5vZGVzQmV0d2Vlbihmcm9tLCB0bywgZiwgc3RhcnRQb3MsIHRoaXMpO1xuICAgIH1cbiAgICAvKipcbiAgICBDYWxsIHRoZSBnaXZlbiBjYWxsYmFjayBmb3IgZXZlcnkgZGVzY2VuZGFudCBub2RlLiBEb2Vzbid0XG4gICAgZGVzY2VuZCBpbnRvIGEgbm9kZSB3aGVuIHRoZSBjYWxsYmFjayByZXR1cm5zIGBmYWxzZWAuXG4gICAgKi9cbiAgICBkZXNjZW5kYW50cyhmKSB7XG4gICAgICAgIHRoaXMubm9kZXNCZXR3ZWVuKDAsIHRoaXMuY29udGVudC5zaXplLCBmKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ29uY2F0ZW5hdGVzIGFsbCB0aGUgdGV4dCBub2RlcyBmb3VuZCBpbiB0aGlzIGZyYWdtZW50IGFuZCBpdHNcbiAgICBjaGlsZHJlbi5cbiAgICAqL1xuICAgIGdldCB0ZXh0Q29udGVudCgpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLmlzTGVhZiAmJiB0aGlzLnR5cGUuc3BlYy5sZWFmVGV4dClcbiAgICAgICAgICAgID8gdGhpcy50eXBlLnNwZWMubGVhZlRleHQodGhpcylcbiAgICAgICAgICAgIDogdGhpcy50ZXh0QmV0d2VlbigwLCB0aGlzLmNvbnRlbnQuc2l6ZSwgXCJcIik7XG4gICAgfVxuICAgIC8qKlxuICAgIEdldCBhbGwgdGV4dCBiZXR3ZWVuIHBvc2l0aW9ucyBgZnJvbWAgYW5kIGB0b2AuIFdoZW5cbiAgICBgYmxvY2tTZXBhcmF0b3JgIGlzIGdpdmVuLCBpdCB3aWxsIGJlIGluc2VydGVkIHRvIHNlcGFyYXRlIHRleHRcbiAgICBmcm9tIGRpZmZlcmVudCBibG9jayBub2Rlcy4gSWYgYGxlYWZUZXh0YCBpcyBnaXZlbiwgaXQnbGwgYmVcbiAgICBpbnNlcnRlZCBmb3IgZXZlcnkgbm9uLXRleHQgbGVhZiBub2RlIGVuY291bnRlcmVkLCBvdGhlcndpc2VcbiAgICBbYGxlYWZUZXh0YF0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGVTcGVjXmxlYWZUZXh0KSB3aWxsIGJlIHVzZWQuXG4gICAgKi9cbiAgICB0ZXh0QmV0d2Vlbihmcm9tLCB0bywgYmxvY2tTZXBhcmF0b3IsIGxlYWZUZXh0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnQudGV4dEJldHdlZW4oZnJvbSwgdG8sIGJsb2NrU2VwYXJhdG9yLCBsZWFmVGV4dCk7XG4gICAgfVxuICAgIC8qKlxuICAgIFJldHVybnMgdGhpcyBub2RlJ3MgZmlyc3QgY2hpbGQsIG9yIGBudWxsYCBpZiB0aGVyZSBhcmUgbm9cbiAgICBjaGlsZHJlbi5cbiAgICAqL1xuICAgIGdldCBmaXJzdENoaWxkKCkgeyByZXR1cm4gdGhpcy5jb250ZW50LmZpcnN0Q2hpbGQ7IH1cbiAgICAvKipcbiAgICBSZXR1cm5zIHRoaXMgbm9kZSdzIGxhc3QgY2hpbGQsIG9yIGBudWxsYCBpZiB0aGVyZSBhcmUgbm9cbiAgICBjaGlsZHJlbi5cbiAgICAqL1xuICAgIGdldCBsYXN0Q2hpbGQoKSB7IHJldHVybiB0aGlzLmNvbnRlbnQubGFzdENoaWxkOyB9XG4gICAgLyoqXG4gICAgVGVzdCB3aGV0aGVyIHR3byBub2RlcyByZXByZXNlbnQgdGhlIHNhbWUgcGllY2Ugb2YgZG9jdW1lbnQuXG4gICAgKi9cbiAgICBlcShvdGhlcikge1xuICAgICAgICByZXR1cm4gdGhpcyA9PSBvdGhlciB8fCAodGhpcy5zYW1lTWFya3VwKG90aGVyKSAmJiB0aGlzLmNvbnRlbnQuZXEob3RoZXIuY29udGVudCkpO1xuICAgIH1cbiAgICAvKipcbiAgICBDb21wYXJlIHRoZSBtYXJrdXAgKHR5cGUsIGF0dHJpYnV0ZXMsIGFuZCBtYXJrcykgb2YgdGhpcyBub2RlIHRvXG4gICAgdGhvc2Ugb2YgYW5vdGhlci4gUmV0dXJucyBgdHJ1ZWAgaWYgYm90aCBoYXZlIHRoZSBzYW1lIG1hcmt1cC5cbiAgICAqL1xuICAgIHNhbWVNYXJrdXAob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFzTWFya3VwKG90aGVyLnR5cGUsIG90aGVyLmF0dHJzLCBvdGhlci5tYXJrcyk7XG4gICAgfVxuICAgIC8qKlxuICAgIENoZWNrIHdoZXRoZXIgdGhpcyBub2RlJ3MgbWFya3VwIGNvcnJlc3BvbmQgdG8gdGhlIGdpdmVuIHR5cGUsXG4gICAgYXR0cmlidXRlcywgYW5kIG1hcmtzLlxuICAgICovXG4gICAgaGFzTWFya3VwKHR5cGUsIGF0dHJzLCBtYXJrcykge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlID09IHR5cGUgJiZcbiAgICAgICAgICAgIGNvbXBhcmVEZWVwKHRoaXMuYXR0cnMsIGF0dHJzIHx8IHR5cGUuZGVmYXVsdEF0dHJzIHx8IGVtcHR5QXR0cnMpICYmXG4gICAgICAgICAgICBNYXJrLnNhbWVTZXQodGhpcy5tYXJrcywgbWFya3MgfHwgTWFyay5ub25lKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgbmV3IG5vZGUgd2l0aCB0aGUgc2FtZSBtYXJrdXAgYXMgdGhpcyBub2RlLCBjb250YWluaW5nXG4gICAgdGhlIGdpdmVuIGNvbnRlbnQgKG9yIGVtcHR5LCBpZiBubyBjb250ZW50IGlzIGdpdmVuKS5cbiAgICAqL1xuICAgIGNvcHkoY29udGVudCA9IG51bGwpIHtcbiAgICAgICAgaWYgKGNvbnRlbnQgPT0gdGhpcy5jb250ZW50KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIHJldHVybiBuZXcgTm9kZSh0aGlzLnR5cGUsIHRoaXMuYXR0cnMsIGNvbnRlbnQsIHRoaXMubWFya3MpO1xuICAgIH1cbiAgICAvKipcbiAgICBDcmVhdGUgYSBjb3B5IG9mIHRoaXMgbm9kZSwgd2l0aCB0aGUgZ2l2ZW4gc2V0IG9mIG1hcmtzIGluc3RlYWRcbiAgICBvZiB0aGUgbm9kZSdzIG93biBtYXJrcy5cbiAgICAqL1xuICAgIG1hcmsobWFya3MpIHtcbiAgICAgICAgcmV0dXJuIG1hcmtzID09IHRoaXMubWFya3MgPyB0aGlzIDogbmV3IE5vZGUodGhpcy50eXBlLCB0aGlzLmF0dHJzLCB0aGlzLmNvbnRlbnQsIG1hcmtzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgY29weSBvZiB0aGlzIG5vZGUgd2l0aCBvbmx5IHRoZSBjb250ZW50IGJldHdlZW4gdGhlXG4gICAgZ2l2ZW4gcG9zaXRpb25zLiBJZiBgdG9gIGlzIG5vdCBnaXZlbiwgaXQgZGVmYXVsdHMgdG8gdGhlIGVuZCBvZlxuICAgIHRoZSBub2RlLlxuICAgICovXG4gICAgY3V0KGZyb20sIHRvID0gdGhpcy5jb250ZW50LnNpemUpIHtcbiAgICAgICAgaWYgKGZyb20gPT0gMCAmJiB0byA9PSB0aGlzLmNvbnRlbnQuc2l6ZSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICByZXR1cm4gdGhpcy5jb3B5KHRoaXMuY29udGVudC5jdXQoZnJvbSwgdG8pKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3V0IG91dCB0aGUgcGFydCBvZiB0aGUgZG9jdW1lbnQgYmV0d2VlbiB0aGUgZ2l2ZW4gcG9zaXRpb25zLCBhbmRcbiAgICByZXR1cm4gaXQgYXMgYSBgU2xpY2VgIG9iamVjdC5cbiAgICAqL1xuICAgIHNsaWNlKGZyb20sIHRvID0gdGhpcy5jb250ZW50LnNpemUsIGluY2x1ZGVQYXJlbnRzID0gZmFsc2UpIHtcbiAgICAgICAgaWYgKGZyb20gPT0gdG8pXG4gICAgICAgICAgICByZXR1cm4gU2xpY2UuZW1wdHk7XG4gICAgICAgIGxldCAkZnJvbSA9IHRoaXMucmVzb2x2ZShmcm9tKSwgJHRvID0gdGhpcy5yZXNvbHZlKHRvKTtcbiAgICAgICAgbGV0IGRlcHRoID0gaW5jbHVkZVBhcmVudHMgPyAwIDogJGZyb20uc2hhcmVkRGVwdGgodG8pO1xuICAgICAgICBsZXQgc3RhcnQgPSAkZnJvbS5zdGFydChkZXB0aCksIG5vZGUgPSAkZnJvbS5ub2RlKGRlcHRoKTtcbiAgICAgICAgbGV0IGNvbnRlbnQgPSBub2RlLmNvbnRlbnQuY3V0KCRmcm9tLnBvcyAtIHN0YXJ0LCAkdG8ucG9zIC0gc3RhcnQpO1xuICAgICAgICByZXR1cm4gbmV3IFNsaWNlKGNvbnRlbnQsICRmcm9tLmRlcHRoIC0gZGVwdGgsICR0by5kZXB0aCAtIGRlcHRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgUmVwbGFjZSB0aGUgcGFydCBvZiB0aGUgZG9jdW1lbnQgYmV0d2VlbiB0aGUgZ2l2ZW4gcG9zaXRpb25zIHdpdGhcbiAgICB0aGUgZ2l2ZW4gc2xpY2UuIFRoZSBzbGljZSBtdXN0ICdmaXQnLCBtZWFuaW5nIGl0cyBvcGVuIHNpZGVzXG4gICAgbXVzdCBiZSBhYmxlIHRvIGNvbm5lY3QgdG8gdGhlIHN1cnJvdW5kaW5nIGNvbnRlbnQsIGFuZCBpdHNcbiAgICBjb250ZW50IG5vZGVzIG11c3QgYmUgdmFsaWQgY2hpbGRyZW4gZm9yIHRoZSBub2RlIHRoZXkgYXJlIHBsYWNlZFxuICAgIGludG8uIElmIGFueSBvZiB0aGlzIGlzIHZpb2xhdGVkLCBhbiBlcnJvciBvZiB0eXBlXG4gICAgW2BSZXBsYWNlRXJyb3JgXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuUmVwbGFjZUVycm9yKSBpcyB0aHJvd24uXG4gICAgKi9cbiAgICByZXBsYWNlKGZyb20sIHRvLCBzbGljZSkge1xuICAgICAgICByZXR1cm4gcmVwbGFjZSh0aGlzLnJlc29sdmUoZnJvbSksIHRoaXMucmVzb2x2ZSh0byksIHNsaWNlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgRmluZCB0aGUgbm9kZSBkaXJlY3RseSBhZnRlciB0aGUgZ2l2ZW4gcG9zaXRpb24uXG4gICAgKi9cbiAgICBub2RlQXQocG9zKSB7XG4gICAgICAgIGZvciAobGV0IG5vZGUgPSB0aGlzOzspIHtcbiAgICAgICAgICAgIGxldCB7IGluZGV4LCBvZmZzZXQgfSA9IG5vZGUuY29udGVudC5maW5kSW5kZXgocG9zKTtcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLm1heWJlQ2hpbGQoaW5kZXgpO1xuICAgICAgICAgICAgaWYgKCFub2RlKVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgaWYgKG9mZnNldCA9PSBwb3MgfHwgbm9kZS5pc1RleHQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICBwb3MgLT0gb2Zmc2V0ICsgMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICBGaW5kIHRoZSAoZGlyZWN0KSBjaGlsZCBub2RlIGFmdGVyIHRoZSBnaXZlbiBvZmZzZXQsIGlmIGFueSxcbiAgICBhbmQgcmV0dXJuIGl0IGFsb25nIHdpdGggaXRzIGluZGV4IGFuZCBvZmZzZXQgcmVsYXRpdmUgdG8gdGhpc1xuICAgIG5vZGUuXG4gICAgKi9cbiAgICBjaGlsZEFmdGVyKHBvcykge1xuICAgICAgICBsZXQgeyBpbmRleCwgb2Zmc2V0IH0gPSB0aGlzLmNvbnRlbnQuZmluZEluZGV4KHBvcyk7XG4gICAgICAgIHJldHVybiB7IG5vZGU6IHRoaXMuY29udGVudC5tYXliZUNoaWxkKGluZGV4KSwgaW5kZXgsIG9mZnNldCB9O1xuICAgIH1cbiAgICAvKipcbiAgICBGaW5kIHRoZSAoZGlyZWN0KSBjaGlsZCBub2RlIGJlZm9yZSB0aGUgZ2l2ZW4gb2Zmc2V0LCBpZiBhbnksXG4gICAgYW5kIHJldHVybiBpdCBhbG9uZyB3aXRoIGl0cyBpbmRleCBhbmQgb2Zmc2V0IHJlbGF0aXZlIHRvIHRoaXNcbiAgICBub2RlLlxuICAgICovXG4gICAgY2hpbGRCZWZvcmUocG9zKSB7XG4gICAgICAgIGlmIChwb3MgPT0gMClcbiAgICAgICAgICAgIHJldHVybiB7IG5vZGU6IG51bGwsIGluZGV4OiAwLCBvZmZzZXQ6IDAgfTtcbiAgICAgICAgbGV0IHsgaW5kZXgsIG9mZnNldCB9ID0gdGhpcy5jb250ZW50LmZpbmRJbmRleChwb3MpO1xuICAgICAgICBpZiAob2Zmc2V0IDwgcG9zKVxuICAgICAgICAgICAgcmV0dXJuIHsgbm9kZTogdGhpcy5jb250ZW50LmNoaWxkKGluZGV4KSwgaW5kZXgsIG9mZnNldCB9O1xuICAgICAgICBsZXQgbm9kZSA9IHRoaXMuY29udGVudC5jaGlsZChpbmRleCAtIDEpO1xuICAgICAgICByZXR1cm4geyBub2RlLCBpbmRleDogaW5kZXggLSAxLCBvZmZzZXQ6IG9mZnNldCAtIG5vZGUubm9kZVNpemUgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgUmVzb2x2ZSB0aGUgZ2l2ZW4gcG9zaXRpb24gaW4gdGhlIGRvY3VtZW50LCByZXR1cm5pbmcgYW5cbiAgICBbb2JqZWN0XShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuUmVzb2x2ZWRQb3MpIHdpdGggaW5mb3JtYXRpb24gYWJvdXQgaXRzIGNvbnRleHQuXG4gICAgKi9cbiAgICByZXNvbHZlKHBvcykgeyByZXR1cm4gUmVzb2x2ZWRQb3MucmVzb2x2ZUNhY2hlZCh0aGlzLCBwb3MpOyB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICByZXNvbHZlTm9DYWNoZShwb3MpIHsgcmV0dXJuIFJlc29sdmVkUG9zLnJlc29sdmUodGhpcywgcG9zKTsgfVxuICAgIC8qKlxuICAgIFRlc3Qgd2hldGhlciBhIGdpdmVuIG1hcmsgb3IgbWFyayB0eXBlIG9jY3VycyBpbiB0aGlzIGRvY3VtZW50XG4gICAgYmV0d2VlbiB0aGUgdHdvIGdpdmVuIHBvc2l0aW9ucy5cbiAgICAqL1xuICAgIHJhbmdlSGFzTWFyayhmcm9tLCB0bywgdHlwZSkge1xuICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgaWYgKHRvID4gZnJvbSlcbiAgICAgICAgICAgIHRoaXMubm9kZXNCZXR3ZWVuKGZyb20sIHRvLCBub2RlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZS5pc0luU2V0KG5vZGUubWFya3MpKVxuICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFmb3VuZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgfVxuICAgIC8qKlxuICAgIFRydWUgd2hlbiB0aGlzIGlzIGEgYmxvY2sgKG5vbi1pbmxpbmUgbm9kZSlcbiAgICAqL1xuICAgIGdldCBpc0Jsb2NrKCkgeyByZXR1cm4gdGhpcy50eXBlLmlzQmxvY2s7IH1cbiAgICAvKipcbiAgICBUcnVlIHdoZW4gdGhpcyBpcyBhIHRleHRibG9jayBub2RlLCBhIGJsb2NrIG5vZGUgd2l0aCBpbmxpbmVcbiAgICBjb250ZW50LlxuICAgICovXG4gICAgZ2V0IGlzVGV4dGJsb2NrKCkgeyByZXR1cm4gdGhpcy50eXBlLmlzVGV4dGJsb2NrOyB9XG4gICAgLyoqXG4gICAgVHJ1ZSB3aGVuIHRoaXMgbm9kZSBhbGxvd3MgaW5saW5lIGNvbnRlbnQuXG4gICAgKi9cbiAgICBnZXQgaW5saW5lQ29udGVudCgpIHsgcmV0dXJuIHRoaXMudHlwZS5pbmxpbmVDb250ZW50OyB9XG4gICAgLyoqXG4gICAgVHJ1ZSB3aGVuIHRoaXMgaXMgYW4gaW5saW5lIG5vZGUgKGEgdGV4dCBub2RlIG9yIGEgbm9kZSB0aGF0IGNhblxuICAgIGFwcGVhciBhbW9uZyB0ZXh0KS5cbiAgICAqL1xuICAgIGdldCBpc0lubGluZSgpIHsgcmV0dXJuIHRoaXMudHlwZS5pc0lubGluZTsgfVxuICAgIC8qKlxuICAgIFRydWUgd2hlbiB0aGlzIGlzIGEgdGV4dCBub2RlLlxuICAgICovXG4gICAgZ2V0IGlzVGV4dCgpIHsgcmV0dXJuIHRoaXMudHlwZS5pc1RleHQ7IH1cbiAgICAvKipcbiAgICBUcnVlIHdoZW4gdGhpcyBpcyBhIGxlYWYgbm9kZS5cbiAgICAqL1xuICAgIGdldCBpc0xlYWYoKSB7IHJldHVybiB0aGlzLnR5cGUuaXNMZWFmOyB9XG4gICAgLyoqXG4gICAgVHJ1ZSB3aGVuIHRoaXMgaXMgYW4gYXRvbSwgaS5lLiB3aGVuIGl0IGRvZXMgbm90IGhhdmUgZGlyZWN0bHlcbiAgICBlZGl0YWJsZSBjb250ZW50LiBUaGlzIGlzIHVzdWFsbHkgdGhlIHNhbWUgYXMgYGlzTGVhZmAsIGJ1dCBjYW5cbiAgICBiZSBjb25maWd1cmVkIHdpdGggdGhlIFtgYXRvbWAgcHJvcGVydHldKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5Ob2RlU3BlYy5hdG9tKVxuICAgIG9uIGEgbm9kZSdzIHNwZWMgKHR5cGljYWxseSB1c2VkIHdoZW4gdGhlIG5vZGUgaXMgZGlzcGxheWVkIGFzXG4gICAgYW4gdW5lZGl0YWJsZSBbbm9kZSB2aWV3XShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jdmlldy5Ob2RlVmlldykpLlxuICAgICovXG4gICAgZ2V0IGlzQXRvbSgpIHsgcmV0dXJuIHRoaXMudHlwZS5pc0F0b207IH1cbiAgICAvKipcbiAgICBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBub2RlIGZvciBkZWJ1Z2dpbmdcbiAgICBwdXJwb3Nlcy5cbiAgICAqL1xuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICBpZiAodGhpcy50eXBlLnNwZWMudG9EZWJ1Z1N0cmluZylcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnR5cGUuc3BlYy50b0RlYnVnU3RyaW5nKHRoaXMpO1xuICAgICAgICBsZXQgbmFtZSA9IHRoaXMudHlwZS5uYW1lO1xuICAgICAgICBpZiAodGhpcy5jb250ZW50LnNpemUpXG4gICAgICAgICAgICBuYW1lICs9IFwiKFwiICsgdGhpcy5jb250ZW50LnRvU3RyaW5nSW5uZXIoKSArIFwiKVwiO1xuICAgICAgICByZXR1cm4gd3JhcE1hcmtzKHRoaXMubWFya3MsIG5hbWUpO1xuICAgIH1cbiAgICAvKipcbiAgICBHZXQgdGhlIGNvbnRlbnQgbWF0Y2ggaW4gdGhpcyBub2RlIGF0IHRoZSBnaXZlbiBpbmRleC5cbiAgICAqL1xuICAgIGNvbnRlbnRNYXRjaEF0KGluZGV4KSB7XG4gICAgICAgIGxldCBtYXRjaCA9IHRoaXMudHlwZS5jb250ZW50TWF0Y2gubWF0Y2hGcmFnbWVudCh0aGlzLmNvbnRlbnQsIDAsIGluZGV4KTtcbiAgICAgICAgaWYgKCFtYXRjaClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbGxlZCBjb250ZW50TWF0Y2hBdCBvbiBhIG5vZGUgd2l0aCBpbnZhbGlkIGNvbnRlbnRcIik7XG4gICAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9XG4gICAgLyoqXG4gICAgVGVzdCB3aGV0aGVyIHJlcGxhY2luZyB0aGUgcmFuZ2UgYmV0d2VlbiBgZnJvbWAgYW5kIGB0b2AgKGJ5XG4gICAgY2hpbGQgaW5kZXgpIHdpdGggdGhlIGdpdmVuIHJlcGxhY2VtZW50IGZyYWdtZW50ICh3aGljaCBkZWZhdWx0c1xuICAgIHRvIHRoZSBlbXB0eSBmcmFnbWVudCkgd291bGQgbGVhdmUgdGhlIG5vZGUncyBjb250ZW50IHZhbGlkLiBZb3VcbiAgICBjYW4gb3B0aW9uYWxseSBwYXNzIGBzdGFydGAgYW5kIGBlbmRgIGluZGljZXMgaW50byB0aGVcbiAgICByZXBsYWNlbWVudCBmcmFnbWVudC5cbiAgICAqL1xuICAgIGNhblJlcGxhY2UoZnJvbSwgdG8sIHJlcGxhY2VtZW50ID0gRnJhZ21lbnQuZW1wdHksIHN0YXJ0ID0gMCwgZW5kID0gcmVwbGFjZW1lbnQuY2hpbGRDb3VudCkge1xuICAgICAgICBsZXQgb25lID0gdGhpcy5jb250ZW50TWF0Y2hBdChmcm9tKS5tYXRjaEZyYWdtZW50KHJlcGxhY2VtZW50LCBzdGFydCwgZW5kKTtcbiAgICAgICAgbGV0IHR3byA9IG9uZSAmJiBvbmUubWF0Y2hGcmFnbWVudCh0aGlzLmNvbnRlbnQsIHRvKTtcbiAgICAgICAgaWYgKCF0d28gfHwgIXR3by52YWxpZEVuZClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspXG4gICAgICAgICAgICBpZiAoIXRoaXMudHlwZS5hbGxvd3NNYXJrcyhyZXBsYWNlbWVudC5jaGlsZChpKS5tYXJrcykpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgVGVzdCB3aGV0aGVyIHJlcGxhY2luZyB0aGUgcmFuZ2UgYGZyb21gIHRvIGB0b2AgKGJ5IGluZGV4KSB3aXRoXG4gICAgYSBub2RlIG9mIHRoZSBnaXZlbiB0eXBlIHdvdWxkIGxlYXZlIHRoZSBub2RlJ3MgY29udGVudCB2YWxpZC5cbiAgICAqL1xuICAgIGNhblJlcGxhY2VXaXRoKGZyb20sIHRvLCB0eXBlLCBtYXJrcykge1xuICAgICAgICBpZiAobWFya3MgJiYgIXRoaXMudHlwZS5hbGxvd3NNYXJrcyhtYXJrcykpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGxldCBzdGFydCA9IHRoaXMuY29udGVudE1hdGNoQXQoZnJvbSkubWF0Y2hUeXBlKHR5cGUpO1xuICAgICAgICBsZXQgZW5kID0gc3RhcnQgJiYgc3RhcnQubWF0Y2hGcmFnbWVudCh0aGlzLmNvbnRlbnQsIHRvKTtcbiAgICAgICAgcmV0dXJuIGVuZCA/IGVuZC52YWxpZEVuZCA6IGZhbHNlO1xuICAgIH1cbiAgICAvKipcbiAgICBUZXN0IHdoZXRoZXIgdGhlIGdpdmVuIG5vZGUncyBjb250ZW50IGNvdWxkIGJlIGFwcGVuZGVkIHRvIHRoaXNcbiAgICBub2RlLiBJZiB0aGF0IG5vZGUgaXMgZW1wdHksIHRoaXMgd2lsbCBvbmx5IHJldHVybiB0cnVlIGlmIHRoZXJlXG4gICAgaXMgYXQgbGVhc3Qgb25lIG5vZGUgdHlwZSB0aGF0IGNhbiBhcHBlYXIgaW4gYm90aCBub2RlcyAodG8gYXZvaWRcbiAgICBtZXJnaW5nIGNvbXBsZXRlbHkgaW5jb21wYXRpYmxlIG5vZGVzKS5cbiAgICAqL1xuICAgIGNhbkFwcGVuZChvdGhlcikge1xuICAgICAgICBpZiAob3RoZXIuY29udGVudC5zaXplKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FuUmVwbGFjZSh0aGlzLmNoaWxkQ291bnQsIHRoaXMuY2hpbGRDb3VudCwgb3RoZXIuY29udGVudCk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnR5cGUuY29tcGF0aWJsZUNvbnRlbnQob3RoZXIudHlwZSk7XG4gICAgfVxuICAgIC8qKlxuICAgIENoZWNrIHdoZXRoZXIgdGhpcyBub2RlIGFuZCBpdHMgZGVzY2VuZGFudHMgY29uZm9ybSB0byB0aGVcbiAgICBzY2hlbWEsIGFuZCByYWlzZSBhbiBleGNlcHRpb24gd2hlbiB0aGV5IGRvIG5vdC5cbiAgICAqL1xuICAgIGNoZWNrKCkge1xuICAgICAgICB0aGlzLnR5cGUuY2hlY2tDb250ZW50KHRoaXMuY29udGVudCk7XG4gICAgICAgIHRoaXMudHlwZS5jaGVja0F0dHJzKHRoaXMuYXR0cnMpO1xuICAgICAgICBsZXQgY29weSA9IE1hcmsubm9uZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm1hcmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgbWFyayA9IHRoaXMubWFya3NbaV07XG4gICAgICAgICAgICBtYXJrLnR5cGUuY2hlY2tBdHRycyhtYXJrLmF0dHJzKTtcbiAgICAgICAgICAgIGNvcHkgPSBtYXJrLmFkZFRvU2V0KGNvcHkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghTWFyay5zYW1lU2V0KGNvcHksIHRoaXMubWFya3MpKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYEludmFsaWQgY29sbGVjdGlvbiBvZiBtYXJrcyBmb3Igbm9kZSAke3RoaXMudHlwZS5uYW1lfTogJHt0aGlzLm1hcmtzLm1hcChtID0+IG0udHlwZS5uYW1lKX1gKTtcbiAgICAgICAgdGhpcy5jb250ZW50LmZvckVhY2gobm9kZSA9PiBub2RlLmNoZWNrKCkpO1xuICAgIH1cbiAgICAvKipcbiAgICBSZXR1cm4gYSBKU09OLXNlcmlhbGl6ZWFibGUgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBub2RlLlxuICAgICovXG4gICAgdG9KU09OKCkge1xuICAgICAgICBsZXQgb2JqID0geyB0eXBlOiB0aGlzLnR5cGUubmFtZSB9O1xuICAgICAgICBmb3IgKGxldCBfIGluIHRoaXMuYXR0cnMpIHtcbiAgICAgICAgICAgIG9iai5hdHRycyA9IHRoaXMuYXR0cnM7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jb250ZW50LnNpemUpXG4gICAgICAgICAgICBvYmouY29udGVudCA9IHRoaXMuY29udGVudC50b0pTT04oKTtcbiAgICAgICAgaWYgKHRoaXMubWFya3MubGVuZ3RoKVxuICAgICAgICAgICAgb2JqLm1hcmtzID0gdGhpcy5tYXJrcy5tYXAobiA9PiBuLnRvSlNPTigpKTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG4gICAgLyoqXG4gICAgRGVzZXJpYWxpemUgYSBub2RlIGZyb20gaXRzIEpTT04gcmVwcmVzZW50YXRpb24uXG4gICAgKi9cbiAgICBzdGF0aWMgZnJvbUpTT04oc2NoZW1hLCBqc29uKSB7XG4gICAgICAgIGlmICghanNvbilcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiSW52YWxpZCBpbnB1dCBmb3IgTm9kZS5mcm9tSlNPTlwiKTtcbiAgICAgICAgbGV0IG1hcmtzID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAoanNvbi5tYXJrcykge1xuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGpzb24ubWFya3MpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiSW52YWxpZCBtYXJrIGRhdGEgZm9yIE5vZGUuZnJvbUpTT05cIik7XG4gICAgICAgICAgICBtYXJrcyA9IGpzb24ubWFya3MubWFwKHNjaGVtYS5tYXJrRnJvbUpTT04pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqc29uLnR5cGUgPT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YganNvbi50ZXh0ICE9IFwic3RyaW5nXCIpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbnZhbGlkIHRleHQgbm9kZSBpbiBKU09OXCIpO1xuICAgICAgICAgICAgcmV0dXJuIHNjaGVtYS50ZXh0KGpzb24udGV4dCwgbWFya3MpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjb250ZW50ID0gRnJhZ21lbnQuZnJvbUpTT04oc2NoZW1hLCBqc29uLmNvbnRlbnQpO1xuICAgICAgICBsZXQgbm9kZSA9IHNjaGVtYS5ub2RlVHlwZShqc29uLnR5cGUpLmNyZWF0ZShqc29uLmF0dHJzLCBjb250ZW50LCBtYXJrcyk7XG4gICAgICAgIG5vZGUudHlwZS5jaGVja0F0dHJzKG5vZGUuYXR0cnMpO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG59XG5Ob2RlLnByb3RvdHlwZS50ZXh0ID0gdW5kZWZpbmVkO1xuY2xhc3MgVGV4dE5vZGUgZXh0ZW5kcyBOb2RlIHtcbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHR5cGUsIGF0dHJzLCBjb250ZW50LCBtYXJrcykge1xuICAgICAgICBzdXBlcih0eXBlLCBhdHRycywgbnVsbCwgbWFya3MpO1xuICAgICAgICBpZiAoIWNvbnRlbnQpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkVtcHR5IHRleHQgbm9kZXMgYXJlIG5vdCBhbGxvd2VkXCIpO1xuICAgICAgICB0aGlzLnRleHQgPSBjb250ZW50O1xuICAgIH1cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgaWYgKHRoaXMudHlwZS5zcGVjLnRvRGVidWdTdHJpbmcpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy50eXBlLnNwZWMudG9EZWJ1Z1N0cmluZyh0aGlzKTtcbiAgICAgICAgcmV0dXJuIHdyYXBNYXJrcyh0aGlzLm1hcmtzLCBKU09OLnN0cmluZ2lmeSh0aGlzLnRleHQpKTtcbiAgICB9XG4gICAgZ2V0IHRleHRDb250ZW50KCkgeyByZXR1cm4gdGhpcy50ZXh0OyB9XG4gICAgdGV4dEJldHdlZW4oZnJvbSwgdG8pIHsgcmV0dXJuIHRoaXMudGV4dC5zbGljZShmcm9tLCB0byk7IH1cbiAgICBnZXQgbm9kZVNpemUoKSB7IHJldHVybiB0aGlzLnRleHQubGVuZ3RoOyB9XG4gICAgbWFyayhtYXJrcykge1xuICAgICAgICByZXR1cm4gbWFya3MgPT0gdGhpcy5tYXJrcyA/IHRoaXMgOiBuZXcgVGV4dE5vZGUodGhpcy50eXBlLCB0aGlzLmF0dHJzLCB0aGlzLnRleHQsIG1hcmtzKTtcbiAgICB9XG4gICAgd2l0aFRleHQodGV4dCkge1xuICAgICAgICBpZiAodGV4dCA9PSB0aGlzLnRleHQpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgcmV0dXJuIG5ldyBUZXh0Tm9kZSh0aGlzLnR5cGUsIHRoaXMuYXR0cnMsIHRleHQsIHRoaXMubWFya3MpO1xuICAgIH1cbiAgICBjdXQoZnJvbSA9IDAsIHRvID0gdGhpcy50ZXh0Lmxlbmd0aCkge1xuICAgICAgICBpZiAoZnJvbSA9PSAwICYmIHRvID09IHRoaXMudGV4dC5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgcmV0dXJuIHRoaXMud2l0aFRleHQodGhpcy50ZXh0LnNsaWNlKGZyb20sIHRvKSk7XG4gICAgfVxuICAgIGVxKG90aGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNhbWVNYXJrdXAob3RoZXIpICYmIHRoaXMudGV4dCA9PSBvdGhlci50ZXh0O1xuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIGxldCBiYXNlID0gc3VwZXIudG9KU09OKCk7XG4gICAgICAgIGJhc2UudGV4dCA9IHRoaXMudGV4dDtcbiAgICAgICAgcmV0dXJuIGJhc2U7XG4gICAgfVxufVxuZnVuY3Rpb24gd3JhcE1hcmtzKG1hcmtzLCBzdHIpIHtcbiAgICBmb3IgKGxldCBpID0gbWFya3MubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXG4gICAgICAgIHN0ciA9IG1hcmtzW2ldLnR5cGUubmFtZSArIFwiKFwiICsgc3RyICsgXCIpXCI7XG4gICAgcmV0dXJuIHN0cjtcbn1cblxuLyoqXG5JbnN0YW5jZXMgb2YgdGhpcyBjbGFzcyByZXByZXNlbnQgYSBtYXRjaCBzdGF0ZSBvZiBhIG5vZGUgdHlwZSdzXG5bY29udGVudCBleHByZXNzaW9uXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTm9kZVNwZWMuY29udGVudCksIGFuZCBjYW4gYmUgdXNlZCB0b1xuZmluZCBvdXQgd2hldGhlciBmdXJ0aGVyIGNvbnRlbnQgbWF0Y2hlcyBoZXJlLCBhbmQgd2hldGhlciBhIGdpdmVuXG5wb3NpdGlvbiBpcyBhIHZhbGlkIGVuZCBvZiB0aGUgbm9kZS5cbiovXG5jbGFzcyBDb250ZW50TWF0Y2gge1xuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgLyoqXG4gICAgVHJ1ZSB3aGVuIHRoaXMgbWF0Y2ggc3RhdGUgcmVwcmVzZW50cyBhIHZhbGlkIGVuZCBvZiB0aGUgbm9kZS5cbiAgICAqL1xuICAgIHZhbGlkRW5kKSB7XG4gICAgICAgIHRoaXMudmFsaWRFbmQgPSB2YWxpZEVuZDtcbiAgICAgICAgLyoqXG4gICAgICAgIEBpbnRlcm5hbFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLm5leHQgPSBbXTtcbiAgICAgICAgLyoqXG4gICAgICAgIEBpbnRlcm5hbFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLndyYXBDYWNoZSA9IFtdO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHN0YXRpYyBwYXJzZShzdHJpbmcsIG5vZGVUeXBlcykge1xuICAgICAgICBsZXQgc3RyZWFtID0gbmV3IFRva2VuU3RyZWFtKHN0cmluZywgbm9kZVR5cGVzKTtcbiAgICAgICAgaWYgKHN0cmVhbS5uZXh0ID09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gQ29udGVudE1hdGNoLmVtcHR5O1xuICAgICAgICBsZXQgZXhwciA9IHBhcnNlRXhwcihzdHJlYW0pO1xuICAgICAgICBpZiAoc3RyZWFtLm5leHQpXG4gICAgICAgICAgICBzdHJlYW0uZXJyKFwiVW5leHBlY3RlZCB0cmFpbGluZyB0ZXh0XCIpO1xuICAgICAgICBsZXQgbWF0Y2ggPSBkZmEobmZhKGV4cHIpKTtcbiAgICAgICAgY2hlY2tGb3JEZWFkRW5kcyhtYXRjaCwgc3RyZWFtKTtcbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH1cbiAgICAvKipcbiAgICBNYXRjaCBhIG5vZGUgdHlwZSwgcmV0dXJuaW5nIGEgbWF0Y2ggYWZ0ZXIgdGhhdCBub2RlIGlmXG4gICAgc3VjY2Vzc2Z1bC5cbiAgICAqL1xuICAgIG1hdGNoVHlwZSh0eXBlKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uZXh0Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaWYgKHRoaXMubmV4dFtpXS50eXBlID09IHR5cGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dFtpXS5uZXh0O1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgLyoqXG4gICAgVHJ5IHRvIG1hdGNoIGEgZnJhZ21lbnQuIFJldHVybnMgdGhlIHJlc3VsdGluZyBtYXRjaCB3aGVuXG4gICAgc3VjY2Vzc2Z1bC5cbiAgICAqL1xuICAgIG1hdGNoRnJhZ21lbnQoZnJhZywgc3RhcnQgPSAwLCBlbmQgPSBmcmFnLmNoaWxkQ291bnQpIHtcbiAgICAgICAgbGV0IGN1ciA9IHRoaXM7XG4gICAgICAgIGZvciAobGV0IGkgPSBzdGFydDsgY3VyICYmIGkgPCBlbmQ7IGkrKylcbiAgICAgICAgICAgIGN1ciA9IGN1ci5tYXRjaFR5cGUoZnJhZy5jaGlsZChpKS50eXBlKTtcbiAgICAgICAgcmV0dXJuIGN1cjtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBnZXQgaW5saW5lQ29udGVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dC5sZW5ndGggIT0gMCAmJiB0aGlzLm5leHRbMF0udHlwZS5pc0lubGluZTtcbiAgICB9XG4gICAgLyoqXG4gICAgR2V0IHRoZSBmaXJzdCBtYXRjaGluZyBub2RlIHR5cGUgYXQgdGhpcyBtYXRjaCBwb3NpdGlvbiB0aGF0IGNhblxuICAgIGJlIGdlbmVyYXRlZC5cbiAgICAqL1xuICAgIGdldCBkZWZhdWx0VHlwZSgpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5leHQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCB7IHR5cGUgfSA9IHRoaXMubmV4dFtpXTtcbiAgICAgICAgICAgIGlmICghKHR5cGUuaXNUZXh0IHx8IHR5cGUuaGFzUmVxdWlyZWRBdHRycygpKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBjb21wYXRpYmxlKG90aGVyKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uZXh0Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBvdGhlci5uZXh0Lmxlbmd0aDsgaisrKVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5leHRbaV0udHlwZSA9PSBvdGhlci5uZXh0W2pdLnR5cGUpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8qKlxuICAgIFRyeSB0byBtYXRjaCB0aGUgZ2l2ZW4gZnJhZ21lbnQsIGFuZCBpZiB0aGF0IGZhaWxzLCBzZWUgaWYgaXQgY2FuXG4gICAgYmUgbWFkZSB0byBtYXRjaCBieSBpbnNlcnRpbmcgbm9kZXMgaW4gZnJvbnQgb2YgaXQuIFdoZW5cbiAgICBzdWNjZXNzZnVsLCByZXR1cm4gYSBmcmFnbWVudCBvZiBpbnNlcnRlZCBub2RlcyAod2hpY2ggbWF5IGJlXG4gICAgZW1wdHkgaWYgbm90aGluZyBoYWQgdG8gYmUgaW5zZXJ0ZWQpLiBXaGVuIGB0b0VuZGAgaXMgdHJ1ZSwgb25seVxuICAgIHJldHVybiBhIGZyYWdtZW50IGlmIHRoZSByZXN1bHRpbmcgbWF0Y2ggZ29lcyB0byB0aGUgZW5kIG9mIHRoZVxuICAgIGNvbnRlbnQgZXhwcmVzc2lvbi5cbiAgICAqL1xuICAgIGZpbGxCZWZvcmUoYWZ0ZXIsIHRvRW5kID0gZmFsc2UsIHN0YXJ0SW5kZXggPSAwKSB7XG4gICAgICAgIGxldCBzZWVuID0gW3RoaXNdO1xuICAgICAgICBmdW5jdGlvbiBzZWFyY2gobWF0Y2gsIHR5cGVzKSB7XG4gICAgICAgICAgICBsZXQgZmluaXNoZWQgPSBtYXRjaC5tYXRjaEZyYWdtZW50KGFmdGVyLCBzdGFydEluZGV4KTtcbiAgICAgICAgICAgIGlmIChmaW5pc2hlZCAmJiAoIXRvRW5kIHx8IGZpbmlzaGVkLnZhbGlkRW5kKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gRnJhZ21lbnQuZnJvbSh0eXBlcy5tYXAodHAgPT4gdHAuY3JlYXRlQW5kRmlsbCgpKSk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoLm5leHQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgeyB0eXBlLCBuZXh0IH0gPSBtYXRjaC5uZXh0W2ldO1xuICAgICAgICAgICAgICAgIGlmICghKHR5cGUuaXNUZXh0IHx8IHR5cGUuaGFzUmVxdWlyZWRBdHRycygpKSAmJiBzZWVuLmluZGV4T2YobmV4dCkgPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2Vlbi5wdXNoKG5leHQpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmQgPSBzZWFyY2gobmV4dCwgdHlwZXMuY29uY2F0KHR5cGUpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZWFyY2godGhpcywgW10pO1xuICAgIH1cbiAgICAvKipcbiAgICBGaW5kIGEgc2V0IG9mIHdyYXBwaW5nIG5vZGUgdHlwZXMgdGhhdCB3b3VsZCBhbGxvdyBhIG5vZGUgb2YgdGhlXG4gICAgZ2l2ZW4gdHlwZSB0byBhcHBlYXIgYXQgdGhpcyBwb3NpdGlvbi4gVGhlIHJlc3VsdCBtYXkgYmUgZW1wdHlcbiAgICAod2hlbiBpdCBmaXRzIGRpcmVjdGx5KSBhbmQgd2lsbCBiZSBudWxsIHdoZW4gbm8gc3VjaCB3cmFwcGluZ1xuICAgIGV4aXN0cy5cbiAgICAqL1xuICAgIGZpbmRXcmFwcGluZyh0YXJnZXQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndyYXBDYWNoZS5sZW5ndGg7IGkgKz0gMilcbiAgICAgICAgICAgIGlmICh0aGlzLndyYXBDYWNoZVtpXSA9PSB0YXJnZXQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud3JhcENhY2hlW2kgKyAxXTtcbiAgICAgICAgbGV0IGNvbXB1dGVkID0gdGhpcy5jb21wdXRlV3JhcHBpbmcodGFyZ2V0KTtcbiAgICAgICAgdGhpcy53cmFwQ2FjaGUucHVzaCh0YXJnZXQsIGNvbXB1dGVkKTtcbiAgICAgICAgcmV0dXJuIGNvbXB1dGVkO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIGNvbXB1dGVXcmFwcGluZyh0YXJnZXQpIHtcbiAgICAgICAgbGV0IHNlZW4gPSBPYmplY3QuY3JlYXRlKG51bGwpLCBhY3RpdmUgPSBbeyBtYXRjaDogdGhpcywgdHlwZTogbnVsbCwgdmlhOiBudWxsIH1dO1xuICAgICAgICB3aGlsZSAoYWN0aXZlLmxlbmd0aCkge1xuICAgICAgICAgICAgbGV0IGN1cnJlbnQgPSBhY3RpdmUuc2hpZnQoKSwgbWF0Y2ggPSBjdXJyZW50Lm1hdGNoO1xuICAgICAgICAgICAgaWYgKG1hdGNoLm1hdGNoVHlwZSh0YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IG9iaiA9IGN1cnJlbnQ7IG9iai50eXBlOyBvYmogPSBvYmoudmlhKVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChvYmoudHlwZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5yZXZlcnNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoLm5leHQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgeyB0eXBlLCBuZXh0IH0gPSBtYXRjaC5uZXh0W2ldO1xuICAgICAgICAgICAgICAgIGlmICghdHlwZS5pc0xlYWYgJiYgIXR5cGUuaGFzUmVxdWlyZWRBdHRycygpICYmICEodHlwZS5uYW1lIGluIHNlZW4pICYmICghY3VycmVudC50eXBlIHx8IG5leHQudmFsaWRFbmQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZS5wdXNoKHsgbWF0Y2g6IHR5cGUuY29udGVudE1hdGNoLCB0eXBlLCB2aWE6IGN1cnJlbnQgfSk7XG4gICAgICAgICAgICAgICAgICAgIHNlZW5bdHlwZS5uYW1lXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICAvKipcbiAgICBUaGUgbnVtYmVyIG9mIG91dGdvaW5nIGVkZ2VzIHRoaXMgbm9kZSBoYXMgaW4gdGhlIGZpbml0ZVxuICAgIGF1dG9tYXRvbiB0aGF0IGRlc2NyaWJlcyB0aGUgY29udGVudCBleHByZXNzaW9uLlxuICAgICovXG4gICAgZ2V0IGVkZ2VDb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dC5sZW5ndGg7XG4gICAgfVxuICAgIC8qKlxuICAgIEdldCB0aGUgX25fXHUyMDBCdGggb3V0Z29pbmcgZWRnZSBmcm9tIHRoaXMgbm9kZSBpbiB0aGUgZmluaXRlXG4gICAgYXV0b21hdG9uIHRoYXQgZGVzY3JpYmVzIHRoZSBjb250ZW50IGV4cHJlc3Npb24uXG4gICAgKi9cbiAgICBlZGdlKG4pIHtcbiAgICAgICAgaWYgKG4gPj0gdGhpcy5uZXh0Lmxlbmd0aClcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKGBUaGVyZSdzIG5vICR7bn10aCBlZGdlIGluIHRoaXMgY29udGVudCBtYXRjaGApO1xuICAgICAgICByZXR1cm4gdGhpcy5uZXh0W25dO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICBsZXQgc2VlbiA9IFtdO1xuICAgICAgICBmdW5jdGlvbiBzY2FuKG0pIHtcbiAgICAgICAgICAgIHNlZW4ucHVzaChtKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbS5uZXh0Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgIGlmIChzZWVuLmluZGV4T2YobS5uZXh0W2ldLm5leHQpID09IC0xKVxuICAgICAgICAgICAgICAgICAgICBzY2FuKG0ubmV4dFtpXS5uZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBzY2FuKHRoaXMpO1xuICAgICAgICByZXR1cm4gc2Vlbi5tYXAoKG0sIGkpID0+IHtcbiAgICAgICAgICAgIGxldCBvdXQgPSBpICsgKG0udmFsaWRFbmQgPyBcIipcIiA6IFwiIFwiKSArIFwiIFwiO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtLm5leHQubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICAgICAgb3V0ICs9IChpID8gXCIsIFwiIDogXCJcIikgKyBtLm5leHRbaV0udHlwZS5uYW1lICsgXCItPlwiICsgc2Vlbi5pbmRleE9mKG0ubmV4dFtpXS5uZXh0KTtcbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH0pLmpvaW4oXCJcXG5cIik7XG4gICAgfVxufVxuLyoqXG5AaW50ZXJuYWxcbiovXG5Db250ZW50TWF0Y2guZW1wdHkgPSBuZXcgQ29udGVudE1hdGNoKHRydWUpO1xuY2xhc3MgVG9rZW5TdHJlYW0ge1xuICAgIGNvbnN0cnVjdG9yKHN0cmluZywgbm9kZVR5cGVzKSB7XG4gICAgICAgIHRoaXMuc3RyaW5nID0gc3RyaW5nO1xuICAgICAgICB0aGlzLm5vZGVUeXBlcyA9IG5vZGVUeXBlcztcbiAgICAgICAgdGhpcy5pbmxpbmUgPSBudWxsO1xuICAgICAgICB0aGlzLnBvcyA9IDA7XG4gICAgICAgIHRoaXMudG9rZW5zID0gc3RyaW5nLnNwbGl0KC9cXHMqKD89XFxifFxcV3wkKS8pO1xuICAgICAgICBpZiAodGhpcy50b2tlbnNbdGhpcy50b2tlbnMubGVuZ3RoIC0gMV0gPT0gXCJcIilcbiAgICAgICAgICAgIHRoaXMudG9rZW5zLnBvcCgpO1xuICAgICAgICBpZiAodGhpcy50b2tlbnNbMF0gPT0gXCJcIilcbiAgICAgICAgICAgIHRoaXMudG9rZW5zLnNoaWZ0KCk7XG4gICAgfVxuICAgIGdldCBuZXh0KCkgeyByZXR1cm4gdGhpcy50b2tlbnNbdGhpcy5wb3NdOyB9XG4gICAgZWF0KHRvaykgeyByZXR1cm4gdGhpcy5uZXh0ID09IHRvayAmJiAodGhpcy5wb3MrKyB8fCB0cnVlKTsgfVxuICAgIGVycihzdHIpIHsgdGhyb3cgbmV3IFN5bnRheEVycm9yKHN0ciArIFwiIChpbiBjb250ZW50IGV4cHJlc3Npb24gJ1wiICsgdGhpcy5zdHJpbmcgKyBcIicpXCIpOyB9XG59XG5mdW5jdGlvbiBwYXJzZUV4cHIoc3RyZWFtKSB7XG4gICAgbGV0IGV4cHJzID0gW107XG4gICAgZG8ge1xuICAgICAgICBleHBycy5wdXNoKHBhcnNlRXhwclNlcShzdHJlYW0pKTtcbiAgICB9IHdoaWxlIChzdHJlYW0uZWF0KFwifFwiKSk7XG4gICAgcmV0dXJuIGV4cHJzLmxlbmd0aCA9PSAxID8gZXhwcnNbMF0gOiB7IHR5cGU6IFwiY2hvaWNlXCIsIGV4cHJzIH07XG59XG5mdW5jdGlvbiBwYXJzZUV4cHJTZXEoc3RyZWFtKSB7XG4gICAgbGV0IGV4cHJzID0gW107XG4gICAgZG8ge1xuICAgICAgICBleHBycy5wdXNoKHBhcnNlRXhwclN1YnNjcmlwdChzdHJlYW0pKTtcbiAgICB9IHdoaWxlIChzdHJlYW0ubmV4dCAmJiBzdHJlYW0ubmV4dCAhPSBcIilcIiAmJiBzdHJlYW0ubmV4dCAhPSBcInxcIik7XG4gICAgcmV0dXJuIGV4cHJzLmxlbmd0aCA9PSAxID8gZXhwcnNbMF0gOiB7IHR5cGU6IFwic2VxXCIsIGV4cHJzIH07XG59XG5mdW5jdGlvbiBwYXJzZUV4cHJTdWJzY3JpcHQoc3RyZWFtKSB7XG4gICAgbGV0IGV4cHIgPSBwYXJzZUV4cHJBdG9tKHN0cmVhbSk7XG4gICAgZm9yICg7Oykge1xuICAgICAgICBpZiAoc3RyZWFtLmVhdChcIitcIikpXG4gICAgICAgICAgICBleHByID0geyB0eXBlOiBcInBsdXNcIiwgZXhwciB9O1xuICAgICAgICBlbHNlIGlmIChzdHJlYW0uZWF0KFwiKlwiKSlcbiAgICAgICAgICAgIGV4cHIgPSB7IHR5cGU6IFwic3RhclwiLCBleHByIH07XG4gICAgICAgIGVsc2UgaWYgKHN0cmVhbS5lYXQoXCI/XCIpKVxuICAgICAgICAgICAgZXhwciA9IHsgdHlwZTogXCJvcHRcIiwgZXhwciB9O1xuICAgICAgICBlbHNlIGlmIChzdHJlYW0uZWF0KFwie1wiKSlcbiAgICAgICAgICAgIGV4cHIgPSBwYXJzZUV4cHJSYW5nZShzdHJlYW0sIGV4cHIpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGV4cHI7XG59XG5mdW5jdGlvbiBwYXJzZU51bShzdHJlYW0pIHtcbiAgICBpZiAoL1xcRC8udGVzdChzdHJlYW0ubmV4dCkpXG4gICAgICAgIHN0cmVhbS5lcnIoXCJFeHBlY3RlZCBudW1iZXIsIGdvdCAnXCIgKyBzdHJlYW0ubmV4dCArIFwiJ1wiKTtcbiAgICBsZXQgcmVzdWx0ID0gTnVtYmVyKHN0cmVhbS5uZXh0KTtcbiAgICBzdHJlYW0ucG9zKys7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIHBhcnNlRXhwclJhbmdlKHN0cmVhbSwgZXhwcikge1xuICAgIGxldCBtaW4gPSBwYXJzZU51bShzdHJlYW0pLCBtYXggPSBtaW47XG4gICAgaWYgKHN0cmVhbS5lYXQoXCIsXCIpKSB7XG4gICAgICAgIGlmIChzdHJlYW0ubmV4dCAhPSBcIn1cIilcbiAgICAgICAgICAgIG1heCA9IHBhcnNlTnVtKHN0cmVhbSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG1heCA9IC0xO1xuICAgIH1cbiAgICBpZiAoIXN0cmVhbS5lYXQoXCJ9XCIpKVxuICAgICAgICBzdHJlYW0uZXJyKFwiVW5jbG9zZWQgYnJhY2VkIHJhbmdlXCIpO1xuICAgIHJldHVybiB7IHR5cGU6IFwicmFuZ2VcIiwgbWluLCBtYXgsIGV4cHIgfTtcbn1cbmZ1bmN0aW9uIHJlc29sdmVOYW1lKHN0cmVhbSwgbmFtZSkge1xuICAgIGxldCB0eXBlcyA9IHN0cmVhbS5ub2RlVHlwZXMsIHR5cGUgPSB0eXBlc1tuYW1lXTtcbiAgICBpZiAodHlwZSlcbiAgICAgICAgcmV0dXJuIFt0eXBlXTtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgZm9yIChsZXQgdHlwZU5hbWUgaW4gdHlwZXMpIHtcbiAgICAgICAgbGV0IHR5cGUgPSB0eXBlc1t0eXBlTmFtZV07XG4gICAgICAgIGlmICh0eXBlLmdyb3Vwcy5pbmRleE9mKG5hbWUpID4gLTEpXG4gICAgICAgICAgICByZXN1bHQucHVzaCh0eXBlKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC5sZW5ndGggPT0gMClcbiAgICAgICAgc3RyZWFtLmVycihcIk5vIG5vZGUgdHlwZSBvciBncm91cCAnXCIgKyBuYW1lICsgXCInIGZvdW5kXCIpO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBwYXJzZUV4cHJBdG9tKHN0cmVhbSkge1xuICAgIGlmIChzdHJlYW0uZWF0KFwiKFwiKSkge1xuICAgICAgICBsZXQgZXhwciA9IHBhcnNlRXhwcihzdHJlYW0pO1xuICAgICAgICBpZiAoIXN0cmVhbS5lYXQoXCIpXCIpKVxuICAgICAgICAgICAgc3RyZWFtLmVycihcIk1pc3NpbmcgY2xvc2luZyBwYXJlblwiKTtcbiAgICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuICAgIGVsc2UgaWYgKCEvXFxXLy50ZXN0KHN0cmVhbS5uZXh0KSkge1xuICAgICAgICBsZXQgZXhwcnMgPSByZXNvbHZlTmFtZShzdHJlYW0sIHN0cmVhbS5uZXh0KS5tYXAodHlwZSA9PiB7XG4gICAgICAgICAgICBpZiAoc3RyZWFtLmlubGluZSA9PSBudWxsKVxuICAgICAgICAgICAgICAgIHN0cmVhbS5pbmxpbmUgPSB0eXBlLmlzSW5saW5lO1xuICAgICAgICAgICAgZWxzZSBpZiAoc3RyZWFtLmlubGluZSAhPSB0eXBlLmlzSW5saW5lKVxuICAgICAgICAgICAgICAgIHN0cmVhbS5lcnIoXCJNaXhpbmcgaW5saW5lIGFuZCBibG9jayBjb250ZW50XCIpO1xuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJuYW1lXCIsIHZhbHVlOiB0eXBlIH07XG4gICAgICAgIH0pO1xuICAgICAgICBzdHJlYW0ucG9zKys7XG4gICAgICAgIHJldHVybiBleHBycy5sZW5ndGggPT0gMSA/IGV4cHJzWzBdIDogeyB0eXBlOiBcImNob2ljZVwiLCBleHBycyB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgc3RyZWFtLmVycihcIlVuZXhwZWN0ZWQgdG9rZW4gJ1wiICsgc3RyZWFtLm5leHQgKyBcIidcIik7XG4gICAgfVxufVxuLyoqXG5Db25zdHJ1Y3QgYW4gTkZBIGZyb20gYW4gZXhwcmVzc2lvbiBhcyByZXR1cm5lZCBieSB0aGUgcGFyc2VyLiBUaGVcbk5GQSBpcyByZXByZXNlbnRlZCBhcyBhbiBhcnJheSBvZiBzdGF0ZXMsIHdoaWNoIGFyZSB0aGVtc2VsdmVzXG5hcnJheXMgb2YgZWRnZXMsIHdoaWNoIGFyZSBge3Rlcm0sIHRvfWAgb2JqZWN0cy4gVGhlIGZpcnN0IHN0YXRlIGlzXG50aGUgZW50cnkgc3RhdGUgYW5kIHRoZSBsYXN0IG5vZGUgaXMgdGhlIHN1Y2Nlc3Mgc3RhdGUuXG5cbk5vdGUgdGhhdCB1bmxpa2UgdHlwaWNhbCBORkFzLCB0aGUgZWRnZSBvcmRlcmluZyBpbiB0aGlzIG9uZSBpc1xuc2lnbmlmaWNhbnQsIGluIHRoYXQgaXQgaXMgdXNlZCB0byBjb250cnVjdCBmaWxsZXIgY29udGVudCB3aGVuXG5uZWNlc3NhcnkuXG4qL1xuZnVuY3Rpb24gbmZhKGV4cHIpIHtcbiAgICBsZXQgbmZhID0gW1tdXTtcbiAgICBjb25uZWN0KGNvbXBpbGUoZXhwciwgMCksIG5vZGUoKSk7XG4gICAgcmV0dXJuIG5mYTtcbiAgICBmdW5jdGlvbiBub2RlKCkgeyByZXR1cm4gbmZhLnB1c2goW10pIC0gMTsgfVxuICAgIGZ1bmN0aW9uIGVkZ2UoZnJvbSwgdG8sIHRlcm0pIHtcbiAgICAgICAgbGV0IGVkZ2UgPSB7IHRlcm0sIHRvIH07XG4gICAgICAgIG5mYVtmcm9tXS5wdXNoKGVkZ2UpO1xuICAgICAgICByZXR1cm4gZWRnZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY29ubmVjdChlZGdlcywgdG8pIHtcbiAgICAgICAgZWRnZXMuZm9yRWFjaChlZGdlID0+IGVkZ2UudG8gPSB0byk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNvbXBpbGUoZXhwciwgZnJvbSkge1xuICAgICAgICBpZiAoZXhwci50eXBlID09IFwiY2hvaWNlXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBleHByLmV4cHJzLnJlZHVjZSgob3V0LCBleHByKSA9PiBvdXQuY29uY2F0KGNvbXBpbGUoZXhwciwgZnJvbSkpLCBbXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZXhwci50eXBlID09IFwic2VxXCIpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOzsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5leHQgPSBjb21waWxlKGV4cHIuZXhwcnNbaV0sIGZyb20pO1xuICAgICAgICAgICAgICAgIGlmIChpID09IGV4cHIuZXhwcnMubGVuZ3RoIC0gMSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHQ7XG4gICAgICAgICAgICAgICAgY29ubmVjdChuZXh0LCBmcm9tID0gbm9kZSgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChleHByLnR5cGUgPT0gXCJzdGFyXCIpIHtcbiAgICAgICAgICAgIGxldCBsb29wID0gbm9kZSgpO1xuICAgICAgICAgICAgZWRnZShmcm9tLCBsb29wKTtcbiAgICAgICAgICAgIGNvbm5lY3QoY29tcGlsZShleHByLmV4cHIsIGxvb3ApLCBsb29wKTtcbiAgICAgICAgICAgIHJldHVybiBbZWRnZShsb29wKV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZXhwci50eXBlID09IFwicGx1c1wiKSB7XG4gICAgICAgICAgICBsZXQgbG9vcCA9IG5vZGUoKTtcbiAgICAgICAgICAgIGNvbm5lY3QoY29tcGlsZShleHByLmV4cHIsIGZyb20pLCBsb29wKTtcbiAgICAgICAgICAgIGNvbm5lY3QoY29tcGlsZShleHByLmV4cHIsIGxvb3ApLCBsb29wKTtcbiAgICAgICAgICAgIHJldHVybiBbZWRnZShsb29wKV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZXhwci50eXBlID09IFwib3B0XCIpIHtcbiAgICAgICAgICAgIHJldHVybiBbZWRnZShmcm9tKV0uY29uY2F0KGNvbXBpbGUoZXhwci5leHByLCBmcm9tKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZXhwci50eXBlID09IFwicmFuZ2VcIikge1xuICAgICAgICAgICAgbGV0IGN1ciA9IGZyb207XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV4cHIubWluOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgbmV4dCA9IG5vZGUoKTtcbiAgICAgICAgICAgICAgICBjb25uZWN0KGNvbXBpbGUoZXhwci5leHByLCBjdXIpLCBuZXh0KTtcbiAgICAgICAgICAgICAgICBjdXIgPSBuZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGV4cHIubWF4ID09IC0xKSB7XG4gICAgICAgICAgICAgICAgY29ubmVjdChjb21waWxlKGV4cHIuZXhwciwgY3VyKSwgY3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBleHByLm1pbjsgaSA8IGV4cHIubWF4OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5leHQgPSBub2RlKCk7XG4gICAgICAgICAgICAgICAgICAgIGVkZ2UoY3VyLCBuZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdChjb21waWxlKGV4cHIuZXhwciwgY3VyKSwgbmV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGN1ciA9IG5leHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFtlZGdlKGN1cildO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGV4cHIudHlwZSA9PSBcIm5hbWVcIikge1xuICAgICAgICAgICAgcmV0dXJuIFtlZGdlKGZyb20sIHVuZGVmaW5lZCwgZXhwci52YWx1ZSldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBleHByIHR5cGVcIik7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBjbXAoYSwgYikgeyByZXR1cm4gYiAtIGE7IH1cbi8vIEdldCB0aGUgc2V0IG9mIG5vZGVzIHJlYWNoYWJsZSBieSBudWxsIGVkZ2VzIGZyb20gYG5vZGVgLiBPbWl0XG4vLyBub2RlcyB3aXRoIG9ubHkgYSBzaW5nbGUgbnVsbC1vdXQtZWRnZSwgc2luY2UgdGhleSBtYXkgbGVhZCB0b1xuLy8gbmVlZGxlc3MgZHVwbGljYXRlZCBub2Rlcy5cbmZ1bmN0aW9uIG51bGxGcm9tKG5mYSwgbm9kZSkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBzY2FuKG5vZGUpO1xuICAgIHJldHVybiByZXN1bHQuc29ydChjbXApO1xuICAgIGZ1bmN0aW9uIHNjYW4obm9kZSkge1xuICAgICAgICBsZXQgZWRnZXMgPSBuZmFbbm9kZV07XG4gICAgICAgIGlmIChlZGdlcy5sZW5ndGggPT0gMSAmJiAhZWRnZXNbMF0udGVybSlcbiAgICAgICAgICAgIHJldHVybiBzY2FuKGVkZ2VzWzBdLnRvKTtcbiAgICAgICAgcmVzdWx0LnB1c2gobm9kZSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWRnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCB7IHRlcm0sIHRvIH0gPSBlZGdlc1tpXTtcbiAgICAgICAgICAgIGlmICghdGVybSAmJiByZXN1bHQuaW5kZXhPZih0bykgPT0gLTEpXG4gICAgICAgICAgICAgICAgc2Nhbih0byk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLyBDb21waWxlcyBhbiBORkEgYXMgcHJvZHVjZWQgYnkgYG5mYWAgaW50byBhIERGQSwgbW9kZWxlZCBhcyBhIHNldFxuLy8gb2Ygc3RhdGUgb2JqZWN0cyAoYENvbnRlbnRNYXRjaGAgaW5zdGFuY2VzKSB3aXRoIHRyYW5zaXRpb25zXG4vLyBiZXR3ZWVuIHRoZW0uXG5mdW5jdGlvbiBkZmEobmZhKSB7XG4gICAgbGV0IGxhYmVsZWQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHJldHVybiBleHBsb3JlKG51bGxGcm9tKG5mYSwgMCkpO1xuICAgIGZ1bmN0aW9uIGV4cGxvcmUoc3RhdGVzKSB7XG4gICAgICAgIGxldCBvdXQgPSBbXTtcbiAgICAgICAgc3RhdGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgICAgICBuZmFbbm9kZV0uZm9yRWFjaCgoeyB0ZXJtLCB0byB9KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF0ZXJtKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgbGV0IHNldDtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG91dC5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICAgICAgaWYgKG91dFtpXVswXSA9PSB0ZXJtKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0ID0gb3V0W2ldWzFdO1xuICAgICAgICAgICAgICAgIG51bGxGcm9tKG5mYSwgdG8pLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2goW3Rlcm0sIHNldCA9IFtdXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZXQuaW5kZXhPZihub2RlKSA9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldC5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgc3RhdGUgPSBsYWJlbGVkW3N0YXRlcy5qb2luKFwiLFwiKV0gPSBuZXcgQ29udGVudE1hdGNoKHN0YXRlcy5pbmRleE9mKG5mYS5sZW5ndGggLSAxKSA+IC0xKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBzdGF0ZXMgPSBvdXRbaV1bMV0uc29ydChjbXApO1xuICAgICAgICAgICAgc3RhdGUubmV4dC5wdXNoKHsgdHlwZTogb3V0W2ldWzBdLCBuZXh0OiBsYWJlbGVkW3N0YXRlcy5qb2luKFwiLFwiKV0gfHwgZXhwbG9yZShzdGF0ZXMpIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBjaGVja0ZvckRlYWRFbmRzKG1hdGNoLCBzdHJlYW0pIHtcbiAgICBmb3IgKGxldCBpID0gMCwgd29yayA9IFttYXRjaF07IGkgPCB3b3JrLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBzdGF0ZSA9IHdvcmtbaV0sIGRlYWQgPSAhc3RhdGUudmFsaWRFbmQsIG5vZGVzID0gW107XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgc3RhdGUubmV4dC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgbGV0IHsgdHlwZSwgbmV4dCB9ID0gc3RhdGUubmV4dFtqXTtcbiAgICAgICAgICAgIG5vZGVzLnB1c2godHlwZS5uYW1lKTtcbiAgICAgICAgICAgIGlmIChkZWFkICYmICEodHlwZS5pc1RleHQgfHwgdHlwZS5oYXNSZXF1aXJlZEF0dHJzKCkpKVxuICAgICAgICAgICAgICAgIGRlYWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmICh3b3JrLmluZGV4T2YobmV4dCkgPT0gLTEpXG4gICAgICAgICAgICAgICAgd29yay5wdXNoKG5leHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWFkKVxuICAgICAgICAgICAgc3RyZWFtLmVycihcIk9ubHkgbm9uLWdlbmVyYXRhYmxlIG5vZGVzIChcIiArIG5vZGVzLmpvaW4oXCIsIFwiKSArIFwiKSBpbiBhIHJlcXVpcmVkIHBvc2l0aW9uIChzZWUgaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9ndWlkZS8jZ2VuZXJhdGFibGUpXCIpO1xuICAgIH1cbn1cblxuLy8gRm9yIG5vZGUgdHlwZXMgd2hlcmUgYWxsIGF0dHJzIGhhdmUgYSBkZWZhdWx0IHZhbHVlIChvciB3aGljaCBkb24ndFxuLy8gaGF2ZSBhbnkgYXR0cmlidXRlcyksIGJ1aWxkIHVwIGEgc2luZ2xlIHJldXNhYmxlIGRlZmF1bHQgYXR0cmlidXRlXG4vLyBvYmplY3QsIGFuZCB1c2UgaXQgZm9yIGFsbCBub2RlcyB0aGF0IGRvbid0IHNwZWNpZnkgc3BlY2lmaWNcbi8vIGF0dHJpYnV0ZXMuXG5mdW5jdGlvbiBkZWZhdWx0QXR0cnMoYXR0cnMpIHtcbiAgICBsZXQgZGVmYXVsdHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGZvciAobGV0IGF0dHJOYW1lIGluIGF0dHJzKSB7XG4gICAgICAgIGxldCBhdHRyID0gYXR0cnNbYXR0ck5hbWVdO1xuICAgICAgICBpZiAoIWF0dHIuaGFzRGVmYXVsdClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBkZWZhdWx0c1thdHRyTmFtZV0gPSBhdHRyLmRlZmF1bHQ7XG4gICAgfVxuICAgIHJldHVybiBkZWZhdWx0cztcbn1cbmZ1bmN0aW9uIGNvbXB1dGVBdHRycyhhdHRycywgdmFsdWUpIHtcbiAgICBsZXQgYnVpbHQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGZvciAobGV0IG5hbWUgaW4gYXR0cnMpIHtcbiAgICAgICAgbGV0IGdpdmVuID0gdmFsdWUgJiYgdmFsdWVbbmFtZV07XG4gICAgICAgIGlmIChnaXZlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBsZXQgYXR0ciA9IGF0dHJzW25hbWVdO1xuICAgICAgICAgICAgaWYgKGF0dHIuaGFzRGVmYXVsdClcbiAgICAgICAgICAgICAgICBnaXZlbiA9IGF0dHIuZGVmYXVsdDtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIk5vIHZhbHVlIHN1cHBsaWVkIGZvciBhdHRyaWJ1dGUgXCIgKyBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBidWlsdFtuYW1lXSA9IGdpdmVuO1xuICAgIH1cbiAgICByZXR1cm4gYnVpbHQ7XG59XG5mdW5jdGlvbiBjaGVja0F0dHJzKGF0dHJzLCB2YWx1ZXMsIHR5cGUsIG5hbWUpIHtcbiAgICBmb3IgKGxldCBuYW1lIGluIHZhbHVlcylcbiAgICAgICAgaWYgKCEobmFtZSBpbiBhdHRycykpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgVW5zdXBwb3J0ZWQgYXR0cmlidXRlICR7bmFtZX0gZm9yICR7dHlwZX0gb2YgdHlwZSAke25hbWV9YCk7XG4gICAgZm9yIChsZXQgbmFtZSBpbiBhdHRycykge1xuICAgICAgICBsZXQgYXR0ciA9IGF0dHJzW25hbWVdO1xuICAgICAgICBpZiAoYXR0ci52YWxpZGF0ZSlcbiAgICAgICAgICAgIGF0dHIudmFsaWRhdGUodmFsdWVzW25hbWVdKTtcbiAgICB9XG59XG5mdW5jdGlvbiBpbml0QXR0cnModHlwZU5hbWUsIGF0dHJzKSB7XG4gICAgbGV0IHJlc3VsdCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgaWYgKGF0dHJzKVxuICAgICAgICBmb3IgKGxldCBuYW1lIGluIGF0dHJzKVxuICAgICAgICAgICAgcmVzdWx0W25hbWVdID0gbmV3IEF0dHJpYnV0ZSh0eXBlTmFtZSwgbmFtZSwgYXR0cnNbbmFtZV0pO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG4vKipcbk5vZGUgdHlwZXMgYXJlIG9iamVjdHMgYWxsb2NhdGVkIG9uY2UgcGVyIGBTY2hlbWFgIGFuZCB1c2VkIHRvXG5bdGFnXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTm9kZS50eXBlKSBgTm9kZWAgaW5zdGFuY2VzLiBUaGV5IGNvbnRhaW4gaW5mb3JtYXRpb25cbmFib3V0IHRoZSBub2RlIHR5cGUsIHN1Y2ggYXMgaXRzIG5hbWUgYW5kIHdoYXQga2luZCBvZiBub2RlIGl0XG5yZXByZXNlbnRzLlxuKi9cbmNsYXNzIE5vZGVUeXBlIHtcbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgIFRoZSBuYW1lIHRoZSBub2RlIHR5cGUgaGFzIGluIHRoaXMgc2NoZW1hLlxuICAgICovXG4gICAgbmFtZSwgXG4gICAgLyoqXG4gICAgQSBsaW5rIGJhY2sgdG8gdGhlIGBTY2hlbWFgIHRoZSBub2RlIHR5cGUgYmVsb25ncyB0by5cbiAgICAqL1xuICAgIHNjaGVtYSwgXG4gICAgLyoqXG4gICAgVGhlIHNwZWMgdGhhdCB0aGlzIHR5cGUgaXMgYmFzZWQgb25cbiAgICAqL1xuICAgIHNwZWMpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5zY2hlbWEgPSBzY2hlbWE7XG4gICAgICAgIHRoaXMuc3BlYyA9IHNwZWM7XG4gICAgICAgIC8qKlxuICAgICAgICBUaGUgc2V0IG9mIG1hcmtzIGFsbG93ZWQgaW4gdGhpcyBub2RlLiBgbnVsbGAgbWVhbnMgYWxsIG1hcmtzXG4gICAgICAgIGFyZSBhbGxvd2VkLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLm1hcmtTZXQgPSBudWxsO1xuICAgICAgICB0aGlzLmdyb3VwcyA9IHNwZWMuZ3JvdXAgPyBzcGVjLmdyb3VwLnNwbGl0KFwiIFwiKSA6IFtdO1xuICAgICAgICB0aGlzLmF0dHJzID0gaW5pdEF0dHJzKG5hbWUsIHNwZWMuYXR0cnMpO1xuICAgICAgICB0aGlzLmRlZmF1bHRBdHRycyA9IGRlZmF1bHRBdHRycyh0aGlzLmF0dHJzKTtcbiAgICAgICAgdGhpcy5jb250ZW50TWF0Y2ggPSBudWxsO1xuICAgICAgICB0aGlzLmlubGluZUNvbnRlbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmlzQmxvY2sgPSAhKHNwZWMuaW5saW5lIHx8IG5hbWUgPT0gXCJ0ZXh0XCIpO1xuICAgICAgICB0aGlzLmlzVGV4dCA9IG5hbWUgPT0gXCJ0ZXh0XCI7XG4gICAgfVxuICAgIC8qKlxuICAgIFRydWUgaWYgdGhpcyBpcyBhbiBpbmxpbmUgdHlwZS5cbiAgICAqL1xuICAgIGdldCBpc0lubGluZSgpIHsgcmV0dXJuICF0aGlzLmlzQmxvY2s7IH1cbiAgICAvKipcbiAgICBUcnVlIGlmIHRoaXMgaXMgYSB0ZXh0YmxvY2sgdHlwZSwgYSBibG9jayB0aGF0IGNvbnRhaW5zIGlubGluZVxuICAgIGNvbnRlbnQuXG4gICAgKi9cbiAgICBnZXQgaXNUZXh0YmxvY2soKSB7IHJldHVybiB0aGlzLmlzQmxvY2sgJiYgdGhpcy5pbmxpbmVDb250ZW50OyB9XG4gICAgLyoqXG4gICAgVHJ1ZSBmb3Igbm9kZSB0eXBlcyB0aGF0IGFsbG93IG5vIGNvbnRlbnQuXG4gICAgKi9cbiAgICBnZXQgaXNMZWFmKCkgeyByZXR1cm4gdGhpcy5jb250ZW50TWF0Y2ggPT0gQ29udGVudE1hdGNoLmVtcHR5OyB9XG4gICAgLyoqXG4gICAgVHJ1ZSB3aGVuIHRoaXMgbm9kZSBpcyBhbiBhdG9tLCBpLmUuIHdoZW4gaXQgZG9lcyBub3QgaGF2ZVxuICAgIGRpcmVjdGx5IGVkaXRhYmxlIGNvbnRlbnQuXG4gICAgKi9cbiAgICBnZXQgaXNBdG9tKCkgeyByZXR1cm4gdGhpcy5pc0xlYWYgfHwgISF0aGlzLnNwZWMuYXRvbTsgfVxuICAgIC8qKlxuICAgIFRoZSBub2RlIHR5cGUncyBbd2hpdGVzcGFjZV0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGVTcGVjLndoaXRlc3BhY2UpIG9wdGlvbi5cbiAgICAqL1xuICAgIGdldCB3aGl0ZXNwYWNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zcGVjLndoaXRlc3BhY2UgfHwgKHRoaXMuc3BlYy5jb2RlID8gXCJwcmVcIiA6IFwibm9ybWFsXCIpO1xuICAgIH1cbiAgICAvKipcbiAgICBUZWxscyB5b3Ugd2hldGhlciB0aGlzIG5vZGUgdHlwZSBoYXMgYW55IHJlcXVpcmVkIGF0dHJpYnV0ZXMuXG4gICAgKi9cbiAgICBoYXNSZXF1aXJlZEF0dHJzKCkge1xuICAgICAgICBmb3IgKGxldCBuIGluIHRoaXMuYXR0cnMpXG4gICAgICAgICAgICBpZiAodGhpcy5hdHRyc1tuXS5pc1JlcXVpcmVkKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8qKlxuICAgIEluZGljYXRlcyB3aGV0aGVyIHRoaXMgbm9kZSBhbGxvd3Mgc29tZSBvZiB0aGUgc2FtZSBjb250ZW50IGFzXG4gICAgdGhlIGdpdmVuIG5vZGUgdHlwZS5cbiAgICAqL1xuICAgIGNvbXBhdGlibGVDb250ZW50KG90aGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzID09IG90aGVyIHx8IHRoaXMuY29udGVudE1hdGNoLmNvbXBhdGlibGUob3RoZXIuY29udGVudE1hdGNoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBjb21wdXRlQXR0cnMoYXR0cnMpIHtcbiAgICAgICAgaWYgKCFhdHRycyAmJiB0aGlzLmRlZmF1bHRBdHRycylcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRlZmF1bHRBdHRycztcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGNvbXB1dGVBdHRycyh0aGlzLmF0dHJzLCBhdHRycyk7XG4gICAgfVxuICAgIC8qKlxuICAgIENyZWF0ZSBhIGBOb2RlYCBvZiB0aGlzIHR5cGUuIFRoZSBnaXZlbiBhdHRyaWJ1dGVzIGFyZVxuICAgIGNoZWNrZWQgYW5kIGRlZmF1bHRlZCAoeW91IGNhbiBwYXNzIGBudWxsYCB0byB1c2UgdGhlIHR5cGUnc1xuICAgIGRlZmF1bHRzIGVudGlyZWx5LCBpZiBubyByZXF1aXJlZCBhdHRyaWJ1dGVzIGV4aXN0KS4gYGNvbnRlbnRgXG4gICAgbWF5IGJlIGEgYEZyYWdtZW50YCwgYSBub2RlLCBhbiBhcnJheSBvZiBub2Rlcywgb3JcbiAgICBgbnVsbGAuIFNpbWlsYXJseSBgbWFya3NgIG1heSBiZSBgbnVsbGAgdG8gZGVmYXVsdCB0byB0aGUgZW1wdHlcbiAgICBzZXQgb2YgbWFya3MuXG4gICAgKi9cbiAgICBjcmVhdGUoYXR0cnMgPSBudWxsLCBjb250ZW50LCBtYXJrcykge1xuICAgICAgICBpZiAodGhpcy5pc1RleHQpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb2RlVHlwZS5jcmVhdGUgY2FuJ3QgY29uc3RydWN0IHRleHQgbm9kZXNcIik7XG4gICAgICAgIHJldHVybiBuZXcgTm9kZSh0aGlzLCB0aGlzLmNvbXB1dGVBdHRycyhhdHRycyksIEZyYWdtZW50LmZyb20oY29udGVudCksIE1hcmsuc2V0RnJvbShtYXJrcykpO1xuICAgIH1cbiAgICAvKipcbiAgICBMaWtlIFtgY3JlYXRlYF0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGVUeXBlLmNyZWF0ZSksIGJ1dCBjaGVjayB0aGUgZ2l2ZW4gY29udGVudFxuICAgIGFnYWluc3QgdGhlIG5vZGUgdHlwZSdzIGNvbnRlbnQgcmVzdHJpY3Rpb25zLCBhbmQgdGhyb3cgYW4gZXJyb3JcbiAgICBpZiBpdCBkb2Vzbid0IG1hdGNoLlxuICAgICovXG4gICAgY3JlYXRlQ2hlY2tlZChhdHRycyA9IG51bGwsIGNvbnRlbnQsIG1hcmtzKSB7XG4gICAgICAgIGNvbnRlbnQgPSBGcmFnbWVudC5mcm9tKGNvbnRlbnQpO1xuICAgICAgICB0aGlzLmNoZWNrQ29udGVudChjb250ZW50KTtcbiAgICAgICAgcmV0dXJuIG5ldyBOb2RlKHRoaXMsIHRoaXMuY29tcHV0ZUF0dHJzKGF0dHJzKSwgY29udGVudCwgTWFyay5zZXRGcm9tKG1hcmtzKSk7XG4gICAgfVxuICAgIC8qKlxuICAgIExpa2UgW2BjcmVhdGVgXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTm9kZVR5cGUuY3JlYXRlKSwgYnV0IHNlZSBpZiBpdCBpc1xuICAgIG5lY2Vzc2FyeSB0byBhZGQgbm9kZXMgdG8gdGhlIHN0YXJ0IG9yIGVuZCBvZiB0aGUgZ2l2ZW4gZnJhZ21lbnRcbiAgICB0byBtYWtlIGl0IGZpdCB0aGUgbm9kZS4gSWYgbm8gZml0dGluZyB3cmFwcGluZyBjYW4gYmUgZm91bmQsXG4gICAgcmV0dXJuIG51bGwuIE5vdGUgdGhhdCwgZHVlIHRvIHRoZSBmYWN0IHRoYXQgcmVxdWlyZWQgbm9kZXMgY2FuXG4gICAgYWx3YXlzIGJlIGNyZWF0ZWQsIHRoaXMgd2lsbCBhbHdheXMgc3VjY2VlZCBpZiB5b3UgcGFzcyBudWxsIG9yXG4gICAgYEZyYWdtZW50LmVtcHR5YCBhcyBjb250ZW50LlxuICAgICovXG4gICAgY3JlYXRlQW5kRmlsbChhdHRycyA9IG51bGwsIGNvbnRlbnQsIG1hcmtzKSB7XG4gICAgICAgIGF0dHJzID0gdGhpcy5jb21wdXRlQXR0cnMoYXR0cnMpO1xuICAgICAgICBjb250ZW50ID0gRnJhZ21lbnQuZnJvbShjb250ZW50KTtcbiAgICAgICAgaWYgKGNvbnRlbnQuc2l6ZSkge1xuICAgICAgICAgICAgbGV0IGJlZm9yZSA9IHRoaXMuY29udGVudE1hdGNoLmZpbGxCZWZvcmUoY29udGVudCk7XG4gICAgICAgICAgICBpZiAoIWJlZm9yZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBiZWZvcmUuYXBwZW5kKGNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBtYXRjaGVkID0gdGhpcy5jb250ZW50TWF0Y2gubWF0Y2hGcmFnbWVudChjb250ZW50KTtcbiAgICAgICAgbGV0IGFmdGVyID0gbWF0Y2hlZCAmJiBtYXRjaGVkLmZpbGxCZWZvcmUoRnJhZ21lbnQuZW1wdHksIHRydWUpO1xuICAgICAgICBpZiAoIWFmdGVyKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiBuZXcgTm9kZSh0aGlzLCBhdHRycywgY29udGVudC5hcHBlbmQoYWZ0ZXIpLCBNYXJrLnNldEZyb20obWFya3MpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBmcmFnbWVudCBpcyB2YWxpZCBjb250ZW50IGZvciB0aGlzIG5vZGVcbiAgICB0eXBlLlxuICAgICovXG4gICAgdmFsaWRDb250ZW50KGNvbnRlbnQpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IHRoaXMuY29udGVudE1hdGNoLm1hdGNoRnJhZ21lbnQoY29udGVudCk7XG4gICAgICAgIGlmICghcmVzdWx0IHx8ICFyZXN1bHQudmFsaWRFbmQpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGVudC5jaGlsZENvdW50OyBpKyspXG4gICAgICAgICAgICBpZiAoIXRoaXMuYWxsb3dzTWFya3MoY29udGVudC5jaGlsZChpKS5tYXJrcykpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgVGhyb3dzIGEgUmFuZ2VFcnJvciBpZiB0aGUgZ2l2ZW4gZnJhZ21lbnQgaXMgbm90IHZhbGlkIGNvbnRlbnQgZm9yIHRoaXNcbiAgICBub2RlIHR5cGUuXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBjaGVja0NvbnRlbnQoY29udGVudCkge1xuICAgICAgICBpZiAoIXRoaXMudmFsaWRDb250ZW50KGNvbnRlbnQpKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYEludmFsaWQgY29udGVudCBmb3Igbm9kZSAke3RoaXMubmFtZX06ICR7Y29udGVudC50b1N0cmluZygpLnNsaWNlKDAsIDUwKX1gKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBjaGVja0F0dHJzKGF0dHJzKSB7XG4gICAgICAgIGNoZWNrQXR0cnModGhpcy5hdHRycywgYXR0cnMsIFwibm9kZVwiLCB0aGlzLm5hbWUpO1xuICAgIH1cbiAgICAvKipcbiAgICBDaGVjayB3aGV0aGVyIHRoZSBnaXZlbiBtYXJrIHR5cGUgaXMgYWxsb3dlZCBpbiB0aGlzIG5vZGUuXG4gICAgKi9cbiAgICBhbGxvd3NNYXJrVHlwZShtYXJrVHlwZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrU2V0ID09IG51bGwgfHwgdGhpcy5tYXJrU2V0LmluZGV4T2YobWFya1R5cGUpID4gLTE7XG4gICAgfVxuICAgIC8qKlxuICAgIFRlc3Qgd2hldGhlciB0aGUgZ2l2ZW4gc2V0IG9mIG1hcmtzIGFyZSBhbGxvd2VkIGluIHRoaXMgbm9kZS5cbiAgICAqL1xuICAgIGFsbG93c01hcmtzKG1hcmtzKSB7XG4gICAgICAgIGlmICh0aGlzLm1hcmtTZXQgPT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hcmtzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaWYgKCF0aGlzLmFsbG93c01hcmtUeXBlKG1hcmtzW2ldLnR5cGUpKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgIFJlbW92ZXMgdGhlIG1hcmtzIHRoYXQgYXJlIG5vdCBhbGxvd2VkIGluIHRoaXMgbm9kZSBmcm9tIHRoZSBnaXZlbiBzZXQuXG4gICAgKi9cbiAgICBhbGxvd2VkTWFya3MobWFya3MpIHtcbiAgICAgICAgaWYgKHRoaXMubWFya1NldCA9PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuIG1hcmtzO1xuICAgICAgICBsZXQgY29weTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXJrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmFsbG93c01hcmtUeXBlKG1hcmtzW2ldLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb3B5KVxuICAgICAgICAgICAgICAgICAgICBjb3B5ID0gbWFya3Muc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjb3B5KSB7XG4gICAgICAgICAgICAgICAgY29weS5wdXNoKG1hcmtzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gIWNvcHkgPyBtYXJrcyA6IGNvcHkubGVuZ3RoID8gY29weSA6IE1hcmsubm9uZTtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBzdGF0aWMgY29tcGlsZShub2Rlcywgc2NoZW1hKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICBub2Rlcy5mb3JFYWNoKChuYW1lLCBzcGVjKSA9PiByZXN1bHRbbmFtZV0gPSBuZXcgTm9kZVR5cGUobmFtZSwgc2NoZW1hLCBzcGVjKSk7XG4gICAgICAgIGxldCB0b3BUeXBlID0gc2NoZW1hLnNwZWMudG9wTm9kZSB8fCBcImRvY1wiO1xuICAgICAgICBpZiAoIXJlc3VsdFt0b3BUeXBlXSlcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiU2NoZW1hIGlzIG1pc3NpbmcgaXRzIHRvcCBub2RlIHR5cGUgKCdcIiArIHRvcFR5cGUgKyBcIicpXCIpO1xuICAgICAgICBpZiAoIXJlc3VsdC50ZXh0KVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJFdmVyeSBzY2hlbWEgbmVlZHMgYSAndGV4dCcgdHlwZVwiKTtcbiAgICAgICAgZm9yIChsZXQgXyBpbiByZXN1bHQudGV4dC5hdHRycylcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiVGhlIHRleHQgbm9kZSB0eXBlIHNob3VsZCBub3QgaGF2ZSBhdHRyaWJ1dGVzXCIpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cbmZ1bmN0aW9uIHZhbGlkYXRlVHlwZSh0eXBlTmFtZSwgYXR0ck5hbWUsIHR5cGUpIHtcbiAgICBsZXQgdHlwZXMgPSB0eXBlLnNwbGl0KFwifFwiKTtcbiAgICByZXR1cm4gKHZhbHVlKSA9PiB7XG4gICAgICAgIGxldCBuYW1lID0gdmFsdWUgPT09IG51bGwgPyBcIm51bGxcIiA6IHR5cGVvZiB2YWx1ZTtcbiAgICAgICAgaWYgKHR5cGVzLmluZGV4T2YobmFtZSkgPCAwKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYEV4cGVjdGVkIHZhbHVlIG9mIHR5cGUgJHt0eXBlc30gZm9yIGF0dHJpYnV0ZSAke2F0dHJOYW1lfSBvbiB0eXBlICR7dHlwZU5hbWV9LCBnb3QgJHtuYW1lfWApO1xuICAgIH07XG59XG4vLyBBdHRyaWJ1dGUgZGVzY3JpcHRvcnNcbmNsYXNzIEF0dHJpYnV0ZSB7XG4gICAgY29uc3RydWN0b3IodHlwZU5hbWUsIGF0dHJOYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuaGFzRGVmYXVsdCA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCBcImRlZmF1bHRcIik7XG4gICAgICAgIHRoaXMuZGVmYXVsdCA9IG9wdGlvbnMuZGVmYXVsdDtcbiAgICAgICAgdGhpcy52YWxpZGF0ZSA9IHR5cGVvZiBvcHRpb25zLnZhbGlkYXRlID09IFwic3RyaW5nXCIgPyB2YWxpZGF0ZVR5cGUodHlwZU5hbWUsIGF0dHJOYW1lLCBvcHRpb25zLnZhbGlkYXRlKSA6IG9wdGlvbnMudmFsaWRhdGU7XG4gICAgfVxuICAgIGdldCBpc1JlcXVpcmVkKCkge1xuICAgICAgICByZXR1cm4gIXRoaXMuaGFzRGVmYXVsdDtcbiAgICB9XG59XG4vLyBNYXJrc1xuLyoqXG5MaWtlIG5vZGVzLCBtYXJrcyAod2hpY2ggYXJlIGFzc29jaWF0ZWQgd2l0aCBub2RlcyB0byBzaWduaWZ5XG50aGluZ3MgbGlrZSBlbXBoYXNpcyBvciBiZWluZyBwYXJ0IG9mIGEgbGluaykgYXJlXG5bdGFnZ2VkXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTWFyay50eXBlKSB3aXRoIHR5cGUgb2JqZWN0cywgd2hpY2ggYXJlXG5pbnN0YW50aWF0ZWQgb25jZSBwZXIgYFNjaGVtYWAuXG4qL1xuY2xhc3MgTWFya1R5cGUge1xuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgLyoqXG4gICAgVGhlIG5hbWUgb2YgdGhlIG1hcmsgdHlwZS5cbiAgICAqL1xuICAgIG5hbWUsIFxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgcmFuaywgXG4gICAgLyoqXG4gICAgVGhlIHNjaGVtYSB0aGF0IHRoaXMgbWFyayB0eXBlIGluc3RhbmNlIGlzIHBhcnQgb2YuXG4gICAgKi9cbiAgICBzY2hlbWEsIFxuICAgIC8qKlxuICAgIFRoZSBzcGVjIG9uIHdoaWNoIHRoZSB0eXBlIGlzIGJhc2VkLlxuICAgICovXG4gICAgc3BlYykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnJhbmsgPSByYW5rO1xuICAgICAgICB0aGlzLnNjaGVtYSA9IHNjaGVtYTtcbiAgICAgICAgdGhpcy5zcGVjID0gc3BlYztcbiAgICAgICAgdGhpcy5hdHRycyA9IGluaXRBdHRycyhuYW1lLCBzcGVjLmF0dHJzKTtcbiAgICAgICAgdGhpcy5leGNsdWRlZCA9IG51bGw7XG4gICAgICAgIGxldCBkZWZhdWx0cyA9IGRlZmF1bHRBdHRycyh0aGlzLmF0dHJzKTtcbiAgICAgICAgdGhpcy5pbnN0YW5jZSA9IGRlZmF1bHRzID8gbmV3IE1hcmsodGhpcywgZGVmYXVsdHMpIDogbnVsbDtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgbWFyayBvZiB0aGlzIHR5cGUuIGBhdHRyc2AgbWF5IGJlIGBudWxsYCBvciBhbiBvYmplY3RcbiAgICBjb250YWluaW5nIG9ubHkgc29tZSBvZiB0aGUgbWFyaydzIGF0dHJpYnV0ZXMuIFRoZSBvdGhlcnMsIGlmXG4gICAgdGhleSBoYXZlIGRlZmF1bHRzLCB3aWxsIGJlIGFkZGVkLlxuICAgICovXG4gICAgY3JlYXRlKGF0dHJzID0gbnVsbCkge1xuICAgICAgICBpZiAoIWF0dHJzICYmIHRoaXMuaW5zdGFuY2UpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0YW5jZTtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXJrKHRoaXMsIGNvbXB1dGVBdHRycyh0aGlzLmF0dHJzLCBhdHRycykpO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHN0YXRpYyBjb21waWxlKG1hcmtzLCBzY2hlbWEpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IE9iamVjdC5jcmVhdGUobnVsbCksIHJhbmsgPSAwO1xuICAgICAgICBtYXJrcy5mb3JFYWNoKChuYW1lLCBzcGVjKSA9PiByZXN1bHRbbmFtZV0gPSBuZXcgTWFya1R5cGUobmFtZSwgcmFuaysrLCBzY2hlbWEsIHNwZWMpKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgLyoqXG4gICAgV2hlbiB0aGVyZSBpcyBhIG1hcmsgb2YgdGhpcyB0eXBlIGluIHRoZSBnaXZlbiBzZXQsIGEgbmV3IHNldFxuICAgIHdpdGhvdXQgaXQgaXMgcmV0dXJuZWQuIE90aGVyd2lzZSwgdGhlIGlucHV0IHNldCBpcyByZXR1cm5lZC5cbiAgICAqL1xuICAgIHJlbW92ZUZyb21TZXQoc2V0KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2V0Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaWYgKHNldFtpXS50eXBlID09IHRoaXMpIHtcbiAgICAgICAgICAgICAgICBzZXQgPSBzZXQuc2xpY2UoMCwgaSkuY29uY2F0KHNldC5zbGljZShpICsgMSkpO1xuICAgICAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNldDtcbiAgICB9XG4gICAgLyoqXG4gICAgVGVzdHMgd2hldGhlciB0aGVyZSBpcyBhIG1hcmsgb2YgdGhpcyB0eXBlIGluIHRoZSBnaXZlbiBzZXQuXG4gICAgKi9cbiAgICBpc0luU2V0KHNldCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNldC5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIGlmIChzZXRbaV0udHlwZSA9PSB0aGlzKVxuICAgICAgICAgICAgICAgIHJldHVybiBzZXRbaV07XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgY2hlY2tBdHRycyhhdHRycykge1xuICAgICAgICBjaGVja0F0dHJzKHRoaXMuYXR0cnMsIGF0dHJzLCBcIm1hcmtcIiwgdGhpcy5uYW1lKTtcbiAgICB9XG4gICAgLyoqXG4gICAgUXVlcmllcyB3aGV0aGVyIGEgZ2l2ZW4gbWFyayB0eXBlIGlzXG4gICAgW2V4Y2x1ZGVkXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTWFya1NwZWMuZXhjbHVkZXMpIGJ5IHRoaXMgb25lLlxuICAgICovXG4gICAgZXhjbHVkZXMob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhjbHVkZWQuaW5kZXhPZihvdGhlcikgPiAtMTtcbiAgICB9XG59XG4vKipcbkEgZG9jdW1lbnQgc2NoZW1hLiBIb2xkcyBbbm9kZV0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGVUeXBlKSBhbmQgW21hcmtcbnR5cGVdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5NYXJrVHlwZSkgb2JqZWN0cyBmb3IgdGhlIG5vZGVzIGFuZCBtYXJrcyB0aGF0IG1heVxub2NjdXIgaW4gY29uZm9ybWluZyBkb2N1bWVudHMsIGFuZCBwcm92aWRlcyBmdW5jdGlvbmFsaXR5IGZvclxuY3JlYXRpbmcgYW5kIGRlc2VyaWFsaXppbmcgc3VjaCBkb2N1bWVudHMuXG5cbldoZW4gZ2l2ZW4sIHRoZSB0eXBlIHBhcmFtZXRlcnMgcHJvdmlkZSB0aGUgbmFtZXMgb2YgdGhlIG5vZGVzIGFuZFxubWFya3MgaW4gdGhpcyBzY2hlbWEuXG4qL1xuY2xhc3MgU2NoZW1hIHtcbiAgICAvKipcbiAgICBDb25zdHJ1Y3QgYSBzY2hlbWEgZnJvbSBhIHNjaGVtYSBbc3BlY2lmaWNhdGlvbl0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLlNjaGVtYVNwZWMpLlxuICAgICovXG4gICAgY29uc3RydWN0b3Ioc3BlYykge1xuICAgICAgICAvKipcbiAgICAgICAgVGhlIFtsaW5lYnJlYWtcbiAgICAgICAgcmVwbGFjZW1lbnRdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5Ob2RlU3BlYy5saW5lYnJlYWtSZXBsYWNlbWVudCkgbm9kZSBkZWZpbmVkXG4gICAgICAgIGluIHRoaXMgc2NoZW1hLCBpZiBhbnkuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMubGluZWJyZWFrUmVwbGFjZW1lbnQgPSBudWxsO1xuICAgICAgICAvKipcbiAgICAgICAgQW4gb2JqZWN0IGZvciBzdG9yaW5nIHdoYXRldmVyIHZhbHVlcyBtb2R1bGVzIG1heSB3YW50IHRvXG4gICAgICAgIGNvbXB1dGUgYW5kIGNhY2hlIHBlciBzY2hlbWEuIChJZiB5b3Ugd2FudCB0byBzdG9yZSBzb21ldGhpbmdcbiAgICAgICAgaW4gaXQsIHRyeSB0byB1c2UgcHJvcGVydHkgbmFtZXMgdW5saWtlbHkgdG8gY2xhc2guKVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhY2hlZCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgIGxldCBpbnN0YW5jZVNwZWMgPSB0aGlzLnNwZWMgPSB7fTtcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiBzcGVjKVxuICAgICAgICAgICAgaW5zdGFuY2VTcGVjW3Byb3BdID0gc3BlY1twcm9wXTtcbiAgICAgICAgaW5zdGFuY2VTcGVjLm5vZGVzID0gT3JkZXJlZE1hcC5mcm9tKHNwZWMubm9kZXMpLFxuICAgICAgICAgICAgaW5zdGFuY2VTcGVjLm1hcmtzID0gT3JkZXJlZE1hcC5mcm9tKHNwZWMubWFya3MgfHwge30pLFxuICAgICAgICAgICAgdGhpcy5ub2RlcyA9IE5vZGVUeXBlLmNvbXBpbGUodGhpcy5zcGVjLm5vZGVzLCB0aGlzKTtcbiAgICAgICAgdGhpcy5tYXJrcyA9IE1hcmtUeXBlLmNvbXBpbGUodGhpcy5zcGVjLm1hcmtzLCB0aGlzKTtcbiAgICAgICAgbGV0IGNvbnRlbnRFeHByQ2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICBmb3IgKGxldCBwcm9wIGluIHRoaXMubm9kZXMpIHtcbiAgICAgICAgICAgIGlmIChwcm9wIGluIHRoaXMubWFya3MpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IocHJvcCArIFwiIGNhbiBub3QgYmUgYm90aCBhIG5vZGUgYW5kIGEgbWFya1wiKTtcbiAgICAgICAgICAgIGxldCB0eXBlID0gdGhpcy5ub2Rlc1twcm9wXSwgY29udGVudEV4cHIgPSB0eXBlLnNwZWMuY29udGVudCB8fCBcIlwiLCBtYXJrRXhwciA9IHR5cGUuc3BlYy5tYXJrcztcbiAgICAgICAgICAgIHR5cGUuY29udGVudE1hdGNoID0gY29udGVudEV4cHJDYWNoZVtjb250ZW50RXhwcl0gfHxcbiAgICAgICAgICAgICAgICAoY29udGVudEV4cHJDYWNoZVtjb250ZW50RXhwcl0gPSBDb250ZW50TWF0Y2gucGFyc2UoY29udGVudEV4cHIsIHRoaXMubm9kZXMpKTtcbiAgICAgICAgICAgIHR5cGUuaW5saW5lQ29udGVudCA9IHR5cGUuY29udGVudE1hdGNoLmlubGluZUNvbnRlbnQ7XG4gICAgICAgICAgICBpZiAodHlwZS5zcGVjLmxpbmVicmVha1JlcGxhY2VtZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGluZWJyZWFrUmVwbGFjZW1lbnQpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiTXVsdGlwbGUgbGluZWJyZWFrIG5vZGVzIGRlZmluZWRcIik7XG4gICAgICAgICAgICAgICAgaWYgKCF0eXBlLmlzSW5saW5lIHx8ICF0eXBlLmlzTGVhZilcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJMaW5lYnJlYWsgcmVwbGFjZW1lbnQgbm9kZXMgbXVzdCBiZSBpbmxpbmUgbGVhZiBub2Rlc1wiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxpbmVicmVha1JlcGxhY2VtZW50ID0gdHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHR5cGUubWFya1NldCA9IG1hcmtFeHByID09IFwiX1wiID8gbnVsbCA6XG4gICAgICAgICAgICAgICAgbWFya0V4cHIgPyBnYXRoZXJNYXJrcyh0aGlzLCBtYXJrRXhwci5zcGxpdChcIiBcIikpIDpcbiAgICAgICAgICAgICAgICAgICAgbWFya0V4cHIgPT0gXCJcIiB8fCAhdHlwZS5pbmxpbmVDb250ZW50ID8gW10gOiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IHByb3AgaW4gdGhpcy5tYXJrcykge1xuICAgICAgICAgICAgbGV0IHR5cGUgPSB0aGlzLm1hcmtzW3Byb3BdLCBleGNsID0gdHlwZS5zcGVjLmV4Y2x1ZGVzO1xuICAgICAgICAgICAgdHlwZS5leGNsdWRlZCA9IGV4Y2wgPT0gbnVsbCA/IFt0eXBlXSA6IGV4Y2wgPT0gXCJcIiA/IFtdIDogZ2F0aGVyTWFya3ModGhpcywgZXhjbC5zcGxpdChcIiBcIikpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubm9kZUZyb21KU09OID0gdGhpcy5ub2RlRnJvbUpTT04uYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5tYXJrRnJvbUpTT04gPSB0aGlzLm1hcmtGcm9tSlNPTi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLnRvcE5vZGVUeXBlID0gdGhpcy5ub2Rlc1t0aGlzLnNwZWMudG9wTm9kZSB8fCBcImRvY1wiXTtcbiAgICAgICAgdGhpcy5jYWNoZWQud3JhcHBpbmdzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgbm9kZSBpbiB0aGlzIHNjaGVtYS4gVGhlIGB0eXBlYCBtYXkgYmUgYSBzdHJpbmcgb3IgYVxuICAgIGBOb2RlVHlwZWAgaW5zdGFuY2UuIEF0dHJpYnV0ZXMgd2lsbCBiZSBleHRlbmRlZCB3aXRoIGRlZmF1bHRzLFxuICAgIGBjb250ZW50YCBtYXkgYmUgYSBgRnJhZ21lbnRgLCBgbnVsbGAsIGEgYE5vZGVgLCBvciBhbiBhcnJheSBvZlxuICAgIG5vZGVzLlxuICAgICovXG4gICAgbm9kZSh0eXBlLCBhdHRycyA9IG51bGwsIGNvbnRlbnQsIG1hcmtzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdHlwZSA9PSBcInN0cmluZ1wiKVxuICAgICAgICAgICAgdHlwZSA9IHRoaXMubm9kZVR5cGUodHlwZSk7XG4gICAgICAgIGVsc2UgaWYgKCEodHlwZSBpbnN0YW5jZW9mIE5vZGVUeXBlKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiSW52YWxpZCBub2RlIHR5cGU6IFwiICsgdHlwZSk7XG4gICAgICAgIGVsc2UgaWYgKHR5cGUuc2NoZW1hICE9IHRoaXMpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIk5vZGUgdHlwZSBmcm9tIGRpZmZlcmVudCBzY2hlbWEgdXNlZCAoXCIgKyB0eXBlLm5hbWUgKyBcIilcIik7XG4gICAgICAgIHJldHVybiB0eXBlLmNyZWF0ZUNoZWNrZWQoYXR0cnMsIGNvbnRlbnQsIG1hcmtzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgdGV4dCBub2RlIGluIHRoZSBzY2hlbWEuIEVtcHR5IHRleHQgbm9kZXMgYXJlIG5vdFxuICAgIGFsbG93ZWQuXG4gICAgKi9cbiAgICB0ZXh0KHRleHQsIG1hcmtzKSB7XG4gICAgICAgIGxldCB0eXBlID0gdGhpcy5ub2Rlcy50ZXh0O1xuICAgICAgICByZXR1cm4gbmV3IFRleHROb2RlKHR5cGUsIHR5cGUuZGVmYXVsdEF0dHJzLCB0ZXh0LCBNYXJrLnNldEZyb20obWFya3MpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgbWFyayB3aXRoIHRoZSBnaXZlbiB0eXBlIGFuZCBhdHRyaWJ1dGVzLlxuICAgICovXG4gICAgbWFyayh0eXBlLCBhdHRycykge1xuICAgICAgICBpZiAodHlwZW9mIHR5cGUgPT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgIHR5cGUgPSB0aGlzLm1hcmtzW3R5cGVdO1xuICAgICAgICByZXR1cm4gdHlwZS5jcmVhdGUoYXR0cnMpO1xuICAgIH1cbiAgICAvKipcbiAgICBEZXNlcmlhbGl6ZSBhIG5vZGUgZnJvbSBpdHMgSlNPTiByZXByZXNlbnRhdGlvbi4gVGhpcyBtZXRob2QgaXNcbiAgICBib3VuZC5cbiAgICAqL1xuICAgIG5vZGVGcm9tSlNPTihqc29uKSB7XG4gICAgICAgIHJldHVybiBOb2RlLmZyb21KU09OKHRoaXMsIGpzb24pO1xuICAgIH1cbiAgICAvKipcbiAgICBEZXNlcmlhbGl6ZSBhIG1hcmsgZnJvbSBpdHMgSlNPTiByZXByZXNlbnRhdGlvbi4gVGhpcyBtZXRob2QgaXNcbiAgICBib3VuZC5cbiAgICAqL1xuICAgIG1hcmtGcm9tSlNPTihqc29uKSB7XG4gICAgICAgIHJldHVybiBNYXJrLmZyb21KU09OKHRoaXMsIGpzb24pO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIG5vZGVUeXBlKG5hbWUpIHtcbiAgICAgICAgbGV0IGZvdW5kID0gdGhpcy5ub2Rlc1tuYW1lXTtcbiAgICAgICAgaWYgKCFmb3VuZClcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiVW5rbm93biBub2RlIHR5cGU6IFwiICsgbmFtZSk7XG4gICAgICAgIHJldHVybiBmb3VuZDtcbiAgICB9XG59XG5mdW5jdGlvbiBnYXRoZXJNYXJrcyhzY2hlbWEsIG1hcmtzKSB7XG4gICAgbGV0IGZvdW5kID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXJrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgbmFtZSA9IG1hcmtzW2ldLCBtYXJrID0gc2NoZW1hLm1hcmtzW25hbWVdLCBvayA9IG1hcms7XG4gICAgICAgIGlmIChtYXJrKSB7XG4gICAgICAgICAgICBmb3VuZC5wdXNoKG1hcmspO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yIChsZXQgcHJvcCBpbiBzY2hlbWEubWFya3MpIHtcbiAgICAgICAgICAgICAgICBsZXQgbWFyayA9IHNjaGVtYS5tYXJrc1twcm9wXTtcbiAgICAgICAgICAgICAgICBpZiAobmFtZSA9PSBcIl9cIiB8fCAobWFyay5zcGVjLmdyb3VwICYmIG1hcmsuc3BlYy5ncm91cC5zcGxpdChcIiBcIikuaW5kZXhPZihuYW1lKSA+IC0xKSlcbiAgICAgICAgICAgICAgICAgICAgZm91bmQucHVzaChvayA9IG1hcmspO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghb2spXG4gICAgICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJVbmtub3duIG1hcmsgdHlwZTogJ1wiICsgbWFya3NbaV0gKyBcIidcIik7XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbn1cblxuZnVuY3Rpb24gaXNUYWdSdWxlKHJ1bGUpIHsgcmV0dXJuIHJ1bGUudGFnICE9IG51bGw7IH1cbmZ1bmN0aW9uIGlzU3R5bGVSdWxlKHJ1bGUpIHsgcmV0dXJuIHJ1bGUuc3R5bGUgIT0gbnVsbDsgfVxuLyoqXG5BIERPTSBwYXJzZXIgcmVwcmVzZW50cyBhIHN0cmF0ZWd5IGZvciBwYXJzaW5nIERPTSBjb250ZW50IGludG8gYVxuUHJvc2VNaXJyb3IgZG9jdW1lbnQgY29uZm9ybWluZyB0byBhIGdpdmVuIHNjaGVtYS4gSXRzIGJlaGF2aW9yIGlzXG5kZWZpbmVkIGJ5IGFuIGFycmF5IG9mIFtydWxlc10oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLlBhcnNlUnVsZSkuXG4qL1xuY2xhc3MgRE9NUGFyc2VyIHtcbiAgICAvKipcbiAgICBDcmVhdGUgYSBwYXJzZXIgdGhhdCB0YXJnZXRzIHRoZSBnaXZlbiBzY2hlbWEsIHVzaW5nIHRoZSBnaXZlblxuICAgIHBhcnNpbmcgcnVsZXMuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAvKipcbiAgICBUaGUgc2NoZW1hIGludG8gd2hpY2ggdGhlIHBhcnNlciBwYXJzZXMuXG4gICAgKi9cbiAgICBzY2hlbWEsIFxuICAgIC8qKlxuICAgIFRoZSBzZXQgb2YgW3BhcnNlIHJ1bGVzXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuUGFyc2VSdWxlKSB0aGF0IHRoZSBwYXJzZXJcbiAgICB1c2VzLCBpbiBvcmRlciBvZiBwcmVjZWRlbmNlLlxuICAgICovXG4gICAgcnVsZXMpIHtcbiAgICAgICAgdGhpcy5zY2hlbWEgPSBzY2hlbWE7XG4gICAgICAgIHRoaXMucnVsZXMgPSBydWxlcztcbiAgICAgICAgLyoqXG4gICAgICAgIEBpbnRlcm5hbFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnRhZ3MgPSBbXTtcbiAgICAgICAgLyoqXG4gICAgICAgIEBpbnRlcm5hbFxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnN0eWxlcyA9IFtdO1xuICAgICAgICBsZXQgbWF0Y2hlZFN0eWxlcyA9IHRoaXMubWF0Y2hlZFN0eWxlcyA9IFtdO1xuICAgICAgICBydWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICAgICAgaWYgKGlzVGFnUnVsZShydWxlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudGFncy5wdXNoKHJ1bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNTdHlsZVJ1bGUocnVsZSkpIHtcbiAgICAgICAgICAgICAgICBsZXQgcHJvcCA9IC9bXj1dKi8uZXhlYyhydWxlLnN0eWxlKVswXTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlZFN0eWxlcy5pbmRleE9mKHByb3ApIDwgMClcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZFN0eWxlcy5wdXNoKHByb3ApO1xuICAgICAgICAgICAgICAgIHRoaXMuc3R5bGVzLnB1c2gocnVsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBPbmx5IG5vcm1hbGl6ZSBsaXN0IGVsZW1lbnRzIHdoZW4gbGlzdHMgaW4gdGhlIHNjaGVtYSBjYW4ndCBkaXJlY3RseSBjb250YWluIHRoZW1zZWx2ZXNcbiAgICAgICAgdGhpcy5ub3JtYWxpemVMaXN0cyA9ICF0aGlzLnRhZ3Muc29tZShyID0+IHtcbiAgICAgICAgICAgIGlmICghL14odWx8b2wpXFxiLy50ZXN0KHIudGFnKSB8fCAhci5ub2RlKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGxldCBub2RlID0gc2NoZW1hLm5vZGVzW3Iubm9kZV07XG4gICAgICAgICAgICByZXR1cm4gbm9kZS5jb250ZW50TWF0Y2gubWF0Y2hUeXBlKG5vZGUpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgUGFyc2UgYSBkb2N1bWVudCBmcm9tIHRoZSBjb250ZW50IG9mIGEgRE9NIG5vZGUuXG4gICAgKi9cbiAgICBwYXJzZShkb20sIG9wdGlvbnMgPSB7fSkge1xuICAgICAgICBsZXQgY29udGV4dCA9IG5ldyBQYXJzZUNvbnRleHQodGhpcywgb3B0aW9ucywgZmFsc2UpO1xuICAgICAgICBjb250ZXh0LmFkZEFsbChkb20sIE1hcmsubm9uZSwgb3B0aW9ucy5mcm9tLCBvcHRpb25zLnRvKTtcbiAgICAgICAgcmV0dXJuIGNvbnRleHQuZmluaXNoKCk7XG4gICAgfVxuICAgIC8qKlxuICAgIFBhcnNlcyB0aGUgY29udGVudCBvZiB0aGUgZ2l2ZW4gRE9NIG5vZGUsIGxpa2VcbiAgICBbYHBhcnNlYF0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLkRPTVBhcnNlci5wYXJzZSksIGFuZCB0YWtlcyB0aGUgc2FtZSBzZXQgb2ZcbiAgICBvcHRpb25zLiBCdXQgdW5saWtlIHRoYXQgbWV0aG9kLCB3aGljaCBwcm9kdWNlcyBhIHdob2xlIG5vZGUsXG4gICAgdGhpcyBvbmUgcmV0dXJucyBhIHNsaWNlIHRoYXQgaXMgb3BlbiBhdCB0aGUgc2lkZXMsIG1lYW5pbmcgdGhhdFxuICAgIHRoZSBzY2hlbWEgY29uc3RyYWludHMgYXJlbid0IGFwcGxpZWQgdG8gdGhlIHN0YXJ0IG9mIG5vZGVzIHRvXG4gICAgdGhlIGxlZnQgb2YgdGhlIGlucHV0IGFuZCB0aGUgZW5kIG9mIG5vZGVzIGF0IHRoZSBlbmQuXG4gICAgKi9cbiAgICBwYXJzZVNsaWNlKGRvbSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIGxldCBjb250ZXh0ID0gbmV3IFBhcnNlQ29udGV4dCh0aGlzLCBvcHRpb25zLCB0cnVlKTtcbiAgICAgICAgY29udGV4dC5hZGRBbGwoZG9tLCBNYXJrLm5vbmUsIG9wdGlvbnMuZnJvbSwgb3B0aW9ucy50byk7XG4gICAgICAgIHJldHVybiBTbGljZS5tYXhPcGVuKGNvbnRleHQuZmluaXNoKCkpO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIG1hdGNoVGFnKGRvbSwgY29udGV4dCwgYWZ0ZXIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IGFmdGVyID8gdGhpcy50YWdzLmluZGV4T2YoYWZ0ZXIpICsgMSA6IDA7IGkgPCB0aGlzLnRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBydWxlID0gdGhpcy50YWdzW2ldO1xuICAgICAgICAgICAgaWYgKG1hdGNoZXMoZG9tLCBydWxlLnRhZykgJiZcbiAgICAgICAgICAgICAgICAocnVsZS5uYW1lc3BhY2UgPT09IHVuZGVmaW5lZCB8fCBkb20ubmFtZXNwYWNlVVJJID09IHJ1bGUubmFtZXNwYWNlKSAmJlxuICAgICAgICAgICAgICAgICghcnVsZS5jb250ZXh0IHx8IGNvbnRleHQubWF0Y2hlc0NvbnRleHQocnVsZS5jb250ZXh0KSkpIHtcbiAgICAgICAgICAgICAgICBpZiAocnVsZS5nZXRBdHRycykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gcnVsZS5nZXRBdHRycyhkb20pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ID09PSBmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICBydWxlLmF0dHJzID0gcmVzdWx0IHx8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBtYXRjaFN0eWxlKHByb3AsIHZhbHVlLCBjb250ZXh0LCBhZnRlcikge1xuICAgICAgICBmb3IgKGxldCBpID0gYWZ0ZXIgPyB0aGlzLnN0eWxlcy5pbmRleE9mKGFmdGVyKSArIDEgOiAwOyBpIDwgdGhpcy5zdHlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBydWxlID0gdGhpcy5zdHlsZXNbaV0sIHN0eWxlID0gcnVsZS5zdHlsZTtcbiAgICAgICAgICAgIGlmIChzdHlsZS5pbmRleE9mKHByb3ApICE9IDAgfHxcbiAgICAgICAgICAgICAgICBydWxlLmNvbnRleHQgJiYgIWNvbnRleHQubWF0Y2hlc0NvbnRleHQocnVsZS5jb250ZXh0KSB8fFxuICAgICAgICAgICAgICAgIC8vIFRlc3QgdGhhdCB0aGUgc3R5bGUgc3RyaW5nIGVpdGhlciBwcmVjaXNlbHkgbWF0Y2hlcyB0aGUgcHJvcCxcbiAgICAgICAgICAgICAgICAvLyBvciBoYXMgYW4gJz0nIHNpZ24gYWZ0ZXIgdGhlIHByb3AsIGZvbGxvd2VkIGJ5IHRoZSBnaXZlblxuICAgICAgICAgICAgICAgIC8vIHZhbHVlLlxuICAgICAgICAgICAgICAgIHN0eWxlLmxlbmd0aCA+IHByb3AubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgICAgIChzdHlsZS5jaGFyQ29kZUF0KHByb3AubGVuZ3RoKSAhPSA2MSB8fCBzdHlsZS5zbGljZShwcm9wLmxlbmd0aCArIDEpICE9IHZhbHVlKSlcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIGlmIChydWxlLmdldEF0dHJzKSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IHJ1bGUuZ2V0QXR0cnModmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBydWxlLmF0dHJzID0gcmVzdWx0IHx8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydWxlO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgc3RhdGljIHNjaGVtYVJ1bGVzKHNjaGVtYSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgICAgIGZ1bmN0aW9uIGluc2VydChydWxlKSB7XG4gICAgICAgICAgICBsZXQgcHJpb3JpdHkgPSBydWxlLnByaW9yaXR5ID09IG51bGwgPyA1MCA6IHJ1bGUucHJpb3JpdHksIGkgPSAwO1xuICAgICAgICAgICAgZm9yICg7IGkgPCByZXN1bHQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgbmV4dCA9IHJlc3VsdFtpXSwgbmV4dFByaW9yaXR5ID0gbmV4dC5wcmlvcml0eSA9PSBudWxsID8gNTAgOiBuZXh0LnByaW9yaXR5O1xuICAgICAgICAgICAgICAgIGlmIChuZXh0UHJpb3JpdHkgPCBwcmlvcml0eSlcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQuc3BsaWNlKGksIDAsIHJ1bGUpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IG5hbWUgaW4gc2NoZW1hLm1hcmtzKSB7XG4gICAgICAgICAgICBsZXQgcnVsZXMgPSBzY2hlbWEubWFya3NbbmFtZV0uc3BlYy5wYXJzZURPTTtcbiAgICAgICAgICAgIGlmIChydWxlcylcbiAgICAgICAgICAgICAgICBydWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnQocnVsZSA9IGNvcHkocnVsZSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIShydWxlLm1hcmsgfHwgcnVsZS5pZ25vcmUgfHwgcnVsZS5jbGVhck1hcmspKVxuICAgICAgICAgICAgICAgICAgICAgICAgcnVsZS5tYXJrID0gbmFtZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBuYW1lIGluIHNjaGVtYS5ub2Rlcykge1xuICAgICAgICAgICAgbGV0IHJ1bGVzID0gc2NoZW1hLm5vZGVzW25hbWVdLnNwZWMucGFyc2VET007XG4gICAgICAgICAgICBpZiAocnVsZXMpXG4gICAgICAgICAgICAgICAgcnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0KHJ1bGUgPSBjb3B5KHJ1bGUpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEocnVsZS5ub2RlIHx8IHJ1bGUuaWdub3JlIHx8IHJ1bGUubWFyaykpXG4gICAgICAgICAgICAgICAgICAgICAgICBydWxlLm5vZGUgPSBuYW1lO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIC8qKlxuICAgIENvbnN0cnVjdCBhIERPTSBwYXJzZXIgdXNpbmcgdGhlIHBhcnNpbmcgcnVsZXMgbGlzdGVkIGluIGFcbiAgICBzY2hlbWEncyBbbm9kZSBzcGVjc10oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGVTcGVjLnBhcnNlRE9NKSwgcmVvcmRlcmVkIGJ5XG4gICAgW3ByaW9yaXR5XShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuUGFyc2VSdWxlLnByaW9yaXR5KS5cbiAgICAqL1xuICAgIHN0YXRpYyBmcm9tU2NoZW1hKHNjaGVtYSkge1xuICAgICAgICByZXR1cm4gc2NoZW1hLmNhY2hlZC5kb21QYXJzZXIgfHxcbiAgICAgICAgICAgIChzY2hlbWEuY2FjaGVkLmRvbVBhcnNlciA9IG5ldyBET01QYXJzZXIoc2NoZW1hLCBET01QYXJzZXIuc2NoZW1hUnVsZXMoc2NoZW1hKSkpO1xuICAgIH1cbn1cbmNvbnN0IGJsb2NrVGFncyA9IHtcbiAgICBhZGRyZXNzOiB0cnVlLCBhcnRpY2xlOiB0cnVlLCBhc2lkZTogdHJ1ZSwgYmxvY2txdW90ZTogdHJ1ZSwgY2FudmFzOiB0cnVlLFxuICAgIGRkOiB0cnVlLCBkaXY6IHRydWUsIGRsOiB0cnVlLCBmaWVsZHNldDogdHJ1ZSwgZmlnY2FwdGlvbjogdHJ1ZSwgZmlndXJlOiB0cnVlLFxuICAgIGZvb3RlcjogdHJ1ZSwgZm9ybTogdHJ1ZSwgaDE6IHRydWUsIGgyOiB0cnVlLCBoMzogdHJ1ZSwgaDQ6IHRydWUsIGg1OiB0cnVlLFxuICAgIGg2OiB0cnVlLCBoZWFkZXI6IHRydWUsIGhncm91cDogdHJ1ZSwgaHI6IHRydWUsIGxpOiB0cnVlLCBub3NjcmlwdDogdHJ1ZSwgb2w6IHRydWUsXG4gICAgb3V0cHV0OiB0cnVlLCBwOiB0cnVlLCBwcmU6IHRydWUsIHNlY3Rpb246IHRydWUsIHRhYmxlOiB0cnVlLCB0Zm9vdDogdHJ1ZSwgdWw6IHRydWVcbn07XG5jb25zdCBpZ25vcmVUYWdzID0ge1xuICAgIGhlYWQ6IHRydWUsIG5vc2NyaXB0OiB0cnVlLCBvYmplY3Q6IHRydWUsIHNjcmlwdDogdHJ1ZSwgc3R5bGU6IHRydWUsIHRpdGxlOiB0cnVlXG59O1xuY29uc3QgbGlzdFRhZ3MgPSB7IG9sOiB0cnVlLCB1bDogdHJ1ZSB9O1xuLy8gVXNpbmcgYSBiaXRmaWVsZCBmb3Igbm9kZSBjb250ZXh0IG9wdGlvbnNcbmNvbnN0IE9QVF9QUkVTRVJWRV9XUyA9IDEsIE9QVF9QUkVTRVJWRV9XU19GVUxMID0gMiwgT1BUX09QRU5fTEVGVCA9IDQ7XG5mdW5jdGlvbiB3c09wdGlvbnNGb3IodHlwZSwgcHJlc2VydmVXaGl0ZXNwYWNlLCBiYXNlKSB7XG4gICAgaWYgKHByZXNlcnZlV2hpdGVzcGFjZSAhPSBudWxsKVxuICAgICAgICByZXR1cm4gKHByZXNlcnZlV2hpdGVzcGFjZSA/IE9QVF9QUkVTRVJWRV9XUyA6IDApIHxcbiAgICAgICAgICAgIChwcmVzZXJ2ZVdoaXRlc3BhY2UgPT09IFwiZnVsbFwiID8gT1BUX1BSRVNFUlZFX1dTX0ZVTEwgOiAwKTtcbiAgICByZXR1cm4gdHlwZSAmJiB0eXBlLndoaXRlc3BhY2UgPT0gXCJwcmVcIiA/IE9QVF9QUkVTRVJWRV9XUyB8IE9QVF9QUkVTRVJWRV9XU19GVUxMIDogYmFzZSAmIH5PUFRfT1BFTl9MRUZUO1xufVxuY2xhc3MgTm9kZUNvbnRleHQge1xuICAgIGNvbnN0cnVjdG9yKHR5cGUsIGF0dHJzLCBtYXJrcywgc29saWQsIG1hdGNoLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICAgIHRoaXMuYXR0cnMgPSBhdHRycztcbiAgICAgICAgdGhpcy5tYXJrcyA9IG1hcmtzO1xuICAgICAgICB0aGlzLnNvbGlkID0gc29saWQ7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuY29udGVudCA9IFtdO1xuICAgICAgICAvLyBNYXJrcyBhcHBsaWVkIHRvIHRoZSBub2RlJ3MgY2hpbGRyZW5cbiAgICAgICAgdGhpcy5hY3RpdmVNYXJrcyA9IE1hcmsubm9uZTtcbiAgICAgICAgdGhpcy5tYXRjaCA9IG1hdGNoIHx8IChvcHRpb25zICYgT1BUX09QRU5fTEVGVCA/IG51bGwgOiB0eXBlLmNvbnRlbnRNYXRjaCk7XG4gICAgfVxuICAgIGZpbmRXcmFwcGluZyhub2RlKSB7XG4gICAgICAgIGlmICghdGhpcy5tYXRjaCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnR5cGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgbGV0IGZpbGwgPSB0aGlzLnR5cGUuY29udGVudE1hdGNoLmZpbGxCZWZvcmUoRnJhZ21lbnQuZnJvbShub2RlKSk7XG4gICAgICAgICAgICBpZiAoZmlsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWF0Y2ggPSB0aGlzLnR5cGUuY29udGVudE1hdGNoLm1hdGNoRnJhZ21lbnQoZmlsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnQgPSB0aGlzLnR5cGUuY29udGVudE1hdGNoLCB3cmFwO1xuICAgICAgICAgICAgICAgIGlmICh3cmFwID0gc3RhcnQuZmluZFdyYXBwaW5nKG5vZGUudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXRjaCA9IHN0YXJ0O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd3JhcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5tYXRjaC5maW5kV3JhcHBpbmcobm9kZS50eXBlKTtcbiAgICB9XG4gICAgZmluaXNoKG9wZW5FbmQpIHtcbiAgICAgICAgaWYgKCEodGhpcy5vcHRpb25zICYgT1BUX1BSRVNFUlZFX1dTKSkgeyAvLyBTdHJpcCB0cmFpbGluZyB3aGl0ZXNwYWNlXG4gICAgICAgICAgICBsZXQgbGFzdCA9IHRoaXMuY29udGVudFt0aGlzLmNvbnRlbnQubGVuZ3RoIC0gMV0sIG07XG4gICAgICAgICAgICBpZiAobGFzdCAmJiBsYXN0LmlzVGV4dCAmJiAobSA9IC9bIFxcdFxcclxcblxcdTAwMGNdKyQvLmV4ZWMobGFzdC50ZXh0KSkpIHtcbiAgICAgICAgICAgICAgICBsZXQgdGV4dCA9IGxhc3Q7XG4gICAgICAgICAgICAgICAgaWYgKGxhc3QudGV4dC5sZW5ndGggPT0gbVswXS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudC5wb3AoKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudFt0aGlzLmNvbnRlbnQubGVuZ3RoIC0gMV0gPSB0ZXh0LndpdGhUZXh0KHRleHQudGV4dC5zbGljZSgwLCB0ZXh0LnRleHQubGVuZ3RoIC0gbVswXS5sZW5ndGgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgY29udGVudCA9IEZyYWdtZW50LmZyb20odGhpcy5jb250ZW50KTtcbiAgICAgICAgaWYgKCFvcGVuRW5kICYmIHRoaXMubWF0Y2gpXG4gICAgICAgICAgICBjb250ZW50ID0gY29udGVudC5hcHBlbmQodGhpcy5tYXRjaC5maWxsQmVmb3JlKEZyYWdtZW50LmVtcHR5LCB0cnVlKSk7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGUgPyB0aGlzLnR5cGUuY3JlYXRlKHRoaXMuYXR0cnMsIGNvbnRlbnQsIHRoaXMubWFya3MpIDogY29udGVudDtcbiAgICB9XG4gICAgaW5saW5lQ29udGV4dChub2RlKSB7XG4gICAgICAgIGlmICh0aGlzLnR5cGUpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy50eXBlLmlubGluZUNvbnRlbnQ7XG4gICAgICAgIGlmICh0aGlzLmNvbnRlbnQubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudFswXS5pc0lubGluZTtcbiAgICAgICAgcmV0dXJuIG5vZGUucGFyZW50Tm9kZSAmJiAhYmxvY2tUYWdzLmhhc093blByb3BlcnR5KG5vZGUucGFyZW50Tm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKTtcbiAgICB9XG59XG5jbGFzcyBQYXJzZUNvbnRleHQge1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8vIFRoZSBwYXJzZXIgd2UgYXJlIHVzaW5nLlxuICAgIHBhcnNlciwgXG4gICAgLy8gVGhlIG9wdGlvbnMgcGFzc2VkIHRvIHRoaXMgcGFyc2UuXG4gICAgb3B0aW9ucywgaXNPcGVuKSB7XG4gICAgICAgIHRoaXMucGFyc2VyID0gcGFyc2VyO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmlzT3BlbiA9IGlzT3BlbjtcbiAgICAgICAgdGhpcy5vcGVuID0gMDtcbiAgICAgICAgbGV0IHRvcE5vZGUgPSBvcHRpb25zLnRvcE5vZGUsIHRvcENvbnRleHQ7XG4gICAgICAgIGxldCB0b3BPcHRpb25zID0gd3NPcHRpb25zRm9yKG51bGwsIG9wdGlvbnMucHJlc2VydmVXaGl0ZXNwYWNlLCAwKSB8IChpc09wZW4gPyBPUFRfT1BFTl9MRUZUIDogMCk7XG4gICAgICAgIGlmICh0b3BOb2RlKVxuICAgICAgICAgICAgdG9wQ29udGV4dCA9IG5ldyBOb2RlQ29udGV4dCh0b3BOb2RlLnR5cGUsIHRvcE5vZGUuYXR0cnMsIE1hcmsubm9uZSwgdHJ1ZSwgb3B0aW9ucy50b3BNYXRjaCB8fCB0b3BOb2RlLnR5cGUuY29udGVudE1hdGNoLCB0b3BPcHRpb25zKTtcbiAgICAgICAgZWxzZSBpZiAoaXNPcGVuKVxuICAgICAgICAgICAgdG9wQ29udGV4dCA9IG5ldyBOb2RlQ29udGV4dChudWxsLCBudWxsLCBNYXJrLm5vbmUsIHRydWUsIG51bGwsIHRvcE9wdGlvbnMpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0b3BDb250ZXh0ID0gbmV3IE5vZGVDb250ZXh0KHBhcnNlci5zY2hlbWEudG9wTm9kZVR5cGUsIG51bGwsIE1hcmsubm9uZSwgdHJ1ZSwgbnVsbCwgdG9wT3B0aW9ucyk7XG4gICAgICAgIHRoaXMubm9kZXMgPSBbdG9wQ29udGV4dF07XG4gICAgICAgIHRoaXMuZmluZCA9IG9wdGlvbnMuZmluZFBvc2l0aW9ucztcbiAgICAgICAgdGhpcy5uZWVkc0Jsb2NrID0gZmFsc2U7XG4gICAgfVxuICAgIGdldCB0b3AoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGVzW3RoaXMub3Blbl07XG4gICAgfVxuICAgIC8vIEFkZCBhIERPTSBub2RlIHRvIHRoZSBjb250ZW50LiBUZXh0IGlzIGluc2VydGVkIGFzIHRleHQgbm9kZSxcbiAgICAvLyBvdGhlcndpc2UsIHRoZSBub2RlIGlzIHBhc3NlZCB0byBgYWRkRWxlbWVudGAgb3IsIGlmIGl0IGhhcyBhXG4gICAgLy8gYHN0eWxlYCBhdHRyaWJ1dGUsIGBhZGRFbGVtZW50V2l0aFN0eWxlc2AuXG4gICAgYWRkRE9NKGRvbSwgbWFya3MpIHtcbiAgICAgICAgaWYgKGRvbS5ub2RlVHlwZSA9PSAzKVxuICAgICAgICAgICAgdGhpcy5hZGRUZXh0Tm9kZShkb20sIG1hcmtzKTtcbiAgICAgICAgZWxzZSBpZiAoZG9tLm5vZGVUeXBlID09IDEpXG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnQoZG9tLCBtYXJrcyk7XG4gICAgfVxuICAgIGFkZFRleHROb2RlKGRvbSwgbWFya3MpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gZG9tLm5vZGVWYWx1ZTtcbiAgICAgICAgbGV0IHRvcCA9IHRoaXMudG9wO1xuICAgICAgICBpZiAodG9wLm9wdGlvbnMgJiBPUFRfUFJFU0VSVkVfV1NfRlVMTCB8fFxuICAgICAgICAgICAgdG9wLmlubGluZUNvbnRleHQoZG9tKSB8fFxuICAgICAgICAgICAgL1teIFxcdFxcclxcblxcdTAwMGNdLy50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgaWYgKCEodG9wLm9wdGlvbnMgJiBPUFRfUFJFU0VSVkVfV1MpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC9bIFxcdFxcclxcblxcdTAwMGNdKy9nLCBcIiBcIik7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBzdGFydHMgd2l0aCB3aGl0ZXNwYWNlLCBhbmQgdGhlcmUgaXMgbm8gbm9kZSBiZWZvcmUgaXQsIG9yXG4gICAgICAgICAgICAgICAgLy8gYSBoYXJkIGJyZWFrLCBvciBhIHRleHQgbm9kZSB0aGF0IGVuZHMgd2l0aCB3aGl0ZXNwYWNlLCBzdHJpcCB0aGVcbiAgICAgICAgICAgICAgICAvLyBsZWFkaW5nIHNwYWNlLlxuICAgICAgICAgICAgICAgIGlmICgvXlsgXFx0XFxyXFxuXFx1MDAwY10vLnRlc3QodmFsdWUpICYmIHRoaXMub3BlbiA9PSB0aGlzLm5vZGVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5vZGVCZWZvcmUgPSB0b3AuY29udGVudFt0b3AuY29udGVudC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRvbU5vZGVCZWZvcmUgPSBkb20ucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW5vZGVCZWZvcmUgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChkb21Ob2RlQmVmb3JlICYmIGRvbU5vZGVCZWZvcmUubm9kZU5hbWUgPT0gJ0JSJykgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChub2RlQmVmb3JlLmlzVGV4dCAmJiAvWyBcXHRcXHJcXG5cXHUwMDBjXSQvLnRlc3Qobm9kZUJlZm9yZS50ZXh0KSkpXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnNsaWNlKDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCEodG9wLm9wdGlvbnMgJiBPUFRfUFJFU0VSVkVfV1NfRlVMTCkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL1xccj9cXG58XFxyL2csIFwiIFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvXFxyXFxuPy9nLCBcIlxcblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSlcbiAgICAgICAgICAgICAgICB0aGlzLmluc2VydE5vZGUodGhpcy5wYXJzZXIuc2NoZW1hLnRleHQodmFsdWUpLCBtYXJrcyk7XG4gICAgICAgICAgICB0aGlzLmZpbmRJblRleHQoZG9tKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmluZEluc2lkZShkb20pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFRyeSB0byBmaW5kIGEgaGFuZGxlciBmb3IgdGhlIGdpdmVuIHRhZyBhbmQgdXNlIHRoYXQgdG8gcGFyc2UuIElmXG4gICAgLy8gbm9uZSBpcyBmb3VuZCwgdGhlIGVsZW1lbnQncyBjb250ZW50IG5vZGVzIGFyZSBhZGRlZCBkaXJlY3RseS5cbiAgICBhZGRFbGVtZW50KGRvbSwgbWFya3MsIG1hdGNoQWZ0ZXIpIHtcbiAgICAgICAgbGV0IG5hbWUgPSBkb20ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSwgcnVsZUlEO1xuICAgICAgICBpZiAobGlzdFRhZ3MuaGFzT3duUHJvcGVydHkobmFtZSkgJiYgdGhpcy5wYXJzZXIubm9ybWFsaXplTGlzdHMpXG4gICAgICAgICAgICBub3JtYWxpemVMaXN0KGRvbSk7XG4gICAgICAgIGxldCBydWxlID0gKHRoaXMub3B0aW9ucy5ydWxlRnJvbU5vZGUgJiYgdGhpcy5vcHRpb25zLnJ1bGVGcm9tTm9kZShkb20pKSB8fFxuICAgICAgICAgICAgKHJ1bGVJRCA9IHRoaXMucGFyc2VyLm1hdGNoVGFnKGRvbSwgdGhpcywgbWF0Y2hBZnRlcikpO1xuICAgICAgICBpZiAocnVsZSA/IHJ1bGUuaWdub3JlIDogaWdub3JlVGFncy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgdGhpcy5maW5kSW5zaWRlKGRvbSk7XG4gICAgICAgICAgICB0aGlzLmlnbm9yZUZhbGxiYWNrKGRvbSwgbWFya3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFydWxlIHx8IHJ1bGUuc2tpcCB8fCBydWxlLmNsb3NlUGFyZW50KSB7XG4gICAgICAgICAgICBpZiAocnVsZSAmJiBydWxlLmNsb3NlUGFyZW50KVxuICAgICAgICAgICAgICAgIHRoaXMub3BlbiA9IE1hdGgubWF4KDAsIHRoaXMub3BlbiAtIDEpO1xuICAgICAgICAgICAgZWxzZSBpZiAocnVsZSAmJiBydWxlLnNraXAubm9kZVR5cGUpXG4gICAgICAgICAgICAgICAgZG9tID0gcnVsZS5za2lwO1xuICAgICAgICAgICAgbGV0IHN5bmMsIHRvcCA9IHRoaXMudG9wLCBvbGROZWVkc0Jsb2NrID0gdGhpcy5uZWVkc0Jsb2NrO1xuICAgICAgICAgICAgaWYgKGJsb2NrVGFncy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgICAgIGlmICh0b3AuY29udGVudC5sZW5ndGggJiYgdG9wLmNvbnRlbnRbMF0uaXNJbmxpbmUgJiYgdGhpcy5vcGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3Blbi0tO1xuICAgICAgICAgICAgICAgICAgICB0b3AgPSB0aGlzLnRvcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3luYyA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKCF0b3AudHlwZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZWVkc0Jsb2NrID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCFkb20uZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgIHRoaXMubGVhZkZhbGxiYWNrKGRvbSwgbWFya3MpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBpbm5lck1hcmtzID0gcnVsZSAmJiBydWxlLnNraXAgPyBtYXJrcyA6IHRoaXMucmVhZFN0eWxlcyhkb20sIG1hcmtzKTtcbiAgICAgICAgICAgIGlmIChpbm5lck1hcmtzKVxuICAgICAgICAgICAgICAgIHRoaXMuYWRkQWxsKGRvbSwgaW5uZXJNYXJrcyk7XG4gICAgICAgICAgICBpZiAoc3luYylcbiAgICAgICAgICAgICAgICB0aGlzLnN5bmModG9wKTtcbiAgICAgICAgICAgIHRoaXMubmVlZHNCbG9jayA9IG9sZE5lZWRzQmxvY2s7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgaW5uZXJNYXJrcyA9IHRoaXMucmVhZFN0eWxlcyhkb20sIG1hcmtzKTtcbiAgICAgICAgICAgIGlmIChpbm5lck1hcmtzKVxuICAgICAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudEJ5UnVsZShkb20sIHJ1bGUsIGlubmVyTWFya3MsIHJ1bGUuY29uc3VtaW5nID09PSBmYWxzZSA/IHJ1bGVJRCA6IHVuZGVmaW5lZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gQ2FsbGVkIGZvciBsZWFmIERPTSBub2RlcyB0aGF0IHdvdWxkIG90aGVyd2lzZSBiZSBpZ25vcmVkXG4gICAgbGVhZkZhbGxiYWNrKGRvbSwgbWFya3MpIHtcbiAgICAgICAgaWYgKGRvbS5ub2RlTmFtZSA9PSBcIkJSXCIgJiYgdGhpcy50b3AudHlwZSAmJiB0aGlzLnRvcC50eXBlLmlubGluZUNvbnRlbnQpXG4gICAgICAgICAgICB0aGlzLmFkZFRleHROb2RlKGRvbS5vd25lckRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXFxuXCIpLCBtYXJrcyk7XG4gICAgfVxuICAgIC8vIENhbGxlZCBmb3IgaWdub3JlZCBub2Rlc1xuICAgIGlnbm9yZUZhbGxiYWNrKGRvbSwgbWFya3MpIHtcbiAgICAgICAgLy8gSWdub3JlZCBCUiBub2RlcyBzaG91bGQgYXQgbGVhc3QgY3JlYXRlIGFuIGlubGluZSBjb250ZXh0XG4gICAgICAgIGlmIChkb20ubm9kZU5hbWUgPT0gXCJCUlwiICYmICghdGhpcy50b3AudHlwZSB8fCAhdGhpcy50b3AudHlwZS5pbmxpbmVDb250ZW50KSlcbiAgICAgICAgICAgIHRoaXMuZmluZFBsYWNlKHRoaXMucGFyc2VyLnNjaGVtYS50ZXh0KFwiLVwiKSwgbWFya3MpO1xuICAgIH1cbiAgICAvLyBSdW4gYW55IHN0eWxlIHBhcnNlciBhc3NvY2lhdGVkIHdpdGggdGhlIG5vZGUncyBzdHlsZXMuIEVpdGhlclxuICAgIC8vIHJldHVybiBhbiB1cGRhdGVkIGFycmF5IG9mIG1hcmtzLCBvciBudWxsIHRvIGluZGljYXRlIHNvbWUgb2YgdGhlXG4gICAgLy8gc3R5bGVzIGhhZCBhIHJ1bGUgd2l0aCBgaWdub3JlYCBzZXQuXG4gICAgcmVhZFN0eWxlcyhkb20sIG1hcmtzKSB7XG4gICAgICAgIGxldCBzdHlsZXMgPSBkb20uc3R5bGU7XG4gICAgICAgIC8vIEJlY2F1c2UgbWFueSBwcm9wZXJ0aWVzIHdpbGwgb25seSBzaG93IHVwIGluICdub3JtYWxpemVkJyBmb3JtXG4gICAgICAgIC8vIGluIGBzdHlsZS5pdGVtYCAoaS5lLiB0ZXh0LWRlY29yYXRpb24gYmVjb21lc1xuICAgICAgICAvLyB0ZXh0LWRlY29yYXRpb24tbGluZSwgdGV4dC1kZWNvcmF0aW9uLWNvbG9yLCBldGMpLCB3ZSBkaXJlY3RseVxuICAgICAgICAvLyBxdWVyeSB0aGUgc3R5bGVzIG1lbnRpb25lZCBpbiBvdXIgcnVsZXMgaW5zdGVhZCBvZiBpdGVyYXRpbmdcbiAgICAgICAgLy8gb3ZlciB0aGUgaXRlbXMuXG4gICAgICAgIGlmIChzdHlsZXMgJiYgc3R5bGVzLmxlbmd0aClcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wYXJzZXIubWF0Y2hlZFN0eWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gdGhpcy5wYXJzZXIubWF0Y2hlZFN0eWxlc1tpXSwgdmFsdWUgPSBzdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGFmdGVyID0gdW5kZWZpbmVkOzspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBydWxlID0gdGhpcy5wYXJzZXIubWF0Y2hTdHlsZShuYW1lLCB2YWx1ZSwgdGhpcywgYWZ0ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFydWxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bGUuaWdub3JlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bGUuY2xlYXJNYXJrKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtzID0gbWFya3MuZmlsdGVyKG0gPT4gIXJ1bGUuY2xlYXJNYXJrKG0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrcyA9IG1hcmtzLmNvbmNhdCh0aGlzLnBhcnNlci5zY2hlbWEubWFya3NbcnVsZS5tYXJrXS5jcmVhdGUocnVsZS5hdHRycykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bGUuY29uc3VtaW5nID09PSBmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZnRlciA9IHJ1bGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hcmtzO1xuICAgIH1cbiAgICAvLyBMb29rIHVwIGEgaGFuZGxlciBmb3IgdGhlIGdpdmVuIG5vZGUuIElmIG5vbmUgYXJlIGZvdW5kLCByZXR1cm5cbiAgICAvLyBmYWxzZS4gT3RoZXJ3aXNlLCBhcHBseSBpdCwgdXNlIGl0cyByZXR1cm4gdmFsdWUgdG8gZHJpdmUgdGhlIHdheVxuICAgIC8vIHRoZSBub2RlJ3MgY29udGVudCBpcyB3cmFwcGVkLCBhbmQgcmV0dXJuIHRydWUuXG4gICAgYWRkRWxlbWVudEJ5UnVsZShkb20sIHJ1bGUsIG1hcmtzLCBjb250aW51ZUFmdGVyKSB7XG4gICAgICAgIGxldCBzeW5jLCBub2RlVHlwZTtcbiAgICAgICAgaWYgKHJ1bGUubm9kZSkge1xuICAgICAgICAgICAgbm9kZVR5cGUgPSB0aGlzLnBhcnNlci5zY2hlbWEubm9kZXNbcnVsZS5ub2RlXTtcbiAgICAgICAgICAgIGlmICghbm9kZVR5cGUuaXNMZWFmKSB7XG4gICAgICAgICAgICAgICAgbGV0IGlubmVyID0gdGhpcy5lbnRlcihub2RlVHlwZSwgcnVsZS5hdHRycyB8fCBudWxsLCBtYXJrcywgcnVsZS5wcmVzZXJ2ZVdoaXRlc3BhY2UpO1xuICAgICAgICAgICAgICAgIGlmIChpbm5lcikge1xuICAgICAgICAgICAgICAgICAgICBzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgbWFya3MgPSBpbm5lcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICghdGhpcy5pbnNlcnROb2RlKG5vZGVUeXBlLmNyZWF0ZShydWxlLmF0dHJzKSwgbWFya3MpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sZWFmRmFsbGJhY2soZG9tLCBtYXJrcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgbWFya1R5cGUgPSB0aGlzLnBhcnNlci5zY2hlbWEubWFya3NbcnVsZS5tYXJrXTtcbiAgICAgICAgICAgIG1hcmtzID0gbWFya3MuY29uY2F0KG1hcmtUeXBlLmNyZWF0ZShydWxlLmF0dHJzKSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0YXJ0SW4gPSB0aGlzLnRvcDtcbiAgICAgICAgaWYgKG5vZGVUeXBlICYmIG5vZGVUeXBlLmlzTGVhZikge1xuICAgICAgICAgICAgdGhpcy5maW5kSW5zaWRlKGRvbSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY29udGludWVBZnRlcikge1xuICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50KGRvbSwgbWFya3MsIGNvbnRpbnVlQWZ0ZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHJ1bGUuZ2V0Q29udGVudCkge1xuICAgICAgICAgICAgdGhpcy5maW5kSW5zaWRlKGRvbSk7XG4gICAgICAgICAgICBydWxlLmdldENvbnRlbnQoZG9tLCB0aGlzLnBhcnNlci5zY2hlbWEpLmZvckVhY2gobm9kZSA9PiB0aGlzLmluc2VydE5vZGUobm9kZSwgbWFya3MpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCBjb250ZW50RE9NID0gZG9tO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBydWxlLmNvbnRlbnRFbGVtZW50ID09IFwic3RyaW5nXCIpXG4gICAgICAgICAgICAgICAgY29udGVudERPTSA9IGRvbS5xdWVyeVNlbGVjdG9yKHJ1bGUuY29udGVudEVsZW1lbnQpO1xuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIHJ1bGUuY29udGVudEVsZW1lbnQgPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00gPSBydWxlLmNvbnRlbnRFbGVtZW50KGRvbSk7XG4gICAgICAgICAgICBlbHNlIGlmIChydWxlLmNvbnRlbnRFbGVtZW50KVxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00gPSBydWxlLmNvbnRlbnRFbGVtZW50O1xuICAgICAgICAgICAgdGhpcy5maW5kQXJvdW5kKGRvbSwgY29udGVudERPTSwgdHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLmFkZEFsbChjb250ZW50RE9NLCBtYXJrcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN5bmMgJiYgdGhpcy5zeW5jKHN0YXJ0SW4pKVxuICAgICAgICAgICAgdGhpcy5vcGVuLS07XG4gICAgfVxuICAgIC8vIEFkZCBhbGwgY2hpbGQgbm9kZXMgYmV0d2VlbiBgc3RhcnRJbmRleGAgYW5kIGBlbmRJbmRleGAgKG9yIHRoZVxuICAgIC8vIHdob2xlIG5vZGUsIGlmIG5vdCBnaXZlbikuIElmIGBzeW5jYCBpcyBwYXNzZWQsIHVzZSBpdCB0b1xuICAgIC8vIHN5bmNocm9uaXplIGFmdGVyIGV2ZXJ5IGJsb2NrIGVsZW1lbnQuXG4gICAgYWRkQWxsKHBhcmVudCwgbWFya3MsIHN0YXJ0SW5kZXgsIGVuZEluZGV4KSB7XG4gICAgICAgIGxldCBpbmRleCA9IHN0YXJ0SW5kZXggfHwgMDtcbiAgICAgICAgZm9yIChsZXQgZG9tID0gc3RhcnRJbmRleCA/IHBhcmVudC5jaGlsZE5vZGVzW3N0YXJ0SW5kZXhdIDogcGFyZW50LmZpcnN0Q2hpbGQsIGVuZCA9IGVuZEluZGV4ID09IG51bGwgPyBudWxsIDogcGFyZW50LmNoaWxkTm9kZXNbZW5kSW5kZXhdOyBkb20gIT0gZW5kOyBkb20gPSBkb20ubmV4dFNpYmxpbmcsICsraW5kZXgpIHtcbiAgICAgICAgICAgIHRoaXMuZmluZEF0UG9pbnQocGFyZW50LCBpbmRleCk7XG4gICAgICAgICAgICB0aGlzLmFkZERPTShkb20sIG1hcmtzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZpbmRBdFBvaW50KHBhcmVudCwgaW5kZXgpO1xuICAgIH1cbiAgICAvLyBUcnkgdG8gZmluZCBhIHdheSB0byBmaXQgdGhlIGdpdmVuIG5vZGUgdHlwZSBpbnRvIHRoZSBjdXJyZW50XG4gICAgLy8gY29udGV4dC4gTWF5IGFkZCBpbnRlcm1lZGlhdGUgd3JhcHBlcnMgYW5kL29yIGxlYXZlIG5vbi1zb2xpZFxuICAgIC8vIG5vZGVzIHRoYXQgd2UncmUgaW4uXG4gICAgZmluZFBsYWNlKG5vZGUsIG1hcmtzKSB7XG4gICAgICAgIGxldCByb3V0ZSwgc3luYztcbiAgICAgICAgZm9yIChsZXQgZGVwdGggPSB0aGlzLm9wZW47IGRlcHRoID49IDA7IGRlcHRoLS0pIHtcbiAgICAgICAgICAgIGxldCBjeCA9IHRoaXMubm9kZXNbZGVwdGhdO1xuICAgICAgICAgICAgbGV0IGZvdW5kID0gY3guZmluZFdyYXBwaW5nKG5vZGUpO1xuICAgICAgICAgICAgaWYgKGZvdW5kICYmICghcm91dGUgfHwgcm91dGUubGVuZ3RoID4gZm91bmQubGVuZ3RoKSkge1xuICAgICAgICAgICAgICAgIHJvdXRlID0gZm91bmQ7XG4gICAgICAgICAgICAgICAgc3luYyA9IGN4O1xuICAgICAgICAgICAgICAgIGlmICghZm91bmQubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjeC5zb2xpZClcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXJvdXRlKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIHRoaXMuc3luYyhzeW5jKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb3V0ZS5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIG1hcmtzID0gdGhpcy5lbnRlcklubmVyKHJvdXRlW2ldLCBudWxsLCBtYXJrcywgZmFsc2UpO1xuICAgICAgICByZXR1cm4gbWFya3M7XG4gICAgfVxuICAgIC8vIFRyeSB0byBpbnNlcnQgdGhlIGdpdmVuIG5vZGUsIGFkanVzdGluZyB0aGUgY29udGV4dCB3aGVuIG5lZWRlZC5cbiAgICBpbnNlcnROb2RlKG5vZGUsIG1hcmtzKSB7XG4gICAgICAgIGlmIChub2RlLmlzSW5saW5lICYmIHRoaXMubmVlZHNCbG9jayAmJiAhdGhpcy50b3AudHlwZSkge1xuICAgICAgICAgICAgbGV0IGJsb2NrID0gdGhpcy50ZXh0YmxvY2tGcm9tQ29udGV4dCgpO1xuICAgICAgICAgICAgaWYgKGJsb2NrKVxuICAgICAgICAgICAgICAgIG1hcmtzID0gdGhpcy5lbnRlcklubmVyKGJsb2NrLCBudWxsLCBtYXJrcyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGlubmVyTWFya3MgPSB0aGlzLmZpbmRQbGFjZShub2RlLCBtYXJrcyk7XG4gICAgICAgIGlmIChpbm5lck1hcmtzKSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlRXh0cmEoKTtcbiAgICAgICAgICAgIGxldCB0b3AgPSB0aGlzLnRvcDtcbiAgICAgICAgICAgIGlmICh0b3AubWF0Y2gpXG4gICAgICAgICAgICAgICAgdG9wLm1hdGNoID0gdG9wLm1hdGNoLm1hdGNoVHlwZShub2RlLnR5cGUpO1xuICAgICAgICAgICAgbGV0IG5vZGVNYXJrcyA9IE1hcmsubm9uZTtcbiAgICAgICAgICAgIGZvciAobGV0IG0gb2YgaW5uZXJNYXJrcy5jb25jYXQobm9kZS5tYXJrcykpXG4gICAgICAgICAgICAgICAgaWYgKHRvcC50eXBlID8gdG9wLnR5cGUuYWxsb3dzTWFya1R5cGUobS50eXBlKSA6IG1hcmtNYXlBcHBseShtLnR5cGUsIG5vZGUudHlwZSkpXG4gICAgICAgICAgICAgICAgICAgIG5vZGVNYXJrcyA9IG0uYWRkVG9TZXQobm9kZU1hcmtzKTtcbiAgICAgICAgICAgIHRvcC5jb250ZW50LnB1c2gobm9kZS5tYXJrKG5vZGVNYXJrcykpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBUcnkgdG8gc3RhcnQgYSBub2RlIG9mIHRoZSBnaXZlbiB0eXBlLCBhZGp1c3RpbmcgdGhlIGNvbnRleHQgd2hlblxuICAgIC8vIG5lY2Vzc2FyeS5cbiAgICBlbnRlcih0eXBlLCBhdHRycywgbWFya3MsIHByZXNlcnZlV1MpIHtcbiAgICAgICAgbGV0IGlubmVyTWFya3MgPSB0aGlzLmZpbmRQbGFjZSh0eXBlLmNyZWF0ZShhdHRycyksIG1hcmtzKTtcbiAgICAgICAgaWYgKGlubmVyTWFya3MpXG4gICAgICAgICAgICBpbm5lck1hcmtzID0gdGhpcy5lbnRlcklubmVyKHR5cGUsIGF0dHJzLCBtYXJrcywgdHJ1ZSwgcHJlc2VydmVXUyk7XG4gICAgICAgIHJldHVybiBpbm5lck1hcmtzO1xuICAgIH1cbiAgICAvLyBPcGVuIGEgbm9kZSBvZiB0aGUgZ2l2ZW4gdHlwZVxuICAgIGVudGVySW5uZXIodHlwZSwgYXR0cnMsIG1hcmtzLCBzb2xpZCA9IGZhbHNlLCBwcmVzZXJ2ZVdTKSB7XG4gICAgICAgIHRoaXMuY2xvc2VFeHRyYSgpO1xuICAgICAgICBsZXQgdG9wID0gdGhpcy50b3A7XG4gICAgICAgIHRvcC5tYXRjaCA9IHRvcC5tYXRjaCAmJiB0b3AubWF0Y2gubWF0Y2hUeXBlKHR5cGUpO1xuICAgICAgICBsZXQgb3B0aW9ucyA9IHdzT3B0aW9uc0Zvcih0eXBlLCBwcmVzZXJ2ZVdTLCB0b3Aub3B0aW9ucyk7XG4gICAgICAgIGlmICgodG9wLm9wdGlvbnMgJiBPUFRfT1BFTl9MRUZUKSAmJiB0b3AuY29udGVudC5sZW5ndGggPT0gMClcbiAgICAgICAgICAgIG9wdGlvbnMgfD0gT1BUX09QRU5fTEVGVDtcbiAgICAgICAgbGV0IGFwcGx5TWFya3MgPSBNYXJrLm5vbmU7XG4gICAgICAgIG1hcmtzID0gbWFya3MuZmlsdGVyKG0gPT4ge1xuICAgICAgICAgICAgaWYgKHRvcC50eXBlID8gdG9wLnR5cGUuYWxsb3dzTWFya1R5cGUobS50eXBlKSA6IG1hcmtNYXlBcHBseShtLnR5cGUsIHR5cGUpKSB7XG4gICAgICAgICAgICAgICAgYXBwbHlNYXJrcyA9IG0uYWRkVG9TZXQoYXBwbHlNYXJrcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm5vZGVzLnB1c2gobmV3IE5vZGVDb250ZXh0KHR5cGUsIGF0dHJzLCBhcHBseU1hcmtzLCBzb2xpZCwgbnVsbCwgb3B0aW9ucykpO1xuICAgICAgICB0aGlzLm9wZW4rKztcbiAgICAgICAgcmV0dXJuIG1hcmtzO1xuICAgIH1cbiAgICAvLyBNYWtlIHN1cmUgYWxsIG5vZGVzIGFib3ZlIHRoaXMub3BlbiBhcmUgZmluaXNoZWQgYW5kIGFkZGVkIHRvXG4gICAgLy8gdGhlaXIgcGFyZW50c1xuICAgIGNsb3NlRXh0cmEob3BlbkVuZCA9IGZhbHNlKSB7XG4gICAgICAgIGxldCBpID0gdGhpcy5ub2Rlcy5sZW5ndGggLSAxO1xuICAgICAgICBpZiAoaSA+IHRoaXMub3Blbikge1xuICAgICAgICAgICAgZm9yICg7IGkgPiB0aGlzLm9wZW47IGktLSlcbiAgICAgICAgICAgICAgICB0aGlzLm5vZGVzW2kgLSAxXS5jb250ZW50LnB1c2godGhpcy5ub2Rlc1tpXS5maW5pc2gob3BlbkVuZCkpO1xuICAgICAgICAgICAgdGhpcy5ub2Rlcy5sZW5ndGggPSB0aGlzLm9wZW4gKyAxO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZpbmlzaCgpIHtcbiAgICAgICAgdGhpcy5vcGVuID0gMDtcbiAgICAgICAgdGhpcy5jbG9zZUV4dHJhKHRoaXMuaXNPcGVuKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZXNbMF0uZmluaXNoKHRoaXMuaXNPcGVuIHx8IHRoaXMub3B0aW9ucy50b3BPcGVuKTtcbiAgICB9XG4gICAgc3luYyh0bykge1xuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5vcGVuOyBpID49IDA7IGktLSlcbiAgICAgICAgICAgIGlmICh0aGlzLm5vZGVzW2ldID09IHRvKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcGVuID0gaTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBnZXQgY3VycmVudFBvcygpIHtcbiAgICAgICAgdGhpcy5jbG9zZUV4dHJhKCk7XG4gICAgICAgIGxldCBwb3MgPSAwO1xuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5vcGVuOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSB0aGlzLm5vZGVzW2ldLmNvbnRlbnQ7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gY29udGVudC5sZW5ndGggLSAxOyBqID49IDA7IGotLSlcbiAgICAgICAgICAgICAgICBwb3MgKz0gY29udGVudFtqXS5ub2RlU2l6ZTtcbiAgICAgICAgICAgIGlmIChpKVxuICAgICAgICAgICAgICAgIHBvcysrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwb3M7XG4gICAgfVxuICAgIGZpbmRBdFBvaW50KHBhcmVudCwgb2Zmc2V0KSB7XG4gICAgICAgIGlmICh0aGlzLmZpbmQpXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmluZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpbmRbaV0ubm9kZSA9PSBwYXJlbnQgJiYgdGhpcy5maW5kW2ldLm9mZnNldCA9PSBvZmZzZXQpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmluZFtpXS5wb3MgPSB0aGlzLmN1cnJlbnRQb3M7XG4gICAgICAgICAgICB9XG4gICAgfVxuICAgIGZpbmRJbnNpZGUocGFyZW50KSB7XG4gICAgICAgIGlmICh0aGlzLmZpbmQpXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmluZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpbmRbaV0ucG9zID09IG51bGwgJiYgcGFyZW50Lm5vZGVUeXBlID09IDEgJiYgcGFyZW50LmNvbnRhaW5zKHRoaXMuZmluZFtpXS5ub2RlKSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maW5kW2ldLnBvcyA9IHRoaXMuY3VycmVudFBvcztcbiAgICAgICAgICAgIH1cbiAgICB9XG4gICAgZmluZEFyb3VuZChwYXJlbnQsIGNvbnRlbnQsIGJlZm9yZSkge1xuICAgICAgICBpZiAocGFyZW50ICE9IGNvbnRlbnQgJiYgdGhpcy5maW5kKVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZpbmQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5maW5kW2ldLnBvcyA9PSBudWxsICYmIHBhcmVudC5ub2RlVHlwZSA9PSAxICYmIHBhcmVudC5jb250YWlucyh0aGlzLmZpbmRbaV0ubm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBvcyA9IGNvbnRlbnQuY29tcGFyZURvY3VtZW50UG9zaXRpb24odGhpcy5maW5kW2ldLm5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9zICYgKGJlZm9yZSA/IDIgOiA0KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmluZFtpXS5wb3MgPSB0aGlzLmN1cnJlbnRQb3M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgIH1cbiAgICBmaW5kSW5UZXh0KHRleHROb2RlKSB7XG4gICAgICAgIGlmICh0aGlzLmZpbmQpXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmluZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpbmRbaV0ubm9kZSA9PSB0ZXh0Tm9kZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maW5kW2ldLnBvcyA9IHRoaXMuY3VycmVudFBvcyAtICh0ZXh0Tm9kZS5ub2RlVmFsdWUubGVuZ3RoIC0gdGhpcy5maW5kW2ldLm9mZnNldCk7XG4gICAgICAgICAgICB9XG4gICAgfVxuICAgIC8vIERldGVybWluZXMgd2hldGhlciB0aGUgZ2l2ZW4gY29udGV4dCBzdHJpbmcgbWF0Y2hlcyB0aGlzIGNvbnRleHQuXG4gICAgbWF0Y2hlc0NvbnRleHQoY29udGV4dCkge1xuICAgICAgICBpZiAoY29udGV4dC5pbmRleE9mKFwifFwiKSA+IC0xKVxuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuc3BsaXQoL1xccypcXHxcXHMqLykuc29tZSh0aGlzLm1hdGNoZXNDb250ZXh0LCB0aGlzKTtcbiAgICAgICAgbGV0IHBhcnRzID0gY29udGV4dC5zcGxpdChcIi9cIik7XG4gICAgICAgIGxldCBvcHRpb24gPSB0aGlzLm9wdGlvbnMuY29udGV4dDtcbiAgICAgICAgbGV0IHVzZVJvb3QgPSAhdGhpcy5pc09wZW4gJiYgKCFvcHRpb24gfHwgb3B0aW9uLnBhcmVudC50eXBlID09IHRoaXMubm9kZXNbMF0udHlwZSk7XG4gICAgICAgIGxldCBtaW5EZXB0aCA9IC0ob3B0aW9uID8gb3B0aW9uLmRlcHRoICsgMSA6IDApICsgKHVzZVJvb3QgPyAwIDogMSk7XG4gICAgICAgIGxldCBtYXRjaCA9IChpLCBkZXB0aCkgPT4ge1xuICAgICAgICAgICAgZm9yICg7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhcnQgPSBwYXJ0c1tpXTtcbiAgICAgICAgICAgICAgICBpZiAocGFydCA9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpID09IHBhcnRzLmxlbmd0aCAtIDEgfHwgaSA9PSAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoOyBkZXB0aCA+PSBtaW5EZXB0aDsgZGVwdGgtLSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaChpIC0gMSwgZGVwdGgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dCA9IGRlcHRoID4gMCB8fCAoZGVwdGggPT0gMCAmJiB1c2VSb290KSA/IHRoaXMubm9kZXNbZGVwdGhdLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIDogb3B0aW9uICYmIGRlcHRoID49IG1pbkRlcHRoID8gb3B0aW9uLm5vZGUoZGVwdGggLSBtaW5EZXB0aCkudHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXh0IHx8IChuZXh0Lm5hbWUgIT0gcGFydCAmJiBuZXh0Lmdyb3Vwcy5pbmRleE9mKHBhcnQpID09IC0xKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZGVwdGgtLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIG1hdGNoKHBhcnRzLmxlbmd0aCAtIDEsIHRoaXMub3Blbik7XG4gICAgfVxuICAgIHRleHRibG9ja0Zyb21Db250ZXh0KCkge1xuICAgICAgICBsZXQgJGNvbnRleHQgPSB0aGlzLm9wdGlvbnMuY29udGV4dDtcbiAgICAgICAgaWYgKCRjb250ZXh0KVxuICAgICAgICAgICAgZm9yIChsZXQgZCA9ICRjb250ZXh0LmRlcHRoOyBkID49IDA7IGQtLSkge1xuICAgICAgICAgICAgICAgIGxldCBkZWZsdCA9ICRjb250ZXh0Lm5vZGUoZCkuY29udGVudE1hdGNoQXQoJGNvbnRleHQuaW5kZXhBZnRlcihkKSkuZGVmYXVsdFR5cGU7XG4gICAgICAgICAgICAgICAgaWYgKGRlZmx0ICYmIGRlZmx0LmlzVGV4dGJsb2NrICYmIGRlZmx0LmRlZmF1bHRBdHRycylcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmx0O1xuICAgICAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBuYW1lIGluIHRoaXMucGFyc2VyLnNjaGVtYS5ub2Rlcykge1xuICAgICAgICAgICAgbGV0IHR5cGUgPSB0aGlzLnBhcnNlci5zY2hlbWEubm9kZXNbbmFtZV07XG4gICAgICAgICAgICBpZiAodHlwZS5pc1RleHRibG9jayAmJiB0eXBlLmRlZmF1bHRBdHRycylcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vIEtsdWRnZSB0byB3b3JrIGFyb3VuZCBkaXJlY3RseSBuZXN0ZWQgbGlzdCBub2RlcyBwcm9kdWNlZCBieSBzb21lXG4vLyB0b29scyBhbmQgYWxsb3dlZCBieSBicm93c2VycyB0byBtZWFuIHRoYXQgdGhlIG5lc3RlZCBsaXN0IGlzXG4vLyBhY3R1YWxseSBwYXJ0IG9mIHRoZSBsaXN0IGl0ZW0gYWJvdmUgaXQuXG5mdW5jdGlvbiBub3JtYWxpemVMaXN0KGRvbSkge1xuICAgIGZvciAobGV0IGNoaWxkID0gZG9tLmZpcnN0Q2hpbGQsIHByZXZJdGVtID0gbnVsbDsgY2hpbGQ7IGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgbGV0IG5hbWUgPSBjaGlsZC5ub2RlVHlwZSA9PSAxID8gY2hpbGQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA6IG51bGw7XG4gICAgICAgIGlmIChuYW1lICYmIGxpc3RUYWdzLmhhc093blByb3BlcnR5KG5hbWUpICYmIHByZXZJdGVtKSB7XG4gICAgICAgICAgICBwcmV2SXRlbS5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgICAgICAgICBjaGlsZCA9IHByZXZJdGVtO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5hbWUgPT0gXCJsaVwiKSB7XG4gICAgICAgICAgICBwcmV2SXRlbSA9IGNoaWxkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgIHByZXZJdGVtID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vIEFwcGx5IGEgQ1NTIHNlbGVjdG9yLlxuZnVuY3Rpb24gbWF0Y2hlcyhkb20sIHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIChkb20ubWF0Y2hlcyB8fCBkb20ubXNNYXRjaGVzU2VsZWN0b3IgfHwgZG9tLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBkb20ubW96TWF0Y2hlc1NlbGVjdG9yKS5jYWxsKGRvbSwgc2VsZWN0b3IpO1xufVxuZnVuY3Rpb24gY29weShvYmopIHtcbiAgICBsZXQgY29weSA9IHt9O1xuICAgIGZvciAobGV0IHByb3AgaW4gb2JqKVxuICAgICAgICBjb3B5W3Byb3BdID0gb2JqW3Byb3BdO1xuICAgIHJldHVybiBjb3B5O1xufVxuLy8gVXNlZCB3aGVuIGZpbmRpbmcgYSBtYXJrIGF0IHRoZSB0b3AgbGV2ZWwgb2YgYSBmcmFnbWVudCBwYXJzZS5cbi8vIENoZWNrcyB3aGV0aGVyIGl0IHdvdWxkIGJlIHJlYXNvbmFibGUgdG8gYXBwbHkgYSBnaXZlbiBtYXJrIHR5cGUgdG9cbi8vIGEgZ2l2ZW4gbm9kZSwgYnkgbG9va2luZyBhdCB0aGUgd2F5IHRoZSBtYXJrIG9jY3VycyBpbiB0aGUgc2NoZW1hLlxuZnVuY3Rpb24gbWFya01heUFwcGx5KG1hcmtUeXBlLCBub2RlVHlwZSkge1xuICAgIGxldCBub2RlcyA9IG5vZGVUeXBlLnNjaGVtYS5ub2RlcztcbiAgICBmb3IgKGxldCBuYW1lIGluIG5vZGVzKSB7XG4gICAgICAgIGxldCBwYXJlbnQgPSBub2Rlc1tuYW1lXTtcbiAgICAgICAgaWYgKCFwYXJlbnQuYWxsb3dzTWFya1R5cGUobWFya1R5cGUpKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIGxldCBzZWVuID0gW10sIHNjYW4gPSAobWF0Y2gpID0+IHtcbiAgICAgICAgICAgIHNlZW4ucHVzaChtYXRjaCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoLmVkZ2VDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHsgdHlwZSwgbmV4dCB9ID0gbWF0Y2guZWRnZShpKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PSBub2RlVHlwZSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKHNlZW4uaW5kZXhPZihuZXh0KSA8IDAgJiYgc2NhbihuZXh0KSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChzY2FuKHBhcmVudC5jb250ZW50TWF0Y2gpKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuXG4vKipcbkEgRE9NIHNlcmlhbGl6ZXIga25vd3MgaG93IHRvIGNvbnZlcnQgUHJvc2VNaXJyb3Igbm9kZXMgYW5kXG5tYXJrcyBvZiB2YXJpb3VzIHR5cGVzIHRvIERPTSBub2Rlcy5cbiovXG5jbGFzcyBET01TZXJpYWxpemVyIHtcbiAgICAvKipcbiAgICBDcmVhdGUgYSBzZXJpYWxpemVyLiBgbm9kZXNgIHNob3VsZCBtYXAgbm9kZSBuYW1lcyB0byBmdW5jdGlvbnNcbiAgICB0aGF0IHRha2UgYSBub2RlIGFuZCByZXR1cm4gYSBkZXNjcmlwdGlvbiBvZiB0aGUgY29ycmVzcG9uZGluZ1xuICAgIERPTS4gYG1hcmtzYCBkb2VzIHRoZSBzYW1lIGZvciBtYXJrIG5hbWVzLCBidXQgYWxzbyBnZXRzIGFuXG4gICAgYXJndW1lbnQgdGhhdCB0ZWxscyBpdCB3aGV0aGVyIHRoZSBtYXJrJ3MgY29udGVudCBpcyBibG9jayBvclxuICAgIGlubGluZSBjb250ZW50IChmb3IgdHlwaWNhbCB1c2UsIGl0J2xsIGFsd2F5cyBiZSBpbmxpbmUpLiBBIG1hcmtcbiAgICBzZXJpYWxpemVyIG1heSBiZSBgbnVsbGAgdG8gaW5kaWNhdGUgdGhhdCBtYXJrcyBvZiB0aGF0IHR5cGVcbiAgICBzaG91bGQgbm90IGJlIHNlcmlhbGl6ZWQuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAvKipcbiAgICBUaGUgbm9kZSBzZXJpYWxpemF0aW9uIGZ1bmN0aW9ucy5cbiAgICAqL1xuICAgIG5vZGVzLCBcbiAgICAvKipcbiAgICBUaGUgbWFyayBzZXJpYWxpemF0aW9uIGZ1bmN0aW9ucy5cbiAgICAqL1xuICAgIG1hcmtzKSB7XG4gICAgICAgIHRoaXMubm9kZXMgPSBub2RlcztcbiAgICAgICAgdGhpcy5tYXJrcyA9IG1hcmtzO1xuICAgIH1cbiAgICAvKipcbiAgICBTZXJpYWxpemUgdGhlIGNvbnRlbnQgb2YgdGhpcyBmcmFnbWVudCB0byBhIERPTSBmcmFnbWVudC4gV2hlblxuICAgIG5vdCBpbiB0aGUgYnJvd3NlciwgdGhlIGBkb2N1bWVudGAgb3B0aW9uLCBjb250YWluaW5nIGEgRE9NXG4gICAgZG9jdW1lbnQsIHNob3VsZCBiZSBwYXNzZWQgc28gdGhhdCB0aGUgc2VyaWFsaXplciBjYW4gY3JlYXRlXG4gICAgbm9kZXMuXG4gICAgKi9cbiAgICBzZXJpYWxpemVGcmFnbWVudChmcmFnbWVudCwgb3B0aW9ucyA9IHt9LCB0YXJnZXQpIHtcbiAgICAgICAgaWYgKCF0YXJnZXQpXG4gICAgICAgICAgICB0YXJnZXQgPSBkb2Mob3B0aW9ucykuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgICAgICBsZXQgdG9wID0gdGFyZ2V0LCBhY3RpdmUgPSBbXTtcbiAgICAgICAgZnJhZ21lbnQuZm9yRWFjaChub2RlID0+IHtcbiAgICAgICAgICAgIGlmIChhY3RpdmUubGVuZ3RoIHx8IG5vZGUubWFya3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgbGV0IGtlZXAgPSAwLCByZW5kZXJlZCA9IDA7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGtlZXAgPCBhY3RpdmUubGVuZ3RoICYmIHJlbmRlcmVkIDwgbm9kZS5tYXJrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5leHQgPSBub2RlLm1hcmtzW3JlbmRlcmVkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLm1hcmtzW25leHQudHlwZS5uYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZWQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghbmV4dC5lcShhY3RpdmVba2VlcF1bMF0pIHx8IG5leHQudHlwZS5zcGVjLnNwYW5uaW5nID09PSBmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBrZWVwKys7XG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmVkKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHdoaWxlIChrZWVwIDwgYWN0aXZlLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgdG9wID0gYWN0aXZlLnBvcCgpWzFdO1xuICAgICAgICAgICAgICAgIHdoaWxlIChyZW5kZXJlZCA8IG5vZGUubWFya3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBhZGQgPSBub2RlLm1hcmtzW3JlbmRlcmVkKytdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgbWFya0RPTSA9IHRoaXMuc2VyaWFsaXplTWFyayhhZGQsIG5vZGUuaXNJbmxpbmUsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWFya0RPTSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlLnB1c2goW2FkZCwgdG9wXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3AuYXBwZW5kQ2hpbGQobWFya0RPTS5kb20pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9wID0gbWFya0RPTS5jb250ZW50RE9NIHx8IG1hcmtET00uZG9tO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG9wLmFwcGVuZENoaWxkKHRoaXMuc2VyaWFsaXplTm9kZUlubmVyKG5vZGUsIG9wdGlvbnMpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgc2VyaWFsaXplTm9kZUlubmVyKG5vZGUsIG9wdGlvbnMpIHtcbiAgICAgICAgbGV0IHsgZG9tLCBjb250ZW50RE9NIH0gPSByZW5kZXJTcGVjKGRvYyhvcHRpb25zKSwgdGhpcy5ub2Rlc1tub2RlLnR5cGUubmFtZV0obm9kZSksIG51bGwsIG5vZGUuYXR0cnMpO1xuICAgICAgICBpZiAoY29udGVudERPTSkge1xuICAgICAgICAgICAgaWYgKG5vZGUuaXNMZWFmKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiQ29udGVudCBob2xlIG5vdCBhbGxvd2VkIGluIGEgbGVhZiBub2RlIHNwZWNcIik7XG4gICAgICAgICAgICB0aGlzLnNlcmlhbGl6ZUZyYWdtZW50KG5vZGUuY29udGVudCwgb3B0aW9ucywgY29udGVudERPTSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRvbTtcbiAgICB9XG4gICAgLyoqXG4gICAgU2VyaWFsaXplIHRoaXMgbm9kZSB0byBhIERPTSBub2RlLiBUaGlzIGNhbiBiZSB1c2VmdWwgd2hlbiB5b3VcbiAgICBuZWVkIHRvIHNlcmlhbGl6ZSBhIHBhcnQgb2YgYSBkb2N1bWVudCwgYXMgb3Bwb3NlZCB0byB0aGUgd2hvbGVcbiAgICBkb2N1bWVudC4gVG8gc2VyaWFsaXplIGEgd2hvbGUgZG9jdW1lbnQsIHVzZVxuICAgIFtgc2VyaWFsaXplRnJhZ21lbnRgXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuRE9NU2VyaWFsaXplci5zZXJpYWxpemVGcmFnbWVudCkgb25cbiAgICBpdHMgW2NvbnRlbnRdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5Ob2RlLmNvbnRlbnQpLlxuICAgICovXG4gICAgc2VyaWFsaXplTm9kZShub2RlLCBvcHRpb25zID0ge30pIHtcbiAgICAgICAgbGV0IGRvbSA9IHRoaXMuc2VyaWFsaXplTm9kZUlubmVyKG5vZGUsIG9wdGlvbnMpO1xuICAgICAgICBmb3IgKGxldCBpID0gbm9kZS5tYXJrcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgbGV0IHdyYXAgPSB0aGlzLnNlcmlhbGl6ZU1hcmsobm9kZS5tYXJrc1tpXSwgbm9kZS5pc0lubGluZSwgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAod3JhcCkge1xuICAgICAgICAgICAgICAgICh3cmFwLmNvbnRlbnRET00gfHwgd3JhcC5kb20pLmFwcGVuZENoaWxkKGRvbSk7XG4gICAgICAgICAgICAgICAgZG9tID0gd3JhcC5kb207XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRvbTtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBzZXJpYWxpemVNYXJrKG1hcmssIGlubGluZSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIGxldCB0b0RPTSA9IHRoaXMubWFya3NbbWFyay50eXBlLm5hbWVdO1xuICAgICAgICByZXR1cm4gdG9ET00gJiYgcmVuZGVyU3BlYyhkb2Mob3B0aW9ucyksIHRvRE9NKG1hcmssIGlubGluZSksIG51bGwsIG1hcmsuYXR0cnMpO1xuICAgIH1cbiAgICBzdGF0aWMgcmVuZGVyU3BlYyhkb2MsIHN0cnVjdHVyZSwgeG1sTlMgPSBudWxsLCBibG9ja0FycmF5c0luKSB7XG4gICAgICAgIHJldHVybiByZW5kZXJTcGVjKGRvYywgc3RydWN0dXJlLCB4bWxOUywgYmxvY2tBcnJheXNJbik7XG4gICAgfVxuICAgIC8qKlxuICAgIEJ1aWxkIGEgc2VyaWFsaXplciB1c2luZyB0aGUgW2B0b0RPTWBdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5Ob2RlU3BlYy50b0RPTSlcbiAgICBwcm9wZXJ0aWVzIGluIGEgc2NoZW1hJ3Mgbm9kZSBhbmQgbWFyayBzcGVjcy5cbiAgICAqL1xuICAgIHN0YXRpYyBmcm9tU2NoZW1hKHNjaGVtYSkge1xuICAgICAgICByZXR1cm4gc2NoZW1hLmNhY2hlZC5kb21TZXJpYWxpemVyIHx8XG4gICAgICAgICAgICAoc2NoZW1hLmNhY2hlZC5kb21TZXJpYWxpemVyID0gbmV3IERPTVNlcmlhbGl6ZXIodGhpcy5ub2Rlc0Zyb21TY2hlbWEoc2NoZW1hKSwgdGhpcy5tYXJrc0Zyb21TY2hlbWEoc2NoZW1hKSkpO1xuICAgIH1cbiAgICAvKipcbiAgICBHYXRoZXIgdGhlIHNlcmlhbGl6ZXJzIGluIGEgc2NoZW1hJ3Mgbm9kZSBzcGVjcyBpbnRvIGFuIG9iamVjdC5cbiAgICBUaGlzIGNhbiBiZSB1c2VmdWwgYXMgYSBiYXNlIHRvIGJ1aWxkIGEgY3VzdG9tIHNlcmlhbGl6ZXIgZnJvbS5cbiAgICAqL1xuICAgIHN0YXRpYyBub2Rlc0Zyb21TY2hlbWEoc2NoZW1hKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBnYXRoZXJUb0RPTShzY2hlbWEubm9kZXMpO1xuICAgICAgICBpZiAoIXJlc3VsdC50ZXh0KVxuICAgICAgICAgICAgcmVzdWx0LnRleHQgPSBub2RlID0+IG5vZGUudGV4dDtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgLyoqXG4gICAgR2F0aGVyIHRoZSBzZXJpYWxpemVycyBpbiBhIHNjaGVtYSdzIG1hcmsgc3BlY3MgaW50byBhbiBvYmplY3QuXG4gICAgKi9cbiAgICBzdGF0aWMgbWFya3NGcm9tU2NoZW1hKHNjaGVtYSkge1xuICAgICAgICByZXR1cm4gZ2F0aGVyVG9ET00oc2NoZW1hLm1hcmtzKTtcbiAgICB9XG59XG5mdW5jdGlvbiBnYXRoZXJUb0RPTShvYmopIHtcbiAgICBsZXQgcmVzdWx0ID0ge307XG4gICAgZm9yIChsZXQgbmFtZSBpbiBvYmopIHtcbiAgICAgICAgbGV0IHRvRE9NID0gb2JqW25hbWVdLnNwZWMudG9ET007XG4gICAgICAgIGlmICh0b0RPTSlcbiAgICAgICAgICAgIHJlc3VsdFtuYW1lXSA9IHRvRE9NO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gZG9jKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5kb2N1bWVudCB8fCB3aW5kb3cuZG9jdW1lbnQ7XG59XG5jb25zdCBzdXNwaWNpb3VzQXR0cmlidXRlQ2FjaGUgPSBuZXcgV2Vha01hcCgpO1xuZnVuY3Rpb24gc3VzcGljaW91c0F0dHJpYnV0ZXMoYXR0cnMpIHtcbiAgICBsZXQgdmFsdWUgPSBzdXNwaWNpb3VzQXR0cmlidXRlQ2FjaGUuZ2V0KGF0dHJzKTtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgc3VzcGljaW91c0F0dHJpYnV0ZUNhY2hlLnNldChhdHRycywgdmFsdWUgPSBzdXNwaWNpb3VzQXR0cmlidXRlc0lubmVyKGF0dHJzKSk7XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuZnVuY3Rpb24gc3VzcGljaW91c0F0dHJpYnV0ZXNJbm5lcihhdHRycykge1xuICAgIGxldCByZXN1bHQgPSBudWxsO1xuICAgIGZ1bmN0aW9uIHNjYW4odmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlWzBdID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYW4odmFsdWVbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHByb3AgaW4gdmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIHNjYW4odmFsdWVbcHJvcF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHNjYW4oYXR0cnMpO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiByZW5kZXJTcGVjKGRvYywgc3RydWN0dXJlLCB4bWxOUywgYmxvY2tBcnJheXNJbikge1xuICAgIGlmICh0eXBlb2Ygc3RydWN0dXJlID09IFwic3RyaW5nXCIpXG4gICAgICAgIHJldHVybiB7IGRvbTogZG9jLmNyZWF0ZVRleHROb2RlKHN0cnVjdHVyZSkgfTtcbiAgICBpZiAoc3RydWN0dXJlLm5vZGVUeXBlICE9IG51bGwpXG4gICAgICAgIHJldHVybiB7IGRvbTogc3RydWN0dXJlIH07XG4gICAgaWYgKHN0cnVjdHVyZS5kb20gJiYgc3RydWN0dXJlLmRvbS5ub2RlVHlwZSAhPSBudWxsKVxuICAgICAgICByZXR1cm4gc3RydWN0dXJlO1xuICAgIGxldCB0YWdOYW1lID0gc3RydWN0dXJlWzBdLCBzdXNwaWNpb3VzO1xuICAgIGlmICh0eXBlb2YgdGFnTmFtZSAhPSBcInN0cmluZ1wiKVxuICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkludmFsaWQgYXJyYXkgcGFzc2VkIHRvIHJlbmRlclNwZWNcIik7XG4gICAgaWYgKGJsb2NrQXJyYXlzSW4gJiYgKHN1c3BpY2lvdXMgPSBzdXNwaWNpb3VzQXR0cmlidXRlcyhibG9ja0FycmF5c0luKSkgJiZcbiAgICAgICAgc3VzcGljaW91cy5pbmRleE9mKHN0cnVjdHVyZSkgPiAtMSlcbiAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJVc2luZyBhbiBhcnJheSBmcm9tIGFuIGF0dHJpYnV0ZSBvYmplY3QgYXMgYSBET00gc3BlYy4gVGhpcyBtYXkgYmUgYW4gYXR0ZW1wdGVkIGNyb3NzIHNpdGUgc2NyaXB0aW5nIGF0dGFjay5cIik7XG4gICAgbGV0IHNwYWNlID0gdGFnTmFtZS5pbmRleE9mKFwiIFwiKTtcbiAgICBpZiAoc3BhY2UgPiAwKSB7XG4gICAgICAgIHhtbE5TID0gdGFnTmFtZS5zbGljZSgwLCBzcGFjZSk7XG4gICAgICAgIHRhZ05hbWUgPSB0YWdOYW1lLnNsaWNlKHNwYWNlICsgMSk7XG4gICAgfVxuICAgIGxldCBjb250ZW50RE9NO1xuICAgIGxldCBkb20gPSAoeG1sTlMgPyBkb2MuY3JlYXRlRWxlbWVudE5TKHhtbE5TLCB0YWdOYW1lKSA6IGRvYy5jcmVhdGVFbGVtZW50KHRhZ05hbWUpKTtcbiAgICBsZXQgYXR0cnMgPSBzdHJ1Y3R1cmVbMV0sIHN0YXJ0ID0gMTtcbiAgICBpZiAoYXR0cnMgJiYgdHlwZW9mIGF0dHJzID09IFwib2JqZWN0XCIgJiYgYXR0cnMubm9kZVR5cGUgPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheShhdHRycykpIHtcbiAgICAgICAgc3RhcnQgPSAyO1xuICAgICAgICBmb3IgKGxldCBuYW1lIGluIGF0dHJzKVxuICAgICAgICAgICAgaWYgKGF0dHJzW25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3BhY2UgPSBuYW1lLmluZGV4T2YoXCIgXCIpO1xuICAgICAgICAgICAgICAgIGlmIChzcGFjZSA+IDApXG4gICAgICAgICAgICAgICAgICAgIGRvbS5zZXRBdHRyaWJ1dGVOUyhuYW1lLnNsaWNlKDAsIHNwYWNlKSwgbmFtZS5zbGljZShzcGFjZSArIDEpLCBhdHRyc1tuYW1lXSk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBkb20uc2V0QXR0cmlidXRlKG5hbWUsIGF0dHJzW25hbWVdKTtcbiAgICAgICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgc3RydWN0dXJlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBjaGlsZCA9IHN0cnVjdHVyZVtpXTtcbiAgICAgICAgaWYgKGNoaWxkID09PSAwKSB7XG4gICAgICAgICAgICBpZiAoaSA8IHN0cnVjdHVyZS5sZW5ndGggLSAxIHx8IGkgPiBzdGFydClcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkNvbnRlbnQgaG9sZSBtdXN0IGJlIHRoZSBvbmx5IGNoaWxkIG9mIGl0cyBwYXJlbnQgbm9kZVwiKTtcbiAgICAgICAgICAgIHJldHVybiB7IGRvbSwgY29udGVudERPTTogZG9tIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgeyBkb206IGlubmVyLCBjb250ZW50RE9NOiBpbm5lckNvbnRlbnQgfSA9IHJlbmRlclNwZWMoZG9jLCBjaGlsZCwgeG1sTlMsIGJsb2NrQXJyYXlzSW4pO1xuICAgICAgICAgICAgZG9tLmFwcGVuZENoaWxkKGlubmVyKTtcbiAgICAgICAgICAgIGlmIChpbm5lckNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29udGVudERPTSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJNdWx0aXBsZSBjb250ZW50IGhvbGVzXCIpO1xuICAgICAgICAgICAgICAgIGNvbnRlbnRET00gPSBpbm5lckNvbnRlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgZG9tLCBjb250ZW50RE9NIH07XG59XG5cbmV4cG9ydCB7IENvbnRlbnRNYXRjaCwgRE9NUGFyc2VyLCBET01TZXJpYWxpemVyLCBGcmFnbWVudCwgTWFyaywgTWFya1R5cGUsIE5vZGUsIE5vZGVSYW5nZSwgTm9kZVR5cGUsIFJlcGxhY2VFcnJvciwgUmVzb2x2ZWRQb3MsIFNjaGVtYSwgU2xpY2UgfTtcbiIsICJpbXBvcnQgeyBSZXBsYWNlRXJyb3IsIFNsaWNlLCBGcmFnbWVudCwgTWFya1R5cGUsIE1hcmsgfSBmcm9tICdwcm9zZW1pcnJvci1tb2RlbCc7XG5cbi8vIFJlY292ZXJ5IHZhbHVlcyBlbmNvZGUgYSByYW5nZSBpbmRleCBhbmQgYW4gb2Zmc2V0LiBUaGV5IGFyZVxuLy8gcmVwcmVzZW50ZWQgYXMgbnVtYmVycywgYmVjYXVzZSB0b25zIG9mIHRoZW0gd2lsbCBiZSBjcmVhdGVkIHdoZW5cbi8vIG1hcHBpbmcsIGZvciBleGFtcGxlLCBhIGxhcmdlIG51bWJlciBvZiBkZWNvcmF0aW9ucy4gVGhlIG51bWJlcidzXG4vLyBsb3dlciAxNiBiaXRzIHByb3ZpZGUgdGhlIGluZGV4LCB0aGUgcmVtYWluaW5nIGJpdHMgdGhlIG9mZnNldC5cbi8vXG4vLyBOb3RlOiBXZSBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBiaXQgc2hpZnQgb3BlcmF0b3JzIHRvIGVuLSBhbmRcbi8vIGRlY29kZSB0aGVzZSwgc2luY2UgdGhvc2UgY2xpcCB0byAzMiBiaXRzLCB3aGljaCB3ZSBtaWdodCBpbiByYXJlXG4vLyBjYXNlcyB3YW50IHRvIG92ZXJmbG93LiBBIDY0LWJpdCBmbG9hdCBjYW4gcmVwcmVzZW50IDQ4LWJpdFxuLy8gaW50ZWdlcnMgcHJlY2lzZWx5LlxuY29uc3QgbG93ZXIxNiA9IDB4ZmZmZjtcbmNvbnN0IGZhY3RvcjE2ID0gTWF0aC5wb3coMiwgMTYpO1xuZnVuY3Rpb24gbWFrZVJlY292ZXIoaW5kZXgsIG9mZnNldCkgeyByZXR1cm4gaW5kZXggKyBvZmZzZXQgKiBmYWN0b3IxNjsgfVxuZnVuY3Rpb24gcmVjb3ZlckluZGV4KHZhbHVlKSB7IHJldHVybiB2YWx1ZSAmIGxvd2VyMTY7IH1cbmZ1bmN0aW9uIHJlY292ZXJPZmZzZXQodmFsdWUpIHsgcmV0dXJuICh2YWx1ZSAtICh2YWx1ZSAmIGxvd2VyMTYpKSAvIGZhY3RvcjE2OyB9XG5jb25zdCBERUxfQkVGT1JFID0gMSwgREVMX0FGVEVSID0gMiwgREVMX0FDUk9TUyA9IDQsIERFTF9TSURFID0gODtcbi8qKlxuQW4gb2JqZWN0IHJlcHJlc2VudGluZyBhIG1hcHBlZCBwb3NpdGlvbiB3aXRoIGV4dHJhXG5pbmZvcm1hdGlvbi5cbiovXG5jbGFzcyBNYXBSZXN1bHQge1xuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgLyoqXG4gICAgVGhlIG1hcHBlZCB2ZXJzaW9uIG9mIHRoZSBwb3NpdGlvbi5cbiAgICAqL1xuICAgIHBvcywgXG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBkZWxJbmZvLCBcbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHJlY292ZXIpIHtcbiAgICAgICAgdGhpcy5wb3MgPSBwb3M7XG4gICAgICAgIHRoaXMuZGVsSW5mbyA9IGRlbEluZm87XG4gICAgICAgIHRoaXMucmVjb3ZlciA9IHJlY292ZXI7XG4gICAgfVxuICAgIC8qKlxuICAgIFRlbGxzIHlvdSB3aGV0aGVyIHRoZSBwb3NpdGlvbiB3YXMgZGVsZXRlZCwgdGhhdCBpcywgd2hldGhlciB0aGVcbiAgICBzdGVwIHJlbW92ZWQgdGhlIHRva2VuIG9uIHRoZSBzaWRlIHF1ZXJpZWQgKHZpYSB0aGUgYGFzc29jYClcbiAgICBhcmd1bWVudCBmcm9tIHRoZSBkb2N1bWVudC5cbiAgICAqL1xuICAgIGdldCBkZWxldGVkKCkgeyByZXR1cm4gKHRoaXMuZGVsSW5mbyAmIERFTF9TSURFKSA+IDA7IH1cbiAgICAvKipcbiAgICBUZWxscyB5b3Ugd2hldGhlciB0aGUgdG9rZW4gYmVmb3JlIHRoZSBtYXBwZWQgcG9zaXRpb24gd2FzIGRlbGV0ZWQuXG4gICAgKi9cbiAgICBnZXQgZGVsZXRlZEJlZm9yZSgpIHsgcmV0dXJuICh0aGlzLmRlbEluZm8gJiAoREVMX0JFRk9SRSB8IERFTF9BQ1JPU1MpKSA+IDA7IH1cbiAgICAvKipcbiAgICBUcnVlIHdoZW4gdGhlIHRva2VuIGFmdGVyIHRoZSBtYXBwZWQgcG9zaXRpb24gd2FzIGRlbGV0ZWQuXG4gICAgKi9cbiAgICBnZXQgZGVsZXRlZEFmdGVyKCkgeyByZXR1cm4gKHRoaXMuZGVsSW5mbyAmIChERUxfQUZURVIgfCBERUxfQUNST1NTKSkgPiAwOyB9XG4gICAgLyoqXG4gICAgVGVsbHMgd2hldGhlciBhbnkgb2YgdGhlIHN0ZXBzIG1hcHBlZCB0aHJvdWdoIGRlbGV0ZXMgYWNyb3NzIHRoZVxuICAgIHBvc2l0aW9uIChpbmNsdWRpbmcgYm90aCB0aGUgdG9rZW4gYmVmb3JlIGFuZCBhZnRlciB0aGVcbiAgICBwb3NpdGlvbikuXG4gICAgKi9cbiAgICBnZXQgZGVsZXRlZEFjcm9zcygpIHsgcmV0dXJuICh0aGlzLmRlbEluZm8gJiBERUxfQUNST1NTKSA+IDA7IH1cbn1cbi8qKlxuQSBtYXAgZGVzY3JpYmluZyB0aGUgZGVsZXRpb25zIGFuZCBpbnNlcnRpb25zIG1hZGUgYnkgYSBzdGVwLCB3aGljaFxuY2FuIGJlIHVzZWQgdG8gZmluZCB0aGUgY29ycmVzcG9uZGVuY2UgYmV0d2VlbiBwb3NpdGlvbnMgaW4gdGhlXG5wcmUtc3RlcCB2ZXJzaW9uIG9mIGEgZG9jdW1lbnQgYW5kIHRoZSBzYW1lIHBvc2l0aW9uIGluIHRoZVxucG9zdC1zdGVwIHZlcnNpb24uXG4qL1xuY2xhc3MgU3RlcE1hcCB7XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgcG9zaXRpb24gbWFwLiBUaGUgbW9kaWZpY2F0aW9ucyB0byB0aGUgZG9jdW1lbnQgYXJlXG4gICAgcmVwcmVzZW50ZWQgYXMgYW4gYXJyYXkgb2YgbnVtYmVycywgaW4gd2hpY2ggZWFjaCBncm91cCBvZiB0aHJlZVxuICAgIHJlcHJlc2VudHMgYSBtb2RpZmllZCBjaHVuayBhcyBgW3N0YXJ0LCBvbGRTaXplLCBuZXdTaXplXWAuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHJhbmdlcywgXG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBpbnZlcnRlZCA9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMucmFuZ2VzID0gcmFuZ2VzO1xuICAgICAgICB0aGlzLmludmVydGVkID0gaW52ZXJ0ZWQ7XG4gICAgICAgIGlmICghcmFuZ2VzLmxlbmd0aCAmJiBTdGVwTWFwLmVtcHR5KVxuICAgICAgICAgICAgcmV0dXJuIFN0ZXBNYXAuZW1wdHk7XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgcmVjb3Zlcih2YWx1ZSkge1xuICAgICAgICBsZXQgZGlmZiA9IDAsIGluZGV4ID0gcmVjb3ZlckluZGV4KHZhbHVlKTtcbiAgICAgICAgaWYgKCF0aGlzLmludmVydGVkKVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmRleDsgaSsrKVxuICAgICAgICAgICAgICAgIGRpZmYgKz0gdGhpcy5yYW5nZXNbaSAqIDMgKyAyXSAtIHRoaXMucmFuZ2VzW2kgKiAzICsgMV07XG4gICAgICAgIHJldHVybiB0aGlzLnJhbmdlc1tpbmRleCAqIDNdICsgZGlmZiArIHJlY292ZXJPZmZzZXQodmFsdWUpO1xuICAgIH1cbiAgICBtYXBSZXN1bHQocG9zLCBhc3NvYyA9IDEpIHsgcmV0dXJuIHRoaXMuX21hcChwb3MsIGFzc29jLCBmYWxzZSk7IH1cbiAgICBtYXAocG9zLCBhc3NvYyA9IDEpIHsgcmV0dXJuIHRoaXMuX21hcChwb3MsIGFzc29jLCB0cnVlKTsgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgX21hcChwb3MsIGFzc29jLCBzaW1wbGUpIHtcbiAgICAgICAgbGV0IGRpZmYgPSAwLCBvbGRJbmRleCA9IHRoaXMuaW52ZXJ0ZWQgPyAyIDogMSwgbmV3SW5kZXggPSB0aGlzLmludmVydGVkID8gMSA6IDI7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5yYW5nZXMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgICAgIGxldCBzdGFydCA9IHRoaXMucmFuZ2VzW2ldIC0gKHRoaXMuaW52ZXJ0ZWQgPyBkaWZmIDogMCk7XG4gICAgICAgICAgICBpZiAoc3RhcnQgPiBwb3MpXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBsZXQgb2xkU2l6ZSA9IHRoaXMucmFuZ2VzW2kgKyBvbGRJbmRleF0sIG5ld1NpemUgPSB0aGlzLnJhbmdlc1tpICsgbmV3SW5kZXhdLCBlbmQgPSBzdGFydCArIG9sZFNpemU7XG4gICAgICAgICAgICBpZiAocG9zIDw9IGVuZCkge1xuICAgICAgICAgICAgICAgIGxldCBzaWRlID0gIW9sZFNpemUgPyBhc3NvYyA6IHBvcyA9PSBzdGFydCA/IC0xIDogcG9zID09IGVuZCA/IDEgOiBhc3NvYztcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gc3RhcnQgKyBkaWZmICsgKHNpZGUgPCAwID8gMCA6IG5ld1NpemUpO1xuICAgICAgICAgICAgICAgIGlmIChzaW1wbGUpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgbGV0IHJlY292ZXIgPSBwb3MgPT0gKGFzc29jIDwgMCA/IHN0YXJ0IDogZW5kKSA/IG51bGwgOiBtYWtlUmVjb3ZlcihpIC8gMywgcG9zIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIGxldCBkZWwgPSBwb3MgPT0gc3RhcnQgPyBERUxfQUZURVIgOiBwb3MgPT0gZW5kID8gREVMX0JFRk9SRSA6IERFTF9BQ1JPU1M7XG4gICAgICAgICAgICAgICAgaWYgKGFzc29jIDwgMCA/IHBvcyAhPSBzdGFydCA6IHBvcyAhPSBlbmQpXG4gICAgICAgICAgICAgICAgICAgIGRlbCB8PSBERUxfU0lERTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE1hcFJlc3VsdChyZXN1bHQsIGRlbCwgcmVjb3Zlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaWZmICs9IG5ld1NpemUgLSBvbGRTaXplO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaW1wbGUgPyBwb3MgKyBkaWZmIDogbmV3IE1hcFJlc3VsdChwb3MgKyBkaWZmLCAwLCBudWxsKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICB0b3VjaGVzKHBvcywgcmVjb3Zlcikge1xuICAgICAgICBsZXQgZGlmZiA9IDAsIGluZGV4ID0gcmVjb3ZlckluZGV4KHJlY292ZXIpO1xuICAgICAgICBsZXQgb2xkSW5kZXggPSB0aGlzLmludmVydGVkID8gMiA6IDEsIG5ld0luZGV4ID0gdGhpcy5pbnZlcnRlZCA/IDEgOiAyO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucmFuZ2VzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgICAgICBsZXQgc3RhcnQgPSB0aGlzLnJhbmdlc1tpXSAtICh0aGlzLmludmVydGVkID8gZGlmZiA6IDApO1xuICAgICAgICAgICAgaWYgKHN0YXJ0ID4gcG9zKVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgbGV0IG9sZFNpemUgPSB0aGlzLnJhbmdlc1tpICsgb2xkSW5kZXhdLCBlbmQgPSBzdGFydCArIG9sZFNpemU7XG4gICAgICAgICAgICBpZiAocG9zIDw9IGVuZCAmJiBpID09IGluZGV4ICogMylcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIGRpZmYgKz0gdGhpcy5yYW5nZXNbaSArIG5ld0luZGV4XSAtIG9sZFNpemU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvKipcbiAgICBDYWxscyB0aGUgZ2l2ZW4gZnVuY3Rpb24gb24gZWFjaCBvZiB0aGUgY2hhbmdlZCByYW5nZXMgaW5jbHVkZWQgaW5cbiAgICB0aGlzIG1hcC5cbiAgICAqL1xuICAgIGZvckVhY2goZikge1xuICAgICAgICBsZXQgb2xkSW5kZXggPSB0aGlzLmludmVydGVkID8gMiA6IDEsIG5ld0luZGV4ID0gdGhpcy5pbnZlcnRlZCA/IDEgOiAyO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgZGlmZiA9IDA7IGkgPCB0aGlzLnJhbmdlcy5sZW5ndGg7IGkgKz0gMykge1xuICAgICAgICAgICAgbGV0IHN0YXJ0ID0gdGhpcy5yYW5nZXNbaV0sIG9sZFN0YXJ0ID0gc3RhcnQgLSAodGhpcy5pbnZlcnRlZCA/IGRpZmYgOiAwKSwgbmV3U3RhcnQgPSBzdGFydCArICh0aGlzLmludmVydGVkID8gMCA6IGRpZmYpO1xuICAgICAgICAgICAgbGV0IG9sZFNpemUgPSB0aGlzLnJhbmdlc1tpICsgb2xkSW5kZXhdLCBuZXdTaXplID0gdGhpcy5yYW5nZXNbaSArIG5ld0luZGV4XTtcbiAgICAgICAgICAgIGYob2xkU3RhcnQsIG9sZFN0YXJ0ICsgb2xkU2l6ZSwgbmV3U3RhcnQsIG5ld1N0YXJ0ICsgbmV3U2l6ZSk7XG4gICAgICAgICAgICBkaWZmICs9IG5ld1NpemUgLSBvbGRTaXplO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgIENyZWF0ZSBhbiBpbnZlcnRlZCB2ZXJzaW9uIG9mIHRoaXMgbWFwLiBUaGUgcmVzdWx0IGNhbiBiZSB1c2VkIHRvXG4gICAgbWFwIHBvc2l0aW9ucyBpbiB0aGUgcG9zdC1zdGVwIGRvY3VtZW50IHRvIHRoZSBwcmUtc3RlcCBkb2N1bWVudC5cbiAgICAqL1xuICAgIGludmVydCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdGVwTWFwKHRoaXMucmFuZ2VzLCAhdGhpcy5pbnZlcnRlZCk7XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiAodGhpcy5pbnZlcnRlZCA/IFwiLVwiIDogXCJcIikgKyBKU09OLnN0cmluZ2lmeSh0aGlzLnJhbmdlcyk7XG4gICAgfVxuICAgIC8qKlxuICAgIENyZWF0ZSBhIG1hcCB0aGF0IG1vdmVzIGFsbCBwb3NpdGlvbnMgYnkgb2Zmc2V0IGBuYCAod2hpY2ggbWF5IGJlXG4gICAgbmVnYXRpdmUpLiBUaGlzIGNhbiBiZSB1c2VmdWwgd2hlbiBhcHBseWluZyBzdGVwcyBtZWFudCBmb3IgYVxuICAgIHN1Yi1kb2N1bWVudCB0byBhIGxhcmdlciBkb2N1bWVudCwgb3IgdmljZS12ZXJzYS5cbiAgICAqL1xuICAgIHN0YXRpYyBvZmZzZXQobikge1xuICAgICAgICByZXR1cm4gbiA9PSAwID8gU3RlcE1hcC5lbXB0eSA6IG5ldyBTdGVwTWFwKG4gPCAwID8gWzAsIC1uLCAwXSA6IFswLCAwLCBuXSk7XG4gICAgfVxufVxuLyoqXG5BIFN0ZXBNYXAgdGhhdCBjb250YWlucyBubyBjaGFuZ2VkIHJhbmdlcy5cbiovXG5TdGVwTWFwLmVtcHR5ID0gbmV3IFN0ZXBNYXAoW10pO1xuLyoqXG5BIG1hcHBpbmcgcmVwcmVzZW50cyBhIHBpcGVsaW5lIG9mIHplcm8gb3IgbW9yZSBbc3RlcFxubWFwc10oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI3RyYW5zZm9ybS5TdGVwTWFwKS4gSXQgaGFzIHNwZWNpYWwgcHJvdmlzaW9ucyBmb3IgbG9zc2xlc3NseVxuaGFuZGxpbmcgbWFwcGluZyBwb3NpdGlvbnMgdGhyb3VnaCBhIHNlcmllcyBvZiBzdGVwcyBpbiB3aGljaCBzb21lXG5zdGVwcyBhcmUgaW52ZXJ0ZWQgdmVyc2lvbnMgb2YgZWFybGllciBzdGVwcy4gKFRoaXMgY29tZXMgdXAgd2hlblxuXHUyMDE4W3JlYmFzaW5nXSgvZG9jcy9ndWlkZS8jdHJhbnNmb3JtLnJlYmFzaW5nKVx1MjAxOSBzdGVwcyBmb3JcbmNvbGxhYm9yYXRpb24gb3IgaGlzdG9yeSBtYW5hZ2VtZW50LilcbiovXG5jbGFzcyBNYXBwaW5nIHtcbiAgICAvKipcbiAgICBDcmVhdGUgYSBuZXcgbWFwcGluZyB3aXRoIHRoZSBnaXZlbiBwb3NpdGlvbiBtYXBzLlxuICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgLyoqXG4gICAgVGhlIHN0ZXAgbWFwcyBpbiB0aGlzIG1hcHBpbmcuXG4gICAgKi9cbiAgICBtYXBzID0gW10sIFxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgbWlycm9yLCBcbiAgICAvKipcbiAgICBUaGUgc3RhcnRpbmcgcG9zaXRpb24gaW4gdGhlIGBtYXBzYCBhcnJheSwgdXNlZCB3aGVuIGBtYXBgIG9yXG4gICAgYG1hcFJlc3VsdGAgaXMgY2FsbGVkLlxuICAgICovXG4gICAgZnJvbSA9IDAsIFxuICAgIC8qKlxuICAgIFRoZSBlbmQgcG9zaXRpb24gaW4gdGhlIGBtYXBzYCBhcnJheS5cbiAgICAqL1xuICAgIHRvID0gbWFwcy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5tYXBzID0gbWFwcztcbiAgICAgICAgdGhpcy5taXJyb3IgPSBtaXJyb3I7XG4gICAgICAgIHRoaXMuZnJvbSA9IGZyb207XG4gICAgICAgIHRoaXMudG8gPSB0bztcbiAgICB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgbWFwcGluZyB0aGF0IG1hcHMgb25seSB0aHJvdWdoIGEgcGFydCBvZiB0aGlzIG9uZS5cbiAgICAqL1xuICAgIHNsaWNlKGZyb20gPSAwLCB0byA9IHRoaXMubWFwcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXBwaW5nKHRoaXMubWFwcywgdGhpcy5taXJyb3IsIGZyb20sIHRvKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBjb3B5KCkge1xuICAgICAgICByZXR1cm4gbmV3IE1hcHBpbmcodGhpcy5tYXBzLnNsaWNlKCksIHRoaXMubWlycm9yICYmIHRoaXMubWlycm9yLnNsaWNlKCksIHRoaXMuZnJvbSwgdGhpcy50byk7XG4gICAgfVxuICAgIC8qKlxuICAgIEFkZCBhIHN0ZXAgbWFwIHRvIHRoZSBlbmQgb2YgdGhpcyBtYXBwaW5nLiBJZiBgbWlycm9yc2AgaXNcbiAgICBnaXZlbiwgaXQgc2hvdWxkIGJlIHRoZSBpbmRleCBvZiB0aGUgc3RlcCBtYXAgdGhhdCBpcyB0aGUgbWlycm9yXG4gICAgaW1hZ2Ugb2YgdGhpcyBvbmUuXG4gICAgKi9cbiAgICBhcHBlbmRNYXAobWFwLCBtaXJyb3JzKSB7XG4gICAgICAgIHRoaXMudG8gPSB0aGlzLm1hcHMucHVzaChtYXApO1xuICAgICAgICBpZiAobWlycm9ycyAhPSBudWxsKVxuICAgICAgICAgICAgdGhpcy5zZXRNaXJyb3IodGhpcy5tYXBzLmxlbmd0aCAtIDEsIG1pcnJvcnMpO1xuICAgIH1cbiAgICAvKipcbiAgICBBZGQgYWxsIHRoZSBzdGVwIG1hcHMgaW4gYSBnaXZlbiBtYXBwaW5nIHRvIHRoaXMgb25lIChwcmVzZXJ2aW5nXG4gICAgbWlycm9yaW5nIGluZm9ybWF0aW9uKS5cbiAgICAqL1xuICAgIGFwcGVuZE1hcHBpbmcobWFwcGluZykge1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgc3RhcnRTaXplID0gdGhpcy5tYXBzLmxlbmd0aDsgaSA8IG1hcHBpbmcubWFwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IG1pcnIgPSBtYXBwaW5nLmdldE1pcnJvcihpKTtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kTWFwKG1hcHBpbmcubWFwc1tpXSwgbWlyciAhPSBudWxsICYmIG1pcnIgPCBpID8gc3RhcnRTaXplICsgbWlyciA6IHVuZGVmaW5lZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgRmluZHMgdGhlIG9mZnNldCBvZiB0aGUgc3RlcCBtYXAgdGhhdCBtaXJyb3JzIHRoZSBtYXAgYXQgdGhlXG4gICAgZ2l2ZW4gb2Zmc2V0LCBpbiB0aGlzIG1hcHBpbmcgKGFzIHBlciB0aGUgc2Vjb25kIGFyZ3VtZW50IHRvXG4gICAgYGFwcGVuZE1hcGApLlxuICAgICovXG4gICAgZ2V0TWlycm9yKG4pIHtcbiAgICAgICAgaWYgKHRoaXMubWlycm9yKVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm1pcnJvci5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5taXJyb3JbaV0gPT0gbilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWlycm9yW2kgKyAoaSAlIDIgPyAtMSA6IDEpXTtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBzZXRNaXJyb3IobiwgbSkge1xuICAgICAgICBpZiAoIXRoaXMubWlycm9yKVxuICAgICAgICAgICAgdGhpcy5taXJyb3IgPSBbXTtcbiAgICAgICAgdGhpcy5taXJyb3IucHVzaChuLCBtKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQXBwZW5kIHRoZSBpbnZlcnNlIG9mIHRoZSBnaXZlbiBtYXBwaW5nIHRvIHRoaXMgb25lLlxuICAgICovXG4gICAgYXBwZW5kTWFwcGluZ0ludmVydGVkKG1hcHBpbmcpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IG1hcHBpbmcubWFwcy5sZW5ndGggLSAxLCB0b3RhbFNpemUgPSB0aGlzLm1hcHMubGVuZ3RoICsgbWFwcGluZy5tYXBzLmxlbmd0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGxldCBtaXJyID0gbWFwcGluZy5nZXRNaXJyb3IoaSk7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZE1hcChtYXBwaW5nLm1hcHNbaV0uaW52ZXJ0KCksIG1pcnIgIT0gbnVsbCAmJiBtaXJyID4gaSA/IHRvdGFsU2l6ZSAtIG1pcnIgLSAxIDogdW5kZWZpbmVkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICBDcmVhdGUgYW4gaW52ZXJ0ZWQgdmVyc2lvbiBvZiB0aGlzIG1hcHBpbmcuXG4gICAgKi9cbiAgICBpbnZlcnQoKSB7XG4gICAgICAgIGxldCBpbnZlcnNlID0gbmV3IE1hcHBpbmc7XG4gICAgICAgIGludmVyc2UuYXBwZW5kTWFwcGluZ0ludmVydGVkKHRoaXMpO1xuICAgICAgICByZXR1cm4gaW52ZXJzZTtcbiAgICB9XG4gICAgLyoqXG4gICAgTWFwIGEgcG9zaXRpb24gdGhyb3VnaCB0aGlzIG1hcHBpbmcuXG4gICAgKi9cbiAgICBtYXAocG9zLCBhc3NvYyA9IDEpIHtcbiAgICAgICAgaWYgKHRoaXMubWlycm9yKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21hcChwb3MsIGFzc29jLCB0cnVlKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuZnJvbTsgaSA8IHRoaXMudG87IGkrKylcbiAgICAgICAgICAgIHBvcyA9IHRoaXMubWFwc1tpXS5tYXAocG9zLCBhc3NvYyk7XG4gICAgICAgIHJldHVybiBwb3M7XG4gICAgfVxuICAgIC8qKlxuICAgIE1hcCBhIHBvc2l0aW9uIHRocm91Z2ggdGhpcyBtYXBwaW5nLCByZXR1cm5pbmcgYSBtYXBwaW5nXG4gICAgcmVzdWx0LlxuICAgICovXG4gICAgbWFwUmVzdWx0KHBvcywgYXNzb2MgPSAxKSB7IHJldHVybiB0aGlzLl9tYXAocG9zLCBhc3NvYywgZmFsc2UpOyB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBfbWFwKHBvcywgYXNzb2MsIHNpbXBsZSkge1xuICAgICAgICBsZXQgZGVsSW5mbyA9IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmZyb207IGkgPCB0aGlzLnRvOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBtYXAgPSB0aGlzLm1hcHNbaV0sIHJlc3VsdCA9IG1hcC5tYXBSZXN1bHQocG9zLCBhc3NvYyk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnJlY292ZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGxldCBjb3JyID0gdGhpcy5nZXRNaXJyb3IoaSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvcnIgIT0gbnVsbCAmJiBjb3JyID4gaSAmJiBjb3JyIDwgdGhpcy50bykge1xuICAgICAgICAgICAgICAgICAgICBpID0gY29ycjtcbiAgICAgICAgICAgICAgICAgICAgcG9zID0gdGhpcy5tYXBzW2NvcnJdLnJlY292ZXIocmVzdWx0LnJlY292ZXIpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxJbmZvIHw9IHJlc3VsdC5kZWxJbmZvO1xuICAgICAgICAgICAgcG9zID0gcmVzdWx0LnBvcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2ltcGxlID8gcG9zIDogbmV3IE1hcFJlc3VsdChwb3MsIGRlbEluZm8sIG51bGwpO1xuICAgIH1cbn1cblxuY29uc3Qgc3RlcHNCeUlEID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbi8qKlxuQSBzdGVwIG9iamVjdCByZXByZXNlbnRzIGFuIGF0b21pYyBjaGFuZ2UuIEl0IGdlbmVyYWxseSBhcHBsaWVzXG5vbmx5IHRvIHRoZSBkb2N1bWVudCBpdCB3YXMgY3JlYXRlZCBmb3IsIHNpbmNlIHRoZSBwb3NpdGlvbnNcbnN0b3JlZCBpbiBpdCB3aWxsIG9ubHkgbWFrZSBzZW5zZSBmb3IgdGhhdCBkb2N1bWVudC5cblxuTmV3IHN0ZXBzIGFyZSBkZWZpbmVkIGJ5IGNyZWF0aW5nIGNsYXNzZXMgdGhhdCBleHRlbmQgYFN0ZXBgLFxub3ZlcnJpZGluZyB0aGUgYGFwcGx5YCwgYGludmVydGAsIGBtYXBgLCBgZ2V0TWFwYCBhbmQgYGZyb21KU09OYFxubWV0aG9kcywgYW5kIHJlZ2lzdGVyaW5nIHlvdXIgY2xhc3Mgd2l0aCBhIHVuaXF1ZVxuSlNPTi1zZXJpYWxpemF0aW9uIGlkZW50aWZpZXIgdXNpbmdcbltgU3RlcC5qc29uSURgXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jdHJhbnNmb3JtLlN0ZXBeanNvbklEKS5cbiovXG5jbGFzcyBTdGVwIHtcbiAgICAvKipcbiAgICBHZXQgdGhlIHN0ZXAgbWFwIHRoYXQgcmVwcmVzZW50cyB0aGUgY2hhbmdlcyBtYWRlIGJ5IHRoaXMgc3RlcCxcbiAgICBhbmQgd2hpY2ggY2FuIGJlIHVzZWQgdG8gdHJhbnNmb3JtIGJldHdlZW4gcG9zaXRpb25zIGluIHRoZSBvbGRcbiAgICBhbmQgdGhlIG5ldyBkb2N1bWVudC5cbiAgICAqL1xuICAgIGdldE1hcCgpIHsgcmV0dXJuIFN0ZXBNYXAuZW1wdHk7IH1cbiAgICAvKipcbiAgICBUcnkgdG8gbWVyZ2UgdGhpcyBzdGVwIHdpdGggYW5vdGhlciBvbmUsIHRvIGJlIGFwcGxpZWQgZGlyZWN0bHlcbiAgICBhZnRlciBpdC4gUmV0dXJucyB0aGUgbWVyZ2VkIHN0ZXAgd2hlbiBwb3NzaWJsZSwgbnVsbCBpZiB0aGVcbiAgICBzdGVwcyBjYW4ndCBiZSBtZXJnZWQuXG4gICAgKi9cbiAgICBtZXJnZShvdGhlcikgeyByZXR1cm4gbnVsbDsgfVxuICAgIC8qKlxuICAgIERlc2VyaWFsaXplIGEgc3RlcCBmcm9tIGl0cyBKU09OIHJlcHJlc2VudGF0aW9uLiBXaWxsIGNhbGxcbiAgICB0aHJvdWdoIHRvIHRoZSBzdGVwIGNsYXNzJyBvd24gaW1wbGVtZW50YXRpb24gb2YgdGhpcyBtZXRob2QuXG4gICAgKi9cbiAgICBzdGF0aWMgZnJvbUpTT04oc2NoZW1hLCBqc29uKSB7XG4gICAgICAgIGlmICghanNvbiB8fCAhanNvbi5zdGVwVHlwZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiSW52YWxpZCBpbnB1dCBmb3IgU3RlcC5mcm9tSlNPTlwiKTtcbiAgICAgICAgbGV0IHR5cGUgPSBzdGVwc0J5SURbanNvbi5zdGVwVHlwZV07XG4gICAgICAgIGlmICghdHlwZSlcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKGBObyBzdGVwIHR5cGUgJHtqc29uLnN0ZXBUeXBlfSBkZWZpbmVkYCk7XG4gICAgICAgIHJldHVybiB0eXBlLmZyb21KU09OKHNjaGVtYSwganNvbik7XG4gICAgfVxuICAgIC8qKlxuICAgIFRvIGJlIGFibGUgdG8gc2VyaWFsaXplIHN0ZXBzIHRvIEpTT04sIGVhY2ggc3RlcCBuZWVkcyBhIHN0cmluZ1xuICAgIElEIHRvIGF0dGFjaCB0byBpdHMgSlNPTiByZXByZXNlbnRhdGlvbi4gVXNlIHRoaXMgbWV0aG9kIHRvXG4gICAgcmVnaXN0ZXIgYW4gSUQgZm9yIHlvdXIgc3RlcCBjbGFzc2VzLiBUcnkgdG8gcGljayBzb21ldGhpbmdcbiAgICB0aGF0J3MgdW5saWtlbHkgdG8gY2xhc2ggd2l0aCBzdGVwcyBmcm9tIG90aGVyIG1vZHVsZXMuXG4gICAgKi9cbiAgICBzdGF0aWMganNvbklEKGlkLCBzdGVwQ2xhc3MpIHtcbiAgICAgICAgaWYgKGlkIGluIHN0ZXBzQnlJRClcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiRHVwbGljYXRlIHVzZSBvZiBzdGVwIEpTT04gSUQgXCIgKyBpZCk7XG4gICAgICAgIHN0ZXBzQnlJRFtpZF0gPSBzdGVwQ2xhc3M7XG4gICAgICAgIHN0ZXBDbGFzcy5wcm90b3R5cGUuanNvbklEID0gaWQ7XG4gICAgICAgIHJldHVybiBzdGVwQ2xhc3M7XG4gICAgfVxufVxuLyoqXG5UaGUgcmVzdWx0IG9mIFthcHBseWluZ10oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI3RyYW5zZm9ybS5TdGVwLmFwcGx5KSBhIHN0ZXAuIENvbnRhaW5zIGVpdGhlciBhXG5uZXcgZG9jdW1lbnQgb3IgYSBmYWlsdXJlIHZhbHVlLlxuKi9cbmNsYXNzIFN0ZXBSZXN1bHQge1xuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgLyoqXG4gICAgVGhlIHRyYW5zZm9ybWVkIGRvY3VtZW50LCBpZiBzdWNjZXNzZnVsLlxuICAgICovXG4gICAgZG9jLCBcbiAgICAvKipcbiAgICBUaGUgZmFpbHVyZSBtZXNzYWdlLCBpZiB1bnN1Y2Nlc3NmdWwuXG4gICAgKi9cbiAgICBmYWlsZWQpIHtcbiAgICAgICAgdGhpcy5kb2MgPSBkb2M7XG4gICAgICAgIHRoaXMuZmFpbGVkID0gZmFpbGVkO1xuICAgIH1cbiAgICAvKipcbiAgICBDcmVhdGUgYSBzdWNjZXNzZnVsIHN0ZXAgcmVzdWx0LlxuICAgICovXG4gICAgc3RhdGljIG9rKGRvYykgeyByZXR1cm4gbmV3IFN0ZXBSZXN1bHQoZG9jLCBudWxsKTsgfVxuICAgIC8qKlxuICAgIENyZWF0ZSBhIGZhaWxlZCBzdGVwIHJlc3VsdC5cbiAgICAqL1xuICAgIHN0YXRpYyBmYWlsKG1lc3NhZ2UpIHsgcmV0dXJuIG5ldyBTdGVwUmVzdWx0KG51bGwsIG1lc3NhZ2UpOyB9XG4gICAgLyoqXG4gICAgQ2FsbCBbYE5vZGUucmVwbGFjZWBdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5Ob2RlLnJlcGxhY2UpIHdpdGggdGhlIGdpdmVuXG4gICAgYXJndW1lbnRzLiBDcmVhdGUgYSBzdWNjZXNzZnVsIHJlc3VsdCBpZiBpdCBzdWNjZWVkcywgYW5kIGFcbiAgICBmYWlsZWQgb25lIGlmIGl0IHRocm93cyBhIGBSZXBsYWNlRXJyb3JgLlxuICAgICovXG4gICAgc3RhdGljIGZyb21SZXBsYWNlKGRvYywgZnJvbSwgdG8sIHNsaWNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gU3RlcFJlc3VsdC5vayhkb2MucmVwbGFjZShmcm9tLCB0bywgc2xpY2UpKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBSZXBsYWNlRXJyb3IpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFN0ZXBSZXN1bHQuZmFpbChlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbWFwRnJhZ21lbnQoZnJhZ21lbnQsIGYsIHBhcmVudCkge1xuICAgIGxldCBtYXBwZWQgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyYWdtZW50LmNoaWxkQ291bnQ7IGkrKykge1xuICAgICAgICBsZXQgY2hpbGQgPSBmcmFnbWVudC5jaGlsZChpKTtcbiAgICAgICAgaWYgKGNoaWxkLmNvbnRlbnQuc2l6ZSlcbiAgICAgICAgICAgIGNoaWxkID0gY2hpbGQuY29weShtYXBGcmFnbWVudChjaGlsZC5jb250ZW50LCBmLCBjaGlsZCkpO1xuICAgICAgICBpZiAoY2hpbGQuaXNJbmxpbmUpXG4gICAgICAgICAgICBjaGlsZCA9IGYoY2hpbGQsIHBhcmVudCwgaSk7XG4gICAgICAgIG1hcHBlZC5wdXNoKGNoaWxkKTtcbiAgICB9XG4gICAgcmV0dXJuIEZyYWdtZW50LmZyb21BcnJheShtYXBwZWQpO1xufVxuLyoqXG5BZGQgYSBtYXJrIHRvIGFsbCBpbmxpbmUgY29udGVudCBiZXR3ZWVuIHR3byBwb3NpdGlvbnMuXG4qL1xuY2xhc3MgQWRkTWFya1N0ZXAgZXh0ZW5kcyBTdGVwIHtcbiAgICAvKipcbiAgICBDcmVhdGUgYSBtYXJrIHN0ZXAuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAvKipcbiAgICBUaGUgc3RhcnQgb2YgdGhlIG1hcmtlZCByYW5nZS5cbiAgICAqL1xuICAgIGZyb20sIFxuICAgIC8qKlxuICAgIFRoZSBlbmQgb2YgdGhlIG1hcmtlZCByYW5nZS5cbiAgICAqL1xuICAgIHRvLCBcbiAgICAvKipcbiAgICBUaGUgbWFyayB0byBhZGQuXG4gICAgKi9cbiAgICBtYXJrKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZnJvbSA9IGZyb207XG4gICAgICAgIHRoaXMudG8gPSB0bztcbiAgICAgICAgdGhpcy5tYXJrID0gbWFyaztcbiAgICB9XG4gICAgYXBwbHkoZG9jKSB7XG4gICAgICAgIGxldCBvbGRTbGljZSA9IGRvYy5zbGljZSh0aGlzLmZyb20sIHRoaXMudG8pLCAkZnJvbSA9IGRvYy5yZXNvbHZlKHRoaXMuZnJvbSk7XG4gICAgICAgIGxldCBwYXJlbnQgPSAkZnJvbS5ub2RlKCRmcm9tLnNoYXJlZERlcHRoKHRoaXMudG8pKTtcbiAgICAgICAgbGV0IHNsaWNlID0gbmV3IFNsaWNlKG1hcEZyYWdtZW50KG9sZFNsaWNlLmNvbnRlbnQsIChub2RlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICghbm9kZS5pc0F0b20gfHwgIXBhcmVudC50eXBlLmFsbG93c01hcmtUeXBlKHRoaXMubWFyay50eXBlKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgIHJldHVybiBub2RlLm1hcmsodGhpcy5tYXJrLmFkZFRvU2V0KG5vZGUubWFya3MpKTtcbiAgICAgICAgfSwgcGFyZW50KSwgb2xkU2xpY2Uub3BlblN0YXJ0LCBvbGRTbGljZS5vcGVuRW5kKTtcbiAgICAgICAgcmV0dXJuIFN0ZXBSZXN1bHQuZnJvbVJlcGxhY2UoZG9jLCB0aGlzLmZyb20sIHRoaXMudG8sIHNsaWNlKTtcbiAgICB9XG4gICAgaW52ZXJ0KCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlbW92ZU1hcmtTdGVwKHRoaXMuZnJvbSwgdGhpcy50bywgdGhpcy5tYXJrKTtcbiAgICB9XG4gICAgbWFwKG1hcHBpbmcpIHtcbiAgICAgICAgbGV0IGZyb20gPSBtYXBwaW5nLm1hcFJlc3VsdCh0aGlzLmZyb20sIDEpLCB0byA9IG1hcHBpbmcubWFwUmVzdWx0KHRoaXMudG8sIC0xKTtcbiAgICAgICAgaWYgKGZyb20uZGVsZXRlZCAmJiB0by5kZWxldGVkIHx8IGZyb20ucG9zID49IHRvLnBvcylcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gbmV3IEFkZE1hcmtTdGVwKGZyb20ucG9zLCB0by5wb3MsIHRoaXMubWFyayk7XG4gICAgfVxuICAgIG1lcmdlKG90aGVyKSB7XG4gICAgICAgIGlmIChvdGhlciBpbnN0YW5jZW9mIEFkZE1hcmtTdGVwICYmXG4gICAgICAgICAgICBvdGhlci5tYXJrLmVxKHRoaXMubWFyaykgJiZcbiAgICAgICAgICAgIHRoaXMuZnJvbSA8PSBvdGhlci50byAmJiB0aGlzLnRvID49IG90aGVyLmZyb20pXG4gICAgICAgICAgICByZXR1cm4gbmV3IEFkZE1hcmtTdGVwKE1hdGgubWluKHRoaXMuZnJvbSwgb3RoZXIuZnJvbSksIE1hdGgubWF4KHRoaXMudG8sIG90aGVyLnRvKSwgdGhpcy5tYXJrKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RlcFR5cGU6IFwiYWRkTWFya1wiLCBtYXJrOiB0aGlzLm1hcmsudG9KU09OKCksXG4gICAgICAgICAgICBmcm9tOiB0aGlzLmZyb20sIHRvOiB0aGlzLnRvIH07XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgc3RhdGljIGZyb21KU09OKHNjaGVtYSwganNvbikge1xuICAgICAgICBpZiAodHlwZW9mIGpzb24uZnJvbSAhPSBcIm51bWJlclwiIHx8IHR5cGVvZiBqc29uLnRvICE9IFwibnVtYmVyXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkludmFsaWQgaW5wdXQgZm9yIEFkZE1hcmtTdGVwLmZyb21KU09OXCIpO1xuICAgICAgICByZXR1cm4gbmV3IEFkZE1hcmtTdGVwKGpzb24uZnJvbSwganNvbi50bywgc2NoZW1hLm1hcmtGcm9tSlNPTihqc29uLm1hcmspKTtcbiAgICB9XG59XG5TdGVwLmpzb25JRChcImFkZE1hcmtcIiwgQWRkTWFya1N0ZXApO1xuLyoqXG5SZW1vdmUgYSBtYXJrIGZyb20gYWxsIGlubGluZSBjb250ZW50IGJldHdlZW4gdHdvIHBvc2l0aW9ucy5cbiovXG5jbGFzcyBSZW1vdmVNYXJrU3RlcCBleHRlbmRzIFN0ZXAge1xuICAgIC8qKlxuICAgIENyZWF0ZSBhIG1hcmstcmVtb3Zpbmcgc3RlcC5cbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgIFRoZSBzdGFydCBvZiB0aGUgdW5tYXJrZWQgcmFuZ2UuXG4gICAgKi9cbiAgICBmcm9tLCBcbiAgICAvKipcbiAgICBUaGUgZW5kIG9mIHRoZSB1bm1hcmtlZCByYW5nZS5cbiAgICAqL1xuICAgIHRvLCBcbiAgICAvKipcbiAgICBUaGUgbWFyayB0byByZW1vdmUuXG4gICAgKi9cbiAgICBtYXJrKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZnJvbSA9IGZyb207XG4gICAgICAgIHRoaXMudG8gPSB0bztcbiAgICAgICAgdGhpcy5tYXJrID0gbWFyaztcbiAgICB9XG4gICAgYXBwbHkoZG9jKSB7XG4gICAgICAgIGxldCBvbGRTbGljZSA9IGRvYy5zbGljZSh0aGlzLmZyb20sIHRoaXMudG8pO1xuICAgICAgICBsZXQgc2xpY2UgPSBuZXcgU2xpY2UobWFwRnJhZ21lbnQob2xkU2xpY2UuY29udGVudCwgbm9kZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZS5tYXJrKHRoaXMubWFyay5yZW1vdmVGcm9tU2V0KG5vZGUubWFya3MpKTtcbiAgICAgICAgfSwgZG9jKSwgb2xkU2xpY2Uub3BlblN0YXJ0LCBvbGRTbGljZS5vcGVuRW5kKTtcbiAgICAgICAgcmV0dXJuIFN0ZXBSZXN1bHQuZnJvbVJlcGxhY2UoZG9jLCB0aGlzLmZyb20sIHRoaXMudG8sIHNsaWNlKTtcbiAgICB9XG4gICAgaW52ZXJ0KCkge1xuICAgICAgICByZXR1cm4gbmV3IEFkZE1hcmtTdGVwKHRoaXMuZnJvbSwgdGhpcy50bywgdGhpcy5tYXJrKTtcbiAgICB9XG4gICAgbWFwKG1hcHBpbmcpIHtcbiAgICAgICAgbGV0IGZyb20gPSBtYXBwaW5nLm1hcFJlc3VsdCh0aGlzLmZyb20sIDEpLCB0byA9IG1hcHBpbmcubWFwUmVzdWx0KHRoaXMudG8sIC0xKTtcbiAgICAgICAgaWYgKGZyb20uZGVsZXRlZCAmJiB0by5kZWxldGVkIHx8IGZyb20ucG9zID49IHRvLnBvcylcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gbmV3IFJlbW92ZU1hcmtTdGVwKGZyb20ucG9zLCB0by5wb3MsIHRoaXMubWFyayk7XG4gICAgfVxuICAgIG1lcmdlKG90aGVyKSB7XG4gICAgICAgIGlmIChvdGhlciBpbnN0YW5jZW9mIFJlbW92ZU1hcmtTdGVwICYmXG4gICAgICAgICAgICBvdGhlci5tYXJrLmVxKHRoaXMubWFyaykgJiZcbiAgICAgICAgICAgIHRoaXMuZnJvbSA8PSBvdGhlci50byAmJiB0aGlzLnRvID49IG90aGVyLmZyb20pXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlbW92ZU1hcmtTdGVwKE1hdGgubWluKHRoaXMuZnJvbSwgb3RoZXIuZnJvbSksIE1hdGgubWF4KHRoaXMudG8sIG90aGVyLnRvKSwgdGhpcy5tYXJrKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RlcFR5cGU6IFwicmVtb3ZlTWFya1wiLCBtYXJrOiB0aGlzLm1hcmsudG9KU09OKCksXG4gICAgICAgICAgICBmcm9tOiB0aGlzLmZyb20sIHRvOiB0aGlzLnRvIH07XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgc3RhdGljIGZyb21KU09OKHNjaGVtYSwganNvbikge1xuICAgICAgICBpZiAodHlwZW9mIGpzb24uZnJvbSAhPSBcIm51bWJlclwiIHx8IHR5cGVvZiBqc29uLnRvICE9IFwibnVtYmVyXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkludmFsaWQgaW5wdXQgZm9yIFJlbW92ZU1hcmtTdGVwLmZyb21KU09OXCIpO1xuICAgICAgICByZXR1cm4gbmV3IFJlbW92ZU1hcmtTdGVwKGpzb24uZnJvbSwganNvbi50bywgc2NoZW1hLm1hcmtGcm9tSlNPTihqc29uLm1hcmspKTtcbiAgICB9XG59XG5TdGVwLmpzb25JRChcInJlbW92ZU1hcmtcIiwgUmVtb3ZlTWFya1N0ZXApO1xuLyoqXG5BZGQgYSBtYXJrIHRvIGEgc3BlY2lmaWMgbm9kZS5cbiovXG5jbGFzcyBBZGROb2RlTWFya1N0ZXAgZXh0ZW5kcyBTdGVwIHtcbiAgICAvKipcbiAgICBDcmVhdGUgYSBub2RlIG1hcmsgc3RlcC5cbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgIFRoZSBwb3NpdGlvbiBvZiB0aGUgdGFyZ2V0IG5vZGUuXG4gICAgKi9cbiAgICBwb3MsIFxuICAgIC8qKlxuICAgIFRoZSBtYXJrIHRvIGFkZC5cbiAgICAqL1xuICAgIG1hcmspIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5wb3MgPSBwb3M7XG4gICAgICAgIHRoaXMubWFyayA9IG1hcms7XG4gICAgfVxuICAgIGFwcGx5KGRvYykge1xuICAgICAgICBsZXQgbm9kZSA9IGRvYy5ub2RlQXQodGhpcy5wb3MpO1xuICAgICAgICBpZiAoIW5vZGUpXG4gICAgICAgICAgICByZXR1cm4gU3RlcFJlc3VsdC5mYWlsKFwiTm8gbm9kZSBhdCBtYXJrIHN0ZXAncyBwb3NpdGlvblwiKTtcbiAgICAgICAgbGV0IHVwZGF0ZWQgPSBub2RlLnR5cGUuY3JlYXRlKG5vZGUuYXR0cnMsIG51bGwsIHRoaXMubWFyay5hZGRUb1NldChub2RlLm1hcmtzKSk7XG4gICAgICAgIHJldHVybiBTdGVwUmVzdWx0LmZyb21SZXBsYWNlKGRvYywgdGhpcy5wb3MsIHRoaXMucG9zICsgMSwgbmV3IFNsaWNlKEZyYWdtZW50LmZyb20odXBkYXRlZCksIDAsIG5vZGUuaXNMZWFmID8gMCA6IDEpKTtcbiAgICB9XG4gICAgaW52ZXJ0KGRvYykge1xuICAgICAgICBsZXQgbm9kZSA9IGRvYy5ub2RlQXQodGhpcy5wb3MpO1xuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgbGV0IG5ld1NldCA9IHRoaXMubWFyay5hZGRUb1NldChub2RlLm1hcmtzKTtcbiAgICAgICAgICAgIGlmIChuZXdTZXQubGVuZ3RoID09IG5vZGUubWFya3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlLm1hcmtzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgICAgICBpZiAoIW5vZGUubWFya3NbaV0uaXNJblNldChuZXdTZXQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBBZGROb2RlTWFya1N0ZXAodGhpcy5wb3MsIG5vZGUubWFya3NbaV0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQWRkTm9kZU1hcmtTdGVwKHRoaXMucG9zLCB0aGlzLm1hcmspO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUmVtb3ZlTm9kZU1hcmtTdGVwKHRoaXMucG9zLCB0aGlzLm1hcmspO1xuICAgIH1cbiAgICBtYXAobWFwcGluZykge1xuICAgICAgICBsZXQgcG9zID0gbWFwcGluZy5tYXBSZXN1bHQodGhpcy5wb3MsIDEpO1xuICAgICAgICByZXR1cm4gcG9zLmRlbGV0ZWRBZnRlciA/IG51bGwgOiBuZXcgQWRkTm9kZU1hcmtTdGVwKHBvcy5wb3MsIHRoaXMubWFyayk7XG4gICAgfVxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RlcFR5cGU6IFwiYWRkTm9kZU1hcmtcIiwgcG9zOiB0aGlzLnBvcywgbWFyazogdGhpcy5tYXJrLnRvSlNPTigpIH07XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgc3RhdGljIGZyb21KU09OKHNjaGVtYSwganNvbikge1xuICAgICAgICBpZiAodHlwZW9mIGpzb24ucG9zICE9IFwibnVtYmVyXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkludmFsaWQgaW5wdXQgZm9yIEFkZE5vZGVNYXJrU3RlcC5mcm9tSlNPTlwiKTtcbiAgICAgICAgcmV0dXJuIG5ldyBBZGROb2RlTWFya1N0ZXAoanNvbi5wb3MsIHNjaGVtYS5tYXJrRnJvbUpTT04oanNvbi5tYXJrKSk7XG4gICAgfVxufVxuU3RlcC5qc29uSUQoXCJhZGROb2RlTWFya1wiLCBBZGROb2RlTWFya1N0ZXApO1xuLyoqXG5SZW1vdmUgYSBtYXJrIGZyb20gYSBzcGVjaWZpYyBub2RlLlxuKi9cbmNsYXNzIFJlbW92ZU5vZGVNYXJrU3RlcCBleHRlbmRzIFN0ZXAge1xuICAgIC8qKlxuICAgIENyZWF0ZSBhIG1hcmstcmVtb3Zpbmcgc3RlcC5cbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgIFRoZSBwb3NpdGlvbiBvZiB0aGUgdGFyZ2V0IG5vZGUuXG4gICAgKi9cbiAgICBwb3MsIFxuICAgIC8qKlxuICAgIFRoZSBtYXJrIHRvIHJlbW92ZS5cbiAgICAqL1xuICAgIG1hcmspIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5wb3MgPSBwb3M7XG4gICAgICAgIHRoaXMubWFyayA9IG1hcms7XG4gICAgfVxuICAgIGFwcGx5KGRvYykge1xuICAgICAgICBsZXQgbm9kZSA9IGRvYy5ub2RlQXQodGhpcy5wb3MpO1xuICAgICAgICBpZiAoIW5vZGUpXG4gICAgICAgICAgICByZXR1cm4gU3RlcFJlc3VsdC5mYWlsKFwiTm8gbm9kZSBhdCBtYXJrIHN0ZXAncyBwb3NpdGlvblwiKTtcbiAgICAgICAgbGV0IHVwZGF0ZWQgPSBub2RlLnR5cGUuY3JlYXRlKG5vZGUuYXR0cnMsIG51bGwsIHRoaXMubWFyay5yZW1vdmVGcm9tU2V0KG5vZGUubWFya3MpKTtcbiAgICAgICAgcmV0dXJuIFN0ZXBSZXN1bHQuZnJvbVJlcGxhY2UoZG9jLCB0aGlzLnBvcywgdGhpcy5wb3MgKyAxLCBuZXcgU2xpY2UoRnJhZ21lbnQuZnJvbSh1cGRhdGVkKSwgMCwgbm9kZS5pc0xlYWYgPyAwIDogMSkpO1xuICAgIH1cbiAgICBpbnZlcnQoZG9jKSB7XG4gICAgICAgIGxldCBub2RlID0gZG9jLm5vZGVBdCh0aGlzLnBvcyk7XG4gICAgICAgIGlmICghbm9kZSB8fCAhdGhpcy5tYXJrLmlzSW5TZXQobm9kZS5tYXJrcykpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgcmV0dXJuIG5ldyBBZGROb2RlTWFya1N0ZXAodGhpcy5wb3MsIHRoaXMubWFyayk7XG4gICAgfVxuICAgIG1hcChtYXBwaW5nKSB7XG4gICAgICAgIGxldCBwb3MgPSBtYXBwaW5nLm1hcFJlc3VsdCh0aGlzLnBvcywgMSk7XG4gICAgICAgIHJldHVybiBwb3MuZGVsZXRlZEFmdGVyID8gbnVsbCA6IG5ldyBSZW1vdmVOb2RlTWFya1N0ZXAocG9zLnBvcywgdGhpcy5tYXJrKTtcbiAgICB9XG4gICAgdG9KU09OKCkge1xuICAgICAgICByZXR1cm4geyBzdGVwVHlwZTogXCJyZW1vdmVOb2RlTWFya1wiLCBwb3M6IHRoaXMucG9zLCBtYXJrOiB0aGlzLm1hcmsudG9KU09OKCkgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBzdGF0aWMgZnJvbUpTT04oc2NoZW1hLCBqc29uKSB7XG4gICAgICAgIGlmICh0eXBlb2YganNvbi5wb3MgIT0gXCJudW1iZXJcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiSW52YWxpZCBpbnB1dCBmb3IgUmVtb3ZlTm9kZU1hcmtTdGVwLmZyb21KU09OXCIpO1xuICAgICAgICByZXR1cm4gbmV3IFJlbW92ZU5vZGVNYXJrU3RlcChqc29uLnBvcywgc2NoZW1hLm1hcmtGcm9tSlNPTihqc29uLm1hcmspKTtcbiAgICB9XG59XG5TdGVwLmpzb25JRChcInJlbW92ZU5vZGVNYXJrXCIsIFJlbW92ZU5vZGVNYXJrU3RlcCk7XG5cbi8qKlxuUmVwbGFjZSBhIHBhcnQgb2YgdGhlIGRvY3VtZW50IHdpdGggYSBzbGljZSBvZiBuZXcgY29udGVudC5cbiovXG5jbGFzcyBSZXBsYWNlU3RlcCBleHRlbmRzIFN0ZXAge1xuICAgIC8qKlxuICAgIFRoZSBnaXZlbiBgc2xpY2VgIHNob3VsZCBmaXQgdGhlICdnYXAnIGJldHdlZW4gYGZyb21gIGFuZFxuICAgIGB0b2BcdTIwMTR0aGUgZGVwdGhzIG11c3QgbGluZSB1cCwgYW5kIHRoZSBzdXJyb3VuZGluZyBub2RlcyBtdXN0IGJlXG4gICAgYWJsZSB0byBiZSBqb2luZWQgd2l0aCB0aGUgb3BlbiBzaWRlcyBvZiB0aGUgc2xpY2UuIFdoZW5cbiAgICBgc3RydWN0dXJlYCBpcyB0cnVlLCB0aGUgc3RlcCB3aWxsIGZhaWwgaWYgdGhlIGNvbnRlbnQgYmV0d2VlblxuICAgIGZyb20gYW5kIHRvIGlzIG5vdCBqdXN0IGEgc2VxdWVuY2Ugb2YgY2xvc2luZyBhbmQgdGhlbiBvcGVuaW5nXG4gICAgdG9rZW5zICh0aGlzIGlzIHRvIGd1YXJkIGFnYWluc3QgcmViYXNlZCByZXBsYWNlIHN0ZXBzXG4gICAgb3ZlcndyaXRpbmcgc29tZXRoaW5nIHRoZXkgd2VyZW4ndCBzdXBwb3NlZCB0bykuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAvKipcbiAgICBUaGUgc3RhcnQgcG9zaXRpb24gb2YgdGhlIHJlcGxhY2VkIHJhbmdlLlxuICAgICovXG4gICAgZnJvbSwgXG4gICAgLyoqXG4gICAgVGhlIGVuZCBwb3NpdGlvbiBvZiB0aGUgcmVwbGFjZWQgcmFuZ2UuXG4gICAgKi9cbiAgICB0bywgXG4gICAgLyoqXG4gICAgVGhlIHNsaWNlIHRvIGluc2VydC5cbiAgICAqL1xuICAgIHNsaWNlLCBcbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHN0cnVjdHVyZSA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZnJvbSA9IGZyb207XG4gICAgICAgIHRoaXMudG8gPSB0bztcbiAgICAgICAgdGhpcy5zbGljZSA9IHNsaWNlO1xuICAgICAgICB0aGlzLnN0cnVjdHVyZSA9IHN0cnVjdHVyZTtcbiAgICB9XG4gICAgYXBwbHkoZG9jKSB7XG4gICAgICAgIGlmICh0aGlzLnN0cnVjdHVyZSAmJiBjb250ZW50QmV0d2Vlbihkb2MsIHRoaXMuZnJvbSwgdGhpcy50bykpXG4gICAgICAgICAgICByZXR1cm4gU3RlcFJlc3VsdC5mYWlsKFwiU3RydWN0dXJlIHJlcGxhY2Ugd291bGQgb3ZlcndyaXRlIGNvbnRlbnRcIik7XG4gICAgICAgIHJldHVybiBTdGVwUmVzdWx0LmZyb21SZXBsYWNlKGRvYywgdGhpcy5mcm9tLCB0aGlzLnRvLCB0aGlzLnNsaWNlKTtcbiAgICB9XG4gICAgZ2V0TWFwKCkge1xuICAgICAgICByZXR1cm4gbmV3IFN0ZXBNYXAoW3RoaXMuZnJvbSwgdGhpcy50byAtIHRoaXMuZnJvbSwgdGhpcy5zbGljZS5zaXplXSk7XG4gICAgfVxuICAgIGludmVydChkb2MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBsYWNlU3RlcCh0aGlzLmZyb20sIHRoaXMuZnJvbSArIHRoaXMuc2xpY2Uuc2l6ZSwgZG9jLnNsaWNlKHRoaXMuZnJvbSwgdGhpcy50bykpO1xuICAgIH1cbiAgICBtYXAobWFwcGluZykge1xuICAgICAgICBsZXQgZnJvbSA9IG1hcHBpbmcubWFwUmVzdWx0KHRoaXMuZnJvbSwgMSksIHRvID0gbWFwcGluZy5tYXBSZXN1bHQodGhpcy50bywgLTEpO1xuICAgICAgICBpZiAoZnJvbS5kZWxldGVkQWNyb3NzICYmIHRvLmRlbGV0ZWRBY3Jvc3MpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBsYWNlU3RlcChmcm9tLnBvcywgTWF0aC5tYXgoZnJvbS5wb3MsIHRvLnBvcyksIHRoaXMuc2xpY2UpO1xuICAgIH1cbiAgICBtZXJnZShvdGhlcikge1xuICAgICAgICBpZiAoIShvdGhlciBpbnN0YW5jZW9mIFJlcGxhY2VTdGVwKSB8fCBvdGhlci5zdHJ1Y3R1cmUgfHwgdGhpcy5zdHJ1Y3R1cmUpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuZnJvbSArIHRoaXMuc2xpY2Uuc2l6ZSA9PSBvdGhlci5mcm9tICYmICF0aGlzLnNsaWNlLm9wZW5FbmQgJiYgIW90aGVyLnNsaWNlLm9wZW5TdGFydCkge1xuICAgICAgICAgICAgbGV0IHNsaWNlID0gdGhpcy5zbGljZS5zaXplICsgb3RoZXIuc2xpY2Uuc2l6ZSA9PSAwID8gU2xpY2UuZW1wdHlcbiAgICAgICAgICAgICAgICA6IG5ldyBTbGljZSh0aGlzLnNsaWNlLmNvbnRlbnQuYXBwZW5kKG90aGVyLnNsaWNlLmNvbnRlbnQpLCB0aGlzLnNsaWNlLm9wZW5TdGFydCwgb3RoZXIuc2xpY2Uub3BlbkVuZCk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlcGxhY2VTdGVwKHRoaXMuZnJvbSwgdGhpcy50byArIChvdGhlci50byAtIG90aGVyLmZyb20pLCBzbGljZSwgdGhpcy5zdHJ1Y3R1cmUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG90aGVyLnRvID09IHRoaXMuZnJvbSAmJiAhdGhpcy5zbGljZS5vcGVuU3RhcnQgJiYgIW90aGVyLnNsaWNlLm9wZW5FbmQpIHtcbiAgICAgICAgICAgIGxldCBzbGljZSA9IHRoaXMuc2xpY2Uuc2l6ZSArIG90aGVyLnNsaWNlLnNpemUgPT0gMCA/IFNsaWNlLmVtcHR5XG4gICAgICAgICAgICAgICAgOiBuZXcgU2xpY2Uob3RoZXIuc2xpY2UuY29udGVudC5hcHBlbmQodGhpcy5zbGljZS5jb250ZW50KSwgb3RoZXIuc2xpY2Uub3BlblN0YXJ0LCB0aGlzLnNsaWNlLm9wZW5FbmQpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXBsYWNlU3RlcChvdGhlci5mcm9tLCB0aGlzLnRvLCBzbGljZSwgdGhpcy5zdHJ1Y3R1cmUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdG9KU09OKCkge1xuICAgICAgICBsZXQganNvbiA9IHsgc3RlcFR5cGU6IFwicmVwbGFjZVwiLCBmcm9tOiB0aGlzLmZyb20sIHRvOiB0aGlzLnRvIH07XG4gICAgICAgIGlmICh0aGlzLnNsaWNlLnNpemUpXG4gICAgICAgICAgICBqc29uLnNsaWNlID0gdGhpcy5zbGljZS50b0pTT04oKTtcbiAgICAgICAgaWYgKHRoaXMuc3RydWN0dXJlKVxuICAgICAgICAgICAganNvbi5zdHJ1Y3R1cmUgPSB0cnVlO1xuICAgICAgICByZXR1cm4ganNvbjtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBzdGF0aWMgZnJvbUpTT04oc2NoZW1hLCBqc29uKSB7XG4gICAgICAgIGlmICh0eXBlb2YganNvbi5mcm9tICE9IFwibnVtYmVyXCIgfHwgdHlwZW9mIGpzb24udG8gIT0gXCJudW1iZXJcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiSW52YWxpZCBpbnB1dCBmb3IgUmVwbGFjZVN0ZXAuZnJvbUpTT05cIik7XG4gICAgICAgIHJldHVybiBuZXcgUmVwbGFjZVN0ZXAoanNvbi5mcm9tLCBqc29uLnRvLCBTbGljZS5mcm9tSlNPTihzY2hlbWEsIGpzb24uc2xpY2UpLCAhIWpzb24uc3RydWN0dXJlKTtcbiAgICB9XG59XG5TdGVwLmpzb25JRChcInJlcGxhY2VcIiwgUmVwbGFjZVN0ZXApO1xuLyoqXG5SZXBsYWNlIGEgcGFydCBvZiB0aGUgZG9jdW1lbnQgd2l0aCBhIHNsaWNlIG9mIGNvbnRlbnQsIGJ1dFxucHJlc2VydmUgYSByYW5nZSBvZiB0aGUgcmVwbGFjZWQgY29udGVudCBieSBtb3ZpbmcgaXQgaW50byB0aGVcbnNsaWNlLlxuKi9cbmNsYXNzIFJlcGxhY2VBcm91bmRTdGVwIGV4dGVuZHMgU3RlcCB7XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgcmVwbGFjZS1hcm91bmQgc3RlcCB3aXRoIHRoZSBnaXZlbiByYW5nZSBhbmQgZ2FwLlxuICAgIGBpbnNlcnRgIHNob3VsZCBiZSB0aGUgcG9pbnQgaW4gdGhlIHNsaWNlIGludG8gd2hpY2ggdGhlIGNvbnRlbnRcbiAgICBvZiB0aGUgZ2FwIHNob3VsZCBiZSBtb3ZlZC4gYHN0cnVjdHVyZWAgaGFzIHRoZSBzYW1lIG1lYW5pbmcgYXNcbiAgICBpdCBoYXMgaW4gdGhlIFtgUmVwbGFjZVN0ZXBgXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jdHJhbnNmb3JtLlJlcGxhY2VTdGVwKSBjbGFzcy5cbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgIFRoZSBzdGFydCBwb3NpdGlvbiBvZiB0aGUgcmVwbGFjZWQgcmFuZ2UuXG4gICAgKi9cbiAgICBmcm9tLCBcbiAgICAvKipcbiAgICBUaGUgZW5kIHBvc2l0aW9uIG9mIHRoZSByZXBsYWNlZCByYW5nZS5cbiAgICAqL1xuICAgIHRvLCBcbiAgICAvKipcbiAgICBUaGUgc3RhcnQgb2YgcHJlc2VydmVkIHJhbmdlLlxuICAgICovXG4gICAgZ2FwRnJvbSwgXG4gICAgLyoqXG4gICAgVGhlIGVuZCBvZiBwcmVzZXJ2ZWQgcmFuZ2UuXG4gICAgKi9cbiAgICBnYXBUbywgXG4gICAgLyoqXG4gICAgVGhlIHNsaWNlIHRvIGluc2VydC5cbiAgICAqL1xuICAgIHNsaWNlLCBcbiAgICAvKipcbiAgICBUaGUgcG9zaXRpb24gaW4gdGhlIHNsaWNlIHdoZXJlIHRoZSBwcmVzZXJ2ZWQgcmFuZ2Ugc2hvdWxkIGJlXG4gICAgaW5zZXJ0ZWQuXG4gICAgKi9cbiAgICBpbnNlcnQsIFxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgc3RydWN0dXJlID0gZmFsc2UpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5mcm9tID0gZnJvbTtcbiAgICAgICAgdGhpcy50byA9IHRvO1xuICAgICAgICB0aGlzLmdhcEZyb20gPSBnYXBGcm9tO1xuICAgICAgICB0aGlzLmdhcFRvID0gZ2FwVG87XG4gICAgICAgIHRoaXMuc2xpY2UgPSBzbGljZTtcbiAgICAgICAgdGhpcy5pbnNlcnQgPSBpbnNlcnQ7XG4gICAgICAgIHRoaXMuc3RydWN0dXJlID0gc3RydWN0dXJlO1xuICAgIH1cbiAgICBhcHBseShkb2MpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RydWN0dXJlICYmIChjb250ZW50QmV0d2Vlbihkb2MsIHRoaXMuZnJvbSwgdGhpcy5nYXBGcm9tKSB8fFxuICAgICAgICAgICAgY29udGVudEJldHdlZW4oZG9jLCB0aGlzLmdhcFRvLCB0aGlzLnRvKSkpXG4gICAgICAgICAgICByZXR1cm4gU3RlcFJlc3VsdC5mYWlsKFwiU3RydWN0dXJlIGdhcC1yZXBsYWNlIHdvdWxkIG92ZXJ3cml0ZSBjb250ZW50XCIpO1xuICAgICAgICBsZXQgZ2FwID0gZG9jLnNsaWNlKHRoaXMuZ2FwRnJvbSwgdGhpcy5nYXBUbyk7XG4gICAgICAgIGlmIChnYXAub3BlblN0YXJ0IHx8IGdhcC5vcGVuRW5kKVxuICAgICAgICAgICAgcmV0dXJuIFN0ZXBSZXN1bHQuZmFpbChcIkdhcCBpcyBub3QgYSBmbGF0IHJhbmdlXCIpO1xuICAgICAgICBsZXQgaW5zZXJ0ZWQgPSB0aGlzLnNsaWNlLmluc2VydEF0KHRoaXMuaW5zZXJ0LCBnYXAuY29udGVudCk7XG4gICAgICAgIGlmICghaW5zZXJ0ZWQpXG4gICAgICAgICAgICByZXR1cm4gU3RlcFJlc3VsdC5mYWlsKFwiQ29udGVudCBkb2VzIG5vdCBmaXQgaW4gZ2FwXCIpO1xuICAgICAgICByZXR1cm4gU3RlcFJlc3VsdC5mcm9tUmVwbGFjZShkb2MsIHRoaXMuZnJvbSwgdGhpcy50bywgaW5zZXJ0ZWQpO1xuICAgIH1cbiAgICBnZXRNYXAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgU3RlcE1hcChbdGhpcy5mcm9tLCB0aGlzLmdhcEZyb20gLSB0aGlzLmZyb20sIHRoaXMuaW5zZXJ0LFxuICAgICAgICAgICAgdGhpcy5nYXBUbywgdGhpcy50byAtIHRoaXMuZ2FwVG8sIHRoaXMuc2xpY2Uuc2l6ZSAtIHRoaXMuaW5zZXJ0XSk7XG4gICAgfVxuICAgIGludmVydChkb2MpIHtcbiAgICAgICAgbGV0IGdhcCA9IHRoaXMuZ2FwVG8gLSB0aGlzLmdhcEZyb207XG4gICAgICAgIHJldHVybiBuZXcgUmVwbGFjZUFyb3VuZFN0ZXAodGhpcy5mcm9tLCB0aGlzLmZyb20gKyB0aGlzLnNsaWNlLnNpemUgKyBnYXAsIHRoaXMuZnJvbSArIHRoaXMuaW5zZXJ0LCB0aGlzLmZyb20gKyB0aGlzLmluc2VydCArIGdhcCwgZG9jLnNsaWNlKHRoaXMuZnJvbSwgdGhpcy50bykucmVtb3ZlQmV0d2Vlbih0aGlzLmdhcEZyb20gLSB0aGlzLmZyb20sIHRoaXMuZ2FwVG8gLSB0aGlzLmZyb20pLCB0aGlzLmdhcEZyb20gLSB0aGlzLmZyb20sIHRoaXMuc3RydWN0dXJlKTtcbiAgICB9XG4gICAgbWFwKG1hcHBpbmcpIHtcbiAgICAgICAgbGV0IGZyb20gPSBtYXBwaW5nLm1hcFJlc3VsdCh0aGlzLmZyb20sIDEpLCB0byA9IG1hcHBpbmcubWFwUmVzdWx0KHRoaXMudG8sIC0xKTtcbiAgICAgICAgbGV0IGdhcEZyb20gPSB0aGlzLmZyb20gPT0gdGhpcy5nYXBGcm9tID8gZnJvbS5wb3MgOiBtYXBwaW5nLm1hcCh0aGlzLmdhcEZyb20sIC0xKTtcbiAgICAgICAgbGV0IGdhcFRvID0gdGhpcy50byA9PSB0aGlzLmdhcFRvID8gdG8ucG9zIDogbWFwcGluZy5tYXAodGhpcy5nYXBUbywgMSk7XG4gICAgICAgIGlmICgoZnJvbS5kZWxldGVkQWNyb3NzICYmIHRvLmRlbGV0ZWRBY3Jvc3MpIHx8IGdhcEZyb20gPCBmcm9tLnBvcyB8fCBnYXBUbyA+IHRvLnBvcylcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gbmV3IFJlcGxhY2VBcm91bmRTdGVwKGZyb20ucG9zLCB0by5wb3MsIGdhcEZyb20sIGdhcFRvLCB0aGlzLnNsaWNlLCB0aGlzLmluc2VydCwgdGhpcy5zdHJ1Y3R1cmUpO1xuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIGxldCBqc29uID0geyBzdGVwVHlwZTogXCJyZXBsYWNlQXJvdW5kXCIsIGZyb206IHRoaXMuZnJvbSwgdG86IHRoaXMudG8sXG4gICAgICAgICAgICBnYXBGcm9tOiB0aGlzLmdhcEZyb20sIGdhcFRvOiB0aGlzLmdhcFRvLCBpbnNlcnQ6IHRoaXMuaW5zZXJ0IH07XG4gICAgICAgIGlmICh0aGlzLnNsaWNlLnNpemUpXG4gICAgICAgICAgICBqc29uLnNsaWNlID0gdGhpcy5zbGljZS50b0pTT04oKTtcbiAgICAgICAgaWYgKHRoaXMuc3RydWN0dXJlKVxuICAgICAgICAgICAganNvbi5zdHJ1Y3R1cmUgPSB0cnVlO1xuICAgICAgICByZXR1cm4ganNvbjtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBzdGF0aWMgZnJvbUpTT04oc2NoZW1hLCBqc29uKSB7XG4gICAgICAgIGlmICh0eXBlb2YganNvbi5mcm9tICE9IFwibnVtYmVyXCIgfHwgdHlwZW9mIGpzb24udG8gIT0gXCJudW1iZXJcIiB8fFxuICAgICAgICAgICAgdHlwZW9mIGpzb24uZ2FwRnJvbSAhPSBcIm51bWJlclwiIHx8IHR5cGVvZiBqc29uLmdhcFRvICE9IFwibnVtYmVyXCIgfHwgdHlwZW9mIGpzb24uaW5zZXJ0ICE9IFwibnVtYmVyXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkludmFsaWQgaW5wdXQgZm9yIFJlcGxhY2VBcm91bmRTdGVwLmZyb21KU09OXCIpO1xuICAgICAgICByZXR1cm4gbmV3IFJlcGxhY2VBcm91bmRTdGVwKGpzb24uZnJvbSwganNvbi50bywganNvbi5nYXBGcm9tLCBqc29uLmdhcFRvLCBTbGljZS5mcm9tSlNPTihzY2hlbWEsIGpzb24uc2xpY2UpLCBqc29uLmluc2VydCwgISFqc29uLnN0cnVjdHVyZSk7XG4gICAgfVxufVxuU3RlcC5qc29uSUQoXCJyZXBsYWNlQXJvdW5kXCIsIFJlcGxhY2VBcm91bmRTdGVwKTtcbmZ1bmN0aW9uIGNvbnRlbnRCZXR3ZWVuKGRvYywgZnJvbSwgdG8pIHtcbiAgICBsZXQgJGZyb20gPSBkb2MucmVzb2x2ZShmcm9tKSwgZGlzdCA9IHRvIC0gZnJvbSwgZGVwdGggPSAkZnJvbS5kZXB0aDtcbiAgICB3aGlsZSAoZGlzdCA+IDAgJiYgZGVwdGggPiAwICYmICRmcm9tLmluZGV4QWZ0ZXIoZGVwdGgpID09ICRmcm9tLm5vZGUoZGVwdGgpLmNoaWxkQ291bnQpIHtcbiAgICAgICAgZGVwdGgtLTtcbiAgICAgICAgZGlzdC0tO1xuICAgIH1cbiAgICBpZiAoZGlzdCA+IDApIHtcbiAgICAgICAgbGV0IG5leHQgPSAkZnJvbS5ub2RlKGRlcHRoKS5tYXliZUNoaWxkKCRmcm9tLmluZGV4QWZ0ZXIoZGVwdGgpKTtcbiAgICAgICAgd2hpbGUgKGRpc3QgPiAwKSB7XG4gICAgICAgICAgICBpZiAoIW5leHQgfHwgbmV4dC5pc0xlYWYpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBuZXh0ID0gbmV4dC5maXJzdENoaWxkO1xuICAgICAgICAgICAgZGlzdC0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gYWRkTWFyayh0ciwgZnJvbSwgdG8sIG1hcmspIHtcbiAgICBsZXQgcmVtb3ZlZCA9IFtdLCBhZGRlZCA9IFtdO1xuICAgIGxldCByZW1vdmluZywgYWRkaW5nO1xuICAgIHRyLmRvYy5ub2Rlc0JldHdlZW4oZnJvbSwgdG8sIChub2RlLCBwb3MsIHBhcmVudCkgPT4ge1xuICAgICAgICBpZiAoIW5vZGUuaXNJbmxpbmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxldCBtYXJrcyA9IG5vZGUubWFya3M7XG4gICAgICAgIGlmICghbWFyay5pc0luU2V0KG1hcmtzKSAmJiBwYXJlbnQudHlwZS5hbGxvd3NNYXJrVHlwZShtYXJrLnR5cGUpKSB7XG4gICAgICAgICAgICBsZXQgc3RhcnQgPSBNYXRoLm1heChwb3MsIGZyb20pLCBlbmQgPSBNYXRoLm1pbihwb3MgKyBub2RlLm5vZGVTaXplLCB0byk7XG4gICAgICAgICAgICBsZXQgbmV3U2V0ID0gbWFyay5hZGRUb1NldChtYXJrcyk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hcmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFtYXJrc1tpXS5pc0luU2V0KG5ld1NldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlbW92aW5nICYmIHJlbW92aW5nLnRvID09IHN0YXJ0ICYmIHJlbW92aW5nLm1hcmsuZXEobWFya3NbaV0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZpbmcudG8gPSBlbmQ7XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZWQucHVzaChyZW1vdmluZyA9IG5ldyBSZW1vdmVNYXJrU3RlcChzdGFydCwgZW5kLCBtYXJrc1tpXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhZGRpbmcgJiYgYWRkaW5nLnRvID09IHN0YXJ0KVxuICAgICAgICAgICAgICAgIGFkZGluZy50byA9IGVuZDtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBhZGRlZC5wdXNoKGFkZGluZyA9IG5ldyBBZGRNYXJrU3RlcChzdGFydCwgZW5kLCBtYXJrKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZW1vdmVkLmZvckVhY2gocyA9PiB0ci5zdGVwKHMpKTtcbiAgICBhZGRlZC5mb3JFYWNoKHMgPT4gdHIuc3RlcChzKSk7XG59XG5mdW5jdGlvbiByZW1vdmVNYXJrKHRyLCBmcm9tLCB0bywgbWFyaykge1xuICAgIGxldCBtYXRjaGVkID0gW10sIHN0ZXAgPSAwO1xuICAgIHRyLmRvYy5ub2Rlc0JldHdlZW4oZnJvbSwgdG8sIChub2RlLCBwb3MpID0+IHtcbiAgICAgICAgaWYgKCFub2RlLmlzSW5saW5lKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBzdGVwKys7XG4gICAgICAgIGxldCB0b1JlbW92ZSA9IG51bGw7XG4gICAgICAgIGlmIChtYXJrIGluc3RhbmNlb2YgTWFya1R5cGUpIHtcbiAgICAgICAgICAgIGxldCBzZXQgPSBub2RlLm1hcmtzLCBmb3VuZDtcbiAgICAgICAgICAgIHdoaWxlIChmb3VuZCA9IG1hcmsuaXNJblNldChzZXQpKSB7XG4gICAgICAgICAgICAgICAgKHRvUmVtb3ZlIHx8ICh0b1JlbW92ZSA9IFtdKSkucHVzaChmb3VuZCk7XG4gICAgICAgICAgICAgICAgc2V0ID0gZm91bmQucmVtb3ZlRnJvbVNldChzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG1hcmspIHtcbiAgICAgICAgICAgIGlmIChtYXJrLmlzSW5TZXQobm9kZS5tYXJrcykpXG4gICAgICAgICAgICAgICAgdG9SZW1vdmUgPSBbbWFya107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0b1JlbW92ZSA9IG5vZGUubWFya3M7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRvUmVtb3ZlICYmIHRvUmVtb3ZlLmxlbmd0aCkge1xuICAgICAgICAgICAgbGV0IGVuZCA9IE1hdGgubWluKHBvcyArIG5vZGUubm9kZVNpemUsIHRvKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG9SZW1vdmUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgc3R5bGUgPSB0b1JlbW92ZVtpXSwgZm91bmQ7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBtYXRjaGVkLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBtID0gbWF0Y2hlZFtqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG0uc3RlcCA9PSBzdGVwIC0gMSAmJiBzdHlsZS5lcShtYXRjaGVkW2pdLnN0eWxlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kLnRvID0gZW5kO1xuICAgICAgICAgICAgICAgICAgICBmb3VuZC5zdGVwID0gc3RlcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZWQucHVzaCh7IHN0eWxlLCBmcm9tOiBNYXRoLm1heChwb3MsIGZyb20pLCB0bzogZW5kLCBzdGVwIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIG1hdGNoZWQuZm9yRWFjaChtID0+IHRyLnN0ZXAobmV3IFJlbW92ZU1hcmtTdGVwKG0uZnJvbSwgbS50bywgbS5zdHlsZSkpKTtcbn1cbmZ1bmN0aW9uIGNsZWFySW5jb21wYXRpYmxlKHRyLCBwb3MsIHBhcmVudFR5cGUsIG1hdGNoID0gcGFyZW50VHlwZS5jb250ZW50TWF0Y2gsIGNsZWFyTmV3bGluZXMgPSB0cnVlKSB7XG4gICAgbGV0IG5vZGUgPSB0ci5kb2Mubm9kZUF0KHBvcyk7XG4gICAgbGV0IHJlcGxTdGVwcyA9IFtdLCBjdXIgPSBwb3MgKyAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZENvdW50OyBpKyspIHtcbiAgICAgICAgbGV0IGNoaWxkID0gbm9kZS5jaGlsZChpKSwgZW5kID0gY3VyICsgY2hpbGQubm9kZVNpemU7XG4gICAgICAgIGxldCBhbGxvd2VkID0gbWF0Y2gubWF0Y2hUeXBlKGNoaWxkLnR5cGUpO1xuICAgICAgICBpZiAoIWFsbG93ZWQpIHtcbiAgICAgICAgICAgIHJlcGxTdGVwcy5wdXNoKG5ldyBSZXBsYWNlU3RlcChjdXIsIGVuZCwgU2xpY2UuZW1wdHkpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG1hdGNoID0gYWxsb3dlZDtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY2hpbGQubWFya3MubGVuZ3RoOyBqKyspXG4gICAgICAgICAgICAgICAgaWYgKCFwYXJlbnRUeXBlLmFsbG93c01hcmtUeXBlKGNoaWxkLm1hcmtzW2pdLnR5cGUpKVxuICAgICAgICAgICAgICAgICAgICB0ci5zdGVwKG5ldyBSZW1vdmVNYXJrU3RlcChjdXIsIGVuZCwgY2hpbGQubWFya3Nbal0pKTtcbiAgICAgICAgICAgIGlmIChjbGVhck5ld2xpbmVzICYmIGNoaWxkLmlzVGV4dCAmJiBwYXJlbnRUeXBlLndoaXRlc3BhY2UgIT0gXCJwcmVcIikge1xuICAgICAgICAgICAgICAgIGxldCBtLCBuZXdsaW5lID0gL1xccj9cXG58XFxyL2csIHNsaWNlO1xuICAgICAgICAgICAgICAgIHdoaWxlIChtID0gbmV3bGluZS5leGVjKGNoaWxkLnRleHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2xpY2UpXG4gICAgICAgICAgICAgICAgICAgICAgICBzbGljZSA9IG5ldyBTbGljZShGcmFnbWVudC5mcm9tKHBhcmVudFR5cGUuc2NoZW1hLnRleHQoXCIgXCIsIHBhcmVudFR5cGUuYWxsb3dlZE1hcmtzKGNoaWxkLm1hcmtzKSkpLCAwLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgcmVwbFN0ZXBzLnB1c2gobmV3IFJlcGxhY2VTdGVwKGN1ciArIG0uaW5kZXgsIGN1ciArIG0uaW5kZXggKyBtWzBdLmxlbmd0aCwgc2xpY2UpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY3VyID0gZW5kO1xuICAgIH1cbiAgICBpZiAoIW1hdGNoLnZhbGlkRW5kKSB7XG4gICAgICAgIGxldCBmaWxsID0gbWF0Y2guZmlsbEJlZm9yZShGcmFnbWVudC5lbXB0eSwgdHJ1ZSk7XG4gICAgICAgIHRyLnJlcGxhY2UoY3VyLCBjdXIsIG5ldyBTbGljZShmaWxsLCAwLCAwKSk7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSByZXBsU3RlcHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXG4gICAgICAgIHRyLnN0ZXAocmVwbFN0ZXBzW2ldKTtcbn1cblxuZnVuY3Rpb24gY2FuQ3V0KG5vZGUsIHN0YXJ0LCBlbmQpIHtcbiAgICByZXR1cm4gKHN0YXJ0ID09IDAgfHwgbm9kZS5jYW5SZXBsYWNlKHN0YXJ0LCBub2RlLmNoaWxkQ291bnQpKSAmJlxuICAgICAgICAoZW5kID09IG5vZGUuY2hpbGRDb3VudCB8fCBub2RlLmNhblJlcGxhY2UoMCwgZW5kKSk7XG59XG4vKipcblRyeSB0byBmaW5kIGEgdGFyZ2V0IGRlcHRoIHRvIHdoaWNoIHRoZSBjb250ZW50IGluIHRoZSBnaXZlbiByYW5nZVxuY2FuIGJlIGxpZnRlZC4gV2lsbCBub3QgZ28gYWNyb3NzXG5baXNvbGF0aW5nXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTm9kZVNwZWMuaXNvbGF0aW5nKSBwYXJlbnQgbm9kZXMuXG4qL1xuZnVuY3Rpb24gbGlmdFRhcmdldChyYW5nZSkge1xuICAgIGxldCBwYXJlbnQgPSByYW5nZS5wYXJlbnQ7XG4gICAgbGV0IGNvbnRlbnQgPSBwYXJlbnQuY29udGVudC5jdXRCeUluZGV4KHJhbmdlLnN0YXJ0SW5kZXgsIHJhbmdlLmVuZEluZGV4KTtcbiAgICBmb3IgKGxldCBkZXB0aCA9IHJhbmdlLmRlcHRoOzsgLS1kZXB0aCkge1xuICAgICAgICBsZXQgbm9kZSA9IHJhbmdlLiRmcm9tLm5vZGUoZGVwdGgpO1xuICAgICAgICBsZXQgaW5kZXggPSByYW5nZS4kZnJvbS5pbmRleChkZXB0aCksIGVuZEluZGV4ID0gcmFuZ2UuJHRvLmluZGV4QWZ0ZXIoZGVwdGgpO1xuICAgICAgICBpZiAoZGVwdGggPCByYW5nZS5kZXB0aCAmJiBub2RlLmNhblJlcGxhY2UoaW5kZXgsIGVuZEluZGV4LCBjb250ZW50KSlcbiAgICAgICAgICAgIHJldHVybiBkZXB0aDtcbiAgICAgICAgaWYgKGRlcHRoID09IDAgfHwgbm9kZS50eXBlLnNwZWMuaXNvbGF0aW5nIHx8ICFjYW5DdXQobm9kZSwgaW5kZXgsIGVuZEluZGV4KSlcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmZ1bmN0aW9uIGxpZnQodHIsIHJhbmdlLCB0YXJnZXQpIHtcbiAgICBsZXQgeyAkZnJvbSwgJHRvLCBkZXB0aCB9ID0gcmFuZ2U7XG4gICAgbGV0IGdhcFN0YXJ0ID0gJGZyb20uYmVmb3JlKGRlcHRoICsgMSksIGdhcEVuZCA9ICR0by5hZnRlcihkZXB0aCArIDEpO1xuICAgIGxldCBzdGFydCA9IGdhcFN0YXJ0LCBlbmQgPSBnYXBFbmQ7XG4gICAgbGV0IGJlZm9yZSA9IEZyYWdtZW50LmVtcHR5LCBvcGVuU3RhcnQgPSAwO1xuICAgIGZvciAobGV0IGQgPSBkZXB0aCwgc3BsaXR0aW5nID0gZmFsc2U7IGQgPiB0YXJnZXQ7IGQtLSlcbiAgICAgICAgaWYgKHNwbGl0dGluZyB8fCAkZnJvbS5pbmRleChkKSA+IDApIHtcbiAgICAgICAgICAgIHNwbGl0dGluZyA9IHRydWU7XG4gICAgICAgICAgICBiZWZvcmUgPSBGcmFnbWVudC5mcm9tKCRmcm9tLm5vZGUoZCkuY29weShiZWZvcmUpKTtcbiAgICAgICAgICAgIG9wZW5TdGFydCsrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc3RhcnQtLTtcbiAgICAgICAgfVxuICAgIGxldCBhZnRlciA9IEZyYWdtZW50LmVtcHR5LCBvcGVuRW5kID0gMDtcbiAgICBmb3IgKGxldCBkID0gZGVwdGgsIHNwbGl0dGluZyA9IGZhbHNlOyBkID4gdGFyZ2V0OyBkLS0pXG4gICAgICAgIGlmIChzcGxpdHRpbmcgfHwgJHRvLmFmdGVyKGQgKyAxKSA8ICR0by5lbmQoZCkpIHtcbiAgICAgICAgICAgIHNwbGl0dGluZyA9IHRydWU7XG4gICAgICAgICAgICBhZnRlciA9IEZyYWdtZW50LmZyb20oJHRvLm5vZGUoZCkuY29weShhZnRlcikpO1xuICAgICAgICAgICAgb3BlbkVuZCsrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZW5kKys7XG4gICAgICAgIH1cbiAgICB0ci5zdGVwKG5ldyBSZXBsYWNlQXJvdW5kU3RlcChzdGFydCwgZW5kLCBnYXBTdGFydCwgZ2FwRW5kLCBuZXcgU2xpY2UoYmVmb3JlLmFwcGVuZChhZnRlciksIG9wZW5TdGFydCwgb3BlbkVuZCksIGJlZm9yZS5zaXplIC0gb3BlblN0YXJ0LCB0cnVlKSk7XG59XG4vKipcblRyeSB0byBmaW5kIGEgdmFsaWQgd2F5IHRvIHdyYXAgdGhlIGNvbnRlbnQgaW4gdGhlIGdpdmVuIHJhbmdlIGluIGFcbm5vZGUgb2YgdGhlIGdpdmVuIHR5cGUuIE1heSBpbnRyb2R1Y2UgZXh0cmEgbm9kZXMgYXJvdW5kIGFuZCBpbnNpZGVcbnRoZSB3cmFwcGVyIG5vZGUsIGlmIG5lY2Vzc2FyeS4gUmV0dXJucyBudWxsIGlmIG5vIHZhbGlkIHdyYXBwaW5nXG5jb3VsZCBiZSBmb3VuZC4gV2hlbiBgaW5uZXJSYW5nZWAgaXMgZ2l2ZW4sIHRoYXQgcmFuZ2UncyBjb250ZW50IGlzXG51c2VkIGFzIHRoZSBjb250ZW50IHRvIGZpdCBpbnRvIHRoZSB3cmFwcGluZywgaW5zdGVhZCBvZiB0aGVcbmNvbnRlbnQgb2YgYHJhbmdlYC5cbiovXG5mdW5jdGlvbiBmaW5kV3JhcHBpbmcocmFuZ2UsIG5vZGVUeXBlLCBhdHRycyA9IG51bGwsIGlubmVyUmFuZ2UgPSByYW5nZSkge1xuICAgIGxldCBhcm91bmQgPSBmaW5kV3JhcHBpbmdPdXRzaWRlKHJhbmdlLCBub2RlVHlwZSk7XG4gICAgbGV0IGlubmVyID0gYXJvdW5kICYmIGZpbmRXcmFwcGluZ0luc2lkZShpbm5lclJhbmdlLCBub2RlVHlwZSk7XG4gICAgaWYgKCFpbm5lcilcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIGFyb3VuZC5tYXAod2l0aEF0dHJzKVxuICAgICAgICAuY29uY2F0KHsgdHlwZTogbm9kZVR5cGUsIGF0dHJzIH0pLmNvbmNhdChpbm5lci5tYXAod2l0aEF0dHJzKSk7XG59XG5mdW5jdGlvbiB3aXRoQXR0cnModHlwZSkgeyByZXR1cm4geyB0eXBlLCBhdHRyczogbnVsbCB9OyB9XG5mdW5jdGlvbiBmaW5kV3JhcHBpbmdPdXRzaWRlKHJhbmdlLCB0eXBlKSB7XG4gICAgbGV0IHsgcGFyZW50LCBzdGFydEluZGV4LCBlbmRJbmRleCB9ID0gcmFuZ2U7XG4gICAgbGV0IGFyb3VuZCA9IHBhcmVudC5jb250ZW50TWF0Y2hBdChzdGFydEluZGV4KS5maW5kV3JhcHBpbmcodHlwZSk7XG4gICAgaWYgKCFhcm91bmQpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIGxldCBvdXRlciA9IGFyb3VuZC5sZW5ndGggPyBhcm91bmRbMF0gOiB0eXBlO1xuICAgIHJldHVybiBwYXJlbnQuY2FuUmVwbGFjZVdpdGgoc3RhcnRJbmRleCwgZW5kSW5kZXgsIG91dGVyKSA/IGFyb3VuZCA6IG51bGw7XG59XG5mdW5jdGlvbiBmaW5kV3JhcHBpbmdJbnNpZGUocmFuZ2UsIHR5cGUpIHtcbiAgICBsZXQgeyBwYXJlbnQsIHN0YXJ0SW5kZXgsIGVuZEluZGV4IH0gPSByYW5nZTtcbiAgICBsZXQgaW5uZXIgPSBwYXJlbnQuY2hpbGQoc3RhcnRJbmRleCk7XG4gICAgbGV0IGluc2lkZSA9IHR5cGUuY29udGVudE1hdGNoLmZpbmRXcmFwcGluZyhpbm5lci50eXBlKTtcbiAgICBpZiAoIWluc2lkZSlcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgbGV0IGxhc3RUeXBlID0gaW5zaWRlLmxlbmd0aCA/IGluc2lkZVtpbnNpZGUubGVuZ3RoIC0gMV0gOiB0eXBlO1xuICAgIGxldCBpbm5lck1hdGNoID0gbGFzdFR5cGUuY29udGVudE1hdGNoO1xuICAgIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpbm5lck1hdGNoICYmIGkgPCBlbmRJbmRleDsgaSsrKVxuICAgICAgICBpbm5lck1hdGNoID0gaW5uZXJNYXRjaC5tYXRjaFR5cGUocGFyZW50LmNoaWxkKGkpLnR5cGUpO1xuICAgIGlmICghaW5uZXJNYXRjaCB8fCAhaW5uZXJNYXRjaC52YWxpZEVuZClcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIGluc2lkZTtcbn1cbmZ1bmN0aW9uIHdyYXAodHIsIHJhbmdlLCB3cmFwcGVycykge1xuICAgIGxldCBjb250ZW50ID0gRnJhZ21lbnQuZW1wdHk7XG4gICAgZm9yIChsZXQgaSA9IHdyYXBwZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGlmIChjb250ZW50LnNpemUpIHtcbiAgICAgICAgICAgIGxldCBtYXRjaCA9IHdyYXBwZXJzW2ldLnR5cGUuY29udGVudE1hdGNoLm1hdGNoRnJhZ21lbnQoY29udGVudCk7XG4gICAgICAgICAgICBpZiAoIW1hdGNoIHx8ICFtYXRjaC52YWxpZEVuZClcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIldyYXBwZXIgdHlwZSBnaXZlbiB0byBUcmFuc2Zvcm0ud3JhcCBkb2VzIG5vdCBmb3JtIHZhbGlkIGNvbnRlbnQgb2YgaXRzIHBhcmVudCB3cmFwcGVyXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRlbnQgPSBGcmFnbWVudC5mcm9tKHdyYXBwZXJzW2ldLnR5cGUuY3JlYXRlKHdyYXBwZXJzW2ldLmF0dHJzLCBjb250ZW50KSk7XG4gICAgfVxuICAgIGxldCBzdGFydCA9IHJhbmdlLnN0YXJ0LCBlbmQgPSByYW5nZS5lbmQ7XG4gICAgdHIuc3RlcChuZXcgUmVwbGFjZUFyb3VuZFN0ZXAoc3RhcnQsIGVuZCwgc3RhcnQsIGVuZCwgbmV3IFNsaWNlKGNvbnRlbnQsIDAsIDApLCB3cmFwcGVycy5sZW5ndGgsIHRydWUpKTtcbn1cbmZ1bmN0aW9uIHNldEJsb2NrVHlwZSh0ciwgZnJvbSwgdG8sIHR5cGUsIGF0dHJzKSB7XG4gICAgaWYgKCF0eXBlLmlzVGV4dGJsb2NrKVxuICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIlR5cGUgZ2l2ZW4gdG8gc2V0QmxvY2tUeXBlIHNob3VsZCBiZSBhIHRleHRibG9ja1wiKTtcbiAgICBsZXQgbWFwRnJvbSA9IHRyLnN0ZXBzLmxlbmd0aDtcbiAgICB0ci5kb2Mubm9kZXNCZXR3ZWVuKGZyb20sIHRvLCAobm9kZSwgcG9zKSA9PiB7XG4gICAgICAgIGxldCBhdHRyc0hlcmUgPSB0eXBlb2YgYXR0cnMgPT0gXCJmdW5jdGlvblwiID8gYXR0cnMobm9kZSkgOiBhdHRycztcbiAgICAgICAgaWYgKG5vZGUuaXNUZXh0YmxvY2sgJiYgIW5vZGUuaGFzTWFya3VwKHR5cGUsIGF0dHJzSGVyZSkgJiZcbiAgICAgICAgICAgIGNhbkNoYW5nZVR5cGUodHIuZG9jLCB0ci5tYXBwaW5nLnNsaWNlKG1hcEZyb20pLm1hcChwb3MpLCB0eXBlKSkge1xuICAgICAgICAgICAgbGV0IGNvbnZlcnROZXdsaW5lcyA9IG51bGw7XG4gICAgICAgICAgICBpZiAodHlwZS5zY2hlbWEubGluZWJyZWFrUmVwbGFjZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBsZXQgcHJlID0gdHlwZS53aGl0ZXNwYWNlID09IFwicHJlXCIsIHN1cHBvcnRMaW5lYnJlYWsgPSAhIXR5cGUuY29udGVudE1hdGNoLm1hdGNoVHlwZSh0eXBlLnNjaGVtYS5saW5lYnJlYWtSZXBsYWNlbWVudCk7XG4gICAgICAgICAgICAgICAgaWYgKHByZSAmJiAhc3VwcG9ydExpbmVicmVhaylcbiAgICAgICAgICAgICAgICAgICAgY29udmVydE5ld2xpbmVzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIXByZSAmJiBzdXBwb3J0TGluZWJyZWFrKVxuICAgICAgICAgICAgICAgICAgICBjb252ZXJ0TmV3bGluZXMgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRW5zdXJlIGFsbCBtYXJrdXAgdGhhdCBpc24ndCBhbGxvd2VkIGluIHRoZSBuZXcgbm9kZSB0eXBlIGlzIGNsZWFyZWRcbiAgICAgICAgICAgIGlmIChjb252ZXJ0TmV3bGluZXMgPT09IGZhbHNlKVxuICAgICAgICAgICAgICAgIHJlcGxhY2VMaW5lYnJlYWtzKHRyLCBub2RlLCBwb3MsIG1hcEZyb20pO1xuICAgICAgICAgICAgY2xlYXJJbmNvbXBhdGlibGUodHIsIHRyLm1hcHBpbmcuc2xpY2UobWFwRnJvbSkubWFwKHBvcywgMSksIHR5cGUsIHVuZGVmaW5lZCwgY29udmVydE5ld2xpbmVzID09PSBudWxsKTtcbiAgICAgICAgICAgIGxldCBtYXBwaW5nID0gdHIubWFwcGluZy5zbGljZShtYXBGcm9tKTtcbiAgICAgICAgICAgIGxldCBzdGFydE0gPSBtYXBwaW5nLm1hcChwb3MsIDEpLCBlbmRNID0gbWFwcGluZy5tYXAocG9zICsgbm9kZS5ub2RlU2l6ZSwgMSk7XG4gICAgICAgICAgICB0ci5zdGVwKG5ldyBSZXBsYWNlQXJvdW5kU3RlcChzdGFydE0sIGVuZE0sIHN0YXJ0TSArIDEsIGVuZE0gLSAxLCBuZXcgU2xpY2UoRnJhZ21lbnQuZnJvbSh0eXBlLmNyZWF0ZShhdHRyc0hlcmUsIG51bGwsIG5vZGUubWFya3MpKSwgMCwgMCksIDEsIHRydWUpKTtcbiAgICAgICAgICAgIGlmIChjb252ZXJ0TmV3bGluZXMgPT09IHRydWUpXG4gICAgICAgICAgICAgICAgcmVwbGFjZU5ld2xpbmVzKHRyLCBub2RlLCBwb3MsIG1hcEZyb20pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5mdW5jdGlvbiByZXBsYWNlTmV3bGluZXModHIsIG5vZGUsIHBvcywgbWFwRnJvbSkge1xuICAgIG5vZGUuZm9yRWFjaCgoY2hpbGQsIG9mZnNldCkgPT4ge1xuICAgICAgICBpZiAoY2hpbGQuaXNUZXh0KSB7XG4gICAgICAgICAgICBsZXQgbSwgbmV3bGluZSA9IC9cXHI/XFxufFxcci9nO1xuICAgICAgICAgICAgd2hpbGUgKG0gPSBuZXdsaW5lLmV4ZWMoY2hpbGQudGV4dCkpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnQgPSB0ci5tYXBwaW5nLnNsaWNlKG1hcEZyb20pLm1hcChwb3MgKyAxICsgb2Zmc2V0ICsgbS5pbmRleCk7XG4gICAgICAgICAgICAgICAgdHIucmVwbGFjZVdpdGgoc3RhcnQsIHN0YXJ0ICsgMSwgbm9kZS50eXBlLnNjaGVtYS5saW5lYnJlYWtSZXBsYWNlbWVudC5jcmVhdGUoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmZ1bmN0aW9uIHJlcGxhY2VMaW5lYnJlYWtzKHRyLCBub2RlLCBwb3MsIG1hcEZyb20pIHtcbiAgICBub2RlLmZvckVhY2goKGNoaWxkLCBvZmZzZXQpID0+IHtcbiAgICAgICAgaWYgKGNoaWxkLnR5cGUgPT0gY2hpbGQudHlwZS5zY2hlbWEubGluZWJyZWFrUmVwbGFjZW1lbnQpIHtcbiAgICAgICAgICAgIGxldCBzdGFydCA9IHRyLm1hcHBpbmcuc2xpY2UobWFwRnJvbSkubWFwKHBvcyArIDEgKyBvZmZzZXQpO1xuICAgICAgICAgICAgdHIucmVwbGFjZVdpdGgoc3RhcnQsIHN0YXJ0ICsgMSwgbm9kZS50eXBlLnNjaGVtYS50ZXh0KFwiXFxuXCIpKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZnVuY3Rpb24gY2FuQ2hhbmdlVHlwZShkb2MsIHBvcywgdHlwZSkge1xuICAgIGxldCAkcG9zID0gZG9jLnJlc29sdmUocG9zKSwgaW5kZXggPSAkcG9zLmluZGV4KCk7XG4gICAgcmV0dXJuICRwb3MucGFyZW50LmNhblJlcGxhY2VXaXRoKGluZGV4LCBpbmRleCArIDEsIHR5cGUpO1xufVxuLyoqXG5DaGFuZ2UgdGhlIHR5cGUsIGF0dHJpYnV0ZXMsIGFuZC9vciBtYXJrcyBvZiB0aGUgbm9kZSBhdCBgcG9zYC5cbldoZW4gYHR5cGVgIGlzbid0IGdpdmVuLCB0aGUgZXhpc3Rpbmcgbm9kZSB0eXBlIGlzIHByZXNlcnZlZCxcbiovXG5mdW5jdGlvbiBzZXROb2RlTWFya3VwKHRyLCBwb3MsIHR5cGUsIGF0dHJzLCBtYXJrcykge1xuICAgIGxldCBub2RlID0gdHIuZG9jLm5vZGVBdChwb3MpO1xuICAgIGlmICghbm9kZSlcbiAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJObyBub2RlIGF0IGdpdmVuIHBvc2l0aW9uXCIpO1xuICAgIGlmICghdHlwZSlcbiAgICAgICAgdHlwZSA9IG5vZGUudHlwZTtcbiAgICBsZXQgbmV3Tm9kZSA9IHR5cGUuY3JlYXRlKGF0dHJzLCBudWxsLCBtYXJrcyB8fCBub2RlLm1hcmtzKTtcbiAgICBpZiAobm9kZS5pc0xlYWYpXG4gICAgICAgIHJldHVybiB0ci5yZXBsYWNlV2l0aChwb3MsIHBvcyArIG5vZGUubm9kZVNpemUsIG5ld05vZGUpO1xuICAgIGlmICghdHlwZS52YWxpZENvbnRlbnQobm9kZS5jb250ZW50KSlcbiAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbnZhbGlkIGNvbnRlbnQgZm9yIG5vZGUgdHlwZSBcIiArIHR5cGUubmFtZSk7XG4gICAgdHIuc3RlcChuZXcgUmVwbGFjZUFyb3VuZFN0ZXAocG9zLCBwb3MgKyBub2RlLm5vZGVTaXplLCBwb3MgKyAxLCBwb3MgKyBub2RlLm5vZGVTaXplIC0gMSwgbmV3IFNsaWNlKEZyYWdtZW50LmZyb20obmV3Tm9kZSksIDAsIDApLCAxLCB0cnVlKSk7XG59XG4vKipcbkNoZWNrIHdoZXRoZXIgc3BsaXR0aW5nIGF0IHRoZSBnaXZlbiBwb3NpdGlvbiBpcyBhbGxvd2VkLlxuKi9cbmZ1bmN0aW9uIGNhblNwbGl0KGRvYywgcG9zLCBkZXB0aCA9IDEsIHR5cGVzQWZ0ZXIpIHtcbiAgICBsZXQgJHBvcyA9IGRvYy5yZXNvbHZlKHBvcyksIGJhc2UgPSAkcG9zLmRlcHRoIC0gZGVwdGg7XG4gICAgbGV0IGlubmVyVHlwZSA9ICh0eXBlc0FmdGVyICYmIHR5cGVzQWZ0ZXJbdHlwZXNBZnRlci5sZW5ndGggLSAxXSkgfHwgJHBvcy5wYXJlbnQ7XG4gICAgaWYgKGJhc2UgPCAwIHx8ICRwb3MucGFyZW50LnR5cGUuc3BlYy5pc29sYXRpbmcgfHxcbiAgICAgICAgISRwb3MucGFyZW50LmNhblJlcGxhY2UoJHBvcy5pbmRleCgpLCAkcG9zLnBhcmVudC5jaGlsZENvdW50KSB8fFxuICAgICAgICAhaW5uZXJUeXBlLnR5cGUudmFsaWRDb250ZW50KCRwb3MucGFyZW50LmNvbnRlbnQuY3V0QnlJbmRleCgkcG9zLmluZGV4KCksICRwb3MucGFyZW50LmNoaWxkQ291bnQpKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAobGV0IGQgPSAkcG9zLmRlcHRoIC0gMSwgaSA9IGRlcHRoIC0gMjsgZCA+IGJhc2U7IGQtLSwgaS0tKSB7XG4gICAgICAgIGxldCBub2RlID0gJHBvcy5ub2RlKGQpLCBpbmRleCA9ICRwb3MuaW5kZXgoZCk7XG4gICAgICAgIGlmIChub2RlLnR5cGUuc3BlYy5pc29sYXRpbmcpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGxldCByZXN0ID0gbm9kZS5jb250ZW50LmN1dEJ5SW5kZXgoaW5kZXgsIG5vZGUuY2hpbGRDb3VudCk7XG4gICAgICAgIGxldCBvdmVycmlkZUNoaWxkID0gdHlwZXNBZnRlciAmJiB0eXBlc0FmdGVyW2kgKyAxXTtcbiAgICAgICAgaWYgKG92ZXJyaWRlQ2hpbGQpXG4gICAgICAgICAgICByZXN0ID0gcmVzdC5yZXBsYWNlQ2hpbGQoMCwgb3ZlcnJpZGVDaGlsZC50eXBlLmNyZWF0ZShvdmVycmlkZUNoaWxkLmF0dHJzKSk7XG4gICAgICAgIGxldCBhZnRlciA9ICh0eXBlc0FmdGVyICYmIHR5cGVzQWZ0ZXJbaV0pIHx8IG5vZGU7XG4gICAgICAgIGlmICghbm9kZS5jYW5SZXBsYWNlKGluZGV4ICsgMSwgbm9kZS5jaGlsZENvdW50KSB8fCAhYWZ0ZXIudHlwZS52YWxpZENvbnRlbnQocmVzdCkpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGxldCBpbmRleCA9ICRwb3MuaW5kZXhBZnRlcihiYXNlKTtcbiAgICBsZXQgYmFzZVR5cGUgPSB0eXBlc0FmdGVyICYmIHR5cGVzQWZ0ZXJbMF07XG4gICAgcmV0dXJuICRwb3Mubm9kZShiYXNlKS5jYW5SZXBsYWNlV2l0aChpbmRleCwgaW5kZXgsIGJhc2VUeXBlID8gYmFzZVR5cGUudHlwZSA6ICRwb3Mubm9kZShiYXNlICsgMSkudHlwZSk7XG59XG5mdW5jdGlvbiBzcGxpdCh0ciwgcG9zLCBkZXB0aCA9IDEsIHR5cGVzQWZ0ZXIpIHtcbiAgICBsZXQgJHBvcyA9IHRyLmRvYy5yZXNvbHZlKHBvcyksIGJlZm9yZSA9IEZyYWdtZW50LmVtcHR5LCBhZnRlciA9IEZyYWdtZW50LmVtcHR5O1xuICAgIGZvciAobGV0IGQgPSAkcG9zLmRlcHRoLCBlID0gJHBvcy5kZXB0aCAtIGRlcHRoLCBpID0gZGVwdGggLSAxOyBkID4gZTsgZC0tLCBpLS0pIHtcbiAgICAgICAgYmVmb3JlID0gRnJhZ21lbnQuZnJvbSgkcG9zLm5vZGUoZCkuY29weShiZWZvcmUpKTtcbiAgICAgICAgbGV0IHR5cGVBZnRlciA9IHR5cGVzQWZ0ZXIgJiYgdHlwZXNBZnRlcltpXTtcbiAgICAgICAgYWZ0ZXIgPSBGcmFnbWVudC5mcm9tKHR5cGVBZnRlciA/IHR5cGVBZnRlci50eXBlLmNyZWF0ZSh0eXBlQWZ0ZXIuYXR0cnMsIGFmdGVyKSA6ICRwb3Mubm9kZShkKS5jb3B5KGFmdGVyKSk7XG4gICAgfVxuICAgIHRyLnN0ZXAobmV3IFJlcGxhY2VTdGVwKHBvcywgcG9zLCBuZXcgU2xpY2UoYmVmb3JlLmFwcGVuZChhZnRlciksIGRlcHRoLCBkZXB0aCksIHRydWUpKTtcbn1cbi8qKlxuVGVzdCB3aGV0aGVyIHRoZSBibG9ja3MgYmVmb3JlIGFuZCBhZnRlciBhIGdpdmVuIHBvc2l0aW9uIGNhbiBiZVxuam9pbmVkLlxuKi9cbmZ1bmN0aW9uIGNhbkpvaW4oZG9jLCBwb3MpIHtcbiAgICBsZXQgJHBvcyA9IGRvYy5yZXNvbHZlKHBvcyksIGluZGV4ID0gJHBvcy5pbmRleCgpO1xuICAgIHJldHVybiBqb2luYWJsZSgkcG9zLm5vZGVCZWZvcmUsICRwb3Mubm9kZUFmdGVyKSAmJlxuICAgICAgICAkcG9zLnBhcmVudC5jYW5SZXBsYWNlKGluZGV4LCBpbmRleCArIDEpO1xufVxuZnVuY3Rpb24gam9pbmFibGUoYSwgYikge1xuICAgIHJldHVybiAhIShhICYmIGIgJiYgIWEuaXNMZWFmICYmIGEuY2FuQXBwZW5kKGIpKTtcbn1cbi8qKlxuRmluZCBhbiBhbmNlc3RvciBvZiB0aGUgZ2l2ZW4gcG9zaXRpb24gdGhhdCBjYW4gYmUgam9pbmVkIHRvIHRoZVxuYmxvY2sgYmVmb3JlIChvciBhZnRlciBpZiBgZGlyYCBpcyBwb3NpdGl2ZSkuIFJldHVybnMgdGhlIGpvaW5hYmxlXG5wb2ludCwgaWYgYW55LlxuKi9cbmZ1bmN0aW9uIGpvaW5Qb2ludChkb2MsIHBvcywgZGlyID0gLTEpIHtcbiAgICBsZXQgJHBvcyA9IGRvYy5yZXNvbHZlKHBvcyk7XG4gICAgZm9yIChsZXQgZCA9ICRwb3MuZGVwdGg7OyBkLS0pIHtcbiAgICAgICAgbGV0IGJlZm9yZSwgYWZ0ZXIsIGluZGV4ID0gJHBvcy5pbmRleChkKTtcbiAgICAgICAgaWYgKGQgPT0gJHBvcy5kZXB0aCkge1xuICAgICAgICAgICAgYmVmb3JlID0gJHBvcy5ub2RlQmVmb3JlO1xuICAgICAgICAgICAgYWZ0ZXIgPSAkcG9zLm5vZGVBZnRlcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkaXIgPiAwKSB7XG4gICAgICAgICAgICBiZWZvcmUgPSAkcG9zLm5vZGUoZCArIDEpO1xuICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgIGFmdGVyID0gJHBvcy5ub2RlKGQpLm1heWJlQ2hpbGQoaW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYmVmb3JlID0gJHBvcy5ub2RlKGQpLm1heWJlQ2hpbGQoaW5kZXggLSAxKTtcbiAgICAgICAgICAgIGFmdGVyID0gJHBvcy5ub2RlKGQgKyAxKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYmVmb3JlICYmICFiZWZvcmUuaXNUZXh0YmxvY2sgJiYgam9pbmFibGUoYmVmb3JlLCBhZnRlcikgJiZcbiAgICAgICAgICAgICRwb3Mubm9kZShkKS5jYW5SZXBsYWNlKGluZGV4LCBpbmRleCArIDEpKVxuICAgICAgICAgICAgcmV0dXJuIHBvcztcbiAgICAgICAgaWYgKGQgPT0gMClcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBwb3MgPSBkaXIgPCAwID8gJHBvcy5iZWZvcmUoZCkgOiAkcG9zLmFmdGVyKGQpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGpvaW4odHIsIHBvcywgZGVwdGgpIHtcbiAgICBsZXQgc3RlcCA9IG5ldyBSZXBsYWNlU3RlcChwb3MgLSBkZXB0aCwgcG9zICsgZGVwdGgsIFNsaWNlLmVtcHR5LCB0cnVlKTtcbiAgICB0ci5zdGVwKHN0ZXApO1xufVxuLyoqXG5UcnkgdG8gZmluZCBhIHBvaW50IHdoZXJlIGEgbm9kZSBvZiB0aGUgZ2l2ZW4gdHlwZSBjYW4gYmUgaW5zZXJ0ZWRcbm5lYXIgYHBvc2AsIGJ5IHNlYXJjaGluZyB1cCB0aGUgbm9kZSBoaWVyYXJjaHkgd2hlbiBgcG9zYCBpdHNlbGZcbmlzbid0IGEgdmFsaWQgcGxhY2UgYnV0IGlzIGF0IHRoZSBzdGFydCBvciBlbmQgb2YgYSBub2RlLiBSZXR1cm5cbm51bGwgaWYgbm8gcG9zaXRpb24gd2FzIGZvdW5kLlxuKi9cbmZ1bmN0aW9uIGluc2VydFBvaW50KGRvYywgcG9zLCBub2RlVHlwZSkge1xuICAgIGxldCAkcG9zID0gZG9jLnJlc29sdmUocG9zKTtcbiAgICBpZiAoJHBvcy5wYXJlbnQuY2FuUmVwbGFjZVdpdGgoJHBvcy5pbmRleCgpLCAkcG9zLmluZGV4KCksIG5vZGVUeXBlKSlcbiAgICAgICAgcmV0dXJuIHBvcztcbiAgICBpZiAoJHBvcy5wYXJlbnRPZmZzZXQgPT0gMClcbiAgICAgICAgZm9yIChsZXQgZCA9ICRwb3MuZGVwdGggLSAxOyBkID49IDA7IGQtLSkge1xuICAgICAgICAgICAgbGV0IGluZGV4ID0gJHBvcy5pbmRleChkKTtcbiAgICAgICAgICAgIGlmICgkcG9zLm5vZGUoZCkuY2FuUmVwbGFjZVdpdGgoaW5kZXgsIGluZGV4LCBub2RlVHlwZSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuICRwb3MuYmVmb3JlKGQgKyAxKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IDApXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICBpZiAoJHBvcy5wYXJlbnRPZmZzZXQgPT0gJHBvcy5wYXJlbnQuY29udGVudC5zaXplKVxuICAgICAgICBmb3IgKGxldCBkID0gJHBvcy5kZXB0aCAtIDE7IGQgPj0gMDsgZC0tKSB7XG4gICAgICAgICAgICBsZXQgaW5kZXggPSAkcG9zLmluZGV4QWZ0ZXIoZCk7XG4gICAgICAgICAgICBpZiAoJHBvcy5ub2RlKGQpLmNhblJlcGxhY2VXaXRoKGluZGV4LCBpbmRleCwgbm9kZVR5cGUpKVxuICAgICAgICAgICAgICAgIHJldHVybiAkcG9zLmFmdGVyKGQgKyAxKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA8ICRwb3Mubm9kZShkKS5jaGlsZENvdW50KVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG4vKipcbkZpbmRzIGEgcG9zaXRpb24gYXQgb3IgYXJvdW5kIHRoZSBnaXZlbiBwb3NpdGlvbiB3aGVyZSB0aGUgZ2l2ZW5cbnNsaWNlIGNhbiBiZSBpbnNlcnRlZC4gV2lsbCBsb29rIGF0IHBhcmVudCBub2RlcycgbmVhcmVzdCBib3VuZGFyeVxuYW5kIHRyeSB0aGVyZSwgZXZlbiBpZiB0aGUgb3JpZ2luYWwgcG9zaXRpb24gd2Fzbid0IGRpcmVjdGx5IGF0IHRoZVxuc3RhcnQgb3IgZW5kIG9mIHRoYXQgbm9kZS4gUmV0dXJucyBudWxsIHdoZW4gbm8gcG9zaXRpb24gd2FzIGZvdW5kLlxuKi9cbmZ1bmN0aW9uIGRyb3BQb2ludChkb2MsIHBvcywgc2xpY2UpIHtcbiAgICBsZXQgJHBvcyA9IGRvYy5yZXNvbHZlKHBvcyk7XG4gICAgaWYgKCFzbGljZS5jb250ZW50LnNpemUpXG4gICAgICAgIHJldHVybiBwb3M7XG4gICAgbGV0IGNvbnRlbnQgPSBzbGljZS5jb250ZW50O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2xpY2Uub3BlblN0YXJ0OyBpKyspXG4gICAgICAgIGNvbnRlbnQgPSBjb250ZW50LmZpcnN0Q2hpbGQuY29udGVudDtcbiAgICBmb3IgKGxldCBwYXNzID0gMTsgcGFzcyA8PSAoc2xpY2Uub3BlblN0YXJ0ID09IDAgJiYgc2xpY2Uuc2l6ZSA/IDIgOiAxKTsgcGFzcysrKSB7XG4gICAgICAgIGZvciAobGV0IGQgPSAkcG9zLmRlcHRoOyBkID49IDA7IGQtLSkge1xuICAgICAgICAgICAgbGV0IGJpYXMgPSBkID09ICRwb3MuZGVwdGggPyAwIDogJHBvcy5wb3MgPD0gKCRwb3Muc3RhcnQoZCArIDEpICsgJHBvcy5lbmQoZCArIDEpKSAvIDIgPyAtMSA6IDE7XG4gICAgICAgICAgICBsZXQgaW5zZXJ0UG9zID0gJHBvcy5pbmRleChkKSArIChiaWFzID4gMCA/IDEgOiAwKTtcbiAgICAgICAgICAgIGxldCBwYXJlbnQgPSAkcG9zLm5vZGUoZCksIGZpdHMgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChwYXNzID09IDEpIHtcbiAgICAgICAgICAgICAgICBmaXRzID0gcGFyZW50LmNhblJlcGxhY2UoaW5zZXJ0UG9zLCBpbnNlcnRQb3MsIGNvbnRlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHdyYXBwaW5nID0gcGFyZW50LmNvbnRlbnRNYXRjaEF0KGluc2VydFBvcykuZmluZFdyYXBwaW5nKGNvbnRlbnQuZmlyc3RDaGlsZC50eXBlKTtcbiAgICAgICAgICAgICAgICBmaXRzID0gd3JhcHBpbmcgJiYgcGFyZW50LmNhblJlcGxhY2VXaXRoKGluc2VydFBvcywgaW5zZXJ0UG9zLCB3cmFwcGluZ1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZml0cylcbiAgICAgICAgICAgICAgICByZXR1cm4gYmlhcyA9PSAwID8gJHBvcy5wb3MgOiBiaWFzIDwgMCA/ICRwb3MuYmVmb3JlKGQgKyAxKSA6ICRwb3MuYWZ0ZXIoZCArIDEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG4vKipcblx1MjAxOEZpdFx1MjAxOSBhIHNsaWNlIGludG8gYSBnaXZlbiBwb3NpdGlvbiBpbiB0aGUgZG9jdW1lbnQsIHByb2R1Y2luZyBhXG5bc3RlcF0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI3RyYW5zZm9ybS5TdGVwKSB0aGF0IGluc2VydHMgaXQuIFdpbGwgcmV0dXJuIG51bGwgaWZcbnRoZXJlJ3Mgbm8gbWVhbmluZ2Z1bCB3YXkgdG8gaW5zZXJ0IHRoZSBzbGljZSBoZXJlLCBvciBpbnNlcnRpbmcgaXRcbndvdWxkIGJlIGEgbm8tb3AgKGFuIGVtcHR5IHNsaWNlIG92ZXIgYW4gZW1wdHkgcmFuZ2UpLlxuKi9cbmZ1bmN0aW9uIHJlcGxhY2VTdGVwKGRvYywgZnJvbSwgdG8gPSBmcm9tLCBzbGljZSA9IFNsaWNlLmVtcHR5KSB7XG4gICAgaWYgKGZyb20gPT0gdG8gJiYgIXNsaWNlLnNpemUpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIGxldCAkZnJvbSA9IGRvYy5yZXNvbHZlKGZyb20pLCAkdG8gPSBkb2MucmVzb2x2ZSh0byk7XG4gICAgLy8gT3B0aW1pemF0aW9uIC0tIGF2b2lkIHdvcmsgaWYgaXQncyBvYnZpb3VzIHRoYXQgaXQncyBub3QgbmVlZGVkLlxuICAgIGlmIChmaXRzVHJpdmlhbGx5KCRmcm9tLCAkdG8sIHNsaWNlKSlcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBsYWNlU3RlcChmcm9tLCB0bywgc2xpY2UpO1xuICAgIHJldHVybiBuZXcgRml0dGVyKCRmcm9tLCAkdG8sIHNsaWNlKS5maXQoKTtcbn1cbmZ1bmN0aW9uIGZpdHNUcml2aWFsbHkoJGZyb20sICR0bywgc2xpY2UpIHtcbiAgICByZXR1cm4gIXNsaWNlLm9wZW5TdGFydCAmJiAhc2xpY2Uub3BlbkVuZCAmJiAkZnJvbS5zdGFydCgpID09ICR0by5zdGFydCgpICYmXG4gICAgICAgICRmcm9tLnBhcmVudC5jYW5SZXBsYWNlKCRmcm9tLmluZGV4KCksICR0by5pbmRleCgpLCBzbGljZS5jb250ZW50KTtcbn1cbi8vIEFsZ29yaXRobSBmb3IgJ3BsYWNpbmcnIHRoZSBlbGVtZW50cyBvZiBhIHNsaWNlIGludG8gYSBnYXA6XG4vL1xuLy8gV2UgY29uc2lkZXIgdGhlIGNvbnRlbnQgb2YgZWFjaCBub2RlIHRoYXQgaXMgb3BlbiB0byB0aGUgbGVmdCB0byBiZVxuLy8gaW5kZXBlbmRlbnRseSBwbGFjZWFibGUuIEkuZS4gaW4gPHAoXCJmb29cIiksIHAoXCJiYXJcIik+LCB3aGVuIHRoZVxuLy8gcGFyYWdyYXBoIG9uIHRoZSBsZWZ0IGlzIG9wZW4sIFwiZm9vXCIgY2FuIGJlIHBsYWNlZCAoc29tZXdoZXJlIG9uXG4vLyB0aGUgbGVmdCBzaWRlIG9mIHRoZSByZXBsYWNlbWVudCBnYXApIGluZGVwZW5kZW50bHkgZnJvbSBwKFwiYmFyXCIpLlxuLy9cbi8vIFRoaXMgY2xhc3MgdHJhY2tzIHRoZSBzdGF0ZSBvZiB0aGUgcGxhY2VtZW50IHByb2dyZXNzIGluIHRoZVxuLy8gZm9sbG93aW5nIHByb3BlcnRpZXM6XG4vL1xuLy8gIC0gYGZyb250aWVyYCBob2xkcyBhIHN0YWNrIG9mIGB7dHlwZSwgbWF0Y2h9YCBvYmplY3RzIHRoYXRcbi8vICAgIHJlcHJlc2VudCB0aGUgb3BlbiBzaWRlIG9mIHRoZSByZXBsYWNlbWVudC4gSXQgc3RhcnRzIGF0XG4vLyAgICBgJGZyb21gLCB0aGVuIG1vdmVzIGZvcndhcmQgYXMgY29udGVudCBpcyBwbGFjZWQsIGFuZCBpcyBmaW5hbGx5XG4vLyAgICByZWNvbmNpbGVkIHdpdGggYCR0b2AuXG4vL1xuLy8gIC0gYHVucGxhY2VkYCBpcyBhIHNsaWNlIHRoYXQgcmVwcmVzZW50cyB0aGUgY29udGVudCB0aGF0IGhhc24ndFxuLy8gICAgYmVlbiBwbGFjZWQgeWV0LlxuLy9cbi8vICAtIGBwbGFjZWRgIGlzIGEgZnJhZ21lbnQgb2YgcGxhY2VkIGNvbnRlbnQuIEl0cyBvcGVuLXN0YXJ0IHZhbHVlXG4vLyAgICBpcyBpbXBsaWNpdCBpbiBgJGZyb21gLCBhbmQgaXRzIG9wZW4tZW5kIHZhbHVlIGluIGBmcm9udGllcmAuXG5jbGFzcyBGaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yKCRmcm9tLCAkdG8sIHVucGxhY2VkKSB7XG4gICAgICAgIHRoaXMuJGZyb20gPSAkZnJvbTtcbiAgICAgICAgdGhpcy4kdG8gPSAkdG87XG4gICAgICAgIHRoaXMudW5wbGFjZWQgPSB1bnBsYWNlZDtcbiAgICAgICAgdGhpcy5mcm9udGllciA9IFtdO1xuICAgICAgICB0aGlzLnBsYWNlZCA9IEZyYWdtZW50LmVtcHR5O1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8PSAkZnJvbS5kZXB0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgbm9kZSA9ICRmcm9tLm5vZGUoaSk7XG4gICAgICAgICAgICB0aGlzLmZyb250aWVyLnB1c2goe1xuICAgICAgICAgICAgICAgIHR5cGU6IG5vZGUudHlwZSxcbiAgICAgICAgICAgICAgICBtYXRjaDogbm9kZS5jb250ZW50TWF0Y2hBdCgkZnJvbS5pbmRleEFmdGVyKGkpKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9ICRmcm9tLmRlcHRoOyBpID4gMDsgaS0tKVxuICAgICAgICAgICAgdGhpcy5wbGFjZWQgPSBGcmFnbWVudC5mcm9tKCRmcm9tLm5vZGUoaSkuY29weSh0aGlzLnBsYWNlZCkpO1xuICAgIH1cbiAgICBnZXQgZGVwdGgoKSB7IHJldHVybiB0aGlzLmZyb250aWVyLmxlbmd0aCAtIDE7IH1cbiAgICBmaXQoKSB7XG4gICAgICAgIC8vIEFzIGxvbmcgYXMgdGhlcmUncyB1bnBsYWNlZCBjb250ZW50LCB0cnkgdG8gcGxhY2Ugc29tZSBvZiBpdC5cbiAgICAgICAgLy8gSWYgdGhhdCBmYWlscywgZWl0aGVyIGluY3JlYXNlIHRoZSBvcGVuIHNjb3JlIG9mIHRoZSB1bnBsYWNlZFxuICAgICAgICAvLyBzbGljZSwgb3IgZHJvcCBub2RlcyBmcm9tIGl0LCBhbmQgdGhlbiB0cnkgYWdhaW4uXG4gICAgICAgIHdoaWxlICh0aGlzLnVucGxhY2VkLnNpemUpIHtcbiAgICAgICAgICAgIGxldCBmaXQgPSB0aGlzLmZpbmRGaXR0YWJsZSgpO1xuICAgICAgICAgICAgaWYgKGZpdClcbiAgICAgICAgICAgICAgICB0aGlzLnBsYWNlTm9kZXMoZml0KTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW5Nb3JlKCkgfHwgdGhpcy5kcm9wTm9kZSgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdoZW4gdGhlcmUncyBpbmxpbmUgY29udGVudCBkaXJlY3RseSBhZnRlciB0aGUgZnJvbnRpZXIgX2FuZF9cbiAgICAgICAgLy8gZGlyZWN0bHkgYWZ0ZXIgYHRoaXMuJHRvYCwgd2UgbXVzdCBnZW5lcmF0ZSBhIGBSZXBsYWNlQXJvdW5kYFxuICAgICAgICAvLyBzdGVwIHRoYXQgcHVsbHMgdGhhdCBjb250ZW50IGludG8gdGhlIG5vZGUgYWZ0ZXIgdGhlIGZyb250aWVyLlxuICAgICAgICAvLyBUaGF0IG1lYW5zIHRoZSBmaXR0aW5nIG11c3QgYmUgZG9uZSB0byB0aGUgZW5kIG9mIHRoZSB0ZXh0YmxvY2tcbiAgICAgICAgLy8gbm9kZSBhZnRlciBgdGhpcy4kdG9gLCBub3QgYHRoaXMuJHRvYCBpdHNlbGYuXG4gICAgICAgIGxldCBtb3ZlSW5saW5lID0gdGhpcy5tdXN0TW92ZUlubGluZSgpLCBwbGFjZWRTaXplID0gdGhpcy5wbGFjZWQuc2l6ZSAtIHRoaXMuZGVwdGggLSB0aGlzLiRmcm9tLmRlcHRoO1xuICAgICAgICBsZXQgJGZyb20gPSB0aGlzLiRmcm9tLCAkdG8gPSB0aGlzLmNsb3NlKG1vdmVJbmxpbmUgPCAwID8gdGhpcy4kdG8gOiAkZnJvbS5kb2MucmVzb2x2ZShtb3ZlSW5saW5lKSk7XG4gICAgICAgIGlmICghJHRvKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIC8vIElmIGNsb3NpbmcgdG8gYCR0b2Agc3VjY2VlZGVkLCBjcmVhdGUgYSBzdGVwXG4gICAgICAgIGxldCBjb250ZW50ID0gdGhpcy5wbGFjZWQsIG9wZW5TdGFydCA9ICRmcm9tLmRlcHRoLCBvcGVuRW5kID0gJHRvLmRlcHRoO1xuICAgICAgICB3aGlsZSAob3BlblN0YXJ0ICYmIG9wZW5FbmQgJiYgY29udGVudC5jaGlsZENvdW50ID09IDEpIHsgLy8gTm9ybWFsaXplIGJ5IGRyb3BwaW5nIG9wZW4gcGFyZW50IG5vZGVzXG4gICAgICAgICAgICBjb250ZW50ID0gY29udGVudC5maXJzdENoaWxkLmNvbnRlbnQ7XG4gICAgICAgICAgICBvcGVuU3RhcnQtLTtcbiAgICAgICAgICAgIG9wZW5FbmQtLTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc2xpY2UgPSBuZXcgU2xpY2UoY29udGVudCwgb3BlblN0YXJ0LCBvcGVuRW5kKTtcbiAgICAgICAgaWYgKG1vdmVJbmxpbmUgPiAtMSlcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVwbGFjZUFyb3VuZFN0ZXAoJGZyb20ucG9zLCBtb3ZlSW5saW5lLCB0aGlzLiR0by5wb3MsIHRoaXMuJHRvLmVuZCgpLCBzbGljZSwgcGxhY2VkU2l6ZSk7XG4gICAgICAgIGlmIChzbGljZS5zaXplIHx8ICRmcm9tLnBvcyAhPSB0aGlzLiR0by5wb3MpIC8vIERvbid0IGdlbmVyYXRlIG5vLW9wIHN0ZXBzXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlcGxhY2VTdGVwKCRmcm9tLnBvcywgJHRvLnBvcywgc2xpY2UpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgLy8gRmluZCBhIHBvc2l0aW9uIG9uIHRoZSBzdGFydCBzcGluZSBvZiBgdGhpcy51bnBsYWNlZGAgdGhhdCBoYXNcbiAgICAvLyBjb250ZW50IHRoYXQgY2FuIGJlIG1vdmVkIHNvbWV3aGVyZSBvbiB0aGUgZnJvbnRpZXIuIFJldHVybnMgdHdvXG4gICAgLy8gZGVwdGhzLCBvbmUgZm9yIHRoZSBzbGljZSBhbmQgb25lIGZvciB0aGUgZnJvbnRpZXIuXG4gICAgZmluZEZpdHRhYmxlKCkge1xuICAgICAgICBsZXQgc3RhcnREZXB0aCA9IHRoaXMudW5wbGFjZWQub3BlblN0YXJ0O1xuICAgICAgICBmb3IgKGxldCBjdXIgPSB0aGlzLnVucGxhY2VkLmNvbnRlbnQsIGQgPSAwLCBvcGVuRW5kID0gdGhpcy51bnBsYWNlZC5vcGVuRW5kOyBkIDwgc3RhcnREZXB0aDsgZCsrKSB7XG4gICAgICAgICAgICBsZXQgbm9kZSA9IGN1ci5maXJzdENoaWxkO1xuICAgICAgICAgICAgaWYgKGN1ci5jaGlsZENvdW50ID4gMSlcbiAgICAgICAgICAgICAgICBvcGVuRW5kID0gMDtcbiAgICAgICAgICAgIGlmIChub2RlLnR5cGUuc3BlYy5pc29sYXRpbmcgJiYgb3BlbkVuZCA8PSBkKSB7XG4gICAgICAgICAgICAgICAgc3RhcnREZXB0aCA9IGQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXIgPSBub2RlLmNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gT25seSB0cnkgd3JhcHBpbmcgbm9kZXMgKHBhc3MgMikgYWZ0ZXIgZmluZGluZyBhIHBsYWNlIHdpdGhvdXRcbiAgICAgICAgLy8gd3JhcHBpbmcgZmFpbGVkLlxuICAgICAgICBmb3IgKGxldCBwYXNzID0gMTsgcGFzcyA8PSAyOyBwYXNzKyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IHNsaWNlRGVwdGggPSBwYXNzID09IDEgPyBzdGFydERlcHRoIDogdGhpcy51bnBsYWNlZC5vcGVuU3RhcnQ7IHNsaWNlRGVwdGggPj0gMDsgc2xpY2VEZXB0aC0tKSB7XG4gICAgICAgICAgICAgICAgbGV0IGZyYWdtZW50LCBwYXJlbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmIChzbGljZURlcHRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IGNvbnRlbnRBdCh0aGlzLnVucGxhY2VkLmNvbnRlbnQsIHNsaWNlRGVwdGggLSAxKS5maXJzdENoaWxkO1xuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCA9IHBhcmVudC5jb250ZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgPSB0aGlzLnVucGxhY2VkLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBmaXJzdCA9IGZyYWdtZW50LmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZnJvbnRpZXJEZXB0aCA9IHRoaXMuZGVwdGg7IGZyb250aWVyRGVwdGggPj0gMDsgZnJvbnRpZXJEZXB0aC0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB7IHR5cGUsIG1hdGNoIH0gPSB0aGlzLmZyb250aWVyW2Zyb250aWVyRGVwdGhdLCB3cmFwLCBpbmplY3QgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAvLyBJbiBwYXNzIDEsIGlmIHRoZSBuZXh0IG5vZGUgbWF0Y2hlcywgb3IgdGhlcmUgaXMgbm8gbmV4dFxuICAgICAgICAgICAgICAgICAgICAvLyBub2RlIGJ1dCB0aGUgcGFyZW50cyBsb29rIGNvbXBhdGlibGUsIHdlJ3ZlIGZvdW5kIGFcbiAgICAgICAgICAgICAgICAgICAgLy8gcGxhY2UuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXNzID09IDEgJiYgKGZpcnN0ID8gbWF0Y2gubWF0Y2hUeXBlKGZpcnN0LnR5cGUpIHx8IChpbmplY3QgPSBtYXRjaC5maWxsQmVmb3JlKEZyYWdtZW50LmZyb20oZmlyc3QpLCBmYWxzZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHBhcmVudCAmJiB0eXBlLmNvbXBhdGlibGVDb250ZW50KHBhcmVudC50eXBlKSkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzbGljZURlcHRoLCBmcm9udGllckRlcHRoLCBwYXJlbnQsIGluamVjdCB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBJbiBwYXNzIDIsIGxvb2sgZm9yIGEgc2V0IG9mIHdyYXBwaW5nIG5vZGVzIHRoYXQgbWFrZVxuICAgICAgICAgICAgICAgICAgICAvLyBgZmlyc3RgIGZpdCBoZXJlLlxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChwYXNzID09IDIgJiYgZmlyc3QgJiYgKHdyYXAgPSBtYXRjaC5maW5kV3JhcHBpbmcoZmlyc3QudHlwZSkpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgc2xpY2VEZXB0aCwgZnJvbnRpZXJEZXB0aCwgcGFyZW50LCB3cmFwIH07XG4gICAgICAgICAgICAgICAgICAgIC8vIERvbid0IGNvbnRpbnVlIGxvb2tpbmcgZnVydGhlciB1cCBpZiB0aGUgcGFyZW50IG5vZGVcbiAgICAgICAgICAgICAgICAgICAgLy8gd291bGQgZml0IGhlcmUuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnQgJiYgbWF0Y2gubWF0Y2hUeXBlKHBhcmVudC50eXBlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBvcGVuTW9yZSgpIHtcbiAgICAgICAgbGV0IHsgY29udGVudCwgb3BlblN0YXJ0LCBvcGVuRW5kIH0gPSB0aGlzLnVucGxhY2VkO1xuICAgICAgICBsZXQgaW5uZXIgPSBjb250ZW50QXQoY29udGVudCwgb3BlblN0YXJ0KTtcbiAgICAgICAgaWYgKCFpbm5lci5jaGlsZENvdW50IHx8IGlubmVyLmZpcnN0Q2hpbGQuaXNMZWFmKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB0aGlzLnVucGxhY2VkID0gbmV3IFNsaWNlKGNvbnRlbnQsIG9wZW5TdGFydCArIDEsIE1hdGgubWF4KG9wZW5FbmQsIGlubmVyLnNpemUgKyBvcGVuU3RhcnQgPj0gY29udGVudC5zaXplIC0gb3BlbkVuZCA/IG9wZW5TdGFydCArIDEgOiAwKSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBkcm9wTm9kZSgpIHtcbiAgICAgICAgbGV0IHsgY29udGVudCwgb3BlblN0YXJ0LCBvcGVuRW5kIH0gPSB0aGlzLnVucGxhY2VkO1xuICAgICAgICBsZXQgaW5uZXIgPSBjb250ZW50QXQoY29udGVudCwgb3BlblN0YXJ0KTtcbiAgICAgICAgaWYgKGlubmVyLmNoaWxkQ291bnQgPD0gMSAmJiBvcGVuU3RhcnQgPiAwKSB7XG4gICAgICAgICAgICBsZXQgb3BlbkF0RW5kID0gY29udGVudC5zaXplIC0gb3BlblN0YXJ0IDw9IG9wZW5TdGFydCArIGlubmVyLnNpemU7XG4gICAgICAgICAgICB0aGlzLnVucGxhY2VkID0gbmV3IFNsaWNlKGRyb3BGcm9tRnJhZ21lbnQoY29udGVudCwgb3BlblN0YXJ0IC0gMSwgMSksIG9wZW5TdGFydCAtIDEsIG9wZW5BdEVuZCA/IG9wZW5TdGFydCAtIDEgOiBvcGVuRW5kKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudW5wbGFjZWQgPSBuZXcgU2xpY2UoZHJvcEZyb21GcmFnbWVudChjb250ZW50LCBvcGVuU3RhcnQsIDEpLCBvcGVuU3RhcnQsIG9wZW5FbmQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIE1vdmUgY29udGVudCBmcm9tIHRoZSB1bnBsYWNlZCBzbGljZSBhdCBgc2xpY2VEZXB0aGAgdG8gdGhlXG4gICAgLy8gZnJvbnRpZXIgbm9kZSBhdCBgZnJvbnRpZXJEZXB0aGAuIENsb3NlIHRoYXQgZnJvbnRpZXIgbm9kZSB3aGVuXG4gICAgLy8gYXBwbGljYWJsZS5cbiAgICBwbGFjZU5vZGVzKHsgc2xpY2VEZXB0aCwgZnJvbnRpZXJEZXB0aCwgcGFyZW50LCBpbmplY3QsIHdyYXAgfSkge1xuICAgICAgICB3aGlsZSAodGhpcy5kZXB0aCA+IGZyb250aWVyRGVwdGgpXG4gICAgICAgICAgICB0aGlzLmNsb3NlRnJvbnRpZXJOb2RlKCk7XG4gICAgICAgIGlmICh3cmFwKVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3cmFwLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgIHRoaXMub3BlbkZyb250aWVyTm9kZSh3cmFwW2ldKTtcbiAgICAgICAgbGV0IHNsaWNlID0gdGhpcy51bnBsYWNlZCwgZnJhZ21lbnQgPSBwYXJlbnQgPyBwYXJlbnQuY29udGVudCA6IHNsaWNlLmNvbnRlbnQ7XG4gICAgICAgIGxldCBvcGVuU3RhcnQgPSBzbGljZS5vcGVuU3RhcnQgLSBzbGljZURlcHRoO1xuICAgICAgICBsZXQgdGFrZW4gPSAwLCBhZGQgPSBbXTtcbiAgICAgICAgbGV0IHsgbWF0Y2gsIHR5cGUgfSA9IHRoaXMuZnJvbnRpZXJbZnJvbnRpZXJEZXB0aF07XG4gICAgICAgIGlmIChpbmplY3QpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5qZWN0LmNoaWxkQ291bnQ7IGkrKylcbiAgICAgICAgICAgICAgICBhZGQucHVzaChpbmplY3QuY2hpbGQoaSkpO1xuICAgICAgICAgICAgbWF0Y2ggPSBtYXRjaC5tYXRjaEZyYWdtZW50KGluamVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ29tcHV0ZXMgdGhlIGFtb3VudCBvZiAoZW5kKSBvcGVuIG5vZGVzIGF0IHRoZSBlbmQgb2YgdGhlXG4gICAgICAgIC8vIGZyYWdtZW50LiBXaGVuIDAsIHRoZSBwYXJlbnQgaXMgb3BlbiwgYnV0IG5vIG1vcmUuIFdoZW5cbiAgICAgICAgLy8gbmVnYXRpdmUsIG5vdGhpbmcgaXMgb3Blbi5cbiAgICAgICAgbGV0IG9wZW5FbmRDb3VudCA9IChmcmFnbWVudC5zaXplICsgc2xpY2VEZXB0aCkgLSAoc2xpY2UuY29udGVudC5zaXplIC0gc2xpY2Uub3BlbkVuZCk7XG4gICAgICAgIC8vIFNjYW4gb3ZlciB0aGUgZnJhZ21lbnQsIGZpdHRpbmcgYXMgbWFueSBjaGlsZCBub2RlcyBhc1xuICAgICAgICAvLyBwb3NzaWJsZS5cbiAgICAgICAgd2hpbGUgKHRha2VuIDwgZnJhZ21lbnQuY2hpbGRDb3VudCkge1xuICAgICAgICAgICAgbGV0IG5leHQgPSBmcmFnbWVudC5jaGlsZCh0YWtlbiksIG1hdGNoZXMgPSBtYXRjaC5tYXRjaFR5cGUobmV4dC50eXBlKTtcbiAgICAgICAgICAgIGlmICghbWF0Y2hlcylcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIHRha2VuKys7XG4gICAgICAgICAgICBpZiAodGFrZW4gPiAxIHx8IG9wZW5TdGFydCA9PSAwIHx8IG5leHQuY29udGVudC5zaXplKSB7IC8vIERyb3AgZW1wdHkgb3BlbiBub2Rlc1xuICAgICAgICAgICAgICAgIG1hdGNoID0gbWF0Y2hlcztcbiAgICAgICAgICAgICAgICBhZGQucHVzaChjbG9zZU5vZGVTdGFydChuZXh0Lm1hcmsodHlwZS5hbGxvd2VkTWFya3MobmV4dC5tYXJrcykpLCB0YWtlbiA9PSAxID8gb3BlblN0YXJ0IDogMCwgdGFrZW4gPT0gZnJhZ21lbnQuY2hpbGRDb3VudCA/IG9wZW5FbmRDb3VudCA6IC0xKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRvRW5kID0gdGFrZW4gPT0gZnJhZ21lbnQuY2hpbGRDb3VudDtcbiAgICAgICAgaWYgKCF0b0VuZClcbiAgICAgICAgICAgIG9wZW5FbmRDb3VudCA9IC0xO1xuICAgICAgICB0aGlzLnBsYWNlZCA9IGFkZFRvRnJhZ21lbnQodGhpcy5wbGFjZWQsIGZyb250aWVyRGVwdGgsIEZyYWdtZW50LmZyb20oYWRkKSk7XG4gICAgICAgIHRoaXMuZnJvbnRpZXJbZnJvbnRpZXJEZXB0aF0ubWF0Y2ggPSBtYXRjaDtcbiAgICAgICAgLy8gSWYgdGhlIHBhcmVudCB0eXBlcyBtYXRjaCwgYW5kIHRoZSBlbnRpcmUgbm9kZSB3YXMgbW92ZWQsIGFuZFxuICAgICAgICAvLyBpdCdzIG5vdCBvcGVuLCBjbG9zZSB0aGlzIGZyb250aWVyIG5vZGUgcmlnaHQgYXdheS5cbiAgICAgICAgaWYgKHRvRW5kICYmIG9wZW5FbmRDb3VudCA8IDAgJiYgcGFyZW50ICYmIHBhcmVudC50eXBlID09IHRoaXMuZnJvbnRpZXJbdGhpcy5kZXB0aF0udHlwZSAmJiB0aGlzLmZyb250aWVyLmxlbmd0aCA+IDEpXG4gICAgICAgICAgICB0aGlzLmNsb3NlRnJvbnRpZXJOb2RlKCk7XG4gICAgICAgIC8vIEFkZCBuZXcgZnJvbnRpZXIgbm9kZXMgZm9yIGFueSBvcGVuIG5vZGVzIGF0IHRoZSBlbmQuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBjdXIgPSBmcmFnbWVudDsgaSA8IG9wZW5FbmRDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgbm9kZSA9IGN1ci5sYXN0Q2hpbGQ7XG4gICAgICAgICAgICB0aGlzLmZyb250aWVyLnB1c2goeyB0eXBlOiBub2RlLnR5cGUsIG1hdGNoOiBub2RlLmNvbnRlbnRNYXRjaEF0KG5vZGUuY2hpbGRDb3VudCkgfSk7XG4gICAgICAgICAgICBjdXIgPSBub2RlLmNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVXBkYXRlIGB0aGlzLnVucGxhY2VkYC4gRHJvcCB0aGUgZW50aXJlIG5vZGUgZnJvbSB3aGljaCB3ZVxuICAgICAgICAvLyBwbGFjZWQgaXQgd2UgZ290IHRvIGl0cyBlbmQsIG90aGVyd2lzZSBqdXN0IGRyb3AgdGhlIHBsYWNlZFxuICAgICAgICAvLyBub2Rlcy5cbiAgICAgICAgdGhpcy51bnBsYWNlZCA9ICF0b0VuZCA/IG5ldyBTbGljZShkcm9wRnJvbUZyYWdtZW50KHNsaWNlLmNvbnRlbnQsIHNsaWNlRGVwdGgsIHRha2VuKSwgc2xpY2Uub3BlblN0YXJ0LCBzbGljZS5vcGVuRW5kKVxuICAgICAgICAgICAgOiBzbGljZURlcHRoID09IDAgPyBTbGljZS5lbXB0eVxuICAgICAgICAgICAgICAgIDogbmV3IFNsaWNlKGRyb3BGcm9tRnJhZ21lbnQoc2xpY2UuY29udGVudCwgc2xpY2VEZXB0aCAtIDEsIDEpLCBzbGljZURlcHRoIC0gMSwgb3BlbkVuZENvdW50IDwgMCA/IHNsaWNlLm9wZW5FbmQgOiBzbGljZURlcHRoIC0gMSk7XG4gICAgfVxuICAgIG11c3RNb3ZlSW5saW5lKCkge1xuICAgICAgICBpZiAoIXRoaXMuJHRvLnBhcmVudC5pc1RleHRibG9jaylcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgbGV0IHRvcCA9IHRoaXMuZnJvbnRpZXJbdGhpcy5kZXB0aF0sIGxldmVsO1xuICAgICAgICBpZiAoIXRvcC50eXBlLmlzVGV4dGJsb2NrIHx8ICFjb250ZW50QWZ0ZXJGaXRzKHRoaXMuJHRvLCB0aGlzLiR0by5kZXB0aCwgdG9wLnR5cGUsIHRvcC5tYXRjaCwgZmFsc2UpIHx8XG4gICAgICAgICAgICAodGhpcy4kdG8uZGVwdGggPT0gdGhpcy5kZXB0aCAmJiAobGV2ZWwgPSB0aGlzLmZpbmRDbG9zZUxldmVsKHRoaXMuJHRvKSkgJiYgbGV2ZWwuZGVwdGggPT0gdGhpcy5kZXB0aCkpXG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIGxldCB7IGRlcHRoIH0gPSB0aGlzLiR0bywgYWZ0ZXIgPSB0aGlzLiR0by5hZnRlcihkZXB0aCk7XG4gICAgICAgIHdoaWxlIChkZXB0aCA+IDEgJiYgYWZ0ZXIgPT0gdGhpcy4kdG8uZW5kKC0tZGVwdGgpKVxuICAgICAgICAgICAgKythZnRlcjtcbiAgICAgICAgcmV0dXJuIGFmdGVyO1xuICAgIH1cbiAgICBmaW5kQ2xvc2VMZXZlbCgkdG8pIHtcbiAgICAgICAgc2NhbjogZm9yIChsZXQgaSA9IE1hdGgubWluKHRoaXMuZGVwdGgsICR0by5kZXB0aCk7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBsZXQgeyBtYXRjaCwgdHlwZSB9ID0gdGhpcy5mcm9udGllcltpXTtcbiAgICAgICAgICAgIGxldCBkcm9wSW5uZXIgPSBpIDwgJHRvLmRlcHRoICYmICR0by5lbmQoaSArIDEpID09ICR0by5wb3MgKyAoJHRvLmRlcHRoIC0gKGkgKyAxKSk7XG4gICAgICAgICAgICBsZXQgZml0ID0gY29udGVudEFmdGVyRml0cygkdG8sIGksIHR5cGUsIG1hdGNoLCBkcm9wSW5uZXIpO1xuICAgICAgICAgICAgaWYgKCFmaXQpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICBmb3IgKGxldCBkID0gaSAtIDE7IGQgPj0gMDsgZC0tKSB7XG4gICAgICAgICAgICAgICAgbGV0IHsgbWF0Y2gsIHR5cGUgfSA9IHRoaXMuZnJvbnRpZXJbZF07XG4gICAgICAgICAgICAgICAgbGV0IG1hdGNoZXMgPSBjb250ZW50QWZ0ZXJGaXRzKCR0bywgZCwgdHlwZSwgbWF0Y2gsIHRydWUpO1xuICAgICAgICAgICAgICAgIGlmICghbWF0Y2hlcyB8fCBtYXRjaGVzLmNoaWxkQ291bnQpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIHNjYW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyBkZXB0aDogaSwgZml0LCBtb3ZlOiBkcm9wSW5uZXIgPyAkdG8uZG9jLnJlc29sdmUoJHRvLmFmdGVyKGkgKyAxKSkgOiAkdG8gfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjbG9zZSgkdG8pIHtcbiAgICAgICAgbGV0IGNsb3NlID0gdGhpcy5maW5kQ2xvc2VMZXZlbCgkdG8pO1xuICAgICAgICBpZiAoIWNsb3NlKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIHdoaWxlICh0aGlzLmRlcHRoID4gY2xvc2UuZGVwdGgpXG4gICAgICAgICAgICB0aGlzLmNsb3NlRnJvbnRpZXJOb2RlKCk7XG4gICAgICAgIGlmIChjbG9zZS5maXQuY2hpbGRDb3VudClcbiAgICAgICAgICAgIHRoaXMucGxhY2VkID0gYWRkVG9GcmFnbWVudCh0aGlzLnBsYWNlZCwgY2xvc2UuZGVwdGgsIGNsb3NlLmZpdCk7XG4gICAgICAgICR0byA9IGNsb3NlLm1vdmU7XG4gICAgICAgIGZvciAobGV0IGQgPSBjbG9zZS5kZXB0aCArIDE7IGQgPD0gJHRvLmRlcHRoOyBkKyspIHtcbiAgICAgICAgICAgIGxldCBub2RlID0gJHRvLm5vZGUoZCksIGFkZCA9IG5vZGUudHlwZS5jb250ZW50TWF0Y2guZmlsbEJlZm9yZShub2RlLmNvbnRlbnQsIHRydWUsICR0by5pbmRleChkKSk7XG4gICAgICAgICAgICB0aGlzLm9wZW5Gcm9udGllck5vZGUobm9kZS50eXBlLCBub2RlLmF0dHJzLCBhZGQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkdG87XG4gICAgfVxuICAgIG9wZW5Gcm9udGllck5vZGUodHlwZSwgYXR0cnMgPSBudWxsLCBjb250ZW50KSB7XG4gICAgICAgIGxldCB0b3AgPSB0aGlzLmZyb250aWVyW3RoaXMuZGVwdGhdO1xuICAgICAgICB0b3AubWF0Y2ggPSB0b3AubWF0Y2gubWF0Y2hUeXBlKHR5cGUpO1xuICAgICAgICB0aGlzLnBsYWNlZCA9IGFkZFRvRnJhZ21lbnQodGhpcy5wbGFjZWQsIHRoaXMuZGVwdGgsIEZyYWdtZW50LmZyb20odHlwZS5jcmVhdGUoYXR0cnMsIGNvbnRlbnQpKSk7XG4gICAgICAgIHRoaXMuZnJvbnRpZXIucHVzaCh7IHR5cGUsIG1hdGNoOiB0eXBlLmNvbnRlbnRNYXRjaCB9KTtcbiAgICB9XG4gICAgY2xvc2VGcm9udGllck5vZGUoKSB7XG4gICAgICAgIGxldCBvcGVuID0gdGhpcy5mcm9udGllci5wb3AoKTtcbiAgICAgICAgbGV0IGFkZCA9IG9wZW4ubWF0Y2guZmlsbEJlZm9yZShGcmFnbWVudC5lbXB0eSwgdHJ1ZSk7XG4gICAgICAgIGlmIChhZGQuY2hpbGRDb3VudClcbiAgICAgICAgICAgIHRoaXMucGxhY2VkID0gYWRkVG9GcmFnbWVudCh0aGlzLnBsYWNlZCwgdGhpcy5mcm9udGllci5sZW5ndGgsIGFkZCk7XG4gICAgfVxufVxuZnVuY3Rpb24gZHJvcEZyb21GcmFnbWVudChmcmFnbWVudCwgZGVwdGgsIGNvdW50KSB7XG4gICAgaWYgKGRlcHRoID09IDApXG4gICAgICAgIHJldHVybiBmcmFnbWVudC5jdXRCeUluZGV4KGNvdW50LCBmcmFnbWVudC5jaGlsZENvdW50KTtcbiAgICByZXR1cm4gZnJhZ21lbnQucmVwbGFjZUNoaWxkKDAsIGZyYWdtZW50LmZpcnN0Q2hpbGQuY29weShkcm9wRnJvbUZyYWdtZW50KGZyYWdtZW50LmZpcnN0Q2hpbGQuY29udGVudCwgZGVwdGggLSAxLCBjb3VudCkpKTtcbn1cbmZ1bmN0aW9uIGFkZFRvRnJhZ21lbnQoZnJhZ21lbnQsIGRlcHRoLCBjb250ZW50KSB7XG4gICAgaWYgKGRlcHRoID09IDApXG4gICAgICAgIHJldHVybiBmcmFnbWVudC5hcHBlbmQoY29udGVudCk7XG4gICAgcmV0dXJuIGZyYWdtZW50LnJlcGxhY2VDaGlsZChmcmFnbWVudC5jaGlsZENvdW50IC0gMSwgZnJhZ21lbnQubGFzdENoaWxkLmNvcHkoYWRkVG9GcmFnbWVudChmcmFnbWVudC5sYXN0Q2hpbGQuY29udGVudCwgZGVwdGggLSAxLCBjb250ZW50KSkpO1xufVxuZnVuY3Rpb24gY29udGVudEF0KGZyYWdtZW50LCBkZXB0aCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVwdGg7IGkrKylcbiAgICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudC5maXJzdENoaWxkLmNvbnRlbnQ7XG4gICAgcmV0dXJuIGZyYWdtZW50O1xufVxuZnVuY3Rpb24gY2xvc2VOb2RlU3RhcnQobm9kZSwgb3BlblN0YXJ0LCBvcGVuRW5kKSB7XG4gICAgaWYgKG9wZW5TdGFydCA8PSAwKVxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICBsZXQgZnJhZyA9IG5vZGUuY29udGVudDtcbiAgICBpZiAob3BlblN0YXJ0ID4gMSlcbiAgICAgICAgZnJhZyA9IGZyYWcucmVwbGFjZUNoaWxkKDAsIGNsb3NlTm9kZVN0YXJ0KGZyYWcuZmlyc3RDaGlsZCwgb3BlblN0YXJ0IC0gMSwgZnJhZy5jaGlsZENvdW50ID09IDEgPyBvcGVuRW5kIC0gMSA6IDApKTtcbiAgICBpZiAob3BlblN0YXJ0ID4gMCkge1xuICAgICAgICBmcmFnID0gbm9kZS50eXBlLmNvbnRlbnRNYXRjaC5maWxsQmVmb3JlKGZyYWcpLmFwcGVuZChmcmFnKTtcbiAgICAgICAgaWYgKG9wZW5FbmQgPD0gMClcbiAgICAgICAgICAgIGZyYWcgPSBmcmFnLmFwcGVuZChub2RlLnR5cGUuY29udGVudE1hdGNoLm1hdGNoRnJhZ21lbnQoZnJhZykuZmlsbEJlZm9yZShGcmFnbWVudC5lbXB0eSwgdHJ1ZSkpO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZS5jb3B5KGZyYWcpO1xufVxuZnVuY3Rpb24gY29udGVudEFmdGVyRml0cygkdG8sIGRlcHRoLCB0eXBlLCBtYXRjaCwgb3Blbikge1xuICAgIGxldCBub2RlID0gJHRvLm5vZGUoZGVwdGgpLCBpbmRleCA9IG9wZW4gPyAkdG8uaW5kZXhBZnRlcihkZXB0aCkgOiAkdG8uaW5kZXgoZGVwdGgpO1xuICAgIGlmIChpbmRleCA9PSBub2RlLmNoaWxkQ291bnQgJiYgIXR5cGUuY29tcGF0aWJsZUNvbnRlbnQobm9kZS50eXBlKSlcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgbGV0IGZpdCA9IG1hdGNoLmZpbGxCZWZvcmUobm9kZS5jb250ZW50LCB0cnVlLCBpbmRleCk7XG4gICAgcmV0dXJuIGZpdCAmJiAhaW52YWxpZE1hcmtzKHR5cGUsIG5vZGUuY29udGVudCwgaW5kZXgpID8gZml0IDogbnVsbDtcbn1cbmZ1bmN0aW9uIGludmFsaWRNYXJrcyh0eXBlLCBmcmFnbWVudCwgc3RhcnQpIHtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBmcmFnbWVudC5jaGlsZENvdW50OyBpKyspXG4gICAgICAgIGlmICghdHlwZS5hbGxvd3NNYXJrcyhmcmFnbWVudC5jaGlsZChpKS5tYXJrcykpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiBkZWZpbmVzQ29udGVudCh0eXBlKSB7XG4gICAgcmV0dXJuIHR5cGUuc3BlYy5kZWZpbmluZyB8fCB0eXBlLnNwZWMuZGVmaW5pbmdGb3JDb250ZW50O1xufVxuZnVuY3Rpb24gcmVwbGFjZVJhbmdlKHRyLCBmcm9tLCB0bywgc2xpY2UpIHtcbiAgICBpZiAoIXNsaWNlLnNpemUpXG4gICAgICAgIHJldHVybiB0ci5kZWxldGVSYW5nZShmcm9tLCB0byk7XG4gICAgbGV0ICRmcm9tID0gdHIuZG9jLnJlc29sdmUoZnJvbSksICR0byA9IHRyLmRvYy5yZXNvbHZlKHRvKTtcbiAgICBpZiAoZml0c1RyaXZpYWxseSgkZnJvbSwgJHRvLCBzbGljZSkpXG4gICAgICAgIHJldHVybiB0ci5zdGVwKG5ldyBSZXBsYWNlU3RlcChmcm9tLCB0bywgc2xpY2UpKTtcbiAgICBsZXQgdGFyZ2V0RGVwdGhzID0gY292ZXJlZERlcHRocygkZnJvbSwgdHIuZG9jLnJlc29sdmUodG8pKTtcbiAgICAvLyBDYW4ndCByZXBsYWNlIHRoZSB3aG9sZSBkb2N1bWVudCwgc28gcmVtb3ZlIDAgaWYgaXQncyBwcmVzZW50XG4gICAgaWYgKHRhcmdldERlcHRoc1t0YXJnZXREZXB0aHMubGVuZ3RoIC0gMV0gPT0gMClcbiAgICAgICAgdGFyZ2V0RGVwdGhzLnBvcCgpO1xuICAgIC8vIE5lZ2F0aXZlIG51bWJlcnMgcmVwcmVzZW50IG5vdCBleHBhbnNpb24gb3ZlciB0aGUgd2hvbGUgbm9kZSBhdFxuICAgIC8vIHRoYXQgZGVwdGgsIGJ1dCByZXBsYWNpbmcgZnJvbSAkZnJvbS5iZWZvcmUoLUQpIHRvICR0by5wb3MuXG4gICAgbGV0IHByZWZlcnJlZFRhcmdldCA9IC0oJGZyb20uZGVwdGggKyAxKTtcbiAgICB0YXJnZXREZXB0aHMudW5zaGlmdChwcmVmZXJyZWRUYXJnZXQpO1xuICAgIC8vIFRoaXMgbG9vcCBwaWNrcyBhIHByZWZlcnJlZCB0YXJnZXQgZGVwdGgsIGlmIG9uZSBvZiB0aGUgY292ZXJpbmdcbiAgICAvLyBkZXB0aHMgaXMgbm90IG91dHNpZGUgb2YgYSBkZWZpbmluZyBub2RlLCBhbmQgYWRkcyBuZWdhdGl2ZVxuICAgIC8vIGRlcHRocyBmb3IgYW55IGRlcHRoIHRoYXQgaGFzICRmcm9tIGF0IGl0cyBzdGFydCBhbmQgZG9lcyBub3RcbiAgICAvLyBjcm9zcyBhIGRlZmluaW5nIG5vZGUuXG4gICAgZm9yIChsZXQgZCA9ICRmcm9tLmRlcHRoLCBwb3MgPSAkZnJvbS5wb3MgLSAxOyBkID4gMDsgZC0tLCBwb3MtLSkge1xuICAgICAgICBsZXQgc3BlYyA9ICRmcm9tLm5vZGUoZCkudHlwZS5zcGVjO1xuICAgICAgICBpZiAoc3BlYy5kZWZpbmluZyB8fCBzcGVjLmRlZmluaW5nQXNDb250ZXh0IHx8IHNwZWMuaXNvbGF0aW5nKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGlmICh0YXJnZXREZXB0aHMuaW5kZXhPZihkKSA+IC0xKVxuICAgICAgICAgICAgcHJlZmVycmVkVGFyZ2V0ID0gZDtcbiAgICAgICAgZWxzZSBpZiAoJGZyb20uYmVmb3JlKGQpID09IHBvcylcbiAgICAgICAgICAgIHRhcmdldERlcHRocy5zcGxpY2UoMSwgMCwgLWQpO1xuICAgIH1cbiAgICAvLyBUcnkgdG8gZml0IGVhY2ggcG9zc2libGUgZGVwdGggb2YgdGhlIHNsaWNlIGludG8gZWFjaCBwb3NzaWJsZVxuICAgIC8vIHRhcmdldCBkZXB0aCwgc3RhcnRpbmcgd2l0aCB0aGUgcHJlZmVycmVkIGRlcHRocy5cbiAgICBsZXQgcHJlZmVycmVkVGFyZ2V0SW5kZXggPSB0YXJnZXREZXB0aHMuaW5kZXhPZihwcmVmZXJyZWRUYXJnZXQpO1xuICAgIGxldCBsZWZ0Tm9kZXMgPSBbXSwgcHJlZmVycmVkRGVwdGggPSBzbGljZS5vcGVuU3RhcnQ7XG4gICAgZm9yIChsZXQgY29udGVudCA9IHNsaWNlLmNvbnRlbnQsIGkgPSAwOzsgaSsrKSB7XG4gICAgICAgIGxldCBub2RlID0gY29udGVudC5maXJzdENoaWxkO1xuICAgICAgICBsZWZ0Tm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgaWYgKGkgPT0gc2xpY2Uub3BlblN0YXJ0KVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNvbnRlbnQgPSBub2RlLmNvbnRlbnQ7XG4gICAgfVxuICAgIC8vIEJhY2sgdXAgcHJlZmVycmVkRGVwdGggdG8gY292ZXIgZGVmaW5pbmcgdGV4dGJsb2NrcyBkaXJlY3RseVxuICAgIC8vIGFib3ZlIGl0LCBwb3NzaWJseSBza2lwcGluZyBhIG5vbi1kZWZpbmluZyB0ZXh0YmxvY2suXG4gICAgZm9yIChsZXQgZCA9IHByZWZlcnJlZERlcHRoIC0gMTsgZCA+PSAwOyBkLS0pIHtcbiAgICAgICAgbGV0IGxlZnROb2RlID0gbGVmdE5vZGVzW2RdLCBkZWYgPSBkZWZpbmVzQ29udGVudChsZWZ0Tm9kZS50eXBlKTtcbiAgICAgICAgaWYgKGRlZiAmJiAhbGVmdE5vZGUuc2FtZU1hcmt1cCgkZnJvbS5ub2RlKE1hdGguYWJzKHByZWZlcnJlZFRhcmdldCkgLSAxKSkpXG4gICAgICAgICAgICBwcmVmZXJyZWREZXB0aCA9IGQ7XG4gICAgICAgIGVsc2UgaWYgKGRlZiB8fCAhbGVmdE5vZGUudHlwZS5pc1RleHRibG9jaylcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBmb3IgKGxldCBqID0gc2xpY2Uub3BlblN0YXJ0OyBqID49IDA7IGotLSkge1xuICAgICAgICBsZXQgb3BlbkRlcHRoID0gKGogKyBwcmVmZXJyZWREZXB0aCArIDEpICUgKHNsaWNlLm9wZW5TdGFydCArIDEpO1xuICAgICAgICBsZXQgaW5zZXJ0ID0gbGVmdE5vZGVzW29wZW5EZXB0aF07XG4gICAgICAgIGlmICghaW5zZXJ0KVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFyZ2V0RGVwdGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAvLyBMb29wIG92ZXIgcG9zc2libGUgZXhwYW5zaW9uIGxldmVscywgc3RhcnRpbmcgd2l0aCB0aGVcbiAgICAgICAgICAgIC8vIHByZWZlcnJlZCBvbmVcbiAgICAgICAgICAgIGxldCB0YXJnZXREZXB0aCA9IHRhcmdldERlcHRoc1soaSArIHByZWZlcnJlZFRhcmdldEluZGV4KSAlIHRhcmdldERlcHRocy5sZW5ndGhdLCBleHBhbmQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHRhcmdldERlcHRoIDwgMCkge1xuICAgICAgICAgICAgICAgIGV4cGFuZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRhcmdldERlcHRoID0gLXRhcmdldERlcHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHBhcmVudCA9ICRmcm9tLm5vZGUodGFyZ2V0RGVwdGggLSAxKSwgaW5kZXggPSAkZnJvbS5pbmRleCh0YXJnZXREZXB0aCAtIDEpO1xuICAgICAgICAgICAgaWYgKHBhcmVudC5jYW5SZXBsYWNlV2l0aChpbmRleCwgaW5kZXgsIGluc2VydC50eXBlLCBpbnNlcnQubWFya3MpKVxuICAgICAgICAgICAgICAgIHJldHVybiB0ci5yZXBsYWNlKCRmcm9tLmJlZm9yZSh0YXJnZXREZXB0aCksIGV4cGFuZCA/ICR0by5hZnRlcih0YXJnZXREZXB0aCkgOiB0bywgbmV3IFNsaWNlKGNsb3NlRnJhZ21lbnQoc2xpY2UuY29udGVudCwgMCwgc2xpY2Uub3BlblN0YXJ0LCBvcGVuRGVwdGgpLCBvcGVuRGVwdGgsIHNsaWNlLm9wZW5FbmQpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgc3RhcnRTdGVwcyA9IHRyLnN0ZXBzLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gdGFyZ2V0RGVwdGhzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIHRyLnJlcGxhY2UoZnJvbSwgdG8sIHNsaWNlKTtcbiAgICAgICAgaWYgKHRyLnN0ZXBzLmxlbmd0aCA+IHN0YXJ0U3RlcHMpXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgbGV0IGRlcHRoID0gdGFyZ2V0RGVwdGhzW2ldO1xuICAgICAgICBpZiAoZGVwdGggPCAwKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIGZyb20gPSAkZnJvbS5iZWZvcmUoZGVwdGgpO1xuICAgICAgICB0byA9ICR0by5hZnRlcihkZXB0aCk7XG4gICAgfVxufVxuZnVuY3Rpb24gY2xvc2VGcmFnbWVudChmcmFnbWVudCwgZGVwdGgsIG9sZE9wZW4sIG5ld09wZW4sIHBhcmVudCkge1xuICAgIGlmIChkZXB0aCA8IG9sZE9wZW4pIHtcbiAgICAgICAgbGV0IGZpcnN0ID0gZnJhZ21lbnQuZmlyc3RDaGlsZDtcbiAgICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudC5yZXBsYWNlQ2hpbGQoMCwgZmlyc3QuY29weShjbG9zZUZyYWdtZW50KGZpcnN0LmNvbnRlbnQsIGRlcHRoICsgMSwgb2xkT3BlbiwgbmV3T3BlbiwgZmlyc3QpKSk7XG4gICAgfVxuICAgIGlmIChkZXB0aCA+IG5ld09wZW4pIHtcbiAgICAgICAgbGV0IG1hdGNoID0gcGFyZW50LmNvbnRlbnRNYXRjaEF0KDApO1xuICAgICAgICBsZXQgc3RhcnQgPSBtYXRjaC5maWxsQmVmb3JlKGZyYWdtZW50KS5hcHBlbmQoZnJhZ21lbnQpO1xuICAgICAgICBmcmFnbWVudCA9IHN0YXJ0LmFwcGVuZChtYXRjaC5tYXRjaEZyYWdtZW50KHN0YXJ0KS5maWxsQmVmb3JlKEZyYWdtZW50LmVtcHR5LCB0cnVlKSk7XG4gICAgfVxuICAgIHJldHVybiBmcmFnbWVudDtcbn1cbmZ1bmN0aW9uIHJlcGxhY2VSYW5nZVdpdGgodHIsIGZyb20sIHRvLCBub2RlKSB7XG4gICAgaWYgKCFub2RlLmlzSW5saW5lICYmIGZyb20gPT0gdG8gJiYgdHIuZG9jLnJlc29sdmUoZnJvbSkucGFyZW50LmNvbnRlbnQuc2l6ZSkge1xuICAgICAgICBsZXQgcG9pbnQgPSBpbnNlcnRQb2ludCh0ci5kb2MsIGZyb20sIG5vZGUudHlwZSk7XG4gICAgICAgIGlmIChwb2ludCAhPSBudWxsKVxuICAgICAgICAgICAgZnJvbSA9IHRvID0gcG9pbnQ7XG4gICAgfVxuICAgIHRyLnJlcGxhY2VSYW5nZShmcm9tLCB0bywgbmV3IFNsaWNlKEZyYWdtZW50LmZyb20obm9kZSksIDAsIDApKTtcbn1cbmZ1bmN0aW9uIGRlbGV0ZVJhbmdlKHRyLCBmcm9tLCB0bykge1xuICAgIGxldCAkZnJvbSA9IHRyLmRvYy5yZXNvbHZlKGZyb20pLCAkdG8gPSB0ci5kb2MucmVzb2x2ZSh0byk7XG4gICAgbGV0IGNvdmVyZWQgPSBjb3ZlcmVkRGVwdGhzKCRmcm9tLCAkdG8pO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY292ZXJlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgZGVwdGggPSBjb3ZlcmVkW2ldLCBsYXN0ID0gaSA9PSBjb3ZlcmVkLmxlbmd0aCAtIDE7XG4gICAgICAgIGlmICgobGFzdCAmJiBkZXB0aCA9PSAwKSB8fCAkZnJvbS5ub2RlKGRlcHRoKS50eXBlLmNvbnRlbnRNYXRjaC52YWxpZEVuZClcbiAgICAgICAgICAgIHJldHVybiB0ci5kZWxldGUoJGZyb20uc3RhcnQoZGVwdGgpLCAkdG8uZW5kKGRlcHRoKSk7XG4gICAgICAgIGlmIChkZXB0aCA+IDAgJiYgKGxhc3QgfHwgJGZyb20ubm9kZShkZXB0aCAtIDEpLmNhblJlcGxhY2UoJGZyb20uaW5kZXgoZGVwdGggLSAxKSwgJHRvLmluZGV4QWZ0ZXIoZGVwdGggLSAxKSkpKVxuICAgICAgICAgICAgcmV0dXJuIHRyLmRlbGV0ZSgkZnJvbS5iZWZvcmUoZGVwdGgpLCAkdG8uYWZ0ZXIoZGVwdGgpKTtcbiAgICB9XG4gICAgZm9yIChsZXQgZCA9IDE7IGQgPD0gJGZyb20uZGVwdGggJiYgZCA8PSAkdG8uZGVwdGg7IGQrKykge1xuICAgICAgICBpZiAoZnJvbSAtICRmcm9tLnN0YXJ0KGQpID09ICRmcm9tLmRlcHRoIC0gZCAmJiB0byA+ICRmcm9tLmVuZChkKSAmJiAkdG8uZW5kKGQpIC0gdG8gIT0gJHRvLmRlcHRoIC0gZClcbiAgICAgICAgICAgIHJldHVybiB0ci5kZWxldGUoJGZyb20uYmVmb3JlKGQpLCB0byk7XG4gICAgfVxuICAgIHRyLmRlbGV0ZShmcm9tLCB0byk7XG59XG4vLyBSZXR1cm5zIGFuIGFycmF5IG9mIGFsbCBkZXB0aHMgZm9yIHdoaWNoICRmcm9tIC0gJHRvIHNwYW5zIHRoZVxuLy8gd2hvbGUgY29udGVudCBvZiB0aGUgbm9kZXMgYXQgdGhhdCBkZXB0aC5cbmZ1bmN0aW9uIGNvdmVyZWREZXB0aHMoJGZyb20sICR0bykge1xuICAgIGxldCByZXN1bHQgPSBbXSwgbWluRGVwdGggPSBNYXRoLm1pbigkZnJvbS5kZXB0aCwgJHRvLmRlcHRoKTtcbiAgICBmb3IgKGxldCBkID0gbWluRGVwdGg7IGQgPj0gMDsgZC0tKSB7XG4gICAgICAgIGxldCBzdGFydCA9ICRmcm9tLnN0YXJ0KGQpO1xuICAgICAgICBpZiAoc3RhcnQgPCAkZnJvbS5wb3MgLSAoJGZyb20uZGVwdGggLSBkKSB8fFxuICAgICAgICAgICAgJHRvLmVuZChkKSA+ICR0by5wb3MgKyAoJHRvLmRlcHRoIC0gZCkgfHxcbiAgICAgICAgICAgICRmcm9tLm5vZGUoZCkudHlwZS5zcGVjLmlzb2xhdGluZyB8fFxuICAgICAgICAgICAgJHRvLm5vZGUoZCkudHlwZS5zcGVjLmlzb2xhdGluZylcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBpZiAoc3RhcnQgPT0gJHRvLnN0YXJ0KGQpIHx8XG4gICAgICAgICAgICAoZCA9PSAkZnJvbS5kZXB0aCAmJiBkID09ICR0by5kZXB0aCAmJiAkZnJvbS5wYXJlbnQuaW5saW5lQ29udGVudCAmJiAkdG8ucGFyZW50LmlubGluZUNvbnRlbnQgJiZcbiAgICAgICAgICAgICAgICBkICYmICR0by5zdGFydChkIC0gMSkgPT0gc3RhcnQgLSAxKSlcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGQpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcblVwZGF0ZSBhbiBhdHRyaWJ1dGUgaW4gYSBzcGVjaWZpYyBub2RlLlxuKi9cbmNsYXNzIEF0dHJTdGVwIGV4dGVuZHMgU3RlcCB7XG4gICAgLyoqXG4gICAgQ29uc3RydWN0IGFuIGF0dHJpYnV0ZSBzdGVwLlxuICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgLyoqXG4gICAgVGhlIHBvc2l0aW9uIG9mIHRoZSB0YXJnZXQgbm9kZS5cbiAgICAqL1xuICAgIHBvcywgXG4gICAgLyoqXG4gICAgVGhlIGF0dHJpYnV0ZSB0byBzZXQuXG4gICAgKi9cbiAgICBhdHRyLCBcbiAgICAvLyBUaGUgYXR0cmlidXRlJ3MgbmV3IHZhbHVlLlxuICAgIHZhbHVlKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucG9zID0gcG9zO1xuICAgICAgICB0aGlzLmF0dHIgPSBhdHRyO1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuICAgIGFwcGx5KGRvYykge1xuICAgICAgICBsZXQgbm9kZSA9IGRvYy5ub2RlQXQodGhpcy5wb3MpO1xuICAgICAgICBpZiAoIW5vZGUpXG4gICAgICAgICAgICByZXR1cm4gU3RlcFJlc3VsdC5mYWlsKFwiTm8gbm9kZSBhdCBhdHRyaWJ1dGUgc3RlcCdzIHBvc2l0aW9uXCIpO1xuICAgICAgICBsZXQgYXR0cnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICBmb3IgKGxldCBuYW1lIGluIG5vZGUuYXR0cnMpXG4gICAgICAgICAgICBhdHRyc1tuYW1lXSA9IG5vZGUuYXR0cnNbbmFtZV07XG4gICAgICAgIGF0dHJzW3RoaXMuYXR0cl0gPSB0aGlzLnZhbHVlO1xuICAgICAgICBsZXQgdXBkYXRlZCA9IG5vZGUudHlwZS5jcmVhdGUoYXR0cnMsIG51bGwsIG5vZGUubWFya3MpO1xuICAgICAgICByZXR1cm4gU3RlcFJlc3VsdC5mcm9tUmVwbGFjZShkb2MsIHRoaXMucG9zLCB0aGlzLnBvcyArIDEsIG5ldyBTbGljZShGcmFnbWVudC5mcm9tKHVwZGF0ZWQpLCAwLCBub2RlLmlzTGVhZiA/IDAgOiAxKSk7XG4gICAgfVxuICAgIGdldE1hcCgpIHtcbiAgICAgICAgcmV0dXJuIFN0ZXBNYXAuZW1wdHk7XG4gICAgfVxuICAgIGludmVydChkb2MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBBdHRyU3RlcCh0aGlzLnBvcywgdGhpcy5hdHRyLCBkb2Mubm9kZUF0KHRoaXMucG9zKS5hdHRyc1t0aGlzLmF0dHJdKTtcbiAgICB9XG4gICAgbWFwKG1hcHBpbmcpIHtcbiAgICAgICAgbGV0IHBvcyA9IG1hcHBpbmcubWFwUmVzdWx0KHRoaXMucG9zLCAxKTtcbiAgICAgICAgcmV0dXJuIHBvcy5kZWxldGVkQWZ0ZXIgPyBudWxsIDogbmV3IEF0dHJTdGVwKHBvcy5wb3MsIHRoaXMuYXR0ciwgdGhpcy52YWx1ZSk7XG4gICAgfVxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RlcFR5cGU6IFwiYXR0clwiLCBwb3M6IHRoaXMucG9zLCBhdHRyOiB0aGlzLmF0dHIsIHZhbHVlOiB0aGlzLnZhbHVlIH07XG4gICAgfVxuICAgIHN0YXRpYyBmcm9tSlNPTihzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBqc29uLnBvcyAhPSBcIm51bWJlclwiIHx8IHR5cGVvZiBqc29uLmF0dHIgIT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiSW52YWxpZCBpbnB1dCBmb3IgQXR0clN0ZXAuZnJvbUpTT05cIik7XG4gICAgICAgIHJldHVybiBuZXcgQXR0clN0ZXAoanNvbi5wb3MsIGpzb24uYXR0ciwganNvbi52YWx1ZSk7XG4gICAgfVxufVxuU3RlcC5qc29uSUQoXCJhdHRyXCIsIEF0dHJTdGVwKTtcbi8qKlxuVXBkYXRlIGFuIGF0dHJpYnV0ZSBpbiB0aGUgZG9jIG5vZGUuXG4qL1xuY2xhc3MgRG9jQXR0clN0ZXAgZXh0ZW5kcyBTdGVwIHtcbiAgICAvKipcbiAgICBDb25zdHJ1Y3QgYW4gYXR0cmlidXRlIHN0ZXAuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAvKipcbiAgICBUaGUgYXR0cmlidXRlIHRvIHNldC5cbiAgICAqL1xuICAgIGF0dHIsIFxuICAgIC8vIFRoZSBhdHRyaWJ1dGUncyBuZXcgdmFsdWUuXG4gICAgdmFsdWUpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hdHRyID0gYXR0cjtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgICBhcHBseShkb2MpIHtcbiAgICAgICAgbGV0IGF0dHJzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgZm9yIChsZXQgbmFtZSBpbiBkb2MuYXR0cnMpXG4gICAgICAgICAgICBhdHRyc1tuYW1lXSA9IGRvYy5hdHRyc1tuYW1lXTtcbiAgICAgICAgYXR0cnNbdGhpcy5hdHRyXSA9IHRoaXMudmFsdWU7XG4gICAgICAgIGxldCB1cGRhdGVkID0gZG9jLnR5cGUuY3JlYXRlKGF0dHJzLCBkb2MuY29udGVudCwgZG9jLm1hcmtzKTtcbiAgICAgICAgcmV0dXJuIFN0ZXBSZXN1bHQub2sodXBkYXRlZCk7XG4gICAgfVxuICAgIGdldE1hcCgpIHtcbiAgICAgICAgcmV0dXJuIFN0ZXBNYXAuZW1wdHk7XG4gICAgfVxuICAgIGludmVydChkb2MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEb2NBdHRyU3RlcCh0aGlzLmF0dHIsIGRvYy5hdHRyc1t0aGlzLmF0dHJdKTtcbiAgICB9XG4gICAgbWFwKG1hcHBpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RlcFR5cGU6IFwiZG9jQXR0clwiLCBhdHRyOiB0aGlzLmF0dHIsIHZhbHVlOiB0aGlzLnZhbHVlIH07XG4gICAgfVxuICAgIHN0YXRpYyBmcm9tSlNPTihzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBqc29uLmF0dHIgIT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiSW52YWxpZCBpbnB1dCBmb3IgRG9jQXR0clN0ZXAuZnJvbUpTT05cIik7XG4gICAgICAgIHJldHVybiBuZXcgRG9jQXR0clN0ZXAoanNvbi5hdHRyLCBqc29uLnZhbHVlKTtcbiAgICB9XG59XG5TdGVwLmpzb25JRChcImRvY0F0dHJcIiwgRG9jQXR0clN0ZXApO1xuXG4vKipcbkBpbnRlcm5hbFxuKi9cbmxldCBUcmFuc2Zvcm1FcnJvciA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xufTtcblRyYW5zZm9ybUVycm9yID0gZnVuY3Rpb24gVHJhbnNmb3JtRXJyb3IobWVzc2FnZSkge1xuICAgIGxldCBlcnIgPSBFcnJvci5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xuICAgIGVyci5fX3Byb3RvX18gPSBUcmFuc2Zvcm1FcnJvci5wcm90b3R5cGU7XG4gICAgcmV0dXJuIGVycjtcbn07XG5UcmFuc2Zvcm1FcnJvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSk7XG5UcmFuc2Zvcm1FcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUcmFuc2Zvcm1FcnJvcjtcblRyYW5zZm9ybUVycm9yLnByb3RvdHlwZS5uYW1lID0gXCJUcmFuc2Zvcm1FcnJvclwiO1xuLyoqXG5BYnN0cmFjdGlvbiB0byBidWlsZCB1cCBhbmQgdHJhY2sgYW4gYXJyYXkgb2ZcbltzdGVwc10oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI3RyYW5zZm9ybS5TdGVwKSByZXByZXNlbnRpbmcgYSBkb2N1bWVudCB0cmFuc2Zvcm1hdGlvbi5cblxuTW9zdCB0cmFuc2Zvcm1pbmcgbWV0aG9kcyByZXR1cm4gdGhlIGBUcmFuc2Zvcm1gIG9iamVjdCBpdHNlbGYsIHNvXG50aGF0IHRoZXkgY2FuIGJlIGNoYWluZWQuXG4qL1xuY2xhc3MgVHJhbnNmb3JtIHtcbiAgICAvKipcbiAgICBDcmVhdGUgYSB0cmFuc2Zvcm0gdGhhdCBzdGFydHMgd2l0aCB0aGUgZ2l2ZW4gZG9jdW1lbnQuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAvKipcbiAgICBUaGUgY3VycmVudCBkb2N1bWVudCAodGhlIHJlc3VsdCBvZiBhcHBseWluZyB0aGUgc3RlcHMgaW4gdGhlXG4gICAgdHJhbnNmb3JtKS5cbiAgICAqL1xuICAgIGRvYykge1xuICAgICAgICB0aGlzLmRvYyA9IGRvYztcbiAgICAgICAgLyoqXG4gICAgICAgIFRoZSBzdGVwcyBpbiB0aGlzIHRyYW5zZm9ybS5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zdGVwcyA9IFtdO1xuICAgICAgICAvKipcbiAgICAgICAgVGhlIGRvY3VtZW50cyBiZWZvcmUgZWFjaCBvZiB0aGUgc3RlcHMuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZG9jcyA9IFtdO1xuICAgICAgICAvKipcbiAgICAgICAgQSBtYXBwaW5nIHdpdGggdGhlIG1hcHMgZm9yIGVhY2ggb2YgdGhlIHN0ZXBzIGluIHRoaXMgdHJhbnNmb3JtLlxuICAgICAgICAqL1xuICAgICAgICB0aGlzLm1hcHBpbmcgPSBuZXcgTWFwcGluZztcbiAgICB9XG4gICAgLyoqXG4gICAgVGhlIHN0YXJ0aW5nIGRvY3VtZW50LlxuICAgICovXG4gICAgZ2V0IGJlZm9yZSgpIHsgcmV0dXJuIHRoaXMuZG9jcy5sZW5ndGggPyB0aGlzLmRvY3NbMF0gOiB0aGlzLmRvYzsgfVxuICAgIC8qKlxuICAgIEFwcGx5IGEgbmV3IHN0ZXAgaW4gdGhpcyB0cmFuc2Zvcm0sIHNhdmluZyB0aGUgcmVzdWx0LiBUaHJvd3MgYW5cbiAgICBlcnJvciB3aGVuIHRoZSBzdGVwIGZhaWxzLlxuICAgICovXG4gICAgc3RlcChzdGVwKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLm1heWJlU3RlcChzdGVwKTtcbiAgICAgICAgaWYgKHJlc3VsdC5mYWlsZWQpXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHJhbnNmb3JtRXJyb3IocmVzdWx0LmZhaWxlZCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICBUcnkgdG8gYXBwbHkgYSBzdGVwIGluIHRoaXMgdHJhbnNmb3JtYXRpb24sIGlnbm9yaW5nIGl0IGlmIGl0XG4gICAgZmFpbHMuIFJldHVybnMgdGhlIHN0ZXAgcmVzdWx0LlxuICAgICovXG4gICAgbWF5YmVTdGVwKHN0ZXApIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IHN0ZXAuYXBwbHkodGhpcy5kb2MpO1xuICAgICAgICBpZiAoIXJlc3VsdC5mYWlsZWQpXG4gICAgICAgICAgICB0aGlzLmFkZFN0ZXAoc3RlcCwgcmVzdWx0LmRvYyk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIC8qKlxuICAgIFRydWUgd2hlbiB0aGUgZG9jdW1lbnQgaGFzIGJlZW4gY2hhbmdlZCAod2hlbiB0aGVyZSBhcmUgYW55XG4gICAgc3RlcHMpLlxuICAgICovXG4gICAgZ2V0IGRvY0NoYW5nZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0ZXBzLmxlbmd0aCA+IDA7XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgYWRkU3RlcChzdGVwLCBkb2MpIHtcbiAgICAgICAgdGhpcy5kb2NzLnB1c2godGhpcy5kb2MpO1xuICAgICAgICB0aGlzLnN0ZXBzLnB1c2goc3RlcCk7XG4gICAgICAgIHRoaXMubWFwcGluZy5hcHBlbmRNYXAoc3RlcC5nZXRNYXAoKSk7XG4gICAgICAgIHRoaXMuZG9jID0gZG9jO1xuICAgIH1cbiAgICAvKipcbiAgICBSZXBsYWNlIHRoZSBwYXJ0IG9mIHRoZSBkb2N1bWVudCBiZXR3ZWVuIGBmcm9tYCBhbmQgYHRvYCB3aXRoIHRoZVxuICAgIGdpdmVuIGBzbGljZWAuXG4gICAgKi9cbiAgICByZXBsYWNlKGZyb20sIHRvID0gZnJvbSwgc2xpY2UgPSBTbGljZS5lbXB0eSkge1xuICAgICAgICBsZXQgc3RlcCA9IHJlcGxhY2VTdGVwKHRoaXMuZG9jLCBmcm9tLCB0bywgc2xpY2UpO1xuICAgICAgICBpZiAoc3RlcClcbiAgICAgICAgICAgIHRoaXMuc3RlcChzdGVwKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgIFJlcGxhY2UgdGhlIGdpdmVuIHJhbmdlIHdpdGggdGhlIGdpdmVuIGNvbnRlbnQsIHdoaWNoIG1heSBiZSBhXG4gICAgZnJhZ21lbnQsIG5vZGUsIG9yIGFycmF5IG9mIG5vZGVzLlxuICAgICovXG4gICAgcmVwbGFjZVdpdGgoZnJvbSwgdG8sIGNvbnRlbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVwbGFjZShmcm9tLCB0bywgbmV3IFNsaWNlKEZyYWdtZW50LmZyb20oY29udGVudCksIDAsIDApKTtcbiAgICB9XG4gICAgLyoqXG4gICAgRGVsZXRlIHRoZSBjb250ZW50IGJldHdlZW4gdGhlIGdpdmVuIHBvc2l0aW9ucy5cbiAgICAqL1xuICAgIGRlbGV0ZShmcm9tLCB0bykge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXBsYWNlKGZyb20sIHRvLCBTbGljZS5lbXB0eSk7XG4gICAgfVxuICAgIC8qKlxuICAgIEluc2VydCB0aGUgZ2l2ZW4gY29udGVudCBhdCB0aGUgZ2l2ZW4gcG9zaXRpb24uXG4gICAgKi9cbiAgICBpbnNlcnQocG9zLCBjb250ZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcGxhY2VXaXRoKHBvcywgcG9zLCBjb250ZW50KTtcbiAgICB9XG4gICAgLyoqXG4gICAgUmVwbGFjZSBhIHJhbmdlIG9mIHRoZSBkb2N1bWVudCB3aXRoIGEgZ2l2ZW4gc2xpY2UsIHVzaW5nXG4gICAgYGZyb21gLCBgdG9gLCBhbmQgdGhlIHNsaWNlJ3NcbiAgICBbYG9wZW5TdGFydGBdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5TbGljZS5vcGVuU3RhcnQpIHByb3BlcnR5IGFzIGhpbnRzLCByYXRoZXJcbiAgICB0aGFuIGZpeGVkIHN0YXJ0IGFuZCBlbmQgcG9pbnRzLiBUaGlzIG1ldGhvZCBtYXkgZ3JvdyB0aGVcbiAgICByZXBsYWNlZCBhcmVhIG9yIGNsb3NlIG9wZW4gbm9kZXMgaW4gdGhlIHNsaWNlIGluIG9yZGVyIHRvIGdldCBhXG4gICAgZml0IHRoYXQgaXMgbW9yZSBpbiBsaW5lIHdpdGggV1lTSVdZRyBleHBlY3RhdGlvbnMsIGJ5IGRyb3BwaW5nXG4gICAgZnVsbHkgY292ZXJlZCBwYXJlbnQgbm9kZXMgb2YgdGhlIHJlcGxhY2VkIHJlZ2lvbiB3aGVuIHRoZXkgYXJlXG4gICAgbWFya2VkIFtub24tZGVmaW5pbmcgYXNcbiAgICBjb250ZXh0XShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTm9kZVNwZWMuZGVmaW5pbmdBc0NvbnRleHQpLCBvciBpbmNsdWRpbmcgYW5cbiAgICBvcGVuIHBhcmVudCBub2RlIGZyb20gdGhlIHNsaWNlIHRoYXQgX2lzXyBtYXJrZWQgYXMgW2RlZmluaW5nXG4gICAgaXRzIGNvbnRlbnRdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5Ob2RlU3BlYy5kZWZpbmluZ0ZvckNvbnRlbnQpLlxuICAgIFxuICAgIFRoaXMgaXMgdGhlIG1ldGhvZCwgZm9yIGV4YW1wbGUsIHRvIGhhbmRsZSBwYXN0ZS4gVGhlIHNpbWlsYXJcbiAgICBbYHJlcGxhY2VgXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jdHJhbnNmb3JtLlRyYW5zZm9ybS5yZXBsYWNlKSBtZXRob2QgaXMgYSBtb3JlXG4gICAgcHJpbWl0aXZlIHRvb2wgd2hpY2ggd2lsbCBfbm90XyBtb3ZlIHRoZSBzdGFydCBhbmQgZW5kIG9mIGl0cyBnaXZlblxuICAgIHJhbmdlLCBhbmQgaXMgdXNlZnVsIGluIHNpdHVhdGlvbnMgd2hlcmUgeW91IG5lZWQgbW9yZSBwcmVjaXNlXG4gICAgY29udHJvbCBvdmVyIHdoYXQgaGFwcGVucy5cbiAgICAqL1xuICAgIHJlcGxhY2VSYW5nZShmcm9tLCB0bywgc2xpY2UpIHtcbiAgICAgICAgcmVwbGFjZVJhbmdlKHRoaXMsIGZyb20sIHRvLCBzbGljZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICBSZXBsYWNlIHRoZSBnaXZlbiByYW5nZSB3aXRoIGEgbm9kZSwgYnV0IHVzZSBgZnJvbWAgYW5kIGB0b2AgYXNcbiAgICBoaW50cywgcmF0aGVyIHRoYW4gcHJlY2lzZSBwb3NpdGlvbnMuIFdoZW4gZnJvbSBhbmQgdG8gYXJlIHRoZSBzYW1lXG4gICAgYW5kIGFyZSBhdCB0aGUgc3RhcnQgb3IgZW5kIG9mIGEgcGFyZW50IG5vZGUgaW4gd2hpY2ggdGhlIGdpdmVuXG4gICAgbm9kZSBkb2Vzbid0IGZpdCwgdGhpcyBtZXRob2QgbWF5IF9tb3ZlXyB0aGVtIG91dCB0b3dhcmRzIGEgcGFyZW50XG4gICAgdGhhdCBkb2VzIGFsbG93IHRoZSBnaXZlbiBub2RlIHRvIGJlIHBsYWNlZC4gV2hlbiB0aGUgZ2l2ZW4gcmFuZ2VcbiAgICBjb21wbGV0ZWx5IGNvdmVycyBhIHBhcmVudCBub2RlLCB0aGlzIG1ldGhvZCBtYXkgY29tcGxldGVseSByZXBsYWNlXG4gICAgdGhhdCBwYXJlbnQgbm9kZS5cbiAgICAqL1xuICAgIHJlcGxhY2VSYW5nZVdpdGgoZnJvbSwgdG8sIG5vZGUpIHtcbiAgICAgICAgcmVwbGFjZVJhbmdlV2l0aCh0aGlzLCBmcm9tLCB0bywgbm9kZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICBEZWxldGUgdGhlIGdpdmVuIHJhbmdlLCBleHBhbmRpbmcgaXQgdG8gY292ZXIgZnVsbHkgY292ZXJlZFxuICAgIHBhcmVudCBub2RlcyB1bnRpbCBhIHZhbGlkIHJlcGxhY2UgaXMgZm91bmQuXG4gICAgKi9cbiAgICBkZWxldGVSYW5nZShmcm9tLCB0bykge1xuICAgICAgICBkZWxldGVSYW5nZSh0aGlzLCBmcm9tLCB0byk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICBTcGxpdCB0aGUgY29udGVudCBpbiB0aGUgZ2l2ZW4gcmFuZ2Ugb2ZmIGZyb20gaXRzIHBhcmVudCwgaWYgdGhlcmVcbiAgICBpcyBzaWJsaW5nIGNvbnRlbnQgYmVmb3JlIG9yIGFmdGVyIGl0LCBhbmQgbW92ZSBpdCB1cCB0aGUgdHJlZSB0b1xuICAgIHRoZSBkZXB0aCBzcGVjaWZpZWQgYnkgYHRhcmdldGAuIFlvdSdsbCBwcm9iYWJseSB3YW50IHRvIHVzZVxuICAgIFtgbGlmdFRhcmdldGBdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyN0cmFuc2Zvcm0ubGlmdFRhcmdldCkgdG8gY29tcHV0ZSBgdGFyZ2V0YCwgdG8gbWFrZVxuICAgIHN1cmUgdGhlIGxpZnQgaXMgdmFsaWQuXG4gICAgKi9cbiAgICBsaWZ0KHJhbmdlLCB0YXJnZXQpIHtcbiAgICAgICAgbGlmdCh0aGlzLCByYW5nZSwgdGFyZ2V0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgIEpvaW4gdGhlIGJsb2NrcyBhcm91bmQgdGhlIGdpdmVuIHBvc2l0aW9uLiBJZiBkZXB0aCBpcyAyLCB0aGVpclxuICAgIGxhc3QgYW5kIGZpcnN0IHNpYmxpbmdzIGFyZSBhbHNvIGpvaW5lZCwgYW5kIHNvIG9uLlxuICAgICovXG4gICAgam9pbihwb3MsIGRlcHRoID0gMSkge1xuICAgICAgICBqb2luKHRoaXMsIHBvcywgZGVwdGgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgV3JhcCB0aGUgZ2l2ZW4gW3JhbmdlXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTm9kZVJhbmdlKSBpbiB0aGUgZ2l2ZW4gc2V0IG9mIHdyYXBwZXJzLlxuICAgIFRoZSB3cmFwcGVycyBhcmUgYXNzdW1lZCB0byBiZSB2YWxpZCBpbiB0aGlzIHBvc2l0aW9uLCBhbmQgc2hvdWxkXG4gICAgcHJvYmFibHkgYmUgY29tcHV0ZWQgd2l0aCBbYGZpbmRXcmFwcGluZ2BdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyN0cmFuc2Zvcm0uZmluZFdyYXBwaW5nKS5cbiAgICAqL1xuICAgIHdyYXAocmFuZ2UsIHdyYXBwZXJzKSB7XG4gICAgICAgIHdyYXAodGhpcywgcmFuZ2UsIHdyYXBwZXJzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgIFNldCB0aGUgdHlwZSBvZiBhbGwgdGV4dGJsb2NrcyAocGFydGx5KSBiZXR3ZWVuIGBmcm9tYCBhbmQgYHRvYCB0b1xuICAgIHRoZSBnaXZlbiBub2RlIHR5cGUgd2l0aCB0aGUgZ2l2ZW4gYXR0cmlidXRlcy5cbiAgICAqL1xuICAgIHNldEJsb2NrVHlwZShmcm9tLCB0byA9IGZyb20sIHR5cGUsIGF0dHJzID0gbnVsbCkge1xuICAgICAgICBzZXRCbG9ja1R5cGUodGhpcywgZnJvbSwgdG8sIHR5cGUsIGF0dHJzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgIENoYW5nZSB0aGUgdHlwZSwgYXR0cmlidXRlcywgYW5kL29yIG1hcmtzIG9mIHRoZSBub2RlIGF0IGBwb3NgLlxuICAgIFdoZW4gYHR5cGVgIGlzbid0IGdpdmVuLCB0aGUgZXhpc3Rpbmcgbm9kZSB0eXBlIGlzIHByZXNlcnZlZCxcbiAgICAqL1xuICAgIHNldE5vZGVNYXJrdXAocG9zLCB0eXBlLCBhdHRycyA9IG51bGwsIG1hcmtzKSB7XG4gICAgICAgIHNldE5vZGVNYXJrdXAodGhpcywgcG9zLCB0eXBlLCBhdHRycywgbWFya3MpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgU2V0IGEgc2luZ2xlIGF0dHJpYnV0ZSBvbiBhIGdpdmVuIG5vZGUgdG8gYSBuZXcgdmFsdWUuXG4gICAgVGhlIGBwb3NgIGFkZHJlc3NlcyB0aGUgZG9jdW1lbnQgY29udGVudC4gVXNlIGBzZXREb2NBdHRyaWJ1dGVgXG4gICAgdG8gc2V0IGF0dHJpYnV0ZXMgb24gdGhlIGRvY3VtZW50IGl0c2VsZi5cbiAgICAqL1xuICAgIHNldE5vZGVBdHRyaWJ1dGUocG9zLCBhdHRyLCB2YWx1ZSkge1xuICAgICAgICB0aGlzLnN0ZXAobmV3IEF0dHJTdGVwKHBvcywgYXR0ciwgdmFsdWUpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgIFNldCBhIHNpbmdsZSBhdHRyaWJ1dGUgb24gdGhlIGRvY3VtZW50IHRvIGEgbmV3IHZhbHVlLlxuICAgICovXG4gICAgc2V0RG9jQXR0cmlidXRlKGF0dHIsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuc3RlcChuZXcgRG9jQXR0clN0ZXAoYXR0ciwgdmFsdWUpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgIEFkZCBhIG1hcmsgdG8gdGhlIG5vZGUgYXQgcG9zaXRpb24gYHBvc2AuXG4gICAgKi9cbiAgICBhZGROb2RlTWFyayhwb3MsIG1hcmspIHtcbiAgICAgICAgdGhpcy5zdGVwKG5ldyBBZGROb2RlTWFya1N0ZXAocG9zLCBtYXJrKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICBSZW1vdmUgYSBtYXJrIChvciBhIG1hcmsgb2YgdGhlIGdpdmVuIHR5cGUpIGZyb20gdGhlIG5vZGUgYXRcbiAgICBwb3NpdGlvbiBgcG9zYC5cbiAgICAqL1xuICAgIHJlbW92ZU5vZGVNYXJrKHBvcywgbWFyaykge1xuICAgICAgICBpZiAoIShtYXJrIGluc3RhbmNlb2YgTWFyaykpIHtcbiAgICAgICAgICAgIGxldCBub2RlID0gdGhpcy5kb2Mubm9kZUF0KHBvcyk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJObyBub2RlIGF0IHBvc2l0aW9uIFwiICsgcG9zKTtcbiAgICAgICAgICAgIG1hcmsgPSBtYXJrLmlzSW5TZXQobm9kZS5tYXJrcyk7XG4gICAgICAgICAgICBpZiAoIW1hcmspXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGVwKG5ldyBSZW1vdmVOb2RlTWFya1N0ZXAocG9zLCBtYXJrKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICBTcGxpdCB0aGUgbm9kZSBhdCB0aGUgZ2l2ZW4gcG9zaXRpb24sIGFuZCBvcHRpb25hbGx5LCBpZiBgZGVwdGhgIGlzXG4gICAgZ3JlYXRlciB0aGFuIG9uZSwgYW55IG51bWJlciBvZiBub2RlcyBhYm92ZSB0aGF0LiBCeSBkZWZhdWx0LCB0aGVcbiAgICBwYXJ0cyBzcGxpdCBvZmYgd2lsbCBpbmhlcml0IHRoZSBub2RlIHR5cGUgb2YgdGhlIG9yaWdpbmFsIG5vZGUuXG4gICAgVGhpcyBjYW4gYmUgY2hhbmdlZCBieSBwYXNzaW5nIGFuIGFycmF5IG9mIHR5cGVzIGFuZCBhdHRyaWJ1dGVzIHRvXG4gICAgdXNlIGFmdGVyIHRoZSBzcGxpdC5cbiAgICAqL1xuICAgIHNwbGl0KHBvcywgZGVwdGggPSAxLCB0eXBlc0FmdGVyKSB7XG4gICAgICAgIHNwbGl0KHRoaXMsIHBvcywgZGVwdGgsIHR5cGVzQWZ0ZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgQWRkIHRoZSBnaXZlbiBtYXJrIHRvIHRoZSBpbmxpbmUgY29udGVudCBiZXR3ZWVuIGBmcm9tYCBhbmQgYHRvYC5cbiAgICAqL1xuICAgIGFkZE1hcmsoZnJvbSwgdG8sIG1hcmspIHtcbiAgICAgICAgYWRkTWFyayh0aGlzLCBmcm9tLCB0bywgbWFyayk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICBSZW1vdmUgbWFya3MgZnJvbSBpbmxpbmUgbm9kZXMgYmV0d2VlbiBgZnJvbWAgYW5kIGB0b2AuIFdoZW5cbiAgICBgbWFya2AgaXMgYSBzaW5nbGUgbWFyaywgcmVtb3ZlIHByZWNpc2VseSB0aGF0IG1hcmsuIFdoZW4gaXQgaXNcbiAgICBhIG1hcmsgdHlwZSwgcmVtb3ZlIGFsbCBtYXJrcyBvZiB0aGF0IHR5cGUuIFdoZW4gaXQgaXMgbnVsbCxcbiAgICByZW1vdmUgYWxsIG1hcmtzIG9mIGFueSB0eXBlLlxuICAgICovXG4gICAgcmVtb3ZlTWFyayhmcm9tLCB0bywgbWFyaykge1xuICAgICAgICByZW1vdmVNYXJrKHRoaXMsIGZyb20sIHRvLCBtYXJrKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgIFJlbW92ZXMgYWxsIG1hcmtzIGFuZCBub2RlcyBmcm9tIHRoZSBjb250ZW50IG9mIHRoZSBub2RlIGF0XG4gICAgYHBvc2AgdGhhdCBkb24ndCBtYXRjaCB0aGUgZ2l2ZW4gbmV3IHBhcmVudCBub2RlIHR5cGUuIEFjY2VwdHNcbiAgICBhbiBvcHRpb25hbCBzdGFydGluZyBbY29udGVudCBtYXRjaF0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLkNvbnRlbnRNYXRjaCkgYXNcbiAgICB0aGlyZCBhcmd1bWVudC5cbiAgICAqL1xuICAgIGNsZWFySW5jb21wYXRpYmxlKHBvcywgcGFyZW50VHlwZSwgbWF0Y2gpIHtcbiAgICAgICAgY2xlYXJJbmNvbXBhdGlibGUodGhpcywgcG9zLCBwYXJlbnRUeXBlLCBtYXRjaCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuZXhwb3J0IHsgQWRkTWFya1N0ZXAsIEFkZE5vZGVNYXJrU3RlcCwgQXR0clN0ZXAsIERvY0F0dHJTdGVwLCBNYXBSZXN1bHQsIE1hcHBpbmcsIFJlbW92ZU1hcmtTdGVwLCBSZW1vdmVOb2RlTWFya1N0ZXAsIFJlcGxhY2VBcm91bmRTdGVwLCBSZXBsYWNlU3RlcCwgU3RlcCwgU3RlcE1hcCwgU3RlcFJlc3VsdCwgVHJhbnNmb3JtLCBUcmFuc2Zvcm1FcnJvciwgY2FuSm9pbiwgY2FuU3BsaXQsIGRyb3BQb2ludCwgZmluZFdyYXBwaW5nLCBpbnNlcnRQb2ludCwgam9pblBvaW50LCBsaWZ0VGFyZ2V0LCByZXBsYWNlU3RlcCB9O1xuIl0sCiAgIm1hcHBpbmdz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TztBQUNILFVBQU07QUFDTixTQUFLLE9BQU87QUFDWixTQUFLLFFBQVE7QUFBQSxFQUNqQjtBQUFBLEVBQ0EsTUFBTSxLQUFLO0FBQ1AsUUFBSSxRQUFRLHVCQUFPLE9BQU8sSUFBSTtBQUM5QixhQUFTLFFBQVEsSUFBSTtBQUNqQixZQUFNLElBQUksSUFBSSxJQUFJLE1BQU0sSUFBSTtBQUNoQyxVQUFNLEtBQUssSUFBSSxJQUFJLEtBQUs7QUFDeEIsUUFBSSxVQUFVLElBQUksS0FBSyxPQUFPLE9BQU8sSUFBSSxTQUFTLElBQUksS0FBSztBQUMzRCxXQUFPLFdBQVcsR0FBRyxPQUFPO0FBQUEsRUFDaEM7QUFBQSxFQUNBLFNBQVM7QUFDTCxXQUFPLFFBQVE7QUFBQSxFQUNuQjtBQUFBLEVBQ0EsT0FBTyxLQUFLO0FBQ1IsV0FBTyxJQUFJLFlBQVksS0FBSyxNQUFNLElBQUksTUFBTSxLQUFLLElBQUksQ0FBQztBQUFBLEVBQzFEO0FBQUEsRUFDQSxJQUFJLFNBQVM7QUFDVCxXQUFPO0FBQUEsRUFDWDtBQUFBLEVBQ0EsU0FBUztBQUNMLFdBQU8sRUFBRSxVQUFVLFdBQVcsTUFBTSxLQUFLLE1BQU0sT0FBTyxLQUFLLE1BQU07QUFBQSxFQUNyRTtBQUFBLEVBQ0EsT0FBTyxTQUFTLFFBQVEsTUFBTTtBQUMxQixRQUFJLE9BQU8sS0FBSyxRQUFRO0FBQ3BCLFlBQU0sSUFBSSxXQUFXLHdDQUF3QztBQUNqRSxXQUFPLElBQUksWUFBWSxLQUFLLE1BQU0sS0FBSyxLQUFLO0FBQUEsRUFDaEQ7QUFDSjtBQUNBLEtBQUssT0FBTyxXQUFXLFdBQVc7QUFLbEMsSUFBSSxpQkFBaUIsY0FBYyxNQUFNO0FBQ3pDO0FBQ0EsaUJBQWlCLFNBQVNDLGdCQUFlLFNBQVM7QUFDOUMsTUFBSSxNQUFNLE1BQU0sS0FBSyxNQUFNLE9BQU87QUFDbEMsTUFBSSxZQUFZQSxnQkFBZTtBQUMvQixTQUFPO0FBQ1g7QUFDQSxlQUFlLFlBQVksT0FBTyxPQUFPLE1BQU0sU0FBUztBQUN4RCxlQUFlLFVBQVUsY0FBYztBQUN2QyxlQUFlLFVBQVUsT0FBTzsiLAogICJuYW1lcyI6IFsiSW5wdXRBcmVhU3RhdHVzIiwgIlNldmVyaXR5IiwgIkZpbGVGb3JtYXQiLCAiSGlzdG9yeUNoYW5nZSIsICJDb3FGaWxlUHJvZ3Jlc3NLaW5kIiwgImZvdW5kIiwgImZvdW5kIiwgImkiLCAidHlwZSIsICJuZmEiLCAiZWRnZSIsICJleHByIiwgIm5vZGUiLCAic3RhdGVzIiwgInBhcmVudCIsICJUcmFuc2Zvcm1FcnJvciJdCn0K
