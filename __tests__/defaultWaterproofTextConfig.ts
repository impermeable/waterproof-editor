import { ThemeStyle, WaterproofEditorConfig } from "../src";
import { configuration, parse } from "../src/markdown-defaults";

/**
 * Constructs a valid WaterproofEditorConfig object constructed with sensible defaults.
 * After construction, properties can easily be overwritten.
 * @param langid Optional langid to use, will default to "bla"
 * @returns A valid WaterproofEditorConfig object. Overwrite properties when necessary
 */
export const defaultWaterproofTextConfig: (
  langid?: string,
) => WaterproofEditorConfig = (langid?: string) => {
  return {
    api: {
      applyStepError: () => {},
      cursorChange: () => {},
      documentChange: () => {},
      editorReady: () => {},
      executeCommand: () => {},
      executeHelp: () => {},
      viewportHint: () => {},
    },
    completions: [],
    documentConstructor: (v) => parse(v, { language: langid ?? "bla" }),
    symbols: [],
    tagConfiguration: configuration(langid ?? "bla"),
    templates: {
      containerOpenTag: "",
      example: "",
      exercise: { statement: "", closing: "" },
    },
    initialValues: {
      showLineNrs: false,
      showMenuItems: false,
      teacherMode: false,
      themeStyle: ThemeStyle.Light,
    },
    sendViewPortHints: false,
  };
};
