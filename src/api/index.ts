// Export Doc Change and Wrapping Doc Change types from "./DocChange"
export { DocChange, WrappingDocChange } from "./DocChange";

export { EditorState, Transaction } from "prosemirror-state";

// Export QedStatus type
export { InputAreaStatus } from "./InputAreaStatus";
export { LineNumber } from "./LineNumber";
export { Severity, SeverityLabel, SeverityLabelMap } from "./Severity";

export * from "./types";

export type { WaterproofCompletion, WaterproofSymbol } from "./Completions";

export type { Completion } from "@codemirror/autocomplete";

export type { ServerStatus, Idle, Busy } from "./ServerStatus";

export { DocumentSerializer } from "../serialization/DocumentSerializer";

export { Mapping } from "../mapping";