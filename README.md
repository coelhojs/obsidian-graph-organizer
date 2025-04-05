# Obsidian Graph Organizer

An Obsidian plugin that automatically organizes files based on graph relationships.

## TODO:
- make the empty files (and the ones with only desktop.ini) be deleted in the organization process

## Features

- Organize files based on their connections in the graph
- Multiple organization strategies:
  - By Links: Organize files based on link density
  - By Clusters: Organize files based on graph clusters
  - By Tags: Organize files based on tags and graph connections
- Optional Git integration to track file organization changes
- Dry-run mode to preview changes before applying them

## Installation

### From Obsidian

1. Open Obsidian Settings > Community Plugins
2. Disable Safe Mode
3. Click Browse and search for "Graph Organizer"
4. Install and enable the plugin

### Manual Installation

1. Create a folder `.obsidian/plugins/obsidian-graph-organizer` in your vault
2. Download `main.js` and `manifest.json` from the latest release and place them in the folder
3. Restart Obsidian or reload plugins
4. Enable the plugin in Settings > Community Plugins

## Usage

1. Open the settings for Graph Organizer
2. Configure your organization strategy and other options
3. Use the command palette and search for "Graph Organizer: Organize Files" to run the plugin
4. Use "Graph Organizer: Preview Organization" to see what changes would be made without actually moving files

## Development

This plugin follows a domain-driven design using the "screaming architecture" approach, where:

- The folder structure reflects the features/domains rather than technical concerns
- Each feature is contained in its own folder with all related code
- Core business logic is separated from plugin integration

### Project Structure

```
obsidian-graph-organizer/
├── src/
│   ├── core/
│   │   └── main.ts                # Main entry point
│   ├── features/
│   │   ├── graph/
│   │   │   └── graphManager.ts    # Graph analysis
│   │   ├── files/
│   │   │   └── fileManager.ts     # File operations
│   │   └── git/
│   │       └── gitManager.ts      # Git integration
│   └── settings/
│       ├── settings.ts            # Settings definition
│       └── settingsTab.ts         # Settings UI
├── build/                        # Build output directory
│   ├── main.js                   # Compiled plugin
│   └── manifest.json             # Plugin manifest
├── scripts/                      # Helper scripts
│   └── deploy-test.mjs           # Script to deploy to test vault
└── config/                       # Configuration files
```

### Building

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to your test vault
npm run deploy-test
``` 