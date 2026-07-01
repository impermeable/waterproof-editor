import { TagConfiguration } from "../api";

export { parse } from "./statemachine";

export function configuration(languageId: string): TagConfiguration {
  return {
    markdown: {
      openTag: "",
      closeTag: "",
      openRequiresNewline: false,
      closeRequiresNewline: false,
    },
    code: {
      // There should be a newline before the opening tag of the code cell.
      openRequiresNewline: true,
      openTag: "```" + languageId + "\n",
      closeTag: "\n```",
      // There should be a newline after the closing tag of the code cell.
      closeRequiresNewline: true,
    },
    hint: {
      openTag: (title: string) => `<hint title="${title}">`,
      closeTag: "</hint>",
      openRequiresNewline: false,
      closeRequiresNewline: false,
    },
    input: {
      openTag: "<input-area>",
      closeTag: "</input-area>",
      openRequiresNewline: false,
      closeRequiresNewline: false,
    },
    math: {
      openTag: "$$",
      closeTag: "$$",
      openRequiresNewline: false,
      closeRequiresNewline: false,
    },
    container: {
      openTag: (_name: string) => "",
      closeTag: "",
      openRequiresNewline: false,
      closeRequiresNewline: false,
    },
    interactiveTable: {
      openTag: (name: string) => `<interactive-table name="${name}">`,
      closeTag: "</interactive-table>",
      openRequiresNewline: false,
      closeRequiresNewline: false,
    },
    interactiveCell: {
      openTag: (cellText: string) => `<interactive-cell text="${cellText}">`,
      closeTag: "</interactive-cell>",
      openRequiresNewline: false,
      closeRequiresNewline: false,
    },
  };
}
