#!/usr/bin/env node
import process from "process";
import * as esbuild from "esbuild";

const watchConfig = (filename) => {
  return {
    onRebuild(error, result) {
      if (error) {
        error.errors.forEach((error) =>
          console.error(
            `> ${error.location.file}:${error.location.line}:${error.location.column}: error: ${error.text}`
          )
        );
      } else {
        console.log(`[watch] (re)build finished (${filename})`);
      }
    }
  }
};

let watch = (filename) => process.argv.includes("--watch") ? watchConfig(filename) : false;
let minify = process.argv.includes("--minify");
let disableSourcemap = process.argv.includes("--sourcemap=no");
let genSourcemap = disableSourcemap ? null : { sourcemap: "inline" };

// Setting to `copy` means we bundle the fonts in dist. Setting this to `dataurl` includes the fonts as base64 encoded data in the generated css file.
const fontLoader = "base64";

// This builds, bundles and optionally minifies the editor package
esbuild.build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  format: "cjs",
  ...genSourcemap,
  platform: "browser",
  loader: {
    ".woff": fontLoader,
    ".woff2": fontLoader,
    ".ttf": fontLoader,
    ".grammar": "file"
  },
  minify,
  watch: watch("waterproof-editor/index.ts")
}).then((_value) => {
  console.log("[watch] build finished (waterproof-editor)");
}).catch((err) => {
  console.error("[watch] build failed (waterproof-editor),", err);
});


