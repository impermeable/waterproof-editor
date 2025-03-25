import { Schema } from "prosemirror-model";
import { Command } from "prosemirror-state";
import { InsertionPlace } from "./types";
import { FileFormat } from "../api";
/**
 * Creates a command that creates a new code cell above/underneath the currently selected node.
 * @param schema The schema to use
 * @param filef The format of the currently opened file.
 * @param insertionPlace The place to insert the new node into: Underneath or Above the current node.
 * @returns The `Command`.
 */
export declare function cmdInsertCode(schema: Schema, filef: FileFormat, insertionPlace: InsertionPlace): Command;
/**
 * Creates a command that creates a new markdown cell underneath/above the currently selected node.
 * @param schema The schema to use
 * @param filef The fileformat of the file currently opened.
 * @param insertionPlace The place to insert at: Above or Underneath current node.
 * @returns The `Command`.
 */
export declare function cmdInsertMarkdown(schema: Schema, filef: FileFormat, insertionPlace: InsertionPlace): Command;
/**
 * Returns a command that inserts a new Display Math cell above/underneath the currently selected cell.
 * @param schema The schema in use.
 * @param filef The file format of the current file.
 * @param insertionPlace The place to insert the node at Above or Underneath the current node.
 * @returns The `Command`
 */
export declare function cmdInsertLatex(schema: Schema, filef: FileFormat, insertionPlace: InsertionPlace): Command;
export declare const liftWrapper: Command;
//# sourceMappingURL=commands.d.ts.map