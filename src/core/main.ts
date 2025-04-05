import { Plugin, Notice } from 'obsidian';
import { GraphManager } from '../features/graph/graphManager';
import { FileManager } from '../features/files/fileManager';
import { GitManager } from '../features/git/gitManager';
import { PluginSettings, DEFAULT_SETTINGS } from '../settings/settings';
import { SettingsTab } from '../settings/settingsTab';

export default class GraphOrganizerPlugin extends Plugin {
    settings: PluginSettings;
    graphManager: GraphManager;
    fileManager: FileManager;
    gitManager: GitManager;

    async onload() {
        console.log('Loading Graph Organizer plugin');
        
        await this.loadSettings();
        
        // Initialize managers
        this.graphManager = new GraphManager(this);
        this.fileManager = new FileManager(this);
        this.gitManager = new GitManager(this);
        
        // Add settings tab
        this.addSettingTab(new SettingsTab(this.app, this));
        
        // Add commands
        this.addCommand({
            id: 'organize-files',
            name: 'Organize Files',
            callback: async () => {
                try {
                    await this.fileManager.organizeFiles(false);
                    if (this.settings.gitIntegration) {
                        await this.gitManager.commitOrganizationChanges();
                    }
                } catch (error) {
                    new Notice(`Error organizing files: ${error.message}`);
                    console.error(error);
                }
            }
        });
        
        this.addCommand({
            id: 'preview-organization',
            name: 'Preview Organization',
            callback: async () => {
                try {
                    await this.fileManager.organizeFiles(true);
                } catch (error) {
                    new Notice(`Error previewing organization: ${error.message}`);
                    console.error(error);
                }
            }
        });
    }

    onunload() {
        console.log('Unloading Graph Organizer plugin');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
