import { Completion, CompletionContext, CompletionResult, CompletionSource, autocompletion, snippet, acceptCompletion, completionStatus, hasNextSnippetField, nextSnippetField, snippetKeymap, prevSnippetField, clearSnippet, moveCompletionSelection, closeCompletion } from "@codemirror/autocomplete";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { coq, coqSyntaxHighlighting } from "./lang-pack"
import { Compartment, EditorState, Extension } from "@codemirror/state"
import {
	EditorView as CodeMirror, Command, keymap as cmKeymap,
	highlightActiveLine,
	lineNumbers, placeholder} from "@codemirror/view"
import { Node, Schema } from "prosemirror-model"
import { EditorView } from "prosemirror-view"
import { customTheme } from "./color-scheme"
import { renderIcon } from "../autocomplete";
import { EmbeddedCodeMirrorEditor } from "../embedded-codemirror";
import { linter, LintSource, Diagnostic, lintGutter } from "@codemirror/lint";
import { INPUT_AREA_PLUGIN_KEY } from "../inputArea";
import { ThemeStyle } from "../api";
import { WaterproofEditor } from "../editor";

/**
 * Export CodeBlockView class that implements the custom codeblock nodeview.
 * Corresponds with the example as can be found here:
 * https://prosemirror.net/examples/codemirror/
 */
export class CodeBlockView extends EmbeddedCodeMirrorEditor {
	dom: HTMLElement;

	private _lineNumberCompartment: Compartment;
	private _lineNumbersExtension: Extension;
	private _dynamicCompletions: Completion[] = [];
	private _readOnlyCompartment: Compartment;
	private _themeCompartment: Compartment;
	private lastUsedDiagnosticsVersion: number = 0;

