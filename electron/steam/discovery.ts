import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveActualPath } from '../utils/utils.js';

/**
 * Finds the main Steam installation directory on Windows.
 *
 * Steam may be installed on any available drive and does not
 * necessarily use the default installation directory.
 *
 * The Windows registry is checked first because it contains
 * Steam's registered installation path. Program Files locations
 * are used as a fallback.
 *
 * @returns The absolute Steam installation path, or `null` if Steam could not be found.
 */
export const findSteamInstall = (): string | null => {
    const registryPath = findSteamPathFromRegistry();

    if (registryPath) {
        return registryPath;
    }

    const fallbackPath = [process.env.ProgramFiles, process.env['ProgramFiles(x86)']]
        .flatMap((root) => (root ? [path.join(root, 'Steam')] : []))
        .find((candidate) => fs.existsSync(candidate));

    return fallbackPath ? resolveActualPath(fallbackPath) : null;
};

/**
 * Registry locations where Steam's install information may be stored, as `[key, valueName]` pairs, checked in order.
 *
 * - `SteamPath`: Steam directory for the current user.
 * - `SteamExe`: full path to `steam.exe` for the current user (the directory is derived from it).
 * - `InstallPath`: machine-wide install directory, in the native and 32-bit (WOW6432Node) hives.
 */
const STEAM_REGISTRY_LOCATIONS = [
    ['HKCU\\Software\\Valve\\Steam', 'SteamPath'],
    ['HKCU\\Software\\Valve\\Steam', 'SteamExe'],
    ['HKLM\\Software\\Valve\\Steam', 'InstallPath'],
    ['HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam', 'InstallPath']
] as const;

/**
 * Attempts to retrieve Steam's installation path from the Windows registry.
 *
 * Steam may store its installation information in the current user's registry
 * hive or in the machine-wide 32-bit/64-bit registry locations.
 *
 * @returns A valid Steam installation path, or `null` if none could be found.
 */
const findSteamPathFromRegistry = (): string | null => {
    for (const [key, valueName] of STEAM_REGISTRY_LOCATIONS) {
        try {
            const output = execFileSync('reg', ['query', key, '/v', valueName], {
                encoding: 'utf8',
                windowsHide: true,
                stdio: ['ignore', 'pipe', 'ignore']
            });

            const value = output.match(new RegExp(`${valueName}\\s+REG_\\w+\\s+(.+)`, 'i'))?.[1]?.trim();

            if (!value) {
                continue;
            }

            const steamPath = path.normalize(valueName === 'SteamExe' ? path.dirname(value) : value);

            if (fs.existsSync(path.join(steamPath, 'steam.exe'))) {
                return resolveActualPath(steamPath);
            }
        } catch {
            // --| Key/value missing, try the next location
        }
    }

    return null;
};
