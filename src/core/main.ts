import { Plugin, Notice } from 'obsidian';
import { GraphManager } from '../features/graph/graphManager';
import { FileManager } from '../features/files/fileManager';
import { GitManager } from '../features/git/gitManager';
import { PluginSettings, DEFAULT_SETTINGS } from '../settings/settings';
import { SettingsTab } from '../settings/settingsTab';
import { Logger } from '../util/logger';

export default class GraphOrganizerPlugin extends Plugin {
    settings: PluginSettings;
    graphManager: GraphManager;
    fileManager: FileManager;
    gitManager: GitManager;

    async onload() {
        try {
            Logger.info('Loading Graph Organizer plugin v1.0.0');
            Logger.info('Plugin environment', {
                platform: navigator.platform,
                userAgent: navigator.userAgent
            });
            
            // Set up global error handler to catch unhandled errors
            window.onerror = (msg, source, lineNo, colNo, error) => {
                Logger.error('Unhandled error in Graph Organizer plugin', {
                    message: msg,
                    source,
                    lineNo,
                    colNo,
                    error
                });
                return false;
            };
            
            Logger.info('Loading plugin settings...');
            await this.loadSettings();
            
            // Set debug mode from settings
            Logger.setDebugMode(this.settings.debugMode);
            Logger.info(`Debug mode ${this.settings.debugMode ? 'enabled' : 'disabled'} from settings`);
            
            Logger.info('Settings loaded', this.settings);
            
            // Initialize managers
            Logger.info('Initializing Graph Manager...');
            this.graphManager = new GraphManager(this);
            
            Logger.info('Initializing File Manager...');
            this.fileManager = new FileManager(this);
            
            Logger.info('Initializing Git Manager...');
            this.gitManager = new GitManager(this);
            Logger.info('All managers initialized successfully');
            
            // Add settings tab
            Logger.info('Adding settings tab...');
            this.addSettingTab(new SettingsTab(this.app, this));
            
            // Add commands
            Logger.info('Registering commands...');
            this.addCommand({
                id: 'organize-files',
                name: 'Organize Files',
                callback: async () => {
                    try {
                        Logger.info('Executing organize files command...');
                        await this.fileManager.organizeFiles(false);
                        if (this.settings.gitIntegration) {
                            Logger.info('Committing changes to git...');
                            await this.gitManager.commitOrganizationChanges();
                        }
                        Logger.info('Files organized successfully');
                    } catch (error) {
                        Logger.error('Error organizing files', error);
                        new Notice(`Error organizing files: ${error.message}`);
                    }
                }
            });
            
            this.addCommand({
                id: 'preview-organization',
                name: 'Preview Organization',
                callback: async () => {
                    try {
                        Logger.info('Executing preview organization command...');
                        await this.fileManager.organizeFiles(true);
                        Logger.info('Preview completed successfully');
                    } catch (error) {
                        Logger.error('Error previewing organization', error);
                        new Notice(`Error previewing organization: ${error.message}`);
                    }
                }
            });
            
            // Add command to show debug logs
            this.addCommand({
                id: 'show-debug-logs',
                name: 'Show Debug Logs',
                callback: () => {
                    Logger.showLogsInNotice(15);
                }
            });
            
            Logger.info('Graph Organizer plugin loaded successfully');
        } catch (error) {
            Logger.error('FATAL: Error loading Graph Organizer plugin', error);
            new Notice(`Failed to load Graph Organizer plugin: ${error.message}`);
            throw error; // Rethrow to ensure Obsidian knows the plugin failed
        }
    }

    onunload() {
        Logger.info('Unloading Graph Organizer plugin');
        try {
            // Clean up resources if needed
            Logger.info('Graph Organizer plugin unloaded successfully');
        } catch (error) {
            Logger.error('Error unloading Graph Organizer plugin', error);
        }
    }

    async loadSettings() {
        try {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
            Logger.info('Settings loaded successfully');
        } catch (error) {
            Logger.error('Error loading settings', error);
            Logger.info('Using default settings instead');
            this.settings = Object.assign({}, DEFAULT_SETTINGS);
        }
    }

    async saveSettings() {
        try {
            await this.saveData(this.settings);
            Logger.info('Settings saved successfully');
        } catch (error) {
            Logger.error('Error saving settings', error);
            new Notice('Failed to save settings');
        }
    }
}
