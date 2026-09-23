/**
 * Directory names that commonly contain temporary files.
 * These directories often hold temporary files created during game installation or operation.
 */
export const temporaryDirectoryNames = [
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
 * These directories often contain logs from game runs or system operations.
 */
export const logDirectoryNames = [
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
 * These directories typically contain crash information and diagnostic data.
 */
export const crashDirectoryNames = [
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
 * Common names include common redistributable packages and dependency directories.
 */
export const installerDirectoryNames = [
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
 * These extensions are typically used by applications for temporary storage.
 */
export const temporaryExtensions = [
    '.tmp',
    '.temp',
    '.crdownload'
];

/**
 * File extensions commonly used for crash dumps.
 * These files store memory state information when applications crash.
 */
export const crashDumpExtensions = [
    '.dmp',
    '.mdmp',
    '.hdmp',
    '.wer'
];

/**
 * File extensions commonly used for log files.
 * These are text-based logs that track application behavior and system events.
 */
export const logExtensions = [
    '.log',
    '.txt_log',
    '.trace',
    '.etl'
];

/**
 * File extensions commonly associated with backup files.
 * These files are typically created as copies of original files for recovery purposes.
 */
export const backupExtensions = [
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
 *
 * Patterns match common installer naming conventions like setup.exe, installer.exe, etc.
 */
export const installerPatterns = [
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
 *
 * Patterns match common redistributable packages like DirectX, Visual C++ Redistributables,
 * .NET frameworks, and other system components.
 */
export const installerArchivePatterns = [
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
