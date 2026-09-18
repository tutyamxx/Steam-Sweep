/**
 * Types of unnecessary files or folders that SteamSweep can detect.
 */
type CleanupType =
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
type Confidence = 'safe' | 'review';

/**
 * Represents a file or folder that SteamSweep believes may be removable.
 */
interface CleanupCandidate {
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
interface CleanupCandidateResult {
	id: string;
	success: boolean;
	error?: string;
}

/**
 * Represents the result of a cleanup operation.
 */
interface CleanupResult {
	results: CleanupCandidateResult[];
}

export type {
    CleanupCandidate,
    CleanupCandidateResult,
    CleanupResult,
    CleanupType,
    Confidence
};
