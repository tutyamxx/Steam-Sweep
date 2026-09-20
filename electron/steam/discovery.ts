import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Resolves a filesystem path using the casing stored by Windows.
 *
 * @param filePath - Absolute filesystem path.
 * @returns The path with the filesystem's actual casing, or the original path if it cannot be resolved.
 */
const resolveActualPath = (filePath: string): string => {
    try {
        return fs.realpathSync.native(path.normalize(filePath));
    } catch {
        return filePath;
    }
};

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
    const registrySteamPath = findSteamPathFromRegistry();

    if (registrySteamPath && fs.existsSync(registrySteamPath)) {
        return resolveActualPath(registrySteamPath);
    }

    const fallbackPaths = [process.env.ProgramFiles, process.env['ProgramFiles(x86)']]
        .filter((steamRoot): steamRoot is string => Boolean(steamRoot))
        .map((programFilesPath) => path.join(programFilesPath, 'Steam'));

    for (const steamPath of fallbackPaths) {
        if (fs.existsSync(steamPath)) {
            return resolveActualPath(steamPath);
        }
    }

    return null;
};

/**
 * Attempts to retrieve Steam's installation path from the Windows registry.
 *
 * Steam may store its installation information in the current user's registry
 * hive or in the machine-wide 32-bit/64-bit registry locations.
 *
 * @returns A valid Steam installation path, or `null` if none could be found.
 */
const findSteamPathFromRegistry = (): string | null => {
    const registryLocations = [
        ['HKCU\\Software\\Valve\\Steam', 'SteamPath'],
        ['HKCU\\Software\\Valve\\Steam', 'SteamExe'],
        ['HKLM\\Software\\Valve\\Steam', 'InstallPath'],
        ['HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam', 'InstallPath']
    ] as const;

    for (const [key, valueName] of registryLocations) {
        try {
            const output = execFileSync('reg', ['query', key, '/v', valueName], {
                encoding: 'utf8',
                windowsHide: true
            });
            const match = output.match(new RegExp(`${valueName}\\s+REG_\\w+\\s+(.+)`, 'i'));

            if (!match?.[1]) {
                continue;
            }

            const value = match?.[1]?.trim().replaceAll('/', '\\');
            const steamPath = valueName === 'SteamExe' ? path.dirname(value) : value;

            if (fs.existsSync(path.join(steamPath, 'steam.exe'))) {
                return resolveActualPath(steamPath);
            }
        } catch {
            continue;
        }
    }

    return null;
};
