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

export type { CleanupCandidate, CleanupType, Confidence };
