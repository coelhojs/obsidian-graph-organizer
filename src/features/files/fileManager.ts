import { TFile, TFolder, Notice } from 'obsidian';
import GraphOrganizerPlugin from '../../core/main';

export class FileManager {
    plugin: GraphOrganizerPlugin;

    constructor(plugin: GraphOrganizerPlugin) {
        console.log('Initializing FileManager');
        this.plugin = plugin;
        console.log('FileManager initialized');
    }

    /**
     * Move files according to the organization strategy
     */
    async organizeFiles(dryRun: boolean = false): Promise<void> {
        console.log(`Starting file organization (dry run: ${dryRun})`);
        try {
            const { vault } = this.plugin.app;
            console.log('Getting suggested organization from graph manager');
            const organization = this.plugin.graphManager.getSuggestedOrganization();
            console.log(`Organization plan includes ${organization.size} folders`);
            
            if (dryRun) {
                console.log('Dry run - just displaying organization plan');
                // Just show what would be moved
                this.displayOrganizationPlan(organization);
                return;
            }
            
            console.log('Executing actual file moves');
            let moveCount = 0;
            let errorCount = 0;
            
            // Actually move the files
            for (const [folderPath, filePaths] of organization.entries()) {
                console.log(`Processing folder: ${folderPath} with ${filePaths.length} files`);
                // Create folder if it doesn't exist
                try {
                    await this.ensureFolderExists(folderPath);
                    console.log(`Folder exists or was created: ${folderPath}`);
                } catch (error) {
                    console.error(`Failed to create folder ${folderPath}:`, error);
                    console.error('Stack trace:', error.stack);
                    errorCount++;
                    continue; // Skip this folder
                }
                
                // Move files to folder
                for (const filePath of filePaths) {
                    console.log(`Attempting to move file: ${filePath} to ${folderPath}`);
                    const file = vault.getAbstractFileByPath(filePath);
                    if (file instanceof TFile) {
                        try {
                            const targetPath = `${folderPath}/${file.name}`;
                            console.log(`Moving file ${file.path} to ${targetPath}`);
                            await vault.rename(file, targetPath);
                            moveCount++;
                            console.log(`Successfully moved file to ${targetPath}`);
                        } catch (error) {
                            console.error(`Failed to move ${file.name}:`, error);
                            console.error('Stack trace:', error.stack);
                            new Notice(`Failed to move ${file.name}: ${error.message}`);
                            errorCount++;
                        }
                    } else {
                        console.warn(`File not found or not a file: ${filePath}`);
                    }
                }
            }
            
            console.log(`File organization complete. Moved ${moveCount} files with ${errorCount} errors`);
            new Notice(`Files organized successfully: ${moveCount} files moved, ${errorCount} errors`);
        } catch (error) {
            console.error('Error during file organization:', error);
            console.error('Stack trace:', error.stack);
            new Notice(`File organization failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Ensure a folder exists, creating it if necessary
     */
    private async ensureFolderExists(folderPath: string): Promise<TFolder> {
        console.log(`Ensuring folder exists: ${folderPath}`);
        try {
            const { vault } = this.plugin.app;
            const folder = vault.getAbstractFileByPath(folderPath);
            
            if (folder instanceof TFolder) {
                console.log(`Folder already exists: ${folderPath}`);
                return folder;
            }
            
            console.log(`Folder does not exist, creating: ${folderPath}`);
            // Create folder path recursively
            const pathParts = folderPath.split('/').filter(p => p.length > 0);
            let currentPath = '';
            
            for (const part of pathParts) {
                currentPath += (currentPath ? '/' : '') + part;
                console.log(`Checking path component: ${currentPath}`);
                const existing = vault.getAbstractFileByPath(currentPath);
                
                if (!existing) {
                    console.log(`Creating folder: ${currentPath}`);
                    await vault.createFolder(currentPath);
                    console.log(`Created folder: ${currentPath}`);
                } else if (!(existing instanceof TFolder)) {
                    const error = new Error(`Path ${currentPath} exists but is not a folder`);
                    console.error(error.message);
                    throw error;
                } else {
                    console.log(`Path component already exists as folder: ${currentPath}`);
                }
            }
            
            const newFolder = vault.getAbstractFileByPath(folderPath);
            if (newFolder instanceof TFolder) {
                console.log(`Successfully created folder path: ${folderPath}`);
                return newFolder;
            } else {
                throw new Error(`Failed to create folder: ${folderPath}`);
            }
        } catch (error) {
            console.error(`Error ensuring folder exists (${folderPath}):`, error);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }
    
    /**
     * Display a plan for how files would be organized
     */
    private displayOrganizationPlan(organization: Map<string, string[]>): void {
        console.log('Displaying organization plan');
        try {
            let message = 'Organization plan:\n\n';
            let totalFiles = 0;
            
            for (const [folderPath, filePaths] of organization.entries()) {
                message += `Folder: ${folderPath}\n`;
                console.log(`Preview - Folder: ${folderPath} (${filePaths.length} files)`);
                
                for (const filePath of filePaths) {
                    message += `  - ${filePath}\n`;
                }
                message += '\n';
                totalFiles += filePaths.length;
            }
            
            console.log(`Organization plan includes ${organization.size} folders and ${totalFiles} files`);
            new Notice(message);
        } catch (error) {
            console.error('Error displaying organization plan:', error);
            console.error('Stack trace:', error.stack);
        }
    }
}
