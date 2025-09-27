import { Serializers, TagConfiguration } from "./api"

export function markdownConfiguration(languageId: string): TagConfiguration {
    return {
        markdown: {
            openTag: "", closeTag: "",
            openRequiresNewline: false, closeRequiresNewline: false,
        }, 
        code: {
            openTag: "```" + languageId + "\n",
            closeTag: "\n```",
            openRequiresNewline: true,
            closeRequiresNewline: true,
        },
        hint: {
            openTag: (title: string) => `<hint title="${title}">`,
            closeTag: "</hint>",
            openRequiresNewline: false, closeRequiresNewline: false,
        },
        input: {
            openTag: "<input-area>", closeTag: "</input-area>",
            openRequiresNewline: false, closeRequiresNewline: false,
        },
        math: {
            openTag: "$$", closeTag: "$$",
            openRequiresNewline: false, closeRequiresNewline: false
        }
    }
};

/**
 * Assumes using the `markdownTagMap` with the same language id.
 * @param languageId 
 * @returns 
 */
export function markdownSerializers(languageId: string): Serializers {
    const tagConf = markdownConfiguration(languageId);
    return {
        code: (content) => tagConf.code.openTag + content + tagConf.code.closeTag,
        input: (content) => tagConf.input.openTag + content + tagConf.input.closeTag,
        hint: (content, title) => tagConf.hint.openTag(title) + content + tagConf.hint.closeTag,
        markdown: (content) => tagConf.markdown.openTag + content + tagConf.markdown.closeTag,
        math: (content) => tagConf.math.openTag + content + tagConf.math.closeTag,
    };
}
