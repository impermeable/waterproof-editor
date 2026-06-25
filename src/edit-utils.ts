import { DocChange, WrappingDocChange } from "./api";

export const enum EditType {
  Insert,
  Replace,
  Delete,
}

export function typeFromDocChange(change: DocChange): EditType {
  if (change.startInFile === change.endInFile) {
    return EditType.Insert;
  } else if (change.finalText.length !== 0) {
    return EditType.Replace;
  } else {
    return EditType.Delete;
  }
}

export function isWrappingDocChange(
  change: DocChange | WrappingDocChange,
): change is WrappingDocChange {
  return "firstEdit" in change;
}

export function isDocChange(
  change: DocChange | WrappingDocChange,
): change is DocChange {
  return !isWrappingDocChange(change);
}
