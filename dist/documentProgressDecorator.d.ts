import { Plugin, PluginKey } from 'prosemirror-state';
export interface IDocumentProgressDecoratorState {
    total: number;
    progressHeightLow: number;
    progressHeightHigh: number;
}
export declare const DOCUMENT_PROGRESS_DECORATOR_KEY: PluginKey<IDocumentProgressDecoratorState>;
export declare const documentProgressDecoratorPlugin: Plugin<IDocumentProgressDecoratorState>;
//# sourceMappingURL=documentProgressDecorator.d.ts.map