import { TFile, LinkCache, MetadataCache } from 'obsidian';
import GraphOrganizerPlugin from '../../core/main';
import { Logger } from '../../util/logger';

interface LinkData {
    sources: Set<string>;  // Files that link to this file
    targets: Set<string>;  // Files that this file links to
    linkCount: number;     // Total number of links (incoming + outgoing)
}

// Interface for backlinks data returned by Obsidian API
interface BacklinkData {
    data: Record<string, any>;
}

export class GraphManager {
    plugin: GraphOrganizerPlugin;

    constructor(plugin: GraphOrganizerPlugin) {
        Logger.info('Initializing GraphManager');
        this.plugin = plugin;
        Logger.info('GraphManager initialized');
    }

    /**
     * Get all links between files in the vault
     */
    getLinks(): Map<string, LinkData> {
        Logger.info('Getting links between files in vault');
        try {
            const linkMap = new Map<string, LinkData>();
            const { metadataCache, vault } = this.plugin.app;
            
            // Get all markdown files in the vault
            const files = vault.getMarkdownFiles();
            Logger.info(`Processing ${files.length} markdown files in vault`);
            
            // Debug: Check if metadataCache exists
            Logger.debug(`MetadataCache available: ${!!metadataCache}`);
            Logger.debug(`ResolvedLinks available: ${!!metadataCache.resolvedLinks}`);
            
            // Create a list of links for debugging
            let totalOutgoingLinks = 0;
            let totalIncomingLinks = 0;
            let filesWithOutgoingLinks = 0;
            let filesWithIncomingLinks = 0;
            
            // Process each file to extract links
            for (const file of files) {
                // Skip files in excluded folders if defined
                if (this.shouldExcludeFile(file.path)) {
                    Logger.debug(`Skipping excluded file: ${file.path}`);
                    continue;
                }
                
                // Initialize link data for this file if not exists
                if (!linkMap.has(file.path)) {
                    linkMap.set(file.path, {
                        sources: new Set<string>(),
                        targets: new Set<string>(),
                        linkCount: 0
                    });
                }
                
                // Get cached metadata for file
                const fileCache = metadataCache.getFileCache(file);
                if (!fileCache) {
                    Logger.debug(`No metadata cache for file: ${file.path}`);
                    continue;
                }
                
                // Process links in the file
                const links = fileCache.links || [];
                if (links.length > 0) {
                    filesWithOutgoingLinks++;
                    totalOutgoingLinks += links.length;
                    Logger.debug(`File ${file.path} has ${links.length} outgoing links`);
                }
                
                // Process links in the file
                for (const link of links) {
                    const resolvedLinkPath = this.resolveLinkPath(link, file);
                    if (!resolvedLinkPath) continue;
                    
                    // Add to outgoing links for current file
                    const currentFileData = linkMap.get(file.path);
                    if (currentFileData) {
                        currentFileData.targets.add(resolvedLinkPath);
                        currentFileData.linkCount++;
                    }
                    
                    // Initialize link data for target file if not exists
                    if (!linkMap.has(resolvedLinkPath)) {
                        linkMap.set(resolvedLinkPath, {
                            sources: new Set<string>(),
                            targets: new Set<string>(),
                            linkCount: 0
                        });
                    }
                    
                    // Add to incoming links for target file
                    const targetFileData = linkMap.get(resolvedLinkPath);
                    if (targetFileData) {
                        targetFileData.sources.add(file.path);
                        targetFileData.linkCount++;
                    }
                }
                
                // Process backlinks using resolvedLinks
                this.processBacklinks(file, linkMap, metadataCache);
            }
            
            // Process backlinks again to catch any missing
            for (const [sourcePath, targetsObj] of Object.entries(metadataCache.resolvedLinks)) {
                const targets = Object.keys(targetsObj);
                if (targets.length > 0) {
                    filesWithIncomingLinks++;
                    totalIncomingLinks += targets.length;
                }
            }
            
            Logger.info(`Found link data for ${linkMap.size} files`);
            Logger.info(`Link statistics: ${filesWithOutgoingLinks} files with outgoing links, ${totalOutgoingLinks} total outgoing links`);
            Logger.info(`Link statistics: ${filesWithIncomingLinks} files with incoming links, ${totalIncomingLinks} total incoming links`);
            
            // Log some statistics about the links
            let totalLinks = 0;
            let maxLinks = 0;
            let highestLinkFile = '';
            
            for (const [path, data] of linkMap.entries()) {
                totalLinks += data.linkCount;
                if (data.linkCount > maxLinks) {
                    maxLinks = data.linkCount;
                    highestLinkFile = path;
                }
            }
            
            Logger.info(`Total links: ${totalLinks}, Max links: ${maxLinks} in file "${highestLinkFile}"`);
            return linkMap;
        } catch (error) {
            Logger.error('Error getting links:', error);
            throw error;
        }
    }

