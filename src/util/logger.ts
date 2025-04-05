import { Notice } from 'obsidian';

/**
 * Logger utility for capturing logs for debugging
 */
export class Logger {
    private static logs: LogEntry[] = [];
    private static maxLogs: number = 1000;
    private static debugModeEnabled: boolean = false;

    /**
     * Enable or disable debug mode
     */
    static setDebugMode(enabled: boolean): void {
        this.debugModeEnabled = enabled;
        console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Log an informational message
     */
    static info(message: string, data?: any): void {
        this.addLog('info', message, data);
        console.info(message, data !== undefined ? data : '');
    }

    /**
     * Log a warning message
     */
    static warn(message: string, data?: any): void {
        this.addLog('warn', message, data);
        console.warn(message, data !== undefined ? data : '');
    }

    /**
     * Log an error message
     */
    static error(message: string, error?: any): void {
        this.addLog('error', message, error);
        console.error(message, error !== undefined ? error : '');
        
        if (error instanceof Error) {
            console.error('Stack trace:', error.stack);
            this.addLog('error', 'Stack trace', error.stack);
        }
    }

    /**
     * Log a debug message (only in debug mode)
     */
    static debug(message: string, data?: any): void {
        if (!this.debugModeEnabled) return;
        
        this.addLog('debug', message, data);
        console.debug(message, data !== undefined ? data : '');
    }

    /**
     * Add a log entry to the internal log store
     */
    private static addLog(level: LogLevel, message: string, data?: any): void {
        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            message,
            data: data !== undefined ? this.safeStringify(data) : undefined
        };
        
        this.logs.push(entry);
        
        // Trim logs if they exceed maximum
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }

    /**
     * Safely convert data to string format
     */
    private static safeStringify(data: any): string {
        try {
            return typeof data === 'object' ? JSON.stringify(data) : String(data);
        } catch (error) {
            return '[Unstringifiable data]';
        }
    }

    /**
     * Get all captured logs
     */
    static getLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * Clear all captured logs
     */
    static clearLogs(): void {
        this.logs = [];
        console.log('Logs cleared');
    }

    /**
     * Export logs to console
     */
    static exportLogs(): void {
        console.log('--- EXPORTED LOGS ---');
        console.log(JSON.stringify(this.logs, null, 2));
        console.log('-------------------');
    }

    /**
     * Display logs in a notice
     */
    static showLogsInNotice(count: number = 10): void {
        const recentLogs = this.logs.slice(-count);
        let message = `Recent ${count} logs:\n\n`;
        
        for (const log of recentLogs) {
            const time = log.timestamp.toLocaleTimeString();
            message += `[${time}] [${log.level}] ${log.message}\n`;
        }
        
        new Notice(message);
    }

    /**
     * Handle uncaught exceptions
     */
    static captureError(error: Error): void {
        this.error('Uncaught exception', error);
        new Notice(`Error occurred: ${error.message}`);
    }
}

/**
 * Log entry type
 */
interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    data?: string;
}

/**
 * Log level type
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error'; 