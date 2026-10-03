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

/**
 * Describes how a matched entry is reported as a cleanup candidate.
 */
interface CleanupRule {
    type: CleanupCandidate['type'];
    confidence: CleanupCandidate['confidence'];
    reason: string;
}

/**
 * A rule matched by exact key (file extension or directory name).
 */
interface KeyedRule extends CleanupRule {
    keys: string[];
}

/**
 * A rule matched by regular expressions against the lowercase file name.
 */
interface PatternRule extends CleanupRule {
    patterns: RegExp[];
}

/**
 * Builds a consistent reason string for entries found inside a game installation.
 *
 * @param subject - What was found, e.g. "Temporary file".
 * @returns       - Reason shown to the user.
 */
const inGameReason = (subject: string): string => `${subject} inside a Steam game installation.`;

/**
 * Compiles keyed rules into a Map for O(1) lookups.
 * Earlier rules win when the same key appears more than once.
 *
 * @param keyedRules - Rules in priority order.
 * @returns          - Lookup table from key to cleanup rule.
 */
const buildLookup = (keyedRules: KeyedRule[]): Map<string, CleanupRule> => {
    const rulesByKey = new Map<string, CleanupRule>();

    for (const { keys, ...rule } of keyedRules) {
        for (const key of keys) {
            if (!rulesByKey.has(key)) {
                rulesByKey.set(key, rule);
            }
        }
    }

    return rulesByKey;
};

const fileRulesByExtension = buildLookup([
    { keys: temporaryExtensions, type: 'temp-file', confidence: 'safe', reason: inGameReason('Temporary file') },
    { keys: crashDumpExtensions, type: 'crash-dump', confidence: 'safe', reason: inGameReason('Crash dump') },
    { keys: logExtensions, type: 'log', confidence: 'review', reason: inGameReason('Log file') },
    { keys: backupExtensions, type: 'backup', confidence: 'review', reason: inGameReason('Backup file') }
]);

const directoryRulesByName = buildLookup([
    { keys: temporaryDirectoryNames, type: 'temp-folder', confidence: 'safe', reason: inGameReason('Temporary directory') },
    { keys: logDirectoryNames, type: 'log', confidence: 'review', reason: inGameReason('Log directory') },
    { keys: crashDirectoryNames, type: 'crash-dump', confidence: 'review', reason: inGameReason('Crash report directory') },
    { keys: installerDirectoryNames, type: 'installer', confidence: 'review', reason: 'Directory commonly used for installers or redistributables.' }
]);

const installerPatternRules: PatternRule[] = [
    { patterns: installerPatterns, type: 'installer', confidence: 'review', reason: 'Executable appears to be a standalone installer.' },
    { patterns: installerArchivePatterns, type: 'installer', confidence: 'review', reason: 'File appears to be a bundled installer or redistributable.' }
];

const emptyFolderRule: CleanupRule = {
    type: 'empty-folder',
    confidence: 'safe',
    reason: inGameReason('Empty directory')
};

/**
 * Finds the cleanup rule for a file, cheapest checks first.
 *
 * @param lowerCaseFileName - Lowercase file name.
 * @returns                 - Matching cleanup rule, if any.
 */
const matchFile = (lowerCaseFileName: string): CleanupRule | undefined => fileRulesByExtension.get(path.extname(lowerCaseFileName))
    ?? installerPatternRules.find(({ patterns }) => patterns.some((pattern) => pattern.test(lowerCaseFileName)));

/**
 * Builds a cleanup candidate for a matched file or directory.
 *
 * @param game        - Game the entry belongs to.
 * @param entryPath   - Absolute path to the entry.
 * @param sizeInBytes - Entry size in bytes.
 * @param rule        - Type, confidence and reason to report.
 * @returns           - The cleanup candidate.
 */
const toCandidate = (game: SteamGame, entryPath: string, sizeInBytes: number, { type, confidence, reason }: CleanupRule): CleanupCandidate => ({
    id: entryPath,
    gameId: game.appId,
    gameName: game.name,
    path: entryPath,
    type,
    size: sizeInBytes,
    confidence,
    reason
});

/**
 * Reads the entries of a directory.
 *
 * @param directoryPath - Absolute path to the directory.
 * @returns             - The directory entries, or `null` if the directory cannot be read.
 */
const readEntries = (directoryPath: string): fs.Dirent[] | null => {
    try {
        return fs.readdirSync(directoryPath, {
            withFileTypes: true
        });
    } catch {
        return null;
    }
};

/**
 * Scans already-read directory entries and appends matching ones to `candidates`.
 *
 * Files are reported when they match a rule. Directories are reported when they
 * match a rule or are empty, otherwise they are scanned recursively.
 * File sizes are only queried for entries that match a rule.
 *
 * @param game             - Game being scanned.
 * @param directoryPath    - Absolute path to the directory the entries belong to.
 * @param directoryEntries - Entries of the directory.
 * @param candidates       - Result list that discovered candidates are appended to.
 */
const scanEntries = (game: SteamGame, directoryPath: string, directoryEntries: fs.Dirent[], candidates: CleanupCandidate[]): void => {
    for (const entry of directoryEntries) {
        const isFile = entry.isFile();

        if (!isFile && !entry.isDirectory()) {
            continue;
        }

        const entryPath = path.join(directoryPath, entry.name);
        const lowerCaseEntryName = entry.name.toLowerCase();
        const rule = isFile ? matchFile(lowerCaseEntryName) : directoryRulesByName.get(lowerCaseEntryName);

        if (rule) {
            const sizeInBytes = isFile ? getFileSize(entryPath) : getDirectorySize(entryPath);

            if (sizeInBytes !== null) {
                candidates.push(toCandidate(game, entryPath, sizeInBytes, rule));
            }

            continue;
        }

        if (isFile) {
            continue;
        }

        if (isDirectoryEmpty(entryPath) && !isDirectoryReadOnly(entryPath)) {
            candidates.push(toCandidate(game, entryPath, 0, emptyFolderRule));
            continue;
        }

        const childEntries = readEntries(entryPath);

        if (childEntries) {
            scanEntries(game, entryPath, childEntries, candidates);
        }
    }
};

/**
 * Scans an installed Steam game for potentially unnecessary files and folders.
 *
 * The scanner is read-only and never modifies the filesystem.
 * File sizes are only queried for entries that match a rule.
 *
 * @param game - Installed Steam game to scan.
 * @returns    Cleanup candidates discovered inside the game directory.
 */
export const scanGame = (game: SteamGame): CleanupCandidate[] => {
    const candidates: CleanupCandidate[] = [];
    const rootEntries = readEntries(game.installPath);

    if (rootEntries) {
        scanEntries(game, game.installPath, rootEntries, candidates);
    }

    return candidates;
};
