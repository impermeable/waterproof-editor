
export class ProgressBar {
    // <div id="editor">
    //   <div id="progress">
    //     <div class="progress-bar">
    //       <progress max="1" value="1"></progress>
    //       <span class="progress-bar-text">File verified</span>
    //     </div>
    //     <div class="spinner-container"></div>
    //   </div>
    // ...
    // </div>

    private readonly containerElem: HTMLDivElement;
    private readonly spinnerContainer: HTMLDivElement;
    private readonly progressBarContainer: HTMLDivElement;
    private readonly progress: HTMLProgressElement;
    private readonly textSpan: HTMLSpanElement;
    private shown: boolean = false; 

    constructor(insertAtTopOfNode: HTMLElement) {
        // Check if the page already contains a progress bar container
        if (document.getElementById("progress")) {
            this.containerElem = document.getElementById("progress") as HTMLDivElement;
            this.spinnerContainer = document.getElementById("spinnerContainer") as HTMLDivElement;
            this.progressBarContainer = document.getElementById("progressBarContainer") as HTMLDivElement;
            this.progress = document.getElementById("progressBarProgress") as HTMLProgressElement;
            this.textSpan = document.getElementById("progressBarText") as HTMLSpanElement;
        } else {
            // Create the main container div
            const mainContainer = document.createElement("div");
            mainContainer.id = "progress";
            insertAtTopOfNode.insertBefore(mainContainer, insertAtTopOfNode.firstChild);

            this.containerElem = mainContainer;
            this.spinnerContainer = document.createElement("div");
            this.spinnerContainer.classList.add("spinner-container");
            this.progressBarContainer = document.createElement("div");
            this.progressBarContainer.classList.add("progress-bar");

            // Create the progress bar and text span
            this.progress = document.createElement('progress');
            this.textSpan = document.createElement('span');
            this.textSpan.classList.add("progress-bar-text");
            this.progressBarContainer.appendChild(this.progress);
            this.progressBarContainer.appendChild(this.textSpan);

            this.containerElem.appendChild(this.progressBarContainer);
            this.containerElem.appendChild(this.spinnerContainer);
        }

        this.hide(); // Initially hide the progress bar and spinner
    }

    /**
     * Hides the progress bar and spinner by setting
     */
    public hide() {
        this.progressBarContainer.style.display = 'none';
        this.spinnerContainer.style.display = 'none';
        this.shown = false;
    }

    /**
     * Shows the progress bar and spinner
     */
    public show() {
        this.progressBarContainer.style.display = '';
        this.spinnerContainer.style.display = '';
        this.shown = true;
    }

    /**
     * Updates the progress bar's value and text. If not already shown, it makes the progress bar visible.
     * @param current The current progress value
     * @param ofTotal The total progress value
     * @param text Optional custom text; defaults to "Progress: current / ofTotal"
     */
    public reportProgress(current: number, ofTotal: number, text?: string) {
        const displayedText = text ?? `Progress: ${current} / ${ofTotal}`;
        this.progress.max = ofTotal;
        this.progress.value = current;
        this.textSpan.textContent = displayedText;

        if (!this.shown) this.show();
    }

    /**
     * Starts the spinner
     */
    public startSpinner() {
        this.spinnerContainer.classList.add('spinner');
    }

    /**
     * Stops the spinner
     */
    public stopSpinner() {
        this.spinnerContainer.classList.remove('spinner');
    }
}