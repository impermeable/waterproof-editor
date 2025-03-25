var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/orderedmap/dist/index.js
function OrderedMap(content) {
  this.content = content;
}
OrderedMap.prototype = {
  constructor: OrderedMap,
  find: function(key) {
    for (var i = 0; i < this.content.length; i += 2)
      if (this.content[i] === key)
        return i;
    return -1;
  },
  // :: (string) → ?any
  // Retrieve the value stored under `key`, or return undefined when
  // no such key exists.
  get: function(key) {
    var found2 = this.find(key);
    return found2 == -1 ? void 0 : this.content[found2 + 1];
  },
  // :: (string, any, ?string) → OrderedMap
  // Create a new map by replacing the value of `key` with a new
  // value, or adding a binding to the end of the map. If `newKey` is
  // given, the key of the binding will be replaced with that key.
  update: function(key, value, newKey) {
    var self = newKey && newKey != key ? this.remove(newKey) : this;
    var found2 = self.find(key), content = self.content.slice();
    if (found2 == -1) {
      content.push(newKey || key, value);
    } else {
      content[found2 + 1] = value;
      if (newKey)
        content[found2] = newKey;
    }
    return new OrderedMap(content);
  },
  // :: (string) → OrderedMap
  // Return a map with the given key removed, if it existed.
  remove: function(key) {
    var found2 = this.find(key);
    if (found2 == -1)
      return this;
    var content = this.content.slice();
    content.splice(found2, 2);
    return new OrderedMap(content);
  },
  // :: (string, any) → OrderedMap
  // Add a new key to the start of the map.
  addToStart: function(key, value) {
    return new OrderedMap([key, value].concat(this.remove(key).content));
  },
  // :: (string, any) → OrderedMap
  // Add a new key to the end of the map.
  addToEnd: function(key, value) {
    var content = this.remove(key).content.slice();
    content.push(key, value);
    return new OrderedMap(content);
  },
  // :: (string, string, any) → OrderedMap
  // Add a key after the given key. If `place` is not found, the new
  // key is added to the end.
  addBefore: function(place, key, value) {
    var without = this.remove(key), content = without.content.slice();
    var found2 = without.find(place);
    content.splice(found2 == -1 ? content.length : found2, 0, key, value);
    return new OrderedMap(content);
  },
  // :: ((key: string, value: any))
  // Call the given function for each key/value pair in the map, in
  // order.
  forEach: function(f) {
    for (var i = 0; i < this.content.length; i += 2)
      f(this.content[i], this.content[i + 1]);
  },
  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a new map by prepending the keys in this map that don't
  // appear in `map` before the keys in `map`.
  prepend: function(map) {
    map = OrderedMap.from(map);
    if (!map.size)
      return this;
    return new OrderedMap(map.content.concat(this.subtract(map).content));
  },
  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a new map by appending the keys in this map that don't
  // appear in `map` after the keys in `map`.
  append: function(map) {
    map = OrderedMap.from(map);
    if (!map.size)
      return this;
    return new OrderedMap(this.subtract(map).content.concat(map.content));
  },
  // :: (union<Object, OrderedMap>) → OrderedMap
  // Create a map containing all the keys in this map that don't
  // appear in `map`.
  subtract: function(map) {
    var result = this;
    map = OrderedMap.from(map);
    for (var i = 0; i < map.content.length; i += 2)
      result = result.remove(map.content[i]);
    return result;
  },
  // :: () → Object
  // Turn ordered map into a plain object.
  toObject: function() {
    var result = {};
    this.forEach(function(key, value) {
      result[key] = value;
    });
    return result;
  },
  // :: number
  // The amount of keys in this map.
  get size() {
    return this.content.length >> 1;
  }
};
OrderedMap.from = function(value) {
  if (value instanceof OrderedMap)
    return value;
  var content = [];
  if (value)
    for (var prop in value)
      content.push(prop, value[prop]);
  return new OrderedMap(content);
};
var dist_default = OrderedMap;

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
    let text2 = "", first = true;
    this.nodesBetween(from, to, (node, pos) => {
      let nodeText = node.isText ? node.text.slice(Math.max(from, pos) - pos, to - pos) : !node.isLeaf ? "" : leafText ? typeof leafText === "function" ? leafText(node) : leafText : node.type.spec.leafText ? node.type.spec.leafText(node) : "";
      if (node.isBlock && (node.isLeaf && nodeText || node.isTextblock) && blockSeparator) {
        if (first)
          first = false;
        else
          text2 += blockSeparator;
      }
      text2 += nodeText;
    }, 0);
    return text2;
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
var TextNode = class extends Node {
  /**
  @internal
  */
  constructor(type, attrs, content, marks) {
    super(type, attrs, null, marks);
    if (!content)
      throw new RangeError("Empty text nodes are not allowed");
    this.text = content;
  }
  toString() {
    if (this.type.spec.toDebugString)
      return this.type.spec.toDebugString(this);
    return wrapMarks(this.marks, JSON.stringify(this.text));
  }
  get textContent() {
    return this.text;
  }
  textBetween(from, to) {
    return this.text.slice(from, to);
  }
  get nodeSize() {
    return this.text.length;
  }
  mark(marks) {
    return marks == this.marks ? this : new TextNode(this.type, this.attrs, this.text, marks);
  }
  withText(text2) {
    if (text2 == this.text)
      return this;
    return new TextNode(this.type, this.attrs, text2, this.marks);
  }
  cut(from = 0, to = this.text.length) {
    if (from == 0 && to == this.text.length)
      return this;
    return this.withText(this.text.slice(from, to));
  }
  eq(other) {
    return this.sameMarkup(other) && this.text == other.text;
  }
  toJSON() {
    let base = super.toJSON();
    base.text = this.text;
    return base;
  }
};
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
function defaultAttrs(attrs) {
  let defaults = /* @__PURE__ */ Object.create(null);
  for (let attrName in attrs) {
    let attr = attrs[attrName];
    if (!attr.hasDefault)
      return null;
    defaults[attrName] = attr.default;
  }
  return defaults;
}
function computeAttrs(attrs, value) {
  let built = /* @__PURE__ */ Object.create(null);
  for (let name in attrs) {
    let given = value && value[name];
    if (given === void 0) {
      let attr = attrs[name];
      if (attr.hasDefault)
        given = attr.default;
      else
        throw new RangeError("No value supplied for attribute " + name);
    }
    built[name] = given;
  }
  return built;
}
function checkAttrs(attrs, values, type, name) {
  for (let name2 in values)
    if (!(name2 in attrs))
      throw new RangeError(`Unsupported attribute ${name2} for ${type} of type ${name2}`);
  for (let name2 in attrs) {
    let attr = attrs[name2];
    if (attr.validate)
      attr.validate(values[name2]);
  }
}
function initAttrs(typeName, attrs) {
  let result = /* @__PURE__ */ Object.create(null);
  if (attrs)
    for (let name in attrs)
      result[name] = new Attribute(typeName, name, attrs[name]);
  return result;
}
var NodeType = class {
  /**
  @internal
  */
  constructor(name, schema, spec) {
    this.name = name;
    this.schema = schema;
    this.spec = spec;
    this.markSet = null;
    this.groups = spec.group ? spec.group.split(" ") : [];
    this.attrs = initAttrs(name, spec.attrs);
    this.defaultAttrs = defaultAttrs(this.attrs);
    this.contentMatch = null;
    this.inlineContent = null;
    this.isBlock = !(spec.inline || name == "text");
    this.isText = name == "text";
  }
  /**
  True if this is an inline type.
  */
  get isInline() {
    return !this.isBlock;
  }
  /**
  True if this is a textblock type, a block that contains inline
  content.
  */
  get isTextblock() {
    return this.isBlock && this.inlineContent;
  }
  /**
  True for node types that allow no content.
  */
  get isLeaf() {
    return this.contentMatch == ContentMatch.empty;
  }
  /**
  True when this node is an atom, i.e. when it does not have
  directly editable content.
  */
  get isAtom() {
    return this.isLeaf || !!this.spec.atom;
  }
  /**
  The node type's [whitespace](https://prosemirror.net/docs/ref/#model.NodeSpec.whitespace) option.
  */
  get whitespace() {
    return this.spec.whitespace || (this.spec.code ? "pre" : "normal");
  }
  /**
  Tells you whether this node type has any required attributes.
  */
  hasRequiredAttrs() {
    for (let n in this.attrs)
      if (this.attrs[n].isRequired)
        return true;
    return false;
  }
  /**
  Indicates whether this node allows some of the same content as
  the given node type.
  */
  compatibleContent(other) {
    return this == other || this.contentMatch.compatible(other.contentMatch);
  }
  /**
  @internal
  */
  computeAttrs(attrs) {
    if (!attrs && this.defaultAttrs)
      return this.defaultAttrs;
    else
      return computeAttrs(this.attrs, attrs);
  }
  /**
  Create a `Node` of this type. The given attributes are
  checked and defaulted (you can pass `null` to use the type's
  defaults entirely, if no required attributes exist). `content`
  may be a `Fragment`, a node, an array of nodes, or
  `null`. Similarly `marks` may be `null` to default to the empty
  set of marks.
  */
  create(attrs = null, content, marks) {
    if (this.isText)
      throw new Error("NodeType.create can't construct text nodes");
    return new Node(this, this.computeAttrs(attrs), Fragment.from(content), Mark.setFrom(marks));
  }
  /**
  Like [`create`](https://prosemirror.net/docs/ref/#model.NodeType.create), but check the given content
  against the node type's content restrictions, and throw an error
  if it doesn't match.
  */
  createChecked(attrs = null, content, marks) {
    content = Fragment.from(content);
    this.checkContent(content);
    return new Node(this, this.computeAttrs(attrs), content, Mark.setFrom(marks));
  }
  /**
  Like [`create`](https://prosemirror.net/docs/ref/#model.NodeType.create), but see if it is
  necessary to add nodes to the start or end of the given fragment
  to make it fit the node. If no fitting wrapping can be found,
  return null. Note that, due to the fact that required nodes can
  always be created, this will always succeed if you pass null or
  `Fragment.empty` as content.
  */
  createAndFill(attrs = null, content, marks) {
    attrs = this.computeAttrs(attrs);
    content = Fragment.from(content);
    if (content.size) {
      let before = this.contentMatch.fillBefore(content);
      if (!before)
        return null;
      content = before.append(content);
    }
    let matched = this.contentMatch.matchFragment(content);
    let after = matched && matched.fillBefore(Fragment.empty, true);
    if (!after)
      return null;
    return new Node(this, attrs, content.append(after), Mark.setFrom(marks));
  }
  /**
  Returns true if the given fragment is valid content for this node
  type.
  */
  validContent(content) {
    let result = this.contentMatch.matchFragment(content);
    if (!result || !result.validEnd)
      return false;
    for (let i = 0; i < content.childCount; i++)
      if (!this.allowsMarks(content.child(i).marks))
        return false;
    return true;
  }
  /**
  Throws a RangeError if the given fragment is not valid content for this
  node type.
  @internal
  */
  checkContent(content) {
    if (!this.validContent(content))
      throw new RangeError(`Invalid content for node ${this.name}: ${content.toString().slice(0, 50)}`);
  }
  /**
  @internal
  */
  checkAttrs(attrs) {
    checkAttrs(this.attrs, attrs, "node", this.name);
  }
  /**
  Check whether the given mark type is allowed in this node.
  */
  allowsMarkType(markType) {
    return this.markSet == null || this.markSet.indexOf(markType) > -1;
  }
  /**
  Test whether the given set of marks are allowed in this node.
  */
  allowsMarks(marks) {
    if (this.markSet == null)
      return true;
    for (let i = 0; i < marks.length; i++)
      if (!this.allowsMarkType(marks[i].type))
        return false;
    return true;
  }
  /**
  Removes the marks that are not allowed in this node from the given set.
  */
  allowedMarks(marks) {
    if (this.markSet == null)
      return marks;
    let copy;
    for (let i = 0; i < marks.length; i++) {
      if (!this.allowsMarkType(marks[i].type)) {
        if (!copy)
          copy = marks.slice(0, i);
      } else if (copy) {
        copy.push(marks[i]);
      }
    }
    return !copy ? marks : copy.length ? copy : Mark.none;
  }
  /**
  @internal
  */
  static compile(nodes, schema) {
    let result = /* @__PURE__ */ Object.create(null);
    nodes.forEach((name, spec) => result[name] = new NodeType(name, schema, spec));
    let topType = schema.spec.topNode || "doc";
    if (!result[topType])
      throw new RangeError("Schema is missing its top node type ('" + topType + "')");
    if (!result.text)
      throw new RangeError("Every schema needs a 'text' type");
    for (let _ in result.text.attrs)
      throw new RangeError("The text node type should not have attributes");
    return result;
  }
};
function validateType(typeName, attrName, type) {
  let types = type.split("|");
  return (value) => {
    let name = value === null ? "null" : typeof value;
    if (types.indexOf(name) < 0)
      throw new RangeError(`Expected value of type ${types} for attribute ${attrName} on type ${typeName}, got ${name}`);
  };
}
var Attribute = class {
  constructor(typeName, attrName, options) {
    this.hasDefault = Object.prototype.hasOwnProperty.call(options, "default");
    this.default = options.default;
    this.validate = typeof options.validate == "string" ? validateType(typeName, attrName, options.validate) : options.validate;
  }
  get isRequired() {
    return !this.hasDefault;
  }
};
var MarkType = class {
  /**
  @internal
  */
  constructor(name, rank, schema, spec) {
    this.name = name;
    this.rank = rank;
    this.schema = schema;
    this.spec = spec;
    this.attrs = initAttrs(name, spec.attrs);
    this.excluded = null;
    let defaults = defaultAttrs(this.attrs);
    this.instance = defaults ? new Mark(this, defaults) : null;
  }
  /**
  Create a mark of this type. `attrs` may be `null` or an object
  containing only some of the mark's attributes. The others, if
  they have defaults, will be added.
  */
  create(attrs = null) {
    if (!attrs && this.instance)
      return this.instance;
    return new Mark(this, computeAttrs(this.attrs, attrs));
  }
  /**
  @internal
  */
  static compile(marks, schema) {
    let result = /* @__PURE__ */ Object.create(null), rank = 0;
    marks.forEach((name, spec) => result[name] = new MarkType(name, rank++, schema, spec));
    return result;
  }
  /**
  When there is a mark of this type in the given set, a new set
  without it is returned. Otherwise, the input set is returned.
  */
  removeFromSet(set) {
    for (var i = 0; i < set.length; i++)
      if (set[i].type == this) {
        set = set.slice(0, i).concat(set.slice(i + 1));
        i--;
      }
    return set;
  }
  /**
  Tests whether there is a mark of this type in the given set.
  */
  isInSet(set) {
    for (let i = 0; i < set.length; i++)
      if (set[i].type == this)
        return set[i];
  }
  /**
  @internal
  */
  checkAttrs(attrs) {
    checkAttrs(this.attrs, attrs, "mark", this.name);
  }
  /**
  Queries whether a given mark type is
  [excluded](https://prosemirror.net/docs/ref/#model.MarkSpec.excludes) by this one.
  */
  excludes(other) {
    return this.excluded.indexOf(other) > -1;
  }
};
var Schema = class {
  /**
  Construct a schema from a schema [specification](https://prosemirror.net/docs/ref/#model.SchemaSpec).
  */
  constructor(spec) {
    this.linebreakReplacement = null;
    this.cached = /* @__PURE__ */ Object.create(null);
    let instanceSpec = this.spec = {};
    for (let prop in spec)
      instanceSpec[prop] = spec[prop];
    instanceSpec.nodes = dist_default.from(spec.nodes), instanceSpec.marks = dist_default.from(spec.marks || {}), this.nodes = NodeType.compile(this.spec.nodes, this);
    this.marks = MarkType.compile(this.spec.marks, this);
    let contentExprCache = /* @__PURE__ */ Object.create(null);
    for (let prop in this.nodes) {
      if (prop in this.marks)
        throw new RangeError(prop + " can not be both a node and a mark");
      let type = this.nodes[prop], contentExpr = type.spec.content || "", markExpr = type.spec.marks;
      type.contentMatch = contentExprCache[contentExpr] || (contentExprCache[contentExpr] = ContentMatch.parse(contentExpr, this.nodes));
      type.inlineContent = type.contentMatch.inlineContent;
      if (type.spec.linebreakReplacement) {
        if (this.linebreakReplacement)
          throw new RangeError("Multiple linebreak nodes defined");
        if (!type.isInline || !type.isLeaf)
          throw new RangeError("Linebreak replacement nodes must be inline leaf nodes");
        this.linebreakReplacement = type;
      }
      type.markSet = markExpr == "_" ? null : markExpr ? gatherMarks(this, markExpr.split(" ")) : markExpr == "" || !type.inlineContent ? [] : null;
    }
    for (let prop in this.marks) {
      let type = this.marks[prop], excl = type.spec.excludes;
      type.excluded = excl == null ? [type] : excl == "" ? [] : gatherMarks(this, excl.split(" "));
    }
    this.nodeFromJSON = this.nodeFromJSON.bind(this);
    this.markFromJSON = this.markFromJSON.bind(this);
    this.topNodeType = this.nodes[this.spec.topNode || "doc"];
    this.cached.wrappings = /* @__PURE__ */ Object.create(null);
  }
  /**
  Create a node in this schema. The `type` may be a string or a
  `NodeType` instance. Attributes will be extended with defaults,
  `content` may be a `Fragment`, `null`, a `Node`, or an array of
  nodes.
  */
  node(type, attrs = null, content, marks) {
    if (typeof type == "string")
      type = this.nodeType(type);
    else if (!(type instanceof NodeType))
      throw new RangeError("Invalid node type: " + type);
    else if (type.schema != this)
      throw new RangeError("Node type from different schema used (" + type.name + ")");
    return type.createChecked(attrs, content, marks);
  }
  /**
  Create a text node in the schema. Empty text nodes are not
  allowed.
  */
  text(text2, marks) {
    let type = this.nodes.text;
    return new TextNode(type, type.defaultAttrs, text2, Mark.setFrom(marks));
  }
  /**
  Create a mark with the given type and attributes.
  */
  mark(type, attrs) {
    if (typeof type == "string")
      type = this.marks[type];
    return type.create(attrs);
  }
  /**
  Deserialize a node from its JSON representation. This method is
  bound.
  */
  nodeFromJSON(json) {
    return Node.fromJSON(this, json);
  }
  /**
  Deserialize a mark from its JSON representation. This method is
  bound.
  */
  markFromJSON(json) {
    return Mark.fromJSON(this, json);
  }
  /**
  @internal
  */
  nodeType(name) {
    let found2 = this.nodes[name];
    if (!found2)
      throw new RangeError("Unknown node type: " + name);
    return found2;
  }
};
function gatherMarks(schema, marks) {
  let found2 = [];
  for (let i = 0; i < marks.length; i++) {
    let name = marks[i], mark = schema.marks[name], ok = mark;
    if (mark) {
      found2.push(mark);
    } else {
      for (let prop in schema.marks) {
        let mark2 = schema.marks[prop];
        if (name == "_" || mark2.spec.group && mark2.spec.group.split(" ").indexOf(name) > -1)
          found2.push(ok = mark2);
      }
    }
    if (!ok)
      throw new SyntaxError("Unknown mark type: '" + marks[i] + "'");
  }
  return found2;
}

// src/schema/schema.ts
var cell = `(markdown | hint | coqblock | input | math_display)`;
var containercontent = "(markdown | coqblock | math_display)";
var WaterproofSchema = new Schema({
  nodes: {
    doc: {
      content: `${cell}*`
    },
    text: {
      group: "inline"
    },
    /////// MARKDOWN ////////
    //#region Markdown
    markdown: {
      block: true,
      content: "text*",
      parseDOM: [{ tag: "markdown", preserveWhitespace: "full" }],
      atom: true,
      toDOM: () => {
        return ["WaterproofMarkdown", 0];
      }
    },
    //#endregion
    /////// HINT //////
    //#region Hint
    hint: {
      content: `${containercontent}*`,
      attrs: {
        title: { default: "\u{1F4A1} Hint" },
        shown: { default: false }
      },
      toDOM(node) {
        return ["div", { class: "hint", shown: node.attrs.shown }, 0];
      }
    },
    //#endregion
    /////// Input Area //////
    //#region input
    input: {
      content: `${containercontent}*`,
      attrs: {
        status: { default: null }
      },
      toDOM: () => {
        return ["WaterproofInput", { class: "inputarea" }, 0];
      }
    },
    //#endregion
    ////// Coqblock //////
    //#region Coq codeblock
    "coqblock": {
      content: `(coqdoc | coqcode)+`,
      attrs: {
        prePreWhite: { default: "newLine" },
        prePostWhite: { default: "newLine" },
        postPreWhite: { default: "newLine" },
        postPostWhite: { default: "newLine" }
      },
      toDOM: () => {
        return ["coqblock", 0];
      }
    },
    coqdoc: {
      content: "(math_display | coqdown)*",
      attrs: {
        preWhite: { default: "newLine" },
        postWhite: { default: "newLine" }
      },
      toDOM: () => {
        return ["coqdoc", 0];
      }
    },
    coqdown: {
      content: "text*",
      block: true,
      atom: true,
      toDOM: () => {
        return ["coqdown", 0];
      }
    },
    coqcode: {
      content: "text*",
      // content is of type text
      code: true,
      atom: true,
      // doesn't have directly editable content (content is edited through codemirror)
      toDOM(node) {
        return ["WaterproofCode", node.attrs, 0];
      }
      // <coqcode></coqcode> cells
    },
    //#endregion
    /////// MATH DISPLAY //////
    //#region math-display
    math_display: {
      group: "math",
      content: "text*",
      atom: true,
      code: true,
      toDOM(node) {
        return ["math-display", { ...{ class: "math-node" }, ...node.attrs }, 0];
      }
    }
    //#endregion
  }
  // marks: {
  // 	em: {
  // 	  toDOM() { return ["em"] }
  // 	},
  // 	strong: {
  // 	  toDOM() { return ["strong"] }
  // 	},
  // 	link: {
  // 	  attrs: {
  // 		href: {},
  // 		title: {default: null}
  // 	  },
  // 	  inclusive: false,
  // 	  toDOM(node) { return ["a", node.attrs] }
  // 	},
  // 	code: {
  // 	  toDOM() { return ["code"] }
  // 	}
  // }
});

// src/document/blocks/schema.ts
var text = (content) => {
  return WaterproofSchema.text(content);
};
var coqMarkdown = (content) => {
  return WaterproofSchema.nodes.coqdown.create({}, text(content));
};
var mathDisplay = (content) => {
  return WaterproofSchema.nodes.math_display.create({}, text(content));
};
var markdown = (content) => {
  return WaterproofSchema.nodes.markdown.create({}, text(content));
};
var coqCode = (content) => {
  return WaterproofSchema.nodes.coqcode.create({}, text(content));
};
var inputArea = (childNodes) => {
  return WaterproofSchema.nodes.input.create({}, childNodes);
};
var hint = (title, childNodes) => {
  return WaterproofSchema.nodes.hint.create({ title }, childNodes);
};
var coqblock = (childNodes, prePreWhite, prePostWhite, postPreWhite, postPostWhite) => {
  return WaterproofSchema.nodes.coqblock.create({ prePreWhite, prePostWhite, postPreWhite, postPostWhite }, childNodes);
};
var coqDoc = (childNodes, preWhite, postWhite) => {
  return WaterproofSchema.nodes.coqdoc.create({ preWhite, postWhite }, childNodes);
};
var root = (childNodes) => {
  return WaterproofSchema.nodes.doc.create({}, childNodes);
};

// src/document/construct-document.ts
function constructDocument(blocks) {
  const documentContent = blocks.map((block) => block.toProseMirror());
  return root(documentContent);
}

// src/document/blocks/blocktypes.ts
var indentation = (level) => "  ".repeat(level);
var debugInfo = (block) => `{range=${block.range.from}-${block.range.to}}`;
var InputAreaBlock = class {
  constructor(stringContent, range, innerBlockConstructor) {
    this.stringContent = stringContent;
    this.range = range;
    this.innerBlocks = innerBlockConstructor(stringContent);
  }
  type = "input_area" /* INPUT_AREA */;
  innerBlocks;
  toProseMirror() {
    const childNodes = this.innerBlocks.map((block) => block.toProseMirror());
    return inputArea(childNodes);
  }
  // Debug print function. // FIXME: Maybe remove?
  debugPrint(level) {
    console.log(`${indentation(level)}InputAreaBlock {${debugInfo(this)}} [`);
    this.innerBlocks.forEach((block) => block.debugPrint(level + 1));
    console.log(`${indentation(level)}]`);
  }
};
var HintBlock = class {
  // Note: Hint blocks have a title attribute.
  constructor(stringContent, title, range, innerBlockConstructor) {
    this.stringContent = stringContent;
    this.title = title;
    this.range = range;
    this.innerBlocks = innerBlockConstructor(stringContent);
  }
  type = "hint" /* HINT */;
  innerBlocks;
  toProseMirror() {
    const childNodes = this.innerBlocks.map((block) => block.toProseMirror());
    return hint(this.title, childNodes);
  }
  // Debug print function.
  debugPrint(level) {
    console.log(`${indentation(level)}HintBlock {${debugInfo(this)}} {title="${this.title}"} [`);
    this.innerBlocks.forEach((block) => block.debugPrint(level + 1));
    console.log(`${indentation(level)}]`);
  }
};
var MathDisplayBlock = class {
  constructor(stringContent, range) {
    this.stringContent = stringContent;
    this.range = range;
  }
  type = "math_display" /* MATH_DISPLAY */;
  toProseMirror() {
    return mathDisplay(this.stringContent);
  }
  // Debug print function.
  debugPrint(level) {
    console.log(`${indentation(level)}MathDisplayBlock {${debugInfo(this)}}: {${this.stringContent.replaceAll("\n", "\\n")}}`);
  }
};
var CoqBlock = class {
  constructor(stringContent, prePreWhite, prePostWhite, postPreWhite, postPostWhite, range, innerBlockConstructor) {
    this.stringContent = stringContent;
    this.prePreWhite = prePreWhite;
    this.prePostWhite = prePostWhite;
    this.postPreWhite = postPreWhite;
    this.postPostWhite = postPostWhite;
    this.range = range;
    this.innerBlocks = innerBlockConstructor(stringContent);
  }
  type = "coq" /* COQ */;
  innerBlocks;
  toProseMirror() {
    const childNodes = this.innerBlocks.map((block) => block.toProseMirror());
    return coqblock(
      childNodes,
      this.prePreWhite,
      this.prePostWhite,
      this.postPreWhite,
      this.postPostWhite
    );
  }
  // Debug print function.
  debugPrint(level) {
    console.log(`${indentation(level)}CoqBlock {${debugInfo(this)}} [`);
    this.innerBlocks.forEach((block) => block.debugPrint(level + 1));
    console.log(`${indentation(level)}]`);
  }
};
var MarkdownBlock = class {
  constructor(stringContent, range) {
    this.stringContent = stringContent;
    this.range = range;
    if (stringContent === "\n")
      this.isNewLineOnly = true;
  }
  type = "markdown" /* MARKDOWN */;
  isNewLineOnly = false;
  toProseMirror() {
    return markdown(this.stringContent);
  }
  // Debug print function.
  debugPrint(level) {
    console.log(`${indentation(level)}MarkdownBlock {${debugInfo(this)}}: {${this.stringContent.replaceAll("\n", "\\n")}}`);
  }
};
var CoqDocBlock = class {
  constructor(stringContent, preWhite, postWhite, range, innerBlockConstructor) {
    this.stringContent = stringContent;
    this.preWhite = preWhite;
    this.postWhite = postWhite;
    this.range = range;
    this.innerBlocks = innerBlockConstructor(stringContent);
  }
  type = "coq_doc" /* COQ_DOC */;
  innerBlocks;
  toProseMirror() {
    const childNodes = this.innerBlocks.map((block) => block.toProseMirror());
    return coqDoc(childNodes, this.preWhite, this.postWhite);
  }
  // Debug print function.
  debugPrint(level = 0) {
    console.log(`${indentation(level)}CoqDocBlock {${debugInfo(this)}} [`);
    this.innerBlocks.forEach((block) => block.debugPrint(level + 1));
    console.log(`${indentation(level)}]`);
  }
};
var CoqMarkdownBlock = class {
  constructor(stringContent, range) {
    this.stringContent = stringContent;
    this.range = range;
  }
  type = "coqdown" /* COQ_MARKDOWN */;
  toProseMirror() {
    return coqMarkdown(this.stringContent);
  }
  // Debug print function.
  debugPrint(level) {
    console.log(`${indentation(level)}CoqMarkdownBlock {${debugInfo(this)}}: {${this.stringContent.replaceAll("\n", "\\n")}}`);
  }
};
var CoqCodeBlock = class {
  constructor(stringContent, range) {
    this.stringContent = stringContent;
    this.range = range;
  }
  type = "coq_code" /* COQ_CODE */;
  toProseMirror() {
    if (this.stringContent === "") {
      return WaterproofSchema.nodes.coqcode.create();
    }
    return coqCode(this.stringContent);
  }
  // Debug print function.
  debugPrint(level) {
    console.log(`${indentation(level)}CoqCodeBlock {${debugInfo(this)}}: {${this.stringContent.replaceAll("\n", "\\n")}}`);
  }
};

// src/document/blocks/typeguards.ts
var typeguards_exports = {};
__export(typeguards_exports, {
  isCoqBlock: () => isCoqBlock,
  isCoqCodeBlock: () => isCoqCodeBlock,
  isCoqDocBlock: () => isCoqDocBlock,
  isCoqMarkdownBlock: () => isCoqMarkdownBlock,
  isHintBlock: () => isHintBlock,
  isInputAreaBlock: () => isInputAreaBlock,
  isMarkdownBlock: () => isMarkdownBlock,
  isMathDisplayBlock: () => isMathDisplayBlock
});
var isInputAreaBlock = (block) => block.type === "input_area" /* INPUT_AREA */;
var isHintBlock = (block) => block.type === "hint" /* HINT */;
var isMathDisplayBlock = (block) => block.type === "math_display" /* MATH_DISPLAY */;
var isCoqBlock = (block) => block.type === "coq" /* COQ */;
var isMarkdownBlock = (block) => block.type === "markdown" /* MARKDOWN */;
var isCoqMarkdownBlock = (block) => block.type === "coqdown" /* COQ_MARKDOWN */;
var isCoqDocBlock = (block) => block.type === "coq_doc" /* COQ_DOC */;
var isCoqCodeBlock = (block) => block.type === "coq_code" /* COQ_CODE */;

// src/document/utils.ts
var utils_exports = {};
__export(utils_exports, {
  blocksToProseMirrorNodes: () => blocksToProseMirrorNodes,
  extractBlocksUsingRanges: () => extractBlocksUsingRanges,
  extractInterBlockRanges: () => extractInterBlockRanges,
  iteratePairs: () => iteratePairs,
  maskInputAndHints: () => maskInputAndHints,
  sortBlocks: () => sortBlocks
});
function blocksToProseMirrorNodes(blocks) {
  return blocks.map((block) => block.toProseMirror());
}
function sortBlocks(blocks) {
  return blocks.sort((a, b) => a.range.from - b.range.from);
}
function iteratePairs(input, f) {
  return input.slice(0, -1).map((a, i) => f(a, input[i + 1]));
}
function extractInterBlockRanges(blocks, inputDocument) {
  let ranges = iteratePairs(blocks, (blockA, blockB) => {
    return { from: blockA.range.to, to: blockB.range.from };
  });
  if (blocks.length > 0 && blocks[0].range.from > 0)
    ranges = [{ from: 0, to: blocks[0].range.from }, ...ranges];
  if (blocks.length > 0 && blocks[blocks.length - 1].range.to < inputDocument.length)
    ranges = [...ranges, { from: blocks[blocks.length - 1].range.to, to: inputDocument.length }];
  if (blocks.length === 0 && inputDocument.length > 0)
    ranges = [{ from: 0, to: inputDocument.length }];
  return ranges;
}
function maskInputAndHints(inputDocument, blocks, mask = " ") {
  let maskedString = inputDocument;
  for (const block of blocks) {
    maskedString = maskedString.substring(0, block.range.from) + mask.repeat(block.range.to - block.range.from) + maskedString.substring(block.range.to);
  }
  return maskedString;
}
function extractBlocksUsingRanges(inputDocument, ranges, BlockConstructor) {
  const blocks = ranges.map((range) => {
    const content = inputDocument.slice(range.from, range.to);
    return new BlockConstructor(content, range);
  }).filter((block) => {
    return block.range.from !== block.range.to;
  });
  return blocks;
}
export {
  CoqBlock,
  CoqCodeBlock,
  CoqDocBlock,
  CoqMarkdownBlock,
  HintBlock,
  InputAreaBlock,
  MarkdownBlock,
  MathDisplayBlock,
  constructDocument,
  typeguards_exports as typeguards,
  utils_exports as utils
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbm9kZV9tb2R1bGVzL29yZGVyZWRtYXAvZGlzdC9pbmRleC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvcHJvc2VtaXJyb3ItbW9kZWwvZGlzdC9pbmRleC5qcyIsICIuLi8uLi9zcmMvc2NoZW1hL3NjaGVtYS50cyIsICIuLi8uLi9zcmMvZG9jdW1lbnQvYmxvY2tzL3NjaGVtYS50cyIsICIuLi8uLi9zcmMvZG9jdW1lbnQvY29uc3RydWN0LWRvY3VtZW50LnRzIiwgIi4uLy4uL3NyYy9kb2N1bWVudC9ibG9ja3MvYmxvY2t0eXBlcy50cyIsICIuLi8uLi9zcmMvZG9jdW1lbnQvYmxvY2tzL3R5cGVndWFyZHMudHMiLCAiLi4vLi4vc3JjL2RvY3VtZW50L3V0aWxzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyA6Oi0gUGVyc2lzdGVudCBkYXRhIHN0cnVjdHVyZSByZXByZXNlbnRpbmcgYW4gb3JkZXJlZCBtYXBwaW5nIGZyb21cbi8vIHN0cmluZ3MgdG8gdmFsdWVzLCB3aXRoIHNvbWUgY29udmVuaWVudCB1cGRhdGUgbWV0aG9kcy5cbmZ1bmN0aW9uIE9yZGVyZWRNYXAoY29udGVudCkge1xuICB0aGlzLmNvbnRlbnQgPSBjb250ZW50O1xufVxuXG5PcmRlcmVkTWFwLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IE9yZGVyZWRNYXAsXG5cbiAgZmluZDogZnVuY3Rpb24oa2V5KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvbnRlbnQubGVuZ3RoOyBpICs9IDIpXG4gICAgICBpZiAodGhpcy5jb250ZW50W2ldID09PSBrZXkpIHJldHVybiBpXG4gICAgcmV0dXJuIC0xXG4gIH0sXG5cbiAgLy8gOjogKHN0cmluZykgXHUyMTkyID9hbnlcbiAgLy8gUmV0cmlldmUgdGhlIHZhbHVlIHN0b3JlZCB1bmRlciBga2V5YCwgb3IgcmV0dXJuIHVuZGVmaW5lZCB3aGVuXG4gIC8vIG5vIHN1Y2gga2V5IGV4aXN0cy5cbiAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcbiAgICB2YXIgZm91bmQgPSB0aGlzLmZpbmQoa2V5KTtcbiAgICByZXR1cm4gZm91bmQgPT0gLTEgPyB1bmRlZmluZWQgOiB0aGlzLmNvbnRlbnRbZm91bmQgKyAxXVxuICB9LFxuXG4gIC8vIDo6IChzdHJpbmcsIGFueSwgP3N0cmluZykgXHUyMTkyIE9yZGVyZWRNYXBcbiAgLy8gQ3JlYXRlIGEgbmV3IG1hcCBieSByZXBsYWNpbmcgdGhlIHZhbHVlIG9mIGBrZXlgIHdpdGggYSBuZXdcbiAgLy8gdmFsdWUsIG9yIGFkZGluZyBhIGJpbmRpbmcgdG8gdGhlIGVuZCBvZiB0aGUgbWFwLiBJZiBgbmV3S2V5YCBpc1xuICAvLyBnaXZlbiwgdGhlIGtleSBvZiB0aGUgYmluZGluZyB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhhdCBrZXkuXG4gIHVwZGF0ZTogZnVuY3Rpb24oa2V5LCB2YWx1ZSwgbmV3S2V5KSB7XG4gICAgdmFyIHNlbGYgPSBuZXdLZXkgJiYgbmV3S2V5ICE9IGtleSA/IHRoaXMucmVtb3ZlKG5ld0tleSkgOiB0aGlzO1xuICAgIHZhciBmb3VuZCA9IHNlbGYuZmluZChrZXkpLCBjb250ZW50ID0gc2VsZi5jb250ZW50LnNsaWNlKCk7XG4gICAgaWYgKGZvdW5kID09IC0xKSB7XG4gICAgICBjb250ZW50LnB1c2gobmV3S2V5IHx8IGtleSwgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZW50W2ZvdW5kICsgMV0gPSB2YWx1ZTtcbiAgICAgIGlmIChuZXdLZXkpIGNvbnRlbnRbZm91bmRdID0gbmV3S2V5O1xuICAgIH1cbiAgICByZXR1cm4gbmV3IE9yZGVyZWRNYXAoY29udGVudClcbiAgfSxcblxuICAvLyA6OiAoc3RyaW5nKSBcdTIxOTIgT3JkZXJlZE1hcFxuICAvLyBSZXR1cm4gYSBtYXAgd2l0aCB0aGUgZ2l2ZW4ga2V5IHJlbW92ZWQsIGlmIGl0IGV4aXN0ZWQuXG4gIHJlbW92ZTogZnVuY3Rpb24oa2V5KSB7XG4gICAgdmFyIGZvdW5kID0gdGhpcy5maW5kKGtleSk7XG4gICAgaWYgKGZvdW5kID09IC0xKSByZXR1cm4gdGhpc1xuICAgIHZhciBjb250ZW50ID0gdGhpcy5jb250ZW50LnNsaWNlKCk7XG4gICAgY29udGVudC5zcGxpY2UoZm91bmQsIDIpO1xuICAgIHJldHVybiBuZXcgT3JkZXJlZE1hcChjb250ZW50KVxuICB9LFxuXG4gIC8vIDo6IChzdHJpbmcsIGFueSkgXHUyMTkyIE9yZGVyZWRNYXBcbiAgLy8gQWRkIGEgbmV3IGtleSB0byB0aGUgc3RhcnQgb2YgdGhlIG1hcC5cbiAgYWRkVG9TdGFydDogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiBuZXcgT3JkZXJlZE1hcChba2V5LCB2YWx1ZV0uY29uY2F0KHRoaXMucmVtb3ZlKGtleSkuY29udGVudCkpXG4gIH0sXG5cbiAgLy8gOjogKHN0cmluZywgYW55KSBcdTIxOTIgT3JkZXJlZE1hcFxuICAvLyBBZGQgYSBuZXcga2V5IHRvIHRoZSBlbmQgb2YgdGhlIG1hcC5cbiAgYWRkVG9FbmQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICB2YXIgY29udGVudCA9IHRoaXMucmVtb3ZlKGtleSkuY29udGVudC5zbGljZSgpO1xuICAgIGNvbnRlbnQucHVzaChrZXksIHZhbHVlKTtcbiAgICByZXR1cm4gbmV3IE9yZGVyZWRNYXAoY29udGVudClcbiAgfSxcblxuICAvLyA6OiAoc3RyaW5nLCBzdHJpbmcsIGFueSkgXHUyMTkyIE9yZGVyZWRNYXBcbiAgLy8gQWRkIGEga2V5IGFmdGVyIHRoZSBnaXZlbiBrZXkuIElmIGBwbGFjZWAgaXMgbm90IGZvdW5kLCB0aGUgbmV3XG4gIC8vIGtleSBpcyBhZGRlZCB0byB0aGUgZW5kLlxuICBhZGRCZWZvcmU6IGZ1bmN0aW9uKHBsYWNlLCBrZXksIHZhbHVlKSB7XG4gICAgdmFyIHdpdGhvdXQgPSB0aGlzLnJlbW92ZShrZXkpLCBjb250ZW50ID0gd2l0aG91dC5jb250ZW50LnNsaWNlKCk7XG4gICAgdmFyIGZvdW5kID0gd2l0aG91dC5maW5kKHBsYWNlKTtcbiAgICBjb250ZW50LnNwbGljZShmb3VuZCA9PSAtMSA/IGNvbnRlbnQubGVuZ3RoIDogZm91bmQsIDAsIGtleSwgdmFsdWUpO1xuICAgIHJldHVybiBuZXcgT3JkZXJlZE1hcChjb250ZW50KVxuICB9LFxuXG4gIC8vIDo6ICgoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpKVxuICAvLyBDYWxsIHRoZSBnaXZlbiBmdW5jdGlvbiBmb3IgZWFjaCBrZXkvdmFsdWUgcGFpciBpbiB0aGUgbWFwLCBpblxuICAvLyBvcmRlci5cbiAgZm9yRWFjaDogZnVuY3Rpb24oZikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb250ZW50Lmxlbmd0aDsgaSArPSAyKVxuICAgICAgZih0aGlzLmNvbnRlbnRbaV0sIHRoaXMuY29udGVudFtpICsgMV0pO1xuICB9LFxuXG4gIC8vIDo6ICh1bmlvbjxPYmplY3QsIE9yZGVyZWRNYXA+KSBcdTIxOTIgT3JkZXJlZE1hcFxuICAvLyBDcmVhdGUgYSBuZXcgbWFwIGJ5IHByZXBlbmRpbmcgdGhlIGtleXMgaW4gdGhpcyBtYXAgdGhhdCBkb24ndFxuICAvLyBhcHBlYXIgaW4gYG1hcGAgYmVmb3JlIHRoZSBrZXlzIGluIGBtYXBgLlxuICBwcmVwZW5kOiBmdW5jdGlvbihtYXApIHtcbiAgICBtYXAgPSBPcmRlcmVkTWFwLmZyb20obWFwKTtcbiAgICBpZiAoIW1hcC5zaXplKSByZXR1cm4gdGhpc1xuICAgIHJldHVybiBuZXcgT3JkZXJlZE1hcChtYXAuY29udGVudC5jb25jYXQodGhpcy5zdWJ0cmFjdChtYXApLmNvbnRlbnQpKVxuICB9LFxuXG4gIC8vIDo6ICh1bmlvbjxPYmplY3QsIE9yZGVyZWRNYXA+KSBcdTIxOTIgT3JkZXJlZE1hcFxuICAvLyBDcmVhdGUgYSBuZXcgbWFwIGJ5IGFwcGVuZGluZyB0aGUga2V5cyBpbiB0aGlzIG1hcCB0aGF0IGRvbid0XG4gIC8vIGFwcGVhciBpbiBgbWFwYCBhZnRlciB0aGUga2V5cyBpbiBgbWFwYC5cbiAgYXBwZW5kOiBmdW5jdGlvbihtYXApIHtcbiAgICBtYXAgPSBPcmRlcmVkTWFwLmZyb20obWFwKTtcbiAgICBpZiAoIW1hcC5zaXplKSByZXR1cm4gdGhpc1xuICAgIHJldHVybiBuZXcgT3JkZXJlZE1hcCh0aGlzLnN1YnRyYWN0KG1hcCkuY29udGVudC5jb25jYXQobWFwLmNvbnRlbnQpKVxuICB9LFxuXG4gIC8vIDo6ICh1bmlvbjxPYmplY3QsIE9yZGVyZWRNYXA+KSBcdTIxOTIgT3JkZXJlZE1hcFxuICAvLyBDcmVhdGUgYSBtYXAgY29udGFpbmluZyBhbGwgdGhlIGtleXMgaW4gdGhpcyBtYXAgdGhhdCBkb24ndFxuICAvLyBhcHBlYXIgaW4gYG1hcGAuXG4gIHN1YnRyYWN0OiBmdW5jdGlvbihtYXApIHtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcztcbiAgICBtYXAgPSBPcmRlcmVkTWFwLmZyb20obWFwKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hcC5jb250ZW50Lmxlbmd0aDsgaSArPSAyKVxuICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlbW92ZShtYXAuY29udGVudFtpXSk7XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9LFxuXG4gIC8vIDo6ICgpIFx1MjE5MiBPYmplY3RcbiAgLy8gVHVybiBvcmRlcmVkIG1hcCBpbnRvIGEgcGxhaW4gb2JqZWN0LlxuICB0b09iamVjdDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbihrZXksIHZhbHVlKSB7IHJlc3VsdFtrZXldID0gdmFsdWU7IH0pO1xuICAgIHJldHVybiByZXN1bHRcbiAgfSxcblxuICAvLyA6OiBudW1iZXJcbiAgLy8gVGhlIGFtb3VudCBvZiBrZXlzIGluIHRoaXMgbWFwLlxuICBnZXQgc2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb250ZW50Lmxlbmd0aCA+PiAxXG4gIH1cbn07XG5cbi8vIDo6ICg/dW5pb248T2JqZWN0LCBPcmRlcmVkTWFwPikgXHUyMTkyIE9yZGVyZWRNYXBcbi8vIFJldHVybiBhIG1hcCB3aXRoIHRoZSBnaXZlbiBjb250ZW50LiBJZiBudWxsLCBjcmVhdGUgYW4gZW1wdHlcbi8vIG1hcC4gSWYgZ2l2ZW4gYW4gb3JkZXJlZCBtYXAsIHJldHVybiB0aGF0IG1hcCBpdHNlbGYuIElmIGdpdmVuIGFuXG4vLyBvYmplY3QsIGNyZWF0ZSBhIG1hcCBmcm9tIHRoZSBvYmplY3QncyBwcm9wZXJ0aWVzLlxuT3JkZXJlZE1hcC5mcm9tID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgT3JkZXJlZE1hcCkgcmV0dXJuIHZhbHVlXG4gIHZhciBjb250ZW50ID0gW107XG4gIGlmICh2YWx1ZSkgZm9yICh2YXIgcHJvcCBpbiB2YWx1ZSkgY29udGVudC5wdXNoKHByb3AsIHZhbHVlW3Byb3BdKTtcbiAgcmV0dXJuIG5ldyBPcmRlcmVkTWFwKGNvbnRlbnQpXG59O1xuXG5leHBvcnQgZGVmYXVsdCBPcmRlcmVkTWFwO1xuIiwgImltcG9ydCBPcmRlcmVkTWFwIGZyb20gJ29yZGVyZWRtYXAnO1xuXG5mdW5jdGlvbiBmaW5kRGlmZlN0YXJ0KGEsIGIsIHBvcykge1xuICAgIGZvciAobGV0IGkgPSAwOzsgaSsrKSB7XG4gICAgICAgIGlmIChpID09IGEuY2hpbGRDb3VudCB8fCBpID09IGIuY2hpbGRDb3VudClcbiAgICAgICAgICAgIHJldHVybiBhLmNoaWxkQ291bnQgPT0gYi5jaGlsZENvdW50ID8gbnVsbCA6IHBvcztcbiAgICAgICAgbGV0IGNoaWxkQSA9IGEuY2hpbGQoaSksIGNoaWxkQiA9IGIuY2hpbGQoaSk7XG4gICAgICAgIGlmIChjaGlsZEEgPT0gY2hpbGRCKSB7XG4gICAgICAgICAgICBwb3MgKz0gY2hpbGRBLm5vZGVTaXplO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjaGlsZEEuc2FtZU1hcmt1cChjaGlsZEIpKVxuICAgICAgICAgICAgcmV0dXJuIHBvcztcbiAgICAgICAgaWYgKGNoaWxkQS5pc1RleHQgJiYgY2hpbGRBLnRleHQgIT0gY2hpbGRCLnRleHQpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBjaGlsZEEudGV4dFtqXSA9PSBjaGlsZEIudGV4dFtqXTsgaisrKVxuICAgICAgICAgICAgICAgIHBvcysrO1xuICAgICAgICAgICAgcmV0dXJuIHBvcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hpbGRBLmNvbnRlbnQuc2l6ZSB8fCBjaGlsZEIuY29udGVudC5zaXplKSB7XG4gICAgICAgICAgICBsZXQgaW5uZXIgPSBmaW5kRGlmZlN0YXJ0KGNoaWxkQS5jb250ZW50LCBjaGlsZEIuY29udGVudCwgcG9zICsgMSk7XG4gICAgICAgICAgICBpZiAoaW5uZXIgIT0gbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5uZXI7XG4gICAgICAgIH1cbiAgICAgICAgcG9zICs9IGNoaWxkQS5ub2RlU2l6ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBmaW5kRGlmZkVuZChhLCBiLCBwb3NBLCBwb3NCKSB7XG4gICAgZm9yIChsZXQgaUEgPSBhLmNoaWxkQ291bnQsIGlCID0gYi5jaGlsZENvdW50OzspIHtcbiAgICAgICAgaWYgKGlBID09IDAgfHwgaUIgPT0gMClcbiAgICAgICAgICAgIHJldHVybiBpQSA9PSBpQiA/IG51bGwgOiB7IGE6IHBvc0EsIGI6IHBvc0IgfTtcbiAgICAgICAgbGV0IGNoaWxkQSA9IGEuY2hpbGQoLS1pQSksIGNoaWxkQiA9IGIuY2hpbGQoLS1pQiksIHNpemUgPSBjaGlsZEEubm9kZVNpemU7XG4gICAgICAgIGlmIChjaGlsZEEgPT0gY2hpbGRCKSB7XG4gICAgICAgICAgICBwb3NBIC09IHNpemU7XG4gICAgICAgICAgICBwb3NCIC09IHNpemU7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNoaWxkQS5zYW1lTWFya3VwKGNoaWxkQikpXG4gICAgICAgICAgICByZXR1cm4geyBhOiBwb3NBLCBiOiBwb3NCIH07XG4gICAgICAgIGlmIChjaGlsZEEuaXNUZXh0ICYmIGNoaWxkQS50ZXh0ICE9IGNoaWxkQi50ZXh0KSB7XG4gICAgICAgICAgICBsZXQgc2FtZSA9IDAsIG1pblNpemUgPSBNYXRoLm1pbihjaGlsZEEudGV4dC5sZW5ndGgsIGNoaWxkQi50ZXh0Lmxlbmd0aCk7XG4gICAgICAgICAgICB3aGlsZSAoc2FtZSA8IG1pblNpemUgJiYgY2hpbGRBLnRleHRbY2hpbGRBLnRleHQubGVuZ3RoIC0gc2FtZSAtIDFdID09IGNoaWxkQi50ZXh0W2NoaWxkQi50ZXh0Lmxlbmd0aCAtIHNhbWUgLSAxXSkge1xuICAgICAgICAgICAgICAgIHNhbWUrKztcbiAgICAgICAgICAgICAgICBwb3NBLS07XG4gICAgICAgICAgICAgICAgcG9zQi0tO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgYTogcG9zQSwgYjogcG9zQiB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGlsZEEuY29udGVudC5zaXplIHx8IGNoaWxkQi5jb250ZW50LnNpemUpIHtcbiAgICAgICAgICAgIGxldCBpbm5lciA9IGZpbmREaWZmRW5kKGNoaWxkQS5jb250ZW50LCBjaGlsZEIuY29udGVudCwgcG9zQSAtIDEsIHBvc0IgLSAxKTtcbiAgICAgICAgICAgIGlmIChpbm5lcilcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5uZXI7XG4gICAgICAgIH1cbiAgICAgICAgcG9zQSAtPSBzaXplO1xuICAgICAgICBwb3NCIC09IHNpemU7XG4gICAgfVxufVxuXG4vKipcbkEgZnJhZ21lbnQgcmVwcmVzZW50cyBhIG5vZGUncyBjb2xsZWN0aW9uIG9mIGNoaWxkIG5vZGVzLlxuXG5MaWtlIG5vZGVzLCBmcmFnbWVudHMgYXJlIHBlcnNpc3RlbnQgZGF0YSBzdHJ1Y3R1cmVzLCBhbmQgeW91XG5zaG91bGQgbm90IG11dGF0ZSB0aGVtIG9yIHRoZWlyIGNvbnRlbnQuIFJhdGhlciwgeW91IGNyZWF0ZSBuZXdcbmluc3RhbmNlcyB3aGVuZXZlciBuZWVkZWQuIFRoZSBBUEkgdHJpZXMgdG8gbWFrZSB0aGlzIGVhc3kuXG4qL1xuY2xhc3MgRnJhZ21lbnQge1xuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBjb250ZW50LCBzaXplKSB7XG4gICAgICAgIHRoaXMuY29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgIHRoaXMuc2l6ZSA9IHNpemUgfHwgMDtcbiAgICAgICAgaWYgKHNpemUgPT0gbnVsbClcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGVudC5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICB0aGlzLnNpemUgKz0gY29udGVudFtpXS5ub2RlU2l6ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgSW52b2tlIGEgY2FsbGJhY2sgZm9yIGFsbCBkZXNjZW5kYW50IG5vZGVzIGJldHdlZW4gdGhlIGdpdmVuIHR3b1xuICAgIHBvc2l0aW9ucyAocmVsYXRpdmUgdG8gc3RhcnQgb2YgdGhpcyBmcmFnbWVudCkuIERvZXNuJ3QgZGVzY2VuZFxuICAgIGludG8gYSBub2RlIHdoZW4gdGhlIGNhbGxiYWNrIHJldHVybnMgYGZhbHNlYC5cbiAgICAqL1xuICAgIG5vZGVzQmV0d2Vlbihmcm9tLCB0bywgZiwgbm9kZVN0YXJ0ID0gMCwgcGFyZW50KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBwb3MgPSAwOyBwb3MgPCB0bzsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgY2hpbGQgPSB0aGlzLmNvbnRlbnRbaV0sIGVuZCA9IHBvcyArIGNoaWxkLm5vZGVTaXplO1xuICAgICAgICAgICAgaWYgKGVuZCA+IGZyb20gJiYgZihjaGlsZCwgbm9kZVN0YXJ0ICsgcG9zLCBwYXJlbnQgfHwgbnVsbCwgaSkgIT09IGZhbHNlICYmIGNoaWxkLmNvbnRlbnQuc2l6ZSkge1xuICAgICAgICAgICAgICAgIGxldCBzdGFydCA9IHBvcyArIDE7XG4gICAgICAgICAgICAgICAgY2hpbGQubm9kZXNCZXR3ZWVuKE1hdGgubWF4KDAsIGZyb20gLSBzdGFydCksIE1hdGgubWluKGNoaWxkLmNvbnRlbnQuc2l6ZSwgdG8gLSBzdGFydCksIGYsIG5vZGVTdGFydCArIHN0YXJ0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvcyA9IGVuZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICBDYWxsIHRoZSBnaXZlbiBjYWxsYmFjayBmb3IgZXZlcnkgZGVzY2VuZGFudCBub2RlLiBgcG9zYCB3aWxsIGJlXG4gICAgcmVsYXRpdmUgdG8gdGhlIHN0YXJ0IG9mIHRoZSBmcmFnbWVudC4gVGhlIGNhbGxiYWNrIG1heSByZXR1cm5cbiAgICBgZmFsc2VgIHRvIHByZXZlbnQgdHJhdmVyc2FsIG9mIGEgZ2l2ZW4gbm9kZSdzIGNoaWxkcmVuLlxuICAgICovXG4gICAgZGVzY2VuZGFudHMoZikge1xuICAgICAgICB0aGlzLm5vZGVzQmV0d2VlbigwLCB0aGlzLnNpemUsIGYpO1xuICAgIH1cbiAgICAvKipcbiAgICBFeHRyYWN0IHRoZSB0ZXh0IGJldHdlZW4gYGZyb21gIGFuZCBgdG9gLiBTZWUgdGhlIHNhbWUgbWV0aG9kIG9uXG4gICAgW2BOb2RlYF0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGUudGV4dEJldHdlZW4pLlxuICAgICovXG4gICAgdGV4dEJldHdlZW4oZnJvbSwgdG8sIGJsb2NrU2VwYXJhdG9yLCBsZWFmVGV4dCkge1xuICAgICAgICBsZXQgdGV4dCA9IFwiXCIsIGZpcnN0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5ub2Rlc0JldHdlZW4oZnJvbSwgdG8sIChub2RlLCBwb3MpID0+IHtcbiAgICAgICAgICAgIGxldCBub2RlVGV4dCA9IG5vZGUuaXNUZXh0ID8gbm9kZS50ZXh0LnNsaWNlKE1hdGgubWF4KGZyb20sIHBvcykgLSBwb3MsIHRvIC0gcG9zKVxuICAgICAgICAgICAgICAgIDogIW5vZGUuaXNMZWFmID8gXCJcIlxuICAgICAgICAgICAgICAgICAgICA6IGxlYWZUZXh0ID8gKHR5cGVvZiBsZWFmVGV4dCA9PT0gXCJmdW5jdGlvblwiID8gbGVhZlRleHQobm9kZSkgOiBsZWFmVGV4dClcbiAgICAgICAgICAgICAgICAgICAgICAgIDogbm9kZS50eXBlLnNwZWMubGVhZlRleHQgPyBub2RlLnR5cGUuc3BlYy5sZWFmVGV4dChub2RlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogXCJcIjtcbiAgICAgICAgICAgIGlmIChub2RlLmlzQmxvY2sgJiYgKG5vZGUuaXNMZWFmICYmIG5vZGVUZXh0IHx8IG5vZGUuaXNUZXh0YmxvY2spICYmIGJsb2NrU2VwYXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0KVxuICAgICAgICAgICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdGV4dCArPSBibG9ja1NlcGFyYXRvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRleHQgKz0gbm9kZVRleHQ7XG4gICAgICAgIH0sIDApO1xuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgbmV3IGZyYWdtZW50IGNvbnRhaW5pbmcgdGhlIGNvbWJpbmVkIGNvbnRlbnQgb2YgdGhpc1xuICAgIGZyYWdtZW50IGFuZCB0aGUgb3RoZXIuXG4gICAgKi9cbiAgICBhcHBlbmQob3RoZXIpIHtcbiAgICAgICAgaWYgKCFvdGhlci5zaXplKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIGlmICghdGhpcy5zaXplKVxuICAgICAgICAgICAgcmV0dXJuIG90aGVyO1xuICAgICAgICBsZXQgbGFzdCA9IHRoaXMubGFzdENoaWxkLCBmaXJzdCA9IG90aGVyLmZpcnN0Q2hpbGQsIGNvbnRlbnQgPSB0aGlzLmNvbnRlbnQuc2xpY2UoKSwgaSA9IDA7XG4gICAgICAgIGlmIChsYXN0LmlzVGV4dCAmJiBsYXN0LnNhbWVNYXJrdXAoZmlyc3QpKSB7XG4gICAgICAgICAgICBjb250ZW50W2NvbnRlbnQubGVuZ3RoIC0gMV0gPSBsYXN0LndpdGhUZXh0KGxhc3QudGV4dCArIGZpcnN0LnRleHQpO1xuICAgICAgICAgICAgaSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICg7IGkgPCBvdGhlci5jb250ZW50Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgY29udGVudC5wdXNoKG90aGVyLmNvbnRlbnRbaV0pO1xuICAgICAgICByZXR1cm4gbmV3IEZyYWdtZW50KGNvbnRlbnQsIHRoaXMuc2l6ZSArIG90aGVyLnNpemUpO1xuICAgIH1cbiAgICAvKipcbiAgICBDdXQgb3V0IHRoZSBzdWItZnJhZ21lbnQgYmV0d2VlbiB0aGUgdHdvIGdpdmVuIHBvc2l0aW9ucy5cbiAgICAqL1xuICAgIGN1dChmcm9tLCB0byA9IHRoaXMuc2l6ZSkge1xuICAgICAgICBpZiAoZnJvbSA9PSAwICYmIHRvID09IHRoaXMuc2l6ZSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICBsZXQgcmVzdWx0ID0gW10sIHNpemUgPSAwO1xuICAgICAgICBpZiAodG8gPiBmcm9tKVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIHBvcyA9IDA7IHBvcyA8IHRvOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgY2hpbGQgPSB0aGlzLmNvbnRlbnRbaV0sIGVuZCA9IHBvcyArIGNoaWxkLm5vZGVTaXplO1xuICAgICAgICAgICAgICAgIGlmIChlbmQgPiBmcm9tKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3MgPCBmcm9tIHx8IGVuZCA+IHRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQuaXNUZXh0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkID0gY2hpbGQuY3V0KE1hdGgubWF4KDAsIGZyb20gLSBwb3MpLCBNYXRoLm1pbihjaGlsZC50ZXh0Lmxlbmd0aCwgdG8gLSBwb3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IGNoaWxkLmN1dChNYXRoLm1heCgwLCBmcm9tIC0gcG9zIC0gMSksIE1hdGgubWluKGNoaWxkLmNvbnRlbnQuc2l6ZSwgdG8gLSBwb3MgLSAxKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICBzaXplICs9IGNoaWxkLm5vZGVTaXplO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwb3MgPSBlbmQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgRnJhZ21lbnQocmVzdWx0LCBzaXplKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBjdXRCeUluZGV4KGZyb20sIHRvKSB7XG4gICAgICAgIGlmIChmcm9tID09IHRvKVxuICAgICAgICAgICAgcmV0dXJuIEZyYWdtZW50LmVtcHR5O1xuICAgICAgICBpZiAoZnJvbSA9PSAwICYmIHRvID09IHRoaXMuY29udGVudC5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgcmV0dXJuIG5ldyBGcmFnbWVudCh0aGlzLmNvbnRlbnQuc2xpY2UoZnJvbSwgdG8pKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgbmV3IGZyYWdtZW50IGluIHdoaWNoIHRoZSBub2RlIGF0IHRoZSBnaXZlbiBpbmRleCBpc1xuICAgIHJlcGxhY2VkIGJ5IHRoZSBnaXZlbiBub2RlLlxuICAgICovXG4gICAgcmVwbGFjZUNoaWxkKGluZGV4LCBub2RlKSB7XG4gICAgICAgIGxldCBjdXJyZW50ID0gdGhpcy5jb250ZW50W2luZGV4XTtcbiAgICAgICAgaWYgKGN1cnJlbnQgPT0gbm9kZSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICBsZXQgY29weSA9IHRoaXMuY29udGVudC5zbGljZSgpO1xuICAgICAgICBsZXQgc2l6ZSA9IHRoaXMuc2l6ZSArIG5vZGUubm9kZVNpemUgLSBjdXJyZW50Lm5vZGVTaXplO1xuICAgICAgICBjb3B5W2luZGV4XSA9IG5vZGU7XG4gICAgICAgIHJldHVybiBuZXcgRnJhZ21lbnQoY29weSwgc2l6ZSk7XG4gICAgfVxuICAgIC8qKlxuICAgIENyZWF0ZSBhIG5ldyBmcmFnbWVudCBieSBwcmVwZW5kaW5nIHRoZSBnaXZlbiBub2RlIHRvIHRoaXNcbiAgICBmcmFnbWVudC5cbiAgICAqL1xuICAgIGFkZFRvU3RhcnQobm9kZSkge1xuICAgICAgICByZXR1cm4gbmV3IEZyYWdtZW50KFtub2RlXS5jb25jYXQodGhpcy5jb250ZW50KSwgdGhpcy5zaXplICsgbm9kZS5ub2RlU2l6ZSk7XG4gICAgfVxuICAgIC8qKlxuICAgIENyZWF0ZSBhIG5ldyBmcmFnbWVudCBieSBhcHBlbmRpbmcgdGhlIGdpdmVuIG5vZGUgdG8gdGhpc1xuICAgIGZyYWdtZW50LlxuICAgICovXG4gICAgYWRkVG9FbmQobm9kZSkge1xuICAgICAgICByZXR1cm4gbmV3IEZyYWdtZW50KHRoaXMuY29udGVudC5jb25jYXQobm9kZSksIHRoaXMuc2l6ZSArIG5vZGUubm9kZVNpemUpO1xuICAgIH1cbiAgICAvKipcbiAgICBDb21wYXJlIHRoaXMgZnJhZ21lbnQgdG8gYW5vdGhlciBvbmUuXG4gICAgKi9cbiAgICBlcShvdGhlcikge1xuICAgICAgICBpZiAodGhpcy5jb250ZW50Lmxlbmd0aCAhPSBvdGhlci5jb250ZW50Lmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvbnRlbnQubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBpZiAoIXRoaXMuY29udGVudFtpXS5lcShvdGhlci5jb250ZW50W2ldKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKipcbiAgICBUaGUgZmlyc3QgY2hpbGQgb2YgdGhlIGZyYWdtZW50LCBvciBgbnVsbGAgaWYgaXQgaXMgZW1wdHkuXG4gICAgKi9cbiAgICBnZXQgZmlyc3RDaGlsZCgpIHsgcmV0dXJuIHRoaXMuY29udGVudC5sZW5ndGggPyB0aGlzLmNvbnRlbnRbMF0gOiBudWxsOyB9XG4gICAgLyoqXG4gICAgVGhlIGxhc3QgY2hpbGQgb2YgdGhlIGZyYWdtZW50LCBvciBgbnVsbGAgaWYgaXQgaXMgZW1wdHkuXG4gICAgKi9cbiAgICBnZXQgbGFzdENoaWxkKCkgeyByZXR1cm4gdGhpcy5jb250ZW50Lmxlbmd0aCA/IHRoaXMuY29udGVudFt0aGlzLmNvbnRlbnQubGVuZ3RoIC0gMV0gOiBudWxsOyB9XG4gICAgLyoqXG4gICAgVGhlIG51bWJlciBvZiBjaGlsZCBub2RlcyBpbiB0aGlzIGZyYWdtZW50LlxuICAgICovXG4gICAgZ2V0IGNoaWxkQ291bnQoKSB7IHJldHVybiB0aGlzLmNvbnRlbnQubGVuZ3RoOyB9XG4gICAgLyoqXG4gICAgR2V0IHRoZSBjaGlsZCBub2RlIGF0IHRoZSBnaXZlbiBpbmRleC4gUmFpc2UgYW4gZXJyb3Igd2hlbiB0aGVcbiAgICBpbmRleCBpcyBvdXQgb2YgcmFuZ2UuXG4gICAgKi9cbiAgICBjaGlsZChpbmRleCkge1xuICAgICAgICBsZXQgZm91bmQgPSB0aGlzLmNvbnRlbnRbaW5kZXhdO1xuICAgICAgICBpZiAoIWZvdW5kKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbmRleCBcIiArIGluZGV4ICsgXCIgb3V0IG9mIHJhbmdlIGZvciBcIiArIHRoaXMpO1xuICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgfVxuICAgIC8qKlxuICAgIEdldCB0aGUgY2hpbGQgbm9kZSBhdCB0aGUgZ2l2ZW4gaW5kZXgsIGlmIGl0IGV4aXN0cy5cbiAgICAqL1xuICAgIG1heWJlQ2hpbGQoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudFtpbmRleF0gfHwgbnVsbDtcbiAgICB9XG4gICAgLyoqXG4gICAgQ2FsbCBgZmAgZm9yIGV2ZXJ5IGNoaWxkIG5vZGUsIHBhc3NpbmcgdGhlIG5vZGUsIGl0cyBvZmZzZXRcbiAgICBpbnRvIHRoaXMgcGFyZW50IG5vZGUsIGFuZCBpdHMgaW5kZXguXG4gICAgKi9cbiAgICBmb3JFYWNoKGYpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIHAgPSAwOyBpIDwgdGhpcy5jb250ZW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgY2hpbGQgPSB0aGlzLmNvbnRlbnRbaV07XG4gICAgICAgICAgICBmKGNoaWxkLCBwLCBpKTtcbiAgICAgICAgICAgIHAgKz0gY2hpbGQubm9kZVNpemU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgRmluZCB0aGUgZmlyc3QgcG9zaXRpb24gYXQgd2hpY2ggdGhpcyBmcmFnbWVudCBhbmQgYW5vdGhlclxuICAgIGZyYWdtZW50IGRpZmZlciwgb3IgYG51bGxgIGlmIHRoZXkgYXJlIHRoZSBzYW1lLlxuICAgICovXG4gICAgZmluZERpZmZTdGFydChvdGhlciwgcG9zID0gMCkge1xuICAgICAgICByZXR1cm4gZmluZERpZmZTdGFydCh0aGlzLCBvdGhlciwgcG9zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgRmluZCB0aGUgZmlyc3QgcG9zaXRpb24sIHNlYXJjaGluZyBmcm9tIHRoZSBlbmQsIGF0IHdoaWNoIHRoaXNcbiAgICBmcmFnbWVudCBhbmQgdGhlIGdpdmVuIGZyYWdtZW50IGRpZmZlciwgb3IgYG51bGxgIGlmIHRoZXkgYXJlXG4gICAgdGhlIHNhbWUuIFNpbmNlIHRoaXMgcG9zaXRpb24gd2lsbCBub3QgYmUgdGhlIHNhbWUgaW4gYm90aFxuICAgIG5vZGVzLCBhbiBvYmplY3Qgd2l0aCB0d28gc2VwYXJhdGUgcG9zaXRpb25zIGlzIHJldHVybmVkLlxuICAgICovXG4gICAgZmluZERpZmZFbmQob3RoZXIsIHBvcyA9IHRoaXMuc2l6ZSwgb3RoZXJQb3MgPSBvdGhlci5zaXplKSB7XG4gICAgICAgIHJldHVybiBmaW5kRGlmZkVuZCh0aGlzLCBvdGhlciwgcG9zLCBvdGhlclBvcyk7XG4gICAgfVxuICAgIC8qKlxuICAgIEZpbmQgdGhlIGluZGV4IGFuZCBpbm5lciBvZmZzZXQgY29ycmVzcG9uZGluZyB0byBhIGdpdmVuIHJlbGF0aXZlXG4gICAgcG9zaXRpb24gaW4gdGhpcyBmcmFnbWVudC4gVGhlIHJlc3VsdCBvYmplY3Qgd2lsbCBiZSByZXVzZWRcbiAgICAob3ZlcndyaXR0ZW4pIHRoZSBuZXh0IHRpbWUgdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZC4gQGludGVybmFsXG4gICAgKi9cbiAgICBmaW5kSW5kZXgocG9zLCByb3VuZCA9IC0xKSB7XG4gICAgICAgIGlmIChwb3MgPT0gMClcbiAgICAgICAgICAgIHJldHVybiByZXRJbmRleCgwLCBwb3MpO1xuICAgICAgICBpZiAocG9zID09IHRoaXMuc2l6ZSlcbiAgICAgICAgICAgIHJldHVybiByZXRJbmRleCh0aGlzLmNvbnRlbnQubGVuZ3RoLCBwb3MpO1xuICAgICAgICBpZiAocG9zID4gdGhpcy5zaXplIHx8IHBvcyA8IDApXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgUG9zaXRpb24gJHtwb3N9IG91dHNpZGUgb2YgZnJhZ21lbnQgKCR7dGhpc30pYCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBjdXJQb3MgPSAwOzsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgY3VyID0gdGhpcy5jaGlsZChpKSwgZW5kID0gY3VyUG9zICsgY3VyLm5vZGVTaXplO1xuICAgICAgICAgICAgaWYgKGVuZCA+PSBwb3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZW5kID09IHBvcyB8fCByb3VuZCA+IDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXRJbmRleChpICsgMSwgZW5kKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0SW5kZXgoaSwgY3VyUG9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1clBvcyA9IGVuZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICBSZXR1cm4gYSBkZWJ1Z2dpbmcgc3RyaW5nIHRoYXQgZGVzY3JpYmVzIHRoaXMgZnJhZ21lbnQuXG4gICAgKi9cbiAgICB0b1N0cmluZygpIHsgcmV0dXJuIFwiPFwiICsgdGhpcy50b1N0cmluZ0lubmVyKCkgKyBcIj5cIjsgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgdG9TdHJpbmdJbm5lcigpIHsgcmV0dXJuIHRoaXMuY29udGVudC5qb2luKFwiLCBcIik7IH1cbiAgICAvKipcbiAgICBDcmVhdGUgYSBKU09OLXNlcmlhbGl6ZWFibGUgcmVwcmVzZW50YXRpb24gb2YgdGhpcyBmcmFnbWVudC5cbiAgICAqL1xuICAgIHRvSlNPTigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudC5sZW5ndGggPyB0aGlzLmNvbnRlbnQubWFwKG4gPT4gbi50b0pTT04oKSkgOiBudWxsO1xuICAgIH1cbiAgICAvKipcbiAgICBEZXNlcmlhbGl6ZSBhIGZyYWdtZW50IGZyb20gaXRzIEpTT04gcmVwcmVzZW50YXRpb24uXG4gICAgKi9cbiAgICBzdGF0aWMgZnJvbUpTT04oc2NoZW1hLCB2YWx1ZSkge1xuICAgICAgICBpZiAoIXZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIEZyYWdtZW50LmVtcHR5O1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbnZhbGlkIGlucHV0IGZvciBGcmFnbWVudC5mcm9tSlNPTlwiKTtcbiAgICAgICAgcmV0dXJuIG5ldyBGcmFnbWVudCh2YWx1ZS5tYXAoc2NoZW1hLm5vZGVGcm9tSlNPTikpO1xuICAgIH1cbiAgICAvKipcbiAgICBCdWlsZCBhIGZyYWdtZW50IGZyb20gYW4gYXJyYXkgb2Ygbm9kZXMuIEVuc3VyZXMgdGhhdCBhZGphY2VudFxuICAgIHRleHQgbm9kZXMgd2l0aCB0aGUgc2FtZSBtYXJrcyBhcmUgam9pbmVkIHRvZ2V0aGVyLlxuICAgICovXG4gICAgc3RhdGljIGZyb21BcnJheShhcnJheSkge1xuICAgICAgICBpZiAoIWFycmF5Lmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiBGcmFnbWVudC5lbXB0eTtcbiAgICAgICAgbGV0IGpvaW5lZCwgc2l6ZSA9IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBub2RlID0gYXJyYXlbaV07XG4gICAgICAgICAgICBzaXplICs9IG5vZGUubm9kZVNpemU7XG4gICAgICAgICAgICBpZiAoaSAmJiBub2RlLmlzVGV4dCAmJiBhcnJheVtpIC0gMV0uc2FtZU1hcmt1cChub2RlKSkge1xuICAgICAgICAgICAgICAgIGlmICgham9pbmVkKVxuICAgICAgICAgICAgICAgICAgICBqb2luZWQgPSBhcnJheS5zbGljZSgwLCBpKTtcbiAgICAgICAgICAgICAgICBqb2luZWRbam9pbmVkLmxlbmd0aCAtIDFdID0gbm9kZVxuICAgICAgICAgICAgICAgICAgICAud2l0aFRleHQoam9pbmVkW2pvaW5lZC5sZW5ndGggLSAxXS50ZXh0ICsgbm9kZS50ZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGpvaW5lZCkge1xuICAgICAgICAgICAgICAgIGpvaW5lZC5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgRnJhZ21lbnQoam9pbmVkIHx8IGFycmF5LCBzaXplKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgZnJhZ21lbnQgZnJvbSBzb21ldGhpbmcgdGhhdCBjYW4gYmUgaW50ZXJwcmV0ZWQgYXMgYVxuICAgIHNldCBvZiBub2Rlcy4gRm9yIGBudWxsYCwgaXQgcmV0dXJucyB0aGUgZW1wdHkgZnJhZ21lbnQuIEZvciBhXG4gICAgZnJhZ21lbnQsIHRoZSBmcmFnbWVudCBpdHNlbGYuIEZvciBhIG5vZGUgb3IgYXJyYXkgb2Ygbm9kZXMsIGFcbiAgICBmcmFnbWVudCBjb250YWluaW5nIHRob3NlIG5vZGVzLlxuICAgICovXG4gICAgc3RhdGljIGZyb20obm9kZXMpIHtcbiAgICAgICAgaWYgKCFub2RlcylcbiAgICAgICAgICAgIHJldHVybiBGcmFnbWVudC5lbXB0eTtcbiAgICAgICAgaWYgKG5vZGVzIGluc3RhbmNlb2YgRnJhZ21lbnQpXG4gICAgICAgICAgICByZXR1cm4gbm9kZXM7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5vZGVzKSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZyb21BcnJheShub2Rlcyk7XG4gICAgICAgIGlmIChub2Rlcy5hdHRycylcbiAgICAgICAgICAgIHJldHVybiBuZXcgRnJhZ21lbnQoW25vZGVzXSwgbm9kZXMubm9kZVNpemUpO1xuICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkNhbiBub3QgY29udmVydCBcIiArIG5vZGVzICsgXCIgdG8gYSBGcmFnbWVudFwiICtcbiAgICAgICAgICAgIChub2Rlcy5ub2Rlc0JldHdlZW4gPyBcIiAobG9va3MgbGlrZSBtdWx0aXBsZSB2ZXJzaW9ucyBvZiBwcm9zZW1pcnJvci1tb2RlbCB3ZXJlIGxvYWRlZClcIiA6IFwiXCIpKTtcbiAgICB9XG59XG4vKipcbkFuIGVtcHR5IGZyYWdtZW50LiBJbnRlbmRlZCB0byBiZSByZXVzZWQgd2hlbmV2ZXIgYSBub2RlIGRvZXNuJ3RcbmNvbnRhaW4gYW55dGhpbmcgKHJhdGhlciB0aGFuIGFsbG9jYXRpbmcgYSBuZXcgZW1wdHkgZnJhZ21lbnQgZm9yXG5lYWNoIGxlYWYgbm9kZSkuXG4qL1xuRnJhZ21lbnQuZW1wdHkgPSBuZXcgRnJhZ21lbnQoW10sIDApO1xuY29uc3QgZm91bmQgPSB7IGluZGV4OiAwLCBvZmZzZXQ6IDAgfTtcbmZ1bmN0aW9uIHJldEluZGV4KGluZGV4LCBvZmZzZXQpIHtcbiAgICBmb3VuZC5pbmRleCA9IGluZGV4O1xuICAgIGZvdW5kLm9mZnNldCA9IG9mZnNldDtcbiAgICByZXR1cm4gZm91bmQ7XG59XG5cbmZ1bmN0aW9uIGNvbXBhcmVEZWVwKGEsIGIpIHtcbiAgICBpZiAoYSA9PT0gYilcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgaWYgKCEoYSAmJiB0eXBlb2YgYSA9PSBcIm9iamVjdFwiKSB8fFxuICAgICAgICAhKGIgJiYgdHlwZW9mIGIgPT0gXCJvYmplY3RcIikpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBsZXQgYXJyYXkgPSBBcnJheS5pc0FycmF5KGEpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGIpICE9IGFycmF5KVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGFycmF5KSB7XG4gICAgICAgIGlmIChhLmxlbmd0aCAhPSBiLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaWYgKCFjb21wYXJlRGVlcChhW2ldLCBiW2ldKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBwIGluIGEpXG4gICAgICAgICAgICBpZiAoIShwIGluIGIpIHx8ICFjb21wYXJlRGVlcChhW3BdLCBiW3BdKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGZvciAobGV0IHAgaW4gYilcbiAgICAgICAgICAgIGlmICghKHAgaW4gYSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG5BIG1hcmsgaXMgYSBwaWVjZSBvZiBpbmZvcm1hdGlvbiB0aGF0IGNhbiBiZSBhdHRhY2hlZCB0byBhIG5vZGUsXG5zdWNoIGFzIGl0IGJlaW5nIGVtcGhhc2l6ZWQsIGluIGNvZGUgZm9udCwgb3IgYSBsaW5rLiBJdCBoYXMgYVxudHlwZSBhbmQgb3B0aW9uYWxseSBhIHNldCBvZiBhdHRyaWJ1dGVzIHRoYXQgcHJvdmlkZSBmdXJ0aGVyXG5pbmZvcm1hdGlvbiAoc3VjaCBhcyB0aGUgdGFyZ2V0IG9mIHRoZSBsaW5rKS4gTWFya3MgYXJlIGNyZWF0ZWRcbnRocm91Z2ggYSBgU2NoZW1hYCwgd2hpY2ggY29udHJvbHMgd2hpY2ggdHlwZXMgZXhpc3QgYW5kIHdoaWNoXG5hdHRyaWJ1dGVzIHRoZXkgaGF2ZS5cbiovXG5jbGFzcyBNYXJrIHtcbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgIFRoZSB0eXBlIG9mIHRoaXMgbWFyay5cbiAgICAqL1xuICAgIHR5cGUsIFxuICAgIC8qKlxuICAgIFRoZSBhdHRyaWJ1dGVzIGFzc29jaWF0ZWQgd2l0aCB0aGlzIG1hcmsuXG4gICAgKi9cbiAgICBhdHRycykge1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgICB0aGlzLmF0dHJzID0gYXR0cnM7XG4gICAgfVxuICAgIC8qKlxuICAgIEdpdmVuIGEgc2V0IG9mIG1hcmtzLCBjcmVhdGUgYSBuZXcgc2V0IHdoaWNoIGNvbnRhaW5zIHRoaXMgb25lIGFzXG4gICAgd2VsbCwgaW4gdGhlIHJpZ2h0IHBvc2l0aW9uLiBJZiB0aGlzIG1hcmsgaXMgYWxyZWFkeSBpbiB0aGUgc2V0LFxuICAgIHRoZSBzZXQgaXRzZWxmIGlzIHJldHVybmVkLiBJZiBhbnkgbWFya3MgdGhhdCBhcmUgc2V0IHRvIGJlXG4gICAgW2V4Y2x1c2l2ZV0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk1hcmtTcGVjLmV4Y2x1ZGVzKSB3aXRoIHRoaXMgbWFyayBhcmUgcHJlc2VudCxcbiAgICB0aG9zZSBhcmUgcmVwbGFjZWQgYnkgdGhpcyBvbmUuXG4gICAgKi9cbiAgICBhZGRUb1NldChzZXQpIHtcbiAgICAgICAgbGV0IGNvcHksIHBsYWNlZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNldC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IG90aGVyID0gc2V0W2ldO1xuICAgICAgICAgICAgaWYgKHRoaXMuZXEob3RoZXIpKVxuICAgICAgICAgICAgICAgIHJldHVybiBzZXQ7XG4gICAgICAgICAgICBpZiAodGhpcy50eXBlLmV4Y2x1ZGVzKG90aGVyLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb3B5KVxuICAgICAgICAgICAgICAgICAgICBjb3B5ID0gc2V0LnNsaWNlKDAsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAob3RoZXIudHlwZS5leGNsdWRlcyh0aGlzLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghcGxhY2VkICYmIG90aGVyLnR5cGUucmFuayA+IHRoaXMudHlwZS5yYW5rKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY29weSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvcHkgPSBzZXQuc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICAgICAgICAgIGNvcHkucHVzaCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgcGxhY2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGNvcHkpXG4gICAgICAgICAgICAgICAgICAgIGNvcHkucHVzaChvdGhlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjb3B5KVxuICAgICAgICAgICAgY29weSA9IHNldC5zbGljZSgpO1xuICAgICAgICBpZiAoIXBsYWNlZClcbiAgICAgICAgICAgIGNvcHkucHVzaCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgfVxuICAgIC8qKlxuICAgIFJlbW92ZSB0aGlzIG1hcmsgZnJvbSB0aGUgZ2l2ZW4gc2V0LCByZXR1cm5pbmcgYSBuZXcgc2V0LiBJZiB0aGlzXG4gICAgbWFyayBpcyBub3QgaW4gdGhlIHNldCwgdGhlIHNldCBpdHNlbGYgaXMgcmV0dXJuZWQuXG4gICAgKi9cbiAgICByZW1vdmVGcm9tU2V0KHNldCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNldC5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIGlmICh0aGlzLmVxKHNldFtpXSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldC5zbGljZSgwLCBpKS5jb25jYXQoc2V0LnNsaWNlKGkgKyAxKSk7XG4gICAgICAgIHJldHVybiBzZXQ7XG4gICAgfVxuICAgIC8qKlxuICAgIFRlc3Qgd2hldGhlciB0aGlzIG1hcmsgaXMgaW4gdGhlIGdpdmVuIHNldCBvZiBtYXJrcy5cbiAgICAqL1xuICAgIGlzSW5TZXQoc2V0KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2V0Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaWYgKHRoaXMuZXEoc2V0W2ldKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvKipcbiAgICBUZXN0IHdoZXRoZXIgdGhpcyBtYXJrIGhhcyB0aGUgc2FtZSB0eXBlIGFuZCBhdHRyaWJ1dGVzIGFzXG4gICAgYW5vdGhlciBtYXJrLlxuICAgICovXG4gICAgZXEob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMgPT0gb3RoZXIgfHxcbiAgICAgICAgICAgICh0aGlzLnR5cGUgPT0gb3RoZXIudHlwZSAmJiBjb21wYXJlRGVlcCh0aGlzLmF0dHJzLCBvdGhlci5hdHRycykpO1xuICAgIH1cbiAgICAvKipcbiAgICBDb252ZXJ0IHRoaXMgbWFyayB0byBhIEpTT04tc2VyaWFsaXplYWJsZSByZXByZXNlbnRhdGlvbi5cbiAgICAqL1xuICAgIHRvSlNPTigpIHtcbiAgICAgICAgbGV0IG9iaiA9IHsgdHlwZTogdGhpcy50eXBlLm5hbWUgfTtcbiAgICAgICAgZm9yIChsZXQgXyBpbiB0aGlzLmF0dHJzKSB7XG4gICAgICAgICAgICBvYmouYXR0cnMgPSB0aGlzLmF0dHJzO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG4gICAgLyoqXG4gICAgRGVzZXJpYWxpemUgYSBtYXJrIGZyb20gSlNPTi5cbiAgICAqL1xuICAgIHN0YXRpYyBmcm9tSlNPTihzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgaWYgKCFqc29uKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbnZhbGlkIGlucHV0IGZvciBNYXJrLmZyb21KU09OXCIpO1xuICAgICAgICBsZXQgdHlwZSA9IHNjaGVtYS5tYXJrc1tqc29uLnR5cGVdO1xuICAgICAgICBpZiAoIXR5cGUpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgVGhlcmUgaXMgbm8gbWFyayB0eXBlICR7anNvbi50eXBlfSBpbiB0aGlzIHNjaGVtYWApO1xuICAgICAgICBsZXQgbWFyayA9IHR5cGUuY3JlYXRlKGpzb24uYXR0cnMpO1xuICAgICAgICB0eXBlLmNoZWNrQXR0cnMobWFyay5hdHRycyk7XG4gICAgICAgIHJldHVybiBtYXJrO1xuICAgIH1cbiAgICAvKipcbiAgICBUZXN0IHdoZXRoZXIgdHdvIHNldHMgb2YgbWFya3MgYXJlIGlkZW50aWNhbC5cbiAgICAqL1xuICAgIHN0YXRpYyBzYW1lU2V0KGEsIGIpIHtcbiAgICAgICAgaWYgKGEgPT0gYilcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBpZiAoYS5sZW5ndGggIT0gYi5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIGlmICghYVtpXS5lcShiW2ldKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKipcbiAgICBDcmVhdGUgYSBwcm9wZXJseSBzb3J0ZWQgbWFyayBzZXQgZnJvbSBudWxsLCBhIHNpbmdsZSBtYXJrLCBvciBhblxuICAgIHVuc29ydGVkIGFycmF5IG9mIG1hcmtzLlxuICAgICovXG4gICAgc3RhdGljIHNldEZyb20obWFya3MpIHtcbiAgICAgICAgaWYgKCFtYXJrcyB8fCBBcnJheS5pc0FycmF5KG1hcmtzKSAmJiBtYXJrcy5sZW5ndGggPT0gMClcbiAgICAgICAgICAgIHJldHVybiBNYXJrLm5vbmU7XG4gICAgICAgIGlmIChtYXJrcyBpbnN0YW5jZW9mIE1hcmspXG4gICAgICAgICAgICByZXR1cm4gW21hcmtzXTtcbiAgICAgICAgbGV0IGNvcHkgPSBtYXJrcy5zbGljZSgpO1xuICAgICAgICBjb3B5LnNvcnQoKGEsIGIpID0+IGEudHlwZS5yYW5rIC0gYi50eXBlLnJhbmspO1xuICAgICAgICByZXR1cm4gY29weTtcbiAgICB9XG59XG4vKipcblRoZSBlbXB0eSBzZXQgb2YgbWFya3MuXG4qL1xuTWFyay5ub25lID0gW107XG5cbi8qKlxuRXJyb3IgdHlwZSByYWlzZWQgYnkgW2BOb2RlLnJlcGxhY2VgXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTm9kZS5yZXBsYWNlKSB3aGVuXG5naXZlbiBhbiBpbnZhbGlkIHJlcGxhY2VtZW50LlxuKi9cbmNsYXNzIFJlcGxhY2VFcnJvciBleHRlbmRzIEVycm9yIHtcbn1cbi8qXG5SZXBsYWNlRXJyb3IgPSBmdW5jdGlvbih0aGlzOiBhbnksIG1lc3NhZ2U6IHN0cmluZykge1xuICBsZXQgZXJyID0gRXJyb3IuY2FsbCh0aGlzLCBtZXNzYWdlKVxuICA7KGVyciBhcyBhbnkpLl9fcHJvdG9fXyA9IFJlcGxhY2VFcnJvci5wcm90b3R5cGVcbiAgcmV0dXJuIGVyclxufSBhcyBhbnlcblxuUmVwbGFjZUVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKVxuUmVwbGFjZUVycm9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlcGxhY2VFcnJvclxuUmVwbGFjZUVycm9yLnByb3RvdHlwZS5uYW1lID0gXCJSZXBsYWNlRXJyb3JcIlxuKi9cbi8qKlxuQSBzbGljZSByZXByZXNlbnRzIGEgcGllY2UgY3V0IG91dCBvZiBhIGxhcmdlciBkb2N1bWVudC4gSXRcbnN0b3JlcyBub3Qgb25seSBhIGZyYWdtZW50LCBidXQgYWxzbyB0aGUgZGVwdGggdXAgdG8gd2hpY2ggbm9kZXMgb25cbmJvdGggc2lkZSBhcmUgXHUyMDE4b3Blblx1MjAxOSAoY3V0IHRocm91Z2gpLlxuKi9cbmNsYXNzIFNsaWNlIHtcbiAgICAvKipcbiAgICBDcmVhdGUgYSBzbGljZS4gV2hlbiBzcGVjaWZ5aW5nIGEgbm9uLXplcm8gb3BlbiBkZXB0aCwgeW91IG11c3RcbiAgICBtYWtlIHN1cmUgdGhhdCB0aGVyZSBhcmUgbm9kZXMgb2YgYXQgbGVhc3QgdGhhdCBkZXB0aCBhdCB0aGVcbiAgICBhcHByb3ByaWF0ZSBzaWRlIG9mIHRoZSBmcmFnbWVudFx1MjAxNGkuZS4gaWYgdGhlIGZyYWdtZW50IGlzIGFuXG4gICAgZW1wdHkgcGFyYWdyYXBoIG5vZGUsIGBvcGVuU3RhcnRgIGFuZCBgb3BlbkVuZGAgY2FuJ3QgYmUgZ3JlYXRlclxuICAgIHRoYW4gMS5cbiAgICBcbiAgICBJdCBpcyBub3QgbmVjZXNzYXJ5IGZvciB0aGUgY29udGVudCBvZiBvcGVuIG5vZGVzIHRvIGNvbmZvcm0gdG9cbiAgICB0aGUgc2NoZW1hJ3MgY29udGVudCBjb25zdHJhaW50cywgdGhvdWdoIGl0IHNob3VsZCBiZSBhIHZhbGlkXG4gICAgc3RhcnQvZW5kL21pZGRsZSBmb3Igc3VjaCBhIG5vZGUsIGRlcGVuZGluZyBvbiB3aGljaCBzaWRlcyBhcmVcbiAgICBvcGVuLlxuICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgLyoqXG4gICAgVGhlIHNsaWNlJ3MgY29udGVudC5cbiAgICAqL1xuICAgIGNvbnRlbnQsIFxuICAgIC8qKlxuICAgIFRoZSBvcGVuIGRlcHRoIGF0IHRoZSBzdGFydCBvZiB0aGUgZnJhZ21lbnQuXG4gICAgKi9cbiAgICBvcGVuU3RhcnQsIFxuICAgIC8qKlxuICAgIFRoZSBvcGVuIGRlcHRoIGF0IHRoZSBlbmQuXG4gICAgKi9cbiAgICBvcGVuRW5kKSB7XG4gICAgICAgIHRoaXMuY29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgIHRoaXMub3BlblN0YXJ0ID0gb3BlblN0YXJ0O1xuICAgICAgICB0aGlzLm9wZW5FbmQgPSBvcGVuRW5kO1xuICAgIH1cbiAgICAvKipcbiAgICBUaGUgc2l6ZSB0aGlzIHNsaWNlIHdvdWxkIGFkZCB3aGVuIGluc2VydGVkIGludG8gYSBkb2N1bWVudC5cbiAgICAqL1xuICAgIGdldCBzaXplKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250ZW50LnNpemUgLSB0aGlzLm9wZW5TdGFydCAtIHRoaXMub3BlbkVuZDtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBpbnNlcnRBdChwb3MsIGZyYWdtZW50KSB7XG4gICAgICAgIGxldCBjb250ZW50ID0gaW5zZXJ0SW50byh0aGlzLmNvbnRlbnQsIHBvcyArIHRoaXMub3BlblN0YXJ0LCBmcmFnbWVudCk7XG4gICAgICAgIHJldHVybiBjb250ZW50ICYmIG5ldyBTbGljZShjb250ZW50LCB0aGlzLm9wZW5TdGFydCwgdGhpcy5vcGVuRW5kKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICByZW1vdmVCZXR3ZWVuKGZyb20sIHRvKSB7XG4gICAgICAgIHJldHVybiBuZXcgU2xpY2UocmVtb3ZlUmFuZ2UodGhpcy5jb250ZW50LCBmcm9tICsgdGhpcy5vcGVuU3RhcnQsIHRvICsgdGhpcy5vcGVuU3RhcnQpLCB0aGlzLm9wZW5TdGFydCwgdGhpcy5vcGVuRW5kKTtcbiAgICB9XG4gICAgLyoqXG4gICAgVGVzdHMgd2hldGhlciB0aGlzIHNsaWNlIGlzIGVxdWFsIHRvIGFub3RoZXIgc2xpY2UuXG4gICAgKi9cbiAgICBlcShvdGhlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250ZW50LmVxKG90aGVyLmNvbnRlbnQpICYmIHRoaXMub3BlblN0YXJ0ID09IG90aGVyLm9wZW5TdGFydCAmJiB0aGlzLm9wZW5FbmQgPT0gb3RoZXIub3BlbkVuZDtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudCArIFwiKFwiICsgdGhpcy5vcGVuU3RhcnQgKyBcIixcIiArIHRoaXMub3BlbkVuZCArIFwiKVwiO1xuICAgIH1cbiAgICAvKipcbiAgICBDb252ZXJ0IGEgc2xpY2UgdG8gYSBKU09OLXNlcmlhbGl6YWJsZSByZXByZXNlbnRhdGlvbi5cbiAgICAqL1xuICAgIHRvSlNPTigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRlbnQuc2l6ZSlcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBsZXQganNvbiA9IHsgY29udGVudDogdGhpcy5jb250ZW50LnRvSlNPTigpIH07XG4gICAgICAgIGlmICh0aGlzLm9wZW5TdGFydCA+IDApXG4gICAgICAgICAgICBqc29uLm9wZW5TdGFydCA9IHRoaXMub3BlblN0YXJ0O1xuICAgICAgICBpZiAodGhpcy5vcGVuRW5kID4gMClcbiAgICAgICAgICAgIGpzb24ub3BlbkVuZCA9IHRoaXMub3BlbkVuZDtcbiAgICAgICAgcmV0dXJuIGpzb247XG4gICAgfVxuICAgIC8qKlxuICAgIERlc2VyaWFsaXplIGEgc2xpY2UgZnJvbSBpdHMgSlNPTiByZXByZXNlbnRhdGlvbi5cbiAgICAqL1xuICAgIHN0YXRpYyBmcm9tSlNPTihzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgaWYgKCFqc29uKVxuICAgICAgICAgICAgcmV0dXJuIFNsaWNlLmVtcHR5O1xuICAgICAgICBsZXQgb3BlblN0YXJ0ID0ganNvbi5vcGVuU3RhcnQgfHwgMCwgb3BlbkVuZCA9IGpzb24ub3BlbkVuZCB8fCAwO1xuICAgICAgICBpZiAodHlwZW9mIG9wZW5TdGFydCAhPSBcIm51bWJlclwiIHx8IHR5cGVvZiBvcGVuRW5kICE9IFwibnVtYmVyXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkludmFsaWQgaW5wdXQgZm9yIFNsaWNlLmZyb21KU09OXCIpO1xuICAgICAgICByZXR1cm4gbmV3IFNsaWNlKEZyYWdtZW50LmZyb21KU09OKHNjaGVtYSwganNvbi5jb250ZW50KSwgb3BlblN0YXJ0LCBvcGVuRW5kKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgc2xpY2UgZnJvbSBhIGZyYWdtZW50IGJ5IHRha2luZyB0aGUgbWF4aW11bSBwb3NzaWJsZVxuICAgIG9wZW4gdmFsdWUgb24gYm90aCBzaWRlIG9mIHRoZSBmcmFnbWVudC5cbiAgICAqL1xuICAgIHN0YXRpYyBtYXhPcGVuKGZyYWdtZW50LCBvcGVuSXNvbGF0aW5nID0gdHJ1ZSkge1xuICAgICAgICBsZXQgb3BlblN0YXJ0ID0gMCwgb3BlbkVuZCA9IDA7XG4gICAgICAgIGZvciAobGV0IG4gPSBmcmFnbWVudC5maXJzdENoaWxkOyBuICYmICFuLmlzTGVhZiAmJiAob3Blbklzb2xhdGluZyB8fCAhbi50eXBlLnNwZWMuaXNvbGF0aW5nKTsgbiA9IG4uZmlyc3RDaGlsZClcbiAgICAgICAgICAgIG9wZW5TdGFydCsrO1xuICAgICAgICBmb3IgKGxldCBuID0gZnJhZ21lbnQubGFzdENoaWxkOyBuICYmICFuLmlzTGVhZiAmJiAob3Blbklzb2xhdGluZyB8fCAhbi50eXBlLnNwZWMuaXNvbGF0aW5nKTsgbiA9IG4ubGFzdENoaWxkKVxuICAgICAgICAgICAgb3BlbkVuZCsrO1xuICAgICAgICByZXR1cm4gbmV3IFNsaWNlKGZyYWdtZW50LCBvcGVuU3RhcnQsIG9wZW5FbmQpO1xuICAgIH1cbn1cbi8qKlxuVGhlIGVtcHR5IHNsaWNlLlxuKi9cblNsaWNlLmVtcHR5ID0gbmV3IFNsaWNlKEZyYWdtZW50LmVtcHR5LCAwLCAwKTtcbmZ1bmN0aW9uIHJlbW92ZVJhbmdlKGNvbnRlbnQsIGZyb20sIHRvKSB7XG4gICAgbGV0IHsgaW5kZXgsIG9mZnNldCB9ID0gY29udGVudC5maW5kSW5kZXgoZnJvbSksIGNoaWxkID0gY29udGVudC5tYXliZUNoaWxkKGluZGV4KTtcbiAgICBsZXQgeyBpbmRleDogaW5kZXhUbywgb2Zmc2V0OiBvZmZzZXRUbyB9ID0gY29udGVudC5maW5kSW5kZXgodG8pO1xuICAgIGlmIChvZmZzZXQgPT0gZnJvbSB8fCBjaGlsZC5pc1RleHQpIHtcbiAgICAgICAgaWYgKG9mZnNldFRvICE9IHRvICYmICFjb250ZW50LmNoaWxkKGluZGV4VG8pLmlzVGV4dClcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiUmVtb3Zpbmcgbm9uLWZsYXQgcmFuZ2VcIik7XG4gICAgICAgIHJldHVybiBjb250ZW50LmN1dCgwLCBmcm9tKS5hcHBlbmQoY29udGVudC5jdXQodG8pKTtcbiAgICB9XG4gICAgaWYgKGluZGV4ICE9IGluZGV4VG8pXG4gICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiUmVtb3Zpbmcgbm9uLWZsYXQgcmFuZ2VcIik7XG4gICAgcmV0dXJuIGNvbnRlbnQucmVwbGFjZUNoaWxkKGluZGV4LCBjaGlsZC5jb3B5KHJlbW92ZVJhbmdlKGNoaWxkLmNvbnRlbnQsIGZyb20gLSBvZmZzZXQgLSAxLCB0byAtIG9mZnNldCAtIDEpKSk7XG59XG5mdW5jdGlvbiBpbnNlcnRJbnRvKGNvbnRlbnQsIGRpc3QsIGluc2VydCwgcGFyZW50KSB7XG4gICAgbGV0IHsgaW5kZXgsIG9mZnNldCB9ID0gY29udGVudC5maW5kSW5kZXgoZGlzdCksIGNoaWxkID0gY29udGVudC5tYXliZUNoaWxkKGluZGV4KTtcbiAgICBpZiAob2Zmc2V0ID09IGRpc3QgfHwgY2hpbGQuaXNUZXh0KSB7XG4gICAgICAgIGlmIChwYXJlbnQgJiYgIXBhcmVudC5jYW5SZXBsYWNlKGluZGV4LCBpbmRleCwgaW5zZXJ0KSlcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICByZXR1cm4gY29udGVudC5jdXQoMCwgZGlzdCkuYXBwZW5kKGluc2VydCkuYXBwZW5kKGNvbnRlbnQuY3V0KGRpc3QpKTtcbiAgICB9XG4gICAgbGV0IGlubmVyID0gaW5zZXJ0SW50byhjaGlsZC5jb250ZW50LCBkaXN0IC0gb2Zmc2V0IC0gMSwgaW5zZXJ0KTtcbiAgICByZXR1cm4gaW5uZXIgJiYgY29udGVudC5yZXBsYWNlQ2hpbGQoaW5kZXgsIGNoaWxkLmNvcHkoaW5uZXIpKTtcbn1cbmZ1bmN0aW9uIHJlcGxhY2UoJGZyb20sICR0bywgc2xpY2UpIHtcbiAgICBpZiAoc2xpY2Uub3BlblN0YXJ0ID4gJGZyb20uZGVwdGgpXG4gICAgICAgIHRocm93IG5ldyBSZXBsYWNlRXJyb3IoXCJJbnNlcnRlZCBjb250ZW50IGRlZXBlciB0aGFuIGluc2VydGlvbiBwb3NpdGlvblwiKTtcbiAgICBpZiAoJGZyb20uZGVwdGggLSBzbGljZS5vcGVuU3RhcnQgIT0gJHRvLmRlcHRoIC0gc2xpY2Uub3BlbkVuZClcbiAgICAgICAgdGhyb3cgbmV3IFJlcGxhY2VFcnJvcihcIkluY29uc2lzdGVudCBvcGVuIGRlcHRoc1wiKTtcbiAgICByZXR1cm4gcmVwbGFjZU91dGVyKCRmcm9tLCAkdG8sIHNsaWNlLCAwKTtcbn1cbmZ1bmN0aW9uIHJlcGxhY2VPdXRlcigkZnJvbSwgJHRvLCBzbGljZSwgZGVwdGgpIHtcbiAgICBsZXQgaW5kZXggPSAkZnJvbS5pbmRleChkZXB0aCksIG5vZGUgPSAkZnJvbS5ub2RlKGRlcHRoKTtcbiAgICBpZiAoaW5kZXggPT0gJHRvLmluZGV4KGRlcHRoKSAmJiBkZXB0aCA8ICRmcm9tLmRlcHRoIC0gc2xpY2Uub3BlblN0YXJ0KSB7XG4gICAgICAgIGxldCBpbm5lciA9IHJlcGxhY2VPdXRlcigkZnJvbSwgJHRvLCBzbGljZSwgZGVwdGggKyAxKTtcbiAgICAgICAgcmV0dXJuIG5vZGUuY29weShub2RlLmNvbnRlbnQucmVwbGFjZUNoaWxkKGluZGV4LCBpbm5lcikpO1xuICAgIH1cbiAgICBlbHNlIGlmICghc2xpY2UuY29udGVudC5zaXplKSB7XG4gICAgICAgIHJldHVybiBjbG9zZShub2RlLCByZXBsYWNlVHdvV2F5KCRmcm9tLCAkdG8sIGRlcHRoKSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKCFzbGljZS5vcGVuU3RhcnQgJiYgIXNsaWNlLm9wZW5FbmQgJiYgJGZyb20uZGVwdGggPT0gZGVwdGggJiYgJHRvLmRlcHRoID09IGRlcHRoKSB7IC8vIFNpbXBsZSwgZmxhdCBjYXNlXG4gICAgICAgIGxldCBwYXJlbnQgPSAkZnJvbS5wYXJlbnQsIGNvbnRlbnQgPSBwYXJlbnQuY29udGVudDtcbiAgICAgICAgcmV0dXJuIGNsb3NlKHBhcmVudCwgY29udGVudC5jdXQoMCwgJGZyb20ucGFyZW50T2Zmc2V0KS5hcHBlbmQoc2xpY2UuY29udGVudCkuYXBwZW5kKGNvbnRlbnQuY3V0KCR0by5wYXJlbnRPZmZzZXQpKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBsZXQgeyBzdGFydCwgZW5kIH0gPSBwcmVwYXJlU2xpY2VGb3JSZXBsYWNlKHNsaWNlLCAkZnJvbSk7XG4gICAgICAgIHJldHVybiBjbG9zZShub2RlLCByZXBsYWNlVGhyZWVXYXkoJGZyb20sIHN0YXJ0LCBlbmQsICR0bywgZGVwdGgpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjaGVja0pvaW4obWFpbiwgc3ViKSB7XG4gICAgaWYgKCFzdWIudHlwZS5jb21wYXRpYmxlQ29udGVudChtYWluLnR5cGUpKVxuICAgICAgICB0aHJvdyBuZXcgUmVwbGFjZUVycm9yKFwiQ2Fubm90IGpvaW4gXCIgKyBzdWIudHlwZS5uYW1lICsgXCIgb250byBcIiArIG1haW4udHlwZS5uYW1lKTtcbn1cbmZ1bmN0aW9uIGpvaW5hYmxlKCRiZWZvcmUsICRhZnRlciwgZGVwdGgpIHtcbiAgICBsZXQgbm9kZSA9ICRiZWZvcmUubm9kZShkZXB0aCk7XG4gICAgY2hlY2tKb2luKG5vZGUsICRhZnRlci5ub2RlKGRlcHRoKSk7XG4gICAgcmV0dXJuIG5vZGU7XG59XG5mdW5jdGlvbiBhZGROb2RlKGNoaWxkLCB0YXJnZXQpIHtcbiAgICBsZXQgbGFzdCA9IHRhcmdldC5sZW5ndGggLSAxO1xuICAgIGlmIChsYXN0ID49IDAgJiYgY2hpbGQuaXNUZXh0ICYmIGNoaWxkLnNhbWVNYXJrdXAodGFyZ2V0W2xhc3RdKSlcbiAgICAgICAgdGFyZ2V0W2xhc3RdID0gY2hpbGQud2l0aFRleHQodGFyZ2V0W2xhc3RdLnRleHQgKyBjaGlsZC50ZXh0KTtcbiAgICBlbHNlXG4gICAgICAgIHRhcmdldC5wdXNoKGNoaWxkKTtcbn1cbmZ1bmN0aW9uIGFkZFJhbmdlKCRzdGFydCwgJGVuZCwgZGVwdGgsIHRhcmdldCkge1xuICAgIGxldCBub2RlID0gKCRlbmQgfHwgJHN0YXJ0KS5ub2RlKGRlcHRoKTtcbiAgICBsZXQgc3RhcnRJbmRleCA9IDAsIGVuZEluZGV4ID0gJGVuZCA/ICRlbmQuaW5kZXgoZGVwdGgpIDogbm9kZS5jaGlsZENvdW50O1xuICAgIGlmICgkc3RhcnQpIHtcbiAgICAgICAgc3RhcnRJbmRleCA9ICRzdGFydC5pbmRleChkZXB0aCk7XG4gICAgICAgIGlmICgkc3RhcnQuZGVwdGggPiBkZXB0aCkge1xuICAgICAgICAgICAgc3RhcnRJbmRleCsrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCRzdGFydC50ZXh0T2Zmc2V0KSB7XG4gICAgICAgICAgICBhZGROb2RlKCRzdGFydC5ub2RlQWZ0ZXIsIHRhcmdldCk7XG4gICAgICAgICAgICBzdGFydEluZGV4Kys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBlbmRJbmRleDsgaSsrKVxuICAgICAgICBhZGROb2RlKG5vZGUuY2hpbGQoaSksIHRhcmdldCk7XG4gICAgaWYgKCRlbmQgJiYgJGVuZC5kZXB0aCA9PSBkZXB0aCAmJiAkZW5kLnRleHRPZmZzZXQpXG4gICAgICAgIGFkZE5vZGUoJGVuZC5ub2RlQmVmb3JlLCB0YXJnZXQpO1xufVxuZnVuY3Rpb24gY2xvc2Uobm9kZSwgY29udGVudCkge1xuICAgIG5vZGUudHlwZS5jaGVja0NvbnRlbnQoY29udGVudCk7XG4gICAgcmV0dXJuIG5vZGUuY29weShjb250ZW50KTtcbn1cbmZ1bmN0aW9uIHJlcGxhY2VUaHJlZVdheSgkZnJvbSwgJHN0YXJ0LCAkZW5kLCAkdG8sIGRlcHRoKSB7XG4gICAgbGV0IG9wZW5TdGFydCA9ICRmcm9tLmRlcHRoID4gZGVwdGggJiYgam9pbmFibGUoJGZyb20sICRzdGFydCwgZGVwdGggKyAxKTtcbiAgICBsZXQgb3BlbkVuZCA9ICR0by5kZXB0aCA+IGRlcHRoICYmIGpvaW5hYmxlKCRlbmQsICR0bywgZGVwdGggKyAxKTtcbiAgICBsZXQgY29udGVudCA9IFtdO1xuICAgIGFkZFJhbmdlKG51bGwsICRmcm9tLCBkZXB0aCwgY29udGVudCk7XG4gICAgaWYgKG9wZW5TdGFydCAmJiBvcGVuRW5kICYmICRzdGFydC5pbmRleChkZXB0aCkgPT0gJGVuZC5pbmRleChkZXB0aCkpIHtcbiAgICAgICAgY2hlY2tKb2luKG9wZW5TdGFydCwgb3BlbkVuZCk7XG4gICAgICAgIGFkZE5vZGUoY2xvc2Uob3BlblN0YXJ0LCByZXBsYWNlVGhyZWVXYXkoJGZyb20sICRzdGFydCwgJGVuZCwgJHRvLCBkZXB0aCArIDEpKSwgY29udGVudCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAob3BlblN0YXJ0KVxuICAgICAgICAgICAgYWRkTm9kZShjbG9zZShvcGVuU3RhcnQsIHJlcGxhY2VUd29XYXkoJGZyb20sICRzdGFydCwgZGVwdGggKyAxKSksIGNvbnRlbnQpO1xuICAgICAgICBhZGRSYW5nZSgkc3RhcnQsICRlbmQsIGRlcHRoLCBjb250ZW50KTtcbiAgICAgICAgaWYgKG9wZW5FbmQpXG4gICAgICAgICAgICBhZGROb2RlKGNsb3NlKG9wZW5FbmQsIHJlcGxhY2VUd29XYXkoJGVuZCwgJHRvLCBkZXB0aCArIDEpKSwgY29udGVudCk7XG4gICAgfVxuICAgIGFkZFJhbmdlKCR0bywgbnVsbCwgZGVwdGgsIGNvbnRlbnQpO1xuICAgIHJldHVybiBuZXcgRnJhZ21lbnQoY29udGVudCk7XG59XG5mdW5jdGlvbiByZXBsYWNlVHdvV2F5KCRmcm9tLCAkdG8sIGRlcHRoKSB7XG4gICAgbGV0IGNvbnRlbnQgPSBbXTtcbiAgICBhZGRSYW5nZShudWxsLCAkZnJvbSwgZGVwdGgsIGNvbnRlbnQpO1xuICAgIGlmICgkZnJvbS5kZXB0aCA+IGRlcHRoKSB7XG4gICAgICAgIGxldCB0eXBlID0gam9pbmFibGUoJGZyb20sICR0bywgZGVwdGggKyAxKTtcbiAgICAgICAgYWRkTm9kZShjbG9zZSh0eXBlLCByZXBsYWNlVHdvV2F5KCRmcm9tLCAkdG8sIGRlcHRoICsgMSkpLCBjb250ZW50KTtcbiAgICB9XG4gICAgYWRkUmFuZ2UoJHRvLCBudWxsLCBkZXB0aCwgY29udGVudCk7XG4gICAgcmV0dXJuIG5ldyBGcmFnbWVudChjb250ZW50KTtcbn1cbmZ1bmN0aW9uIHByZXBhcmVTbGljZUZvclJlcGxhY2Uoc2xpY2UsICRhbG9uZykge1xuICAgIGxldCBleHRyYSA9ICRhbG9uZy5kZXB0aCAtIHNsaWNlLm9wZW5TdGFydCwgcGFyZW50ID0gJGFsb25nLm5vZGUoZXh0cmEpO1xuICAgIGxldCBub2RlID0gcGFyZW50LmNvcHkoc2xpY2UuY29udGVudCk7XG4gICAgZm9yIChsZXQgaSA9IGV4dHJhIC0gMTsgaSA+PSAwOyBpLS0pXG4gICAgICAgIG5vZGUgPSAkYWxvbmcubm9kZShpKS5jb3B5KEZyYWdtZW50LmZyb20obm9kZSkpO1xuICAgIHJldHVybiB7IHN0YXJ0OiBub2RlLnJlc29sdmVOb0NhY2hlKHNsaWNlLm9wZW5TdGFydCArIGV4dHJhKSxcbiAgICAgICAgZW5kOiBub2RlLnJlc29sdmVOb0NhY2hlKG5vZGUuY29udGVudC5zaXplIC0gc2xpY2Uub3BlbkVuZCAtIGV4dHJhKSB9O1xufVxuXG4vKipcbllvdSBjYW4gW19yZXNvbHZlX10oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGUucmVzb2x2ZSkgYSBwb3NpdGlvbiB0byBnZXQgbW9yZVxuaW5mb3JtYXRpb24gYWJvdXQgaXQuIE9iamVjdHMgb2YgdGhpcyBjbGFzcyByZXByZXNlbnQgc3VjaCBhXG5yZXNvbHZlZCBwb3NpdGlvbiwgcHJvdmlkaW5nIHZhcmlvdXMgcGllY2VzIG9mIGNvbnRleHRcbmluZm9ybWF0aW9uLCBhbmQgc29tZSBoZWxwZXIgbWV0aG9kcy5cblxuVGhyb3VnaG91dCB0aGlzIGludGVyZmFjZSwgbWV0aG9kcyB0aGF0IHRha2UgYW4gb3B0aW9uYWwgYGRlcHRoYFxucGFyYW1ldGVyIHdpbGwgaW50ZXJwcmV0IHVuZGVmaW5lZCBhcyBgdGhpcy5kZXB0aGAgYW5kIG5lZ2F0aXZlXG5udW1iZXJzIGFzIGB0aGlzLmRlcHRoICsgdmFsdWVgLlxuKi9cbmNsYXNzIFJlc29sdmVkUG9zIHtcbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgIFRoZSBwb3NpdGlvbiB0aGF0IHdhcyByZXNvbHZlZC5cbiAgICAqL1xuICAgIHBvcywgXG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBwYXRoLCBcbiAgICAvKipcbiAgICBUaGUgb2Zmc2V0IHRoaXMgcG9zaXRpb24gaGFzIGludG8gaXRzIHBhcmVudCBub2RlLlxuICAgICovXG4gICAgcGFyZW50T2Zmc2V0KSB7XG4gICAgICAgIHRoaXMucG9zID0gcG9zO1xuICAgICAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgICAgICB0aGlzLnBhcmVudE9mZnNldCA9IHBhcmVudE9mZnNldDtcbiAgICAgICAgdGhpcy5kZXB0aCA9IHBhdGgubGVuZ3RoIC8gMyAtIDE7XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgcmVzb2x2ZURlcHRoKHZhbCkge1xuICAgICAgICBpZiAodmFsID09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZXB0aDtcbiAgICAgICAgaWYgKHZhbCA8IDApXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZXB0aCArIHZhbDtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gICAgLyoqXG4gICAgVGhlIHBhcmVudCBub2RlIHRoYXQgdGhlIHBvc2l0aW9uIHBvaW50cyBpbnRvLiBOb3RlIHRoYXQgZXZlbiBpZlxuICAgIGEgcG9zaXRpb24gcG9pbnRzIGludG8gYSB0ZXh0IG5vZGUsIHRoYXQgbm9kZSBpcyBub3QgY29uc2lkZXJlZFxuICAgIHRoZSBwYXJlbnRcdTIwMTR0ZXh0IG5vZGVzIGFyZSBcdTIwMThmbGF0XHUyMDE5IGluIHRoaXMgbW9kZWwsIGFuZCBoYXZlIG5vIGNvbnRlbnQuXG4gICAgKi9cbiAgICBnZXQgcGFyZW50KCkgeyByZXR1cm4gdGhpcy5ub2RlKHRoaXMuZGVwdGgpOyB9XG4gICAgLyoqXG4gICAgVGhlIHJvb3Qgbm9kZSBpbiB3aGljaCB0aGUgcG9zaXRpb24gd2FzIHJlc29sdmVkLlxuICAgICovXG4gICAgZ2V0IGRvYygpIHsgcmV0dXJuIHRoaXMubm9kZSgwKTsgfVxuICAgIC8qKlxuICAgIFRoZSBhbmNlc3RvciBub2RlIGF0IHRoZSBnaXZlbiBsZXZlbC4gYHAubm9kZShwLmRlcHRoKWAgaXMgdGhlXG4gICAgc2FtZSBhcyBgcC5wYXJlbnRgLlxuICAgICovXG4gICAgbm9kZShkZXB0aCkgeyByZXR1cm4gdGhpcy5wYXRoW3RoaXMucmVzb2x2ZURlcHRoKGRlcHRoKSAqIDNdOyB9XG4gICAgLyoqXG4gICAgVGhlIGluZGV4IGludG8gdGhlIGFuY2VzdG9yIGF0IHRoZSBnaXZlbiBsZXZlbC4gSWYgdGhpcyBwb2ludHNcbiAgICBhdCB0aGUgM3JkIG5vZGUgaW4gdGhlIDJuZCBwYXJhZ3JhcGggb24gdGhlIHRvcCBsZXZlbCwgZm9yXG4gICAgZXhhbXBsZSwgYHAuaW5kZXgoMClgIGlzIDEgYW5kIGBwLmluZGV4KDEpYCBpcyAyLlxuICAgICovXG4gICAgaW5kZXgoZGVwdGgpIHsgcmV0dXJuIHRoaXMucGF0aFt0aGlzLnJlc29sdmVEZXB0aChkZXB0aCkgKiAzICsgMV07IH1cbiAgICAvKipcbiAgICBUaGUgaW5kZXggcG9pbnRpbmcgYWZ0ZXIgdGhpcyBwb3NpdGlvbiBpbnRvIHRoZSBhbmNlc3RvciBhdCB0aGVcbiAgICBnaXZlbiBsZXZlbC5cbiAgICAqL1xuICAgIGluZGV4QWZ0ZXIoZGVwdGgpIHtcbiAgICAgICAgZGVwdGggPSB0aGlzLnJlc29sdmVEZXB0aChkZXB0aCk7XG4gICAgICAgIHJldHVybiB0aGlzLmluZGV4KGRlcHRoKSArIChkZXB0aCA9PSB0aGlzLmRlcHRoICYmICF0aGlzLnRleHRPZmZzZXQgPyAwIDogMSk7XG4gICAgfVxuICAgIC8qKlxuICAgIFRoZSAoYWJzb2x1dGUpIHBvc2l0aW9uIGF0IHRoZSBzdGFydCBvZiB0aGUgbm9kZSBhdCB0aGUgZ2l2ZW5cbiAgICBsZXZlbC5cbiAgICAqL1xuICAgIHN0YXJ0KGRlcHRoKSB7XG4gICAgICAgIGRlcHRoID0gdGhpcy5yZXNvbHZlRGVwdGgoZGVwdGgpO1xuICAgICAgICByZXR1cm4gZGVwdGggPT0gMCA/IDAgOiB0aGlzLnBhdGhbZGVwdGggKiAzIC0gMV0gKyAxO1xuICAgIH1cbiAgICAvKipcbiAgICBUaGUgKGFic29sdXRlKSBwb3NpdGlvbiBhdCB0aGUgZW5kIG9mIHRoZSBub2RlIGF0IHRoZSBnaXZlblxuICAgIGxldmVsLlxuICAgICovXG4gICAgZW5kKGRlcHRoKSB7XG4gICAgICAgIGRlcHRoID0gdGhpcy5yZXNvbHZlRGVwdGgoZGVwdGgpO1xuICAgICAgICByZXR1cm4gdGhpcy5zdGFydChkZXB0aCkgKyB0aGlzLm5vZGUoZGVwdGgpLmNvbnRlbnQuc2l6ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgVGhlIChhYnNvbHV0ZSkgcG9zaXRpb24gZGlyZWN0bHkgYmVmb3JlIHRoZSB3cmFwcGluZyBub2RlIGF0IHRoZVxuICAgIGdpdmVuIGxldmVsLCBvciwgd2hlbiBgZGVwdGhgIGlzIGB0aGlzLmRlcHRoICsgMWAsIHRoZSBvcmlnaW5hbFxuICAgIHBvc2l0aW9uLlxuICAgICovXG4gICAgYmVmb3JlKGRlcHRoKSB7XG4gICAgICAgIGRlcHRoID0gdGhpcy5yZXNvbHZlRGVwdGgoZGVwdGgpO1xuICAgICAgICBpZiAoIWRlcHRoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJUaGVyZSBpcyBubyBwb3NpdGlvbiBiZWZvcmUgdGhlIHRvcC1sZXZlbCBub2RlXCIpO1xuICAgICAgICByZXR1cm4gZGVwdGggPT0gdGhpcy5kZXB0aCArIDEgPyB0aGlzLnBvcyA6IHRoaXMucGF0aFtkZXB0aCAqIDMgLSAxXTtcbiAgICB9XG4gICAgLyoqXG4gICAgVGhlIChhYnNvbHV0ZSkgcG9zaXRpb24gZGlyZWN0bHkgYWZ0ZXIgdGhlIHdyYXBwaW5nIG5vZGUgYXQgdGhlXG4gICAgZ2l2ZW4gbGV2ZWwsIG9yIHRoZSBvcmlnaW5hbCBwb3NpdGlvbiB3aGVuIGBkZXB0aGAgaXMgYHRoaXMuZGVwdGggKyAxYC5cbiAgICAqL1xuICAgIGFmdGVyKGRlcHRoKSB7XG4gICAgICAgIGRlcHRoID0gdGhpcy5yZXNvbHZlRGVwdGgoZGVwdGgpO1xuICAgICAgICBpZiAoIWRlcHRoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJUaGVyZSBpcyBubyBwb3NpdGlvbiBhZnRlciB0aGUgdG9wLWxldmVsIG5vZGVcIik7XG4gICAgICAgIHJldHVybiBkZXB0aCA9PSB0aGlzLmRlcHRoICsgMSA/IHRoaXMucG9zIDogdGhpcy5wYXRoW2RlcHRoICogMyAtIDFdICsgdGhpcy5wYXRoW2RlcHRoICogM10ubm9kZVNpemU7XG4gICAgfVxuICAgIC8qKlxuICAgIFdoZW4gdGhpcyBwb3NpdGlvbiBwb2ludHMgaW50byBhIHRleHQgbm9kZSwgdGhpcyByZXR1cm5zIHRoZVxuICAgIGRpc3RhbmNlIGJldHdlZW4gdGhlIHBvc2l0aW9uIGFuZCB0aGUgc3RhcnQgb2YgdGhlIHRleHQgbm9kZS5cbiAgICBXaWxsIGJlIHplcm8gZm9yIHBvc2l0aW9ucyB0aGF0IHBvaW50IGJldHdlZW4gbm9kZXMuXG4gICAgKi9cbiAgICBnZXQgdGV4dE9mZnNldCgpIHsgcmV0dXJuIHRoaXMucG9zIC0gdGhpcy5wYXRoW3RoaXMucGF0aC5sZW5ndGggLSAxXTsgfVxuICAgIC8qKlxuICAgIEdldCB0aGUgbm9kZSBkaXJlY3RseSBhZnRlciB0aGUgcG9zaXRpb24sIGlmIGFueS4gSWYgdGhlIHBvc2l0aW9uXG4gICAgcG9pbnRzIGludG8gYSB0ZXh0IG5vZGUsIG9ubHkgdGhlIHBhcnQgb2YgdGhhdCBub2RlIGFmdGVyIHRoZVxuICAgIHBvc2l0aW9uIGlzIHJldHVybmVkLlxuICAgICovXG4gICAgZ2V0IG5vZGVBZnRlcigpIHtcbiAgICAgICAgbGV0IHBhcmVudCA9IHRoaXMucGFyZW50LCBpbmRleCA9IHRoaXMuaW5kZXgodGhpcy5kZXB0aCk7XG4gICAgICAgIGlmIChpbmRleCA9PSBwYXJlbnQuY2hpbGRDb3VudClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBsZXQgZE9mZiA9IHRoaXMucG9zIC0gdGhpcy5wYXRoW3RoaXMucGF0aC5sZW5ndGggLSAxXSwgY2hpbGQgPSBwYXJlbnQuY2hpbGQoaW5kZXgpO1xuICAgICAgICByZXR1cm4gZE9mZiA/IHBhcmVudC5jaGlsZChpbmRleCkuY3V0KGRPZmYpIDogY2hpbGQ7XG4gICAgfVxuICAgIC8qKlxuICAgIEdldCB0aGUgbm9kZSBkaXJlY3RseSBiZWZvcmUgdGhlIHBvc2l0aW9uLCBpZiBhbnkuIElmIHRoZVxuICAgIHBvc2l0aW9uIHBvaW50cyBpbnRvIGEgdGV4dCBub2RlLCBvbmx5IHRoZSBwYXJ0IG9mIHRoYXQgbm9kZVxuICAgIGJlZm9yZSB0aGUgcG9zaXRpb24gaXMgcmV0dXJuZWQuXG4gICAgKi9cbiAgICBnZXQgbm9kZUJlZm9yZSgpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5pbmRleCh0aGlzLmRlcHRoKTtcbiAgICAgICAgbGV0IGRPZmYgPSB0aGlzLnBvcyAtIHRoaXMucGF0aFt0aGlzLnBhdGgubGVuZ3RoIC0gMV07XG4gICAgICAgIGlmIChkT2ZmKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmNoaWxkKGluZGV4KS5jdXQoMCwgZE9mZik7XG4gICAgICAgIHJldHVybiBpbmRleCA9PSAwID8gbnVsbCA6IHRoaXMucGFyZW50LmNoaWxkKGluZGV4IC0gMSk7XG4gICAgfVxuICAgIC8qKlxuICAgIEdldCB0aGUgcG9zaXRpb24gYXQgdGhlIGdpdmVuIGluZGV4IGluIHRoZSBwYXJlbnQgbm9kZSBhdCB0aGVcbiAgICBnaXZlbiBkZXB0aCAod2hpY2ggZGVmYXVsdHMgdG8gYHRoaXMuZGVwdGhgKS5cbiAgICAqL1xuICAgIHBvc0F0SW5kZXgoaW5kZXgsIGRlcHRoKSB7XG4gICAgICAgIGRlcHRoID0gdGhpcy5yZXNvbHZlRGVwdGgoZGVwdGgpO1xuICAgICAgICBsZXQgbm9kZSA9IHRoaXMucGF0aFtkZXB0aCAqIDNdLCBwb3MgPSBkZXB0aCA9PSAwID8gMCA6IHRoaXMucGF0aFtkZXB0aCAqIDMgLSAxXSArIDE7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5kZXg7IGkrKylcbiAgICAgICAgICAgIHBvcyArPSBub2RlLmNoaWxkKGkpLm5vZGVTaXplO1xuICAgICAgICByZXR1cm4gcG9zO1xuICAgIH1cbiAgICAvKipcbiAgICBHZXQgdGhlIG1hcmtzIGF0IHRoaXMgcG9zaXRpb24sIGZhY3RvcmluZyBpbiB0aGUgc3Vycm91bmRpbmdcbiAgICBtYXJrcycgW2BpbmNsdXNpdmVgXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTWFya1NwZWMuaW5jbHVzaXZlKSBwcm9wZXJ0eS4gSWYgdGhlXG4gICAgcG9zaXRpb24gaXMgYXQgdGhlIHN0YXJ0IG9mIGEgbm9uLWVtcHR5IG5vZGUsIHRoZSBtYXJrcyBvZiB0aGVcbiAgICBub2RlIGFmdGVyIGl0IChpZiBhbnkpIGFyZSByZXR1cm5lZC5cbiAgICAqL1xuICAgIG1hcmtzKCkge1xuICAgICAgICBsZXQgcGFyZW50ID0gdGhpcy5wYXJlbnQsIGluZGV4ID0gdGhpcy5pbmRleCgpO1xuICAgICAgICAvLyBJbiBhbiBlbXB0eSBwYXJlbnQsIHJldHVybiB0aGUgZW1wdHkgYXJyYXlcbiAgICAgICAgaWYgKHBhcmVudC5jb250ZW50LnNpemUgPT0gMClcbiAgICAgICAgICAgIHJldHVybiBNYXJrLm5vbmU7XG4gICAgICAgIC8vIFdoZW4gaW5zaWRlIGEgdGV4dCBub2RlLCBqdXN0IHJldHVybiB0aGUgdGV4dCBub2RlJ3MgbWFya3NcbiAgICAgICAgaWYgKHRoaXMudGV4dE9mZnNldClcbiAgICAgICAgICAgIHJldHVybiBwYXJlbnQuY2hpbGQoaW5kZXgpLm1hcmtzO1xuICAgICAgICBsZXQgbWFpbiA9IHBhcmVudC5tYXliZUNoaWxkKGluZGV4IC0gMSksIG90aGVyID0gcGFyZW50Lm1heWJlQ2hpbGQoaW5kZXgpO1xuICAgICAgICAvLyBJZiB0aGUgYGFmdGVyYCBmbGFnIGlzIHRydWUgb2YgdGhlcmUgaXMgbm8gbm9kZSBiZWZvcmUsIG1ha2VcbiAgICAgICAgLy8gdGhlIG5vZGUgYWZ0ZXIgdGhpcyBwb3NpdGlvbiB0aGUgbWFpbiByZWZlcmVuY2UuXG4gICAgICAgIGlmICghbWFpbikge1xuICAgICAgICAgICAgbGV0IHRtcCA9IG1haW47XG4gICAgICAgICAgICBtYWluID0gb3RoZXI7XG4gICAgICAgICAgICBvdGhlciA9IHRtcDtcbiAgICAgICAgfVxuICAgICAgICAvLyBVc2UgYWxsIG1hcmtzIGluIHRoZSBtYWluIG5vZGUsIGV4Y2VwdCB0aG9zZSB0aGF0IGhhdmVcbiAgICAgICAgLy8gYGluY2x1c2l2ZWAgc2V0IHRvIGZhbHNlIGFuZCBhcmUgbm90IHByZXNlbnQgaW4gdGhlIG90aGVyIG5vZGUuXG4gICAgICAgIGxldCBtYXJrcyA9IG1haW4ubWFya3M7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWFya3MubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBpZiAobWFya3NbaV0udHlwZS5zcGVjLmluY2x1c2l2ZSA9PT0gZmFsc2UgJiYgKCFvdGhlciB8fCAhbWFya3NbaV0uaXNJblNldChvdGhlci5tYXJrcykpKVxuICAgICAgICAgICAgICAgIG1hcmtzID0gbWFya3NbaS0tXS5yZW1vdmVGcm9tU2V0KG1hcmtzKTtcbiAgICAgICAgcmV0dXJuIG1hcmtzO1xuICAgIH1cbiAgICAvKipcbiAgICBHZXQgdGhlIG1hcmtzIGFmdGVyIHRoZSBjdXJyZW50IHBvc2l0aW9uLCBpZiBhbnksIGV4Y2VwdCB0aG9zZVxuICAgIHRoYXQgYXJlIG5vbi1pbmNsdXNpdmUgYW5kIG5vdCBwcmVzZW50IGF0IHBvc2l0aW9uIGAkZW5kYC4gVGhpc1xuICAgIGlzIG1vc3RseSB1c2VmdWwgZm9yIGdldHRpbmcgdGhlIHNldCBvZiBtYXJrcyB0byBwcmVzZXJ2ZSBhZnRlciBhXG4gICAgZGVsZXRpb24uIFdpbGwgcmV0dXJuIGBudWxsYCBpZiB0aGlzIHBvc2l0aW9uIGlzIGF0IHRoZSBlbmQgb2ZcbiAgICBpdHMgcGFyZW50IG5vZGUgb3IgaXRzIHBhcmVudCBub2RlIGlzbid0IGEgdGV4dGJsb2NrIChpbiB3aGljaFxuICAgIGNhc2Ugbm8gbWFya3Mgc2hvdWxkIGJlIHByZXNlcnZlZCkuXG4gICAgKi9cbiAgICBtYXJrc0Fjcm9zcygkZW5kKSB7XG4gICAgICAgIGxldCBhZnRlciA9IHRoaXMucGFyZW50Lm1heWJlQ2hpbGQodGhpcy5pbmRleCgpKTtcbiAgICAgICAgaWYgKCFhZnRlciB8fCAhYWZ0ZXIuaXNJbmxpbmUpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgbGV0IG1hcmtzID0gYWZ0ZXIubWFya3MsIG5leHQgPSAkZW5kLnBhcmVudC5tYXliZUNoaWxkKCRlbmQuaW5kZXgoKSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWFya3MubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBpZiAobWFya3NbaV0udHlwZS5zcGVjLmluY2x1c2l2ZSA9PT0gZmFsc2UgJiYgKCFuZXh0IHx8ICFtYXJrc1tpXS5pc0luU2V0KG5leHQubWFya3MpKSlcbiAgICAgICAgICAgICAgICBtYXJrcyA9IG1hcmtzW2ktLV0ucmVtb3ZlRnJvbVNldChtYXJrcyk7XG4gICAgICAgIHJldHVybiBtYXJrcztcbiAgICB9XG4gICAgLyoqXG4gICAgVGhlIGRlcHRoIHVwIHRvIHdoaWNoIHRoaXMgcG9zaXRpb24gYW5kIHRoZSBnaXZlbiAobm9uLXJlc29sdmVkKVxuICAgIHBvc2l0aW9uIHNoYXJlIHRoZSBzYW1lIHBhcmVudCBub2Rlcy5cbiAgICAqL1xuICAgIHNoYXJlZERlcHRoKHBvcykge1xuICAgICAgICBmb3IgKGxldCBkZXB0aCA9IHRoaXMuZGVwdGg7IGRlcHRoID4gMDsgZGVwdGgtLSlcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXJ0KGRlcHRoKSA8PSBwb3MgJiYgdGhpcy5lbmQoZGVwdGgpID49IHBvcylcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVwdGg7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICAvKipcbiAgICBSZXR1cm5zIGEgcmFuZ2UgYmFzZWQgb24gdGhlIHBsYWNlIHdoZXJlIHRoaXMgcG9zaXRpb24gYW5kIHRoZVxuICAgIGdpdmVuIHBvc2l0aW9uIGRpdmVyZ2UgYXJvdW5kIGJsb2NrIGNvbnRlbnQuIElmIGJvdGggcG9pbnQgaW50b1xuICAgIHRoZSBzYW1lIHRleHRibG9jaywgZm9yIGV4YW1wbGUsIGEgcmFuZ2UgYXJvdW5kIHRoYXQgdGV4dGJsb2NrXG4gICAgd2lsbCBiZSByZXR1cm5lZC4gSWYgdGhleSBwb2ludCBpbnRvIGRpZmZlcmVudCBibG9ja3MsIHRoZSByYW5nZVxuICAgIGFyb3VuZCB0aG9zZSBibG9ja3MgaW4gdGhlaXIgc2hhcmVkIGFuY2VzdG9yIGlzIHJldHVybmVkLiBZb3UgY2FuXG4gICAgcGFzcyBpbiBhbiBvcHRpb25hbCBwcmVkaWNhdGUgdGhhdCB3aWxsIGJlIGNhbGxlZCB3aXRoIGEgcGFyZW50XG4gICAgbm9kZSB0byBzZWUgaWYgYSByYW5nZSBpbnRvIHRoYXQgcGFyZW50IGlzIGFjY2VwdGFibGUuXG4gICAgKi9cbiAgICBibG9ja1JhbmdlKG90aGVyID0gdGhpcywgcHJlZCkge1xuICAgICAgICBpZiAob3RoZXIucG9zIDwgdGhpcy5wb3MpXG4gICAgICAgICAgICByZXR1cm4gb3RoZXIuYmxvY2tSYW5nZSh0aGlzKTtcbiAgICAgICAgZm9yIChsZXQgZCA9IHRoaXMuZGVwdGggLSAodGhpcy5wYXJlbnQuaW5saW5lQ29udGVudCB8fCB0aGlzLnBvcyA9PSBvdGhlci5wb3MgPyAxIDogMCk7IGQgPj0gMDsgZC0tKVxuICAgICAgICAgICAgaWYgKG90aGVyLnBvcyA8PSB0aGlzLmVuZChkKSAmJiAoIXByZWQgfHwgcHJlZCh0aGlzLm5vZGUoZCkpKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE5vZGVSYW5nZSh0aGlzLCBvdGhlciwgZCk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICAvKipcbiAgICBRdWVyeSB3aGV0aGVyIHRoZSBnaXZlbiBwb3NpdGlvbiBzaGFyZXMgdGhlIHNhbWUgcGFyZW50IG5vZGUuXG4gICAgKi9cbiAgICBzYW1lUGFyZW50KG90aGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvcyAtIHRoaXMucGFyZW50T2Zmc2V0ID09IG90aGVyLnBvcyAtIG90aGVyLnBhcmVudE9mZnNldDtcbiAgICB9XG4gICAgLyoqXG4gICAgUmV0dXJuIHRoZSBncmVhdGVyIG9mIHRoaXMgYW5kIHRoZSBnaXZlbiBwb3NpdGlvbi5cbiAgICAqL1xuICAgIG1heChvdGhlcikge1xuICAgICAgICByZXR1cm4gb3RoZXIucG9zID4gdGhpcy5wb3MgPyBvdGhlciA6IHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgIFJldHVybiB0aGUgc21hbGxlciBvZiB0aGlzIGFuZCB0aGUgZ2l2ZW4gcG9zaXRpb24uXG4gICAgKi9cbiAgICBtaW4ob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIG90aGVyLnBvcyA8IHRoaXMucG9zID8gb3RoZXIgOiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICBsZXQgc3RyID0gXCJcIjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy5kZXB0aDsgaSsrKVxuICAgICAgICAgICAgc3RyICs9IChzdHIgPyBcIi9cIiA6IFwiXCIpICsgdGhpcy5ub2RlKGkpLnR5cGUubmFtZSArIFwiX1wiICsgdGhpcy5pbmRleChpIC0gMSk7XG4gICAgICAgIHJldHVybiBzdHIgKyBcIjpcIiArIHRoaXMucGFyZW50T2Zmc2V0O1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHN0YXRpYyByZXNvbHZlKGRvYywgcG9zKSB7XG4gICAgICAgIGlmICghKHBvcyA+PSAwICYmIHBvcyA8PSBkb2MuY29udGVudC5zaXplKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiUG9zaXRpb24gXCIgKyBwb3MgKyBcIiBvdXQgb2YgcmFuZ2VcIik7XG4gICAgICAgIGxldCBwYXRoID0gW107XG4gICAgICAgIGxldCBzdGFydCA9IDAsIHBhcmVudE9mZnNldCA9IHBvcztcbiAgICAgICAgZm9yIChsZXQgbm9kZSA9IGRvYzs7KSB7XG4gICAgICAgICAgICBsZXQgeyBpbmRleCwgb2Zmc2V0IH0gPSBub2RlLmNvbnRlbnQuZmluZEluZGV4KHBhcmVudE9mZnNldCk7XG4gICAgICAgICAgICBsZXQgcmVtID0gcGFyZW50T2Zmc2V0IC0gb2Zmc2V0O1xuICAgICAgICAgICAgcGF0aC5wdXNoKG5vZGUsIGluZGV4LCBzdGFydCArIG9mZnNldCk7XG4gICAgICAgICAgICBpZiAoIXJlbSlcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLmNoaWxkKGluZGV4KTtcbiAgICAgICAgICAgIGlmIChub2RlLmlzVGV4dClcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIHBhcmVudE9mZnNldCA9IHJlbSAtIDE7XG4gICAgICAgICAgICBzdGFydCArPSBvZmZzZXQgKyAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUmVzb2x2ZWRQb3MocG9zLCBwYXRoLCBwYXJlbnRPZmZzZXQpO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHN0YXRpYyByZXNvbHZlQ2FjaGVkKGRvYywgcG9zKSB7XG4gICAgICAgIGxldCBjYWNoZSA9IHJlc29sdmVDYWNoZS5nZXQoZG9jKTtcbiAgICAgICAgaWYgKGNhY2hlKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhY2hlLmVsdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgZWx0ID0gY2FjaGUuZWx0c1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoZWx0LnBvcyA9PSBwb3MpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXNvbHZlQ2FjaGUuc2V0KGRvYywgY2FjaGUgPSBuZXcgUmVzb2x2ZUNhY2hlKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzdWx0ID0gY2FjaGUuZWx0c1tjYWNoZS5pXSA9IFJlc29sdmVkUG9zLnJlc29sdmUoZG9jLCBwb3MpO1xuICAgICAgICBjYWNoZS5pID0gKGNhY2hlLmkgKyAxKSAlIHJlc29sdmVDYWNoZVNpemU7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuY2xhc3MgUmVzb2x2ZUNhY2hlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5lbHRzID0gW107XG4gICAgICAgIHRoaXMuaSA9IDA7XG4gICAgfVxufVxuY29uc3QgcmVzb2x2ZUNhY2hlU2l6ZSA9IDEyLCByZXNvbHZlQ2FjaGUgPSBuZXcgV2Vha01hcCgpO1xuLyoqXG5SZXByZXNlbnRzIGEgZmxhdCByYW5nZSBvZiBjb250ZW50LCBpLmUuIG9uZSB0aGF0IHN0YXJ0cyBhbmRcbmVuZHMgaW4gdGhlIHNhbWUgbm9kZS5cbiovXG5jbGFzcyBOb2RlUmFuZ2Uge1xuICAgIC8qKlxuICAgIENvbnN0cnVjdCBhIG5vZGUgcmFuZ2UuIGAkZnJvbWAgYW5kIGAkdG9gIHNob3VsZCBwb2ludCBpbnRvIHRoZVxuICAgIHNhbWUgbm9kZSB1bnRpbCBhdCBsZWFzdCB0aGUgZ2l2ZW4gYGRlcHRoYCwgc2luY2UgYSBub2RlIHJhbmdlXG4gICAgZGVub3RlcyBhbiBhZGphY2VudCBzZXQgb2Ygbm9kZXMgaW4gYSBzaW5nbGUgcGFyZW50IG5vZGUuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAvKipcbiAgICBBIHJlc29sdmVkIHBvc2l0aW9uIGFsb25nIHRoZSBzdGFydCBvZiB0aGUgY29udGVudC4gTWF5IGhhdmUgYVxuICAgIGBkZXB0aGAgZ3JlYXRlciB0aGFuIHRoaXMgb2JqZWN0J3MgYGRlcHRoYCBwcm9wZXJ0eSwgc2luY2VcbiAgICB0aGVzZSBhcmUgdGhlIHBvc2l0aW9ucyB0aGF0IHdlcmUgdXNlZCB0byBjb21wdXRlIHRoZSByYW5nZSxcbiAgICBub3QgcmUtcmVzb2x2ZWQgcG9zaXRpb25zIGRpcmVjdGx5IGF0IGl0cyBib3VuZGFyaWVzLlxuICAgICovXG4gICAgJGZyb20sIFxuICAgIC8qKlxuICAgIEEgcG9zaXRpb24gYWxvbmcgdGhlIGVuZCBvZiB0aGUgY29udGVudC4gU2VlXG4gICAgY2F2ZWF0IGZvciBbYCRmcm9tYF0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGVSYW5nZS4kZnJvbSkuXG4gICAgKi9cbiAgICAkdG8sIFxuICAgIC8qKlxuICAgIFRoZSBkZXB0aCBvZiB0aGUgbm9kZSB0aGF0IHRoaXMgcmFuZ2UgcG9pbnRzIGludG8uXG4gICAgKi9cbiAgICBkZXB0aCkge1xuICAgICAgICB0aGlzLiRmcm9tID0gJGZyb207XG4gICAgICAgIHRoaXMuJHRvID0gJHRvO1xuICAgICAgICB0aGlzLmRlcHRoID0gZGVwdGg7XG4gICAgfVxuICAgIC8qKlxuICAgIFRoZSBwb3NpdGlvbiBhdCB0aGUgc3RhcnQgb2YgdGhlIHJhbmdlLlxuICAgICovXG4gICAgZ2V0IHN0YXJ0KCkgeyByZXR1cm4gdGhpcy4kZnJvbS5iZWZvcmUodGhpcy5kZXB0aCArIDEpOyB9XG4gICAgLyoqXG4gICAgVGhlIHBvc2l0aW9uIGF0IHRoZSBlbmQgb2YgdGhlIHJhbmdlLlxuICAgICovXG4gICAgZ2V0IGVuZCgpIHsgcmV0dXJuIHRoaXMuJHRvLmFmdGVyKHRoaXMuZGVwdGggKyAxKTsgfVxuICAgIC8qKlxuICAgIFRoZSBwYXJlbnQgbm9kZSB0aGF0IHRoZSByYW5nZSBwb2ludHMgaW50by5cbiAgICAqL1xuICAgIGdldCBwYXJlbnQoKSB7IHJldHVybiB0aGlzLiRmcm9tLm5vZGUodGhpcy5kZXB0aCk7IH1cbiAgICAvKipcbiAgICBUaGUgc3RhcnQgaW5kZXggb2YgdGhlIHJhbmdlIGluIHRoZSBwYXJlbnQgbm9kZS5cbiAgICAqL1xuICAgIGdldCBzdGFydEluZGV4KCkgeyByZXR1cm4gdGhpcy4kZnJvbS5pbmRleCh0aGlzLmRlcHRoKTsgfVxuICAgIC8qKlxuICAgIFRoZSBlbmQgaW5kZXggb2YgdGhlIHJhbmdlIGluIHRoZSBwYXJlbnQgbm9kZS5cbiAgICAqL1xuICAgIGdldCBlbmRJbmRleCgpIHsgcmV0dXJuIHRoaXMuJHRvLmluZGV4QWZ0ZXIodGhpcy5kZXB0aCk7IH1cbn1cblxuY29uc3QgZW1wdHlBdHRycyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4vKipcblRoaXMgY2xhc3MgcmVwcmVzZW50cyBhIG5vZGUgaW4gdGhlIHRyZWUgdGhhdCBtYWtlcyB1cCBhXG5Qcm9zZU1pcnJvciBkb2N1bWVudC4gU28gYSBkb2N1bWVudCBpcyBhbiBpbnN0YW5jZSBvZiBgTm9kZWAsIHdpdGhcbmNoaWxkcmVuIHRoYXQgYXJlIGFsc28gaW5zdGFuY2VzIG9mIGBOb2RlYC5cblxuTm9kZXMgYXJlIHBlcnNpc3RlbnQgZGF0YSBzdHJ1Y3R1cmVzLiBJbnN0ZWFkIG9mIGNoYW5naW5nIHRoZW0sIHlvdVxuY3JlYXRlIG5ldyBvbmVzIHdpdGggdGhlIGNvbnRlbnQgeW91IHdhbnQuIE9sZCBvbmVzIGtlZXAgcG9pbnRpbmdcbmF0IHRoZSBvbGQgZG9jdW1lbnQgc2hhcGUuIFRoaXMgaXMgbWFkZSBjaGVhcGVyIGJ5IHNoYXJpbmdcbnN0cnVjdHVyZSBiZXR3ZWVuIHRoZSBvbGQgYW5kIG5ldyBkYXRhIGFzIG11Y2ggYXMgcG9zc2libGUsIHdoaWNoIGFcbnRyZWUgc2hhcGUgbGlrZSB0aGlzICh3aXRob3V0IGJhY2sgcG9pbnRlcnMpIG1ha2VzIGVhc3kuXG5cbioqRG8gbm90KiogZGlyZWN0bHkgbXV0YXRlIHRoZSBwcm9wZXJ0aWVzIG9mIGEgYE5vZGVgIG9iamVjdC4gU2VlXG5bdGhlIGd1aWRlXSgvZG9jcy9ndWlkZS8jZG9jKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiovXG5jbGFzcyBOb2RlIHtcbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgIFRoZSB0eXBlIG9mIG5vZGUgdGhhdCB0aGlzIGlzLlxuICAgICovXG4gICAgdHlwZSwgXG4gICAgLyoqXG4gICAgQW4gb2JqZWN0IG1hcHBpbmcgYXR0cmlidXRlIG5hbWVzIHRvIHZhbHVlcy4gVGhlIGtpbmQgb2ZcbiAgICBhdHRyaWJ1dGVzIGFsbG93ZWQgYW5kIHJlcXVpcmVkIGFyZVxuICAgIFtkZXRlcm1pbmVkXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTm9kZVNwZWMuYXR0cnMpIGJ5IHRoZSBub2RlIHR5cGUuXG4gICAgKi9cbiAgICBhdHRycywgXG4gICAgLy8gQSBmcmFnbWVudCBob2xkaW5nIHRoZSBub2RlJ3MgY2hpbGRyZW4uXG4gICAgY29udGVudCwgXG4gICAgLyoqXG4gICAgVGhlIG1hcmtzICh0aGluZ3MgbGlrZSB3aGV0aGVyIGl0IGlzIGVtcGhhc2l6ZWQgb3IgcGFydCBvZiBhXG4gICAgbGluaykgYXBwbGllZCB0byB0aGlzIG5vZGUuXG4gICAgKi9cbiAgICBtYXJrcyA9IE1hcmsubm9uZSkge1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgICB0aGlzLmF0dHJzID0gYXR0cnM7XG4gICAgICAgIHRoaXMubWFya3MgPSBtYXJrcztcbiAgICAgICAgdGhpcy5jb250ZW50ID0gY29udGVudCB8fCBGcmFnbWVudC5lbXB0eTtcbiAgICB9XG4gICAgLyoqXG4gICAgVGhlIHNpemUgb2YgdGhpcyBub2RlLCBhcyBkZWZpbmVkIGJ5IHRoZSBpbnRlZ2VyLWJhc2VkIFtpbmRleGluZ1xuICAgIHNjaGVtZV0oL2RvY3MvZ3VpZGUvI2RvYy5pbmRleGluZykuIEZvciB0ZXh0IG5vZGVzLCB0aGlzIGlzIHRoZVxuICAgIGFtb3VudCBvZiBjaGFyYWN0ZXJzLiBGb3Igb3RoZXIgbGVhZiBub2RlcywgaXQgaXMgb25lLiBGb3JcbiAgICBub24tbGVhZiBub2RlcywgaXQgaXMgdGhlIHNpemUgb2YgdGhlIGNvbnRlbnQgcGx1cyB0d28gKHRoZVxuICAgIHN0YXJ0IGFuZCBlbmQgdG9rZW4pLlxuICAgICovXG4gICAgZ2V0IG5vZGVTaXplKCkgeyByZXR1cm4gdGhpcy5pc0xlYWYgPyAxIDogMiArIHRoaXMuY29udGVudC5zaXplOyB9XG4gICAgLyoqXG4gICAgVGhlIG51bWJlciBvZiBjaGlsZHJlbiB0aGF0IHRoZSBub2RlIGhhcy5cbiAgICAqL1xuICAgIGdldCBjaGlsZENvdW50KCkgeyByZXR1cm4gdGhpcy5jb250ZW50LmNoaWxkQ291bnQ7IH1cbiAgICAvKipcbiAgICBHZXQgdGhlIGNoaWxkIG5vZGUgYXQgdGhlIGdpdmVuIGluZGV4LiBSYWlzZXMgYW4gZXJyb3Igd2hlbiB0aGVcbiAgICBpbmRleCBpcyBvdXQgb2YgcmFuZ2UuXG4gICAgKi9cbiAgICBjaGlsZChpbmRleCkgeyByZXR1cm4gdGhpcy5jb250ZW50LmNoaWxkKGluZGV4KTsgfVxuICAgIC8qKlxuICAgIEdldCB0aGUgY2hpbGQgbm9kZSBhdCB0aGUgZ2l2ZW4gaW5kZXgsIGlmIGl0IGV4aXN0cy5cbiAgICAqL1xuICAgIG1heWJlQ2hpbGQoaW5kZXgpIHsgcmV0dXJuIHRoaXMuY29udGVudC5tYXliZUNoaWxkKGluZGV4KTsgfVxuICAgIC8qKlxuICAgIENhbGwgYGZgIGZvciBldmVyeSBjaGlsZCBub2RlLCBwYXNzaW5nIHRoZSBub2RlLCBpdHMgb2Zmc2V0XG4gICAgaW50byB0aGlzIHBhcmVudCBub2RlLCBhbmQgaXRzIGluZGV4LlxuICAgICovXG4gICAgZm9yRWFjaChmKSB7IHRoaXMuY29udGVudC5mb3JFYWNoKGYpOyB9XG4gICAgLyoqXG4gICAgSW52b2tlIGEgY2FsbGJhY2sgZm9yIGFsbCBkZXNjZW5kYW50IG5vZGVzIHJlY3Vyc2l2ZWx5IGJldHdlZW5cbiAgICB0aGUgZ2l2ZW4gdHdvIHBvc2l0aW9ucyB0aGF0IGFyZSByZWxhdGl2ZSB0byBzdGFydCBvZiB0aGlzXG4gICAgbm9kZSdzIGNvbnRlbnQuIFRoZSBjYWxsYmFjayBpcyBpbnZva2VkIHdpdGggdGhlIG5vZGUsIGl0c1xuICAgIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBvcmlnaW5hbCBub2RlIChtZXRob2QgcmVjZWl2ZXIpLFxuICAgIGl0cyBwYXJlbnQgbm9kZSwgYW5kIGl0cyBjaGlsZCBpbmRleC4gV2hlbiB0aGUgY2FsbGJhY2sgcmV0dXJuc1xuICAgIGZhbHNlIGZvciBhIGdpdmVuIG5vZGUsIHRoYXQgbm9kZSdzIGNoaWxkcmVuIHdpbGwgbm90IGJlXG4gICAgcmVjdXJzZWQgb3Zlci4gVGhlIGxhc3QgcGFyYW1ldGVyIGNhbiBiZSB1c2VkIHRvIHNwZWNpZnkgYVxuICAgIHN0YXJ0aW5nIHBvc2l0aW9uIHRvIGNvdW50IGZyb20uXG4gICAgKi9cbiAgICBub2Rlc0JldHdlZW4oZnJvbSwgdG8sIGYsIHN0YXJ0UG9zID0gMCkge1xuICAgICAgICB0aGlzLmNvbnRlbnQubm9kZXNCZXR3ZWVuKGZyb20sIHRvLCBmLCBzdGFydFBvcywgdGhpcyk7XG4gICAgfVxuICAgIC8qKlxuICAgIENhbGwgdGhlIGdpdmVuIGNhbGxiYWNrIGZvciBldmVyeSBkZXNjZW5kYW50IG5vZGUuIERvZXNuJ3RcbiAgICBkZXNjZW5kIGludG8gYSBub2RlIHdoZW4gdGhlIGNhbGxiYWNrIHJldHVybnMgYGZhbHNlYC5cbiAgICAqL1xuICAgIGRlc2NlbmRhbnRzKGYpIHtcbiAgICAgICAgdGhpcy5ub2Rlc0JldHdlZW4oMCwgdGhpcy5jb250ZW50LnNpemUsIGYpO1xuICAgIH1cbiAgICAvKipcbiAgICBDb25jYXRlbmF0ZXMgYWxsIHRoZSB0ZXh0IG5vZGVzIGZvdW5kIGluIHRoaXMgZnJhZ21lbnQgYW5kIGl0c1xuICAgIGNoaWxkcmVuLlxuICAgICovXG4gICAgZ2V0IHRleHRDb250ZW50KCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuaXNMZWFmICYmIHRoaXMudHlwZS5zcGVjLmxlYWZUZXh0KVxuICAgICAgICAgICAgPyB0aGlzLnR5cGUuc3BlYy5sZWFmVGV4dCh0aGlzKVxuICAgICAgICAgICAgOiB0aGlzLnRleHRCZXR3ZWVuKDAsIHRoaXMuY29udGVudC5zaXplLCBcIlwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgR2V0IGFsbCB0ZXh0IGJldHdlZW4gcG9zaXRpb25zIGBmcm9tYCBhbmQgYHRvYC4gV2hlblxuICAgIGBibG9ja1NlcGFyYXRvcmAgaXMgZ2l2ZW4sIGl0IHdpbGwgYmUgaW5zZXJ0ZWQgdG8gc2VwYXJhdGUgdGV4dFxuICAgIGZyb20gZGlmZmVyZW50IGJsb2NrIG5vZGVzLiBJZiBgbGVhZlRleHRgIGlzIGdpdmVuLCBpdCdsbCBiZVxuICAgIGluc2VydGVkIGZvciBldmVyeSBub24tdGV4dCBsZWFmIG5vZGUgZW5jb3VudGVyZWQsIG90aGVyd2lzZVxuICAgIFtgbGVhZlRleHRgXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTm9kZVNwZWNebGVhZlRleHQpIHdpbGwgYmUgdXNlZC5cbiAgICAqL1xuICAgIHRleHRCZXR3ZWVuKGZyb20sIHRvLCBibG9ja1NlcGFyYXRvciwgbGVhZlRleHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudC50ZXh0QmV0d2Vlbihmcm9tLCB0bywgYmxvY2tTZXBhcmF0b3IsIGxlYWZUZXh0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgUmV0dXJucyB0aGlzIG5vZGUncyBmaXJzdCBjaGlsZCwgb3IgYG51bGxgIGlmIHRoZXJlIGFyZSBub1xuICAgIGNoaWxkcmVuLlxuICAgICovXG4gICAgZ2V0IGZpcnN0Q2hpbGQoKSB7IHJldHVybiB0aGlzLmNvbnRlbnQuZmlyc3RDaGlsZDsgfVxuICAgIC8qKlxuICAgIFJldHVybnMgdGhpcyBub2RlJ3MgbGFzdCBjaGlsZCwgb3IgYG51bGxgIGlmIHRoZXJlIGFyZSBub1xuICAgIGNoaWxkcmVuLlxuICAgICovXG4gICAgZ2V0IGxhc3RDaGlsZCgpIHsgcmV0dXJuIHRoaXMuY29udGVudC5sYXN0Q2hpbGQ7IH1cbiAgICAvKipcbiAgICBUZXN0IHdoZXRoZXIgdHdvIG5vZGVzIHJlcHJlc2VudCB0aGUgc2FtZSBwaWVjZSBvZiBkb2N1bWVudC5cbiAgICAqL1xuICAgIGVxKG90aGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzID09IG90aGVyIHx8ICh0aGlzLnNhbWVNYXJrdXAob3RoZXIpICYmIHRoaXMuY29udGVudC5lcShvdGhlci5jb250ZW50KSk7XG4gICAgfVxuICAgIC8qKlxuICAgIENvbXBhcmUgdGhlIG1hcmt1cCAodHlwZSwgYXR0cmlidXRlcywgYW5kIG1hcmtzKSBvZiB0aGlzIG5vZGUgdG9cbiAgICB0aG9zZSBvZiBhbm90aGVyLiBSZXR1cm5zIGB0cnVlYCBpZiBib3RoIGhhdmUgdGhlIHNhbWUgbWFya3VwLlxuICAgICovXG4gICAgc2FtZU1hcmt1cChvdGhlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5oYXNNYXJrdXAob3RoZXIudHlwZSwgb3RoZXIuYXR0cnMsIG90aGVyLm1hcmtzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ2hlY2sgd2hldGhlciB0aGlzIG5vZGUncyBtYXJrdXAgY29ycmVzcG9uZCB0byB0aGUgZ2l2ZW4gdHlwZSxcbiAgICBhdHRyaWJ1dGVzLCBhbmQgbWFya3MuXG4gICAgKi9cbiAgICBoYXNNYXJrdXAodHlwZSwgYXR0cnMsIG1hcmtzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGUgPT0gdHlwZSAmJlxuICAgICAgICAgICAgY29tcGFyZURlZXAodGhpcy5hdHRycywgYXR0cnMgfHwgdHlwZS5kZWZhdWx0QXR0cnMgfHwgZW1wdHlBdHRycykgJiZcbiAgICAgICAgICAgIE1hcmsuc2FtZVNldCh0aGlzLm1hcmtzLCBtYXJrcyB8fCBNYXJrLm5vbmUpO1xuICAgIH1cbiAgICAvKipcbiAgICBDcmVhdGUgYSBuZXcgbm9kZSB3aXRoIHRoZSBzYW1lIG1hcmt1cCBhcyB0aGlzIG5vZGUsIGNvbnRhaW5pbmdcbiAgICB0aGUgZ2l2ZW4gY29udGVudCAob3IgZW1wdHksIGlmIG5vIGNvbnRlbnQgaXMgZ2l2ZW4pLlxuICAgICovXG4gICAgY29weShjb250ZW50ID0gbnVsbCkge1xuICAgICAgICBpZiAoY29udGVudCA9PSB0aGlzLmNvbnRlbnQpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgcmV0dXJuIG5ldyBOb2RlKHRoaXMudHlwZSwgdGhpcy5hdHRycywgY29udGVudCwgdGhpcy5tYXJrcyk7XG4gICAgfVxuICAgIC8qKlxuICAgIENyZWF0ZSBhIGNvcHkgb2YgdGhpcyBub2RlLCB3aXRoIHRoZSBnaXZlbiBzZXQgb2YgbWFya3MgaW5zdGVhZFxuICAgIG9mIHRoZSBub2RlJ3Mgb3duIG1hcmtzLlxuICAgICovXG4gICAgbWFyayhtYXJrcykge1xuICAgICAgICByZXR1cm4gbWFya3MgPT0gdGhpcy5tYXJrcyA/IHRoaXMgOiBuZXcgTm9kZSh0aGlzLnR5cGUsIHRoaXMuYXR0cnMsIHRoaXMuY29udGVudCwgbWFya3MpO1xuICAgIH1cbiAgICAvKipcbiAgICBDcmVhdGUgYSBjb3B5IG9mIHRoaXMgbm9kZSB3aXRoIG9ubHkgdGhlIGNvbnRlbnQgYmV0d2VlbiB0aGVcbiAgICBnaXZlbiBwb3NpdGlvbnMuIElmIGB0b2AgaXMgbm90IGdpdmVuLCBpdCBkZWZhdWx0cyB0byB0aGUgZW5kIG9mXG4gICAgdGhlIG5vZGUuXG4gICAgKi9cbiAgICBjdXQoZnJvbSwgdG8gPSB0aGlzLmNvbnRlbnQuc2l6ZSkge1xuICAgICAgICBpZiAoZnJvbSA9PSAwICYmIHRvID09IHRoaXMuY29udGVudC5zaXplKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIHJldHVybiB0aGlzLmNvcHkodGhpcy5jb250ZW50LmN1dChmcm9tLCB0bykpO1xuICAgIH1cbiAgICAvKipcbiAgICBDdXQgb3V0IHRoZSBwYXJ0IG9mIHRoZSBkb2N1bWVudCBiZXR3ZWVuIHRoZSBnaXZlbiBwb3NpdGlvbnMsIGFuZFxuICAgIHJldHVybiBpdCBhcyBhIGBTbGljZWAgb2JqZWN0LlxuICAgICovXG4gICAgc2xpY2UoZnJvbSwgdG8gPSB0aGlzLmNvbnRlbnQuc2l6ZSwgaW5jbHVkZVBhcmVudHMgPSBmYWxzZSkge1xuICAgICAgICBpZiAoZnJvbSA9PSB0bylcbiAgICAgICAgICAgIHJldHVybiBTbGljZS5lbXB0eTtcbiAgICAgICAgbGV0ICRmcm9tID0gdGhpcy5yZXNvbHZlKGZyb20pLCAkdG8gPSB0aGlzLnJlc29sdmUodG8pO1xuICAgICAgICBsZXQgZGVwdGggPSBpbmNsdWRlUGFyZW50cyA/IDAgOiAkZnJvbS5zaGFyZWREZXB0aCh0byk7XG4gICAgICAgIGxldCBzdGFydCA9ICRmcm9tLnN0YXJ0KGRlcHRoKSwgbm9kZSA9ICRmcm9tLm5vZGUoZGVwdGgpO1xuICAgICAgICBsZXQgY29udGVudCA9IG5vZGUuY29udGVudC5jdXQoJGZyb20ucG9zIC0gc3RhcnQsICR0by5wb3MgLSBzdGFydCk7XG4gICAgICAgIHJldHVybiBuZXcgU2xpY2UoY29udGVudCwgJGZyb20uZGVwdGggLSBkZXB0aCwgJHRvLmRlcHRoIC0gZGVwdGgpO1xuICAgIH1cbiAgICAvKipcbiAgICBSZXBsYWNlIHRoZSBwYXJ0IG9mIHRoZSBkb2N1bWVudCBiZXR3ZWVuIHRoZSBnaXZlbiBwb3NpdGlvbnMgd2l0aFxuICAgIHRoZSBnaXZlbiBzbGljZS4gVGhlIHNsaWNlIG11c3QgJ2ZpdCcsIG1lYW5pbmcgaXRzIG9wZW4gc2lkZXNcbiAgICBtdXN0IGJlIGFibGUgdG8gY29ubmVjdCB0byB0aGUgc3Vycm91bmRpbmcgY29udGVudCwgYW5kIGl0c1xuICAgIGNvbnRlbnQgbm9kZXMgbXVzdCBiZSB2YWxpZCBjaGlsZHJlbiBmb3IgdGhlIG5vZGUgdGhleSBhcmUgcGxhY2VkXG4gICAgaW50by4gSWYgYW55IG9mIHRoaXMgaXMgdmlvbGF0ZWQsIGFuIGVycm9yIG9mIHR5cGVcbiAgICBbYFJlcGxhY2VFcnJvcmBdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5SZXBsYWNlRXJyb3IpIGlzIHRocm93bi5cbiAgICAqL1xuICAgIHJlcGxhY2UoZnJvbSwgdG8sIHNsaWNlKSB7XG4gICAgICAgIHJldHVybiByZXBsYWNlKHRoaXMucmVzb2x2ZShmcm9tKSwgdGhpcy5yZXNvbHZlKHRvKSwgc2xpY2UpO1xuICAgIH1cbiAgICAvKipcbiAgICBGaW5kIHRoZSBub2RlIGRpcmVjdGx5IGFmdGVyIHRoZSBnaXZlbiBwb3NpdGlvbi5cbiAgICAqL1xuICAgIG5vZGVBdChwb3MpIHtcbiAgICAgICAgZm9yIChsZXQgbm9kZSA9IHRoaXM7Oykge1xuICAgICAgICAgICAgbGV0IHsgaW5kZXgsIG9mZnNldCB9ID0gbm9kZS5jb250ZW50LmZpbmRJbmRleChwb3MpO1xuICAgICAgICAgICAgbm9kZSA9IG5vZGUubWF5YmVDaGlsZChpbmRleCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICBpZiAob2Zmc2V0ID09IHBvcyB8fCBub2RlLmlzVGV4dClcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgIHBvcyAtPSBvZmZzZXQgKyAxO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgIEZpbmQgdGhlIChkaXJlY3QpIGNoaWxkIG5vZGUgYWZ0ZXIgdGhlIGdpdmVuIG9mZnNldCwgaWYgYW55LFxuICAgIGFuZCByZXR1cm4gaXQgYWxvbmcgd2l0aCBpdHMgaW5kZXggYW5kIG9mZnNldCByZWxhdGl2ZSB0byB0aGlzXG4gICAgbm9kZS5cbiAgICAqL1xuICAgIGNoaWxkQWZ0ZXIocG9zKSB7XG4gICAgICAgIGxldCB7IGluZGV4LCBvZmZzZXQgfSA9IHRoaXMuY29udGVudC5maW5kSW5kZXgocG9zKTtcbiAgICAgICAgcmV0dXJuIHsgbm9kZTogdGhpcy5jb250ZW50Lm1heWJlQ2hpbGQoaW5kZXgpLCBpbmRleCwgb2Zmc2V0IH07XG4gICAgfVxuICAgIC8qKlxuICAgIEZpbmQgdGhlIChkaXJlY3QpIGNoaWxkIG5vZGUgYmVmb3JlIHRoZSBnaXZlbiBvZmZzZXQsIGlmIGFueSxcbiAgICBhbmQgcmV0dXJuIGl0IGFsb25nIHdpdGggaXRzIGluZGV4IGFuZCBvZmZzZXQgcmVsYXRpdmUgdG8gdGhpc1xuICAgIG5vZGUuXG4gICAgKi9cbiAgICBjaGlsZEJlZm9yZShwb3MpIHtcbiAgICAgICAgaWYgKHBvcyA9PSAwKVxuICAgICAgICAgICAgcmV0dXJuIHsgbm9kZTogbnVsbCwgaW5kZXg6IDAsIG9mZnNldDogMCB9O1xuICAgICAgICBsZXQgeyBpbmRleCwgb2Zmc2V0IH0gPSB0aGlzLmNvbnRlbnQuZmluZEluZGV4KHBvcyk7XG4gICAgICAgIGlmIChvZmZzZXQgPCBwb3MpXG4gICAgICAgICAgICByZXR1cm4geyBub2RlOiB0aGlzLmNvbnRlbnQuY2hpbGQoaW5kZXgpLCBpbmRleCwgb2Zmc2V0IH07XG4gICAgICAgIGxldCBub2RlID0gdGhpcy5jb250ZW50LmNoaWxkKGluZGV4IC0gMSk7XG4gICAgICAgIHJldHVybiB7IG5vZGUsIGluZGV4OiBpbmRleCAtIDEsIG9mZnNldDogb2Zmc2V0IC0gbm9kZS5ub2RlU2l6ZSB9O1xuICAgIH1cbiAgICAvKipcbiAgICBSZXNvbHZlIHRoZSBnaXZlbiBwb3NpdGlvbiBpbiB0aGUgZG9jdW1lbnQsIHJldHVybmluZyBhblxuICAgIFtvYmplY3RdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5SZXNvbHZlZFBvcykgd2l0aCBpbmZvcm1hdGlvbiBhYm91dCBpdHMgY29udGV4dC5cbiAgICAqL1xuICAgIHJlc29sdmUocG9zKSB7IHJldHVybiBSZXNvbHZlZFBvcy5yZXNvbHZlQ2FjaGVkKHRoaXMsIHBvcyk7IH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHJlc29sdmVOb0NhY2hlKHBvcykgeyByZXR1cm4gUmVzb2x2ZWRQb3MucmVzb2x2ZSh0aGlzLCBwb3MpOyB9XG4gICAgLyoqXG4gICAgVGVzdCB3aGV0aGVyIGEgZ2l2ZW4gbWFyayBvciBtYXJrIHR5cGUgb2NjdXJzIGluIHRoaXMgZG9jdW1lbnRcbiAgICBiZXR3ZWVuIHRoZSB0d28gZ2l2ZW4gcG9zaXRpb25zLlxuICAgICovXG4gICAgcmFuZ2VIYXNNYXJrKGZyb20sIHRvLCB0eXBlKSB7XG4gICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgICAgICBpZiAodG8gPiBmcm9tKVxuICAgICAgICAgICAgdGhpcy5ub2Rlc0JldHdlZW4oZnJvbSwgdG8sIG5vZGUgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlLmlzSW5TZXQobm9kZS5tYXJrcykpXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gIWZvdW5kO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmb3VuZDtcbiAgICB9XG4gICAgLyoqXG4gICAgVHJ1ZSB3aGVuIHRoaXMgaXMgYSBibG9jayAobm9uLWlubGluZSBub2RlKVxuICAgICovXG4gICAgZ2V0IGlzQmxvY2soKSB7IHJldHVybiB0aGlzLnR5cGUuaXNCbG9jazsgfVxuICAgIC8qKlxuICAgIFRydWUgd2hlbiB0aGlzIGlzIGEgdGV4dGJsb2NrIG5vZGUsIGEgYmxvY2sgbm9kZSB3aXRoIGlubGluZVxuICAgIGNvbnRlbnQuXG4gICAgKi9cbiAgICBnZXQgaXNUZXh0YmxvY2soKSB7IHJldHVybiB0aGlzLnR5cGUuaXNUZXh0YmxvY2s7IH1cbiAgICAvKipcbiAgICBUcnVlIHdoZW4gdGhpcyBub2RlIGFsbG93cyBpbmxpbmUgY29udGVudC5cbiAgICAqL1xuICAgIGdldCBpbmxpbmVDb250ZW50KCkgeyByZXR1cm4gdGhpcy50eXBlLmlubGluZUNvbnRlbnQ7IH1cbiAgICAvKipcbiAgICBUcnVlIHdoZW4gdGhpcyBpcyBhbiBpbmxpbmUgbm9kZSAoYSB0ZXh0IG5vZGUgb3IgYSBub2RlIHRoYXQgY2FuXG4gICAgYXBwZWFyIGFtb25nIHRleHQpLlxuICAgICovXG4gICAgZ2V0IGlzSW5saW5lKCkgeyByZXR1cm4gdGhpcy50eXBlLmlzSW5saW5lOyB9XG4gICAgLyoqXG4gICAgVHJ1ZSB3aGVuIHRoaXMgaXMgYSB0ZXh0IG5vZGUuXG4gICAgKi9cbiAgICBnZXQgaXNUZXh0KCkgeyByZXR1cm4gdGhpcy50eXBlLmlzVGV4dDsgfVxuICAgIC8qKlxuICAgIFRydWUgd2hlbiB0aGlzIGlzIGEgbGVhZiBub2RlLlxuICAgICovXG4gICAgZ2V0IGlzTGVhZigpIHsgcmV0dXJuIHRoaXMudHlwZS5pc0xlYWY7IH1cbiAgICAvKipcbiAgICBUcnVlIHdoZW4gdGhpcyBpcyBhbiBhdG9tLCBpLmUuIHdoZW4gaXQgZG9lcyBub3QgaGF2ZSBkaXJlY3RseVxuICAgIGVkaXRhYmxlIGNvbnRlbnQuIFRoaXMgaXMgdXN1YWxseSB0aGUgc2FtZSBhcyBgaXNMZWFmYCwgYnV0IGNhblxuICAgIGJlIGNvbmZpZ3VyZWQgd2l0aCB0aGUgW2BhdG9tYCBwcm9wZXJ0eV0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGVTcGVjLmF0b20pXG4gICAgb24gYSBub2RlJ3Mgc3BlYyAodHlwaWNhbGx5IHVzZWQgd2hlbiB0aGUgbm9kZSBpcyBkaXNwbGF5ZWQgYXNcbiAgICBhbiB1bmVkaXRhYmxlIFtub2RlIHZpZXddKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyN2aWV3Lk5vZGVWaWV3KSkuXG4gICAgKi9cbiAgICBnZXQgaXNBdG9tKCkgeyByZXR1cm4gdGhpcy50eXBlLmlzQXRvbTsgfVxuICAgIC8qKlxuICAgIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIG5vZGUgZm9yIGRlYnVnZ2luZ1xuICAgIHB1cnBvc2VzLlxuICAgICovXG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICAgIGlmICh0aGlzLnR5cGUuc3BlYy50b0RlYnVnU3RyaW5nKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudHlwZS5zcGVjLnRvRGVidWdTdHJpbmcodGhpcyk7XG4gICAgICAgIGxldCBuYW1lID0gdGhpcy50eXBlLm5hbWU7XG4gICAgICAgIGlmICh0aGlzLmNvbnRlbnQuc2l6ZSlcbiAgICAgICAgICAgIG5hbWUgKz0gXCIoXCIgKyB0aGlzLmNvbnRlbnQudG9TdHJpbmdJbm5lcigpICsgXCIpXCI7XG4gICAgICAgIHJldHVybiB3cmFwTWFya3ModGhpcy5tYXJrcywgbmFtZSk7XG4gICAgfVxuICAgIC8qKlxuICAgIEdldCB0aGUgY29udGVudCBtYXRjaCBpbiB0aGlzIG5vZGUgYXQgdGhlIGdpdmVuIGluZGV4LlxuICAgICovXG4gICAgY29udGVudE1hdGNoQXQoaW5kZXgpIHtcbiAgICAgICAgbGV0IG1hdGNoID0gdGhpcy50eXBlLmNvbnRlbnRNYXRjaC5tYXRjaEZyYWdtZW50KHRoaXMuY29udGVudCwgMCwgaW5kZXgpO1xuICAgICAgICBpZiAoIW1hdGNoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FsbGVkIGNvbnRlbnRNYXRjaEF0IG9uIGEgbm9kZSB3aXRoIGludmFsaWQgY29udGVudFwiKTtcbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH1cbiAgICAvKipcbiAgICBUZXN0IHdoZXRoZXIgcmVwbGFjaW5nIHRoZSByYW5nZSBiZXR3ZWVuIGBmcm9tYCBhbmQgYHRvYCAoYnlcbiAgICBjaGlsZCBpbmRleCkgd2l0aCB0aGUgZ2l2ZW4gcmVwbGFjZW1lbnQgZnJhZ21lbnQgKHdoaWNoIGRlZmF1bHRzXG4gICAgdG8gdGhlIGVtcHR5IGZyYWdtZW50KSB3b3VsZCBsZWF2ZSB0aGUgbm9kZSdzIGNvbnRlbnQgdmFsaWQuIFlvdVxuICAgIGNhbiBvcHRpb25hbGx5IHBhc3MgYHN0YXJ0YCBhbmQgYGVuZGAgaW5kaWNlcyBpbnRvIHRoZVxuICAgIHJlcGxhY2VtZW50IGZyYWdtZW50LlxuICAgICovXG4gICAgY2FuUmVwbGFjZShmcm9tLCB0bywgcmVwbGFjZW1lbnQgPSBGcmFnbWVudC5lbXB0eSwgc3RhcnQgPSAwLCBlbmQgPSByZXBsYWNlbWVudC5jaGlsZENvdW50KSB7XG4gICAgICAgIGxldCBvbmUgPSB0aGlzLmNvbnRlbnRNYXRjaEF0KGZyb20pLm1hdGNoRnJhZ21lbnQocmVwbGFjZW1lbnQsIHN0YXJ0LCBlbmQpO1xuICAgICAgICBsZXQgdHdvID0gb25lICYmIG9uZS5tYXRjaEZyYWdtZW50KHRoaXMuY29udGVudCwgdG8pO1xuICAgICAgICBpZiAoIXR3byB8fCAhdHdvLnZhbGlkRW5kKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKylcbiAgICAgICAgICAgIGlmICghdGhpcy50eXBlLmFsbG93c01hcmtzKHJlcGxhY2VtZW50LmNoaWxkKGkpLm1hcmtzKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKipcbiAgICBUZXN0IHdoZXRoZXIgcmVwbGFjaW5nIHRoZSByYW5nZSBgZnJvbWAgdG8gYHRvYCAoYnkgaW5kZXgpIHdpdGhcbiAgICBhIG5vZGUgb2YgdGhlIGdpdmVuIHR5cGUgd291bGQgbGVhdmUgdGhlIG5vZGUncyBjb250ZW50IHZhbGlkLlxuICAgICovXG4gICAgY2FuUmVwbGFjZVdpdGgoZnJvbSwgdG8sIHR5cGUsIG1hcmtzKSB7XG4gICAgICAgIGlmIChtYXJrcyAmJiAhdGhpcy50eXBlLmFsbG93c01hcmtzKG1hcmtzKSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgbGV0IHN0YXJ0ID0gdGhpcy5jb250ZW50TWF0Y2hBdChmcm9tKS5tYXRjaFR5cGUodHlwZSk7XG4gICAgICAgIGxldCBlbmQgPSBzdGFydCAmJiBzdGFydC5tYXRjaEZyYWdtZW50KHRoaXMuY29udGVudCwgdG8pO1xuICAgICAgICByZXR1cm4gZW5kID8gZW5kLnZhbGlkRW5kIDogZmFsc2U7XG4gICAgfVxuICAgIC8qKlxuICAgIFRlc3Qgd2hldGhlciB0aGUgZ2l2ZW4gbm9kZSdzIGNvbnRlbnQgY291bGQgYmUgYXBwZW5kZWQgdG8gdGhpc1xuICAgIG5vZGUuIElmIHRoYXQgbm9kZSBpcyBlbXB0eSwgdGhpcyB3aWxsIG9ubHkgcmV0dXJuIHRydWUgaWYgdGhlcmVcbiAgICBpcyBhdCBsZWFzdCBvbmUgbm9kZSB0eXBlIHRoYXQgY2FuIGFwcGVhciBpbiBib3RoIG5vZGVzICh0byBhdm9pZFxuICAgIG1lcmdpbmcgY29tcGxldGVseSBpbmNvbXBhdGlibGUgbm9kZXMpLlxuICAgICovXG4gICAgY2FuQXBwZW5kKG90aGVyKSB7XG4gICAgICAgIGlmIChvdGhlci5jb250ZW50LnNpemUpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYW5SZXBsYWNlKHRoaXMuY2hpbGRDb3VudCwgdGhpcy5jaGlsZENvdW50LCBvdGhlci5jb250ZW50KTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudHlwZS5jb21wYXRpYmxlQ29udGVudChvdGhlci50eXBlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ2hlY2sgd2hldGhlciB0aGlzIG5vZGUgYW5kIGl0cyBkZXNjZW5kYW50cyBjb25mb3JtIHRvIHRoZVxuICAgIHNjaGVtYSwgYW5kIHJhaXNlIGFuIGV4Y2VwdGlvbiB3aGVuIHRoZXkgZG8gbm90LlxuICAgICovXG4gICAgY2hlY2soKSB7XG4gICAgICAgIHRoaXMudHlwZS5jaGVja0NvbnRlbnQodGhpcy5jb250ZW50KTtcbiAgICAgICAgdGhpcy50eXBlLmNoZWNrQXR0cnModGhpcy5hdHRycyk7XG4gICAgICAgIGxldCBjb3B5ID0gTWFyay5ub25lO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubWFya3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBtYXJrID0gdGhpcy5tYXJrc1tpXTtcbiAgICAgICAgICAgIG1hcmsudHlwZS5jaGVja0F0dHJzKG1hcmsuYXR0cnMpO1xuICAgICAgICAgICAgY29weSA9IG1hcmsuYWRkVG9TZXQoY29weSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFNYXJrLnNhbWVTZXQoY29weSwgdGhpcy5tYXJrcykpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgSW52YWxpZCBjb2xsZWN0aW9uIG9mIG1hcmtzIGZvciBub2RlICR7dGhpcy50eXBlLm5hbWV9OiAke3RoaXMubWFya3MubWFwKG0gPT4gbS50eXBlLm5hbWUpfWApO1xuICAgICAgICB0aGlzLmNvbnRlbnQuZm9yRWFjaChub2RlID0+IG5vZGUuY2hlY2soKSk7XG4gICAgfVxuICAgIC8qKlxuICAgIFJldHVybiBhIEpTT04tc2VyaWFsaXplYWJsZSByZXByZXNlbnRhdGlvbiBvZiB0aGlzIG5vZGUuXG4gICAgKi9cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIGxldCBvYmogPSB7IHR5cGU6IHRoaXMudHlwZS5uYW1lIH07XG4gICAgICAgIGZvciAobGV0IF8gaW4gdGhpcy5hdHRycykge1xuICAgICAgICAgICAgb2JqLmF0dHJzID0gdGhpcy5hdHRycztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNvbnRlbnQuc2l6ZSlcbiAgICAgICAgICAgIG9iai5jb250ZW50ID0gdGhpcy5jb250ZW50LnRvSlNPTigpO1xuICAgICAgICBpZiAodGhpcy5tYXJrcy5sZW5ndGgpXG4gICAgICAgICAgICBvYmoubWFya3MgPSB0aGlzLm1hcmtzLm1hcChuID0+IG4udG9KU09OKCkpO1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cbiAgICAvKipcbiAgICBEZXNlcmlhbGl6ZSBhIG5vZGUgZnJvbSBpdHMgSlNPTiByZXByZXNlbnRhdGlvbi5cbiAgICAqL1xuICAgIHN0YXRpYyBmcm9tSlNPTihzY2hlbWEsIGpzb24pIHtcbiAgICAgICAgaWYgKCFqc29uKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbnZhbGlkIGlucHV0IGZvciBOb2RlLmZyb21KU09OXCIpO1xuICAgICAgICBsZXQgbWFya3MgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChqc29uLm1hcmtzKSB7XG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoanNvbi5tYXJrcykpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbnZhbGlkIG1hcmsgZGF0YSBmb3IgTm9kZS5mcm9tSlNPTlwiKTtcbiAgICAgICAgICAgIG1hcmtzID0ganNvbi5tYXJrcy5tYXAoc2NoZW1hLm1hcmtGcm9tSlNPTik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGpzb24udHlwZSA9PSBcInRleHRcIikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBqc29uLnRleHQgIT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkludmFsaWQgdGV4dCBub2RlIGluIEpTT05cIik7XG4gICAgICAgICAgICByZXR1cm4gc2NoZW1hLnRleHQoanNvbi50ZXh0LCBtYXJrcyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGNvbnRlbnQgPSBGcmFnbWVudC5mcm9tSlNPTihzY2hlbWEsIGpzb24uY29udGVudCk7XG4gICAgICAgIGxldCBub2RlID0gc2NoZW1hLm5vZGVUeXBlKGpzb24udHlwZSkuY3JlYXRlKGpzb24uYXR0cnMsIGNvbnRlbnQsIG1hcmtzKTtcbiAgICAgICAgbm9kZS50eXBlLmNoZWNrQXR0cnMobm9kZS5hdHRycyk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbn1cbk5vZGUucHJvdG90eXBlLnRleHQgPSB1bmRlZmluZWQ7XG5jbGFzcyBUZXh0Tm9kZSBleHRlbmRzIE5vZGUge1xuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgY29uc3RydWN0b3IodHlwZSwgYXR0cnMsIGNvbnRlbnQsIG1hcmtzKSB7XG4gICAgICAgIHN1cGVyKHR5cGUsIGF0dHJzLCBudWxsLCBtYXJrcyk7XG4gICAgICAgIGlmICghY29udGVudClcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiRW1wdHkgdGV4dCBub2RlcyBhcmUgbm90IGFsbG93ZWRcIik7XG4gICAgICAgIHRoaXMudGV4dCA9IGNvbnRlbnQ7XG4gICAgfVxuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICBpZiAodGhpcy50eXBlLnNwZWMudG9EZWJ1Z1N0cmluZylcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnR5cGUuc3BlYy50b0RlYnVnU3RyaW5nKHRoaXMpO1xuICAgICAgICByZXR1cm4gd3JhcE1hcmtzKHRoaXMubWFya3MsIEpTT04uc3RyaW5naWZ5KHRoaXMudGV4dCkpO1xuICAgIH1cbiAgICBnZXQgdGV4dENvbnRlbnQoKSB7IHJldHVybiB0aGlzLnRleHQ7IH1cbiAgICB0ZXh0QmV0d2Vlbihmcm9tLCB0bykgeyByZXR1cm4gdGhpcy50ZXh0LnNsaWNlKGZyb20sIHRvKTsgfVxuICAgIGdldCBub2RlU2l6ZSgpIHsgcmV0dXJuIHRoaXMudGV4dC5sZW5ndGg7IH1cbiAgICBtYXJrKG1hcmtzKSB7XG4gICAgICAgIHJldHVybiBtYXJrcyA9PSB0aGlzLm1hcmtzID8gdGhpcyA6IG5ldyBUZXh0Tm9kZSh0aGlzLnR5cGUsIHRoaXMuYXR0cnMsIHRoaXMudGV4dCwgbWFya3MpO1xuICAgIH1cbiAgICB3aXRoVGV4dCh0ZXh0KSB7XG4gICAgICAgIGlmICh0ZXh0ID09IHRoaXMudGV4dClcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICByZXR1cm4gbmV3IFRleHROb2RlKHRoaXMudHlwZSwgdGhpcy5hdHRycywgdGV4dCwgdGhpcy5tYXJrcyk7XG4gICAgfVxuICAgIGN1dChmcm9tID0gMCwgdG8gPSB0aGlzLnRleHQubGVuZ3RoKSB7XG4gICAgICAgIGlmIChmcm9tID09IDAgJiYgdG8gPT0gdGhpcy50ZXh0Lmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICByZXR1cm4gdGhpcy53aXRoVGV4dCh0aGlzLnRleHQuc2xpY2UoZnJvbSwgdG8pKTtcbiAgICB9XG4gICAgZXEob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2FtZU1hcmt1cChvdGhlcikgJiYgdGhpcy50ZXh0ID09IG90aGVyLnRleHQ7XG4gICAgfVxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgbGV0IGJhc2UgPSBzdXBlci50b0pTT04oKTtcbiAgICAgICAgYmFzZS50ZXh0ID0gdGhpcy50ZXh0O1xuICAgICAgICByZXR1cm4gYmFzZTtcbiAgICB9XG59XG5mdW5jdGlvbiB3cmFwTWFya3MobWFya3MsIHN0cikge1xuICAgIGZvciAobGV0IGkgPSBtYXJrcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSlcbiAgICAgICAgc3RyID0gbWFya3NbaV0udHlwZS5uYW1lICsgXCIoXCIgKyBzdHIgKyBcIilcIjtcbiAgICByZXR1cm4gc3RyO1xufVxuXG4vKipcbkluc3RhbmNlcyBvZiB0aGlzIGNsYXNzIHJlcHJlc2VudCBhIG1hdGNoIHN0YXRlIG9mIGEgbm9kZSB0eXBlJ3Ncbltjb250ZW50IGV4cHJlc3Npb25dKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5Ob2RlU3BlYy5jb250ZW50KSwgYW5kIGNhbiBiZSB1c2VkIHRvXG5maW5kIG91dCB3aGV0aGVyIGZ1cnRoZXIgY29udGVudCBtYXRjaGVzIGhlcmUsIGFuZCB3aGV0aGVyIGEgZ2l2ZW5cbnBvc2l0aW9uIGlzIGEgdmFsaWQgZW5kIG9mIHRoZSBub2RlLlxuKi9cbmNsYXNzIENvbnRlbnRNYXRjaCB7XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAvKipcbiAgICBUcnVlIHdoZW4gdGhpcyBtYXRjaCBzdGF0ZSByZXByZXNlbnRzIGEgdmFsaWQgZW5kIG9mIHRoZSBub2RlLlxuICAgICovXG4gICAgdmFsaWRFbmQpIHtcbiAgICAgICAgdGhpcy52YWxpZEVuZCA9IHZhbGlkRW5kO1xuICAgICAgICAvKipcbiAgICAgICAgQGludGVybmFsXG4gICAgICAgICovXG4gICAgICAgIHRoaXMubmV4dCA9IFtdO1xuICAgICAgICAvKipcbiAgICAgICAgQGludGVybmFsXG4gICAgICAgICovXG4gICAgICAgIHRoaXMud3JhcENhY2hlID0gW107XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgc3RhdGljIHBhcnNlKHN0cmluZywgbm9kZVR5cGVzKSB7XG4gICAgICAgIGxldCBzdHJlYW0gPSBuZXcgVG9rZW5TdHJlYW0oc3RyaW5nLCBub2RlVHlwZXMpO1xuICAgICAgICBpZiAoc3RyZWFtLm5leHQgPT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybiBDb250ZW50TWF0Y2guZW1wdHk7XG4gICAgICAgIGxldCBleHByID0gcGFyc2VFeHByKHN0cmVhbSk7XG4gICAgICAgIGlmIChzdHJlYW0ubmV4dClcbiAgICAgICAgICAgIHN0cmVhbS5lcnIoXCJVbmV4cGVjdGVkIHRyYWlsaW5nIHRleHRcIik7XG4gICAgICAgIGxldCBtYXRjaCA9IGRmYShuZmEoZXhwcikpO1xuICAgICAgICBjaGVja0ZvckRlYWRFbmRzKG1hdGNoLCBzdHJlYW0pO1xuICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfVxuICAgIC8qKlxuICAgIE1hdGNoIGEgbm9kZSB0eXBlLCByZXR1cm5pbmcgYSBtYXRjaCBhZnRlciB0aGF0IG5vZGUgaWZcbiAgICBzdWNjZXNzZnVsLlxuICAgICovXG4gICAgbWF0Y2hUeXBlKHR5cGUpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5leHQubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBpZiAodGhpcy5uZXh0W2ldLnR5cGUgPT0gdHlwZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0W2ldLm5leHQ7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICAvKipcbiAgICBUcnkgdG8gbWF0Y2ggYSBmcmFnbWVudC4gUmV0dXJucyB0aGUgcmVzdWx0aW5nIG1hdGNoIHdoZW5cbiAgICBzdWNjZXNzZnVsLlxuICAgICovXG4gICAgbWF0Y2hGcmFnbWVudChmcmFnLCBzdGFydCA9IDAsIGVuZCA9IGZyYWcuY2hpbGRDb3VudCkge1xuICAgICAgICBsZXQgY3VyID0gdGhpcztcbiAgICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBjdXIgJiYgaSA8IGVuZDsgaSsrKVxuICAgICAgICAgICAgY3VyID0gY3VyLm1hdGNoVHlwZShmcmFnLmNoaWxkKGkpLnR5cGUpO1xuICAgICAgICByZXR1cm4gY3VyO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIGdldCBpbmxpbmVDb250ZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uZXh0Lmxlbmd0aCAhPSAwICYmIHRoaXMubmV4dFswXS50eXBlLmlzSW5saW5lO1xuICAgIH1cbiAgICAvKipcbiAgICBHZXQgdGhlIGZpcnN0IG1hdGNoaW5nIG5vZGUgdHlwZSBhdCB0aGlzIG1hdGNoIHBvc2l0aW9uIHRoYXQgY2FuXG4gICAgYmUgZ2VuZXJhdGVkLlxuICAgICovXG4gICAgZ2V0IGRlZmF1bHRUeXBlKCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmV4dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHsgdHlwZSB9ID0gdGhpcy5uZXh0W2ldO1xuICAgICAgICAgICAgaWYgKCEodHlwZS5pc1RleHQgfHwgdHlwZS5oYXNSZXF1aXJlZEF0dHJzKCkpKVxuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIGNvbXBhdGlibGUob3RoZXIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5leHQubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG90aGVyLm5leHQubGVuZ3RoOyBqKyspXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubmV4dFtpXS50eXBlID09IG90aGVyLm5leHRbal0udHlwZSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLyoqXG4gICAgVHJ5IHRvIG1hdGNoIHRoZSBnaXZlbiBmcmFnbWVudCwgYW5kIGlmIHRoYXQgZmFpbHMsIHNlZSBpZiBpdCBjYW5cbiAgICBiZSBtYWRlIHRvIG1hdGNoIGJ5IGluc2VydGluZyBub2RlcyBpbiBmcm9udCBvZiBpdC4gV2hlblxuICAgIHN1Y2Nlc3NmdWwsIHJldHVybiBhIGZyYWdtZW50IG9mIGluc2VydGVkIG5vZGVzICh3aGljaCBtYXkgYmVcbiAgICBlbXB0eSBpZiBub3RoaW5nIGhhZCB0byBiZSBpbnNlcnRlZCkuIFdoZW4gYHRvRW5kYCBpcyB0cnVlLCBvbmx5XG4gICAgcmV0dXJuIGEgZnJhZ21lbnQgaWYgdGhlIHJlc3VsdGluZyBtYXRjaCBnb2VzIHRvIHRoZSBlbmQgb2YgdGhlXG4gICAgY29udGVudCBleHByZXNzaW9uLlxuICAgICovXG4gICAgZmlsbEJlZm9yZShhZnRlciwgdG9FbmQgPSBmYWxzZSwgc3RhcnRJbmRleCA9IDApIHtcbiAgICAgICAgbGV0IHNlZW4gPSBbdGhpc107XG4gICAgICAgIGZ1bmN0aW9uIHNlYXJjaChtYXRjaCwgdHlwZXMpIHtcbiAgICAgICAgICAgIGxldCBmaW5pc2hlZCA9IG1hdGNoLm1hdGNoRnJhZ21lbnQoYWZ0ZXIsIHN0YXJ0SW5kZXgpO1xuICAgICAgICAgICAgaWYgKGZpbmlzaGVkICYmICghdG9FbmQgfHwgZmluaXNoZWQudmFsaWRFbmQpKVxuICAgICAgICAgICAgICAgIHJldHVybiBGcmFnbWVudC5mcm9tKHR5cGVzLm1hcCh0cCA9PiB0cC5jcmVhdGVBbmRGaWxsKCkpKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2gubmV4dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCB7IHR5cGUsIG5leHQgfSA9IG1hdGNoLm5leHRbaV07XG4gICAgICAgICAgICAgICAgaWYgKCEodHlwZS5pc1RleHQgfHwgdHlwZS5oYXNSZXF1aXJlZEF0dHJzKCkpICYmIHNlZW4uaW5kZXhPZihuZXh0KSA9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBzZWVuLnB1c2gobmV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZCA9IHNlYXJjaChuZXh0LCB0eXBlcy5jb25jYXQodHlwZSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmQpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlYXJjaCh0aGlzLCBbXSk7XG4gICAgfVxuICAgIC8qKlxuICAgIEZpbmQgYSBzZXQgb2Ygd3JhcHBpbmcgbm9kZSB0eXBlcyB0aGF0IHdvdWxkIGFsbG93IGEgbm9kZSBvZiB0aGVcbiAgICBnaXZlbiB0eXBlIHRvIGFwcGVhciBhdCB0aGlzIHBvc2l0aW9uLiBUaGUgcmVzdWx0IG1heSBiZSBlbXB0eVxuICAgICh3aGVuIGl0IGZpdHMgZGlyZWN0bHkpIGFuZCB3aWxsIGJlIG51bGwgd2hlbiBubyBzdWNoIHdyYXBwaW5nXG4gICAgZXhpc3RzLlxuICAgICovXG4gICAgZmluZFdyYXBwaW5nKHRhcmdldCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud3JhcENhY2hlLmxlbmd0aDsgaSArPSAyKVxuICAgICAgICAgICAgaWYgKHRoaXMud3JhcENhY2hlW2ldID09IHRhcmdldClcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53cmFwQ2FjaGVbaSArIDFdO1xuICAgICAgICBsZXQgY29tcHV0ZWQgPSB0aGlzLmNvbXB1dGVXcmFwcGluZyh0YXJnZXQpO1xuICAgICAgICB0aGlzLndyYXBDYWNoZS5wdXNoKHRhcmdldCwgY29tcHV0ZWQpO1xuICAgICAgICByZXR1cm4gY29tcHV0ZWQ7XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgY29tcHV0ZVdyYXBwaW5nKHRhcmdldCkge1xuICAgICAgICBsZXQgc2VlbiA9IE9iamVjdC5jcmVhdGUobnVsbCksIGFjdGl2ZSA9IFt7IG1hdGNoOiB0aGlzLCB0eXBlOiBudWxsLCB2aWE6IG51bGwgfV07XG4gICAgICAgIHdoaWxlIChhY3RpdmUubGVuZ3RoKSB7XG4gICAgICAgICAgICBsZXQgY3VycmVudCA9IGFjdGl2ZS5zaGlmdCgpLCBtYXRjaCA9IGN1cnJlbnQubWF0Y2g7XG4gICAgICAgICAgICBpZiAobWF0Y2gubWF0Y2hUeXBlKHRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgb2JqID0gY3VycmVudDsgb2JqLnR5cGU7IG9iaiA9IG9iai52aWEpXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG9iai50eXBlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnJldmVyc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2gubmV4dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCB7IHR5cGUsIG5leHQgfSA9IG1hdGNoLm5leHRbaV07XG4gICAgICAgICAgICAgICAgaWYgKCF0eXBlLmlzTGVhZiAmJiAhdHlwZS5oYXNSZXF1aXJlZEF0dHJzKCkgJiYgISh0eXBlLm5hbWUgaW4gc2VlbikgJiYgKCFjdXJyZW50LnR5cGUgfHwgbmV4dC52YWxpZEVuZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlLnB1c2goeyBtYXRjaDogdHlwZS5jb250ZW50TWF0Y2gsIHR5cGUsIHZpYTogY3VycmVudCB9KTtcbiAgICAgICAgICAgICAgICAgICAgc2Vlblt0eXBlLm5hbWVdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIC8qKlxuICAgIFRoZSBudW1iZXIgb2Ygb3V0Z29pbmcgZWRnZXMgdGhpcyBub2RlIGhhcyBpbiB0aGUgZmluaXRlXG4gICAgYXV0b21hdG9uIHRoYXQgZGVzY3JpYmVzIHRoZSBjb250ZW50IGV4cHJlc3Npb24uXG4gICAgKi9cbiAgICBnZXQgZWRnZUNvdW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uZXh0Lmxlbmd0aDtcbiAgICB9XG4gICAgLyoqXG4gICAgR2V0IHRoZSBfbl9cdTIwMEJ0aCBvdXRnb2luZyBlZGdlIGZyb20gdGhpcyBub2RlIGluIHRoZSBmaW5pdGVcbiAgICBhdXRvbWF0b24gdGhhdCBkZXNjcmliZXMgdGhlIGNvbnRlbnQgZXhwcmVzc2lvbi5cbiAgICAqL1xuICAgIGVkZ2Uobikge1xuICAgICAgICBpZiAobiA+PSB0aGlzLm5leHQubGVuZ3RoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYFRoZXJlJ3Mgbm8gJHtufXRoIGVkZ2UgaW4gdGhpcyBjb250ZW50IG1hdGNoYCk7XG4gICAgICAgIHJldHVybiB0aGlzLm5leHRbbl07XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICAgIGxldCBzZWVuID0gW107XG4gICAgICAgIGZ1bmN0aW9uIHNjYW4obSkge1xuICAgICAgICAgICAgc2Vlbi5wdXNoKG0pO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtLm5leHQubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICAgICAgaWYgKHNlZW4uaW5kZXhPZihtLm5leHRbaV0ubmV4dCkgPT0gLTEpXG4gICAgICAgICAgICAgICAgICAgIHNjYW4obS5uZXh0W2ldLm5leHQpO1xuICAgICAgICB9XG4gICAgICAgIHNjYW4odGhpcyk7XG4gICAgICAgIHJldHVybiBzZWVuLm1hcCgobSwgaSkgPT4ge1xuICAgICAgICAgICAgbGV0IG91dCA9IGkgKyAobS52YWxpZEVuZCA/IFwiKlwiIDogXCIgXCIpICsgXCIgXCI7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG0ubmV4dC5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICBvdXQgKz0gKGkgPyBcIiwgXCIgOiBcIlwiKSArIG0ubmV4dFtpXS50eXBlLm5hbWUgKyBcIi0+XCIgKyBzZWVuLmluZGV4T2YobS5uZXh0W2ldLm5leHQpO1xuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfSkuam9pbihcIlxcblwiKTtcbiAgICB9XG59XG4vKipcbkBpbnRlcm5hbFxuKi9cbkNvbnRlbnRNYXRjaC5lbXB0eSA9IG5ldyBDb250ZW50TWF0Y2godHJ1ZSk7XG5jbGFzcyBUb2tlblN0cmVhbSB7XG4gICAgY29uc3RydWN0b3Ioc3RyaW5nLCBub2RlVHlwZXMpIHtcbiAgICAgICAgdGhpcy5zdHJpbmcgPSBzdHJpbmc7XG4gICAgICAgIHRoaXMubm9kZVR5cGVzID0gbm9kZVR5cGVzO1xuICAgICAgICB0aGlzLmlubGluZSA9IG51bGw7XG4gICAgICAgIHRoaXMucG9zID0gMDtcbiAgICAgICAgdGhpcy50b2tlbnMgPSBzdHJpbmcuc3BsaXQoL1xccyooPz1cXGJ8XFxXfCQpLyk7XG4gICAgICAgIGlmICh0aGlzLnRva2Vuc1t0aGlzLnRva2Vucy5sZW5ndGggLSAxXSA9PSBcIlwiKVxuICAgICAgICAgICAgdGhpcy50b2tlbnMucG9wKCk7XG4gICAgICAgIGlmICh0aGlzLnRva2Vuc1swXSA9PSBcIlwiKVxuICAgICAgICAgICAgdGhpcy50b2tlbnMuc2hpZnQoKTtcbiAgICB9XG4gICAgZ2V0IG5leHQoKSB7IHJldHVybiB0aGlzLnRva2Vuc1t0aGlzLnBvc107IH1cbiAgICBlYXQodG9rKSB7IHJldHVybiB0aGlzLm5leHQgPT0gdG9rICYmICh0aGlzLnBvcysrIHx8IHRydWUpOyB9XG4gICAgZXJyKHN0cikgeyB0aHJvdyBuZXcgU3ludGF4RXJyb3Ioc3RyICsgXCIgKGluIGNvbnRlbnQgZXhwcmVzc2lvbiAnXCIgKyB0aGlzLnN0cmluZyArIFwiJylcIik7IH1cbn1cbmZ1bmN0aW9uIHBhcnNlRXhwcihzdHJlYW0pIHtcbiAgICBsZXQgZXhwcnMgPSBbXTtcbiAgICBkbyB7XG4gICAgICAgIGV4cHJzLnB1c2gocGFyc2VFeHByU2VxKHN0cmVhbSkpO1xuICAgIH0gd2hpbGUgKHN0cmVhbS5lYXQoXCJ8XCIpKTtcbiAgICByZXR1cm4gZXhwcnMubGVuZ3RoID09IDEgPyBleHByc1swXSA6IHsgdHlwZTogXCJjaG9pY2VcIiwgZXhwcnMgfTtcbn1cbmZ1bmN0aW9uIHBhcnNlRXhwclNlcShzdHJlYW0pIHtcbiAgICBsZXQgZXhwcnMgPSBbXTtcbiAgICBkbyB7XG4gICAgICAgIGV4cHJzLnB1c2gocGFyc2VFeHByU3Vic2NyaXB0KHN0cmVhbSkpO1xuICAgIH0gd2hpbGUgKHN0cmVhbS5uZXh0ICYmIHN0cmVhbS5uZXh0ICE9IFwiKVwiICYmIHN0cmVhbS5uZXh0ICE9IFwifFwiKTtcbiAgICByZXR1cm4gZXhwcnMubGVuZ3RoID09IDEgPyBleHByc1swXSA6IHsgdHlwZTogXCJzZXFcIiwgZXhwcnMgfTtcbn1cbmZ1bmN0aW9uIHBhcnNlRXhwclN1YnNjcmlwdChzdHJlYW0pIHtcbiAgICBsZXQgZXhwciA9IHBhcnNlRXhwckF0b20oc3RyZWFtKTtcbiAgICBmb3IgKDs7KSB7XG4gICAgICAgIGlmIChzdHJlYW0uZWF0KFwiK1wiKSlcbiAgICAgICAgICAgIGV4cHIgPSB7IHR5cGU6IFwicGx1c1wiLCBleHByIH07XG4gICAgICAgIGVsc2UgaWYgKHN0cmVhbS5lYXQoXCIqXCIpKVxuICAgICAgICAgICAgZXhwciA9IHsgdHlwZTogXCJzdGFyXCIsIGV4cHIgfTtcbiAgICAgICAgZWxzZSBpZiAoc3RyZWFtLmVhdChcIj9cIikpXG4gICAgICAgICAgICBleHByID0geyB0eXBlOiBcIm9wdFwiLCBleHByIH07XG4gICAgICAgIGVsc2UgaWYgKHN0cmVhbS5lYXQoXCJ7XCIpKVxuICAgICAgICAgICAgZXhwciA9IHBhcnNlRXhwclJhbmdlKHN0cmVhbSwgZXhwcik7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gZXhwcjtcbn1cbmZ1bmN0aW9uIHBhcnNlTnVtKHN0cmVhbSkge1xuICAgIGlmICgvXFxELy50ZXN0KHN0cmVhbS5uZXh0KSlcbiAgICAgICAgc3RyZWFtLmVycihcIkV4cGVjdGVkIG51bWJlciwgZ290ICdcIiArIHN0cmVhbS5uZXh0ICsgXCInXCIpO1xuICAgIGxldCByZXN1bHQgPSBOdW1iZXIoc3RyZWFtLm5leHQpO1xuICAgIHN0cmVhbS5wb3MrKztcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gcGFyc2VFeHByUmFuZ2Uoc3RyZWFtLCBleHByKSB7XG4gICAgbGV0IG1pbiA9IHBhcnNlTnVtKHN0cmVhbSksIG1heCA9IG1pbjtcbiAgICBpZiAoc3RyZWFtLmVhdChcIixcIikpIHtcbiAgICAgICAgaWYgKHN0cmVhbS5uZXh0ICE9IFwifVwiKVxuICAgICAgICAgICAgbWF4ID0gcGFyc2VOdW0oc3RyZWFtKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbWF4ID0gLTE7XG4gICAgfVxuICAgIGlmICghc3RyZWFtLmVhdChcIn1cIikpXG4gICAgICAgIHN0cmVhbS5lcnIoXCJVbmNsb3NlZCBicmFjZWQgcmFuZ2VcIik7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJyYW5nZVwiLCBtaW4sIG1heCwgZXhwciB9O1xufVxuZnVuY3Rpb24gcmVzb2x2ZU5hbWUoc3RyZWFtLCBuYW1lKSB7XG4gICAgbGV0IHR5cGVzID0gc3RyZWFtLm5vZGVUeXBlcywgdHlwZSA9IHR5cGVzW25hbWVdO1xuICAgIGlmICh0eXBlKVxuICAgICAgICByZXR1cm4gW3R5cGVdO1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBmb3IgKGxldCB0eXBlTmFtZSBpbiB0eXBlcykge1xuICAgICAgICBsZXQgdHlwZSA9IHR5cGVzW3R5cGVOYW1lXTtcbiAgICAgICAgaWYgKHR5cGUuZ3JvdXBzLmluZGV4T2YobmFtZSkgPiAtMSlcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHR5cGUpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0Lmxlbmd0aCA9PSAwKVxuICAgICAgICBzdHJlYW0uZXJyKFwiTm8gbm9kZSB0eXBlIG9yIGdyb3VwICdcIiArIG5hbWUgKyBcIicgZm91bmRcIik7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIHBhcnNlRXhwckF0b20oc3RyZWFtKSB7XG4gICAgaWYgKHN0cmVhbS5lYXQoXCIoXCIpKSB7XG4gICAgICAgIGxldCBleHByID0gcGFyc2VFeHByKHN0cmVhbSk7XG4gICAgICAgIGlmICghc3RyZWFtLmVhdChcIilcIikpXG4gICAgICAgICAgICBzdHJlYW0uZXJyKFwiTWlzc2luZyBjbG9zaW5nIHBhcmVuXCIpO1xuICAgICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG4gICAgZWxzZSBpZiAoIS9cXFcvLnRlc3Qoc3RyZWFtLm5leHQpKSB7XG4gICAgICAgIGxldCBleHBycyA9IHJlc29sdmVOYW1lKHN0cmVhbSwgc3RyZWFtLm5leHQpLm1hcCh0eXBlID0+IHtcbiAgICAgICAgICAgIGlmIChzdHJlYW0uaW5saW5lID09IG51bGwpXG4gICAgICAgICAgICAgICAgc3RyZWFtLmlubGluZSA9IHR5cGUuaXNJbmxpbmU7XG4gICAgICAgICAgICBlbHNlIGlmIChzdHJlYW0uaW5saW5lICE9IHR5cGUuaXNJbmxpbmUpXG4gICAgICAgICAgICAgICAgc3RyZWFtLmVycihcIk1peGluZyBpbmxpbmUgYW5kIGJsb2NrIGNvbnRlbnRcIik7XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBcIm5hbWVcIiwgdmFsdWU6IHR5cGUgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIHN0cmVhbS5wb3MrKztcbiAgICAgICAgcmV0dXJuIGV4cHJzLmxlbmd0aCA9PSAxID8gZXhwcnNbMF0gOiB7IHR5cGU6IFwiY2hvaWNlXCIsIGV4cHJzIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzdHJlYW0uZXJyKFwiVW5leHBlY3RlZCB0b2tlbiAnXCIgKyBzdHJlYW0ubmV4dCArIFwiJ1wiKTtcbiAgICB9XG59XG4vKipcbkNvbnN0cnVjdCBhbiBORkEgZnJvbSBhbiBleHByZXNzaW9uIGFzIHJldHVybmVkIGJ5IHRoZSBwYXJzZXIuIFRoZVxuTkZBIGlzIHJlcHJlc2VudGVkIGFzIGFuIGFycmF5IG9mIHN0YXRlcywgd2hpY2ggYXJlIHRoZW1zZWx2ZXNcbmFycmF5cyBvZiBlZGdlcywgd2hpY2ggYXJlIGB7dGVybSwgdG99YCBvYmplY3RzLiBUaGUgZmlyc3Qgc3RhdGUgaXNcbnRoZSBlbnRyeSBzdGF0ZSBhbmQgdGhlIGxhc3Qgbm9kZSBpcyB0aGUgc3VjY2VzcyBzdGF0ZS5cblxuTm90ZSB0aGF0IHVubGlrZSB0eXBpY2FsIE5GQXMsIHRoZSBlZGdlIG9yZGVyaW5nIGluIHRoaXMgb25lIGlzXG5zaWduaWZpY2FudCwgaW4gdGhhdCBpdCBpcyB1c2VkIHRvIGNvbnRydWN0IGZpbGxlciBjb250ZW50IHdoZW5cbm5lY2Vzc2FyeS5cbiovXG5mdW5jdGlvbiBuZmEoZXhwcikge1xuICAgIGxldCBuZmEgPSBbW11dO1xuICAgIGNvbm5lY3QoY29tcGlsZShleHByLCAwKSwgbm9kZSgpKTtcbiAgICByZXR1cm4gbmZhO1xuICAgIGZ1bmN0aW9uIG5vZGUoKSB7IHJldHVybiBuZmEucHVzaChbXSkgLSAxOyB9XG4gICAgZnVuY3Rpb24gZWRnZShmcm9tLCB0bywgdGVybSkge1xuICAgICAgICBsZXQgZWRnZSA9IHsgdGVybSwgdG8gfTtcbiAgICAgICAgbmZhW2Zyb21dLnB1c2goZWRnZSk7XG4gICAgICAgIHJldHVybiBlZGdlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjb25uZWN0KGVkZ2VzLCB0bykge1xuICAgICAgICBlZGdlcy5mb3JFYWNoKGVkZ2UgPT4gZWRnZS50byA9IHRvKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY29tcGlsZShleHByLCBmcm9tKSB7XG4gICAgICAgIGlmIChleHByLnR5cGUgPT0gXCJjaG9pY2VcIikge1xuICAgICAgICAgICAgcmV0dXJuIGV4cHIuZXhwcnMucmVkdWNlKChvdXQsIGV4cHIpID0+IG91dC5jb25jYXQoY29tcGlsZShleHByLCBmcm9tKSksIFtdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChleHByLnR5cGUgPT0gXCJzZXFcIikge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7OyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgbmV4dCA9IGNvbXBpbGUoZXhwci5leHByc1tpXSwgZnJvbSk7XG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gZXhwci5leHBycy5sZW5ndGggLSAxKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgICAgICAgICBjb25uZWN0KG5leHQsIGZyb20gPSBub2RlKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGV4cHIudHlwZSA9PSBcInN0YXJcIikge1xuICAgICAgICAgICAgbGV0IGxvb3AgPSBub2RlKCk7XG4gICAgICAgICAgICBlZGdlKGZyb20sIGxvb3ApO1xuICAgICAgICAgICAgY29ubmVjdChjb21waWxlKGV4cHIuZXhwciwgbG9vcCksIGxvb3ApO1xuICAgICAgICAgICAgcmV0dXJuIFtlZGdlKGxvb3ApXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChleHByLnR5cGUgPT0gXCJwbHVzXCIpIHtcbiAgICAgICAgICAgIGxldCBsb29wID0gbm9kZSgpO1xuICAgICAgICAgICAgY29ubmVjdChjb21waWxlKGV4cHIuZXhwciwgZnJvbSksIGxvb3ApO1xuICAgICAgICAgICAgY29ubmVjdChjb21waWxlKGV4cHIuZXhwciwgbG9vcCksIGxvb3ApO1xuICAgICAgICAgICAgcmV0dXJuIFtlZGdlKGxvb3ApXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChleHByLnR5cGUgPT0gXCJvcHRcIikge1xuICAgICAgICAgICAgcmV0dXJuIFtlZGdlKGZyb20pXS5jb25jYXQoY29tcGlsZShleHByLmV4cHIsIGZyb20pKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChleHByLnR5cGUgPT0gXCJyYW5nZVwiKSB7XG4gICAgICAgICAgICBsZXQgY3VyID0gZnJvbTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXhwci5taW47IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBuZXh0ID0gbm9kZSgpO1xuICAgICAgICAgICAgICAgIGNvbm5lY3QoY29tcGlsZShleHByLmV4cHIsIGN1ciksIG5leHQpO1xuICAgICAgICAgICAgICAgIGN1ciA9IG5leHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXhwci5tYXggPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBjb25uZWN0KGNvbXBpbGUoZXhwci5leHByLCBjdXIpLCBjdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGV4cHIubWluOyBpIDwgZXhwci5tYXg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dCA9IG5vZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgZWRnZShjdXIsIG5leHQpO1xuICAgICAgICAgICAgICAgICAgICBjb25uZWN0KGNvbXBpbGUoZXhwci5leHByLCBjdXIpLCBuZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgY3VyID0gbmV4dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gW2VkZ2UoY3VyKV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZXhwci50eXBlID09IFwibmFtZVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gW2VkZ2UoZnJvbSwgdW5kZWZpbmVkLCBleHByLnZhbHVlKV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIGV4cHIgdHlwZVwiKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGNtcChhLCBiKSB7IHJldHVybiBiIC0gYTsgfVxuLy8gR2V0IHRoZSBzZXQgb2Ygbm9kZXMgcmVhY2hhYmxlIGJ5IG51bGwgZWRnZXMgZnJvbSBgbm9kZWAuIE9taXRcbi8vIG5vZGVzIHdpdGggb25seSBhIHNpbmdsZSBudWxsLW91dC1lZGdlLCBzaW5jZSB0aGV5IG1heSBsZWFkIHRvXG4vLyBuZWVkbGVzcyBkdXBsaWNhdGVkIG5vZGVzLlxuZnVuY3Rpb24gbnVsbEZyb20obmZhLCBub2RlKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHNjYW4obm9kZSk7XG4gICAgcmV0dXJuIHJlc3VsdC5zb3J0KGNtcCk7XG4gICAgZnVuY3Rpb24gc2Nhbihub2RlKSB7XG4gICAgICAgIGxldCBlZGdlcyA9IG5mYVtub2RlXTtcbiAgICAgICAgaWYgKGVkZ2VzLmxlbmd0aCA9PSAxICYmICFlZGdlc1swXS50ZXJtKVxuICAgICAgICAgICAgcmV0dXJuIHNjYW4oZWRnZXNbMF0udG8pO1xuICAgICAgICByZXN1bHQucHVzaChub2RlKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlZGdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHsgdGVybSwgdG8gfSA9IGVkZ2VzW2ldO1xuICAgICAgICAgICAgaWYgKCF0ZXJtICYmIHJlc3VsdC5pbmRleE9mKHRvKSA9PSAtMSlcbiAgICAgICAgICAgICAgICBzY2FuKHRvKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vIENvbXBpbGVzIGFuIE5GQSBhcyBwcm9kdWNlZCBieSBgbmZhYCBpbnRvIGEgREZBLCBtb2RlbGVkIGFzIGEgc2V0XG4vLyBvZiBzdGF0ZSBvYmplY3RzIChgQ29udGVudE1hdGNoYCBpbnN0YW5jZXMpIHdpdGggdHJhbnNpdGlvbnNcbi8vIGJldHdlZW4gdGhlbS5cbmZ1bmN0aW9uIGRmYShuZmEpIHtcbiAgICBsZXQgbGFiZWxlZCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgcmV0dXJuIGV4cGxvcmUobnVsbEZyb20obmZhLCAwKSk7XG4gICAgZnVuY3Rpb24gZXhwbG9yZShzdGF0ZXMpIHtcbiAgICAgICAgbGV0IG91dCA9IFtdO1xuICAgICAgICBzdGF0ZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICAgICAgICAgIG5mYVtub2RlXS5mb3JFYWNoKCh7IHRlcm0sIHRvIH0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRlcm0pXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBsZXQgc2V0O1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgICAgICBpZiAob3V0W2ldWzBdID09IHRlcm0pXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQgPSBvdXRbaV1bMV07XG4gICAgICAgICAgICAgICAgbnVsbEZyb20obmZhLCB0bykuZm9yRWFjaChub2RlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChbdGVybSwgc2V0ID0gW11dKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNldC5pbmRleE9mKG5vZGUpID09IC0xKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0LnB1c2gobm9kZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBzdGF0ZSA9IGxhYmVsZWRbc3RhdGVzLmpvaW4oXCIsXCIpXSA9IG5ldyBDb250ZW50TWF0Y2goc3RhdGVzLmluZGV4T2YobmZhLmxlbmd0aCAtIDEpID4gLTEpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG91dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHN0YXRlcyA9IG91dFtpXVsxXS5zb3J0KGNtcCk7XG4gICAgICAgICAgICBzdGF0ZS5uZXh0LnB1c2goeyB0eXBlOiBvdXRbaV1bMF0sIG5leHQ6IGxhYmVsZWRbc3RhdGVzLmpvaW4oXCIsXCIpXSB8fCBleHBsb3JlKHN0YXRlcykgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNoZWNrRm9yRGVhZEVuZHMobWF0Y2gsIHN0cmVhbSkge1xuICAgIGZvciAobGV0IGkgPSAwLCB3b3JrID0gW21hdGNoXTsgaSA8IHdvcmsubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHN0YXRlID0gd29ya1tpXSwgZGVhZCA9ICFzdGF0ZS52YWxpZEVuZCwgbm9kZXMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzdGF0ZS5uZXh0Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBsZXQgeyB0eXBlLCBuZXh0IH0gPSBzdGF0ZS5uZXh0W2pdO1xuICAgICAgICAgICAgbm9kZXMucHVzaCh0eXBlLm5hbWUpO1xuICAgICAgICAgICAgaWYgKGRlYWQgJiYgISh0eXBlLmlzVGV4dCB8fCB0eXBlLmhhc1JlcXVpcmVkQXR0cnMoKSkpXG4gICAgICAgICAgICAgICAgZGVhZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKHdvcmsuaW5kZXhPZihuZXh0KSA9PSAtMSlcbiAgICAgICAgICAgICAgICB3b3JrLnB1c2gobmV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRlYWQpXG4gICAgICAgICAgICBzdHJlYW0uZXJyKFwiT25seSBub24tZ2VuZXJhdGFibGUgbm9kZXMgKFwiICsgbm9kZXMuam9pbihcIiwgXCIpICsgXCIpIGluIGEgcmVxdWlyZWQgcG9zaXRpb24gKHNlZSBodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL2d1aWRlLyNnZW5lcmF0YWJsZSlcIik7XG4gICAgfVxufVxuXG4vLyBGb3Igbm9kZSB0eXBlcyB3aGVyZSBhbGwgYXR0cnMgaGF2ZSBhIGRlZmF1bHQgdmFsdWUgKG9yIHdoaWNoIGRvbid0XG4vLyBoYXZlIGFueSBhdHRyaWJ1dGVzKSwgYnVpbGQgdXAgYSBzaW5nbGUgcmV1c2FibGUgZGVmYXVsdCBhdHRyaWJ1dGVcbi8vIG9iamVjdCwgYW5kIHVzZSBpdCBmb3IgYWxsIG5vZGVzIHRoYXQgZG9uJ3Qgc3BlY2lmeSBzcGVjaWZpY1xuLy8gYXR0cmlidXRlcy5cbmZ1bmN0aW9uIGRlZmF1bHRBdHRycyhhdHRycykge1xuICAgIGxldCBkZWZhdWx0cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgZm9yIChsZXQgYXR0ck5hbWUgaW4gYXR0cnMpIHtcbiAgICAgICAgbGV0IGF0dHIgPSBhdHRyc1thdHRyTmFtZV07XG4gICAgICAgIGlmICghYXR0ci5oYXNEZWZhdWx0KVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGRlZmF1bHRzW2F0dHJOYW1lXSA9IGF0dHIuZGVmYXVsdDtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmF1bHRzO1xufVxuZnVuY3Rpb24gY29tcHV0ZUF0dHJzKGF0dHJzLCB2YWx1ZSkge1xuICAgIGxldCBidWlsdCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgZm9yIChsZXQgbmFtZSBpbiBhdHRycykge1xuICAgICAgICBsZXQgZ2l2ZW4gPSB2YWx1ZSAmJiB2YWx1ZVtuYW1lXTtcbiAgICAgICAgaWYgKGdpdmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGxldCBhdHRyID0gYXR0cnNbbmFtZV07XG4gICAgICAgICAgICBpZiAoYXR0ci5oYXNEZWZhdWx0KVxuICAgICAgICAgICAgICAgIGdpdmVuID0gYXR0ci5kZWZhdWx0O1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiTm8gdmFsdWUgc3VwcGxpZWQgZm9yIGF0dHJpYnV0ZSBcIiArIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGJ1aWx0W25hbWVdID0gZ2l2ZW47XG4gICAgfVxuICAgIHJldHVybiBidWlsdDtcbn1cbmZ1bmN0aW9uIGNoZWNrQXR0cnMoYXR0cnMsIHZhbHVlcywgdHlwZSwgbmFtZSkge1xuICAgIGZvciAobGV0IG5hbWUgaW4gdmFsdWVzKVxuICAgICAgICBpZiAoIShuYW1lIGluIGF0dHJzKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKGBVbnN1cHBvcnRlZCBhdHRyaWJ1dGUgJHtuYW1lfSBmb3IgJHt0eXBlfSBvZiB0eXBlICR7bmFtZX1gKTtcbiAgICBmb3IgKGxldCBuYW1lIGluIGF0dHJzKSB7XG4gICAgICAgIGxldCBhdHRyID0gYXR0cnNbbmFtZV07XG4gICAgICAgIGlmIChhdHRyLnZhbGlkYXRlKVxuICAgICAgICAgICAgYXR0ci52YWxpZGF0ZSh2YWx1ZXNbbmFtZV0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGluaXRBdHRycyh0eXBlTmFtZSwgYXR0cnMpIHtcbiAgICBsZXQgcmVzdWx0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBpZiAoYXR0cnMpXG4gICAgICAgIGZvciAobGV0IG5hbWUgaW4gYXR0cnMpXG4gICAgICAgICAgICByZXN1bHRbbmFtZV0gPSBuZXcgQXR0cmlidXRlKHR5cGVOYW1lLCBuYW1lLCBhdHRyc1tuYW1lXSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbi8qKlxuTm9kZSB0eXBlcyBhcmUgb2JqZWN0cyBhbGxvY2F0ZWQgb25jZSBwZXIgYFNjaGVtYWAgYW5kIHVzZWQgdG9cblt0YWddKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5Ob2RlLnR5cGUpIGBOb2RlYCBpbnN0YW5jZXMuIFRoZXkgY29udGFpbiBpbmZvcm1hdGlvblxuYWJvdXQgdGhlIG5vZGUgdHlwZSwgc3VjaCBhcyBpdHMgbmFtZSBhbmQgd2hhdCBraW5kIG9mIG5vZGUgaXRcbnJlcHJlc2VudHMuXG4qL1xuY2xhc3MgTm9kZVR5cGUge1xuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgLyoqXG4gICAgVGhlIG5hbWUgdGhlIG5vZGUgdHlwZSBoYXMgaW4gdGhpcyBzY2hlbWEuXG4gICAgKi9cbiAgICBuYW1lLCBcbiAgICAvKipcbiAgICBBIGxpbmsgYmFjayB0byB0aGUgYFNjaGVtYWAgdGhlIG5vZGUgdHlwZSBiZWxvbmdzIHRvLlxuICAgICovXG4gICAgc2NoZW1hLCBcbiAgICAvKipcbiAgICBUaGUgc3BlYyB0aGF0IHRoaXMgdHlwZSBpcyBiYXNlZCBvblxuICAgICovXG4gICAgc3BlYykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnNjaGVtYSA9IHNjaGVtYTtcbiAgICAgICAgdGhpcy5zcGVjID0gc3BlYztcbiAgICAgICAgLyoqXG4gICAgICAgIFRoZSBzZXQgb2YgbWFya3MgYWxsb3dlZCBpbiB0aGlzIG5vZGUuIGBudWxsYCBtZWFucyBhbGwgbWFya3NcbiAgICAgICAgYXJlIGFsbG93ZWQuXG4gICAgICAgICovXG4gICAgICAgIHRoaXMubWFya1NldCA9IG51bGw7XG4gICAgICAgIHRoaXMuZ3JvdXBzID0gc3BlYy5ncm91cCA/IHNwZWMuZ3JvdXAuc3BsaXQoXCIgXCIpIDogW107XG4gICAgICAgIHRoaXMuYXR0cnMgPSBpbml0QXR0cnMobmFtZSwgc3BlYy5hdHRycyk7XG4gICAgICAgIHRoaXMuZGVmYXVsdEF0dHJzID0gZGVmYXVsdEF0dHJzKHRoaXMuYXR0cnMpO1xuICAgICAgICB0aGlzLmNvbnRlbnRNYXRjaCA9IG51bGw7XG4gICAgICAgIHRoaXMuaW5saW5lQ29udGVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuaXNCbG9jayA9ICEoc3BlYy5pbmxpbmUgfHwgbmFtZSA9PSBcInRleHRcIik7XG4gICAgICAgIHRoaXMuaXNUZXh0ID0gbmFtZSA9PSBcInRleHRcIjtcbiAgICB9XG4gICAgLyoqXG4gICAgVHJ1ZSBpZiB0aGlzIGlzIGFuIGlubGluZSB0eXBlLlxuICAgICovXG4gICAgZ2V0IGlzSW5saW5lKCkgeyByZXR1cm4gIXRoaXMuaXNCbG9jazsgfVxuICAgIC8qKlxuICAgIFRydWUgaWYgdGhpcyBpcyBhIHRleHRibG9jayB0eXBlLCBhIGJsb2NrIHRoYXQgY29udGFpbnMgaW5saW5lXG4gICAgY29udGVudC5cbiAgICAqL1xuICAgIGdldCBpc1RleHRibG9jaygpIHsgcmV0dXJuIHRoaXMuaXNCbG9jayAmJiB0aGlzLmlubGluZUNvbnRlbnQ7IH1cbiAgICAvKipcbiAgICBUcnVlIGZvciBub2RlIHR5cGVzIHRoYXQgYWxsb3cgbm8gY29udGVudC5cbiAgICAqL1xuICAgIGdldCBpc0xlYWYoKSB7IHJldHVybiB0aGlzLmNvbnRlbnRNYXRjaCA9PSBDb250ZW50TWF0Y2guZW1wdHk7IH1cbiAgICAvKipcbiAgICBUcnVlIHdoZW4gdGhpcyBub2RlIGlzIGFuIGF0b20sIGkuZS4gd2hlbiBpdCBkb2VzIG5vdCBoYXZlXG4gICAgZGlyZWN0bHkgZWRpdGFibGUgY29udGVudC5cbiAgICAqL1xuICAgIGdldCBpc0F0b20oKSB7IHJldHVybiB0aGlzLmlzTGVhZiB8fCAhIXRoaXMuc3BlYy5hdG9tOyB9XG4gICAgLyoqXG4gICAgVGhlIG5vZGUgdHlwZSdzIFt3aGl0ZXNwYWNlXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTm9kZVNwZWMud2hpdGVzcGFjZSkgb3B0aW9uLlxuICAgICovXG4gICAgZ2V0IHdoaXRlc3BhY2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNwZWMud2hpdGVzcGFjZSB8fCAodGhpcy5zcGVjLmNvZGUgPyBcInByZVwiIDogXCJub3JtYWxcIik7XG4gICAgfVxuICAgIC8qKlxuICAgIFRlbGxzIHlvdSB3aGV0aGVyIHRoaXMgbm9kZSB0eXBlIGhhcyBhbnkgcmVxdWlyZWQgYXR0cmlidXRlcy5cbiAgICAqL1xuICAgIGhhc1JlcXVpcmVkQXR0cnMoKSB7XG4gICAgICAgIGZvciAobGV0IG4gaW4gdGhpcy5hdHRycylcbiAgICAgICAgICAgIGlmICh0aGlzLmF0dHJzW25dLmlzUmVxdWlyZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLyoqXG4gICAgSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBub2RlIGFsbG93cyBzb21lIG9mIHRoZSBzYW1lIGNvbnRlbnQgYXNcbiAgICB0aGUgZ2l2ZW4gbm9kZSB0eXBlLlxuICAgICovXG4gICAgY29tcGF0aWJsZUNvbnRlbnQob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMgPT0gb3RoZXIgfHwgdGhpcy5jb250ZW50TWF0Y2guY29tcGF0aWJsZShvdGhlci5jb250ZW50TWF0Y2gpO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIGNvbXB1dGVBdHRycyhhdHRycykge1xuICAgICAgICBpZiAoIWF0dHJzICYmIHRoaXMuZGVmYXVsdEF0dHJzKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVmYXVsdEF0dHJzO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gY29tcHV0ZUF0dHJzKHRoaXMuYXR0cnMsIGF0dHJzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQ3JlYXRlIGEgYE5vZGVgIG9mIHRoaXMgdHlwZS4gVGhlIGdpdmVuIGF0dHJpYnV0ZXMgYXJlXG4gICAgY2hlY2tlZCBhbmQgZGVmYXVsdGVkICh5b3UgY2FuIHBhc3MgYG51bGxgIHRvIHVzZSB0aGUgdHlwZSdzXG4gICAgZGVmYXVsdHMgZW50aXJlbHksIGlmIG5vIHJlcXVpcmVkIGF0dHJpYnV0ZXMgZXhpc3QpLiBgY29udGVudGBcbiAgICBtYXkgYmUgYSBgRnJhZ21lbnRgLCBhIG5vZGUsIGFuIGFycmF5IG9mIG5vZGVzLCBvclxuICAgIGBudWxsYC4gU2ltaWxhcmx5IGBtYXJrc2AgbWF5IGJlIGBudWxsYCB0byBkZWZhdWx0IHRvIHRoZSBlbXB0eVxuICAgIHNldCBvZiBtYXJrcy5cbiAgICAqL1xuICAgIGNyZWF0ZShhdHRycyA9IG51bGwsIGNvbnRlbnQsIG1hcmtzKSB7XG4gICAgICAgIGlmICh0aGlzLmlzVGV4dClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vZGVUeXBlLmNyZWF0ZSBjYW4ndCBjb25zdHJ1Y3QgdGV4dCBub2Rlc1wiKTtcbiAgICAgICAgcmV0dXJuIG5ldyBOb2RlKHRoaXMsIHRoaXMuY29tcHV0ZUF0dHJzKGF0dHJzKSwgRnJhZ21lbnQuZnJvbShjb250ZW50KSwgTWFyay5zZXRGcm9tKG1hcmtzKSk7XG4gICAgfVxuICAgIC8qKlxuICAgIExpa2UgW2BjcmVhdGVgXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTm9kZVR5cGUuY3JlYXRlKSwgYnV0IGNoZWNrIHRoZSBnaXZlbiBjb250ZW50XG4gICAgYWdhaW5zdCB0aGUgbm9kZSB0eXBlJ3MgY29udGVudCByZXN0cmljdGlvbnMsIGFuZCB0aHJvdyBhbiBlcnJvclxuICAgIGlmIGl0IGRvZXNuJ3QgbWF0Y2guXG4gICAgKi9cbiAgICBjcmVhdGVDaGVja2VkKGF0dHJzID0gbnVsbCwgY29udGVudCwgbWFya3MpIHtcbiAgICAgICAgY29udGVudCA9IEZyYWdtZW50LmZyb20oY29udGVudCk7XG4gICAgICAgIHRoaXMuY2hlY2tDb250ZW50KGNvbnRlbnQpO1xuICAgICAgICByZXR1cm4gbmV3IE5vZGUodGhpcywgdGhpcy5jb21wdXRlQXR0cnMoYXR0cnMpLCBjb250ZW50LCBNYXJrLnNldEZyb20obWFya3MpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgTGlrZSBbYGNyZWF0ZWBdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5Ob2RlVHlwZS5jcmVhdGUpLCBidXQgc2VlIGlmIGl0IGlzXG4gICAgbmVjZXNzYXJ5IHRvIGFkZCBub2RlcyB0byB0aGUgc3RhcnQgb3IgZW5kIG9mIHRoZSBnaXZlbiBmcmFnbWVudFxuICAgIHRvIG1ha2UgaXQgZml0IHRoZSBub2RlLiBJZiBubyBmaXR0aW5nIHdyYXBwaW5nIGNhbiBiZSBmb3VuZCxcbiAgICByZXR1cm4gbnVsbC4gTm90ZSB0aGF0LCBkdWUgdG8gdGhlIGZhY3QgdGhhdCByZXF1aXJlZCBub2RlcyBjYW5cbiAgICBhbHdheXMgYmUgY3JlYXRlZCwgdGhpcyB3aWxsIGFsd2F5cyBzdWNjZWVkIGlmIHlvdSBwYXNzIG51bGwgb3JcbiAgICBgRnJhZ21lbnQuZW1wdHlgIGFzIGNvbnRlbnQuXG4gICAgKi9cbiAgICBjcmVhdGVBbmRGaWxsKGF0dHJzID0gbnVsbCwgY29udGVudCwgbWFya3MpIHtcbiAgICAgICAgYXR0cnMgPSB0aGlzLmNvbXB1dGVBdHRycyhhdHRycyk7XG4gICAgICAgIGNvbnRlbnQgPSBGcmFnbWVudC5mcm9tKGNvbnRlbnQpO1xuICAgICAgICBpZiAoY29udGVudC5zaXplKSB7XG4gICAgICAgICAgICBsZXQgYmVmb3JlID0gdGhpcy5jb250ZW50TWF0Y2guZmlsbEJlZm9yZShjb250ZW50KTtcbiAgICAgICAgICAgIGlmICghYmVmb3JlKVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgY29udGVudCA9IGJlZm9yZS5hcHBlbmQoY29udGVudCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG1hdGNoZWQgPSB0aGlzLmNvbnRlbnRNYXRjaC5tYXRjaEZyYWdtZW50KGNvbnRlbnQpO1xuICAgICAgICBsZXQgYWZ0ZXIgPSBtYXRjaGVkICYmIG1hdGNoZWQuZmlsbEJlZm9yZShGcmFnbWVudC5lbXB0eSwgdHJ1ZSk7XG4gICAgICAgIGlmICghYWZ0ZXIpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgcmV0dXJuIG5ldyBOb2RlKHRoaXMsIGF0dHJzLCBjb250ZW50LmFwcGVuZChhZnRlciksIE1hcmsuc2V0RnJvbShtYXJrcykpO1xuICAgIH1cbiAgICAvKipcbiAgICBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIGZyYWdtZW50IGlzIHZhbGlkIGNvbnRlbnQgZm9yIHRoaXMgbm9kZVxuICAgIHR5cGUuXG4gICAgKi9cbiAgICB2YWxpZENvbnRlbnQoY29udGVudCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5jb250ZW50TWF0Y2gubWF0Y2hGcmFnbWVudChjb250ZW50KTtcbiAgICAgICAgaWYgKCFyZXN1bHQgfHwgIXJlc3VsdC52YWxpZEVuZClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250ZW50LmNoaWxkQ291bnQ7IGkrKylcbiAgICAgICAgICAgIGlmICghdGhpcy5hbGxvd3NNYXJrcyhjb250ZW50LmNoaWxkKGkpLm1hcmtzKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKipcbiAgICBUaHJvd3MgYSBSYW5nZUVycm9yIGlmIHRoZSBnaXZlbiBmcmFnbWVudCBpcyBub3QgdmFsaWQgY29udGVudCBmb3IgdGhpc1xuICAgIG5vZGUgdHlwZS5cbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIGNoZWNrQ29udGVudChjb250ZW50KSB7XG4gICAgICAgIGlmICghdGhpcy52YWxpZENvbnRlbnQoY29udGVudCkpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgSW52YWxpZCBjb250ZW50IGZvciBub2RlICR7dGhpcy5uYW1lfTogJHtjb250ZW50LnRvU3RyaW5nKCkuc2xpY2UoMCwgNTApfWApO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIGNoZWNrQXR0cnMoYXR0cnMpIHtcbiAgICAgICAgY2hlY2tBdHRycyh0aGlzLmF0dHJzLCBhdHRycywgXCJub2RlXCIsIHRoaXMubmFtZSk7XG4gICAgfVxuICAgIC8qKlxuICAgIENoZWNrIHdoZXRoZXIgdGhlIGdpdmVuIG1hcmsgdHlwZSBpcyBhbGxvd2VkIGluIHRoaXMgbm9kZS5cbiAgICAqL1xuICAgIGFsbG93c01hcmtUeXBlKG1hcmtUeXBlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtTZXQgPT0gbnVsbCB8fCB0aGlzLm1hcmtTZXQuaW5kZXhPZihtYXJrVHlwZSkgPiAtMTtcbiAgICB9XG4gICAgLyoqXG4gICAgVGVzdCB3aGV0aGVyIHRoZSBnaXZlbiBzZXQgb2YgbWFya3MgYXJlIGFsbG93ZWQgaW4gdGhpcyBub2RlLlxuICAgICovXG4gICAgYWxsb3dzTWFya3MobWFya3MpIHtcbiAgICAgICAgaWYgKHRoaXMubWFya1NldCA9PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWFya3MubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBpZiAoIXRoaXMuYWxsb3dzTWFya1R5cGUobWFya3NbaV0udHlwZSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgUmVtb3ZlcyB0aGUgbWFya3MgdGhhdCBhcmUgbm90IGFsbG93ZWQgaW4gdGhpcyBub2RlIGZyb20gdGhlIGdpdmVuIHNldC5cbiAgICAqL1xuICAgIGFsbG93ZWRNYXJrcyhtYXJrcykge1xuICAgICAgICBpZiAodGhpcy5tYXJrU2V0ID09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gbWFya3M7XG4gICAgICAgIGxldCBjb3B5O1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hcmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuYWxsb3dzTWFya1R5cGUobWFya3NbaV0udHlwZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNvcHkpXG4gICAgICAgICAgICAgICAgICAgIGNvcHkgPSBtYXJrcy5zbGljZSgwLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGNvcHkpIHtcbiAgICAgICAgICAgICAgICBjb3B5LnB1c2gobWFya3NbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAhY29weSA/IG1hcmtzIDogY29weS5sZW5ndGggPyBjb3B5IDogTWFyay5ub25lO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHN0YXRpYyBjb21waWxlKG5vZGVzLCBzY2hlbWEpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgIG5vZGVzLmZvckVhY2goKG5hbWUsIHNwZWMpID0+IHJlc3VsdFtuYW1lXSA9IG5ldyBOb2RlVHlwZShuYW1lLCBzY2hlbWEsIHNwZWMpKTtcbiAgICAgICAgbGV0IHRvcFR5cGUgPSBzY2hlbWEuc3BlYy50b3BOb2RlIHx8IFwiZG9jXCI7XG4gICAgICAgIGlmICghcmVzdWx0W3RvcFR5cGVdKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJTY2hlbWEgaXMgbWlzc2luZyBpdHMgdG9wIG5vZGUgdHlwZSAoJ1wiICsgdG9wVHlwZSArIFwiJylcIik7XG4gICAgICAgIGlmICghcmVzdWx0LnRleHQpXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkV2ZXJ5IHNjaGVtYSBuZWVkcyBhICd0ZXh0JyB0eXBlXCIpO1xuICAgICAgICBmb3IgKGxldCBfIGluIHJlc3VsdC50ZXh0LmF0dHJzKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJUaGUgdGV4dCBub2RlIHR5cGUgc2hvdWxkIG5vdCBoYXZlIGF0dHJpYnV0ZXNcIik7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuZnVuY3Rpb24gdmFsaWRhdGVUeXBlKHR5cGVOYW1lLCBhdHRyTmFtZSwgdHlwZSkge1xuICAgIGxldCB0eXBlcyA9IHR5cGUuc3BsaXQoXCJ8XCIpO1xuICAgIHJldHVybiAodmFsdWUpID0+IHtcbiAgICAgICAgbGV0IG5hbWUgPSB2YWx1ZSA9PT0gbnVsbCA/IFwibnVsbFwiIDogdHlwZW9mIHZhbHVlO1xuICAgICAgICBpZiAodHlwZXMuaW5kZXhPZihuYW1lKSA8IDApXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgRXhwZWN0ZWQgdmFsdWUgb2YgdHlwZSAke3R5cGVzfSBmb3IgYXR0cmlidXRlICR7YXR0ck5hbWV9IG9uIHR5cGUgJHt0eXBlTmFtZX0sIGdvdCAke25hbWV9YCk7XG4gICAgfTtcbn1cbi8vIEF0dHJpYnV0ZSBkZXNjcmlwdG9yc1xuY2xhc3MgQXR0cmlidXRlIHtcbiAgICBjb25zdHJ1Y3Rvcih0eXBlTmFtZSwgYXR0ck5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5oYXNEZWZhdWx0ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsIFwiZGVmYXVsdFwiKTtcbiAgICAgICAgdGhpcy5kZWZhdWx0ID0gb3B0aW9ucy5kZWZhdWx0O1xuICAgICAgICB0aGlzLnZhbGlkYXRlID0gdHlwZW9mIG9wdGlvbnMudmFsaWRhdGUgPT0gXCJzdHJpbmdcIiA/IHZhbGlkYXRlVHlwZSh0eXBlTmFtZSwgYXR0ck5hbWUsIG9wdGlvbnMudmFsaWRhdGUpIDogb3B0aW9ucy52YWxpZGF0ZTtcbiAgICB9XG4gICAgZ2V0IGlzUmVxdWlyZWQoKSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5oYXNEZWZhdWx0O1xuICAgIH1cbn1cbi8vIE1hcmtzXG4vKipcbkxpa2Ugbm9kZXMsIG1hcmtzICh3aGljaCBhcmUgYXNzb2NpYXRlZCB3aXRoIG5vZGVzIHRvIHNpZ25pZnlcbnRoaW5ncyBsaWtlIGVtcGhhc2lzIG9yIGJlaW5nIHBhcnQgb2YgYSBsaW5rKSBhcmVcblt0YWdnZWRdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5NYXJrLnR5cGUpIHdpdGggdHlwZSBvYmplY3RzLCB3aGljaCBhcmVcbmluc3RhbnRpYXRlZCBvbmNlIHBlciBgU2NoZW1hYC5cbiovXG5jbGFzcyBNYXJrVHlwZSB7XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAvKipcbiAgICBUaGUgbmFtZSBvZiB0aGUgbWFyayB0eXBlLlxuICAgICovXG4gICAgbmFtZSwgXG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICByYW5rLCBcbiAgICAvKipcbiAgICBUaGUgc2NoZW1hIHRoYXQgdGhpcyBtYXJrIHR5cGUgaW5zdGFuY2UgaXMgcGFydCBvZi5cbiAgICAqL1xuICAgIHNjaGVtYSwgXG4gICAgLyoqXG4gICAgVGhlIHNwZWMgb24gd2hpY2ggdGhlIHR5cGUgaXMgYmFzZWQuXG4gICAgKi9cbiAgICBzcGVjKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMucmFuayA9IHJhbms7XG4gICAgICAgIHRoaXMuc2NoZW1hID0gc2NoZW1hO1xuICAgICAgICB0aGlzLnNwZWMgPSBzcGVjO1xuICAgICAgICB0aGlzLmF0dHJzID0gaW5pdEF0dHJzKG5hbWUsIHNwZWMuYXR0cnMpO1xuICAgICAgICB0aGlzLmV4Y2x1ZGVkID0gbnVsbDtcbiAgICAgICAgbGV0IGRlZmF1bHRzID0gZGVmYXVsdEF0dHJzKHRoaXMuYXR0cnMpO1xuICAgICAgICB0aGlzLmluc3RhbmNlID0gZGVmYXVsdHMgPyBuZXcgTWFyayh0aGlzLCBkZWZhdWx0cykgOiBudWxsO1xuICAgIH1cbiAgICAvKipcbiAgICBDcmVhdGUgYSBtYXJrIG9mIHRoaXMgdHlwZS4gYGF0dHJzYCBtYXkgYmUgYG51bGxgIG9yIGFuIG9iamVjdFxuICAgIGNvbnRhaW5pbmcgb25seSBzb21lIG9mIHRoZSBtYXJrJ3MgYXR0cmlidXRlcy4gVGhlIG90aGVycywgaWZcbiAgICB0aGV5IGhhdmUgZGVmYXVsdHMsIHdpbGwgYmUgYWRkZWQuXG4gICAgKi9cbiAgICBjcmVhdGUoYXR0cnMgPSBudWxsKSB7XG4gICAgICAgIGlmICghYXR0cnMgJiYgdGhpcy5pbnN0YW5jZSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlO1xuICAgICAgICByZXR1cm4gbmV3IE1hcmsodGhpcywgY29tcHV0ZUF0dHJzKHRoaXMuYXR0cnMsIGF0dHJzKSk7XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgc3RhdGljIGNvbXBpbGUobWFya3MsIHNjaGVtYSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gT2JqZWN0LmNyZWF0ZShudWxsKSwgcmFuayA9IDA7XG4gICAgICAgIG1hcmtzLmZvckVhY2goKG5hbWUsIHNwZWMpID0+IHJlc3VsdFtuYW1lXSA9IG5ldyBNYXJrVHlwZShuYW1lLCByYW5rKyssIHNjaGVtYSwgc3BlYykpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICAvKipcbiAgICBXaGVuIHRoZXJlIGlzIGEgbWFyayBvZiB0aGlzIHR5cGUgaW4gdGhlIGdpdmVuIHNldCwgYSBuZXcgc2V0XG4gICAgd2l0aG91dCBpdCBpcyByZXR1cm5lZC4gT3RoZXJ3aXNlLCB0aGUgaW5wdXQgc2V0IGlzIHJldHVybmVkLlxuICAgICovXG4gICAgcmVtb3ZlRnJvbVNldChzZXQpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZXQubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBpZiAoc2V0W2ldLnR5cGUgPT0gdGhpcykge1xuICAgICAgICAgICAgICAgIHNldCA9IHNldC5zbGljZSgwLCBpKS5jb25jYXQoc2V0LnNsaWNlKGkgKyAxKSk7XG4gICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2V0O1xuICAgIH1cbiAgICAvKipcbiAgICBUZXN0cyB3aGV0aGVyIHRoZXJlIGlzIGEgbWFyayBvZiB0aGlzIHR5cGUgaW4gdGhlIGdpdmVuIHNldC5cbiAgICAqL1xuICAgIGlzSW5TZXQoc2V0KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2V0Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgaWYgKHNldFtpXS50eXBlID09IHRoaXMpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldFtpXTtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBjaGVja0F0dHJzKGF0dHJzKSB7XG4gICAgICAgIGNoZWNrQXR0cnModGhpcy5hdHRycywgYXR0cnMsIFwibWFya1wiLCB0aGlzLm5hbWUpO1xuICAgIH1cbiAgICAvKipcbiAgICBRdWVyaWVzIHdoZXRoZXIgYSBnaXZlbiBtYXJrIHR5cGUgaXNcbiAgICBbZXhjbHVkZWRdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5NYXJrU3BlYy5leGNsdWRlcykgYnkgdGhpcyBvbmUuXG4gICAgKi9cbiAgICBleGNsdWRlcyhvdGhlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5leGNsdWRlZC5pbmRleE9mKG90aGVyKSA+IC0xO1xuICAgIH1cbn1cbi8qKlxuQSBkb2N1bWVudCBzY2hlbWEuIEhvbGRzIFtub2RlXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTm9kZVR5cGUpIGFuZCBbbWFya1xudHlwZV0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk1hcmtUeXBlKSBvYmplY3RzIGZvciB0aGUgbm9kZXMgYW5kIG1hcmtzIHRoYXQgbWF5XG5vY2N1ciBpbiBjb25mb3JtaW5nIGRvY3VtZW50cywgYW5kIHByb3ZpZGVzIGZ1bmN0aW9uYWxpdHkgZm9yXG5jcmVhdGluZyBhbmQgZGVzZXJpYWxpemluZyBzdWNoIGRvY3VtZW50cy5cblxuV2hlbiBnaXZlbiwgdGhlIHR5cGUgcGFyYW1ldGVycyBwcm92aWRlIHRoZSBuYW1lcyBvZiB0aGUgbm9kZXMgYW5kXG5tYXJrcyBpbiB0aGlzIHNjaGVtYS5cbiovXG5jbGFzcyBTY2hlbWEge1xuICAgIC8qKlxuICAgIENvbnN0cnVjdCBhIHNjaGVtYSBmcm9tIGEgc2NoZW1hIFtzcGVjaWZpY2F0aW9uXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuU2NoZW1hU3BlYykuXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcihzcGVjKSB7XG4gICAgICAgIC8qKlxuICAgICAgICBUaGUgW2xpbmVicmVha1xuICAgICAgICByZXBsYWNlbWVudF0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGVTcGVjLmxpbmVicmVha1JlcGxhY2VtZW50KSBub2RlIGRlZmluZWRcbiAgICAgICAgaW4gdGhpcyBzY2hlbWEsIGlmIGFueS5cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5saW5lYnJlYWtSZXBsYWNlbWVudCA9IG51bGw7XG4gICAgICAgIC8qKlxuICAgICAgICBBbiBvYmplY3QgZm9yIHN0b3Jpbmcgd2hhdGV2ZXIgdmFsdWVzIG1vZHVsZXMgbWF5IHdhbnQgdG9cbiAgICAgICAgY29tcHV0ZSBhbmQgY2FjaGUgcGVyIHNjaGVtYS4gKElmIHlvdSB3YW50IHRvIHN0b3JlIHNvbWV0aGluZ1xuICAgICAgICBpbiBpdCwgdHJ5IHRvIHVzZSBwcm9wZXJ0eSBuYW1lcyB1bmxpa2VseSB0byBjbGFzaC4pXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2FjaGVkID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgbGV0IGluc3RhbmNlU3BlYyA9IHRoaXMuc3BlYyA9IHt9O1xuICAgICAgICBmb3IgKGxldCBwcm9wIGluIHNwZWMpXG4gICAgICAgICAgICBpbnN0YW5jZVNwZWNbcHJvcF0gPSBzcGVjW3Byb3BdO1xuICAgICAgICBpbnN0YW5jZVNwZWMubm9kZXMgPSBPcmRlcmVkTWFwLmZyb20oc3BlYy5ub2RlcyksXG4gICAgICAgICAgICBpbnN0YW5jZVNwZWMubWFya3MgPSBPcmRlcmVkTWFwLmZyb20oc3BlYy5tYXJrcyB8fCB7fSksXG4gICAgICAgICAgICB0aGlzLm5vZGVzID0gTm9kZVR5cGUuY29tcGlsZSh0aGlzLnNwZWMubm9kZXMsIHRoaXMpO1xuICAgICAgICB0aGlzLm1hcmtzID0gTWFya1R5cGUuY29tcGlsZSh0aGlzLnNwZWMubWFya3MsIHRoaXMpO1xuICAgICAgICBsZXQgY29udGVudEV4cHJDYWNoZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgIGZvciAobGV0IHByb3AgaW4gdGhpcy5ub2Rlcykge1xuICAgICAgICAgICAgaWYgKHByb3AgaW4gdGhpcy5tYXJrcylcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihwcm9wICsgXCIgY2FuIG5vdCBiZSBib3RoIGEgbm9kZSBhbmQgYSBtYXJrXCIpO1xuICAgICAgICAgICAgbGV0IHR5cGUgPSB0aGlzLm5vZGVzW3Byb3BdLCBjb250ZW50RXhwciA9IHR5cGUuc3BlYy5jb250ZW50IHx8IFwiXCIsIG1hcmtFeHByID0gdHlwZS5zcGVjLm1hcmtzO1xuICAgICAgICAgICAgdHlwZS5jb250ZW50TWF0Y2ggPSBjb250ZW50RXhwckNhY2hlW2NvbnRlbnRFeHByXSB8fFxuICAgICAgICAgICAgICAgIChjb250ZW50RXhwckNhY2hlW2NvbnRlbnRFeHByXSA9IENvbnRlbnRNYXRjaC5wYXJzZShjb250ZW50RXhwciwgdGhpcy5ub2RlcykpO1xuICAgICAgICAgICAgdHlwZS5pbmxpbmVDb250ZW50ID0gdHlwZS5jb250ZW50TWF0Y2guaW5saW5lQ29udGVudDtcbiAgICAgICAgICAgIGlmICh0eXBlLnNwZWMubGluZWJyZWFrUmVwbGFjZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5saW5lYnJlYWtSZXBsYWNlbWVudClcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJNdWx0aXBsZSBsaW5lYnJlYWsgbm9kZXMgZGVmaW5lZFwiKTtcbiAgICAgICAgICAgICAgICBpZiAoIXR5cGUuaXNJbmxpbmUgfHwgIXR5cGUuaXNMZWFmKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkxpbmVicmVhayByZXBsYWNlbWVudCBub2RlcyBtdXN0IGJlIGlubGluZSBsZWFmIG5vZGVzXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMubGluZWJyZWFrUmVwbGFjZW1lbnQgPSB0eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHlwZS5tYXJrU2V0ID0gbWFya0V4cHIgPT0gXCJfXCIgPyBudWxsIDpcbiAgICAgICAgICAgICAgICBtYXJrRXhwciA/IGdhdGhlck1hcmtzKHRoaXMsIG1hcmtFeHByLnNwbGl0KFwiIFwiKSkgOlxuICAgICAgICAgICAgICAgICAgICBtYXJrRXhwciA9PSBcIlwiIHx8ICF0eXBlLmlubGluZUNvbnRlbnQgPyBbXSA6IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiB0aGlzLm1hcmtzKSB7XG4gICAgICAgICAgICBsZXQgdHlwZSA9IHRoaXMubWFya3NbcHJvcF0sIGV4Y2wgPSB0eXBlLnNwZWMuZXhjbHVkZXM7XG4gICAgICAgICAgICB0eXBlLmV4Y2x1ZGVkID0gZXhjbCA9PSBudWxsID8gW3R5cGVdIDogZXhjbCA9PSBcIlwiID8gW10gOiBnYXRoZXJNYXJrcyh0aGlzLCBleGNsLnNwbGl0KFwiIFwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ub2RlRnJvbUpTT04gPSB0aGlzLm5vZGVGcm9tSlNPTi5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm1hcmtGcm9tSlNPTiA9IHRoaXMubWFya0Zyb21KU09OLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMudG9wTm9kZVR5cGUgPSB0aGlzLm5vZGVzW3RoaXMuc3BlYy50b3BOb2RlIHx8IFwiZG9jXCJdO1xuICAgICAgICB0aGlzLmNhY2hlZC53cmFwcGluZ3MgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIH1cbiAgICAvKipcbiAgICBDcmVhdGUgYSBub2RlIGluIHRoaXMgc2NoZW1hLiBUaGUgYHR5cGVgIG1heSBiZSBhIHN0cmluZyBvciBhXG4gICAgYE5vZGVUeXBlYCBpbnN0YW5jZS4gQXR0cmlidXRlcyB3aWxsIGJlIGV4dGVuZGVkIHdpdGggZGVmYXVsdHMsXG4gICAgYGNvbnRlbnRgIG1heSBiZSBhIGBGcmFnbWVudGAsIGBudWxsYCwgYSBgTm9kZWAsIG9yIGFuIGFycmF5IG9mXG4gICAgbm9kZXMuXG4gICAgKi9cbiAgICBub2RlKHR5cGUsIGF0dHJzID0gbnVsbCwgY29udGVudCwgbWFya3MpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0eXBlID09IFwic3RyaW5nXCIpXG4gICAgICAgICAgICB0eXBlID0gdGhpcy5ub2RlVHlwZSh0eXBlKTtcbiAgICAgICAgZWxzZSBpZiAoISh0eXBlIGluc3RhbmNlb2YgTm9kZVR5cGUpKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbnZhbGlkIG5vZGUgdHlwZTogXCIgKyB0eXBlKTtcbiAgICAgICAgZWxzZSBpZiAodHlwZS5zY2hlbWEgIT0gdGhpcylcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiTm9kZSB0eXBlIGZyb20gZGlmZmVyZW50IHNjaGVtYSB1c2VkIChcIiArIHR5cGUubmFtZSArIFwiKVwiKTtcbiAgICAgICAgcmV0dXJuIHR5cGUuY3JlYXRlQ2hlY2tlZChhdHRycywgY29udGVudCwgbWFya3MpO1xuICAgIH1cbiAgICAvKipcbiAgICBDcmVhdGUgYSB0ZXh0IG5vZGUgaW4gdGhlIHNjaGVtYS4gRW1wdHkgdGV4dCBub2RlcyBhcmUgbm90XG4gICAgYWxsb3dlZC5cbiAgICAqL1xuICAgIHRleHQodGV4dCwgbWFya3MpIHtcbiAgICAgICAgbGV0IHR5cGUgPSB0aGlzLm5vZGVzLnRleHQ7XG4gICAgICAgIHJldHVybiBuZXcgVGV4dE5vZGUodHlwZSwgdHlwZS5kZWZhdWx0QXR0cnMsIHRleHQsIE1hcmsuc2V0RnJvbShtYXJrcykpO1xuICAgIH1cbiAgICAvKipcbiAgICBDcmVhdGUgYSBtYXJrIHdpdGggdGhlIGdpdmVuIHR5cGUgYW5kIGF0dHJpYnV0ZXMuXG4gICAgKi9cbiAgICBtYXJrKHR5cGUsIGF0dHJzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdHlwZSA9PSBcInN0cmluZ1wiKVxuICAgICAgICAgICAgdHlwZSA9IHRoaXMubWFya3NbdHlwZV07XG4gICAgICAgIHJldHVybiB0eXBlLmNyZWF0ZShhdHRycyk7XG4gICAgfVxuICAgIC8qKlxuICAgIERlc2VyaWFsaXplIGEgbm9kZSBmcm9tIGl0cyBKU09OIHJlcHJlc2VudGF0aW9uLiBUaGlzIG1ldGhvZCBpc1xuICAgIGJvdW5kLlxuICAgICovXG4gICAgbm9kZUZyb21KU09OKGpzb24pIHtcbiAgICAgICAgcmV0dXJuIE5vZGUuZnJvbUpTT04odGhpcywganNvbik7XG4gICAgfVxuICAgIC8qKlxuICAgIERlc2VyaWFsaXplIGEgbWFyayBmcm9tIGl0cyBKU09OIHJlcHJlc2VudGF0aW9uLiBUaGlzIG1ldGhvZCBpc1xuICAgIGJvdW5kLlxuICAgICovXG4gICAgbWFya0Zyb21KU09OKGpzb24pIHtcbiAgICAgICAgcmV0dXJuIE1hcmsuZnJvbUpTT04odGhpcywganNvbik7XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgbm9kZVR5cGUobmFtZSkge1xuICAgICAgICBsZXQgZm91bmQgPSB0aGlzLm5vZGVzW25hbWVdO1xuICAgICAgICBpZiAoIWZvdW5kKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJVbmtub3duIG5vZGUgdHlwZTogXCIgKyBuYW1lKTtcbiAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdhdGhlck1hcmtzKHNjaGVtYSwgbWFya3MpIHtcbiAgICBsZXQgZm91bmQgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hcmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBuYW1lID0gbWFya3NbaV0sIG1hcmsgPSBzY2hlbWEubWFya3NbbmFtZV0sIG9rID0gbWFyaztcbiAgICAgICAgaWYgKG1hcmspIHtcbiAgICAgICAgICAgIGZvdW5kLnB1c2gobWFyayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCBwcm9wIGluIHNjaGVtYS5tYXJrcykge1xuICAgICAgICAgICAgICAgIGxldCBtYXJrID0gc2NoZW1hLm1hcmtzW3Byb3BdO1xuICAgICAgICAgICAgICAgIGlmIChuYW1lID09IFwiX1wiIHx8IChtYXJrLnNwZWMuZ3JvdXAgJiYgbWFyay5zcGVjLmdyb3VwLnNwbGl0KFwiIFwiKS5pbmRleE9mKG5hbWUpID4gLTEpKVxuICAgICAgICAgICAgICAgICAgICBmb3VuZC5wdXNoKG9rID0gbWFyayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvaylcbiAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIlVua25vd24gbWFyayB0eXBlOiAnXCIgKyBtYXJrc1tpXSArIFwiJ1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kO1xufVxuXG5mdW5jdGlvbiBpc1RhZ1J1bGUocnVsZSkgeyByZXR1cm4gcnVsZS50YWcgIT0gbnVsbDsgfVxuZnVuY3Rpb24gaXNTdHlsZVJ1bGUocnVsZSkgeyByZXR1cm4gcnVsZS5zdHlsZSAhPSBudWxsOyB9XG4vKipcbkEgRE9NIHBhcnNlciByZXByZXNlbnRzIGEgc3RyYXRlZ3kgZm9yIHBhcnNpbmcgRE9NIGNvbnRlbnQgaW50byBhXG5Qcm9zZU1pcnJvciBkb2N1bWVudCBjb25mb3JtaW5nIHRvIGEgZ2l2ZW4gc2NoZW1hLiBJdHMgYmVoYXZpb3IgaXNcbmRlZmluZWQgYnkgYW4gYXJyYXkgb2YgW3J1bGVzXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuUGFyc2VSdWxlKS5cbiovXG5jbGFzcyBET01QYXJzZXIge1xuICAgIC8qKlxuICAgIENyZWF0ZSBhIHBhcnNlciB0aGF0IHRhcmdldHMgdGhlIGdpdmVuIHNjaGVtYSwgdXNpbmcgdGhlIGdpdmVuXG4gICAgcGFyc2luZyBydWxlcy5cbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgIFRoZSBzY2hlbWEgaW50byB3aGljaCB0aGUgcGFyc2VyIHBhcnNlcy5cbiAgICAqL1xuICAgIHNjaGVtYSwgXG4gICAgLyoqXG4gICAgVGhlIHNldCBvZiBbcGFyc2UgcnVsZXNdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5QYXJzZVJ1bGUpIHRoYXQgdGhlIHBhcnNlclxuICAgIHVzZXMsIGluIG9yZGVyIG9mIHByZWNlZGVuY2UuXG4gICAgKi9cbiAgICBydWxlcykge1xuICAgICAgICB0aGlzLnNjaGVtYSA9IHNjaGVtYTtcbiAgICAgICAgdGhpcy5ydWxlcyA9IHJ1bGVzO1xuICAgICAgICAvKipcbiAgICAgICAgQGludGVybmFsXG4gICAgICAgICovXG4gICAgICAgIHRoaXMudGFncyA9IFtdO1xuICAgICAgICAvKipcbiAgICAgICAgQGludGVybmFsXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuc3R5bGVzID0gW107XG4gICAgICAgIGxldCBtYXRjaGVkU3R5bGVzID0gdGhpcy5tYXRjaGVkU3R5bGVzID0gW107XG4gICAgICAgIHJ1bGVzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgICAgICBpZiAoaXNUYWdSdWxlKHJ1bGUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50YWdzLnB1c2gocnVsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc1N0eWxlUnVsZShydWxlKSkge1xuICAgICAgICAgICAgICAgIGxldCBwcm9wID0gL1tePV0qLy5leGVjKHJ1bGUuc3R5bGUpWzBdO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaGVkU3R5bGVzLmluZGV4T2YocHJvcCkgPCAwKVxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVkU3R5bGVzLnB1c2gocHJvcCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHlsZXMucHVzaChydWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIE9ubHkgbm9ybWFsaXplIGxpc3QgZWxlbWVudHMgd2hlbiBsaXN0cyBpbiB0aGUgc2NoZW1hIGNhbid0IGRpcmVjdGx5IGNvbnRhaW4gdGhlbXNlbHZlc1xuICAgICAgICB0aGlzLm5vcm1hbGl6ZUxpc3RzID0gIXRoaXMudGFncy5zb21lKHIgPT4ge1xuICAgICAgICAgICAgaWYgKCEvXih1bHxvbClcXGIvLnRlc3Qoci50YWcpIHx8ICFyLm5vZGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgbGV0IG5vZGUgPSBzY2hlbWEubm9kZXNbci5ub2RlXTtcbiAgICAgICAgICAgIHJldHVybiBub2RlLmNvbnRlbnRNYXRjaC5tYXRjaFR5cGUobm9kZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICBQYXJzZSBhIGRvY3VtZW50IGZyb20gdGhlIGNvbnRlbnQgb2YgYSBET00gbm9kZS5cbiAgICAqL1xuICAgIHBhcnNlKGRvbSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIGxldCBjb250ZXh0ID0gbmV3IFBhcnNlQ29udGV4dCh0aGlzLCBvcHRpb25zLCBmYWxzZSk7XG4gICAgICAgIGNvbnRleHQuYWRkQWxsKGRvbSwgTWFyay5ub25lLCBvcHRpb25zLmZyb20sIG9wdGlvbnMudG8pO1xuICAgICAgICByZXR1cm4gY29udGV4dC5maW5pc2goKTtcbiAgICB9XG4gICAgLyoqXG4gICAgUGFyc2VzIHRoZSBjb250ZW50IG9mIHRoZSBnaXZlbiBET00gbm9kZSwgbGlrZVxuICAgIFtgcGFyc2VgXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuRE9NUGFyc2VyLnBhcnNlKSwgYW5kIHRha2VzIHRoZSBzYW1lIHNldCBvZlxuICAgIG9wdGlvbnMuIEJ1dCB1bmxpa2UgdGhhdCBtZXRob2QsIHdoaWNoIHByb2R1Y2VzIGEgd2hvbGUgbm9kZSxcbiAgICB0aGlzIG9uZSByZXR1cm5zIGEgc2xpY2UgdGhhdCBpcyBvcGVuIGF0IHRoZSBzaWRlcywgbWVhbmluZyB0aGF0XG4gICAgdGhlIHNjaGVtYSBjb25zdHJhaW50cyBhcmVuJ3QgYXBwbGllZCB0byB0aGUgc3RhcnQgb2Ygbm9kZXMgdG9cbiAgICB0aGUgbGVmdCBvZiB0aGUgaW5wdXQgYW5kIHRoZSBlbmQgb2Ygbm9kZXMgYXQgdGhlIGVuZC5cbiAgICAqL1xuICAgIHBhcnNlU2xpY2UoZG9tLCBvcHRpb25zID0ge30pIHtcbiAgICAgICAgbGV0IGNvbnRleHQgPSBuZXcgUGFyc2VDb250ZXh0KHRoaXMsIG9wdGlvbnMsIHRydWUpO1xuICAgICAgICBjb250ZXh0LmFkZEFsbChkb20sIE1hcmsubm9uZSwgb3B0aW9ucy5mcm9tLCBvcHRpb25zLnRvKTtcbiAgICAgICAgcmV0dXJuIFNsaWNlLm1heE9wZW4oY29udGV4dC5maW5pc2goKSk7XG4gICAgfVxuICAgIC8qKlxuICAgIEBpbnRlcm5hbFxuICAgICovXG4gICAgbWF0Y2hUYWcoZG9tLCBjb250ZXh0LCBhZnRlcikge1xuICAgICAgICBmb3IgKGxldCBpID0gYWZ0ZXIgPyB0aGlzLnRhZ3MuaW5kZXhPZihhZnRlcikgKyAxIDogMDsgaSA8IHRoaXMudGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHJ1bGUgPSB0aGlzLnRhZ3NbaV07XG4gICAgICAgICAgICBpZiAobWF0Y2hlcyhkb20sIHJ1bGUudGFnKSAmJlxuICAgICAgICAgICAgICAgIChydWxlLm5hbWVzcGFjZSA9PT0gdW5kZWZpbmVkIHx8IGRvbS5uYW1lc3BhY2VVUkkgPT0gcnVsZS5uYW1lc3BhY2UpICYmXG4gICAgICAgICAgICAgICAgKCFydWxlLmNvbnRleHQgfHwgY29udGV4dC5tYXRjaGVzQ29udGV4dChydWxlLmNvbnRleHQpKSkge1xuICAgICAgICAgICAgICAgIGlmIChydWxlLmdldEF0dHJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBydWxlLmdldEF0dHJzKGRvbSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIHJ1bGUuYXR0cnMgPSByZXN1bHQgfHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcnVsZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIG1hdGNoU3R5bGUocHJvcCwgdmFsdWUsIGNvbnRleHQsIGFmdGVyKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSBhZnRlciA/IHRoaXMuc3R5bGVzLmluZGV4T2YoYWZ0ZXIpICsgMSA6IDA7IGkgPCB0aGlzLnN0eWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHJ1bGUgPSB0aGlzLnN0eWxlc1tpXSwgc3R5bGUgPSBydWxlLnN0eWxlO1xuICAgICAgICAgICAgaWYgKHN0eWxlLmluZGV4T2YocHJvcCkgIT0gMCB8fFxuICAgICAgICAgICAgICAgIHJ1bGUuY29udGV4dCAmJiAhY29udGV4dC5tYXRjaGVzQ29udGV4dChydWxlLmNvbnRleHQpIHx8XG4gICAgICAgICAgICAgICAgLy8gVGVzdCB0aGF0IHRoZSBzdHlsZSBzdHJpbmcgZWl0aGVyIHByZWNpc2VseSBtYXRjaGVzIHRoZSBwcm9wLFxuICAgICAgICAgICAgICAgIC8vIG9yIGhhcyBhbiAnPScgc2lnbiBhZnRlciB0aGUgcHJvcCwgZm9sbG93ZWQgYnkgdGhlIGdpdmVuXG4gICAgICAgICAgICAgICAgLy8gdmFsdWUuXG4gICAgICAgICAgICAgICAgc3R5bGUubGVuZ3RoID4gcHJvcC5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICAgICAgKHN0eWxlLmNoYXJDb2RlQXQocHJvcC5sZW5ndGgpICE9IDYxIHx8IHN0eWxlLnNsaWNlKHByb3AubGVuZ3RoICsgMSkgIT0gdmFsdWUpKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgaWYgKHJ1bGUuZ2V0QXR0cnMpIHtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gcnVsZS5nZXRBdHRycyh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHJ1bGUuYXR0cnMgPSByZXN1bHQgfHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bGU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBzdGF0aWMgc2NoZW1hUnVsZXMoc2NoZW1hKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICAgICAgZnVuY3Rpb24gaW5zZXJ0KHJ1bGUpIHtcbiAgICAgICAgICAgIGxldCBwcmlvcml0eSA9IHJ1bGUucHJpb3JpdHkgPT0gbnVsbCA/IDUwIDogcnVsZS5wcmlvcml0eSwgaSA9IDA7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IHJlc3VsdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBuZXh0ID0gcmVzdWx0W2ldLCBuZXh0UHJpb3JpdHkgPSBuZXh0LnByaW9yaXR5ID09IG51bGwgPyA1MCA6IG5leHQucHJpb3JpdHk7XG4gICAgICAgICAgICAgICAgaWYgKG5leHRQcmlvcml0eSA8IHByaW9yaXR5KVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdC5zcGxpY2UoaSwgMCwgcnVsZSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgbmFtZSBpbiBzY2hlbWEubWFya3MpIHtcbiAgICAgICAgICAgIGxldCBydWxlcyA9IHNjaGVtYS5tYXJrc1tuYW1lXS5zcGVjLnBhcnNlRE9NO1xuICAgICAgICAgICAgaWYgKHJ1bGVzKVxuICAgICAgICAgICAgICAgIHJ1bGVzLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGluc2VydChydWxlID0gY29weShydWxlKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKHJ1bGUubWFyayB8fCBydWxlLmlnbm9yZSB8fCBydWxlLmNsZWFyTWFyaykpXG4gICAgICAgICAgICAgICAgICAgICAgICBydWxlLm1hcmsgPSBuYW1lO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IG5hbWUgaW4gc2NoZW1hLm5vZGVzKSB7XG4gICAgICAgICAgICBsZXQgcnVsZXMgPSBzY2hlbWEubm9kZXNbbmFtZV0uc3BlYy5wYXJzZURPTTtcbiAgICAgICAgICAgIGlmIChydWxlcylcbiAgICAgICAgICAgICAgICBydWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnQocnVsZSA9IGNvcHkocnVsZSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIShydWxlLm5vZGUgfHwgcnVsZS5pZ25vcmUgfHwgcnVsZS5tYXJrKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGUubm9kZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgLyoqXG4gICAgQ29uc3RydWN0IGEgRE9NIHBhcnNlciB1c2luZyB0aGUgcGFyc2luZyBydWxlcyBsaXN0ZWQgaW4gYVxuICAgIHNjaGVtYSdzIFtub2RlIHNwZWNzXShodHRwczovL3Byb3NlbWlycm9yLm5ldC9kb2NzL3JlZi8jbW9kZWwuTm9kZVNwZWMucGFyc2VET00pLCByZW9yZGVyZWQgYnlcbiAgICBbcHJpb3JpdHldKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5QYXJzZVJ1bGUucHJpb3JpdHkpLlxuICAgICovXG4gICAgc3RhdGljIGZyb21TY2hlbWEoc2NoZW1hKSB7XG4gICAgICAgIHJldHVybiBzY2hlbWEuY2FjaGVkLmRvbVBhcnNlciB8fFxuICAgICAgICAgICAgKHNjaGVtYS5jYWNoZWQuZG9tUGFyc2VyID0gbmV3IERPTVBhcnNlcihzY2hlbWEsIERPTVBhcnNlci5zY2hlbWFSdWxlcyhzY2hlbWEpKSk7XG4gICAgfVxufVxuY29uc3QgYmxvY2tUYWdzID0ge1xuICAgIGFkZHJlc3M6IHRydWUsIGFydGljbGU6IHRydWUsIGFzaWRlOiB0cnVlLCBibG9ja3F1b3RlOiB0cnVlLCBjYW52YXM6IHRydWUsXG4gICAgZGQ6IHRydWUsIGRpdjogdHJ1ZSwgZGw6IHRydWUsIGZpZWxkc2V0OiB0cnVlLCBmaWdjYXB0aW9uOiB0cnVlLCBmaWd1cmU6IHRydWUsXG4gICAgZm9vdGVyOiB0cnVlLCBmb3JtOiB0cnVlLCBoMTogdHJ1ZSwgaDI6IHRydWUsIGgzOiB0cnVlLCBoNDogdHJ1ZSwgaDU6IHRydWUsXG4gICAgaDY6IHRydWUsIGhlYWRlcjogdHJ1ZSwgaGdyb3VwOiB0cnVlLCBocjogdHJ1ZSwgbGk6IHRydWUsIG5vc2NyaXB0OiB0cnVlLCBvbDogdHJ1ZSxcbiAgICBvdXRwdXQ6IHRydWUsIHA6IHRydWUsIHByZTogdHJ1ZSwgc2VjdGlvbjogdHJ1ZSwgdGFibGU6IHRydWUsIHRmb290OiB0cnVlLCB1bDogdHJ1ZVxufTtcbmNvbnN0IGlnbm9yZVRhZ3MgPSB7XG4gICAgaGVhZDogdHJ1ZSwgbm9zY3JpcHQ6IHRydWUsIG9iamVjdDogdHJ1ZSwgc2NyaXB0OiB0cnVlLCBzdHlsZTogdHJ1ZSwgdGl0bGU6IHRydWVcbn07XG5jb25zdCBsaXN0VGFncyA9IHsgb2w6IHRydWUsIHVsOiB0cnVlIH07XG4vLyBVc2luZyBhIGJpdGZpZWxkIGZvciBub2RlIGNvbnRleHQgb3B0aW9uc1xuY29uc3QgT1BUX1BSRVNFUlZFX1dTID0gMSwgT1BUX1BSRVNFUlZFX1dTX0ZVTEwgPSAyLCBPUFRfT1BFTl9MRUZUID0gNDtcbmZ1bmN0aW9uIHdzT3B0aW9uc0Zvcih0eXBlLCBwcmVzZXJ2ZVdoaXRlc3BhY2UsIGJhc2UpIHtcbiAgICBpZiAocHJlc2VydmVXaGl0ZXNwYWNlICE9IG51bGwpXG4gICAgICAgIHJldHVybiAocHJlc2VydmVXaGl0ZXNwYWNlID8gT1BUX1BSRVNFUlZFX1dTIDogMCkgfFxuICAgICAgICAgICAgKHByZXNlcnZlV2hpdGVzcGFjZSA9PT0gXCJmdWxsXCIgPyBPUFRfUFJFU0VSVkVfV1NfRlVMTCA6IDApO1xuICAgIHJldHVybiB0eXBlICYmIHR5cGUud2hpdGVzcGFjZSA9PSBcInByZVwiID8gT1BUX1BSRVNFUlZFX1dTIHwgT1BUX1BSRVNFUlZFX1dTX0ZVTEwgOiBiYXNlICYgfk9QVF9PUEVOX0xFRlQ7XG59XG5jbGFzcyBOb2RlQ29udGV4dCB7XG4gICAgY29uc3RydWN0b3IodHlwZSwgYXR0cnMsIG1hcmtzLCBzb2xpZCwgbWF0Y2gsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgICAgdGhpcy5hdHRycyA9IGF0dHJzO1xuICAgICAgICB0aGlzLm1hcmtzID0gbWFya3M7XG4gICAgICAgIHRoaXMuc29saWQgPSBzb2xpZDtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5jb250ZW50ID0gW107XG4gICAgICAgIC8vIE1hcmtzIGFwcGxpZWQgdG8gdGhlIG5vZGUncyBjaGlsZHJlblxuICAgICAgICB0aGlzLmFjdGl2ZU1hcmtzID0gTWFyay5ub25lO1xuICAgICAgICB0aGlzLm1hdGNoID0gbWF0Y2ggfHwgKG9wdGlvbnMgJiBPUFRfT1BFTl9MRUZUID8gbnVsbCA6IHR5cGUuY29udGVudE1hdGNoKTtcbiAgICB9XG4gICAgZmluZFdyYXBwaW5nKG5vZGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMudHlwZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICBsZXQgZmlsbCA9IHRoaXMudHlwZS5jb250ZW50TWF0Y2guZmlsbEJlZm9yZShGcmFnbWVudC5mcm9tKG5vZGUpKTtcbiAgICAgICAgICAgIGlmIChmaWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXRjaCA9IHRoaXMudHlwZS5jb250ZW50TWF0Y2gubWF0Y2hGcmFnbWVudChmaWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCBzdGFydCA9IHRoaXMudHlwZS5jb250ZW50TWF0Y2gsIHdyYXA7XG4gICAgICAgICAgICAgICAgaWYgKHdyYXAgPSBzdGFydC5maW5kV3JhcHBpbmcobm9kZS50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hdGNoID0gc3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3cmFwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm1hdGNoLmZpbmRXcmFwcGluZyhub2RlLnR5cGUpO1xuICAgIH1cbiAgICBmaW5pc2gob3BlbkVuZCkge1xuICAgICAgICBpZiAoISh0aGlzLm9wdGlvbnMgJiBPUFRfUFJFU0VSVkVfV1MpKSB7IC8vIFN0cmlwIHRyYWlsaW5nIHdoaXRlc3BhY2VcbiAgICAgICAgICAgIGxldCBsYXN0ID0gdGhpcy5jb250ZW50W3RoaXMuY29udGVudC5sZW5ndGggLSAxXSwgbTtcbiAgICAgICAgICAgIGlmIChsYXN0ICYmIGxhc3QuaXNUZXh0ICYmIChtID0gL1sgXFx0XFxyXFxuXFx1MDAwY10rJC8uZXhlYyhsYXN0LnRleHQpKSkge1xuICAgICAgICAgICAgICAgIGxldCB0ZXh0ID0gbGFzdDtcbiAgICAgICAgICAgICAgICBpZiAobGFzdC50ZXh0Lmxlbmd0aCA9PSBtWzBdLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZW50LnBvcCgpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZW50W3RoaXMuY29udGVudC5sZW5ndGggLSAxXSA9IHRleHQud2l0aFRleHQodGV4dC50ZXh0LnNsaWNlKDAsIHRleHQudGV4dC5sZW5ndGggLSBtWzBdLmxlbmd0aCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCBjb250ZW50ID0gRnJhZ21lbnQuZnJvbSh0aGlzLmNvbnRlbnQpO1xuICAgICAgICBpZiAoIW9wZW5FbmQgJiYgdGhpcy5tYXRjaClcbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LmFwcGVuZCh0aGlzLm1hdGNoLmZpbGxCZWZvcmUoRnJhZ21lbnQuZW1wdHksIHRydWUpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZSA/IHRoaXMudHlwZS5jcmVhdGUodGhpcy5hdHRycywgY29udGVudCwgdGhpcy5tYXJrcykgOiBjb250ZW50O1xuICAgIH1cbiAgICBpbmxpbmVDb250ZXh0KG5vZGUpIHtcbiAgICAgICAgaWYgKHRoaXMudHlwZSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnR5cGUuaW5saW5lQ29udGVudDtcbiAgICAgICAgaWYgKHRoaXMuY29udGVudC5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb250ZW50WzBdLmlzSW5saW5lO1xuICAgICAgICByZXR1cm4gbm9kZS5wYXJlbnROb2RlICYmICFibG9ja1RhZ3MuaGFzT3duUHJvcGVydHkobm9kZS5wYXJlbnROb2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpO1xuICAgIH1cbn1cbmNsYXNzIFBhcnNlQ29udGV4dCB7XG4gICAgY29uc3RydWN0b3IoXG4gICAgLy8gVGhlIHBhcnNlciB3ZSBhcmUgdXNpbmcuXG4gICAgcGFyc2VyLCBcbiAgICAvLyBUaGUgb3B0aW9ucyBwYXNzZWQgdG8gdGhpcyBwYXJzZS5cbiAgICBvcHRpb25zLCBpc09wZW4pIHtcbiAgICAgICAgdGhpcy5wYXJzZXIgPSBwYXJzZXI7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuaXNPcGVuID0gaXNPcGVuO1xuICAgICAgICB0aGlzLm9wZW4gPSAwO1xuICAgICAgICBsZXQgdG9wTm9kZSA9IG9wdGlvbnMudG9wTm9kZSwgdG9wQ29udGV4dDtcbiAgICAgICAgbGV0IHRvcE9wdGlvbnMgPSB3c09wdGlvbnNGb3IobnVsbCwgb3B0aW9ucy5wcmVzZXJ2ZVdoaXRlc3BhY2UsIDApIHwgKGlzT3BlbiA/IE9QVF9PUEVOX0xFRlQgOiAwKTtcbiAgICAgICAgaWYgKHRvcE5vZGUpXG4gICAgICAgICAgICB0b3BDb250ZXh0ID0gbmV3IE5vZGVDb250ZXh0KHRvcE5vZGUudHlwZSwgdG9wTm9kZS5hdHRycywgTWFyay5ub25lLCB0cnVlLCBvcHRpb25zLnRvcE1hdGNoIHx8IHRvcE5vZGUudHlwZS5jb250ZW50TWF0Y2gsIHRvcE9wdGlvbnMpO1xuICAgICAgICBlbHNlIGlmIChpc09wZW4pXG4gICAgICAgICAgICB0b3BDb250ZXh0ID0gbmV3IE5vZGVDb250ZXh0KG51bGwsIG51bGwsIE1hcmsubm9uZSwgdHJ1ZSwgbnVsbCwgdG9wT3B0aW9ucyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRvcENvbnRleHQgPSBuZXcgTm9kZUNvbnRleHQocGFyc2VyLnNjaGVtYS50b3BOb2RlVHlwZSwgbnVsbCwgTWFyay5ub25lLCB0cnVlLCBudWxsLCB0b3BPcHRpb25zKTtcbiAgICAgICAgdGhpcy5ub2RlcyA9IFt0b3BDb250ZXh0XTtcbiAgICAgICAgdGhpcy5maW5kID0gb3B0aW9ucy5maW5kUG9zaXRpb25zO1xuICAgICAgICB0aGlzLm5lZWRzQmxvY2sgPSBmYWxzZTtcbiAgICB9XG4gICAgZ2V0IHRvcCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZXNbdGhpcy5vcGVuXTtcbiAgICB9XG4gICAgLy8gQWRkIGEgRE9NIG5vZGUgdG8gdGhlIGNvbnRlbnQuIFRleHQgaXMgaW5zZXJ0ZWQgYXMgdGV4dCBub2RlLFxuICAgIC8vIG90aGVyd2lzZSwgdGhlIG5vZGUgaXMgcGFzc2VkIHRvIGBhZGRFbGVtZW50YCBvciwgaWYgaXQgaGFzIGFcbiAgICAvLyBgc3R5bGVgIGF0dHJpYnV0ZSwgYGFkZEVsZW1lbnRXaXRoU3R5bGVzYC5cbiAgICBhZGRET00oZG9tLCBtYXJrcykge1xuICAgICAgICBpZiAoZG9tLm5vZGVUeXBlID09IDMpXG4gICAgICAgICAgICB0aGlzLmFkZFRleHROb2RlKGRvbSwgbWFya3MpO1xuICAgICAgICBlbHNlIGlmIChkb20ubm9kZVR5cGUgPT0gMSlcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudChkb20sIG1hcmtzKTtcbiAgICB9XG4gICAgYWRkVGV4dE5vZGUoZG9tLCBtYXJrcykge1xuICAgICAgICBsZXQgdmFsdWUgPSBkb20ubm9kZVZhbHVlO1xuICAgICAgICBsZXQgdG9wID0gdGhpcy50b3A7XG4gICAgICAgIGlmICh0b3Aub3B0aW9ucyAmIE9QVF9QUkVTRVJWRV9XU19GVUxMIHx8XG4gICAgICAgICAgICB0b3AuaW5saW5lQ29udGV4dChkb20pIHx8XG4gICAgICAgICAgICAvW14gXFx0XFxyXFxuXFx1MDAwY10vLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICBpZiAoISh0b3Aub3B0aW9ucyAmIE9QVF9QUkVTRVJWRV9XUykpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL1sgXFx0XFxyXFxuXFx1MDAwY10rL2csIFwiIFwiKTtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIHN0YXJ0cyB3aXRoIHdoaXRlc3BhY2UsIGFuZCB0aGVyZSBpcyBubyBub2RlIGJlZm9yZSBpdCwgb3JcbiAgICAgICAgICAgICAgICAvLyBhIGhhcmQgYnJlYWssIG9yIGEgdGV4dCBub2RlIHRoYXQgZW5kcyB3aXRoIHdoaXRlc3BhY2UsIHN0cmlwIHRoZVxuICAgICAgICAgICAgICAgIC8vIGxlYWRpbmcgc3BhY2UuXG4gICAgICAgICAgICAgICAgaWYgKC9eWyBcXHRcXHJcXG5cXHUwMDBjXS8udGVzdCh2YWx1ZSkgJiYgdGhpcy5vcGVuID09IHRoaXMubm9kZXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbm9kZUJlZm9yZSA9IHRvcC5jb250ZW50W3RvcC5jb250ZW50Lmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZG9tTm9kZUJlZm9yZSA9IGRvbS5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbm9kZUJlZm9yZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKGRvbU5vZGVCZWZvcmUgJiYgZG9tTm9kZUJlZm9yZS5ub2RlTmFtZSA9PSAnQlInKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKG5vZGVCZWZvcmUuaXNUZXh0ICYmIC9bIFxcdFxcclxcblxcdTAwMGNdJC8udGVzdChub2RlQmVmb3JlLnRleHQpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoISh0b3Aub3B0aW9ucyAmIE9QVF9QUkVTRVJWRV9XU19GVUxMKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvXFxyP1xcbnxcXHIvZywgXCIgXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC9cXHJcXG4/L2csIFwiXFxuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZhbHVlKVxuICAgICAgICAgICAgICAgIHRoaXMuaW5zZXJ0Tm9kZSh0aGlzLnBhcnNlci5zY2hlbWEudGV4dCh2YWx1ZSksIG1hcmtzKTtcbiAgICAgICAgICAgIHRoaXMuZmluZEluVGV4dChkb20pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5maW5kSW5zaWRlKGRvbSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gVHJ5IHRvIGZpbmQgYSBoYW5kbGVyIGZvciB0aGUgZ2l2ZW4gdGFnIGFuZCB1c2UgdGhhdCB0byBwYXJzZS4gSWZcbiAgICAvLyBub25lIGlzIGZvdW5kLCB0aGUgZWxlbWVudCdzIGNvbnRlbnQgbm9kZXMgYXJlIGFkZGVkIGRpcmVjdGx5LlxuICAgIGFkZEVsZW1lbnQoZG9tLCBtYXJrcywgbWF0Y2hBZnRlcikge1xuICAgICAgICBsZXQgbmFtZSA9IGRvbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpLCBydWxlSUQ7XG4gICAgICAgIGlmIChsaXN0VGFncy5oYXNPd25Qcm9wZXJ0eShuYW1lKSAmJiB0aGlzLnBhcnNlci5ub3JtYWxpemVMaXN0cylcbiAgICAgICAgICAgIG5vcm1hbGl6ZUxpc3QoZG9tKTtcbiAgICAgICAgbGV0IHJ1bGUgPSAodGhpcy5vcHRpb25zLnJ1bGVGcm9tTm9kZSAmJiB0aGlzLm9wdGlvbnMucnVsZUZyb21Ob2RlKGRvbSkpIHx8XG4gICAgICAgICAgICAocnVsZUlEID0gdGhpcy5wYXJzZXIubWF0Y2hUYWcoZG9tLCB0aGlzLCBtYXRjaEFmdGVyKSk7XG4gICAgICAgIGlmIChydWxlID8gcnVsZS5pZ25vcmUgOiBpZ25vcmVUYWdzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgICB0aGlzLmZpbmRJbnNpZGUoZG9tKTtcbiAgICAgICAgICAgIHRoaXMuaWdub3JlRmFsbGJhY2soZG9tLCBtYXJrcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIXJ1bGUgfHwgcnVsZS5za2lwIHx8IHJ1bGUuY2xvc2VQYXJlbnQpIHtcbiAgICAgICAgICAgIGlmIChydWxlICYmIHJ1bGUuY2xvc2VQYXJlbnQpXG4gICAgICAgICAgICAgICAgdGhpcy5vcGVuID0gTWF0aC5tYXgoMCwgdGhpcy5vcGVuIC0gMSk7XG4gICAgICAgICAgICBlbHNlIGlmIChydWxlICYmIHJ1bGUuc2tpcC5ub2RlVHlwZSlcbiAgICAgICAgICAgICAgICBkb20gPSBydWxlLnNraXA7XG4gICAgICAgICAgICBsZXQgc3luYywgdG9wID0gdGhpcy50b3AsIG9sZE5lZWRzQmxvY2sgPSB0aGlzLm5lZWRzQmxvY2s7XG4gICAgICAgICAgICBpZiAoYmxvY2tUYWdzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRvcC5jb250ZW50Lmxlbmd0aCAmJiB0b3AuY29udGVudFswXS5pc0lubGluZSAmJiB0aGlzLm9wZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcGVuLS07XG4gICAgICAgICAgICAgICAgICAgIHRvcCA9IHRoaXMudG9wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoIXRvcC50eXBlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5lZWRzQmxvY2sgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIWRvbS5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sZWFmRmFsbGJhY2soZG9tLCBtYXJrcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGlubmVyTWFya3MgPSBydWxlICYmIHJ1bGUuc2tpcCA/IG1hcmtzIDogdGhpcy5yZWFkU3R5bGVzKGRvbSwgbWFya3MpO1xuICAgICAgICAgICAgaWYgKGlubmVyTWFya3MpXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRBbGwoZG9tLCBpbm5lck1hcmtzKTtcbiAgICAgICAgICAgIGlmIChzeW5jKVxuICAgICAgICAgICAgICAgIHRoaXMuc3luYyh0b3ApO1xuICAgICAgICAgICAgdGhpcy5uZWVkc0Jsb2NrID0gb2xkTmVlZHNCbG9jaztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCBpbm5lck1hcmtzID0gdGhpcy5yZWFkU3R5bGVzKGRvbSwgbWFya3MpO1xuICAgICAgICAgICAgaWYgKGlubmVyTWFya3MpXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50QnlSdWxlKGRvbSwgcnVsZSwgaW5uZXJNYXJrcywgcnVsZS5jb25zdW1pbmcgPT09IGZhbHNlID8gcnVsZUlEIDogdW5kZWZpbmVkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBDYWxsZWQgZm9yIGxlYWYgRE9NIG5vZGVzIHRoYXQgd291bGQgb3RoZXJ3aXNlIGJlIGlnbm9yZWRcbiAgICBsZWFmRmFsbGJhY2soZG9tLCBtYXJrcykge1xuICAgICAgICBpZiAoZG9tLm5vZGVOYW1lID09IFwiQlJcIiAmJiB0aGlzLnRvcC50eXBlICYmIHRoaXMudG9wLnR5cGUuaW5saW5lQ29udGVudClcbiAgICAgICAgICAgIHRoaXMuYWRkVGV4dE5vZGUoZG9tLm93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcXG5cIiksIG1hcmtzKTtcbiAgICB9XG4gICAgLy8gQ2FsbGVkIGZvciBpZ25vcmVkIG5vZGVzXG4gICAgaWdub3JlRmFsbGJhY2soZG9tLCBtYXJrcykge1xuICAgICAgICAvLyBJZ25vcmVkIEJSIG5vZGVzIHNob3VsZCBhdCBsZWFzdCBjcmVhdGUgYW4gaW5saW5lIGNvbnRleHRcbiAgICAgICAgaWYgKGRvbS5ub2RlTmFtZSA9PSBcIkJSXCIgJiYgKCF0aGlzLnRvcC50eXBlIHx8ICF0aGlzLnRvcC50eXBlLmlubGluZUNvbnRlbnQpKVxuICAgICAgICAgICAgdGhpcy5maW5kUGxhY2UodGhpcy5wYXJzZXIuc2NoZW1hLnRleHQoXCItXCIpLCBtYXJrcyk7XG4gICAgfVxuICAgIC8vIFJ1biBhbnkgc3R5bGUgcGFyc2VyIGFzc29jaWF0ZWQgd2l0aCB0aGUgbm9kZSdzIHN0eWxlcy4gRWl0aGVyXG4gICAgLy8gcmV0dXJuIGFuIHVwZGF0ZWQgYXJyYXkgb2YgbWFya3MsIG9yIG51bGwgdG8gaW5kaWNhdGUgc29tZSBvZiB0aGVcbiAgICAvLyBzdHlsZXMgaGFkIGEgcnVsZSB3aXRoIGBpZ25vcmVgIHNldC5cbiAgICByZWFkU3R5bGVzKGRvbSwgbWFya3MpIHtcbiAgICAgICAgbGV0IHN0eWxlcyA9IGRvbS5zdHlsZTtcbiAgICAgICAgLy8gQmVjYXVzZSBtYW55IHByb3BlcnRpZXMgd2lsbCBvbmx5IHNob3cgdXAgaW4gJ25vcm1hbGl6ZWQnIGZvcm1cbiAgICAgICAgLy8gaW4gYHN0eWxlLml0ZW1gIChpLmUuIHRleHQtZGVjb3JhdGlvbiBiZWNvbWVzXG4gICAgICAgIC8vIHRleHQtZGVjb3JhdGlvbi1saW5lLCB0ZXh0LWRlY29yYXRpb24tY29sb3IsIGV0YyksIHdlIGRpcmVjdGx5XG4gICAgICAgIC8vIHF1ZXJ5IHRoZSBzdHlsZXMgbWVudGlvbmVkIGluIG91ciBydWxlcyBpbnN0ZWFkIG9mIGl0ZXJhdGluZ1xuICAgICAgICAvLyBvdmVyIHRoZSBpdGVtcy5cbiAgICAgICAgaWYgKHN0eWxlcyAmJiBzdHlsZXMubGVuZ3RoKVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBhcnNlci5tYXRjaGVkU3R5bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSB0aGlzLnBhcnNlci5tYXRjaGVkU3R5bGVzW2ldLCB2YWx1ZSA9IHN0eWxlcy5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgYWZ0ZXIgPSB1bmRlZmluZWQ7Oykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJ1bGUgPSB0aGlzLnBhcnNlci5tYXRjaFN0eWxlKG5hbWUsIHZhbHVlLCB0aGlzLCBhZnRlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJ1bGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVsZS5pZ25vcmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVsZS5jbGVhck1hcmspXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya3MgPSBtYXJrcy5maWx0ZXIobSA9PiAhcnVsZS5jbGVhck1hcmsobSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtzID0gbWFya3MuY29uY2F0KHRoaXMucGFyc2VyLnNjaGVtYS5tYXJrc1tydWxlLm1hcmtdLmNyZWF0ZShydWxlLmF0dHJzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVsZS5jb25zdW1pbmcgPT09IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFmdGVyID0gcnVsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFya3M7XG4gICAgfVxuICAgIC8vIExvb2sgdXAgYSBoYW5kbGVyIGZvciB0aGUgZ2l2ZW4gbm9kZS4gSWYgbm9uZSBhcmUgZm91bmQsIHJldHVyblxuICAgIC8vIGZhbHNlLiBPdGhlcndpc2UsIGFwcGx5IGl0LCB1c2UgaXRzIHJldHVybiB2YWx1ZSB0byBkcml2ZSB0aGUgd2F5XG4gICAgLy8gdGhlIG5vZGUncyBjb250ZW50IGlzIHdyYXBwZWQsIGFuZCByZXR1cm4gdHJ1ZS5cbiAgICBhZGRFbGVtZW50QnlSdWxlKGRvbSwgcnVsZSwgbWFya3MsIGNvbnRpbnVlQWZ0ZXIpIHtcbiAgICAgICAgbGV0IHN5bmMsIG5vZGVUeXBlO1xuICAgICAgICBpZiAocnVsZS5ub2RlKSB7XG4gICAgICAgICAgICBub2RlVHlwZSA9IHRoaXMucGFyc2VyLnNjaGVtYS5ub2Rlc1tydWxlLm5vZGVdO1xuICAgICAgICAgICAgaWYgKCFub2RlVHlwZS5pc0xlYWYpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5uZXIgPSB0aGlzLmVudGVyKG5vZGVUeXBlLCBydWxlLmF0dHJzIHx8IG51bGwsIG1hcmtzLCBydWxlLnByZXNlcnZlV2hpdGVzcGFjZSk7XG4gICAgICAgICAgICAgICAgaWYgKGlubmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHN5bmMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBtYXJrcyA9IGlubmVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCF0aGlzLmluc2VydE5vZGUobm9kZVR5cGUuY3JlYXRlKHJ1bGUuYXR0cnMpLCBtYXJrcykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxlYWZGYWxsYmFjayhkb20sIG1hcmtzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCBtYXJrVHlwZSA9IHRoaXMucGFyc2VyLnNjaGVtYS5tYXJrc1tydWxlLm1hcmtdO1xuICAgICAgICAgICAgbWFya3MgPSBtYXJrcy5jb25jYXQobWFya1R5cGUuY3JlYXRlKHJ1bGUuYXR0cnMpKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc3RhcnRJbiA9IHRoaXMudG9wO1xuICAgICAgICBpZiAobm9kZVR5cGUgJiYgbm9kZVR5cGUuaXNMZWFmKSB7XG4gICAgICAgICAgICB0aGlzLmZpbmRJbnNpZGUoZG9tKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjb250aW51ZUFmdGVyKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnQoZG9tLCBtYXJrcywgY29udGludWVBZnRlcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocnVsZS5nZXRDb250ZW50KSB7XG4gICAgICAgICAgICB0aGlzLmZpbmRJbnNpZGUoZG9tKTtcbiAgICAgICAgICAgIHJ1bGUuZ2V0Q29udGVudChkb20sIHRoaXMucGFyc2VyLnNjaGVtYSkuZm9yRWFjaChub2RlID0+IHRoaXMuaW5zZXJ0Tm9kZShub2RlLCBtYXJrcykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IGNvbnRlbnRET00gPSBkb207XG4gICAgICAgICAgICBpZiAodHlwZW9mIHJ1bGUuY29udGVudEVsZW1lbnQgPT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgICAgICBjb250ZW50RE9NID0gZG9tLnF1ZXJ5U2VsZWN0b3IocnVsZS5jb250ZW50RWxlbWVudCk7XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgcnVsZS5jb250ZW50RWxlbWVudCA9PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgY29udGVudERPTSA9IHJ1bGUuY29udGVudEVsZW1lbnQoZG9tKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKHJ1bGUuY29udGVudEVsZW1lbnQpXG4gICAgICAgICAgICAgICAgY29udGVudERPTSA9IHJ1bGUuY29udGVudEVsZW1lbnQ7XG4gICAgICAgICAgICB0aGlzLmZpbmRBcm91bmQoZG9tLCBjb250ZW50RE9NLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuYWRkQWxsKGNvbnRlbnRET00sIG1hcmtzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3luYyAmJiB0aGlzLnN5bmMoc3RhcnRJbikpXG4gICAgICAgICAgICB0aGlzLm9wZW4tLTtcbiAgICB9XG4gICAgLy8gQWRkIGFsbCBjaGlsZCBub2RlcyBiZXR3ZWVuIGBzdGFydEluZGV4YCBhbmQgYGVuZEluZGV4YCAob3IgdGhlXG4gICAgLy8gd2hvbGUgbm9kZSwgaWYgbm90IGdpdmVuKS4gSWYgYHN5bmNgIGlzIHBhc3NlZCwgdXNlIGl0IHRvXG4gICAgLy8gc3luY2hyb25pemUgYWZ0ZXIgZXZlcnkgYmxvY2sgZWxlbWVudC5cbiAgICBhZGRBbGwocGFyZW50LCBtYXJrcywgc3RhcnRJbmRleCwgZW5kSW5kZXgpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gc3RhcnRJbmRleCB8fCAwO1xuICAgICAgICBmb3IgKGxldCBkb20gPSBzdGFydEluZGV4ID8gcGFyZW50LmNoaWxkTm9kZXNbc3RhcnRJbmRleF0gOiBwYXJlbnQuZmlyc3RDaGlsZCwgZW5kID0gZW5kSW5kZXggPT0gbnVsbCA/IG51bGwgOiBwYXJlbnQuY2hpbGROb2Rlc1tlbmRJbmRleF07IGRvbSAhPSBlbmQ7IGRvbSA9IGRvbS5uZXh0U2libGluZywgKytpbmRleCkge1xuICAgICAgICAgICAgdGhpcy5maW5kQXRQb2ludChwYXJlbnQsIGluZGV4KTtcbiAgICAgICAgICAgIHRoaXMuYWRkRE9NKGRvbSwgbWFya3MpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmluZEF0UG9pbnQocGFyZW50LCBpbmRleCk7XG4gICAgfVxuICAgIC8vIFRyeSB0byBmaW5kIGEgd2F5IHRvIGZpdCB0aGUgZ2l2ZW4gbm9kZSB0eXBlIGludG8gdGhlIGN1cnJlbnRcbiAgICAvLyBjb250ZXh0LiBNYXkgYWRkIGludGVybWVkaWF0ZSB3cmFwcGVycyBhbmQvb3IgbGVhdmUgbm9uLXNvbGlkXG4gICAgLy8gbm9kZXMgdGhhdCB3ZSdyZSBpbi5cbiAgICBmaW5kUGxhY2Uobm9kZSwgbWFya3MpIHtcbiAgICAgICAgbGV0IHJvdXRlLCBzeW5jO1xuICAgICAgICBmb3IgKGxldCBkZXB0aCA9IHRoaXMub3BlbjsgZGVwdGggPj0gMDsgZGVwdGgtLSkge1xuICAgICAgICAgICAgbGV0IGN4ID0gdGhpcy5ub2Rlc1tkZXB0aF07XG4gICAgICAgICAgICBsZXQgZm91bmQgPSBjeC5maW5kV3JhcHBpbmcobm9kZSk7XG4gICAgICAgICAgICBpZiAoZm91bmQgJiYgKCFyb3V0ZSB8fCByb3V0ZS5sZW5ndGggPiBmb3VuZC5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgcm91dGUgPSBmb3VuZDtcbiAgICAgICAgICAgICAgICBzeW5jID0gY3g7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZC5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGN4LnNvbGlkKVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcm91dGUpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgdGhpcy5zeW5jKHN5bmMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvdXRlLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgbWFya3MgPSB0aGlzLmVudGVySW5uZXIocm91dGVbaV0sIG51bGwsIG1hcmtzLCBmYWxzZSk7XG4gICAgICAgIHJldHVybiBtYXJrcztcbiAgICB9XG4gICAgLy8gVHJ5IHRvIGluc2VydCB0aGUgZ2l2ZW4gbm9kZSwgYWRqdXN0aW5nIHRoZSBjb250ZXh0IHdoZW4gbmVlZGVkLlxuICAgIGluc2VydE5vZGUobm9kZSwgbWFya3MpIHtcbiAgICAgICAgaWYgKG5vZGUuaXNJbmxpbmUgJiYgdGhpcy5uZWVkc0Jsb2NrICYmICF0aGlzLnRvcC50eXBlKSB7XG4gICAgICAgICAgICBsZXQgYmxvY2sgPSB0aGlzLnRleHRibG9ja0Zyb21Db250ZXh0KCk7XG4gICAgICAgICAgICBpZiAoYmxvY2spXG4gICAgICAgICAgICAgICAgbWFya3MgPSB0aGlzLmVudGVySW5uZXIoYmxvY2ssIG51bGwsIG1hcmtzKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaW5uZXJNYXJrcyA9IHRoaXMuZmluZFBsYWNlKG5vZGUsIG1hcmtzKTtcbiAgICAgICAgaWYgKGlubmVyTWFya3MpIHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2VFeHRyYSgpO1xuICAgICAgICAgICAgbGV0IHRvcCA9IHRoaXMudG9wO1xuICAgICAgICAgICAgaWYgKHRvcC5tYXRjaClcbiAgICAgICAgICAgICAgICB0b3AubWF0Y2ggPSB0b3AubWF0Y2gubWF0Y2hUeXBlKG5vZGUudHlwZSk7XG4gICAgICAgICAgICBsZXQgbm9kZU1hcmtzID0gTWFyay5ub25lO1xuICAgICAgICAgICAgZm9yIChsZXQgbSBvZiBpbm5lck1hcmtzLmNvbmNhdChub2RlLm1hcmtzKSlcbiAgICAgICAgICAgICAgICBpZiAodG9wLnR5cGUgPyB0b3AudHlwZS5hbGxvd3NNYXJrVHlwZShtLnR5cGUpIDogbWFya01heUFwcGx5KG0udHlwZSwgbm9kZS50eXBlKSlcbiAgICAgICAgICAgICAgICAgICAgbm9kZU1hcmtzID0gbS5hZGRUb1NldChub2RlTWFya3MpO1xuICAgICAgICAgICAgdG9wLmNvbnRlbnQucHVzaChub2RlLm1hcmsobm9kZU1hcmtzKSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIFRyeSB0byBzdGFydCBhIG5vZGUgb2YgdGhlIGdpdmVuIHR5cGUsIGFkanVzdGluZyB0aGUgY29udGV4dCB3aGVuXG4gICAgLy8gbmVjZXNzYXJ5LlxuICAgIGVudGVyKHR5cGUsIGF0dHJzLCBtYXJrcywgcHJlc2VydmVXUykge1xuICAgICAgICBsZXQgaW5uZXJNYXJrcyA9IHRoaXMuZmluZFBsYWNlKHR5cGUuY3JlYXRlKGF0dHJzKSwgbWFya3MpO1xuICAgICAgICBpZiAoaW5uZXJNYXJrcylcbiAgICAgICAgICAgIGlubmVyTWFya3MgPSB0aGlzLmVudGVySW5uZXIodHlwZSwgYXR0cnMsIG1hcmtzLCB0cnVlLCBwcmVzZXJ2ZVdTKTtcbiAgICAgICAgcmV0dXJuIGlubmVyTWFya3M7XG4gICAgfVxuICAgIC8vIE9wZW4gYSBub2RlIG9mIHRoZSBnaXZlbiB0eXBlXG4gICAgZW50ZXJJbm5lcih0eXBlLCBhdHRycywgbWFya3MsIHNvbGlkID0gZmFsc2UsIHByZXNlcnZlV1MpIHtcbiAgICAgICAgdGhpcy5jbG9zZUV4dHJhKCk7XG4gICAgICAgIGxldCB0b3AgPSB0aGlzLnRvcDtcbiAgICAgICAgdG9wLm1hdGNoID0gdG9wLm1hdGNoICYmIHRvcC5tYXRjaC5tYXRjaFR5cGUodHlwZSk7XG4gICAgICAgIGxldCBvcHRpb25zID0gd3NPcHRpb25zRm9yKHR5cGUsIHByZXNlcnZlV1MsIHRvcC5vcHRpb25zKTtcbiAgICAgICAgaWYgKCh0b3Aub3B0aW9ucyAmIE9QVF9PUEVOX0xFRlQpICYmIHRvcC5jb250ZW50Lmxlbmd0aCA9PSAwKVxuICAgICAgICAgICAgb3B0aW9ucyB8PSBPUFRfT1BFTl9MRUZUO1xuICAgICAgICBsZXQgYXBwbHlNYXJrcyA9IE1hcmsubm9uZTtcbiAgICAgICAgbWFya3MgPSBtYXJrcy5maWx0ZXIobSA9PiB7XG4gICAgICAgICAgICBpZiAodG9wLnR5cGUgPyB0b3AudHlwZS5hbGxvd3NNYXJrVHlwZShtLnR5cGUpIDogbWFya01heUFwcGx5KG0udHlwZSwgdHlwZSkpIHtcbiAgICAgICAgICAgICAgICBhcHBseU1hcmtzID0gbS5hZGRUb1NldChhcHBseU1hcmtzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubm9kZXMucHVzaChuZXcgTm9kZUNvbnRleHQodHlwZSwgYXR0cnMsIGFwcGx5TWFya3MsIHNvbGlkLCBudWxsLCBvcHRpb25zKSk7XG4gICAgICAgIHRoaXMub3BlbisrO1xuICAgICAgICByZXR1cm4gbWFya3M7XG4gICAgfVxuICAgIC8vIE1ha2Ugc3VyZSBhbGwgbm9kZXMgYWJvdmUgdGhpcy5vcGVuIGFyZSBmaW5pc2hlZCBhbmQgYWRkZWQgdG9cbiAgICAvLyB0aGVpciBwYXJlbnRzXG4gICAgY2xvc2VFeHRyYShvcGVuRW5kID0gZmFsc2UpIHtcbiAgICAgICAgbGV0IGkgPSB0aGlzLm5vZGVzLmxlbmd0aCAtIDE7XG4gICAgICAgIGlmIChpID4gdGhpcy5vcGVuKSB7XG4gICAgICAgICAgICBmb3IgKDsgaSA+IHRoaXMub3BlbjsgaS0tKVxuICAgICAgICAgICAgICAgIHRoaXMubm9kZXNbaSAtIDFdLmNvbnRlbnQucHVzaCh0aGlzLm5vZGVzW2ldLmZpbmlzaChvcGVuRW5kKSk7XG4gICAgICAgICAgICB0aGlzLm5vZGVzLmxlbmd0aCA9IHRoaXMub3BlbiArIDE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZmluaXNoKCkge1xuICAgICAgICB0aGlzLm9wZW4gPSAwO1xuICAgICAgICB0aGlzLmNsb3NlRXh0cmEodGhpcy5pc09wZW4pO1xuICAgICAgICByZXR1cm4gdGhpcy5ub2Rlc1swXS5maW5pc2godGhpcy5pc09wZW4gfHwgdGhpcy5vcHRpb25zLnRvcE9wZW4pO1xuICAgIH1cbiAgICBzeW5jKHRvKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLm9wZW47IGkgPj0gMDsgaS0tKVxuICAgICAgICAgICAgaWYgKHRoaXMubm9kZXNbaV0gPT0gdG8pIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW4gPSBpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGdldCBjdXJyZW50UG9zKCkge1xuICAgICAgICB0aGlzLmNsb3NlRXh0cmEoKTtcbiAgICAgICAgbGV0IHBvcyA9IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLm9wZW47IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBsZXQgY29udGVudCA9IHRoaXMubm9kZXNbaV0uY29udGVudDtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSBjb250ZW50Lmxlbmd0aCAtIDE7IGogPj0gMDsgai0tKVxuICAgICAgICAgICAgICAgIHBvcyArPSBjb250ZW50W2pdLm5vZGVTaXplO1xuICAgICAgICAgICAgaWYgKGkpXG4gICAgICAgICAgICAgICAgcG9zKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBvcztcbiAgICB9XG4gICAgZmluZEF0UG9pbnQocGFyZW50LCBvZmZzZXQpIHtcbiAgICAgICAgaWYgKHRoaXMuZmluZClcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5maW5kLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmluZFtpXS5ub2RlID09IHBhcmVudCAmJiB0aGlzLmZpbmRbaV0ub2Zmc2V0ID09IG9mZnNldClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maW5kW2ldLnBvcyA9IHRoaXMuY3VycmVudFBvcztcbiAgICAgICAgICAgIH1cbiAgICB9XG4gICAgZmluZEluc2lkZShwYXJlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuZmluZClcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5maW5kLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmluZFtpXS5wb3MgPT0gbnVsbCAmJiBwYXJlbnQubm9kZVR5cGUgPT0gMSAmJiBwYXJlbnQuY29udGFpbnModGhpcy5maW5kW2ldLm5vZGUpKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbmRbaV0ucG9zID0gdGhpcy5jdXJyZW50UG9zO1xuICAgICAgICAgICAgfVxuICAgIH1cbiAgICBmaW5kQXJvdW5kKHBhcmVudCwgY29udGVudCwgYmVmb3JlKSB7XG4gICAgICAgIGlmIChwYXJlbnQgIT0gY29udGVudCAmJiB0aGlzLmZpbmQpXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmluZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpbmRbaV0ucG9zID09IG51bGwgJiYgcGFyZW50Lm5vZGVUeXBlID09IDEgJiYgcGFyZW50LmNvbnRhaW5zKHRoaXMuZmluZFtpXS5ub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcG9zID0gY29udGVudC5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbih0aGlzLmZpbmRbaV0ubm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3MgJiAoYmVmb3JlID8gMiA6IDQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maW5kW2ldLnBvcyA9IHRoaXMuY3VycmVudFBvcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgfVxuICAgIGZpbmRJblRleHQodGV4dE5vZGUpIHtcbiAgICAgICAgaWYgKHRoaXMuZmluZClcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5maW5kLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmluZFtpXS5ub2RlID09IHRleHROb2RlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbmRbaV0ucG9zID0gdGhpcy5jdXJyZW50UG9zIC0gKHRleHROb2RlLm5vZGVWYWx1ZS5sZW5ndGggLSB0aGlzLmZpbmRbaV0ub2Zmc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICB9XG4gICAgLy8gRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBnaXZlbiBjb250ZXh0IHN0cmluZyBtYXRjaGVzIHRoaXMgY29udGV4dC5cbiAgICBtYXRjaGVzQ29udGV4dChjb250ZXh0KSB7XG4gICAgICAgIGlmIChjb250ZXh0LmluZGV4T2YoXCJ8XCIpID4gLTEpXG4gICAgICAgICAgICByZXR1cm4gY29udGV4dC5zcGxpdCgvXFxzKlxcfFxccyovKS5zb21lKHRoaXMubWF0Y2hlc0NvbnRleHQsIHRoaXMpO1xuICAgICAgICBsZXQgcGFydHMgPSBjb250ZXh0LnNwbGl0KFwiL1wiKTtcbiAgICAgICAgbGV0IG9wdGlvbiA9IHRoaXMub3B0aW9ucy5jb250ZXh0O1xuICAgICAgICBsZXQgdXNlUm9vdCA9ICF0aGlzLmlzT3BlbiAmJiAoIW9wdGlvbiB8fCBvcHRpb24ucGFyZW50LnR5cGUgPT0gdGhpcy5ub2Rlc1swXS50eXBlKTtcbiAgICAgICAgbGV0IG1pbkRlcHRoID0gLShvcHRpb24gPyBvcHRpb24uZGVwdGggKyAxIDogMCkgKyAodXNlUm9vdCA/IDAgOiAxKTtcbiAgICAgICAgbGV0IG1hdGNoID0gKGksIGRlcHRoKSA9PiB7XG4gICAgICAgICAgICBmb3IgKDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBsZXQgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChwYXJ0ID09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT0gcGFydHMubGVuZ3RoIC0gMSB8fCBpID09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICg7IGRlcHRoID49IG1pbkRlcHRoOyBkZXB0aC0tKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoKGkgLSAxLCBkZXB0aCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXh0ID0gZGVwdGggPiAwIHx8IChkZXB0aCA9PSAwICYmIHVzZVJvb3QpID8gdGhpcy5ub2Rlc1tkZXB0aF0udHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBvcHRpb24gJiYgZGVwdGggPj0gbWluRGVwdGggPyBvcHRpb24ubm9kZShkZXB0aCAtIG1pbkRlcHRoKS50eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW5leHQgfHwgKG5leHQubmFtZSAhPSBwYXJ0ICYmIG5leHQuZ3JvdXBzLmluZGV4T2YocGFydCkgPT0gLTEpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBkZXB0aC0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gbWF0Y2gocGFydHMubGVuZ3RoIC0gMSwgdGhpcy5vcGVuKTtcbiAgICB9XG4gICAgdGV4dGJsb2NrRnJvbUNvbnRleHQoKSB7XG4gICAgICAgIGxldCAkY29udGV4dCA9IHRoaXMub3B0aW9ucy5jb250ZXh0O1xuICAgICAgICBpZiAoJGNvbnRleHQpXG4gICAgICAgICAgICBmb3IgKGxldCBkID0gJGNvbnRleHQuZGVwdGg7IGQgPj0gMDsgZC0tKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRlZmx0ID0gJGNvbnRleHQubm9kZShkKS5jb250ZW50TWF0Y2hBdCgkY29udGV4dC5pbmRleEFmdGVyKGQpKS5kZWZhdWx0VHlwZTtcbiAgICAgICAgICAgICAgICBpZiAoZGVmbHQgJiYgZGVmbHQuaXNUZXh0YmxvY2sgJiYgZGVmbHQuZGVmYXVsdEF0dHJzKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmbHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IG5hbWUgaW4gdGhpcy5wYXJzZXIuc2NoZW1hLm5vZGVzKSB7XG4gICAgICAgICAgICBsZXQgdHlwZSA9IHRoaXMucGFyc2VyLnNjaGVtYS5ub2Rlc1tuYW1lXTtcbiAgICAgICAgICAgIGlmICh0eXBlLmlzVGV4dGJsb2NrICYmIHR5cGUuZGVmYXVsdEF0dHJzKVxuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlO1xuICAgICAgICB9XG4gICAgfVxufVxuLy8gS2x1ZGdlIHRvIHdvcmsgYXJvdW5kIGRpcmVjdGx5IG5lc3RlZCBsaXN0IG5vZGVzIHByb2R1Y2VkIGJ5IHNvbWVcbi8vIHRvb2xzIGFuZCBhbGxvd2VkIGJ5IGJyb3dzZXJzIHRvIG1lYW4gdGhhdCB0aGUgbmVzdGVkIGxpc3QgaXNcbi8vIGFjdHVhbGx5IHBhcnQgb2YgdGhlIGxpc3QgaXRlbSBhYm92ZSBpdC5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUxpc3QoZG9tKSB7XG4gICAgZm9yIChsZXQgY2hpbGQgPSBkb20uZmlyc3RDaGlsZCwgcHJldkl0ZW0gPSBudWxsOyBjaGlsZDsgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZykge1xuICAgICAgICBsZXQgbmFtZSA9IGNoaWxkLm5vZGVUeXBlID09IDEgPyBjaGlsZC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpIDogbnVsbDtcbiAgICAgICAgaWYgKG5hbWUgJiYgbGlzdFRhZ3MuaGFzT3duUHJvcGVydHkobmFtZSkgJiYgcHJldkl0ZW0pIHtcbiAgICAgICAgICAgIHByZXZJdGVtLmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgIGNoaWxkID0gcHJldkl0ZW07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobmFtZSA9PSBcImxpXCIpIHtcbiAgICAgICAgICAgIHByZXZJdGVtID0gY2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobmFtZSkge1xuICAgICAgICAgICAgcHJldkl0ZW0gPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufVxuLy8gQXBwbHkgYSBDU1Mgc2VsZWN0b3IuXG5mdW5jdGlvbiBtYXRjaGVzKGRvbSwgc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gKGRvbS5tYXRjaGVzIHx8IGRvbS5tc01hdGNoZXNTZWxlY3RvciB8fCBkb20ud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IGRvbS5tb3pNYXRjaGVzU2VsZWN0b3IpLmNhbGwoZG9tLCBzZWxlY3Rvcik7XG59XG5mdW5jdGlvbiBjb3B5KG9iaikge1xuICAgIGxldCBjb3B5ID0ge307XG4gICAgZm9yIChsZXQgcHJvcCBpbiBvYmopXG4gICAgICAgIGNvcHlbcHJvcF0gPSBvYmpbcHJvcF07XG4gICAgcmV0dXJuIGNvcHk7XG59XG4vLyBVc2VkIHdoZW4gZmluZGluZyBhIG1hcmsgYXQgdGhlIHRvcCBsZXZlbCBvZiBhIGZyYWdtZW50IHBhcnNlLlxuLy8gQ2hlY2tzIHdoZXRoZXIgaXQgd291bGQgYmUgcmVhc29uYWJsZSB0byBhcHBseSBhIGdpdmVuIG1hcmsgdHlwZSB0b1xuLy8gYSBnaXZlbiBub2RlLCBieSBsb29raW5nIGF0IHRoZSB3YXkgdGhlIG1hcmsgb2NjdXJzIGluIHRoZSBzY2hlbWEuXG5mdW5jdGlvbiBtYXJrTWF5QXBwbHkobWFya1R5cGUsIG5vZGVUeXBlKSB7XG4gICAgbGV0IG5vZGVzID0gbm9kZVR5cGUuc2NoZW1hLm5vZGVzO1xuICAgIGZvciAobGV0IG5hbWUgaW4gbm9kZXMpIHtcbiAgICAgICAgbGV0IHBhcmVudCA9IG5vZGVzW25hbWVdO1xuICAgICAgICBpZiAoIXBhcmVudC5hbGxvd3NNYXJrVHlwZShtYXJrVHlwZSkpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgbGV0IHNlZW4gPSBbXSwgc2NhbiA9IChtYXRjaCkgPT4ge1xuICAgICAgICAgICAgc2Vlbi5wdXNoKG1hdGNoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2guZWRnZUNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgeyB0eXBlLCBuZXh0IH0gPSBtYXRjaC5lZGdlKGkpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlID09IG5vZGVUeXBlKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAoc2Vlbi5pbmRleE9mKG5leHQpIDwgMCAmJiBzY2FuKG5leHQpKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHNjYW4ocGFyZW50LmNvbnRlbnRNYXRjaCkpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG5cbi8qKlxuQSBET00gc2VyaWFsaXplciBrbm93cyBob3cgdG8gY29udmVydCBQcm9zZU1pcnJvciBub2RlcyBhbmRcbm1hcmtzIG9mIHZhcmlvdXMgdHlwZXMgdG8gRE9NIG5vZGVzLlxuKi9cbmNsYXNzIERPTVNlcmlhbGl6ZXIge1xuICAgIC8qKlxuICAgIENyZWF0ZSBhIHNlcmlhbGl6ZXIuIGBub2Rlc2Agc2hvdWxkIG1hcCBub2RlIG5hbWVzIHRvIGZ1bmN0aW9uc1xuICAgIHRoYXQgdGFrZSBhIG5vZGUgYW5kIHJldHVybiBhIGRlc2NyaXB0aW9uIG9mIHRoZSBjb3JyZXNwb25kaW5nXG4gICAgRE9NLiBgbWFya3NgIGRvZXMgdGhlIHNhbWUgZm9yIG1hcmsgbmFtZXMsIGJ1dCBhbHNvIGdldHMgYW5cbiAgICBhcmd1bWVudCB0aGF0IHRlbGxzIGl0IHdoZXRoZXIgdGhlIG1hcmsncyBjb250ZW50IGlzIGJsb2NrIG9yXG4gICAgaW5saW5lIGNvbnRlbnQgKGZvciB0eXBpY2FsIHVzZSwgaXQnbGwgYWx3YXlzIGJlIGlubGluZSkuIEEgbWFya1xuICAgIHNlcmlhbGl6ZXIgbWF5IGJlIGBudWxsYCB0byBpbmRpY2F0ZSB0aGF0IG1hcmtzIG9mIHRoYXQgdHlwZVxuICAgIHNob3VsZCBub3QgYmUgc2VyaWFsaXplZC5cbiAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8qKlxuICAgIFRoZSBub2RlIHNlcmlhbGl6YXRpb24gZnVuY3Rpb25zLlxuICAgICovXG4gICAgbm9kZXMsIFxuICAgIC8qKlxuICAgIFRoZSBtYXJrIHNlcmlhbGl6YXRpb24gZnVuY3Rpb25zLlxuICAgICovXG4gICAgbWFya3MpIHtcbiAgICAgICAgdGhpcy5ub2RlcyA9IG5vZGVzO1xuICAgICAgICB0aGlzLm1hcmtzID0gbWFya3M7XG4gICAgfVxuICAgIC8qKlxuICAgIFNlcmlhbGl6ZSB0aGUgY29udGVudCBvZiB0aGlzIGZyYWdtZW50IHRvIGEgRE9NIGZyYWdtZW50LiBXaGVuXG4gICAgbm90IGluIHRoZSBicm93c2VyLCB0aGUgYGRvY3VtZW50YCBvcHRpb24sIGNvbnRhaW5pbmcgYSBET01cbiAgICBkb2N1bWVudCwgc2hvdWxkIGJlIHBhc3NlZCBzbyB0aGF0IHRoZSBzZXJpYWxpemVyIGNhbiBjcmVhdGVcbiAgICBub2Rlcy5cbiAgICAqL1xuICAgIHNlcmlhbGl6ZUZyYWdtZW50KGZyYWdtZW50LCBvcHRpb25zID0ge30sIHRhcmdldCkge1xuICAgICAgICBpZiAoIXRhcmdldClcbiAgICAgICAgICAgIHRhcmdldCA9IGRvYyhvcHRpb25zKS5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICAgIGxldCB0b3AgPSB0YXJnZXQsIGFjdGl2ZSA9IFtdO1xuICAgICAgICBmcmFnbWVudC5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgICAgICAgaWYgKGFjdGl2ZS5sZW5ndGggfHwgbm9kZS5tYXJrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBsZXQga2VlcCA9IDAsIHJlbmRlcmVkID0gMDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoa2VlcCA8IGFjdGl2ZS5sZW5ndGggJiYgcmVuZGVyZWQgPCBub2RlLm1hcmtzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dCA9IG5vZGUubWFya3NbcmVuZGVyZWRdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMubWFya3NbbmV4dC50eXBlLm5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlZCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXh0LmVxKGFjdGl2ZVtrZWVwXVswXSkgfHwgbmV4dC50eXBlLnNwZWMuc3Bhbm5pbmcgPT09IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGtlZXArKztcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyZWQrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2hpbGUgKGtlZXAgPCBhY3RpdmUubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICB0b3AgPSBhY3RpdmUucG9wKClbMV07XG4gICAgICAgICAgICAgICAgd2hpbGUgKHJlbmRlcmVkIDwgbm9kZS5tYXJrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFkZCA9IG5vZGUubWFya3NbcmVuZGVyZWQrK107XG4gICAgICAgICAgICAgICAgICAgIGxldCBtYXJrRE9NID0gdGhpcy5zZXJpYWxpemVNYXJrKGFkZCwgbm9kZS5pc0lubGluZSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXJrRE9NKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmUucHVzaChbYWRkLCB0b3BdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcC5hcHBlbmRDaGlsZChtYXJrRE9NLmRvbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3AgPSBtYXJrRE9NLmNvbnRlbnRET00gfHwgbWFya0RPTS5kb207XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b3AuYXBwZW5kQ2hpbGQodGhpcy5zZXJpYWxpemVOb2RlSW5uZXIobm9kZSwgb3B0aW9ucykpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG4gICAgLyoqXG4gICAgQGludGVybmFsXG4gICAgKi9cbiAgICBzZXJpYWxpemVOb2RlSW5uZXIobm9kZSwgb3B0aW9ucykge1xuICAgICAgICBsZXQgeyBkb20sIGNvbnRlbnRET00gfSA9IHJlbmRlclNwZWMoZG9jKG9wdGlvbnMpLCB0aGlzLm5vZGVzW25vZGUudHlwZS5uYW1lXShub2RlKSwgbnVsbCwgbm9kZS5hdHRycyk7XG4gICAgICAgIGlmIChjb250ZW50RE9NKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5pc0xlYWYpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJDb250ZW50IGhvbGUgbm90IGFsbG93ZWQgaW4gYSBsZWFmIG5vZGUgc3BlY1wiKTtcbiAgICAgICAgICAgIHRoaXMuc2VyaWFsaXplRnJhZ21lbnQobm9kZS5jb250ZW50LCBvcHRpb25zLCBjb250ZW50RE9NKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZG9tO1xuICAgIH1cbiAgICAvKipcbiAgICBTZXJpYWxpemUgdGhpcyBub2RlIHRvIGEgRE9NIG5vZGUuIFRoaXMgY2FuIGJlIHVzZWZ1bCB3aGVuIHlvdVxuICAgIG5lZWQgdG8gc2VyaWFsaXplIGEgcGFydCBvZiBhIGRvY3VtZW50LCBhcyBvcHBvc2VkIHRvIHRoZSB3aG9sZVxuICAgIGRvY3VtZW50LiBUbyBzZXJpYWxpemUgYSB3aG9sZSBkb2N1bWVudCwgdXNlXG4gICAgW2BzZXJpYWxpemVGcmFnbWVudGBdKGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2RvY3MvcmVmLyNtb2RlbC5ET01TZXJpYWxpemVyLnNlcmlhbGl6ZUZyYWdtZW50KSBvblxuICAgIGl0cyBbY29udGVudF0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGUuY29udGVudCkuXG4gICAgKi9cbiAgICBzZXJpYWxpemVOb2RlKG5vZGUsIG9wdGlvbnMgPSB7fSkge1xuICAgICAgICBsZXQgZG9tID0gdGhpcy5zZXJpYWxpemVOb2RlSW5uZXIobm9kZSwgb3B0aW9ucyk7XG4gICAgICAgIGZvciAobGV0IGkgPSBub2RlLm1hcmtzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBsZXQgd3JhcCA9IHRoaXMuc2VyaWFsaXplTWFyayhub2RlLm1hcmtzW2ldLCBub2RlLmlzSW5saW5lLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmICh3cmFwKSB7XG4gICAgICAgICAgICAgICAgKHdyYXAuY29udGVudERPTSB8fCB3cmFwLmRvbSkuYXBwZW5kQ2hpbGQoZG9tKTtcbiAgICAgICAgICAgICAgICBkb20gPSB3cmFwLmRvbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZG9tO1xuICAgIH1cbiAgICAvKipcbiAgICBAaW50ZXJuYWxcbiAgICAqL1xuICAgIHNlcmlhbGl6ZU1hcmsobWFyaywgaW5saW5lLCBvcHRpb25zID0ge30pIHtcbiAgICAgICAgbGV0IHRvRE9NID0gdGhpcy5tYXJrc1ttYXJrLnR5cGUubmFtZV07XG4gICAgICAgIHJldHVybiB0b0RPTSAmJiByZW5kZXJTcGVjKGRvYyhvcHRpb25zKSwgdG9ET00obWFyaywgaW5saW5lKSwgbnVsbCwgbWFyay5hdHRycyk7XG4gICAgfVxuICAgIHN0YXRpYyByZW5kZXJTcGVjKGRvYywgc3RydWN0dXJlLCB4bWxOUyA9IG51bGwsIGJsb2NrQXJyYXlzSW4pIHtcbiAgICAgICAgcmV0dXJuIHJlbmRlclNwZWMoZG9jLCBzdHJ1Y3R1cmUsIHhtbE5TLCBibG9ja0FycmF5c0luKTtcbiAgICB9XG4gICAgLyoqXG4gICAgQnVpbGQgYSBzZXJpYWxpemVyIHVzaW5nIHRoZSBbYHRvRE9NYF0oaHR0cHM6Ly9wcm9zZW1pcnJvci5uZXQvZG9jcy9yZWYvI21vZGVsLk5vZGVTcGVjLnRvRE9NKVxuICAgIHByb3BlcnRpZXMgaW4gYSBzY2hlbWEncyBub2RlIGFuZCBtYXJrIHNwZWNzLlxuICAgICovXG4gICAgc3RhdGljIGZyb21TY2hlbWEoc2NoZW1hKSB7XG4gICAgICAgIHJldHVybiBzY2hlbWEuY2FjaGVkLmRvbVNlcmlhbGl6ZXIgfHxcbiAgICAgICAgICAgIChzY2hlbWEuY2FjaGVkLmRvbVNlcmlhbGl6ZXIgPSBuZXcgRE9NU2VyaWFsaXplcih0aGlzLm5vZGVzRnJvbVNjaGVtYShzY2hlbWEpLCB0aGlzLm1hcmtzRnJvbVNjaGVtYShzY2hlbWEpKSk7XG4gICAgfVxuICAgIC8qKlxuICAgIEdhdGhlciB0aGUgc2VyaWFsaXplcnMgaW4gYSBzY2hlbWEncyBub2RlIHNwZWNzIGludG8gYW4gb2JqZWN0LlxuICAgIFRoaXMgY2FuIGJlIHVzZWZ1bCBhcyBhIGJhc2UgdG8gYnVpbGQgYSBjdXN0b20gc2VyaWFsaXplciBmcm9tLlxuICAgICovXG4gICAgc3RhdGljIG5vZGVzRnJvbVNjaGVtYShzY2hlbWEpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGdhdGhlclRvRE9NKHNjaGVtYS5ub2Rlcyk7XG4gICAgICAgIGlmICghcmVzdWx0LnRleHQpXG4gICAgICAgICAgICByZXN1bHQudGV4dCA9IG5vZGUgPT4gbm9kZS50ZXh0O1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICAvKipcbiAgICBHYXRoZXIgdGhlIHNlcmlhbGl6ZXJzIGluIGEgc2NoZW1hJ3MgbWFyayBzcGVjcyBpbnRvIGFuIG9iamVjdC5cbiAgICAqL1xuICAgIHN0YXRpYyBtYXJrc0Zyb21TY2hlbWEoc2NoZW1hKSB7XG4gICAgICAgIHJldHVybiBnYXRoZXJUb0RPTShzY2hlbWEubWFya3MpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdhdGhlclRvRE9NKG9iaikge1xuICAgIGxldCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGxldCBuYW1lIGluIG9iaikge1xuICAgICAgICBsZXQgdG9ET00gPSBvYmpbbmFtZV0uc3BlYy50b0RPTTtcbiAgICAgICAgaWYgKHRvRE9NKVxuICAgICAgICAgICAgcmVzdWx0W25hbWVdID0gdG9ET007XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBkb2Mob3B0aW9ucykge1xuICAgIHJldHVybiBvcHRpb25zLmRvY3VtZW50IHx8IHdpbmRvdy5kb2N1bWVudDtcbn1cbmNvbnN0IHN1c3BpY2lvdXNBdHRyaWJ1dGVDYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG5mdW5jdGlvbiBzdXNwaWNpb3VzQXR0cmlidXRlcyhhdHRycykge1xuICAgIGxldCB2YWx1ZSA9IHN1c3BpY2lvdXNBdHRyaWJ1dGVDYWNoZS5nZXQoYXR0cnMpO1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICBzdXNwaWNpb3VzQXR0cmlidXRlQ2FjaGUuc2V0KGF0dHJzLCB2YWx1ZSA9IHN1c3BpY2lvdXNBdHRyaWJ1dGVzSW5uZXIoYXR0cnMpKTtcbiAgICByZXR1cm4gdmFsdWU7XG59XG5mdW5jdGlvbiBzdXNwaWNpb3VzQXR0cmlidXRlc0lubmVyKGF0dHJzKSB7XG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XG4gICAgZnVuY3Rpb24gc2Nhbih2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWVbMF0gPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nhbih2YWx1ZVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcHJvcCBpbiB2YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgc2Nhbih2YWx1ZVtwcm9wXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2NhbihhdHRycyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIHJlbmRlclNwZWMoZG9jLCBzdHJ1Y3R1cmUsIHhtbE5TLCBibG9ja0FycmF5c0luKSB7XG4gICAgaWYgKHR5cGVvZiBzdHJ1Y3R1cmUgPT0gXCJzdHJpbmdcIilcbiAgICAgICAgcmV0dXJuIHsgZG9tOiBkb2MuY3JlYXRlVGV4dE5vZGUoc3RydWN0dXJlKSB9O1xuICAgIGlmIChzdHJ1Y3R1cmUubm9kZVR5cGUgIT0gbnVsbClcbiAgICAgICAgcmV0dXJuIHsgZG9tOiBzdHJ1Y3R1cmUgfTtcbiAgICBpZiAoc3RydWN0dXJlLmRvbSAmJiBzdHJ1Y3R1cmUuZG9tLm5vZGVUeXBlICE9IG51bGwpXG4gICAgICAgIHJldHVybiBzdHJ1Y3R1cmU7XG4gICAgbGV0IHRhZ05hbWUgPSBzdHJ1Y3R1cmVbMF0sIHN1c3BpY2lvdXM7XG4gICAgaWYgKHR5cGVvZiB0YWdOYW1lICE9IFwic3RyaW5nXCIpXG4gICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiSW52YWxpZCBhcnJheSBwYXNzZWQgdG8gcmVuZGVyU3BlY1wiKTtcbiAgICBpZiAoYmxvY2tBcnJheXNJbiAmJiAoc3VzcGljaW91cyA9IHN1c3BpY2lvdXNBdHRyaWJ1dGVzKGJsb2NrQXJyYXlzSW4pKSAmJlxuICAgICAgICBzdXNwaWNpb3VzLmluZGV4T2Yoc3RydWN0dXJlKSA+IC0xKVxuICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIlVzaW5nIGFuIGFycmF5IGZyb20gYW4gYXR0cmlidXRlIG9iamVjdCBhcyBhIERPTSBzcGVjLiBUaGlzIG1heSBiZSBhbiBhdHRlbXB0ZWQgY3Jvc3Mgc2l0ZSBzY3JpcHRpbmcgYXR0YWNrLlwiKTtcbiAgICBsZXQgc3BhY2UgPSB0YWdOYW1lLmluZGV4T2YoXCIgXCIpO1xuICAgIGlmIChzcGFjZSA+IDApIHtcbiAgICAgICAgeG1sTlMgPSB0YWdOYW1lLnNsaWNlKDAsIHNwYWNlKTtcbiAgICAgICAgdGFnTmFtZSA9IHRhZ05hbWUuc2xpY2Uoc3BhY2UgKyAxKTtcbiAgICB9XG4gICAgbGV0IGNvbnRlbnRET007XG4gICAgbGV0IGRvbSA9ICh4bWxOUyA/IGRvYy5jcmVhdGVFbGVtZW50TlMoeG1sTlMsIHRhZ05hbWUpIDogZG9jLmNyZWF0ZUVsZW1lbnQodGFnTmFtZSkpO1xuICAgIGxldCBhdHRycyA9IHN0cnVjdHVyZVsxXSwgc3RhcnQgPSAxO1xuICAgIGlmIChhdHRycyAmJiB0eXBlb2YgYXR0cnMgPT0gXCJvYmplY3RcIiAmJiBhdHRycy5ub2RlVHlwZSA9PSBudWxsICYmICFBcnJheS5pc0FycmF5KGF0dHJzKSkge1xuICAgICAgICBzdGFydCA9IDI7XG4gICAgICAgIGZvciAobGV0IG5hbWUgaW4gYXR0cnMpXG4gICAgICAgICAgICBpZiAoYXR0cnNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGxldCBzcGFjZSA9IG5hbWUuaW5kZXhPZihcIiBcIik7XG4gICAgICAgICAgICAgICAgaWYgKHNwYWNlID4gMClcbiAgICAgICAgICAgICAgICAgICAgZG9tLnNldEF0dHJpYnV0ZU5TKG5hbWUuc2xpY2UoMCwgc3BhY2UpLCBuYW1lLnNsaWNlKHNwYWNlICsgMSksIGF0dHJzW25hbWVdKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGRvbS5zZXRBdHRyaWJ1dGUobmFtZSwgYXR0cnNbbmFtZV0pO1xuICAgICAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBzdHJ1Y3R1cmUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IGNoaWxkID0gc3RydWN0dXJlW2ldO1xuICAgICAgICBpZiAoY2hpbGQgPT09IDApIHtcbiAgICAgICAgICAgIGlmIChpIDwgc3RydWN0dXJlLmxlbmd0aCAtIDEgfHwgaSA+IHN0YXJ0KVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiQ29udGVudCBob2xlIG11c3QgYmUgdGhlIG9ubHkgY2hpbGQgb2YgaXRzIHBhcmVudCBub2RlXCIpO1xuICAgICAgICAgICAgcmV0dXJuIHsgZG9tLCBjb250ZW50RE9NOiBkb20gfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCB7IGRvbTogaW5uZXIsIGNvbnRlbnRET006IGlubmVyQ29udGVudCB9ID0gcmVuZGVyU3BlYyhkb2MsIGNoaWxkLCB4bWxOUywgYmxvY2tBcnJheXNJbik7XG4gICAgICAgICAgICBkb20uYXBwZW5kQ2hpbGQoaW5uZXIpO1xuICAgICAgICAgICAgaWYgKGlubmVyQ29udGVudCkge1xuICAgICAgICAgICAgICAgIGlmIChjb250ZW50RE9NKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIk11bHRpcGxlIGNvbnRlbnQgaG9sZXNcIik7XG4gICAgICAgICAgICAgICAgY29udGVudERPTSA9IGlubmVyQ29udGVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyBkb20sIGNvbnRlbnRET00gfTtcbn1cblxuZXhwb3J0IHsgQ29udGVudE1hdGNoLCBET01QYXJzZXIsIERPTVNlcmlhbGl6ZXIsIEZyYWdtZW50LCBNYXJrLCBNYXJrVHlwZSwgTm9kZSwgTm9kZVJhbmdlLCBOb2RlVHlwZSwgUmVwbGFjZUVycm9yLCBSZXNvbHZlZFBvcywgU2NoZW1hLCBTbGljZSB9O1xuIiwgImltcG9ydCB7IE5vZGUgYXMgUE5vZGUsIFNjaGVtYSB9IGZyb20gXCJwcm9zZW1pcnJvci1tb2RlbFwiO1xuXG5leHBvcnQgY29uc3QgU2NoZW1hQ2VsbCA9IHtcblx0SW5wdXRBcmVhOiBcImlucHV0XCIsXG5cdE1hcmtkb3duOiBcIm1hcmtkb3duXCIsXG5cdE1hdGhEaXNwbGF5OiBcIm1hdGhfZGlzcGxheVwiLFxuXHRDb2RlOiBcImNvZGVcIlxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgU2NoZW1hS2V5cyA9IGtleW9mIHR5cGVvZiBTY2hlbWFDZWxsO1xuZXhwb3J0IHR5cGUgU2NoZW1hTmFtZXMgPSB0eXBlb2YgU2NoZW1hQ2VsbFtTY2hlbWFLZXlzXTtcblxuY29uc3QgY2VsbCA9IGAobWFya2Rvd24gfCBoaW50IHwgY29xYmxvY2sgfCBpbnB1dCB8IG1hdGhfZGlzcGxheSlgO1xuY29uc3QgY29udGFpbmVyY29udGVudCA9IFwiKG1hcmtkb3duIHwgY29xYmxvY2sgfCBtYXRoX2Rpc3BsYXkpXCI7XG4vLyBjb25zdCBncm91cE1hcmtkb3duID0gXCJtYXJrZG93bmNvbnRlbnRcIjtcblxuLyoqXG4gKiBHZW5lcmFsIHNjaGVtYSBvYnRhaW5lZCBmcm9tIGBwcm9zZW1pcnJvci1tYXJrZG93bmA6XG4gKiBodHRwczovL2dpdGh1Yi5jb20vUHJvc2VNaXJyb3IvcHJvc2VtaXJyb3ItbWFya2Rvd24vYmxvYi9tYXN0ZXIvc3JjL3NjaGVtYS50c1xuICpcbiAqIENvZGVibG9jayBzY2hlbWEgYWRhcHRlZCBmcm9tICdQcm9zZU1pcnJvciBmb290bm90ZSBleGFtcGxlJzpcbiAqIGh0dHBzOi8vcHJvc2VtaXJyb3IubmV0L2V4YW1wbGVzL2Zvb3Rub3RlL1xuICpcbiAqIG1hdGggYmxvY2tzIG9idGFpbmVkIGZyb20gYHByb3NlbWlycm9yLW1hdGhgOlxuICogaHR0cHM6Ly9naXRodWIuY29tL2JlbnJicmF5L3Byb3NlbWlycm9yLW1hdGgvYmxvYi9tYXN0ZXIvc3JjL21hdGgtc2NoZW1hLnRzXG4gKlxuICogc2VlIFtub3Rlc10oLi9ub3Rlcy5tZClcbiAqL1xuZXhwb3J0IGNvbnN0IFdhdGVycHJvb2ZTY2hlbWE6IFNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuXHRub2Rlczoge1xuXHRcdGRvYzoge1xuXHRcdFx0Y29udGVudDogYCR7Y2VsbH0qYFxuXHRcdH0sXG5cblx0XHR0ZXh0OiB7XG5cdFx0XHRncm91cDogXCJpbmxpbmVcIlxuXHRcdH0sXG5cblx0XHQvLy8vLy8vIE1BUktET1dOIC8vLy8vLy8vXG5cdFx0Ly8jcmVnaW9uIE1hcmtkb3duXG5cdFx0bWFya2Rvd246IHtcblx0XHRcdGJsb2NrOiB0cnVlLFxuXHRcdFx0Y29udGVudDogXCJ0ZXh0KlwiLFxuXHRcdFx0cGFyc2VET006IFt7dGFnOiBcIm1hcmtkb3duXCIsIHByZXNlcnZlV2hpdGVzcGFjZTogXCJmdWxsXCJ9XSxcblx0XHRcdGF0b206IHRydWUsXG5cdFx0XHR0b0RPTTogKCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gW1wiV2F0ZXJwcm9vZk1hcmtkb3duXCIsIDBdO1xuXHRcdFx0fSxcblx0XHR9LFxuXHRcdC8vI2VuZHJlZ2lvblxuXG5cdFx0Ly8vLy8vLyBISU5UIC8vLy8vL1xuXHRcdC8vI3JlZ2lvbiBIaW50XG5cdFx0aGludDoge1xuXHRcdFx0Y29udGVudDogYCR7Y29udGFpbmVyY29udGVudH0qYCxcblx0XHRcdGF0dHJzOiB7XG5cdFx0XHRcdHRpdGxlOiB7ZGVmYXVsdDogXCJcdUQ4M0RcdURDQTEgSGludFwifSxcblx0XHRcdFx0c2hvd246IHtkZWZhdWx0OiBmYWxzZX1cblx0XHRcdH0sXG5cdFx0XHR0b0RPTShub2RlOiBQTm9kZSkge1xuXHRcdFx0XHRyZXR1cm4gW1wiZGl2XCIsIHtjbGFzczogXCJoaW50XCIsIHNob3duOiBub2RlLmF0dHJzLnNob3dufSwgMF07XG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvLyNlbmRyZWdpb25cblxuXHRcdC8vLy8vLy8gSW5wdXQgQXJlYSAvLy8vLy9cblx0XHQvLyNyZWdpb24gaW5wdXRcblx0XHRpbnB1dDoge1xuXHRcdFx0Y29udGVudDogYCR7Y29udGFpbmVyY29udGVudH0qYCxcblx0XHRcdGF0dHJzOiB7XG5cdFx0XHRcdHN0YXR1czoge2RlZmF1bHQ6IG51bGx9XG5cdFx0XHR9LFxuXHRcdFx0dG9ET006ICgpID0+IHtcblx0XHRcdFx0cmV0dXJuIFtcIldhdGVycHJvb2ZJbnB1dFwiLCB7Y2xhc3M6IFwiaW5wdXRhcmVhXCJ9LCAwXTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdC8vI2VuZHJlZ2lvblxuXG5cdFx0Ly8vLy8vIENvcWJsb2NrIC8vLy8vL1xuXHRcdC8vI3JlZ2lvbiBDb3EgY29kZWJsb2NrXG5cdFx0XCJjb3FibG9ja1wiOiB7XG5cdFx0XHRjb250ZW50OiBgKGNvcWRvYyB8IGNvcWNvZGUpK2AsXG5cdFx0XHRhdHRyczoge1xuXHRcdFx0XHRwcmVQcmVXaGl0ZTp7ZGVmYXVsdDpcIm5ld0xpbmVcIn0sXG5cdFx0XHRcdHByZVBvc3RXaGl0ZTp7ZGVmYXVsdDpcIm5ld0xpbmVcIn0sXG5cdFx0XHRcdHBvc3RQcmVXaGl0ZTp7ZGVmYXVsdDpcIm5ld0xpbmVcIn0sXG5cdFx0XHRcdHBvc3RQb3N0V2hpdGU6e2RlZmF1bHQ6XCJuZXdMaW5lXCJ9XG5cdFx0XHR9LFxuXHRcdFx0dG9ET006ICgpID0+IHtcblx0XHRcdFx0cmV0dXJuIFtcImNvcWJsb2NrXCIsIDBdO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRjb3Fkb2M6IHtcblx0XHRcdGNvbnRlbnQ6IFwiKG1hdGhfZGlzcGxheSB8IGNvcWRvd24pKlwiLFxuXHRcdFx0YXR0cnM6IHtcblx0XHRcdFx0cHJlV2hpdGU6e2RlZmF1bHQ6XCJuZXdMaW5lXCJ9LFxuXHRcdFx0XHRwb3N0V2hpdGU6e2RlZmF1bHQ6XCJuZXdMaW5lXCJ9XG5cdFx0XHR9LFxuXHRcdFx0dG9ET006ICgpID0+IHtcblx0XHRcdFx0cmV0dXJuIFtcImNvcWRvY1wiLCAwXTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0Y29xZG93bjoge1xuXHRcdFx0Y29udGVudDogXCJ0ZXh0KlwiLFxuXHRcdFx0YmxvY2s6IHRydWUsXG5cdFx0XHRhdG9tOiB0cnVlLFxuXHRcdFx0dG9ET006ICgpID0+IHtcblx0XHRcdFx0cmV0dXJuIFtcImNvcWRvd25cIiwgMF07XG5cdFx0XHR9LFxuXHRcdH0sXG5cblx0XHRjb3Fjb2RlOiB7XG5cdFx0XHRjb250ZW50OiBcInRleHQqXCIsLy8gY29udGVudCBpcyBvZiB0eXBlIHRleHRcblx0XHRcdGNvZGU6IHRydWUsXG5cdFx0XHRhdG9tOiB0cnVlLCAvLyBkb2Vzbid0IGhhdmUgZGlyZWN0bHkgZWRpdGFibGUgY29udGVudCAoY29udGVudCBpcyBlZGl0ZWQgdGhyb3VnaCBjb2RlbWlycm9yKVxuXHRcdFx0dG9ET00obm9kZSkgeyByZXR1cm4gW1wiV2F0ZXJwcm9vZkNvZGVcIiwgbm9kZS5hdHRycywgMF0gfSAvLyA8Y29xY29kZT48L2NvcWNvZGU+IGNlbGxzXG5cdFx0fSxcblx0XHQvLyNlbmRyZWdpb25cblxuXHRcdC8vLy8vLy8gTUFUSCBESVNQTEFZIC8vLy8vL1xuXHRcdC8vI3JlZ2lvbiBtYXRoLWRpc3BsYXlcblx0XHRtYXRoX2Rpc3BsYXk6IHtcblx0XHRcdGdyb3VwOiBcIm1hdGhcIixcblx0XHRcdGNvbnRlbnQ6IFwidGV4dCpcIixcblx0XHRcdGF0b206IHRydWUsXG5cdFx0XHRjb2RlOiB0cnVlLFxuXHRcdFx0dG9ET00obm9kZSkgeyByZXR1cm4gW1wibWF0aC1kaXNwbGF5XCIsIHsuLi57IGNsYXNzOiBcIm1hdGgtbm9kZVwiIH0sIC4uLm5vZGUuYXR0cnN9LCAwXTsgfSxcblx0XHR9LFxuXHRcdC8vI2VuZHJlZ2lvblxuXHR9LFxuXHQvLyBtYXJrczoge1xuXHQvLyBcdGVtOiB7XG5cdC8vIFx0ICB0b0RPTSgpIHsgcmV0dXJuIFtcImVtXCJdIH1cblx0Ly8gXHR9LFxuXG5cdC8vIFx0c3Ryb25nOiB7XG5cdC8vIFx0ICB0b0RPTSgpIHsgcmV0dXJuIFtcInN0cm9uZ1wiXSB9XG5cdC8vIFx0fSxcblxuXHQvLyBcdGxpbms6IHtcblx0Ly8gXHQgIGF0dHJzOiB7XG5cdC8vIFx0XHRocmVmOiB7fSxcblx0Ly8gXHRcdHRpdGxlOiB7ZGVmYXVsdDogbnVsbH1cblx0Ly8gXHQgIH0sXG5cdC8vIFx0ICBpbmNsdXNpdmU6IGZhbHNlLFxuXHQvLyBcdCAgdG9ET00obm9kZSkgeyByZXR1cm4gW1wiYVwiLCBub2RlLmF0dHJzXSB9XG5cdC8vIFx0fSxcblxuXHQvLyBcdGNvZGU6IHtcblx0Ly8gXHQgIHRvRE9NKCkgeyByZXR1cm4gW1wiY29kZVwiXSB9XG5cdC8vIFx0fVxuXHQvLyB9XG59KTsiLCAiXG5pbXBvcnQgeyBXYXRlcnByb29mU2NoZW1hIH0gZnJvbSBcIi4uLy4uL3NjaGVtYS9zY2hlbWFcIjtcbmltcG9ydCB7IE5vZGUgYXMgUHJvc2VOb2RlIH0gZnJvbSBcInByb3NlbWlycm9yLW1vZGVsXCI7XG5cbi8vICMjIyMjIEJhc2ljIGJsb2NrcyAjIyMjI1xuXG4vKiogQ29uc3RydWN0IGJhc2ljIHByb3NlbWlycm9yIHRleHQgbm9kZS4gKi9cbmV4cG9ydCBjb25zdCB0ZXh0ID0gKGNvbnRlbnQ6IHN0cmluZyk6IFByb3NlTm9kZSA9PiB7XG4gICAgcmV0dXJuIFdhdGVycHJvb2ZTY2hlbWEudGV4dChjb250ZW50KTtcbn1cblxuLyoqIENvbnN0cnVjdCBjb3EgbWFya2Rvd24gcHJvc2VtaXJyb3Igbm9kZS4gKi9cbmV4cG9ydCBjb25zdCBjb3FNYXJrZG93biA9IChjb250ZW50OiBzdHJpbmcpOiBQcm9zZU5vZGUgPT4ge1xuICAgIHJldHVybiBXYXRlcnByb29mU2NoZW1hLm5vZGVzLmNvcWRvd24uY3JlYXRlKHt9LCB0ZXh0KGNvbnRlbnQpKTtcbn1cblxuLyoqIENvbnN0cnVjdCBtYXRoIGRpc3BsYXkgcHJvc2VtaXJyb3Igbm9kZS4gKi9cbmV4cG9ydCBjb25zdCBtYXRoRGlzcGxheSA9IChjb250ZW50OiBzdHJpbmcpOiBQcm9zZU5vZGUgPT4ge1xuICAgIHJldHVybiBXYXRlcnByb29mU2NoZW1hLm5vZGVzLm1hdGhfZGlzcGxheS5jcmVhdGUoe30sIHRleHQoY29udGVudCkpO1xufVxuXG4vKiogQ29uc3RydWN0IG1hcmtkb3duIHByb3NlbWlycm9yIG5vZGUuICovXG5leHBvcnQgY29uc3QgbWFya2Rvd24gPSAoY29udGVudDogc3RyaW5nKTogUHJvc2VOb2RlID0+IHtcbiAgICByZXR1cm4gV2F0ZXJwcm9vZlNjaGVtYS5ub2Rlcy5tYXJrZG93bi5jcmVhdGUoe30sIHRleHQoY29udGVudCkpO1xufVxuXG4vKiogQ29uc3RydWN0IGNvcWNvZGUgcHJvc2VtaXJyb3Igbm9kZS4gKi9cbmV4cG9ydCBjb25zdCBjb3FDb2RlID0gKGNvbnRlbnQ6IHN0cmluZyk6IFByb3NlTm9kZSA9PiB7XG4gICAgcmV0dXJuIFdhdGVycHJvb2ZTY2hlbWEubm9kZXMuY29xY29kZS5jcmVhdGUoe30sIHRleHQoY29udGVudCkpO1xufVxuXG4vLyAjIyMjIyBXaXRoIGlubmVyIGJsb2NrcyAjIyMjI1xuXG4vKiogQ29uc3RydWN0IGlucHV0IGFyZWEgcHJvc2VtaXJyb3Igbm9kZS4gKi9cbmV4cG9ydCBjb25zdCBpbnB1dEFyZWEgPSAoY2hpbGROb2RlczogUHJvc2VOb2RlW10pOiBQcm9zZU5vZGUgPT4ge1xuICAgIHJldHVybiBXYXRlcnByb29mU2NoZW1hLm5vZGVzLmlucHV0LmNyZWF0ZSh7fSwgY2hpbGROb2Rlcyk7XG59XG5cbi8qKiBDb25zdHJ1Y3QgaGludCBwcm9zZW1pcnJvciBub2RlLiAqL1xuZXhwb3J0IGNvbnN0IGhpbnQgPSAodGl0bGU6IHN0cmluZywgY2hpbGROb2RlczogUHJvc2VOb2RlW10pOiBQcm9zZU5vZGUgPT4ge1xuICAgIHJldHVybiBXYXRlcnByb29mU2NoZW1hLm5vZGVzLmhpbnQuY3JlYXRlKHt0aXRsZX0sIGNoaWxkTm9kZXMpO1xufVxuXG4vKiogQ29uc3RydWN0IGNvcSBwcm9zZW1pcnJvciBub2RlLiAqL1xuZXhwb3J0IGNvbnN0IGNvcWJsb2NrID0gKGNoaWxkTm9kZXM6IFByb3NlTm9kZVtdLCBwcmVQcmVXaGl0ZTogc3RyaW5nLCBwcmVQb3N0V2hpdGU6IHN0cmluZywgcG9zdFByZVdoaXRlOiBzdHJpbmcsIHBvc3RQb3N0V2hpdGU6IHN0cmluZyk6IFByb3NlTm9kZSA9PiB7XG4gICAgcmV0dXJuIFdhdGVycHJvb2ZTY2hlbWEubm9kZXMuY29xYmxvY2suY3JlYXRlKHtwcmVQcmVXaGl0ZSwgcHJlUG9zdFdoaXRlLCBwb3N0UHJlV2hpdGUsIHBvc3RQb3N0V2hpdGV9LCBjaGlsZE5vZGVzKTtcbn1cblxuLyoqIENvbnN0cnVjdCBjb3Fkb2MgcHJvc2VtaXJyb3Igbm9kZS4gKi9cbmV4cG9ydCBjb25zdCBjb3FEb2MgPSAoY2hpbGROb2RlczogUHJvc2VOb2RlW10sIHByZVdoaXRlOiBzdHJpbmcsIHBvc3RXaGl0ZTogc3RyaW5nKTogUHJvc2VOb2RlID0+IHtcbiAgICByZXR1cm4gV2F0ZXJwcm9vZlNjaGVtYS5ub2Rlcy5jb3Fkb2MuY3JlYXRlKHtwcmVXaGl0ZSwgcG9zdFdoaXRlfSwgY2hpbGROb2Rlcyk7XG59XG5cbi8vICMjIyMjIFJvb3QgTm9kZSAjIyMjI1xuZXhwb3J0IGNvbnN0IHJvb3QgPSAoY2hpbGROb2RlczogUHJvc2VOb2RlW10pOiBQcm9zZU5vZGUgPT4ge1xuICAgIHJldHVybiBXYXRlcnByb29mU2NoZW1hLm5vZGVzLmRvYy5jcmVhdGUoe30sIGNoaWxkTm9kZXMpO1xufSIsICJpbXBvcnQgeyBCbG9jayB9IGZyb20gXCIuL2Jsb2Nrc1wiO1xuaW1wb3J0IHsgcm9vdCB9IGZyb20gXCIuL2Jsb2Nrcy9zY2hlbWFcIjtcbmltcG9ydCB7IE5vZGUgYXMgUHJvc2VOb2RlIH0gZnJvbSBcInByb3NlbWlycm9yLW1vZGVsXCI7XG5cbi8vIENvbnN0cnVjdCB0aGUgcHJvc2VtaXJyb3IgZG9jdW1lbnQgZnJvbSB0aGUgdG9wIGxldmVsIGJsb2Nrcy5cbmV4cG9ydCBmdW5jdGlvbiBjb25zdHJ1Y3REb2N1bWVudChibG9ja3M6IEJsb2NrW10pOiBQcm9zZU5vZGUge1xuICAgIGNvbnN0IGRvY3VtZW50Q29udGVudDogUHJvc2VOb2RlW10gPSBibG9ja3MubWFwKGJsb2NrID0+IGJsb2NrLnRvUHJvc2VNaXJyb3IoKSk7XG4gICAgcmV0dXJuIHJvb3QoZG9jdW1lbnRDb250ZW50KTtcbn1cbiIsICJpbXBvcnQgeyBXYXRlcnByb29mU2NoZW1hIH0gZnJvbSBcIi4uLy4uL3NjaGVtYVwiO1xuaW1wb3J0IHsgQkxPQ0tfTkFNRSwgQmxvY2ssIEJsb2NrUmFuZ2UgfSBmcm9tIFwiLi9ibG9ja1wiO1xuLy8gaW1wb3J0IHsgY3JlYXRlQ29xRG9jSW5uZXJCbG9ja3MsIGNyZWF0ZUNvcUlubmVyQmxvY2tzLCBjcmVhdGVJbnB1dEFuZEhpbnRJbm5lckJsb2NrcyB9IGZyb20gXCIuL2lubmVyLWJsb2Nrc1wiO1xuaW1wb3J0IHsgY29xQ29kZSwgY29xRG9jLCBjb3FNYXJrZG93biwgY29xYmxvY2ssIGhpbnQsIGlucHV0QXJlYSwgbWFya2Rvd24sIG1hdGhEaXNwbGF5IH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbmNvbnN0IGluZGVudGF0aW9uID0gKGxldmVsOiBudW1iZXIpOiBzdHJpbmcgPT4gXCIgIFwiLnJlcGVhdChsZXZlbCk7XG5jb25zdCBkZWJ1Z0luZm8gPSAoYmxvY2s6IEJsb2NrKTogc3RyaW5nID0+IGB7cmFuZ2U9JHtibG9jay5yYW5nZS5mcm9tfS0ke2Jsb2NrLnJhbmdlLnRvfX1gO1xuXG5leHBvcnQgY2xhc3MgSW5wdXRBcmVhQmxvY2sgaW1wbGVtZW50cyBCbG9jayB7XG4gICAgcHVibGljIHR5cGUgPSBCTE9DS19OQU1FLklOUFVUX0FSRUE7XG4gICAgcHVibGljIGlubmVyQmxvY2tzOiBCbG9ja1tdO1xuXG4gICAgY29uc3RydWN0b3IoIHB1YmxpYyBzdHJpbmdDb250ZW50OiBzdHJpbmcsIHB1YmxpYyByYW5nZTogQmxvY2tSYW5nZSwgaW5uZXJCbG9ja0NvbnN0cnVjdG9yOiAoY29udGVudDogc3RyaW5nKSA9PiBCbG9ja1tdICkge1xuICAgICAgICB0aGlzLmlubmVyQmxvY2tzID0gaW5uZXJCbG9ja0NvbnN0cnVjdG9yKHN0cmluZ0NvbnRlbnQpO1xuICAgIH07XG5cbiAgICB0b1Byb3NlTWlycm9yKCkge1xuICAgICAgICBjb25zdCBjaGlsZE5vZGVzID0gdGhpcy5pbm5lckJsb2Nrcy5tYXAoYmxvY2sgPT4gYmxvY2sudG9Qcm9zZU1pcnJvcigpKTtcbiAgICAgICAgcmV0dXJuIGlucHV0QXJlYShjaGlsZE5vZGVzKTtcbiAgICB9XG5cbiAgICAvLyBEZWJ1ZyBwcmludCBmdW5jdGlvbi4gLy8gRklYTUU6IE1heWJlIHJlbW92ZT9cbiAgICBkZWJ1Z1ByaW50KGxldmVsOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5sb2coYCR7aW5kZW50YXRpb24obGV2ZWwpfUlucHV0QXJlYUJsb2NrIHske2RlYnVnSW5mbyh0aGlzKX19IFtgKTtcbiAgICAgICAgdGhpcy5pbm5lckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IGJsb2NrLmRlYnVnUHJpbnQobGV2ZWwgKyAxKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAke2luZGVudGF0aW9uKGxldmVsKX1dYCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgSGludEJsb2NrIGltcGxlbWVudHMgQmxvY2sge1xuICAgIHB1YmxpYyB0eXBlID0gQkxPQ0tfTkFNRS5ISU5UO1xuICAgIHB1YmxpYyBpbm5lckJsb2NrczogQmxvY2tbXTtcblxuICAgIC8vIE5vdGU6IEhpbnQgYmxvY2tzIGhhdmUgYSB0aXRsZSBhdHRyaWJ1dGUuXG4gICAgY29uc3RydWN0b3IoIHB1YmxpYyBzdHJpbmdDb250ZW50OiBzdHJpbmcsIHB1YmxpYyB0aXRsZTogc3RyaW5nLCBwdWJsaWMgcmFuZ2U6IEJsb2NrUmFuZ2UsIGlubmVyQmxvY2tDb25zdHJ1Y3RvcjogKGNvbnRlbnQ6IHN0cmluZykgPT4gQmxvY2tbXSApIHtcbiAgICAgICAgdGhpcy5pbm5lckJsb2NrcyA9IGlubmVyQmxvY2tDb25zdHJ1Y3RvcihzdHJpbmdDb250ZW50KTtcbiAgICB9O1xuXG4gICAgdG9Qcm9zZU1pcnJvcigpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBjb25zdHJ1Y3QgYSBoaW50IG5vZGUgd2l0aCBhIHRpdGxlIGFuZCBpbm5lciBibG9ja3MuXG4gICAgICAgIGNvbnN0IGNoaWxkTm9kZXMgPSB0aGlzLmlubmVyQmxvY2tzLm1hcChibG9jayA9PiBibG9jay50b1Byb3NlTWlycm9yKCkpO1xuICAgICAgICByZXR1cm4gaGludCh0aGlzLnRpdGxlLCBjaGlsZE5vZGVzKTtcbiAgICB9XG5cbiAgICAvLyBEZWJ1ZyBwcmludCBmdW5jdGlvbi5cbiAgICBkZWJ1Z1ByaW50KGxldmVsOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5sb2coYCR7aW5kZW50YXRpb24obGV2ZWwpfUhpbnRCbG9jayB7JHtkZWJ1Z0luZm8odGhpcyl9fSB7dGl0bGU9XCIke3RoaXMudGl0bGV9XCJ9IFtgKTtcbiAgICAgICAgdGhpcy5pbm5lckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IGJsb2NrLmRlYnVnUHJpbnQobGV2ZWwgKyAxKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAke2luZGVudGF0aW9uKGxldmVsKX1dYCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTWF0aERpc3BsYXlCbG9jayBpbXBsZW1lbnRzIEJsb2NrIHtcbiAgICBwdWJsaWMgdHlwZSA9IEJMT0NLX05BTUUuTUFUSF9ESVNQTEFZO1xuICAgIGNvbnN0cnVjdG9yKCBwdWJsaWMgc3RyaW5nQ29udGVudDogc3RyaW5nLCBwdWJsaWMgcmFuZ2U6IEJsb2NrUmFuZ2UgKSB7fTtcblxuICAgIHRvUHJvc2VNaXJyb3IoKSB7XG4gICAgICAgIHJldHVybiBtYXRoRGlzcGxheSh0aGlzLnN0cmluZ0NvbnRlbnQpO1xuICAgIH1cblxuICAgIC8vIERlYnVnIHByaW50IGZ1bmN0aW9uLlxuICAgIGRlYnVnUHJpbnQobGV2ZWw6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZyhgJHtpbmRlbnRhdGlvbihsZXZlbCl9TWF0aERpc3BsYXlCbG9jayB7JHtkZWJ1Z0luZm8odGhpcyl9fTogeyR7dGhpcy5zdHJpbmdDb250ZW50LnJlcGxhY2VBbGwoXCJcXG5cIiwgXCJcXFxcblwiKX19YCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29xQmxvY2sgaW1wbGVtZW50cyBCbG9jayB7XG4gICAgcHVibGljIHR5cGUgPSBCTE9DS19OQU1FLkNPUTtcbiAgICBwdWJsaWMgaW5uZXJCbG9ja3M6IEJsb2NrW107XG5cbiAgICBjb25zdHJ1Y3RvciggcHVibGljIHN0cmluZ0NvbnRlbnQ6IHN0cmluZywgcHVibGljIHByZVByZVdoaXRlOiBzdHJpbmcsIHB1YmxpYyBwcmVQb3N0V2hpdGU6IHN0cmluZywgcHVibGljIHBvc3RQcmVXaGl0ZTogc3RyaW5nLCBwdWJsaWMgcG9zdFBvc3RXaGl0ZSA6IHN0cmluZywgcHVibGljIHJhbmdlOiBCbG9ja1JhbmdlLCBpbm5lckJsb2NrQ29uc3RydWN0b3I6IChjb250ZW50OiBzdHJpbmcpID0+IEJsb2NrW10gKSB7XG4gICAgICAgIHRoaXMuaW5uZXJCbG9ja3MgPSBpbm5lckJsb2NrQ29uc3RydWN0b3Ioc3RyaW5nQ29udGVudCk7XG4gICAgfTtcblxuICAgIHRvUHJvc2VNaXJyb3IoKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkTm9kZXMgPSB0aGlzLmlubmVyQmxvY2tzLm1hcChibG9jayA9PiBibG9jay50b1Byb3NlTWlycm9yKCkpO1xuICAgICAgICByZXR1cm4gY29xYmxvY2soXG4gICAgICAgICAgICBjaGlsZE5vZGVzLFxuICAgICAgICAgICAgdGhpcy5wcmVQcmVXaGl0ZSxcbiAgICAgICAgICAgIHRoaXMucHJlUG9zdFdoaXRlLFxuICAgICAgICAgICAgdGhpcy5wb3N0UHJlV2hpdGUsXG4gICAgICAgICAgICB0aGlzLnBvc3RQb3N0V2hpdGVcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBEZWJ1ZyBwcmludCBmdW5jdGlvbi5cbiAgICBkZWJ1Z1ByaW50KGxldmVsOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5sb2coYCR7aW5kZW50YXRpb24obGV2ZWwpfUNvcUJsb2NrIHske2RlYnVnSW5mbyh0aGlzKX19IFtgKTtcbiAgICAgICAgdGhpcy5pbm5lckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IGJsb2NrLmRlYnVnUHJpbnQobGV2ZWwgKyAxKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAke2luZGVudGF0aW9uKGxldmVsKX1dYCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTWFya2Rvd25CbG9jayBpbXBsZW1lbnRzIEJsb2NrIHtcbiAgICBwdWJsaWMgdHlwZSA9IEJMT0NLX05BTUUuTUFSS0RPV047XG4gICAgcHVibGljIGlzTmV3TGluZU9ubHkgPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKCBwdWJsaWMgc3RyaW5nQ29udGVudDogc3RyaW5nLCBwdWJsaWMgcmFuZ2U6IEJsb2NrUmFuZ2UgKSB7XG4gICAgICAgIGlmIChzdHJpbmdDb250ZW50ID09PSBcIlxcblwiKSB0aGlzLmlzTmV3TGluZU9ubHkgPSB0cnVlO1xuICAgIH07XG5cbiAgICB0b1Byb3NlTWlycm9yKCkge1xuICAgICAgICByZXR1cm4gbWFya2Rvd24odGhpcy5zdHJpbmdDb250ZW50KTtcbiAgICB9XG5cbiAgICAvLyBEZWJ1ZyBwcmludCBmdW5jdGlvbi5cbiAgICBkZWJ1Z1ByaW50KGxldmVsOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5sb2coYCR7aW5kZW50YXRpb24obGV2ZWwpfU1hcmtkb3duQmxvY2sgeyR7ZGVidWdJbmZvKHRoaXMpfX06IHske3RoaXMuc3RyaW5nQ29udGVudC5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiXFxcXG5cIil9fWApO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvcURvY0Jsb2NrIGltcGxlbWVudHMgQmxvY2sge1xuICAgIHB1YmxpYyB0eXBlID0gQkxPQ0tfTkFNRS5DT1FfRE9DO1xuICAgIHB1YmxpYyBpbm5lckJsb2NrczogQmxvY2tbXTtcblxuICAgIGNvbnN0cnVjdG9yKCBwdWJsaWMgc3RyaW5nQ29udGVudDogc3RyaW5nLCBwdWJsaWMgcHJlV2hpdGU6IHN0cmluZywgcHVibGljIHBvc3RXaGl0ZTogc3RyaW5nLCBwdWJsaWMgcmFuZ2U6IEJsb2NrUmFuZ2UsIGlubmVyQmxvY2tDb25zdHJ1Y3RvcjogKGNvbnRlbnQ6IHN0cmluZykgPT4gQmxvY2tbXSApIHtcbiAgICAgICAgdGhpcy5pbm5lckJsb2NrcyA9IGlubmVyQmxvY2tDb25zdHJ1Y3RvcihzdHJpbmdDb250ZW50KTtcbiAgICB9O1xuXG4gICAgdG9Qcm9zZU1pcnJvcigpIHtcbiAgICAgICAgY29uc3QgY2hpbGROb2RlcyA9IHRoaXMuaW5uZXJCbG9ja3MubWFwKGJsb2NrID0+IGJsb2NrLnRvUHJvc2VNaXJyb3IoKSk7XG4gICAgICAgIHJldHVybiBjb3FEb2MoY2hpbGROb2RlcywgdGhpcy5wcmVXaGl0ZSwgdGhpcy5wb3N0V2hpdGUpO1xuICAgIH1cblxuICAgIC8vIERlYnVnIHByaW50IGZ1bmN0aW9uLlxuICAgIGRlYnVnUHJpbnQobGV2ZWw6IG51bWJlciA9IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coYCR7aW5kZW50YXRpb24obGV2ZWwpfUNvcURvY0Jsb2NrIHske2RlYnVnSW5mbyh0aGlzKX19IFtgKTtcbiAgICAgICAgdGhpcy5pbm5lckJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IGJsb2NrLmRlYnVnUHJpbnQobGV2ZWwgKyAxKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGAke2luZGVudGF0aW9uKGxldmVsKX1dYCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29xTWFya2Rvd25CbG9jayBpbXBsZW1lbnRzIEJsb2NrIHtcbiAgICBwdWJsaWMgdHlwZSA9IEJMT0NLX05BTUUuQ09RX01BUktET1dOO1xuXG4gICAgY29uc3RydWN0b3IoIHB1YmxpYyBzdHJpbmdDb250ZW50OiBzdHJpbmcsIHB1YmxpYyByYW5nZTogQmxvY2tSYW5nZSApIHt9O1xuXG4gICAgdG9Qcm9zZU1pcnJvcigpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBkbyBzb21lIHByZXByb2Nlc3Npbmcgb24gdGhlIHN0cmluZyBjb250ZW50LCBzaW5jZSBjb3EgbWFya2Rvd24gdXNlcyAlIGZvciBpbmxpbmUgbWF0aC5cbiAgICAgICAgcmV0dXJuIGNvcU1hcmtkb3duKHRoaXMuc3RyaW5nQ29udGVudCk7XG4gICAgfVxuXG4gICAgLy8gRGVidWcgcHJpbnQgZnVuY3Rpb24uXG4gICAgZGVidWdQcmludChsZXZlbDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUubG9nKGAke2luZGVudGF0aW9uKGxldmVsKX1Db3FNYXJrZG93bkJsb2NrIHske2RlYnVnSW5mbyh0aGlzKX19OiB7JHt0aGlzLnN0cmluZ0NvbnRlbnQucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcXFxuXCIpfX1gKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb3FDb2RlQmxvY2sgaW1wbGVtZW50cyBCbG9jayB7XG4gICAgcHVibGljIHR5cGUgPSBCTE9DS19OQU1FLkNPUV9DT0RFO1xuXG4gICAgY29uc3RydWN0b3IoIHB1YmxpYyBzdHJpbmdDb250ZW50OiBzdHJpbmcsIHB1YmxpYyByYW5nZTogQmxvY2tSYW5nZSApIHt9O1xuXG4gICAgdG9Qcm9zZU1pcnJvcigpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RyaW5nQ29udGVudCA9PT0gXCJcIikge1xuICAgICAgICAgICAgLy8gSWYgdGhlIHN0cmluZyBjb250ZW50IGlzIGVtcHR5LCB3ZSBjcmVhdGUgYW4gZW1wdHkgY29xY29kZSBub2RlLlxuICAgICAgICAgICAgcmV0dXJuIFdhdGVycHJvb2ZTY2hlbWEubm9kZXMuY29xY29kZS5jcmVhdGUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29xQ29kZSh0aGlzLnN0cmluZ0NvbnRlbnQpO1xuICAgIH1cblxuICAgIC8vIERlYnVnIHByaW50IGZ1bmN0aW9uLlxuICAgIGRlYnVnUHJpbnQobGV2ZWw6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZyhgJHtpbmRlbnRhdGlvbihsZXZlbCl9Q29xQ29kZUJsb2NrIHske2RlYnVnSW5mbyh0aGlzKX19OiB7JHt0aGlzLnN0cmluZ0NvbnRlbnQucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcXFxuXCIpfX1gKTtcbiAgICB9XG59IiwgImltcG9ydCB7IEJMT0NLX05BTUUsIEJsb2NrIH0gZnJvbSBcIi4vYmxvY2tcIjtcbmltcG9ydCB7IENvcUJsb2NrLCBDb3FDb2RlQmxvY2ssIENvcURvY0Jsb2NrLCBDb3FNYXJrZG93bkJsb2NrLCBIaW50QmxvY2ssIElucHV0QXJlYUJsb2NrLCBNYXJrZG93bkJsb2NrLCBNYXRoRGlzcGxheUJsb2NrIH0gZnJvbSBcIi4vYmxvY2t0eXBlc1wiO1xuXG5leHBvcnQgY29uc3QgaXNJbnB1dEFyZWFCbG9jayA9IChibG9jazogQmxvY2spOiBibG9jayBpcyBJbnB1dEFyZWFCbG9jayA9PiBibG9jay50eXBlID09PSBCTE9DS19OQU1FLklOUFVUX0FSRUE7XG5leHBvcnQgY29uc3QgaXNIaW50QmxvY2sgPSAoYmxvY2s6IEJsb2NrKTogYmxvY2sgaXMgSGludEJsb2NrID0+IGJsb2NrLnR5cGUgPT09IEJMT0NLX05BTUUuSElOVDtcbmV4cG9ydCBjb25zdCBpc01hdGhEaXNwbGF5QmxvY2sgPSAoYmxvY2s6IEJsb2NrKTogYmxvY2sgaXMgTWF0aERpc3BsYXlCbG9jayA9PiBibG9jay50eXBlID09PSBCTE9DS19OQU1FLk1BVEhfRElTUExBWTtcbmV4cG9ydCBjb25zdCBpc0NvcUJsb2NrID0gKGJsb2NrOiBCbG9jayk6IGJsb2NrIGlzIENvcUJsb2NrID0+IGJsb2NrLnR5cGUgPT09IEJMT0NLX05BTUUuQ09RO1xuZXhwb3J0IGNvbnN0IGlzTWFya2Rvd25CbG9jayA9IChibG9jazogQmxvY2spOiBibG9jayBpcyBNYXJrZG93bkJsb2NrID0+IGJsb2NrLnR5cGUgPT09IEJMT0NLX05BTUUuTUFSS0RPV047XG5leHBvcnQgY29uc3QgaXNDb3FNYXJrZG93bkJsb2NrID0gKGJsb2NrOiBCbG9jayk6IGJsb2NrIGlzIENvcU1hcmtkb3duQmxvY2sgPT4gYmxvY2sudHlwZSA9PT0gQkxPQ0tfTkFNRS5DT1FfTUFSS0RPV047XG5leHBvcnQgY29uc3QgaXNDb3FEb2NCbG9jayA9IChibG9jazogQmxvY2spOiBibG9jayBpcyBDb3FEb2NCbG9jayA9PiBibG9jay50eXBlID09PSBCTE9DS19OQU1FLkNPUV9ET0M7XG5leHBvcnQgY29uc3QgaXNDb3FDb2RlQmxvY2sgPSAoYmxvY2s6IEJsb2NrKTogYmxvY2sgaXMgQ29xQ29kZUJsb2NrID0+IGJsb2NrLnR5cGUgPT09IEJMT0NLX05BTUUuQ09RX0NPREU7IiwgImltcG9ydCB7IEJsb2NrLCBCbG9ja1JhbmdlIH0gZnJvbSBcIi4vYmxvY2tzXCI7XG5cbi8qKlxuICogQ29udmVydCBhIGxpc3Qgb2YgYmxvY2tzIHRvIGEgcHJvc2VtaXJyb3IgY29tcGF0aWJsZSBub2RlIGxpc3QuXG4gKiBAcGFyYW0gYmxvY2tzIElucHV0IGFycmF5IG9mIGJsb2Nrcy5cbiAqIEByZXR1cm5zIFByb3NlTWlycm9yIG5vZGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvY2tzVG9Qcm9zZU1pcnJvck5vZGVzKGJsb2NrczogQmxvY2tbXSkge1xuICAgIHJldHVybiBibG9ja3MubWFwKChibG9jaykgPT4gYmxvY2sudG9Qcm9zZU1pcnJvcigpKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gc29ydCBibG9jayB0eXBlIG9iamVjdHMuIFdpbGwgc29ydCBiYXNlZCBvbiB0aGUgcmFuZ2Ugb2JqZWN0IG9mIHRoZSBibG9jay5cbiAqIFNvcnRzIGluIGFzY2VuZGluZyAoYHJhbmdlLmZyb21gKSBvcmRlci5cbiAqIEBwYXJhbSBibG9ja3MgQmxvY2tzIHRvIHNvcnQuXG4gKiBAcmV0dXJucyBTb3J0ZWQgYXJyYXkgb2YgYmxvY2tzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc29ydEJsb2NrcyhibG9ja3M6IEJsb2NrW10pIHtcbiAgICByZXR1cm4gYmxvY2tzLnNvcnQoKGEsIGIpID0+IGEucmFuZ2UuZnJvbSAtIGIucmFuZ2UuZnJvbSk7XG59XG5cbi8qKlxuICogTWFwIGBmYCBvdmVyIGV2ZXJ5IGNvbnNlY3V0aXZlIHBhaXIgZnJvbSB0aGUgYGlucHV0YCBhcnJheS5cbiAqIEBwYXJhbSBpbnB1dCBJbnB1dCBhcnJheS5cbiAqIEBwYXJhbSBmIEZ1bmN0aW9uIHRvIG1hcCBvdmVyIHRoZSBwYWlycy5cbiAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2YgbWFwcGluZyBgZmAgb3ZlciBldmVyeSBjb25zZWN1dGl2ZSBwYWlyLiBXaWxsIHJldHVybiBhbiBlbXB0eSBhcnJheSBpZiB0aGUgaW5wdXQgYXJyYXkgaGFzIGxlbmd0aCA8IDIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpdGVyYXRlUGFpcnM8QXJyYXlUeXBlLCBGdW5jdGlvblJldHVyblR5cGU+KGlucHV0OiBBcnJheTxBcnJheVR5cGU+LCBmOiAoYTogQXJyYXlUeXBlLCBiOiBBcnJheVR5cGUpID0+IEZ1bmN0aW9uUmV0dXJuVHlwZSkge1xuICAgIHJldHVybiBpbnB1dC5zbGljZSgwLCAtMSkubWFwKChhLCBpKSA9PiBmKGEsIGlucHV0W2kgKyAxXSkpO1xufVxuXG5cbi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbiB0byBleHRyYWN0IHRoZSByYW5nZXMgYmV0d2VlbiBibG9ja3MgKGllLiB0aGUgcmFuZ2VzIHRoYXQgYXJlIG5vdCBjb3ZlcmVkIGJ5IHRoZSBibG9ja3MpLlxuICogQHBhcmFtIGJsb2NrcyBUaGUgaW5wdXQgYXJyYXkgb2YgYmxvY2suXG4gKiBAcGFyYW0gaW5wdXREb2N1bWVudCBUaGUgZG9jdW1lbnQgdGhlIGJsb2NrcyBhcmUgcGFydCBvZi5cbiAqIEByZXR1cm5zIFRoZSByYW5nZXMgYmV0d2VlbiB0aGUgYmxvY2tzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEludGVyQmxvY2tSYW5nZXMoYmxvY2tzOiBBcnJheTxCbG9jaz4sIGlucHV0RG9jdW1lbnQ6IHN0cmluZyk6IEJsb2NrUmFuZ2VbXSB7XG4gICAgbGV0IHJhbmdlcyA9ICBpdGVyYXRlUGFpcnMoYmxvY2tzLCAoYmxvY2tBLCBibG9ja0IpID0+IHtcbiAgICAgICAgcmV0dXJuIHsgZnJvbTogYmxvY2tBLnJhbmdlLnRvLCB0bzogYmxvY2tCLnJhbmdlLmZyb20gfTtcbiAgICB9KTtcblxuICAgIC8vIEFkZCBmaXJzdCByYW5nZSBpZiBpdCBleGlzdHNcbiAgICBpZiAoYmxvY2tzLmxlbmd0aCA+IDAgJiYgYmxvY2tzWzBdLnJhbmdlLmZyb20gPiAwKSByYW5nZXMgPSBbe2Zyb206IDAsIHRvOiBibG9ja3NbMF0ucmFuZ2UuZnJvbX0sIC4uLnJhbmdlc107XG4gICAgLy8gQWRkIGxhc3QgcmFuZ2UgaWYgaXQgZXhpc3RzXG4gICAgaWYgKGJsb2Nrcy5sZW5ndGggPiAwICYmIGJsb2Nrc1tibG9ja3MubGVuZ3RoIC0gMV0ucmFuZ2UudG8gPCBpbnB1dERvY3VtZW50Lmxlbmd0aCkgcmFuZ2VzID0gWy4uLnJhbmdlcywge2Zyb206IGJsb2Nrc1tibG9ja3MubGVuZ3RoIC0gMV0ucmFuZ2UudG8sIHRvOiBpbnB1dERvY3VtZW50Lmxlbmd0aH1dO1xuXG4gICAgLy8gSWYgdGhlcmUgYXJlIG5vIGJsb2NrcyBmb3VuZCB0aGVuIHdlIGFkZCB0aGUgcmVzdCBhcyBhIHJhbmdlLlxuICAgIGlmIChibG9ja3MubGVuZ3RoID09PSAwICYmIGlucHV0RG9jdW1lbnQubGVuZ3RoID4gMCkgcmFuZ2VzID0gW3tmcm9tOiAwLCB0bzogaW5wdXREb2N1bWVudC5sZW5ndGh9XTtcblxuICAgIHJldHVybiByYW5nZXM7XG59XG5cbi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbiB0byBtYXNrIHJlZ2lvbnMgb2YgYSBkb2N1bWVudCBjb3ZlcmVkIGJ5IGJsb2Nrcy5cbiAqIEBwYXJhbSBpbnB1dERvY3VtZW50IFRoZSBpbnB1dCBkb2N1bWVudCBvbiB3aGljaCB0byBhcHBseSB0aGUgbWFza2luZy5cbiAqIEBwYXJhbSBibG9ja3MgVGhlIGJsb2NrcyB0aGF0IHdpbGwgbWFzayBjb250ZW50IGZyb20gdGhlIGlucHV0IGRvY3VtZW50LlxuICogQHBhcmFtIG1hc2sgVGhlIG1hc2sgdG8gdXNlIChkZWZhdWx0cyB0byBgXCIgXCJgKS5cbiAqIEByZXR1cm5zIFRoZSBkb2N1bWVudCAoYHN0cmluZ2ApIHdpdGggdGhlIHJhbmdlcyBjb3ZlcmVkIGJ5IHRoZSBibG9ja3MgaW4gYGJsb2Nrc2AgbWFza2VkIHVzaW5nIGBtYXNrYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hc2tJbnB1dEFuZEhpbnRzKGlucHV0RG9jdW1lbnQ6IHN0cmluZywgYmxvY2tzOiBCbG9ja1tdLCBtYXNrOiBzdHJpbmcgPSBcIiBcIik6IHN0cmluZyB7XG4gICAgbGV0IG1hc2tlZFN0cmluZyA9IGlucHV0RG9jdW1lbnQ7XG4gICAgZm9yIChjb25zdCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgICAgbWFza2VkU3RyaW5nID0gbWFza2VkU3RyaW5nLnN1YnN0cmluZygwLCBibG9jay5yYW5nZS5mcm9tKSArIG1hc2sucmVwZWF0KGJsb2NrLnJhbmdlLnRvIC0gYmxvY2sucmFuZ2UuZnJvbSkgKyBtYXNrZWRTdHJpbmcuc3Vic3RyaW5nKGJsb2NrLnJhbmdlLnRvKTtcbiAgICB9XG4gICAgcmV0dXJuIG1hc2tlZFN0cmluZztcbn1cblxuLyoqXG4gKiBDcmVhdGUgYmxvY2tzIGJhc2VkIG9uIHJhbmdlcy5cbiAqXG4gKiBFeHRyYWN0cyB0aGUgdGV4dCBjb250ZW50IG9mIHRoZSByYW5nZXMgYW5kIGNyZWF0ZXMgYmxvY2tzIGZyb20gdGhlbS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RCbG9ja3NVc2luZ1JhbmdlczxCbG9ja1R5cGUgZXh0ZW5kcyBCbG9jaz4oXG4gICAgaW5wdXREb2N1bWVudDogc3RyaW5nLFxuICAgIHJhbmdlczoge2Zyb206IG51bWJlciwgdG86IG51bWJlcn1bXSxcbiAgICBCbG9ja0NvbnN0cnVjdG9yOiBuZXcgKGNvbnRlbnQ6IHN0cmluZywgcmFuZ2U6IHsgZnJvbTogbnVtYmVyLCB0bzogbnVtYmVyIH0pID0+IEJsb2NrVHlwZSApOiBCbG9ja1R5cGVbXVxue1xuICAgIGNvbnN0IGJsb2NrcyA9IHJhbmdlcy5tYXAoKHJhbmdlKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBpbnB1dERvY3VtZW50LnNsaWNlKHJhbmdlLmZyb20sIHJhbmdlLnRvKTtcbiAgICAgICAgcmV0dXJuIG5ldyBCbG9ja0NvbnN0cnVjdG9yKGNvbnRlbnQsIHJhbmdlKTtcbiAgICB9KS5maWx0ZXIoYmxvY2sgPT4ge1xuICAgICAgICByZXR1cm4gYmxvY2sucmFuZ2UuZnJvbSAhPT0gYmxvY2sucmFuZ2UudG87XG4gICAgfSk7XG4gICAgcmV0dXJuIGJsb2Nrcztcbn0iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7O0FBRUEsU0FBUyxXQUFXLFNBQVM7QUFDM0IsT0FBSyxVQUFVO0FBQ2pCO0FBRUEsV0FBVyxZQUFZO0FBQUEsRUFDckIsYUFBYTtBQUFBLEVBRWIsTUFBTSxTQUFTLEtBQUs7QUFDbEIsYUFBUyxJQUFJLEdBQUcsSUFBSSxLQUFLLFFBQVEsUUFBUSxLQUFLO0FBQzVDLFVBQUksS0FBSyxRQUFRLENBQUMsTUFBTTtBQUFLLGVBQU87QUFDdEMsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLEtB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TyxTQUFTLEtBQUssT0FBTyxPQUFPLFNBQVMsQ0FBQyxFQUFFLE1BQU0sS0FBSyxjQUFjO0FBQVEsYUFBUyxDQUFDLEdBQUcsUUFBUSxFQUFDLE1BQU0sT0FBTyxPQUFPLFNBQVMsQ0FBQyxFQUFFLE1BQU0sSUFBSSxJQUFJLGNBQWMsT0FBTSxDQUFDO0FBRzdLLE1BQUksT0FBTyxXQUFXLEtBQUssY0FBYyxTQUFTO0FBQUcsYUFBUyxDQUFDLEVBQUMsTUFBTSxHQUFHLElBQUksY0FBYyxPQUFNLENBQUM7QUFFbEcsU0FBTztBQUNYO0FBU08sU0FBUyxrQkFBa0IsZUFBdUIsUUFBaUIsT0FBZSxLQUFhO0FBQ2xHLE1BQUksZUFBZTtBQUNuQixhQUFXLFNBQVMsUUFBUTtBQUN4QixtQkFBZSxhQUFhLFVBQVUsR0FBRyxNQUFNLE1BQU0sSUFBSSxJQUFJLEtBQUssT0FBTyxNQUFNLE1BQU0sS0FBSyxNQUFNLE1BQU0sSUFBSSxJQUFJLGFBQWEsVUFBVSxNQUFNLE1BQU0sRUFBRTtBQUFBLEVBQ3ZKO0FBQ0EsU0FBTztBQUNYO0FBT08sU0FBUyx5QkFDWixlQUNBLFFBQ0Esa0JBQ0o7QUFDSSxRQUFNLFNBQVMsT0FBTyxJQUFJLENBQUMsVUFBVTtBQUNqQyxVQUFNLFVBQVUsY0FBYyxNQUFNLE1BQU0sTUFBTSxNQUFNLEVBQUU7QUFDeEQsV0FBTyxJQUFJLGlCQUFpQixTQUFTLEtBQUs7QUFBQSxFQUM5QyxDQUFDLEVBQUUsT0FBTyxXQUFTO0FBQ2YsV0FBTyxNQUFNLE1BQU0sU0FBUyxNQUFNLE1BQU07QUFBQSxFQUM1QyxDQUFDO0FBQ0QsU0FBTztBQUNYOyIsCiAgIm5hbWVzIjogWyJmb3VuZCIsICJ0ZXh0IiwgImZvdW5kIiwgImkiLCAidHlwZSIsICJuZmEiLCAiZWRnZSIsICJleHByIiwgIm5vZGUiLCAic3RhdGVzIiwgIm5hbWUiLCAibWFyayJdCn0K
