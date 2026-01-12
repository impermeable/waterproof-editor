import { mathPlugin, mathSerializer } from "@benrbray/prosemirror-math";
import { selectParentNode } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Node as ProseNode } from "prosemirror-model";
import { EditorState, NodeSelection, Plugin, Selection, TextSelection, Transaction } from "prosemirror-state";
import { ReplaceAroundStep, ReplaceStep, Step } from "prosemirror-transform";
import { EditorView } from "prosemirror-view";
import { undo, redo, history } from "prosemirror-history";
import { constructDocument } from "./document/construct-document";

import { DocChange, InputAreaStatus, SimpleProgressParams, WrappingDocChange, HistoryChange, Severity, OffsetDiagnostic, MappingError, NodeUpdateError, TextUpdateError, DocumentSerializer, Positioned, ServerStatus, ThemeStyle, WaterproofEditorConfig } from "./api";
import { CODE_PLUGIN_KEY, codePlugin } from "./codeview";
import { createHintPlugin } from "./hinting";
import { INPUT_AREA_PLUGIN_KEY, inputAreaPlugin } from "./inputArea";
import { WaterproofSchema } from "./schema";
import { SWITCHABLE_VIEW_PLUGIN_KEY, switchableViewPlugin } from "./markup-views";
import { menuPlugin } from "./menubar";
import { MENU_PLUGIN_KEY } from "./menubar/menubar";
import { PROGRESS_PLUGIN_KEY, progressBarPlugin } from "./progressBar";
import { DOCUMENT_PROGRESS_DECORATOR_KEY, documentProgressDecoratorPlugin } from "./documentProgressDecorator";
import { createContextMenuHTML } from "./context-menu";
import { DefaultTagSerializer } from "./serialization/DocumentSerializer";

// CSS imports
import "katex/dist/katex.min.css";
import "prosemirror-view/style/prosemirror.css";
import "./styles";
import { UPDATE_STATUS_PLUGIN_KEY, updateStatusPlugin } from "./qedStatus";
import { CodeBlockView } from "./codeview/nodeview";
import { OS } from "./osType";
import { Completion } from "@codemirror/autocomplete";
import { getCmdInsertCode, getCmdInsertLatex, getCmdInsertMarkdown } from "./commands/insert-command";
import { InsertionPlace } from "./commands";
import { deleteSelection } from "./commands/commands";
import { Mapping } from "./mapping";

/** Type that contains a coq diagnostics object fit for use in the ProseMirror editor context. */
export type DiagnosticObjectProse = {message: string, start: number, end: number, severity: Severity};

/**
 * WaterproofEditor class. Configured via the WaterproofEditorConfig object.
 */
export class WaterproofEditor {

	private readonly _editorConfig: WaterproofEditorConfig;

	// The editor and content html elements.
	private readonly _editorElem: HTMLElement;

	// The prosemirror view
	private _view: EditorView | undefined;

	// The file document mapping
	private _mapping: Mapping | undefined;

	// User operating system.
	private readonly _userOS;

	private currentProseDiagnostics: Array<DiagnosticObjectProse>;
	
	public get diagnosticsVersion() {
		return this.diagnosticsUpdateCounter;
	}
	private diagnosticsUpdateCounter = 0;

	private _lineNumbersShown: boolean = false;

	private readonly _serializer: DocumentSerializer;

	/**
	 * Create a new WaterproofEditor instance.
	 * @param editorElement The HTML element where the editor will be inserted in the document
	 * @param config The configuration of the editor to use.
	 */
	constructor (editorElement: HTMLElement, config: WaterproofEditorConfig, private readonly initialThemeStyle: ThemeStyle) {
		this._editorElem = editorElement;
		this.currentProseDiagnostics = [];
		this._editorConfig = config;
		this._serializer = config.serializer ?? new DefaultTagSerializer(config.tagConfiguration);

		const userAgent = window.navigator.userAgent;
		this._userOS = OS.Unknown;
		if (userAgent.includes("Win")) this._userOS = OS.Windows;
		if (userAgent.includes("Mac")) this._userOS = OS.MacOS;
		if (userAgent.includes("X11")) this._userOS = OS.Unix;
		if (userAgent.includes("Linux")) this._userOS = OS.Linux;

		const theContextMenu = createContextMenuHTML(this);


		document.body.appendChild(theContextMenu);

		// Setup the custom context menu
		document.addEventListener("click", (_ev) => {
			// Handle a 'left mouse click'
			// console.log("LMB");
			theContextMenu.style.display = "none";
		});

		document.addEventListener("contextmenu", (ev) => {
			// Handle a 'right mouse click'
			// We call preventDefault to prevent the default context menu from showing
			ev.preventDefault();
			// After this we display our own context menu
			const x: string = `${ev.pageX}px`;
			const y: string = `${ev.pageY}px`;
			theContextMenu.style.position = "absolute";
			theContextMenu.style.left = x;
			theContextMenu.style.top = y;
			theContextMenu.style.display = "block";
		})
	}

