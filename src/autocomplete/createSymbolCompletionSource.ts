import { Completion, CompletionContext, CompletionResult, CompletionSource } from "@codemirror/autocomplete";
import { FuzzyMatcher } from "./matchers";

class SymbolAliasMatcher {
	private readonly symbols: Completion[];
	private lastPattern = "";
	private lastMatchedSymbols: Completion[];
	private cachedPattern: string | undefined;
	private cachedResult: { options: Completion[]; matchesByLabel: Map<string, readonly number[]> } | undefined;

	constructor(symbols: readonly Completion[]) {
		const filtered: Completion[] = [];
		for (const symbol of symbols) {
			if (typeof symbol.label !== "string") continue;
			if (typeof symbol.apply !== "string") continue;
			filtered.push(symbol);
		}
		this.symbols = filtered;
		this.lastMatchedSymbols = filtered;
	}

	match(pattern: string): { options: Completion[]; matchesByLabel: Map<string, readonly number[]> } {
		if (this.cachedPattern === pattern && this.cachedResult !== undefined) {
			return this.cachedResult;
		}

		const scanSymbols = pattern.startsWith(this.lastPattern)
			? this.lastMatchedSymbols
			: this.symbols;

		const matcher = new FuzzyMatcher(pattern);

		const bestByApply: Record<string, { completion: Completion; score: number; matched: readonly number[] }> =
			Object.create(null);
		const matchedSymbols: Completion[] = [];

		for (const symbol of scanSymbols) {
			const m = matcher.match(symbol.label);
			if (!m) continue;

			matchedSymbols.push(symbol);
			const key     = symbol.apply as string;
			const current = bestByApply[key];

			// prefer higher score, then shorter label, then lexicographic.
			if (
				!current ||
				m.score > current.score ||
				(m.score === current.score && (
					symbol.label.length < current.completion.label.length ||
					(symbol.label.length === current.completion.label.length &&
					 symbol.label < current.completion.label)
				))
			) {
				bestByApply[key] = { completion: symbol, score: m.score, matched: m.matched };
			}
		}

		const ranked = Object.values(bestByApply).sort((a, b) =>
			a.score !== b.score
				? b.score - a.score
				: a.completion.label.localeCompare(b.completion.label),
		);

		const options: Completion[]                         = [];
		const matchesByLabel = new Map<string, readonly number[]>();
		for (const { completion, matched } of ranked) {
			options.push(completion);
			matchesByLabel.set(completion.label, matched);
		}

		const result = { options, matchesByLabel };
		this.lastPattern         = pattern;
		this.lastMatchedSymbols  = matchedSymbols;
		this.cachedPattern       = pattern;
		this.cachedResult        = result;
		return result;
	}
}

const sourceCache = new WeakMap<readonly Completion[], CompletionSource>();

export function createSymbolCompletionSource(symbols: readonly Completion[]): CompletionSource {
	const cached = sourceCache.get(symbols);
	if (cached) return cached;

	const aliasMatcher = new SymbolAliasMatcher(symbols);

	const source: CompletionSource = (context: CompletionContext): CompletionResult | null => {
		const before = context.matchBefore(/\\[^ ]*/);
		if (!context.explicit && !before) return null;

		const pattern = before ? before.text : "";
		const { options, matchesByLabel } = aliasMatcher.match(pattern);
		if (!context.explicit && options.length === 0) return null;

		return {
			from: before ? before.from : context.pos,
			options,
			filter: false,
			getMatch: (completion: Completion) => matchesByLabel.get(completion.label) ?? [],
		};
	};

	sourceCache.set(symbols, source);
	return source;
}