	constructor(
		node: Node,
		view: EditorView,
		private readonly editorInstance: WaterproofEditor,
		getPos: (() => number | undefined),
		schema: Schema,
		completions: Array<Completion>,
		symbols: Array<Completion>,
		initialThemeStyle: ThemeStyle
	) {
		super(node, view, getPos, schema);
		this._node = node;
		this._outerView = view;
		this._getPos = getPos;
		this._lineNumbersExtension = [];

		this._lineNumberCompartment = new Compartment;
		this._readOnlyCompartment = new Compartment;
		this._themeCompartment = new Compartment;

		const tacticCompletionSource: CompletionSource = function(context: CompletionContext) {
			const completionResult: CompletionResult = {
				from: context.pos,
				options: completions,
				validFor: /[^.]*/
			};

			// Manual triggered completions (using ctrl-space)
			if (context.explicit) {
				return completionResult;
			}

			// Matches bullet sequences
			const bullet = context.matchBefore(/^\s*(?:\*+|\++|-+) /);
			// Matches a curly brace
			const brace = context.matchBefore(/^\s*{ /);
			// Matches the end of a sentence (assuming no periods in the sentence)
			const endOfSentence = context.matchBefore(/\.\s+/);

			// Completions start when the cursor is after a bullet or a focus brace '{'
			if (bullet !== null || brace !== null || endOfSentence !== null) {
				return completionResult;
			}

			const line = context.state.doc.lineAt(context.pos);
			// Matches any amount of whitespace followed by a character followed by characters or whitespace
			// This is used for completions at the start of the line like "\tWe " should be autocompleteable to
			// "\tWe conclude that 0 = 0."
			const before = context.matchBefore(/\s*\w+(\s[\s\w]*)?/);
			// The check line.text === before.text makes sure that there is nothing after the cursor.
			// This prevents the case that we are in the first hole of the snippet
			// "By ([hole 1]) we conclude that [hole 2].[hole 3]", we hit "i" and tab (with the intention of moving to the second hole) 
			// and this autocompletes to "It holds that"
			if (before !== null && line.text === before.text) {
				return {
					from: context.pos - before.text.trimStart().length, // Already typed one or more characters
					options: completions,
					validFor: /[^.]*/
				}
			}
		
			// Not in a valid completion context, return null
			return null;
  		}

		// inline definition of the symbol completion source. (Used for completions of the form `\reals` for ℝ).
		const symbolCompletionSource: CompletionSource = (context: CompletionContext) => {
			const before = context.matchBefore(/\\[^ ]*/);
			// If completion wasn't explicitly started and there
			// is no word before the cursor, don't open completions.
			if (!context.explicit && !before) return null;
			return {
				from: before ? before.from : context.pos,
				options: symbols,
				validFor: /\\[^ ]*/
			};	
		}

		// Shadow this._outerView for use in the next function.
		const outerView = this._outerView;

		// Helper function to create the placeholder content for the codemirror cells.
		const placeholderContent = (): HTMLDivElement => {
			const div = document.createElement("div");
			const pos = getPos();
			if (pos === undefined) {
				div.innerText = "Empty code cell";
				return div;
			}
			const name = outerView.state.doc.resolve(pos).node(1).type.name;
			if (name === "input") {
				// This codemirror cell is part of an input area, we change
				// the placeholder to `(* Type your proof here *)` and apply
				// the appropriate styling.
				div.innerText = "(* Type your proof here *)";
				// The styling of this class is
				// defined in `editor/src/kroqed-editor/styles/input-area.css`.
				div.classList.add("empty-proof-placeholder");
			} else {
				// This codemirror cell is not part of an input area, use the
				// `Empty code cell` placeholder.
				div.innerText = "Empty code cell";
			}

			return div;
		}

		// Makes sure that we only enable the linting gutter for codecells inside of input areas.
		const inInputArea = this.partOfInputArea();
		const optional = inInputArea ? [lintGutter()] : [];

		this._codemirror = new CodeMirror({
			doc: this._node.textContent,
			extensions: [
				// Add the linting extension for showing diagnostics (errors, warnings, etc)
				linter(this.lintingFunction, {
					// This codemirror instance needs to refresh diagnostics when the version of diagnostics stored in the
					// outer editor instance is newer than what this codemirror instance is showing.
					needsRefresh: (() => this.lastUsedDiagnosticsVersion < this.editorInstance.diagnosticsVersion).bind(this),
					autoPanel: inInputArea, // Only enable auto panel when this view is inside of an input area
					tooltipFilter: inInputArea ? (() => { return []; }) : undefined, // Don't show tooltips inside of input-areas
					delay: 500,
				}),
				...optional, 
				this._readOnlyCompartment.of(EditorState.readOnly.of(!this._outerView.editable)),
				this._lineNumberCompartment.of(this._lineNumbersExtension),
				this._themeCompartment.of(coqSyntaxHighlighting(initialThemeStyle)),

				autocompletion({
					override: [
						tacticCompletionSource,
						this.dynamicCompletionSource,
						symbolCompletionSource
					],
					icons: false,
					addToOptions: [renderIcon],
					defaultKeymap: false,
				}),
				// This is the normal keymap
				cmKeymap.of(this.embeddedCodeMirrorKeymap()),
				// This is the keymap that is only ever used when in a snippet
				// We use this to overload the functionality of the tab key
				snippetKeymap.of([
					{ 	key: "Tab",
						run: (target: CodeMirror) => {
							// Check whether a completion is active
							const status = completionStatus(target.state);
							if (status !== null) {
								// if there is an active completion, then accept it
								return acceptCompletion(target);
							} else if (hasNextSnippetField(target.state)) {
								// if there is not, but there is a next field in the snippet
								// move to the next field
								return nextSnippetField(target);
							}
							// Indicate that we have not yet handled this keypress
							return false;
						}
					},
					{
						key: "ArrowUp",
						run: (target) => execCmdIfInCompletionContext(target, moveCompletionSelection(false))
					},
					{
						key: "ArrowDown",
						run: (target) => execCmdIfInCompletionContext(target, moveCompletionSelection(true))
					},
					{
						key: "PageUp",
						run: (target) => execCmdIfInCompletionContext(target, moveCompletionSelection(true, "page"))
					},
					{
						key: "PageDown",
						run: (target) => execCmdIfInCompletionContext(target, moveCompletionSelection(false, "page"))
					},
					{
						key: "Escape",
						run: (target) => execCmdIfInCompletionContext(target, closeCompletion)
					},
					{
						key: "Shift-Tab",
						run: prevSnippetField,
					},
					{
						key: "Escape",
						run: clearSnippet
					}
				]),
				customTheme,
				syntaxHighlighting(defaultHighlightStyle),
				coq(),
                highlightActiveLine(),
				CodeMirror.updateListener.of(update => this.forwardUpdate(update)),
				placeholder(placeholderContent())
			],
			// We override the dispatch field to filter the transactions in the CodeMirror cells.
			// We explicitly **allow** selection changes, so that students can select (and copy) non-input area code.
			dispatch(tr, view) {
				// TODO: deprecated according to reference manual https://codemirror.net/docs/ref/#view.EditorViewConfig.dispatch
				if (!tr.docChanged) {
					view.update([tr]);
				} else {
					// Figure out whether we are in teacher or student mode.
					// This is a ProseMirror object, hence we need the prosemirror view (outerview) state.
					const teacher = INPUT_AREA_PLUGIN_KEY.getState(outerView.state)?.teacher;
					// if we could not get the locked state then we do not
					// allow this transaction to update the view.
					if (teacher === undefined) return;

					if (!teacher) {
						// in student mode.
						const pos = getPos();
						if (pos === undefined) return;
						// Resolve the position in the prosemirror document and get the node one level underneath the root.
						// TODO: Assumption that `<input-area>`s only ever appear one level beneath the root node.
						// TODO: Hardcoded node names.
						const name = outerView.state.doc.resolve(pos).node(1).type.name;
						if (name !== "input") return; // This node is not part of an input area.
					}

					view.update([tr]);
				}
			},
		});

		// Editors outer node is dom
		this.dom = this._codemirror.dom;

		// Fix the coqblock not being selectable when editing the markdown blocks.
		this.dom.addEventListener("click", () => {
			this._codemirror?.focus();
			this.setEditPermission();
		});

		this.updating = false;
		this.handleNewComplete([]);
	}

	// Dispatch an empty transaction, this causes the linter to rerun on idle.
	public dispatchEmpty() {
		this._codemirror?.dispatch({});
	}

	private partOfInputArea(): boolean {
		const pos = this._getPos();
		if (pos === undefined) return false;
		// Resolve the position in the prosemirror document and get the node one level underneath the root.
		// TODO: Assumption that `<input-area>`s only ever appear one level beneath the root node.
		// TODO: Hardcoded node names.
		const name = this._outerView.state.doc.resolve(pos).node(1).type.name;
		if (name !== "input") return false;
		return true; 
	}

	public handleSnippet(template: string, posFrom: number, posTo: number, completion? : Completion | undefined) {
		this._codemirror?.focus();
		snippet(template)({
			state: this._codemirror!.state,
			dispatch: this._codemirror!.dispatch
		}, completion ?? null, posFrom, posTo);
	}

	/**
	 * set edit permission
	 */
	setEditPermission(): void {
		// update
		this._codemirror?.dispatch({
			effects: this._readOnlyCompartment.reconfigure(
				EditorState.readOnly.of(!this._outerView.editable)
			)
		});
	}

	/**
	 * Update the theme of the editor.
	 */
	public updateThemeFromVSCode(theme: ThemeStyle): void {
		this._codemirror?.dispatch({
			effects: this._themeCompartment.reconfigure(
				coqSyntaxHighlighting(theme)
			)
		});
	}

	/**
	 * Update the line numbers extension
	 */
	updateLineNumbers(firstLineNo: number, toggleState: boolean): void {
		this._lineNumbersExtension = lineNumbers({
			formatNumber: (lineNo: number) => (lineNo + firstLineNo - 1).toString()
		});
		this._codemirror?.dispatch({
			effects: this._lineNumberCompartment.reconfigure(
				toggleState ? this._lineNumbersExtension : []
			)
		});
	}

	/**
	 * This method needs to be called with the new list to update it.
	 */
	handleNewComplete(newCompletions: Completion[]): void {
		this._dynamicCompletions = newCompletions;
	}

	/**
	 * (Dynamic) Completion Source.
	 * Contains completions for defined theorems/lemmas/etc.
	 */
	dynamicCompletionSource: CompletionSource = (context: CompletionContext): Promise<CompletionResult | null> => {
		return new Promise((resolve, _reject) => {
			const before = context.matchBefore(/\w/);
			// If completion wasn't explicitly started and there
			// is no word before the cursor, don't open completions.
			if (!context.explicit && !before) resolve(null);
			resolve({
				from: before ? before.from : context.pos,
				options: this._dynamicCompletions,
				validFor: /[^ ]*/
			});
		});
	};

	/**
	 * The {@linkcode LintSource} to use for the codemirror instance.
	 * This will use the outer {@linkcode WaterproofEditor} to get diagnostics in the range of this
	 * codemirror view.
	 */
	private lintingFunction: LintSource = (_view: CodeMirror): readonly Diagnostic[] => {
		const startPos = this._getPos();

		if (startPos === undefined) return [];

		// We use the outer editor instance to query for diagnostics in the range of this codemirror instance.
		const diags = this.editorInstance.getPartialDiagnosticsInRange(startPos, startPos + _view.state.doc.length + 1).map(d => {
			// The codemirror range is from 0 to _view.state.doc.length + 1.
			// We need to translate the position that we get from the diagnostic object into this range by subtracting the starting
			// position of this codemirror instance.
			return this.preprocessDiagnostic(Math.max(d.start - startPos - 1, 0),
				Math.min(d.end - startPos - 1, _view.state.doc.length),
				d.message, d.severity);
		});

		// Update the version of the diagnostics we are using.
		this.lastUsedDiagnosticsVersion = this.editorInstance.diagnosticsVersion;

		return diags;
	}

	/**
	 * Add a new coq error to this view
	 * @param from The from position of the error.
	 * @param to The to postion of the error (should be larger than `from`).
	 * @param message The message attached to this error.
	 * @param severity The severity attached to this error.
	 */
	public preprocessDiagnostic(from: number, to: number, message: string, severity: number): Diagnostic {
		const severityString = severityToString(severity);
		
		// By default, there is the copy action
		let actions = [{
			name: "📋",
			apply: (view: CodeMirror, from: number, _to: number) => {
				// give focus to this current codeblock instante to ensure it updates
				this._codemirror?.focus();
				navigator.clipboard.writeText(message);
				this.showCopyNotification(from);
			}
		}];
		let trimmedMessage : string = "";
		if (message.startsWith("Hint, replace with: ")) {
			trimmedMessage = message.trim().replace("Hint, replace with: ", "").replace(/\.\${(.*?)}$/, ".").replaceAll(/\$\{.*?\}/g,"...")
			actions = [({
				name: "Replace ↩️",
				apply:(view: CodeMirror, from: number, to: number) => {
					// give focus to this current codeblock instante to ensure it updates
					this._codemirror?.focus();
					const toInsert = message.trim().replace("Hint, replace with: ", "");
					view.dispatch({
						changes: {
							from:from,
							to:to,
							insert: ""
						},
						selection: { anchor: from }
					});
					this.handleSnippet(toInsert, from, from);
				}
			})];
		} else if (message.startsWith("Hint, insert: ")) {
			trimmedMessage = message.trim().replace("Hint, insert: ", "").replace(/\.\${.*?}$/, ".").replaceAll(/\$\{.*?\}/g,"...");
			actions = [({
				name: "Insert ⤵️",
				apply:(view: CodeMirror, from: number, to: number) => {
					// give focus to this current codeblock instante to ensure it updates
					this._codemirror?.focus();
					const toInsert = "\n" + message.trim().replace("Hint, insert: ", "");
					this.handleSnippet(toInsert, to, to);
				}
			})];
		} else if (message.startsWith("Remove this line")) {
			actions = [({
				name: "Delete 🗑️",
				apply: (view: CodeMirror, from: number, to: number) => {
					// give focus to this current codeblock instante to ensure it updates
					this._codemirror?.focus();
					view.dispatch({
						changes: {
							from: from,
							to: to,
							insert: ""
						},
						selection: { anchor: from }
					});
				}
			})];
		}

		return {
			from,
			to,
			message: (trimmedMessage === "" ? message : trimmedMessage),
			severity: severityString,
			actions,
		};
	}

	private showCopyNotification(from:number) {
		//coordinates of the the line with the diagnostic
		const coords = this._codemirror?.coordsAtPos(from);
	
		if (!coords) {
			console.warn("Could not determine coordinates for diagnostic line.");
			return;
		}
	
		// Create the notification element
		const notification = document.createElement("div");
		notification.textContent = `Copied!`;
		notification.style.top = `${coords.bottom + 5}px`; // Position 5px below the line
		notification.style.left = `${coords.left}px`; // Align with the left edge of the line
		notification.classList.add("copy-notification");
		document.body.appendChild(notification);
	
		// Fade out after 1 second
		setTimeout(() => {
			notification.style.opacity = "0";
			// Remove the notification from the DOM after the transition
			setTimeout(() => notification.remove(), 500);
		}, 1000);
	}
}

const severityToString = (sv: number) => {
	switch (sv) {
		case 0:
			return "error";
		case 1:
			return "warning";
		case 2:
			return "info";
		case 3:
			return "hint";
		default:
			return "error";
	}
}

function execCmdIfInCompletionContext(target: CodeMirror, cmd: Command): boolean {
	const status = completionStatus(target.state);
	if (status !== null) {
		// Execute the supplied command when we are in a completion context
		return cmd(target);
	}
	// Indicate that we have not handled this key
	return false;
}