	init(content: string, version: number = 1) {
		// Initialize the file translator given the fileformat.
		if(this._view) {
			if (this._mapping && this._mapping.version == version) return;
			// Hack to forcefully remove the 'old' menubar
			document.querySelector(".menubar")?.remove();
			document.querySelector(".progress-bar")?.remove();
			document.querySelector(".spinner-container")?.remove();
			this._view.dom.remove();
		}

		const blocks = this._editorConfig.documentConstructor(content);
		const proseDoc = constructDocument(blocks);

		this._mapping = new Mapping(blocks, version, this._editorConfig.tagConfiguration, this._serializer);
		this.createProseMirrorEditor(proseDoc);

		/** Ask for line numbers */
		this.updateLineNumbers();
		this.handleScroll(window.innerHeight);

		// notify host that the editor is ready
		console.log("Editor ready, notifying extension");
		this._editorConfig.api.editorReady();
	}

	get state(): EditorState | undefined {
		return this._view?.state;
	}

	createProseMirrorEditor(proseDoc: ProseNode) {
		// Shadow this variable _userOS.
		const userOS = this._userOS;
		const view = new EditorView(this._editorElem, {
			state: this.createState(proseDoc),
			clipboardTextSerializer: (slice) => { return mathSerializer.serializeSlice(slice) },
			dispatchTransaction: ((tr) => {
				// Called on every transaction.

				let step : Step | undefined = undefined;
				for (step of tr.steps) {
					if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
						if (this._mapping === undefined) throw new Error(" Mapping is undefined, cannot synchronize with vscode");
						try {
							const change: DocChange | WrappingDocChange = this._mapping.update(step, view.state.doc); // Get text document update
							this._editorConfig.api.documentChange(change);
						} catch (error: unknown) {
							const err = error as MappingError | TextUpdateError | NodeUpdateError;
							console.error("Error while applying step to mapping, the edit will **not** be applied!");
							console.error("The step: ", step);
							console.error("The error message:", err.message);
							console.error("Error originated in:", err.constructor.name);


							// Send message to VSCode that an error has occured
							this._editorConfig.api.applyStepError(err.message);

							return;
						}

					}
				}

				const lineDelta = tr.getMeta("lineDelta");
				if (lineDelta !== undefined && tr.steps.length === 1 && tr.steps[0] instanceof ReplaceStep) {
					this._mapping?.updateLines(lineDelta, tr.steps[0].from);
				}

				// Only update the state when we know that the transaction did not cause an error
				view.updateState(view.state.apply(tr));

				if (tr.selectionSet && tr.selection instanceof TextSelection) {
					this.updateCursor(tr.selection);
				} else if (tr.getMeta(SWITCHABLE_VIEW_PLUGIN_KEY)) {
					// Set the cursor position from a markdown cell
					this.updateCursor(tr.getMeta(SWITCHABLE_VIEW_PLUGIN_KEY));
				}

				if (step !== undefined) this.updateLineNumbers();
			}),
			handleKeyDown(view, e) {
				// Stop certain events from propagating
				if ((userOS == OS.Windows && e.ctrlKey) ||
					(userOS == OS.MacOS && e.metaKey)) {
					if (["q", "m", "Enter", "Space", ".", "l", "Q", "M", "L"].includes(e.key)) {
						// Fixes ctrl-q on Windows and cmd-q on MacOs opening weird ctrl-q thingie.
						// when the user wants to make text bold.
						e.stopImmediatePropagation();
					}
				}
				// Prevent any key presses other than backspaces from registering when selecting node
				if (view.state.selection instanceof NodeSelection) {
					e.preventDefault();
				}
			},
			
			handleDOMEvents: {
				// This function will handle some DOM events before ProseMirror does.
				// 	We use it here to cancel the 'drag' and 'drop' events, since these can
				//  break the editor.
				"dragstart": (view, event) => {
					event.preventDefault();
				},
				"drop": (view, event) => {
					event.preventDefault();
				},
				"mousedown": (view, event) => {
					event.preventDefault();
				}
			}
		});
		this._view = view;

