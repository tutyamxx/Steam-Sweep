import type { CleanupCandidate } from '../../types/cleanup';

/**
 * Formats a byte value into a human-readable file size.
 *
 * @param bytes - File size in bytes.
 * @returns     Formatted file size.
 */
export const formatBytes = (bytes: number): string => {
    if (!(bytes >= 1)) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const unit = Math.min(Math.floor(Math.log2(bytes) / 10), units.length - 1);
    const value = bytes / 1024 ** unit;

    return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(2)} ${units[unit]}`;
};

/**
 * Returns the display label for a cleanup candidate type.
 *
 * @param candidate - Cleanup candidate to label.
 * @returns         Human-readable cleanup candidate label.
 */
export const getCandidateLabel = (candidate: CleanupCandidate): string => {
    switch (candidate.type) {
        case 'empty-folder':
            return 'Empty folders';
        case 'temp-folder':
            return 'Temporary folders';
        case 'temp-file':
            return 'Temporary files';
        case 'log':
            return 'Logs';
        case 'crash-dump':
            return 'Crash dumps';
        case 'installer':
            return 'Installers';
        case 'backup':
            return 'Backups';
    }
};

/**
 * Minimum width allowed for the application window.
 */
export const minWindowWidth = 900;

/**
 * Minimum height allowed for the application window.
 */
export const minWindowHeight = 650;
