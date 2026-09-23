import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * Calculates the size of a file.
 *
 * @param filePath - Absolute path to the file.
 * @returns        File size in bytes, or `null` if the file cannot be read.
 */
export const getFileSize = (filePath: string): number | null => {
    try {
        return fs.statSync(filePath).size;
    } catch {
        return null;
    }
};

/**
 * Calculates the total size of a directory recursively.
 *
 * @param directoryPath - Absolute path to the directory.
 * @returns             Total size of all files below the directory, or `null` if the directory cannot be read.
 */
export const getDirectorySize = (directoryPath: string): number | null => {
    let totalSize = 0;

    try {
        const entries = fs.readdirSync(directoryPath, {
            withFileTypes: true
        });

        for (const entry of entries) {
            const entryPath = `${directoryPath}/${entry.name}`;

            if (entry.isSymbolicLink()) {
                continue;
            }

            if (entry.isDirectory()) {
                const size = getDirectorySize(entryPath);

                if (size === null) {
                    return null;
                }

                totalSize += size;
                continue;
            }

            if (entry.isFile()) {
                const size = getFileSize(entryPath);

                if (size === null) {
                    return null;
                }

                totalSize += size;
            }
        }
    } catch {
        return null;
    }

    return totalSize;
};

/**
 * Checks whether a directory contains no entries.
 *
 * @param directoryPath - Absolute path to the directory.
 * @returns             True when the directory is empty.
 */
export const isDirectoryEmpty = (directoryPath: string): boolean => {
    try {
        return fs.readdirSync(directoryPath).length === 0;
    } catch {
        return false;
    }
};

/**
 * Checks whether a directory has the Windows read-only attribute.
 *
 * @param directoryPath - Absolute path to the directory.
 * @returns             True when the directory has the read-only attribute.
 */
export const isDirectoryReadOnly = (directoryPath: string): boolean => {
    try {
        const output = execFileSync('attrib', [directoryPath], {
            encoding: 'utf8',
            windowsHide: true
        });
        const attributes = output.trim().split(/\s+/)[0] ?? '';

        return attributes.toUpperCase().includes('R');
    } catch {
        return false;
    }
};

/**
 * Resolves a filesystem path using the casing stored by Windows.
 *
 * @param filePath - Absolute filesystem path.
 * @returns        The path with the filesystem's actual casing, or the original path if it cannot be resolved.
 */
export const resolveActualPath = (filePath: string): string => {
    try {
        return fs.realpathSync.native(path.normalize(filePath));
    } catch {
        return filePath;
    }
};
