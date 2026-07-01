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
      // The trailing/leading newlines put the inner code fence on its own lines,
      // which the fenced-code (```) syntax requires. They are part of the cell's
      // tags (not its content), so the code cell stays contiguous in the mapping.
      openTag: (cellText: string, hidden: boolean) =>
        hidden
          ? `<interactive-cell text="${cellText}" hidden="true">\n`
          : `<interactive-cell text="${cellText}">\n`,
      closeTag: "\n</interactive-cell>",
      openRequiresNewline: false,
      closeRequiresNewline: false,
    },
  };
}
