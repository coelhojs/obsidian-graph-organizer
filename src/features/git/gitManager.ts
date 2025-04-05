import { Notice } from 'obsidian';
import { simpleGit, SimpleGit } from 'simple-git';
import GraphOrganizerPlugin from '../../core/main';

export class GitManager {
    plugin: GraphOrganizerPlugin;
    git: SimpleGit | null = null;
    isGitRepo: boolean = false;

    constructor(plugin: GraphOrganizerPlugin) {
        console.log('Initializing GitManager');
        this.plugin = plugin;
        this.initGit().then(() => {
            console.log(`GitManager initialized. Git integration ${this.isGitRepo ? 'active' : 'inactive'}`);
        }).catch(error => {
            console.error('Error during GitManager initialization:', error);
        });
    }

    /**
     * Initialize Git integration if enabled
     */
    async initGit(): Promise<void> {
        console.log('Initializing Git integration');
        if (!this.plugin.settings.gitIntegration) {
            console.log('Git integration disabled in settings');
            return;
        }

        try {
            console.log('Attempting to initialize Git repository');
            // Get vault path using the appropriate Obsidian API
            // Using app.vault.adapter.getBasePath() for accessing the file system path
            const vaultPath = (this.plugin.app.vault.adapter as any).getBasePath?.() || '';
            
            if (!vaultPath) {
                console.error('Could not determine vault path for Git integration');
                throw new Error('Could not determine vault path');
            }
            
            console.log(`Using vault path for Git: ${vaultPath}`);
            this.git = simpleGit(vaultPath);
            
            // Check if this is a git repository
            console.log('Checking if vault is a Git repository');
            this.isGitRepo = await this.git.checkIsRepo();
            
            if (!this.isGitRepo) {
                console.warn('Vault is not a Git repository');
                new Notice('Git integration enabled but vault is not a Git repository');
            } else {
                console.log('Git repository found and initialized successfully');
                
                // Log git status for debugging
                try {
                    const status = await this.git.status();
                    console.log('Git repository status:', {
                        branch: status.current,
                        tracking: status.tracking,
                        changes: status.files.length,
                        clean: status.isClean()
                    });
                } catch (error) {
                    console.warn('Could not get initial Git status:', error);
                }
            }
        } catch (error) {
            console.error('Failed to initialize Git:', error);
            console.error('Stack trace:', error.stack);
            new Notice(`Git initialization failed: ${error.message}`);
            this.git = null;
        }
    }

    /**
     * Create a commit for file organization changes
     */
    async commitOrganizationChanges(message?: string): Promise<boolean> {
        console.log('Attempting to commit organization changes to Git');
        if (!this.git || !this.isGitRepo || !this.plugin.settings.gitIntegration) {
            console.warn(`Git commit aborted: ${!this.git ? 'git not initialized' : !this.isGitRepo ? 'not a git repo' : 'git integration disabled'}`);
            return false;
        }

        try {
            console.log('Adding all changes to git staging area');
            // Add all changes (we could be more selective if needed)
            await this.git.add('.');
            
            // Commit with a descriptive message
            const commitMessage = message || 'Organize files with Graph Organizer plugin';
            console.log(`Committing changes with message: "${commitMessage}"`);
            const commitResult = await this.git.commit(commitMessage);
            console.log('Git commit successful:', commitResult);
            
            new Notice('Git: committed file organization changes');
            return true;
        } catch (error) {
            console.error('Git commit failed:', error);
            console.error('Stack trace:', error.stack);
            new Notice(`Git commit failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get the current Git status
     */
    async getStatus(): Promise<any> {
        console.log('Getting git repository status');
        if (!this.git || !this.isGitRepo) {
            console.warn('Cannot get git status: git not initialized or not a repo');
            return null;
        }

        try {
            const status = await this.git.status();
            console.log('Git status:', {
                branch: status.current,
                tracking: status.tracking,
                changes: status.files.length,
                clean: status.isClean()
            });
            return status;
        } catch (error) {
            console.error('Failed to get Git status:', error);
            console.error('Stack trace:', error.stack);
            return null;
        }
    }
}
