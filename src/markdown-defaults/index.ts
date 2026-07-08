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
    widget: {
      openTag: (type: string) => `<widget data-type="${type}">`,
      closeTag: "</widget>",
      openRequiresNewline: false,
      closeRequiresNewline: false,
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
  };
}
