import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const targetVersion = process.argv[2];
const manifestPath = "manifest.json";
const buildManifestPath = join("build", "manifest.json");
const packageJsonPath = "package.json";

// Check if version provided
if (!targetVersion) {
  console.error("No version provided");
  process.exit(1);
}

// Validate version format
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(targetVersion)) {
  console.error(`Invalid version format: ${targetVersion}`);
  console.error("Expected format: x.y.z");
  process.exit(1);
}

// Update manifest.json in root
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.version = targetVersion;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// Ensure build directory exists
if (!existsSync("build")) {
  mkdirSync("build", { recursive: true });
}

// Update manifest.json in build directory if it exists
if (existsSync(buildManifestPath)) {
  writeFileSync(buildManifestPath, JSON.stringify(manifest, null, 2));
}

// Update package.json
const package_json = JSON.parse(readFileSync(packageJsonPath, "utf8"));
package_json.version = targetVersion;
writeFileSync(packageJsonPath, JSON.stringify(package_json, null, 2));

console.log(`Updated version to ${targetVersion}`); 