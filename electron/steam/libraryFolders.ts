import fs from 'node:fs';
import path from 'node:path';

/**
 * Represents a Steam library installed on the filesystem.
 *
 * @property path          - Absolute path to the Steam library.
 * @property steamAppsPath - Absolute path to the library's steamapps directory.
 */
export interface SteamLibrary {
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
    const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
    let contents = '';

    try {
        contents = fs.existsSync(libraryFoldersPath) ? fs.readFileSync(libraryFoldersPath, 'utf8') : '';
    } catch {
        // --| Unreadable file: only the main Steam library is checked.
    }

    const registeredPaths = Array.from(contents.matchAll(/"path"\s+"([^"]+)"/gi), (match) => match?.[1])
        .filter((libraryPath): libraryPath is string => Boolean(libraryPath));
    const libraries = new Map<string, SteamLibrary>();

    for (const libraryPath of [steamPath, ...registeredPaths]) {
        const normalisedPath = path.normalize(libraryPath);
        const steamAppsPath = path.join(normalisedPath, 'steamapps');

        if (fs.existsSync(steamAppsPath)) {
            libraries.set(normalisedPath.toLowerCase(), { path: normalisedPath, steamAppsPath });
        }
    }

    return [...libraries.values()];
};
