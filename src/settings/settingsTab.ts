import { App, PluginSettingTab, Setting } from 'obsidian';
import GraphOrganizerPlugin from '../core/main';

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

        new Setting(containerEl)
            .setName('Organization Strategy')
            .setDesc('How to organize files based on graph relationships')
            .addDropdown(dropdown => dropdown
                .addOption('by-links', 'By Links')
                .addOption('by-clusters', 'By Clusters')
                .addOption('by-tags', 'By Tags')
                .setValue(this.plugin.settings.organizationStrategy)
                .onChange(async (value) => {
                    this.plugin.settings.organizationStrategy = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Git Integration')
            .setDesc('Integrate with Git to track file organization changes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.gitIntegration)
                .onChange(async (value) => {
                    this.plugin.settings.gitIntegration = value;
                    await this.plugin.saveSettings();
                }));
    }
}
