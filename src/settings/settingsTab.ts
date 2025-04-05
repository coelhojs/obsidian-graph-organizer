import { App, PluginSettingTab, Setting } from 'obsidian';
import GraphOrganizerPlugin from '../core/main';
import { Logger } from '../util/logger';

export class SettingsTab extends PluginSettingTab {
    plugin: GraphOrganizerPlugin;

    constructor(app: App, plugin: GraphOrganizerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Graph Organizer Settings' });

        new Setting(containerEl)
            .setName('Auto Organize')
            .setDesc('Automatically organize files based on graph relationships')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoOrganize)
                .onChange(async (value) => {
                    this.plugin.settings.autoOrganize = value;
                    await this.plugin.saveSettings();
                }));

        // Force organization strategy to by-links
        this.plugin.settings.organizationStrategy = 'by-links';
        
        new Setting(containerEl)
            .setName('Organization Strategy')
            .setDesc('Files are organized based on their link relationships')
            .addText(text => text
                .setValue('By Links (Default)')
                .setDisabled(true));

        new Setting(containerEl)
            .setName('Git Integration')
            .setDesc('Integrate with Git to track file organization changes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.gitIntegration)
                .onChange(async (value) => {
                    this.plugin.settings.gitIntegration = value;
                    await this.plugin.saveSettings();
                }));
                
        // Add folder exclusion/targeting settings
        containerEl.createEl('h3', { text: 'Folder Settings' });
        
        new Setting(containerEl)
            .setName('Target Folders')
            .setDesc('Only organize files in these folders (leave empty for all folders)')
            .addTextArea(text => text
                .setValue(this.plugin.settings.targetFolders.join('\n'))
                .setPlaceholder('folder1\nfolder2/subfolder')
                .onChange(async (value) => {
                    this.plugin.settings.targetFolders = value
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                    await this.plugin.saveSettings();
                }));
                
        new Setting(containerEl)
            .setName('Excluded Folders')
            .setDesc('Do not organize files in these folders')
            .addTextArea(text => text
                .setValue(this.plugin.settings.excludedFolders.join('\n'))
                .setPlaceholder('folder1\nfolder2/subfolder')
                .onChange(async (value) => {
                    this.plugin.settings.excludedFolders = value
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                    await this.plugin.saveSettings();
                }));
        
        // Add a section for advanced settings
        containerEl.createEl('h3', { text: 'Advanced Settings' });
        
        new Setting(containerEl)
            .setName('Debug Mode')
            .setDesc('Enable detailed logging for troubleshooting')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.debugMode)
                .onChange(async (value) => {
                    this.plugin.settings.debugMode = value;
                    Logger.setDebugMode(value);
                    Logger.info(`Debug mode ${value ? 'enabled' : 'disabled'}`);
                    await this.plugin.saveSettings();
                }));
                
        // Add a button to view debug logs
        new Setting(containerEl)
            .setName('Debug Logs')
            .setDesc('View recent debug logs')
            .addButton(button => button
                .setButtonText('View Logs')
                .onClick(() => {
                    Logger.showLogsInNotice(20);
                }));
    }
}
