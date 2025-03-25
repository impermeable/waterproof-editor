import { Plugin, PluginKey } from 'prosemirror-state';
import { InputAreaStatus } from './api';
import { WaterproofEditor } from './editor';
export interface IUpdateStatusPluginState {
    status: InputAreaStatus[];
}
export declare const UPDATE_STATUS_PLUGIN_KEY: PluginKey<IUpdateStatusPluginState>;
export declare const updateStatusPlugin: (editor: WaterproofEditor) => Plugin<IUpdateStatusPluginState>;
//# sourceMappingURL=qedStatus.d.ts.map