    /**
     * Process backlinks for a file
     */
    private processBacklinks(file: TFile, linkMap: Map<string, LinkData>, metadataCache: MetadataCache): void {
        try {
            // Use resolvedLinks to get backlinks
            const resolvedLinks = metadataCache.resolvedLinks;
            if (!resolvedLinks) return;
            
            // Look for all files that link to this file
            for (const [sourcePath, links] of Object.entries(resolvedLinks)) {
                if (this.shouldExcludeFile(sourcePath)) continue;
                
                // See if any of the links point to the current file
                const linksToTargetFile = Object.entries(links).filter(([targetPath, _]) => {
                    return targetPath === file.path;
                });
                
                if (linksToTargetFile.length > 0) {
                    // Add to incoming links for current file
                    const currentFileData = linkMap.get(file.path);
                    if (currentFileData) {
                        currentFileData.sources.add(sourcePath);
                    }
                    
                    // Initialize link data for source file if not exists
                    if (!linkMap.has(sourcePath)) {
                        linkMap.set(sourcePath, {
                            sources: new Set<string>(),
                            targets: new Set<string>(),
                            linkCount: 0
                        });
                    }
                    
                    // Add to outgoing links for source file
                    const sourceFileData = linkMap.get(sourcePath);
                    if (sourceFileData) {
                        sourceFileData.targets.add(file.path);
                    }
                }
            }
        } catch (error) {
            Logger.error(`Error processing backlinks for ${file.path}:`, error);
        }
    }

    /**
     * Resolve a link to its actual file path
     */
    private resolveLinkPath(link: LinkCache, sourceFile: TFile): string | null {
        try {
            // Get the target file from the link
            const { metadataCache, vault } = this.plugin.app;
            const resolvedLinks = metadataCache.resolvedLinks[sourceFile.path] || {};
            const linkTarget = resolvedLinks[link.link];
            
            if (!linkTarget) {
                Logger.debug(`Could not resolve link ${link.link} in ${sourceFile.path}`);
                return null;
            }
            
            // linkTarget should be a string path
            const targetFile = vault.getAbstractFileByPath(String(linkTarget));
            if (!targetFile || !(targetFile instanceof TFile)) {
                Logger.debug(`Link target is not a file: ${linkTarget}`);
                return null;
            }
            
            return targetFile.path;
        } catch (error) {
            Logger.error(`Error resolving link path for ${link.link}:`, error);
            return null;
        }
    }

    /**
     * Check if a file should be excluded based on settings
     */
    private shouldExcludeFile(path: string): boolean {
        // Check against excluded folders from settings
        const { excludedFolders } = this.plugin.settings;
        
        for (const excludedFolder of excludedFolders) {
            if (path.startsWith(excludedFolder)) {
                return true;
            }
        }
        
        // If targetFolders are specified, only include files in those folders
        const { targetFolders } = this.plugin.settings;
        if (targetFolders.length > 0) {
            return !targetFolders.some(folder => path.startsWith(folder));
        }
        
        return false;
    }

    /**
     * Get suggested organization based on link analysis
     */
    getSuggestedOrganization(): Map<string, string[]> {
        Logger.info('Getting suggested organization based on backlinks');
        try {
            const organization = new Map<string, string[]>();
            
            // Get link data for all files
            const linkData = this.getLinks();
            if (linkData.size === 0) {
                Logger.warn('No link data found, cannot suggest organization');
                return organization;
            }
            
            // Only implementing the 'by-links' strategy
            Logger.info('Organizing by link connections');
            
            // Group files by their strongest connections
            const fileGroups = this.groupFilesByStrongestConnections(linkData);
            
            // Convert the groups to folder structure
            for (const [groupName, filePaths] of fileGroups.entries()) {
                if (filePaths.length > 0) {
                    // Create folder based on the first file in the group (usually the most connected)
                    const folderPath = this.generateFolderNameFromGroup(groupName, filePaths);
                    organization.set(folderPath, filePaths);
                }
            }
            
            Logger.info(`Generated organization suggestions for ${organization.size} folders`);
            return organization;
        } catch (error) {
            Logger.error('Error generating organization suggestions:', error);
            throw error;
        }
    }