		// The DEBUG label will be dropped in case we are *not* in debug mode.
		// eslint-disable-next-line no-unused-labels
		DEBUG: {
			console.log("\x1b[33m[DEBUG]\x1b[0m Debug mode enabled. We will attach pm-dev-tools");
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const devTools = require("prosemirror-dev-tools");
			devTools.applyDevTools(view);
		}
	}

	/** Create initial prosemirror state */
	createState(proseDoc: ProseNode): EditorState {
		return EditorState.create({
			schema: WaterproofSchema,
			doc: proseDoc,
			plugins: this.createPluginsArray()
		});
	}

	/** Create the array of plugins used by the prosemirror editor */
	createPluginsArray(): Plugin[] {
		return [
			history(),
			createHintPlugin(),
			inputAreaPlugin,
			updateStatusPlugin(this),
			mathPlugin,
			switchableViewPlugin(this._editorConfig),
			codePlugin(this._editorConfig.completions, this._editorConfig.symbols, this, this.initialThemeStyle),
			progressBarPlugin,
			documentProgressDecoratorPlugin,
			menuPlugin(this._userOS, this._editorConfig.tagConfiguration),
			keymap({
				"Mod-h": () => {
					this.executeCommand("Help.");
					return true;
				},
				"Backspace": deleteSelection(this._editorConfig.tagConfiguration),
				"Delete": deleteSelection(this._editorConfig.tagConfiguration),
				"Mod-m": getCmdInsertMarkdown(InsertionPlace.Below, this._editorConfig.tagConfiguration),
				"Mod-M": getCmdInsertMarkdown(InsertionPlace.Above, this._editorConfig.tagConfiguration),
				"Mod-q": getCmdInsertCode(InsertionPlace.Below, this._editorConfig.tagConfiguration),
				"Mod-Q": getCmdInsertCode(InsertionPlace.Above, this._editorConfig.tagConfiguration),
				"Mod-l": getCmdInsertLatex(InsertionPlace.Below, this._editorConfig.tagConfiguration),
				"Mod-L": getCmdInsertLatex(InsertionPlace.Above, this._editorConfig.tagConfiguration),
				// We bind Ctrl/Cmd+. to selecting the parent node of the currently selected node.
				"Mod-.": selectParentNode
			})
		];
	}

	/**
	 * Serialize the current document to a string.
	 * @returns Either the serialized document or `undefined` when the editor is not initialized.
	 */
	public serializeDocument(): string | undefined {
		if (!this._view) return;
		return this._serializer.serializeDocument(this._view.state.doc);
	}

	public updateNodeViewThemes(theme: ThemeStyle, lang: string) {
		const view = this._view!;
		const state = view.state;

		// Get all nodeViews
		const nodeViews = CODE_PLUGIN_KEY.getState(state)?.activeNodeViews;

		for (const nodeView of nodeViews ?? []) {
			// Update the theme of the nodeView
			nodeView.updateThemeFromVSCode(theme, lang);
		}
	}

	/**
	 * Handle a snippet that should be inserted into the editor.
	 * @param template The template string of the snippet that should be inserted.
	 */
	public handleSnippet(template: string) {
		const view = this._view!;
		// Get the first selection.
		const from = view.state.selection.from;

		// We need to figure out to which codemirror cell this insertion belongs.

		const state = view.state;

		const nodeViews = CODE_PLUGIN_KEY.getState(state)?.activeNodeViews;
		if (!nodeViews) return;
		const positionedNodeViews: Array<Positioned<CodeBlockView>> = Array.from(nodeViews).map((codeblock) => {
			return {
				obj: codeblock,
				pos: codeblock._getPos()
			}
		});

		let theView: CodeBlockView | undefined = undefined;
		let pos = view.state.doc.content.size;
		for (const nodeView of positionedNodeViews) {
			if (nodeView.pos === undefined) continue;
			if (from - nodeView.pos < pos && nodeView.pos < from) {
				pos = from - nodeView.pos;
				theView = nodeView.obj;
			}
		}
		if (!theView) return;
		const insertionPosFrom 	= state.selection.$from.parentOffset;
		const insertionPosTo 	= state.selection.$to.parentOffset;
		theView.handleSnippet(template, insertionPosFrom, insertionPosTo);
	}

	/** Called on every selection update. */
	public updateCursor(pos: Selection) : void {
		// If this is not a cursor update return
		if (!(pos instanceof TextSelection)) return;
		if (this._mapping === undefined) throw new Error(" Mapping is undefined, cannot synchronize with vscode");
		this._editorConfig.api.cursorChange(this._mapping.pmIndexToTextOffset(pos.$head.pos));
	}

	/** Called on every transaction update in which the textdocument was modified */
	private updateLineNumbers() {
		if (!this._view || !this._mapping) return;
		const nrs = this._mapping.computeLineNumbers();
		console.log(nrs);
		const tr = this._view.state.tr.setMeta(CODE_PLUGIN_KEY, nrs);
		this._view.dispatch(tr);
		this.updateDocumentProgress();
	}

	private updateDocumentProgress() {
		// Use getState with the CODE_PLUGIN_KEY to obtain linenumbers
		if (!this._view) return;
		const lineNumbers = CODE_PLUGIN_KEY.getState(this._view.state)?.lines;
		// Use getState with the CODE_PLUGIN_KEY to obtain progress activeNodeViews
		const activeNodeViews = CODE_PLUGIN_KEY.getState(this._view.state)?.activeNodeViews;
		// Use getState with the PROGRESS_PLUGIN_KEY to obtain progress status
		const progressParams = PROGRESS_PLUGIN_KEY.getState(this._view.state)?.progressParams;
		if (progressParams === undefined || lineNumbers === undefined || activeNodeViews === undefined) return;
		// Compute currentLine from progressParams
		if (progressParams.progress.length == 0) return;
		const currentLine = progressParams?.progress[0].range.start.line + 1;
		const endLine = progressParams?.progress[0].range.end.line + 1;
	
		if (currentLine == endLine) {
			// Done checking, remove bar
			const tr = this._view.state.tr.setMeta(DOCUMENT_PROGRESS_DECORATOR_KEY, 
				{progressHeightLow: 0, progressHeightHigh: 0, total: 0});
			this._view.dispatch(tr);
			return;
		}

		// Compute current nodeView using lineNumbers and activeNodeViews
		let currentNodeView = undefined;
		let viewLineNumber = undefined;
		let nextLineNumber = undefined;
		let nextNodeView = undefined;
		
		let i = 0;
		for (const nodeView of activeNodeViews) {
			if (currentNodeView != undefined) {
				nextNodeView = nodeView;
				break;
			}
			if (currentLine >= lineNumbers[i] && currentLine < lineNumbers[i + 1]) {
				currentNodeView = nodeView; 
				viewLineNumber = lineNumbers[i];
				nextLineNumber = lineNumbers[i + 1];
			}
			i++;
		}
		if (currentNodeView === undefined || viewLineNumber === undefined || nextLineNumber === undefined) return;
		let startPos = currentNodeView._getPos();
		let nextPos = nextNodeView?._getPos();
		if (startPos === undefined || nextPos === undefined) return;
		const startDocCoords = this._view.coordsAtPos(0);
		let startCoords = this._view.coordsAtPos(startPos, -1);
		// If we don't find a good position, this is likely a hidden codeblock
		// Go back until we find a position in the document or the top
		while (startCoords == null || startCoords.top == 0) {
			startPos--;
			if (startPos < 0) break;
			startCoords = this._view.coordsAtPos(startPos, -1);
		}

		// If we don't find a good position, this is likely a hidden codeblock
		// Go forward until we find a position in the document or the bottom
		let nextCoords = this._view.coordsAtPos(nextPos);
		while (nextCoords == null || nextCoords.top == 0) {
			nextPos++;
			if (nextPos >= this._view.state.doc.content.size) break;
			nextCoords = this._view.coordsAtPos(nextPos);
		}
		const endDocCoords = this._view.coordsAtPos(this._view.state.doc.content.size);
		const height = startCoords.top - startDocCoords.top;

		// Communicate the total size of the document, the low estimate where processing is happening
		// and the high estimate, unit is pixels for each
		const tr = this._view.state.tr.setMeta(DOCUMENT_PROGRESS_DECORATOR_KEY, {
			total: endDocCoords.top - startDocCoords.top, progressHeightLow: height, progressHeightHigh: nextCoords.top - startDocCoords.top});
		this._view.dispatch(tr);
	}

	/**
	 * Updates the dynamic autocomplete suggestions shown in the editor.
	 * @param completions Array of completions.
	 */
	public handleCompletions(completions: Array<Completion>) {
		const state = this._view?.state;
		if (!state) return;
		// Apply autocomplete to all coq cells
		CODE_PLUGIN_KEY
			.getState(state)
			?.activeNodeViews
			?.forEach(codeBlock => codeBlock.handleNewComplete(completions));
	}

	/**
	 * Execute a history change (undo/redo) in the editor.
	 * @param type Type of the change
	 */
	public handleHistoryChange(type: HistoryChange) {
		const view = this._view;
		if (!view) return;
		const func = type === HistoryChange.Undo ? undo : redo;
		func(view.state, view.dispatch, view);
	}

		public handleScroll(innerHeight: number) {
		if (!this._view) return;
		const posTop = this._view.posAtCoords({left: 10, top: 80}) ?? {pos : 0, inside : -1};
		const posBottom = this._view.posAtCoords({left: 10, top: innerHeight}) ?? {pos : this._view.state.doc.content.size, inside : -1};

		if (posBottom == null || posTop == null) {
			console.log("Invalid positions, skipping viewport hint.", posTop, posBottom)
			return;
		}
		
		// Get the offset before/after the node to overestimate the viewport
		const pmOffsetStart = this._view.state.doc.resolve(posTop.pos).start()
		const pmOffsetEnd = this._view.state.doc.resolve(posBottom.pos).end()

		// Translate postions to line/offset
		let offsetStart;
		try {
			offsetStart = this._mapping?.pmIndexToTextOffset(pmOffsetStart);
		} catch {
			offsetStart = pmOffsetStart;
		}
		let offsetEnd;
		try {
			offsetEnd = this._mapping?.pmIndexToTextOffset(pmOffsetEnd);
		} catch {
			offsetEnd = pmOffsetEnd;
		}

		if (offsetStart == null || offsetEnd == null) {
			console.log("Invalid offsets, skipping viewport hint.")
			return;
		}

		this._editorConfig.api.viewportHint(offsetStart, offsetEnd);

	}

	/**
	 * Insert a symbol at the cursor position (replaces the current selection if there is one).
	 *
	 * @param symbolUnicode The unicode character to insert.
	 * @returns Whether the operation was a success.
	 */
	public insertSymbol(symbolUnicode: string): boolean {
		// If there is no view at the moment this is a no-op.
		if (!this._view) return false;
		let state = this._view.state;
		let from = state.selection.from;
		let to = state.selection.to;
		if (SWITCHABLE_VIEW_PLUGIN_KEY.getState(state)?.cursor) {
			// @ts-expect-error TODO: Fix me
			from = REAL_MARKDOWN_PLUGIN_KEY.getState(state)?.cursor?.from;
			// @ts-expect-error TODO: Fix me
			to = REAL_MARKDOWN_PLUGIN_KEY.getState(state)?.cursor?.to;
		}
		state = this._view.state;
		const trans = state.tr;

		/* TODO: The check that makes sure we are allowed to insert is pretty much the
			same as in `inputArea.ts` and could maybe be improved. */

		const inputAreaPluginState = INPUT_AREA_PLUGIN_KEY.getState(state);

		// Early return if the plugin state is undefined.
		if (inputAreaPluginState === undefined) return false;
		const { teacher } = inputAreaPluginState;

		// If we are in teacher mode (ie. not locked) than
		// 	 we are always able to insert.
		if (teacher) {
			this.createAndDispatchInsertionTransaction(trans, symbolUnicode, from, to);
			return true;
		}

		const { $from } = state.selection;


		let isEditable = false;
		state.doc.nodesBetween($from.pos, $from.pos, (node) => {
			if (node.type === WaterproofSchema.nodes.input) {
				isEditable = true;
			}
		});

		if (!isEditable) return false;

		this.createAndDispatchInsertionTransaction(trans, symbolUnicode, from, to);

		return true;
	}

	/**
	 * Toggles line numbers for all codeblocks.
	 * @param show The editor will show line numbers in the code cells when set to `true`.
	 */
	public setShowLineNumbers(show: boolean) {
		this._lineNumbersShown = show;
		const view = this._view;
		if (view === undefined) return;
		const tr = view.state.tr;
		tr.setMeta(CODE_PLUGIN_KEY, {setting: "update", show: this._lineNumbersShown});
		view.dispatch(tr);
		this.updateLineNumbers();
	}

	/**
	 * Toggles showing menu items in the editor for students.
	 * @param show The editor will show menu items to students when set to `true`.
	 */
	public setShowMenuItems(show: boolean) {
		const view = this._view;
		if (view === undefined) return;
		const tr = view.state.tr;
		tr.setMeta(MENU_PLUGIN_KEY, show);
		view.dispatch(tr);
	}

	private createAndDispatchInsertionTransaction(
		trans: Transaction, textToInsert: string, from: number, to: number) {

		trans = trans.insertText(textToInsert, from, to);
		this._view?.dispatch(trans);
	}

	/**
	 * Called whenever a message describing the configuration of user is sent
	 *
	 * @param isTeacher Whether teacher mode is enabled
	 */
	public updateLockingState(isTeacher: boolean) : void {
		if (!this._view) return;
		const state = this._view.state;
		const trans = state.tr;
		trans.setMeta(INPUT_AREA_PLUGIN_KEY, {teacher: isTeacher});
		this._view.dispatch(trans);
	}
    
	/**
	 * Updates the state of the progress bar in the editor.
	 * 
	 * @param progressParams The type used to store information on the status of the checking of the current file
	 */
	public updateProgressBar(progressParams: SimpleProgressParams): void {
		if (!this._view) return;
		const state = this._view.state;
		const tr = state.tr;
		tr.setMeta(PROGRESS_PLUGIN_KEY, {progressParams});
		this._view.dispatch(tr);
		this.updateDocumentProgress();
	}

	public updateServerStatus(status: ServerStatus) : void {
		if (!this._view) return;
		const state = this._view.state;
		const tr = state.tr;
		tr.setMeta(PROGRESS_PLUGIN_KEY, {serverStatus: status});
		this._view.dispatch(tr);
	}

	/**
	 * Updates the status of the input areas in the editor.
	 * 
	 * @param status Array containing the status of the input areas within the current document, where `status[i]` corresponds to the i-th input area (starting at zero for the first input area). 
	 */
	public updateQedStatus(status: InputAreaStatus[]) : void {
		if (!this._view) return;
		const state = this._view.state;
		const tr = state.tr;
		tr.setMeta(UPDATE_STATUS_PLUGIN_KEY, status);
		this._view.dispatch(tr);
	}

	/**
	 * Pushes the diagnostics to the array of diagnostics stored in the editor.
	 *
	 * In comparison to {@linkcode setActiveDiagnostics} this will keep the old
	 * diagnostics around.
	 *
	 * @param diagnostics The diagnostics to add.
	 */
	public pushDiagnostics(...diagnostics: Array<OffsetDiagnostic>) {
		const map = this._mapping;
		if (map === undefined || this._view === undefined) return;

		// Map the positions
		const newDiags = diagnostics.map(d => {
			const start = map.textOffsetToPmIndex(d.startOffset);
			const end = map.textOffsetToPmIndex(d.endOffset);

			return {
				message: d.message,
				severity: d.severity,
				start,
				end
			}
		});
		// Add the new diagnostics to the array of stored diagnostics
		this.currentProseDiagnostics.push(...newDiags);
		// diagnostics have changed
		this.diagnosticsUpdateCounter++;
		this.informCodemirrorViews();
	}

	/**
	 * Removes the diagnostic `toRemove` from the set of stored diagnostics.
	 * 
	 * Note that if `toRemove` occurs more than once, all instances will be removed!
	 * @param toRemove The diagnostic object to remove
	 * @returns Whether any instance of `toRemove` was removed from the set of diagnostics.
	 */
	public removeDiagnostic(toRemove: OffsetDiagnostic): boolean {
		const map = this._mapping;
		if (map === undefined) return false;

		const start = map.textOffsetToPmIndex(toRemove.startOffset);
		const end = map.textOffsetToPmIndex(toRemove.endOffset);

		const proseDiag: DiagnosticObjectProse = {
			start, end,
			message: toRemove.message,
			severity: toRemove.severity
		}

		const oldLength = this.currentProseDiagnostics.length;
		this.currentProseDiagnostics = this.currentProseDiagnostics.filter(d =>
			d.start != proseDiag.start && d.end != proseDiag.end && d.message != proseDiag.message && d.severity != proseDiag.severity
		);
		const newLength = this.currentProseDiagnostics.length;
		// diagnostics have changed
		this.diagnosticsUpdateCounter++;
		this.informCodemirrorViews();
		return oldLength > newLength;
	}

	/**
	 * Sets the current set of diagnostics in the document.
	 * This function takes the set of all diagnostics in the current document,
	 * translates the position to ProseMirror offsets and stores them.
	 *
	 * Note: Calling this function overwrites the set of diagnostics.
	 * If you want to add a diagnostic use {@linkcode pushDiagnostics}
	 * 
	 * @param msg The set of diagnostics for the current document. 
	 */
	public setActiveDiagnostics(diagnostics: Array<OffsetDiagnostic>) {
		// The diagnostics are positioned in offset based positions.
		// We map the positions through the mapping to get prosemirror positions.
		const map = this._mapping;
		if (map === undefined) return;

		this.currentProseDiagnostics = new Array<DiagnosticObjectProse>(diagnostics.length);
		for (let i = 0; i < diagnostics.length; i++) {
			const diag = diagnostics[i];
			const start = map.textOffsetToPmIndex(diag.startOffset);
			const end = map.textOffsetToPmIndex(diag.endOffset);
			if (start >= end) continue;
			this.currentProseDiagnostics[i] = {
				message: diag.message,
				start,
				end,
				severity: diag.severity
			};
		}
		// diagnostics have changed
		this.diagnosticsUpdateCounter++;
		this.informCodemirrorViews();
	}

	private informCodemirrorViews() {
		if (this._view === undefined) return;
        // Get the available coq views
		const views = CODE_PLUGIN_KEY.getState(this._view.state)?.activeNodeViews;
		if (views === undefined) return;
		for (const view of views) view.dispatchEmpty();
	}


	/**
	 * Returns the set of stored diagnostics in the range low to high.
	 * @param low Lower bound for the diagnostic range.
	 * @param high Upper bound for the diagnostic range.
	 * @param truncationLevel If desired, only include diagnostics with a severity level below the `truncationLevel`.
	 * @returns The set of diagnostics in the range low to high.
	 */
	public getDiagnosticsInRange(low: number, high: number, truncationLevel: number = 5): Array<DiagnosticObjectProse> {
		return this.currentProseDiagnostics.filter((value) => {
			return ((low <= value.start) && (value.end <= high) && (value.severity) <= truncationLevel);
		});
	}

	/**
	 * Returns the set of diagnostics for which the intersection of the diagnostic range and the range [low, high]
	 * is non-empty. The ranges of these diagnostics will be trimmed such that they are fully contained in [low, high].
	 * @param truncationLevel If desired, only include diagnostics with a severity level below the `truncationLevel`.
	 * @returns The set of diagnostics which are (at least partially) contained in the range low to high.
	 */
	public getPartialDiagnosticsInRange(low: number, high: number, truncationLevel: number = 5): Array<DiagnosticObjectProse> {
		return this.currentProseDiagnostics.filter((value) => {
			// Keep when there is overlap with the low to high range
			return (value.start <= high && value.end >= low && value.severity <= truncationLevel);
		}).map(d => {
			return {
				message: d.message,
				start: Math.max(d.start, low),
				end: Math.min(d.end, high),
				severity: d.severity
			}
		});
	}

	// Editor API
	public executeCommand(command: string) {
		this._editorConfig.api.executeCommand(command, (new Date()).getTime());
	}

	public executeHelp() {
		this._editorConfig.api.executeHelp();
	}
}