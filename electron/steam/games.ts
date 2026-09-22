import fs from 'node:fs';
import path from 'node:path';
import type { SteamLibrary } from './libraryFolders.js';
import { findSteamManifests } from './manifests.js';

/**
 * Represents an installed Steam game.
 *
 * @property appId       - Steam application ID.
 * @property name        - Display name of the installed game.
 * @property installPath - Absolute path to the game's installation directory.
 * @property libraryPath - Absolute path to the Steam library containing the game.
 */
export interface SteamGame {
    appId: number;
    name: string;
    installPath: string;
    libraryPath: string;
}

/**
 * Finds installed Steam games across all discovered libraries.
 *
 * Steam stores each game's installation directory in its
 * application manifest. The directory is resolved relative
 * to the library's steamapps/common directory.
 *
 * @param libraries - Steam libraries discovered on the system.
 * @returns         An array containing all installed Steam games with valid installation paths.
 */
export const findSteamGames = (libraries: SteamLibrary[]): SteamGame[] => {
    const games: SteamGame[] = [];

    for (const library of libraries) {
        const manifests = findSteamManifests(library.steamAppsPath);

        for (const manifest of manifests) {
            const installPath = manifest.installDir?.trim();

            if (!installPath) {
                continue;
            }

            const gameInstallPath = path.join(library.steamAppsPath, 'common', installPath);

            if (!fs.existsSync(gameInstallPath)) {
                continue;
            }

            games.push({
                appId: manifest.appId,
                name: manifest.name,
                installPath: gameInstallPath,
                libraryPath: library.path
            });
        }
    }

    return games;
};
