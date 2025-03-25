
/**
 * Severity of reported diagnostics
 */
export enum Severity {
	Error = 0,
	Warning = 1,
	Information = 2,
    Hint = 3
}

export type SeverityLabel = "hint" | "info" | "warning" | "error";

export const SeverityLabelMap: Record<Severity, SeverityLabel> = {
	[Severity.Error]: "error",
	[Severity.Warning]: "warning",
	[Severity.Information]: "info",
	[Severity.Hint]: "hint"
};
