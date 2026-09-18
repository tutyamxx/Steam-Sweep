import type { CleanupCandidate, CleanupResult } from '../../electron/cleanup/types.js';

/**
 * Represents an installed Steam game returned by the Electron process.
 */
interface SteamGame {
	appId: number;
	name: string;
	installPath: string;
	libraryPath: string;
}

/**
 * Represents a Steam library returned by the Electron process.
 */
interface SteamLibrary {
	path: string;
	steamAppsPath: string;
}

/**
 * Data returned by the Steam scan operation.
 *
 * @property steamPath - Absolute path to the main Steam installation.
 * @property libraries - Steam libraries discovered on the system.
 * @property games - Installed Steam games discovered across all libraries.
 * @property candidates - Potentially unnecessary files and folders discovered during the scan.
 */
interface SteamScanResult {
	steamPath: string | null;
	libraries: SteamLibrary[];
	games: SteamGame[];
	candidates: CleanupCandidate[];
}

/**
 * Controls exposed for the Electron application window.
 */
interface SteamWindowApi {
	/**
	 * Minimizes the application window.
	 */
	minimize: () => void;

	/**
	 * Closes the application window.
	 */
	close: () => void;

	/**
	 * Opens a filesystem folder in Windows Explorer.
	 *
	 * @param folderPath - Absolute path to the folder to open.
	 */
	openFolder: (folderPath: string) => void;
}

/**
 * API exposed to the renderer process through Electron's context bridge.
 */
interface SteamSweepApi {
	scan: () => Promise<SteamScanResult>;
	clean: (candidateIds: string[]) => Promise<CleanupResult>;
	openRepository: () => void;

	window: SteamWindowApi;
}

declare global {
	interface Window {
		steamSweep: SteamSweepApi;
	}
}

export type { SteamGame, SteamLibrary, SteamScanResult, CleanupCandidate, CleanupResult };

export {};
