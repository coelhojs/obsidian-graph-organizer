# Testing the Graph Organizer Plugin

## Manual Installation

1. Create a folder: `.obsidian/plugins/obsidian-graph-organizer` in your Obsidian vault
2. Copy these files from the `build` folder to that folder:
   - build/main.js → main.js
   - build/manifest.json → manifest.json
3. Restart Obsidian or reload plugins
4. Enable the 'Graph Organizer' plugin in Settings > Community plugins

## Development Testing

For development, run:
```bash
# Build the plugin
npm run build

# Deploy to your test vault (after configuring scripts/deploy-test.mjs)
npm run deploy-test
```

## Testing Features

After installation, you can test the plugin with these steps:

1. Open Obsidian settings and navigate to the "Graph Organizer" section
2. Configure your preferred organization strategy
3. Use the Command Palette (Ctrl+P) and run:
   - "Graph Organizer: Preview Organization" to see what changes would be made
   - "Graph Organizer: Organize Files" to actually move files

## Feedback

If you encounter any issues or have suggestions, please let us know! 