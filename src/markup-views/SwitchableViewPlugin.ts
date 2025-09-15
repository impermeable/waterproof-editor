/*---------------------------------------------------------
 *  Adapted from https://github.com/benrbray/prosemirror-math/blob/master/src/math-plugin.ts
 *--------------------------------------------------------*/

// prosemirror imports
import { Node as ProseNode } from "prosemirror-model";
import { Plugin as ProsePlugin, PluginKey, PluginSpec, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { SwitchableView } from "./switchable-view";
import { WaterproofEditorConfig } from "../api";
import { toMathInline } from "../translation";

////////////////////////////////////////////////////////////

export interface ISwitchableViewPluginState {
	macros: { [cmd:string] : string };
	/** A list of currently active `NodeView`s, in insertion order. */
	activeNodeViews: SwitchableView[];
	/** The selection of the current cursor position */
	cursor: TextSelection | undefined;
	/** Last cursor position in view, so that it can be displayed */
}

export const SWITCHABLE_VIEW_PLUGIN_KEY = new PluginKey<ISwitchableViewPluginState>("prosemirror-realtime-markdown");

/** 
 * Returns a function suitable for passing as a field in `EditorProps.nodeViews`.
 * @see https://prosemirror.net/docs/ref/#view.EditorProps.nodeViews
 */
export function createRealMarkdownView(editorConfig: WaterproofEditorConfig){
	return (node: ProseNode, view: EditorView, getPos: (() => number | undefined)): SwitchableView => {
		/** @todo is this necessary?
		* Docs says that for any function proprs, the current plugin instance
		* will be bound to `this`.  However, the typings don't reflect this.
		*/
		const pluginState = SWITCHABLE_VIEW_PLUGIN_KEY.getState(view.state);
		if(!pluginState){ throw new Error("no realtime markdown plugin!"); }
		const nodeViews = pluginState.activeNodeViews;

		// set up NodeView
		const nodeView = new SwitchableView(getPos, view, node.textContent, node, SWITCHABLE_VIEW_PLUGIN_KEY, editorConfig.markdownName ?? "markdown", editorConfig.toMarkdown ?? ((input) => toMathInline(input)));

		nodeViews.push(nodeView);
		return nodeView;
	}
}


const RealMarkdownPluginSpec = (editorConfig: WaterproofEditorConfig): PluginSpec<ISwitchableViewPluginState> => { 
	return {
		key: SWITCHABLE_VIEW_PLUGIN_KEY,
		state: {
			init(_config, _instance){
				return {
					cursor: undefined,
					macros: {},
					activeNodeViews: []
				};
			},
			apply(tr, value, _oldState, _newState){
				// produce updated state field for this plugin
				let newCur = value.cursor;
				if(tr.getMeta(SWITCHABLE_VIEW_PLUGIN_KEY)) newCur = tr.getMeta(SWITCHABLE_VIEW_PLUGIN_KEY);
				// If the transaction has a new TextSelection, ensure this cursor is not set so it does not override
				if(tr.selectionSet && tr.selection instanceof TextSelection) newCur = undefined;
				return {
					// these values are left unchanged
					activeNodeViews : value.activeNodeViews,
					macros          : value.macros,
					cursor          : newCur
				}
			}
		},
		props: {
			nodeViews: {
				"markdown" : createRealMarkdownView(editorConfig)
			}
		}
	};
}
export const switchableViewPlugin = (editorConfig: WaterproofEditorConfig) => new ProsePlugin(RealMarkdownPluginSpec(editorConfig));