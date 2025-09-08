// Export Doc Change and Wrapping Doc Change types from "./DocChange"
export { DocChange, WrappingDocChange } from "./DocChange";

// Export QedStatus type
export { InputAreaStatus } from "./InputAreaStatus";
export { LineNumber} from "./LineNumber";
export { Severity, SeverityLabel, SeverityLabelMap } from "./Severity";

export { FileFormat } from "./FileFormat";

export * from "./types";

export { WaterproofCompletion, WaterproofSymbol } from "./Completions";

export { Completion } from "@codemirror/autocomplete";
export { Step, ReplaceStep, ReplaceAroundStep } from "prosemirror-transform";
export { Fragment } from "prosemirror-model";