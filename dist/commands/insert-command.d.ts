import { Command } from "prosemirror-state";
import { FileFormat } from "../api/FileFormat";
import { InsertionFunction, InsertionPlace } from "./types";
import { NodeType } from "prosemirror-model";
/**
 * Return a Markdown insertion command.
 * @param filef The file format of the file in use.
 * @param insertionFunction The function used to insert the node into the editor.
 * @param place Where to insert the node into the editor. Either Above or Underneath the currently selected node.
 * @param mvNodeType The node to use in the case of a `.mv` file.
 * @param vNodeType The node to use in the case of a `.v` file.
 * @returns The insertion command.
 */
export declare function getMdInsertCommand(filef: FileFormat, insertionFunction: InsertionFunction, place: InsertionPlace, mvNodeType: NodeType, vNodeType: NodeType): Command;
/**
 * Returns an insertion command for insertion display latex into the editor.
 * @param filef The file format of the file currently being edited.
 * @param insertionFunction The insertion function to use.
 * @param place The place to insert into, either Above or Underneath the currently selected node.
 * @param latexNodeType The node type for a 'display latex' node.
 * @returns The insertion command.
 */
export declare function getLatexInsertCommand(filef: FileFormat, insertionFunction: InsertionFunction, place: InsertionPlace, latexNodeType: NodeType): Command;
/**
 * Returns an insertion command for inserting a new coq code cell. Will create a new coqblock if necessary.
 * @param filef The file format of the file that is being edited.
 * @param insertionFunction The insertion function to use.
 * @param place The place of insertion, either Above or Underneath the currently selected node.
 * @param coqblockNodeType The node type of a coqblock node (contains coqdoc and coqcode).
 * @param coqcodeNodeType The node type of a coqcode node.
 * @returns The insertion command.
 */
export declare function getCodeInsertCommand(filef: FileFormat, insertionFunction: InsertionFunction, place: InsertionPlace, coqblockNodeType: NodeType, coqcodeNodeType: NodeType): Command;
//# sourceMappingURL=insert-command.d.ts.map