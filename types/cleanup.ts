/**
 * Types of unnecessary files or folders that SteamSweep can detect.
 */
export type CleanupType =
	| 'empty-folder'
	| 'temp-folder'
	| 'temp-file'
	| 'log'
	| 'crash-dump'
	| 'installer'
	| 'backup';

/**
 * Confidence level assigned to a cleanup candidate.
 */
export type Confidence = 'safe' | 'review';

/**
 * Represents a file or folder that SteamSweep believes may be removable.
 */
export interface CleanupCandidate {
    id: string;
    gameId: number | null;
    gameName: string;
    path: string;
    type: CleanupType;
    size: number;
    confidence: Confidence;
    reason: string;
}

/**
 * Represents the result of attempting to clean one candidate.
 */
export interface CleanupCandidateResult {
    id: string;
    success: boolean;
    error?: string;
}

/**
 * Represents the result of a cleanup operation.
 */
export interface CleanupResult {
    results: CleanupCandidateResult[];
}
