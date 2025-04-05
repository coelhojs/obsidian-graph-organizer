import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory path of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const buildDir = join(rootDir, 'build');

// Plugin ID from manifest.json
const PLUGIN_ID = 'obsidian-graph-organizer';

// Define possible vault paths based on OS (modify these as needed)
const VAULT_PATHS = [
    // Add your own vault paths here
    // Windows example:
    'C:/Users/YourUsername/Documents/ObsidianVault',
    // macOS example:
    '/Users/YourUsername/Documents/ObsidianVault',
    // Linux example:
    '/home/YourUsername/ObsidianVault'
];

// Files to copy
const FILES_TO_COPY = [
    { src: 'main.js', dest: 'main.js' },
    { src: 'manifest.json', dest: 'manifest.json' }
];

// Check if build directory exists
if (!existsSync(buildDir)) {
    console.error(`Build directory not found: ${buildDir}`);
    console.log('Please run "npm run build" before deploying.');
    process.exit(1);
}

// Try to find an existing vault
let vaultPath = null;
for (const path of VAULT_PATHS) {
    if (existsSync(path)) {
        vaultPath = path;
        break;
    }
}

if (!vaultPath) {
    console.error('No vault found at the specified paths.');
    console.log('Please modify the VAULT_PATHS array in this script with your vault location.');
    process.exit(1);
}

// Plugin installation directory
const pluginDir = join(vaultPath, '.obsidian', 'plugins', PLUGIN_ID);

// Create plugin directory if it doesn't exist
if (!existsSync(pluginDir)) {
    console.log(`Creating plugin directory at: ${pluginDir}`);
    mkdirSync(pluginDir, { recursive: true });
}

// Copy files
for (const file of FILES_TO_COPY) {
    const srcPath = join(buildDir, file.src);
    const destPath = join(pluginDir, file.dest);
    
    if (!existsSync(srcPath)) {
        console.error(`Source file not found: ${srcPath}`);
        continue;
    }
    
    try {
        copyFileSync(srcPath, destPath);
        console.log(`Copied ${file.src} to ${destPath}`);
    } catch (error) {
        console.error(`Error copying ${file.src}: ${error.message}`);
    }
}

console.log('\nPlugin deployed successfully to:');
console.log(pluginDir);
console.log('\nPlease restart Obsidian or reload plugins to see the changes.'); 