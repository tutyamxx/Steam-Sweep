import fs from 'node:fs';
import path from 'node:path';
import type { SteamGame } from '../steam/games.js';
import type { CleanupCandidate } from './types.js';
import {
    backupExtensions,
    crashDirectoryNames,
    crashDumpExtensions,
    installerArchivePatterns,
    installerDirectoryNames,
    installerPatterns,
    logDirectoryNames,
    logExtensions,
    temporaryDirectoryNames,
    temporaryExtensions
} from './rules.js';

/**
 * Scans an installed Steam game for potentially unnecessary files and folders.
 *
 * The scanner is read-only and never modifies the filesystem.
 *
 * @param game - Installed Steam game to scan.
 * @returns Cleanup candidates discovered inside the game directory.
 */
const scanGame = (game: SteamGame): CleanupCandidate[] => {
    const candidates: CleanupCandidate[] = [];

    if (!fs.existsSync(game.installPath)) {
        return candidates;
    }

    /**
	 * Adds a cleanup candidate to the result list.
	 *
	 * @param candidatePath - Absolute path to the candidate.
	 * @param type - Cleanup candidate type.
	 * @param size - Candidate size in bytes.
	 * @param confidence - Candidate confidence level.
	 * @param reason - Explanation shown to the user.
	 */
    const addCandidate = (
        candidatePath: string,
        type: CleanupCandidate['type'],
        size: number,
        confidence: CleanupCandidate['confidence'],
        reason: string
    ): void => {
        candidates.push({
            id: candidatePath,
            gameId: game.appId,
            gameName: game.name,
            path: candidatePath,
            type,
            size,
            confidence,
            reason
        });
    };

    /**
	 * Processes a discovered file.
	 *
	 * @param fileName - Filename.
	 * @param filePath - Absolute path to the file.
	 */
    const scanFileEntry = (fileName: string, filePath: string): void => {
        const lowerCaseName = fileName.toLowerCase();
        const extension = path.extname(lowerCaseName);

        if (temporaryExtensions.includes(extension)) {
            addCandidate(filePath, 'temp-file', getFileSize(filePath), 'safe', 'Temporary file inside a Steam game installation.');

            return;
        }

        if (crashDumpExtensions.includes(extension)) {
            addCandidate(filePath, 'crash-dump', getFileSize(filePath), 'safe', 'Crash dump inside a Steam game installation.');

            return;
        }

        if (logExtensions.includes(extension)) {
            addCandidate(filePath, 'log', getFileSize(filePath), 'review', 'Log file inside a Steam game installation.');

            return;
        }

        if (backupExtensions.includes(extension)) {
            addCandidate(filePath, 'backup', getFileSize(filePath), 'review', 'Backup file inside a Steam game installation.');

            return;
        }

        if (installerPatterns.some((pattern) => pattern.test(lowerCaseName))) {
            addCandidate(filePath, 'installer', getFileSize(filePath), 'review', 'Executable appears to be a standalone installer.');

            return;
        }

        if (installerArchivePatterns.some((pattern) => pattern.test(lowerCaseName))) {
            addCandidate(filePath, 'installer', getFileSize(filePath), 'review', 'File appears to be a bundled installer or redistributable.');
        }
    };

    /**
	 * Processes a discovered directory.
	 *
	 * @param entry - Filesystem directory entry.
	 * @param directoryPath - Absolute path to the directory.
	 */
    const scanDirectoryEntry = (entry: fs.Dirent, directoryPath: string): void => {
        const directoryName = entry.name.toLowerCase();

        if (temporaryDirectoryNames.includes(directoryName)) {
            addCandidate(directoryPath, 'temp-folder', getDirectorySize(directoryPath), 'safe', 'Temporary directory inside a Steam game installation.');

            return;
        }

        if (logDirectoryNames.includes(directoryName)) {
            addCandidate(directoryPath, 'log', getDirectorySize(directoryPath), 'review', 'Log directory inside a Steam game installation.');

            return;
        }

        if (crashDirectoryNames.includes(directoryName)) {
            addCandidate(directoryPath, 'crash-dump', getDirectorySize(directoryPath), 'review', 'Crash report directory inside a Steam game installation.');

            return;
        }

        if (installerDirectoryNames.includes(directoryName)) {
            addCandidate(directoryPath, 'installer', getDirectorySize(directoryPath), 'review', 'Directory commonly used for installers or redistributables.');

            return;
        }

        if (isDirectoryEmpty(directoryPath)) {
            addCandidate(directoryPath, 'empty-folder', 0, 'safe', 'Empty directory inside a Steam game installation.');

            return;
        }

        scanDirectory(directoryPath);
    };

    /**
	 * Recursively scans a directory.
	 *
	 * @param directoryPath - Absolute path to the directory.
	 */
    const scanDirectory = (directoryPath: string): void => {
        let entries: fs.Dirent[];

        try {
            entries = fs.readdirSync(directoryPath, {
                withFileTypes: true
            });
        } catch {
            return;
        }

        for (const entry of entries) {
            const entryPath = path.join(directoryPath, entry.name);

            if (entry.isSymbolicLink()) {
                continue;
            }

            if (entry.isDirectory()) {
                scanDirectoryEntry(entry, entryPath);
                continue;
            }

            if (entry.isFile()) {
                scanFileEntry(entry.name, entryPath);
            }
        }
    };

    scanDirectory(game.installPath);

    return candidates;
};

/**
 * Calculates the size of a file.
 *
 * @param filePath - Absolute path to the file.
 * @returns File size in bytes, or zero if it cannot be read.
 */
const getFileSize = (filePath: string): number => {
    try {
        return fs.statSync(filePath).size;
    } catch {
        return 0;
    }
};

/**
 * Calculates the total size of a directory recursively.
 *
 * @param directoryPath - Absolute path to the directory.
 * @returns Total size of all files below the directory.
 */
const getDirectorySize = (directoryPath: string): number => {
    let totalSize = 0;

    try {
        const entries = fs.readdirSync(directoryPath, {
            withFileTypes: true
        });

        for (const entry of entries) {
            const entryPath = path.join(directoryPath, entry.name);

            if (entry.isSymbolicLink()) {
                continue;
            }

            if (entry.isDirectory()) {
                totalSize += getDirectorySize(entryPath);
                continue;
            }

            if (entry.isFile()) {
                totalSize += getFileSize(entryPath);
            }
        }
    } catch {
        return totalSize;
    }

    return totalSize;
};

/**
 * Checks whether a directory contains no entries.
 *
 * @param directoryPath - Absolute path to the directory.
 * @returns True when the directory is empty.
 */
const isDirectoryEmpty = (directoryPath: string): boolean => {
    try {
        return fs.readdirSync(directoryPath).length === 0;
    } catch {
        return false;
    }
};

export { scanGame };
