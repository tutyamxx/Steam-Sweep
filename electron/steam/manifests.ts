import fs from 'node:fs';
import path from 'node:path';

/**
 * Represents basic installation information extracted from
 * a Steam application manifest.
 *
 * @property appId      - Steam application ID.
 * @property name       - Display name of the installed game.
 * @property installDir - Directory name used for the game installation.
 */
export interface SteamManifest {
    appId: number;
    name: string;
    installDir: string;
}

/**
 * Reads the first quoted value for a key from a manifest's contents.
 *
 * @param contents     - Raw manifest file contents.
 * @param key          - Manifest key to look up (for example `appid`).
 * @param valuePattern - Regular expression source the value must match. Defaults to any non-empty text.
 * @returns            The value, or `undefined` if the key is missing or the value does not match.
 */
const readField = (contents: string, key: string, valuePattern = '[^"]+'): string | undefined => contents.match(new RegExp(`"${key}"\\s+"(${valuePattern})"`))?.[1];

/**
 * Finds and parses Steam application manifest files.
 *
 * Steam stores installed game information in files named
 * appmanifest_<appid>.acf inside each library's steamapps directory.
 *
 * @param steamAppsPath - Absolute path to a library's steamapps directory.
 * @returns             An array of successfully parsed Steam manifests.
 */
export const findSteamManifests = (steamAppsPath: string): SteamManifest[] => {
    if (!fs.existsSync(steamAppsPath)) {
        return [];
    }

    return fs.readdirSync(steamAppsPath)
        .filter((file) => file.startsWith('appmanifest_') && file.endsWith('.acf'))
        .flatMap((file) => {
            try {
                const contents = fs.readFileSync(path.join(steamAppsPath, file), 'utf8');
                const appId = readField(contents, 'appid', '\\d+');
                const name = readField(contents, 'name');
                const installDir = readField(contents, 'installdir');

                return appId && name && installDir ? [{ appId: Number(appId), name, installDir }] : [];
            } catch {
                return [];
            }
        });
};
