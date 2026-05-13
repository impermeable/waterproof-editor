import { EditorState, Plugin, PluginKey, PluginSpec, Transaction } from "prosemirror-state";
import { WaterproofSchema } from "./schema";

/**
 * Interface describing the state of the input are plugin.
 * Contains field `teacher: boolean` indicating wether we are in teacher mode 
 * (in teacher mode content outside of input areas should be editable)
 */
export interface IInputAreaPluginState {
	teacher: boolean;
}

/** The plugin key for the input area plugin */
export const INPUT_AREA_PLUGIN_KEY = new PluginKey<IInputAreaPluginState>("prosemirror-locking");

// The plugin spec describing this plugin.
const InputAreaPluginSpec : PluginSpec<IInputAreaPluginState> = {
    // Assign the plugin key.
	key: INPUT_AREA_PLUGIN_KEY,
	state: {
		init(_config, _instance){
            // Initially set the mode to be student (content outside of input areas is locked)
			return {
                teacher: false
			};
		},
		apply(tr : Transaction, value: IInputAreaPluginState, _oldState: 
            EditorState, _newState: EditorState
        ){
			// produce updated state field for this plugin
            const meta = tr.getMeta(INPUT_AREA_PLUGIN_KEY);
            if (meta === undefined || meta.teacher === undefined) {
                return value;
            } else {
                return {
                    teacher: meta.teacher
                };
            }
		}
	},
	props: {
        editable: (state) => {
            // Get locked and globalLock states from the plugin.
            const teacher = INPUT_AREA_PLUGIN_KEY.getState(state)?.teacher ?? false;
            
            // In teacher mode, everything is editable by default.
            if (teacher) return true;

            // Get the from selection component.
            const { $from } = state.selection;

            // Assume non-editable.
            let isEditable = false;

            // Check if the current selection is inside an input area.
            state.doc.nodesBetween($from.pos, $from.pos, (node) => {
                if (node.type === WaterproofSchema.nodes.input) {
                    // If so, this cell is editable.
                    isEditable = true;
                }
            });

            // Return editable state.
            return isEditable;
        }
    }
};

// Export the input area plugin for use in the editor.
export const inputAreaPlugin = new Plugin(InputAreaPluginSpec);