#!/usr/bin/env node
import process from "process";
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");
const minify = process.argv.includes("--minify");
const disableSourcemap = process.argv.includes("--sourcemap=no");
const genSourcemap = disableSourcemap ? null : { sourcemap: "inline" };
const debugBuild = process.argv.includes("--debug");

// Setting to `copy` means we bundle the fonts in dist. Setting this to `dataurl` includes the fonts as base64 encoded data in the generated css file.
const fontLoader = "base64";
const sharedConfig = {
  entryPoints: ["src/index.ts", "src/styles/waterproof-defaults.css"],
  outdir: "dist",
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
  dropLabels: debugBuild ? [] : ["DEBUG"],
  minify,
  plugins: [
    {
      name: "log build status",
      setup(build) {
        build.onEnd(result => {
          const errCount = result.errors.length;
          if (errCount > 0) {
            console.error(`❌ Build failed with ${errCount} error${errCount > 1 ? "s" : ""}`);
          } else {
            console.log("✅ Build finished");
          }
        });
      }
    },
  ]
}

if (!watch) {
  // This builds, bundles and optionally minifies the editor package
  await esbuild.build(sharedConfig);
} else {
  const ctx = await esbuild.context(sharedConfig);
  console.log("Watching for file changes...");
  ctx.watch();
}


