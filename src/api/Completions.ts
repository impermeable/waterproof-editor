
/**
 * Type of completions.
 */
export type WaterproofCompletion = {
    /** The label shown in the completion panel */
    label: string,
    /** The type of the completion */
    type: string,
    detail: string,
    template: string
}

export type WaterproofCompletionConfig = {
    beforeRegex: string,
    completions: Array<WaterproofCompletion>
}

/**
 * Completion that can always be inserted. 
 * Does not support templating.
 */
export type WaterproofSymbol = {
    label: string,
    type: string,
    apply: string
}
