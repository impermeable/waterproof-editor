import { Schema } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { OS } from "../osType";
import { FileFormat } from "../api/FileFormat";
/**
 * Interface describing the state of the menu plugin
 */
interface IMenuPluginState {
    showMenuItems: boolean;
}
/**
 * The menu plugin key.
 */
export declare const MENU_PLUGIN_KEY: PluginKey<IMenuPluginState>;
/**
 * Create a new menu plugin given the schema and file format.
 * @param schema The schema in use for the editor.
 * @param filef The file format of the currently opened file.
 * @returns A prosemirror `Plugin` type containing the menubar.
 */
export declare function menuPlugin(schema: Schema, filef: FileFormat, os: OS): Plugin<{
    showMenuItems: boolean;
}>;
export {};
//# sourceMappingURL=menubar.d.ts.map