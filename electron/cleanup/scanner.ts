import path from 'node:path';
import fs from 'node:fs';
import type { SteamGame } from '../steam/games.js';
import type { CleanupCandidate } from '../../types/cleanup.js';

import {
    getDirectorySize,
    getFileSize,
    isDirectoryEmpty,
    isDirectoryReadOnly
} from '../utils/utils.js';

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

const fileRules: {
	extensions: string[];
	type: CleanupCandidate['type'];
	confidence: CleanupCandidate['confidence'];
	reason: string;
}[] = [
    {
        extensions: temporaryExtensions,
        type: 'temp-file',
        confidence: 'safe',
        reason: 'Temporary file inside a Steam game installation.'
    },
    {
        extensions: crashDumpExtensions,
        type: 'crash-dump',
        confidence: 'safe',
        reason: 'Crash dump inside a Steam game installation.'
    },
    {
        extensions: logExtensions,
        type: 'log',
        confidence: 'review',
        reason: 'Log file inside a Steam game installation.'
    },
    {
        extensions: backupExtensions,
        type: 'backup',
        confidence: 'review',
        reason: 'Backup file inside a Steam game installation.'
    }
];

const directoryRules: {
	names: string[];
	type: CleanupCandidate['type'];
	confidence: CleanupCandidate['confidence'];
	reason: string;
}[] = [
    {
        names: temporaryDirectoryNames,
        type: 'temp-folder',
        confidence: 'safe',
        reason: 'Temporary directory inside a Steam game installation.'
    },
    {
        names: logDirectoryNames,
        type: 'log',
        confidence: 'review',
        reason: 'Log directory inside a Steam game installation.'
    },
    {
        names: crashDirectoryNames,
        type: 'crash-dump',
        confidence: 'review',
        reason: 'Crash report directory inside a Steam game installation.'
    },
    {
        names: installerDirectoryNames,
        type: 'installer',
        confidence: 'review',
        reason: 'Directory commonly used for installers or redistributables.'
    }
];

/**
 * Scans an installed Steam game for potentially unnecessary files and folders.
 *
 * The scanner is read-only and never modifies the filesystem.
 *
 * @param game - Installed Steam game to scan.
 * @returns    Cleanup candidates discovered inside the game directory.
 */
export const scanGame = (game: SteamGame): CleanupCandidate[] => {
    const candidates: CleanupCandidate[] = [];

    if (!fs.existsSync(game.installPath)) {
        return candidates;
    }

    /**
     * Adds a cleanup candidate to the result list.
     *
     * @param candidatePath - Absolute path to the candidate.
     * @param type          - Cleanup candidate type.
     * @param size          - Candidate size in bytes.
     * @param confidence    - Candidate confidence level.
     * @param reason        - Explanation shown to the user.
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
        const size = getFileSize(filePath);

        if (size === null) {
            return;
        }

        const rule = fileRules.find((fileRule) => fileRule.extensions.includes(extension));

        if (rule) {
            addCandidate(filePath, rule.type, size, rule.confidence, rule.reason);

            return;
        }

        if (installerPatterns.some((pattern) => pattern.test(lowerCaseName))) {
            addCandidate(filePath, 'installer', size, 'review', 'Executable appears to be a standalone installer.');

            return;
        }

        if (installerArchivePatterns.some((pattern) => pattern.test(lowerCaseName))) {
            addCandidate(filePath, 'installer', size, 'review', 'File appears to be a bundled installer or redistributable.');
        }
    };

    /**
     * Processes a discovered directory.
     *
     * @param entry         - Filesystem directory entry.
     * @param directoryPath - Absolute path to the directory.
     */
    const scanDirectoryEntry = (entry: fs.Dirent, directoryPath: string): void => {
        const directoryName = entry.name.toLowerCase();
        const rule = directoryRules.find((directoryRule) => directoryRule.names.includes(directoryName));

        if (rule) {
            const size = getDirectorySize(directoryPath);

            if (size !== null) {
                addCandidate(directoryPath, rule.type, size, rule.confidence, rule.reason);
            }

            return;
        }

        if (isDirectoryEmpty(directoryPath) && !isDirectoryReadOnly(directoryPath)) {
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
