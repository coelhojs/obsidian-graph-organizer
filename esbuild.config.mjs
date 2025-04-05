import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { join } from "path";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

const banner =
`/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
If you want to view the source, please visit the github repository of this plugin
*/
`;

const prod = process.argv[2] === "production";

// Define build directory and output files
const buildDir = "build";
const mainOutput = join(buildDir, "main.js");

// Create build directory if it doesn't exist
if (!existsSync(buildDir)) {
  mkdirSync(buildDir, { recursive: true });
}

// Read the manifest.json content, parse it, and write it without BOM
try {
  const manifestPath = "manifest.json";
  const manifestContent = readFileSync(manifestPath, 'utf8');
  // Parse and stringify to ensure valid JSON
  const manifestJson = JSON.parse(manifestContent);
  
  // Write to build directory without BOM
  writeFileSync(join(buildDir, "manifest.json"), JSON.stringify(manifestJson, null, 4), {encoding: 'utf8'});
  console.log("manifest.json copied to build directory without BOM characters");
} catch (error) {
  console.error(`Error processing manifest.json: ${error.message}`);
  process.exit(1);
}

const context = await esbuild.context({
  banner: {
    js: banner,
  },
  entryPoints: ["src/core/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  charset: "utf8",
  outfile: mainOutput,
});

if (prod) {
  await context.rebuild();
  
  // Verify and ensure the file is properly encoded after build
  try {
    // Read the output file
    const content = readFileSync(mainOutput, 'utf8');
    // Write it back with explicit UTF-8 encoding
    writeFileSync(mainOutput, content, {encoding: 'utf8'});
    console.log(`Build completed! Files are available in the '${buildDir}' directory.`);
  } catch (error) {
    console.error(`Error processing output file: ${error.message}`);
  }
  
  process.exit(0);
} else {
  await context.watch();
  console.log(`Watching for changes... Output files will be in '${buildDir}' directory.`);
} 