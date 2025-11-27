import { Plugin, PluginKey, PluginSpec } from 'prosemirror-state';

// Interface for the document progress decorator plugin state
export interface IDocumentProgressDecoratorState {
    completed: boolean;
}

// Plugin key for the document progress decorator plugin
export const DOCUMENT_PROGRESS_DECORATOR_KEY = new PluginKey<IDocumentProgressDecoratorState>('prosemirror-document-progress-decorator');

// Spec for the document progress decorator plugin
const DocumentProgressDecoratorPluginSpec: PluginSpec<IDocumentProgressDecoratorState> = {
    key: DOCUMENT_PROGRESS_DECORATOR_KEY,
    state: {
        init(_config, _instance) {
            return {
                completed: true
            };
        },
        apply(tr, value, _oldState, _newState) {
            const meta = tr.getMeta(DOCUMENT_PROGRESS_DECORATOR_KEY);
            return meta ?? value;
        }
    },
    view(editorView) {
        // Create the document progress decorator container
        const decoratorContainer = document.createElement('div');
        decoratorContainer.className = 'document-progress-decorator';
        
        // Insert the decorator container into the DOM
        const parentNode = editorView.dom.parentNode;
        if (parentNode == null) {
            throw Error("editorView.dom.parentNode cannot be null here");
        }
        
        // Position the decorator relative to the editor
        parentNode.insertBefore(decoratorContainer, editorView.dom);
        
        // Function to update the decorator height based on progress
        const updateDecorator = (state: IDocumentProgressDecoratorState) => {
            // This one will work if the progress marker is in the document.
            const queryId = document.querySelector("#progress-marker");
            if (queryId === null) return;
            // This one will only work if the progress marker is in the document and the codecell is in a collapsed hint cell
            const queryIdInHint = document.querySelector(".hint[shown=false] #progress-marker");
            const title = queryIdInHint?.closest('.hint')?.previousElementSibling;


            let rect = queryId.getBoundingClientRect();
            let hidden = false;
            if (title !== null && title !== undefined) {
                hidden = true;
                // Element is in fact hidden.
                rect = title.getBoundingClientRect();
            }

            if (state.completed) {
                // Done checking, remove bar
                decoratorContainer.style.height = "0px";
                return;
            }

            const scrollTop = window.scrollY || window.pageYOffset;
            // We give a small visual indication that we are checking inside of the hint, by
            // stopping the progress line in the middle of the hint title.
            const elementTop = scrollTop + (hidden ? (rect.top + rect.bottom) / 2 : rect.top);

            decoratorContainer.style.height = `${elementTop}px`;
        };
        
        // Initialize with current state
        const initialState = DOCUMENT_PROGRESS_DECORATOR_KEY.getState(editorView.state);
        if (initialState) {
            updateDecorator(initialState);
        }
        
        return {
            update(view, _prevState) {
                // Update the decorator based on current progress state
                const currentState = DOCUMENT_PROGRESS_DECORATOR_KEY.getState(view.state);
                if (currentState) {
                    updateDecorator(currentState);
                }
            },
            destroy() {
                // Clean up the decorator when the plugin is destroyed
                if (decoratorContainer.parentNode) {
                    decoratorContainer.parentNode.removeChild(decoratorContainer);
                }
            }
        };
    }
};

// Create a new instance of the document progress decorator plugin
export const documentProgressDecoratorPlugin = new Plugin(DocumentProgressDecoratorPluginSpec);
