// Importing necessary components from various packages
import { EditorState, Plugin, PluginKey, PluginSpec, Transaction } from "prosemirror-state";
import { SimpleProgressParams } from "./api";
import { ServerStatus } from "./api";

// Interface for the state of the progress plugin
export interface IProgressPluginState {
    progressParams: SimpleProgressParams;
    serverStatus: ServerStatus;
    endLine: number;
    startLine: number;
}

// Plugin key for the progress plugin
export const PROGRESS_PLUGIN_KEY = new PluginKey<IProgressPluginState>("prosemirror-progressBar");

function startSpinner(spinnerContainer: HTMLDivElement) {
    spinnerContainer.classList.add('spinner');
}

function stopSpinner(spinnerContainer: HTMLDivElement) {
    spinnerContainer.classList.remove('spinner');
}

// Function to create a progress bar given the progress state and the container for the progress bar
function createProgressBar(progressState: IProgressPluginState, progressBarContainer: HTMLDivElement, spinnerContainer: HTMLDivElement) {
    const { serverStatus, endLine, startLine } = progressState;
    
    // Remove existing progress bar text
    const oldProgressBarText = progressBarContainer.querySelector('.progress-bar-text');
    if (oldProgressBarText) {
        progressBarContainer.removeChild(oldProgressBarText);
    }
    
    let progressBar;
    
    const oldProgress = progressBarContainer.querySelector('progress');
    if (oldProgress) {
        progressBarContainer.removeChild(oldProgress);
    }
    
    if (progressBar == null) {
        progressBar = document.createElement('progress');
        progressBarContainer.appendChild(progressBar);
    }
    
    // Set the properties of the progress bar
    progressBar.max = endLine;
    
    if (startLine + 2 < endLine) {
        progressBar.value = startLine;
    } else {
        progressBar.value = endLine;
    }
    
    if (serverStatus.status === "Idle" || serverStatus.status === "Stopped") {
        stopSpinner(spinnerContainer);
    } else if (serverStatus.status === "Busy") {
        startSpinner(spinnerContainer);
    }
    
    // Create a span for the text
    const progressBarText = document.createElement('span');
    progressBarText.className = 'progress-bar-text';
        
    // Set the text of the span
    if (startLine + 2 < endLine) {
        progressBarText.textContent = `Verified file up to line: ${startLine + 1}`;
    } else {
        progressBarText.textContent = `File verified`;
    }
    
    progressBarContainer.appendChild(progressBarText);
}

// Spec for the progress bar plugin
const ProgressBarPluginSpec: PluginSpec<IProgressPluginState> = {
    key: PROGRESS_PLUGIN_KEY,
    state: {
        init(_config, _instance) {
            return {
                progressParams: {
                    numberOfLines: 1,
                    progress: {
                        range: {
                            start: {line: -1, character: -1}, end: {line: -1, character: -1}
                        },
                        offsetRange: {
                            start: -1, end: -1
                        }
                    }
                },
                serverStatus: {status: "Idle"},
                resetProgressBar: true,
                endLine: 1,
                startLine: 1,
            };
        },
        apply(tr: Transaction, value: IProgressPluginState, _oldState: EditorState, _newState: EditorState): IProgressPluginState {
            // Retrieve progress parameters from the transaction meta data
            const meta = tr.getMeta(PROGRESS_PLUGIN_KEY) as IProgressPluginState;
            const newServerStatus = meta?.serverStatus ?? value.serverStatus
            
            if (meta?.progressParams != null) {
                // If lines are being progressed, we reset the progress bar
                return { 
                    progressParams: meta.progressParams,
                    serverStatus: newServerStatus,
                    startLine: meta.progressParams.progress.range.start.line + 1,
                    endLine: meta.progressParams.progress.range.end.line + 1,
                };
            }
            return {
                ...value,
                serverStatus: newServerStatus,
            };
        }
    },
    view(editorView) {
        // Create a container for the progress bar
        const progressBarContainer = document.createElement('div');
        progressBarContainer.className = 'progress-bar';
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'spinner-container';
        
        // Insert the progress bar container into the DOM
        const parentNode = editorView.dom.parentNode;
        if (parentNode == null) {
            throw Error("editorView.dom.parentNode cannot be null here");
        }
        parentNode.insertBefore(progressBarContainer, editorView.dom);
        parentNode.insertBefore(spinnerContainer, editorView.dom);
        
        return {
            update(view, _prevState) {
                // Update the progress bar with the current state
                const progressState = PROGRESS_PLUGIN_KEY.getState(view.state);
                if (progressState) {
                    createProgressBar(progressState, progressBarContainer, spinnerContainer);
                }
            },
        };
    }
};

// Create a new instance of the progress bar plugin
export const progressBarPlugin = new Plugin(ProgressBarPluginSpec);
