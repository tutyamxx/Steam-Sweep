/**
 * Directory names that commonly contain temporary files.
 */
const temporaryDirectoryNames = [
    'tmp',
    'temp',
    'temporary',
    'tempfiles',
    'temporaryfiles'
];

/**
 * Directory names that commonly contain log files.
 */
const logDirectoryNames = [
    'log',
    'logs',
    'crashlogs',
    'crash-reports',
    'crashreports',
    'debuglogs'
];

/**
 * Directory names commonly used for crash reports or crash dumps.
 */
const crashDirectoryNames = [
    'crash',
    'crashes',
    'crashdump',
    'crashdumps',
    'minidump',
    'minidumps'
];

/**
 * Directory names commonly used for bundled installers or redistributables.
 *
 * These are treated as review candidates because games may legitimately
 * require these files for installation or repair.
 */
const installerDirectoryNames = [
    '_commonredist',
    'commonredist',
    'redist',
    'redistributables',
    'redistributable',
    'installers',
    'installer'
];

/**
 * File extensions commonly used for temporary files.
 */
const temporaryExtensions = [
    '.tmp',
    '.temp'
];

/**
 * File extensions commonly used for crash dumps.
 */
const crashDumpExtensions = [
    '.dmp',
    '.mdmp'
];

/**
 * File extensions commonly used for log files.
 */
const logExtensions = [
    '.log'
];

/**
 * File extensions commonly associated with backup files.
 */
const backupExtensions = [
    '.bak',
    '.old'
];

/**
 * Executable filenames commonly associated with standalone installers.
 *
 * These are treated as review candidates rather than automatically safe
 * cleanup targets because some games legitimately ship these files.
 */
const installerPatterns = [
    /^setup\.exe$/i,
    /^installer\.exe$/i,
    /^install\.exe$/i,
    /^setup-.*\.exe$/i,
    /^installer-.*\.exe$/i
];

/**
 * Common installer and redistributable archive names.
 *
 * These are treated as review candidates rather than automatically safe
 * cleanup targets.
 */
const installerArchivePatterns = [
    /^directx.*\.(?:exe|msi|cab|zip)$/i,
    /^dxsetup.*\.(?:exe|msi)$/i,
    /^vcredist.*\.(?:exe|msi)$/i,
    /^vc_redist.*\.(?:exe|msi)$/i,
    /^dotnet.*\.(?:exe|msi|zip)$/i,
    /^physx.*\.(?:exe|msi)$/i,
    /^xna.*\.(?:exe|msi)$/i,
    /^oalinst.*\.exe$/i
];

export {
    temporaryDirectoryNames,
    logDirectoryNames,
    crashDirectoryNames,
    installerDirectoryNames,
    temporaryExtensions,
    crashDumpExtensions,
    logExtensions,
    backupExtensions,
    installerPatterns,
    installerArchivePatterns
};
