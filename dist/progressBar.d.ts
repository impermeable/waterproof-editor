import { Plugin, PluginKey } from "prosemirror-state";
import { SimpleProgressParams } from "./api";
export interface IProgressPluginState {
    progressParams: SimpleProgressParams;
    resetProgressBar: boolean;
    endLine: number;
    startLine: number;
}
export declare const PROGRESS_PLUGIN_KEY: PluginKey<IProgressPluginState>;
export declare const progressBarPlugin: Plugin<IProgressPluginState>;
//# sourceMappingURL=progressBar.d.ts.map