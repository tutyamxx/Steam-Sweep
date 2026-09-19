/**
 * Directory names that commonly contain temporary files.
 */
const temporaryDirectoryNames = [
    'tmp',
    'temp',
    'temporary',
    'tempfiles',
    'temporaryfiles',
    'deriveddatacache',
    'downloading',
    'temp_download',
    '__installer',
    'dotNetFx'
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
    'debuglogs',
    'gamelogs',
    'savedlogs',
    'steam_logs'
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
    'minidumps',
    'dumps',
    'bugreport',
    'bugreports',
    'telemetry'
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
    'installer',
    '_installer',
    'directx',
    'vcredist',
    'prerequisites',
    'dependencies',
    'support'
];

/**
 * File extensions commonly used for temporary files.
 */
const temporaryExtensions = [
    '.tmp',
    '.temp',
    '.crdownload'
];

/**
 * File extensions commonly used for crash dumps.
 */
const crashDumpExtensions = [
    '.dmp',
    '.mdmp',
    '.hdmp',
    '.wer'
];

/**
 * File extensions commonly used for log files.
 */
const logExtensions = [
    '.log',
    '.txt_log',
    '.trace',
    '.etl'
];

/**
 * File extensions commonly associated with backup files.
 */
const backupExtensions = [
    '.bak',
    '.old',
    '.orig',
    '.backup',
    '.sav.bak',
    '~'
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
    /^installer-.*\.exe$/i,
    /^unins\d{3}\.exe$/i,
    /^dxsetup\.exe$/i,
    /^eawrapperlauncher\.exe$/i,
    /^cleanup\.exe$/i
];

/**
 * Common installer, runtime, driver, and redistributable archive names.
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
    /^oalinst.*\.exe$/i,
    /^openal.*\.(?:exe|msi|zip)$/i,
    /^eadesktop.*\.(?:exe|msi)$/i,
    /^epicgameslauncher.*\.(?:exe|msi)$/i,
    /^ubisoftconnect.*\.(?:exe|msi)$/i,
    /^(?:x64|x86|arm64)_.*redist.*\.(?:exe|msi)$/i
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
