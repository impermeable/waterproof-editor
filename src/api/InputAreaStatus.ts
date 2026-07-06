/**
 * The status of an input area.
 */
export enum InputAreaStatus {
  /** The content of the input area is considered correct. */
  Correct = "correct",
  /** The content of the input area is considered incorrect. */
  Incorrect = "incorrect",
  /** The input area is invalid and hence the status can not be determined. */
  Invalid = "invalid",
  /** The input area was out of view and thus the status was not determined. */
  OutOfView = "out-of-view",
}
