import fs from 'node:fs';
import path from 'node:path';

/**
 * Represents a Steam library installed on the filesystem.
 *
 * @property path          - Absolute path to the Steam library.
 * @property steamAppsPath - Absolute path to the library's steamapps directory.
 */
interface SteamLibrary {
    path: string;
    steamAppsPath: string;
}

/**
 * Finds all Steam libraries registered with Steam.
 *
 * Steam stores library locations in steamapps/libraryfolders.vdf.
 * This allows SteamSweep to discover libraries on different
 * drives and in non-standard directories.
 *
 * @param steamPath - Absolute path to the main Steam installation.
 * @returns         An array containing all discovered Steam libraries.
 */
export const findSteamLibraries = (steamPath: string): SteamLibrary[] => {
    const libraries = new Map<string, SteamLibrary>();

    /**
     * Adds a Steam library when its steamapps directory exists.
     *
     * @param libraryPath - Absolute path to the Steam library.
     */
    const addLibrary = (libraryPath: string): void => {
        const normalisedPath = path.normalize(libraryPath);
        const steamAppsPath = path.join(normalisedPath, 'steamapps');

        if (!fs.existsSync(steamAppsPath)) {
            return;
        }

        libraries.set(normalisedPath.toLowerCase(), {
            path: normalisedPath,
            steamAppsPath
        });
    };

    addLibrary(steamPath);

    const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');

    if (!fs.existsSync(libraryFoldersPath)) {
        return [...libraries.values()];
    }

    const contents = fs.readFileSync(libraryFoldersPath, 'utf8');
    const pathMatches = contents.matchAll(/"path"\s+"([^"]+)"/gi);

    for (const match of pathMatches) {
        const libraryPath = match?.[1];

        if (libraryPath) {
            addLibrary(libraryPath);
        }
    }

    return [...libraries.values()];
};

export type { SteamLibrary };
