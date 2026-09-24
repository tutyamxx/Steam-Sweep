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
interface RuleResult {
    type: CleanupCandidate['type'];
    confidence: CleanupCandidate['confidence'];
    reason: string;
}

/**
 * A rule matched by exact key (file extension or directory name).
 */
interface KeyedRule extends RuleResult {
    keys: string[];
}

/**
 * A rule matched by regular expressions against the lowercase file name.
 */
interface PatternRule extends RuleResult {
    patterns: RegExp[];
}

/**
 * Builds a consistent reason string for entries found inside a game installation.
 *
 * @param subject - What was found, e.g. "Temporary file".
 * @returns       - Reason shown to the user.
 */
const inGame = (subject: string): string => `${subject} inside a Steam game installation.`;

/**
 * Compiles keyed rules into a Map for O(1) lookups.
 * Earlier rules win when the same key appears more than once.
 *
 * @param rules - Rules in priority order.
 * @returns     - Lookup table from key to rule result.
 */
const buildLookup = (rules: KeyedRule[]): Map<string, RuleResult> => {
    const lookup = new Map<string, RuleResult>();

    for (const { keys, ...result } of rules) {
        for (const key of keys) {
            if (!lookup.has(key)) {
                lookup.set(key, result);
            }
        }
    }

    return lookup;
};

const fileRulesByExtension = buildLookup([
    { keys: temporaryExtensions, type: 'temp-file', confidence: 'safe', reason: inGame('Temporary file') },
    { keys: crashDumpExtensions, type: 'crash-dump', confidence: 'safe', reason: inGame('Crash dump') },
    { keys: logExtensions, type: 'log', confidence: 'review', reason: inGame('Log file') },
    { keys: backupExtensions, type: 'backup', confidence: 'review', reason: inGame('Backup file') }
]);

const directoryRulesByName = buildLookup([
    { keys: temporaryDirectoryNames, type: 'temp-folder', confidence: 'safe', reason: inGame('Temporary directory') },
    { keys: logDirectoryNames, type: 'log', confidence: 'review', reason: inGame('Log directory') },
    { keys: crashDirectoryNames, type: 'crash-dump', confidence: 'review', reason: inGame('Crash report directory') },
    { keys: installerDirectoryNames, type: 'installer', confidence: 'review', reason: 'Directory commonly used for installers or redistributables.' }
]);

const installerPatternRules: PatternRule[] = [
    { patterns: installerPatterns, type: 'installer', confidence: 'review', reason: 'Executable appears to be a standalone installer.' },
    { patterns: installerArchivePatterns, type: 'installer', confidence: 'review', reason: 'File appears to be a bundled installer or redistributable.' }
];

const emptyFolderResult: RuleResult = {
    type: 'empty-folder',
    confidence: 'safe',
    reason: inGame('Empty directory')
};

/**
 * Finds the cleanup rule for a file, cheapest checks first.
 *
 * @param lowerCaseName - Lowercase file name.
 * @returns             - Matching rule result, if any.
 */
const matchFile = (lowerCaseName: string): RuleResult | undefined => {
    const extensionRule = fileRulesByExtension.get(path.extname(lowerCaseName));

    if (extensionRule) {
        return extensionRule;
    }

    for (const rule of installerPatternRules) {
        for (const pattern of rule.patterns) {
            if (pattern.test(lowerCaseName)) {
                return rule;
            }
        }
    }

    return undefined;
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

    /**
     * Adds a cleanup candidate to the result list.
     *
     * @param candidatePath - Absolute path to the candidate.
     * @param size          - Candidate size in bytes.
     * @param result        - Type, confidence and reason to report.
     */
    const addCandidate = (candidatePath: string, size: number, { type, confidence, reason }: RuleResult): void => {
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
        const rule = matchFile(fileName.toLowerCase());

        if (!rule) {
            return;
        }

        const size = getFileSize(filePath);

        if (size !== null) {
            addCandidate(filePath, size, rule);
        }
    };

    /**
     * Processes a discovered directory: reports it if it matches a rule or is empty,
     * otherwise recurses into it.
     *
     * @param directoryName - Directory name.
     * @param directoryPath - Absolute path to the directory.
     */
    const scanDirectoryEntry = (directoryName: string, directoryPath: string): void => {
        const rule = directoryRulesByName.get(directoryName.toLowerCase());

        if (rule) {
            const size = getDirectorySize(directoryPath);

            if (size !== null) {
                addCandidate(directoryPath, size, rule);
            }

            return;
        }

        if (isDirectoryEmpty(directoryPath) && !isDirectoryReadOnly(directoryPath)) {
            addCandidate(directoryPath, 0, emptyFolderResult);

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
            if (entry.isSymbolicLink()) {
                continue;
            }

            const entryPath = directoryPath + path.sep + entry.name;

            if (entry.isDirectory()) {
                scanDirectoryEntry(entry.name, entryPath);
            } else if (entry.isFile()) {
                scanFileEntry(entry.name, entryPath);
            }
        }
    };

    scanDirectory(game.installPath);

    return candidates;
};
