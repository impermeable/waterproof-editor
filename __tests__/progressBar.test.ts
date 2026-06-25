/**
 * @jest-environment jsdom
 */

// AI-generated tests

import { ProgressBar } from "../src/progressBar";

function makeBar(): { bar: ProgressBar; root: HTMLElement } {
  const root = document.createElement("div");
  const bar = new ProgressBar(root);
  return { bar, root };
}

// ── constructor ───────────────────────────────────────────────────────────────

describe("constructor", () => {
  test("inserts a #progress container into the host element", () => {
    const { root } = makeBar();
    expect(root.querySelector("#progress")).not.toBeNull();
  });

  test("hides the progress bar and spinner on creation", () => {
    const { root } = makeBar();
    const barContainer = root.querySelector<HTMLElement>(".progress-bar")!;
    const spinner = root.querySelector<HTMLElement>(".spinner-container")!;
    expect(barContainer.style.display).toBe("none");
    expect(spinner.style.display).toBe("none");
  });

  test("reuses an existing #progress element when already in the DOM", () => {
    // Simulate a page that already has the progress markup
    const existing = document.createElement("div");
    existing.id = "progress";
    const spinnerContainer = document.createElement("div");
    spinnerContainer.id = "spinnerContainer";
    const progressBarContainer = document.createElement("div");
    progressBarContainer.id = "progressBarContainer";
    const progressEl = document.createElement("progress");
    progressEl.id = "progressBarProgress";
    const textSpanEl = document.createElement("span");
    textSpanEl.id = "progressBarText";
    progressBarContainer.append(progressEl, textSpanEl);
    existing.append(spinnerContainer, progressBarContainer);
    document.body.appendChild(existing);

    const root = document.createElement("div");
    new ProgressBar(root);
    // No second #progress should have been inserted into root
    expect(root.querySelector("#progress")).toBeNull();

    existing.remove();
  });
});

// ── show / hide ───────────────────────────────────────────────────────────────

describe("show and hide", () => {
  test("show makes both containers visible", () => {
    const { bar, root } = makeBar();
    bar.show();
    const barContainer = root.querySelector<HTMLElement>(".progress-bar")!;
    const spinner = root.querySelector<HTMLElement>(".spinner-container")!;
    expect(barContainer.style.display).toBe("");
    expect(spinner.style.display).toBe("");
  });

  test("hide conceals both containers after show", () => {
    const { bar, root } = makeBar();
    bar.show();
    bar.hide();
    const barContainer = root.querySelector<HTMLElement>(".progress-bar")!;
    const spinner = root.querySelector<HTMLElement>(".spinner-container")!;
    expect(barContainer.style.display).toBe("none");
    expect(spinner.style.display).toBe("none");
  });
});

// ── reportProgress ────────────────────────────────────────────────────────────

describe("reportProgress", () => {
  test("sets the progress element value and max", () => {
    const { bar, root } = makeBar();
    bar.reportProgress(3, 10);
    const progress = root.querySelector<HTMLProgressElement>("progress")!;
    expect(progress.value).toBe(3);
    expect(progress.max).toBe(10);
  });

  test("shows a default text when no text argument is provided", () => {
    const { bar, root } = makeBar();
    bar.reportProgress(2, 7);
    const span = root.querySelector<HTMLSpanElement>(".progress-bar-text")!;
    expect(span.textContent).toBe("Progress: 2 / 7");
  });

  test("uses the provided text when given", () => {
    const { bar, root } = makeBar();
    bar.reportProgress(1, 1, "Verified!");
    const span = root.querySelector<HTMLSpanElement>(".progress-bar-text")!;
    expect(span.textContent).toBe("Verified!");
  });

  test("makes the bar visible when called while hidden", () => {
    const { bar, root } = makeBar();
    bar.reportProgress(1, 5);
    const barContainer = root.querySelector<HTMLElement>(".progress-bar")!;
    expect(barContainer.style.display).toBe("");
  });

  test("does not re-hide the bar on a second call", () => {
    const { bar, root } = makeBar();
    bar.reportProgress(1, 5);
    bar.reportProgress(2, 5);
    const barContainer = root.querySelector<HTMLElement>(".progress-bar")!;
    expect(barContainer.style.display).toBe("");
  });
});

// ── spinner ───────────────────────────────────────────────────────────────────

describe("startSpinner / stopSpinner", () => {
  test("startSpinner adds the spinner class", () => {
    const { bar, root } = makeBar();
    bar.startSpinner();
    expect(
      root.querySelector(".spinner-container")!.classList.contains("spinner"),
    ).toBe(true);
  });

  test("stopSpinner removes the spinner class", () => {
    const { bar, root } = makeBar();
    bar.startSpinner();
    bar.stopSpinner();
    expect(
      root.querySelector(".spinner-container")!.classList.contains("spinner"),
    ).toBe(false);
  });

  test("stopSpinner is safe to call when spinner is not running", () => {
    const { bar, root } = makeBar();
    bar.stopSpinner();
    expect(
      root.querySelector(".spinner-container")!.classList.contains("spinner"),
    ).toBe(false);
  });
});