    /**
     * Group files by their strongest connections
     */
    private groupFilesByStrongestConnections(linkData: Map<string, LinkData>): Map<string, string[]> {
        const groups = new Map<string, string[]>();
        const processedFiles = new Set<string>();
        
        // Sort files by total link count (most connected first)
        const sortedFiles = Array.from(linkData.entries())
            .sort((a, b) => b[1].linkCount - a[1].linkCount)
            .map(entry => entry[0]);
        
        Logger.debug(`Sorted ${sortedFiles.length} files by link count`);
        
        // First pass: identify hub files (files with many connections)
        for (const filePath of sortedFiles) {
            if (processedFiles.has(filePath)) continue;
            
            const data = linkData.get(filePath);
            if (!data) continue;
            
            // Reduce threshold - now only need 1 or more connections
            const connectionThreshold = 1; // Reduced from 3 to 1
            const totalConnections = data.sources.size + data.targets.size;
            
            if (totalConnections >= connectionThreshold) {
                const groupFiles = [filePath];
                processedFiles.add(filePath);
                
                // Find all strongly connected files to this hub
                const allConnections = new Set<string>([...data.sources, ...data.targets]);
                
                for (const connectedFile of allConnections) {
                    if (processedFiles.has(connectedFile)) continue;
                    
                    const connectedData = linkData.get(connectedFile);
                    if (!connectedData) continue;
                    
                    // More lenient connection criteria - any connection is enough
                    groupFiles.push(connectedFile);
                    processedFiles.add(connectedFile);
                }
                
                if (groupFiles.length > 1) {
                    // Only create groups with at least 2 files
                    groups.set(filePath, groupFiles);
                    Logger.debug(`Created group for ${filePath} with ${groupFiles.length} files`);
                } else {
                    // Single file, remove from processed to allow it to be grouped later
                    processedFiles.delete(filePath);
                }
            }
        }
        
        // Second pass: group remaining files by their strongest connection
        for (const filePath of sortedFiles) {
            if (processedFiles.has(filePath)) continue;
            
            const bestGroup = this.findBestGroupForFile(filePath, groups, linkData);
            if (bestGroup) {
                const groupFiles = groups.get(bestGroup) || [];
                groupFiles.push(filePath);
                groups.set(bestGroup, groupFiles);
                processedFiles.add(filePath);
                Logger.debug(`Added ${filePath} to existing group ${bestGroup}`);
            } else {
                const fileData = linkData.get(filePath);
                // Create a new group for this file if it has any links
                if (fileData && fileData.linkCount > 0) {
                    groups.set(filePath, [filePath]);
                    processedFiles.add(filePath);
                    Logger.debug(`Created new group for singleton ${filePath}`);
                }
            }
        }
        
        // Handle files with no connections 
        // (can be organized by folder path or left in place)
        
        Logger.info(`Created ${groups.size} file groups based on link connections`);
        return groups;
    }

    /**
     * Check if two files are strongly connected - SIMPLIFIED version
     */
    private isStronglyConnected(file1: string, file2: string, linkData: Map<string, LinkData>): boolean {
        const data1 = linkData.get(file1);
        const data2 = linkData.get(file2);
        
        if (!data1 || !data2) return false;
        
        // Check for any links between the files (more lenient)
        const file1LinkedToFile2 = data1.targets.has(file2);
        const file2LinkedToFile1 = data2.targets.has(file1);
        
        // Now just one directional link is enough
        if (file1LinkedToFile2 || file2LinkedToFile1) {
            return true;
        }
        
        // Check for shared connections - make more lenient too
        const file1Connections = new Set([...data1.sources, ...data1.targets]);
        const file2Connections = new Set([...data2.sources, ...data2.targets]);
        
        let sharedConnections = 0;
        for (const connection of file1Connections) {
            if (file2Connections.has(connection)) {
                sharedConnections++;
            }
        }
        
        // Only need 1 shared connection 
        return sharedConnections >= 1;
    }

    /**
     * Find the best existing group for a file
     */
    private findBestGroupForFile(filePath: string, groups: Map<string, string[]>, linkData: Map<string, LinkData>): string | null {
        const fileData = linkData.get(filePath);
        if (!fileData) return null;
        
        let bestGroup = null;
        let maxConnections = 0;
        
        for (const [groupName, groupFiles] of groups.entries()) {
            let connectionsToGroup = 0;
            
            for (const groupFile of groupFiles) {
                if (fileData.sources.has(groupFile) || fileData.targets.has(groupFile)) {
                    connectionsToGroup++;
                }
            }
            
            if (connectionsToGroup > maxConnections) {
                maxConnections = connectionsToGroup;
                bestGroup = groupName;
            }
        }
        
        // Only return a group if there's at least one connection
        return maxConnections > 0 ? bestGroup : null;
    }

    /**
     * Generate a folder name from a group of files
     */
    private generateFolderNameFromGroup(groupLeader: string, filePaths: string[]): string {
        // Simple version: use the base name of the group leader file
        const fileName = groupLeader.split('/').pop() || '';
        const baseName = fileName.replace(/\.[^/.]+$/, ''); // Remove file extension
        
        // Clean up the name for folder usage
        const folderName = baseName
            .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid file system characters
            .replace(/\s+/g, '_')          // Replace spaces with underscores
            .replace(/_+/g, '_')           // Replace multiple underscores with a single one
            .trim();
        
        return folderName;
    }

    /**
     * This method is disabled as we're only using the by-links strategy
     */
    findClusters(): Map<string, TFile[]> {
        Logger.info('Cluster-based organization is disabled, using links-based organization');
        return new Map<string, TFile[]>();
    }
}
