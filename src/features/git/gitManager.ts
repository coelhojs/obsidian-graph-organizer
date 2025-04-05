import { Notice } from 'obsidian';
import { simpleGit, SimpleGit } from 'simple-git';
import GraphOrganizerPlugin from '../../core/main';

export class GitManager {
    plugin: GraphOrganizerPlugin;
    git: SimpleGit | null = null;
    isGitRepo: boolean = false;

    constructor(plugin: GraphOrganizerPlugin) {
        this.plugin = plugin;
        this.initGit();
    }

    /**
     * Initialize Git integration if enabled
     */
    async initGit(): Promise<void> {
        if (!this.plugin.settings.gitIntegration) {
            return;
        }

        try {
            // Get vault path using the appropriate Obsidian API
            // Using app.vault.adapter.getBasePath() for accessing the file system path
            const vaultPath = (this.plugin.app.vault.adapter as any).getBasePath?.() || '';
            
            if (!vaultPath) {
                throw new Error('Could not determine vault path');
            }
            
            this.git = simpleGit(vaultPath);
            
            // Check if this is a git repository
            this.isGitRepo = await this.git.checkIsRepo();
            
            if (!this.isGitRepo) {
                new Notice('Git integration enabled but vault is not a Git repository');
            }
        } catch (error) {
            console.error('Failed to initialize Git:', error);
            new Notice(`Git initialization failed: ${error.message}`);
            this.git = null;
        }
    }

    /**
     * Create a commit for file organization changes
     */
    async commitOrganizationChanges(message?: string): Promise<boolean> {
        if (!this.git || !this.isGitRepo || !this.plugin.settings.gitIntegration) {
            return false;
        }

        try {
            // Add all changes (we could be more selective if needed)
            await this.git.add('.');
            
            // Commit with a descriptive message
            const commitMessage = message || 'Organize files with Graph Organizer plugin';
            await this.git.commit(commitMessage);
            
            new Notice('Git: committed file organization changes');
            return true;
        } catch (error) {
            console.error('Git commit failed:', error);
            new Notice(`Git commit failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get the current Git status
     */
    async getStatus(): Promise<any> {
        if (!this.git || !this.isGitRepo) {
            return null;
        }

        try {
            return await this.git.status();
        } catch (error) {
            console.error('Failed to get Git status:', error);
            return null;
        }
    }
}
