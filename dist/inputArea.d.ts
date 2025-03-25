import { Plugin, PluginKey } from "prosemirror-state";
/**
 * Interface describing the state of the input are plugin.
 * Contains fields `locked: boolean` indicating wether non-input areas should be locked (ie. non-teacher mode) and
 * `globalLock: boolean` indicating that we are in a global lockdown state (caused by an unrecoverable error).
 */
export interface IInputAreaPluginState {
    teacher: boolean;
    globalLock: boolean;
}
/** The plugin key for the input area plugin */
export declare const INPUT_AREA_PLUGIN_KEY: PluginKey<IInputAreaPluginState>;
export declare const inputAreaPlugin: Plugin<IInputAreaPluginState>;
//# sourceMappingURL=inputArea.d.ts.map