import { TFile, TFolder, Notice } from 'obsidian';
import GraphOrganizerPlugin from '../../core/main';
import { Logger } from '../../util/logger';

export class FileManager {
    plugin: GraphOrganizerPlugin;

    constructor(plugin: GraphOrganizerPlugin) {
        Logger.info('Initializing FileManager');
        this.plugin = plugin;
        Logger.info('FileManager initialized');
    }

    /**
     * Move files according to the organization strategy
     */
    async organizeFiles(dryRun: boolean = false): Promise<void> {
        Logger.info(`Starting file organization (dry run: ${dryRun})`);
        try {
            const { vault } = this.plugin.app;
            Logger.info('Getting suggested organization from graph manager');
            const organization = this.plugin.graphManager.getSuggestedOrganization();
            Logger.info(`Organization plan includes ${organization.size} folders`);
            
            if (organization.size === 0) {
                Logger.warn('No organization suggestions found. Check your link structure.');
                new Notice('No file organization suggestions found. Make sure your notes have links between them.');
                return;
            }
            
            if (dryRun) {
                Logger.info('Dry run - just displaying organization plan');
                // Just show what would be moved
                this.displayOrganizationPlan(organization);
                return;
            }
            
            Logger.info('Executing actual file moves');
            let moveCount = 0;
            let errorCount = 0;
            
            // Actually move the files
            for (const [folderPath, filePaths] of organization.entries()) {
                Logger.info(`Processing folder: ${folderPath} with ${filePaths.length} files`);
                
                // Skip empty folders
                if (filePaths.length === 0) {
                    Logger.debug(`Skipping empty folder: ${folderPath}`);
                    continue;
                }
                
                // Create folder if it doesn't exist
                try {
                    await this.ensureFolderExists(folderPath);
                    Logger.info(`Folder exists or was created: ${folderPath}`);
                } catch (error) {
                    Logger.error(`Failed to create folder ${folderPath}:`, error);
                    errorCount++;
                    continue; // Skip this folder
                }
                
                // Move files to folder
                for (const filePath of filePaths) {
                    Logger.debug(`Attempting to move file: ${filePath} to ${folderPath}`);
                    const file = vault.getAbstractFileByPath(filePath);
                    if (file instanceof TFile) {
                        // Skip moving files that are already in the target folder
                        const fileFolder = file.parent ? file.parent.path : '';
                        if (fileFolder === folderPath) {
                            Logger.debug(`File ${file.path} already in target folder ${folderPath}`);
                            continue;
                        }
                        
                        try {
                            const targetPath = `${folderPath}/${file.name}`;
                            Logger.info(`Moving file ${file.path} to ${targetPath}`);
                            await vault.rename(file, targetPath);
                            moveCount++;
                            Logger.info(`Successfully moved file to ${targetPath}`);
                        } catch (error) {
                            Logger.error(`Failed to move ${file.name}:`, error);
                            new Notice(`Failed to move ${file.name}: ${error.message}`);
                            errorCount++;
                        }
                    } else {
                        Logger.warn(`File not found or not a file: ${filePath}`);
                    }
                }
            }
            
            Logger.info(`File organization complete. Moved ${moveCount} files with ${errorCount} errors`);
            
            if (moveCount > 0) {
                new Notice(`Files organized successfully: ${moveCount} files moved, ${errorCount} errors`);
            } else if (errorCount > 0) {
                new Notice(`Failed to organize files: ${errorCount} errors occurred`);
            } else {
                new Notice('No files needed to be moved. Your files are already organized.');
            }
        } catch (error) {
            Logger.error('Error during file organization:', error);
            new Notice(`File organization failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Ensure a folder exists, creating it if necessary
     */
    private async ensureFolderExists(folderPath: string): Promise<TFolder> {
        Logger.debug(`Ensuring folder exists: ${folderPath}`);
        try {
            const { vault } = this.plugin.app;
            
            // Handle root folder case
            if (!folderPath || folderPath === '/') {
                const rootFolder = vault.getRoot();
                Logger.debug('Using root folder');
                return rootFolder;
            }
            
            const folder = vault.getAbstractFileByPath(folderPath);
            
            if (folder instanceof TFolder) {
                Logger.debug(`Folder already exists: ${folderPath}`);
                return folder;
            }
            
            Logger.debug(`Folder does not exist, creating: ${folderPath}`);
            // Create folder path recursively
            const pathParts = folderPath.split('/').filter(p => p.length > 0);
            let currentPath = '';
            
            for (const part of pathParts) {
                currentPath += (currentPath ? '/' : '') + part;
                Logger.debug(`Checking path component: ${currentPath}`);
                const existing = vault.getAbstractFileByPath(currentPath);
                
                if (!existing) {
                    Logger.debug(`Creating folder: ${currentPath}`);
                    await vault.createFolder(currentPath);
                    Logger.debug(`Created folder: ${currentPath}`);
                } else if (!(existing instanceof TFolder)) {
                    const error = new Error(`Path ${currentPath} exists but is not a folder`);
                    Logger.error(error.message);
                    throw error;
                } else {
                    Logger.debug(`Path component already exists as folder: ${currentPath}`);
                }
            }
            
            const newFolder = vault.getAbstractFileByPath(folderPath);
            if (newFolder instanceof TFolder) {
                Logger.debug(`Successfully created folder path: ${folderPath}`);
                return newFolder;
            } else {
                throw new Error(`Failed to create folder: ${folderPath}`);
            }
        } catch (error) {
            Logger.error(`Error ensuring folder exists (${folderPath}):`, error);
            throw error;
        }
    }
    
    /**
     * Display a plan for how files would be organized
     */
    private displayOrganizationPlan(organization: Map<string, string[]>): void {
        Logger.info('Displaying organization plan');
        try {
            let totalFiles = 0;
            
            // Count total files to be moved
            for (const filePaths of organization.values()) {
                totalFiles += filePaths.length;
            }
            
            if (totalFiles === 0) {
                // Show more diagnostic information
                new Notice('No files to organize. Try creating more links between notes or check debug logs.', 8000);
                
                // Show a debug report in the log
                const { vault } = this.plugin.app;
                const fileCount = vault.getMarkdownFiles().length;
                Logger.info(`Diagnostic info: ${fileCount} markdown files in vault`);
                
                // Get more diagnostic information
                this.showDiagnosticInfo();
                return;
            }
            
            // Create a formatted message for the notice
            let message = `Organization plan (${organization.size} folders, ${totalFiles} files):\n\n`;
            
            for (const [folderPath, filePaths] of organization.entries()) {
                if (filePaths.length === 0) continue;
                
                message += `Folder: ${folderPath}\n`;
                Logger.debug(`Preview - Folder: ${folderPath} (${filePaths.length} files)`);
                
                // List up to 5 files for each folder to keep notice size reasonable
                const maxFilesToShow = 5;
                const shownFiles = filePaths.slice(0, maxFilesToShow);
                const remainingCount = filePaths.length - maxFilesToShow;
                
                for (const filePath of shownFiles) {
                    const fileName = filePath.split('/').pop() || filePath;
                    message += `  - ${fileName}\n`;
                }
                
                if (remainingCount > 0) {
                    message += `  - ... and ${remainingCount} more file(s)\n`;
                }
                
                message += '\n';
            }
            
            message += 'Use "Organize Files" command to apply these changes.';
            
            Logger.info(`Organization plan includes ${organization.size} folders and ${totalFiles} files`);
            new Notice(message, 10000); // Show for 10 seconds
        } catch (error) {
            Logger.error('Error displaying organization plan:', error);
            new Notice('Error displaying organization plan');
        }
    }
    
    /**
     * Show diagnostic information about files and links
     */
    private showDiagnosticInfo(): void {
        try {
            const { vault } = this.plugin.app;
            const files = vault.getMarkdownFiles();
            
            // Sample some files for analysis
            const sampleSize = Math.min(5, files.length);
            Logger.info(`Sampling ${sampleSize} files for link analysis:`);
            
            for (let i = 0; i < sampleSize; i++) {
                const file = files[i];
                const { metadataCache } = this.plugin.app;
                const fileCache = metadataCache.getFileCache(file);
                
                const links = fileCache?.links || [];
                const backlinks = Object.keys(metadataCache.resolvedLinks[file.path] || {});
                
                Logger.info(`File: ${file.path}`);
                Logger.info(`  - Outgoing links: ${links.length}`);
                Logger.info(`  - Incoming links: ${backlinks.length}`);
                
                // List some of the links
                if (links.length > 0) {
                    Logger.info(`  - Link samples: ${links.slice(0, 3).map(l => l.link).join(', ')}`);
                }
            }
            
            // Show the command to view logs
            new Notice('Link analysis complete. Use the "Show Debug Logs" command to see details.', 10000);
        } catch (error) {
            Logger.error('Error in diagnostic info:', error);
        }
    }
}
