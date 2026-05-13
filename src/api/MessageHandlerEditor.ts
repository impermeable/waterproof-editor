import type { Completion } from "@codemirror/autocomplete";
import type { HistoryChange, OffsetDiagnostic, ThemeStyle } from "./types";
import type { InputAreaStatus } from "./InputAreaStatus";

/**
 * API surface expected by the extension-side webview message router.
 *
 * This contract lives in the editor package because the extension sends
 * messages to an editor instance and should depend on the editor's public API.
 */
export interface MessageHandlerEditor {
	init: (value: string, version: number) => void;
	insertSymbol: (symbolUnicode: string) => boolean;
	handleSnippet: (template: string) => void;
	replaceRange: (start: number, end: number, text: string) => boolean;
	handleCompletions: (completions: Completion[]) => void;
	setInputAreaStatus: (statuses: InputAreaStatus[]) => void;
	setShowLineNumbers: (show: boolean) => void;
	setShowMenuItems: (show: boolean) => void;
	handleHistoryChange: (historyChange: HistoryChange) => void;
	updateLockingState: (teacherModeEnabled: boolean) => void;
	removeBusyIndicators: () => void;
	reportProgress: (at: number, numberOfLines: number, label: string) => void;
	setBusyIndicator: (from: number) => void;
	setActiveDiagnostics: (diagnostics: Array<OffsetDiagnostic>) => void;
	startSpinner: () => void;
	stopSpinner: () => void;
	updateNodeViewThemes: (theme: ThemeStyle) => void;
}
