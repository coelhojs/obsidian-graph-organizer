export interface PluginSettings {
    autoOrganize: boolean;
    organizationStrategy: string;
    gitIntegration: boolean;
    targetFolders: string[];
    excludedFolders: string[];
    debugMode: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    autoOrganize: false,
    organizationStrategy: 'by-links',
    gitIntegration: false,
    targetFolders: [],
    excludedFolders: [],
    debugMode: false
};
