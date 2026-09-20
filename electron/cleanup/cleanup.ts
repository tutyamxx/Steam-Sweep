import { shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { SteamGame } from '../steam/games.js';
import type { CleanupCandidate, CleanupCandidateResult, CleanupResult } from '../../types/cleanup.js';

/**
 * Determines whether a candidate path is inside a Steam game installation.
 *
 * @param candidatePath - Absolute path to the candidate.
 * @param gamePath - Absolute path to the Steam game installation.
 * @returns True when the candidate is inside the game installation.
 */
const isPathInsideGame = (candidatePath: string, gamePath: string): boolean => {
    const normalizedCandidate = path.resolve(candidatePath);
    const normalizedGame = path.resolve(gamePath);
    const relativePath = path.relative(normalizedGame, normalizedCandidate);

    return relativePath !== '' && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath);
};

/**
 * Validates a cleanup candidate before it is moved to the Recycle Bin.
 *
 * @param candidate - Candidate to validate.
 * @param games - Currently discovered Steam games.
 * @returns True when the candidate is safe to process.
 */
const isValidCandidate = (candidate: CleanupCandidate, games: SteamGame[]): boolean => {
    if (!path.isAbsolute(candidate.path) || !fs.existsSync(candidate.path)) {
        return false;
    }

    const game = games.find((steamGame) => steamGame.appId === candidate.gameId && steamGame.name === candidate.gameName);

    if (!game?.installPath) {
        return false;
    }

    if (!isPathInsideGame(candidate.path, game.installPath)) {
        return false;
    }

    try {
        const stats = fs.lstatSync(candidate.path);

        return !stats.isSymbolicLink();
    } catch {
        return false;
    }
};

/**
 * Moves selected cleanup candidates to the Windows Recycle Bin.
 *
 * Candidates are validated against the currently discovered Steam games
 * before they are processed.
 *
 * @param candidates - Candidates selected for cleanup.
 * @param games - Currently discovered Steam games.
 * @returns Individual cleanup results for every requested candidate.
 */
const cleanCandidates = async (candidates: CleanupCandidate[], games: SteamGame[]): Promise<CleanupResult> => {
    const results: CleanupCandidateResult[] = [];

    for (const candidate of candidates) {
        if (!isValidCandidate(candidate, games)) {
            results.push({
                id: candidate.id,
                success: false,
                error: 'Candidate is no longer valid or is outside a Steam game installation.'
            });

            continue;
        }

        try {
            await shell.trashItem(candidate.path);

            results.push({
                id: candidate.id,
                success: true
            });
        } catch (error) {
            results.push({
                id: candidate.id,
                success: false,
                error: error instanceof Error ? error.message : 'Failed to move item to the Recycle Bin.'
            });
        }
    }

    return {
        results
    };
};

export { cleanCandidates };
