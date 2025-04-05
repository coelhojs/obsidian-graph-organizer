import { TFile, TFolder, Notice } from 'obsidian';
import GraphOrganizerPlugin from '../../core/main';

export class FileManager {
    plugin: GraphOrganizerPlugin;

    constructor(plugin: GraphOrganizerPlugin) {
        this.plugin = plugin;
    }

    /**
     * Move files according to the organization strategy
     */
    async organizeFiles(dryRun: boolean = false): Promise<void> {
        const { vault } = this.plugin.app;
        const organization = this.plugin.graphManager.getSuggestedOrganization();
        
        if (dryRun) {
            // Just show what would be moved
            this.displayOrganizationPlan(organization);
            return;
        }
        
        // Actually move the files
        for (const [folderPath, filePaths] of organization.entries()) {
            // Create folder if it doesn't exist
            await this.ensureFolderExists(folderPath);
            
            // Move files to folder
            for (const filePath of filePaths) {
                const file = vault.getAbstractFileByPath(filePath);
                if (file instanceof TFile) {
                    try {
                        await vault.rename(file, `${folderPath}/${file.name}`);
                    } catch (error) {
                        new Notice(`Failed to move ${file.name}: ${error.message}`);
                    }
                }
            }
        }
        
        new Notice('Files organized successfully');
    }
    
    /**
     * Ensure a folder exists, creating it if necessary
     */
    private async ensureFolderExists(folderPath: string): Promise<TFolder> {
        const { vault } = this.plugin.app;
        const folder = vault.getAbstractFileByPath(folderPath);
        
        if (folder instanceof TFolder) {
            return folder;
        }
        
        // Create folder path recursively
        const pathParts = folderPath.split('/').filter(p => p.length > 0);
        let currentPath = '';
        
        for (const part of pathParts) {
            currentPath += (currentPath ? '/' : '') + part;
            const existing = vault.getAbstractFileByPath(currentPath);
            
            if (!existing) {
                await vault.createFolder(currentPath);
            } else if (!(existing instanceof TFolder)) {
                throw new Error(`Path ${currentPath} exists but is not a folder`);
            }
        }
        
        return vault.getAbstractFileByPath(folderPath) as TFolder;
    }
    
    /**
     * Display a plan for how files would be organized
     */
    private displayOrganizationPlan(organization: Map<string, string[]>): void {
        let message = 'Organization plan:\n\n';
        
        for (const [folderPath, filePaths] of organization.entries()) {
            message += `Folder: ${folderPath}\n`;
            for (const filePath of filePaths) {
                message += `  - ${filePath}\n`;
            }
            message += '\n';
        }
        
        new Notice(message);
    }
}
