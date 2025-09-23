// Export Doc Change and Wrapping Doc Change types from "./DocChange"
export { DocChange, WrappingDocChange } from "./DocChange";

export { EditorState, Transaction } from "prosemirror-state";

// Export QedStatus type
export { InputAreaStatus } from "./InputAreaStatus";
export { LineNumber} from "./LineNumber";
export { Severity, SeverityLabel, SeverityLabelMap } from "./Severity";

export * from "./types";

export { WaterproofCompletion, WaterproofSymbol } from "./Completions";

export { Completion } from "@codemirror/autocomplete";
export { Step, ReplaceStep, ReplaceAroundStep } from "prosemirror-transform";
export { Fragment, Node } from "prosemirror-model";

export { ServerStatus, Idle, Busy } from "./ServerStatus";