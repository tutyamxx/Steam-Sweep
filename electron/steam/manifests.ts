import fs from 'node:fs';
import path from 'node:path';

/**
 * Represents basic installation information extracted from
 * a Steam application manifest.
 *
 * @property appId - Steam application ID.
 * @property name - Display name of the installed game.
 * @property installDir - Directory name used for the game installation.
 */
interface SteamManifest {
	appId: number;
	name: string;
	installDir: string;
}

/**
 * Finds and parses Steam application manifest files.
 *
 * Steam stores installed game information in files named
 * appmanifest_<appid>.acf inside each library's steamapps directory.
 *
 * @param steamAppsPath - Absolute path to a library's steamapps directory.
 * @returns An array of successfully parsed Steam manifests.
 */
export const findSteamManifests = (steamAppsPath: string): SteamManifest[] => {
    if (!fs.existsSync(steamAppsPath)) {
        return [];
    }

    const files = fs.readdirSync(steamAppsPath);

    return files
        .filter((file) => file.startsWith('appmanifest_') && file.endsWith('.acf'))
        .map((file) => {
            const filePath = path.join(steamAppsPath, file);
            const contents = fs.readFileSync(filePath, 'utf8');

            const appIdMatch = contents.match(/"appid"\s+"(\d+)"/);
            const nameMatch = contents.match(/"name"\s+"([^"]+)"/);
            const installDirMatch = contents.match(/"installdir"\s+"([^"]+)"/);

            if (!appIdMatch?.[1] || !nameMatch?.[1] || !installDirMatch?.[1]) {
                return null;
            }

            return {
                appId: Number(appIdMatch?.[1]),
                name: nameMatch?.[1],
                installDir: installDirMatch?.[1]
            };
        })
        .filter((manifest): manifest is SteamManifest => manifest !== null);
};

export type { SteamManifest };
