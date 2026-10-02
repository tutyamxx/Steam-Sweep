/* eslint-disable no-multi-spaces */
/**
 * Directory names that commonly contain temporary files.
 * These directories often hold temporary files created during game installation or operation.
 */
export const temporaryDirectoryNames = [
    'tmp',              // --| Generic short name for a scratch folder
    'temp',             // --| Generic temp folder
    'temporary',        // --| Long-form spelling of a temp folder
    'tempfiles',        // --| Folder of temp files, named literally
    'temporaryfiles',   // --| Long-form variant of tempfiles
    'deriveddatacache', // --| Unreal Engine derived data cache: regenerable cached asset data
    'downloading',      // --| Staging folder for in-progress downloads (Steam uses steamapps/downloading)
    'temp_download',    // --| Staging folder used by launchers and updaters while downloading
    '__installer',      // --| Scratch folder some installers create while running
    'dotNetFx',         // --| Folder where the .NET Framework installer unpacks (mixed case, unlike the rest)
    'webcache',         // --| Embedded browser web cache
    'cef_cache'         // --| Chromium Embedded Framework cache
];

/**
 * Directory names that commonly contain log files.
 * These directories often contain logs from game runs or system operations.
 */
export const logDirectoryNames = [
    'log',           // --| Generic log folder (singular)
    'logs',          // --| Generic log folder (plural), the most common name
    'crashlogs',     // --| Logs written when the game crashes
    'crash-reports', // --| Hyphenated crash report folder, used by some games
    'crashreports',  // --| Same as crash-reports without the hyphen
    'debuglogs',     // --| Verbose debug output logs
    'gamelogs',      // --| Game-specific runtime logs
    'savedlogs',     // --| Logs saved to disk for later inspection
    'steam_logs'     // --| Logs written by Steam-related components
];

/**
 * Directory names commonly used for crash reports or crash dumps.
 * These directories typically contain crash information and diagnostic data.
 */
export const crashDirectoryNames = [
    'crash',      // --| Generic crash data folder
    'crashes',    // --| Plural variant of crash
    'crashdump',  // --| Crash memory dumps (singular)
    'crashdumps', // --| Crash memory dumps (plural)
    'minidump',   // --| Windows minidumps (singular)
    'minidumps',  // --| Windows minidumps (plural)
    'dumps',      // --| Generic folder of memory dump files
    'bugreport',  // --| Bug report data (singular)
    'bugreports', // --| Bug report data (plural)
    'telemetry',  // --| Collected analytics data, usually cached before upload
    'reports',    // --| Generic reports folder, may hold non-crash data
    'wer'         // --| Windows Error Reporting data
];

/**
 * Directory names commonly used for bundled installers or redistributables.
 *
 * These are treated as review candidates because games may legitimately
 * require these files for installation or repair.
 * Common names include common redistributable packages and dependency directories.
 */
export const installerDirectoryNames = [
    '_commonredist',    // --| Steam's standard folder for redistributables bundled with a game
    'commonredist',     // --| Same as _commonredist without the underscore
    'redist',           // --| Short name for a redistributables folder
    'redistributables', // --| Redistributables folder (plural, long form)
    'redistributable',  // --| Redistributables folder (singular, long form)
    'installers',       // --| Folder of bundled installers (plural)
    'installer',        // --| Folder of bundled installers (singular)
    '_installer',       // --| Underscore-prefixed installer folder
    'directx',          // --| DirectX runtime installers
    'vcredist',         // --| Visual C++ redistributable installers
    'prerequisites',    // --| Prerequisite installers a game needs before first launch
    'dependencies',     // --| Dependency installers, but generic: may hold files the game needs at runtime
    'support'           // --| Support files, but generic: may hold files the game needs at runtime
];

/**
 * File extensions commonly used for temporary files.
 * These extensions are typically used by applications for temporary storage.
 */
export const temporaryExtensions = [
    '.tmp',        // --| Standard temporary file
    '.temp',       // --| Alternate temporary file extension
    '.crdownload', // --| Partial download from Chrome and other Chromium browsers
    '.part',       // --| Partial download, used by several browsers and downloaders
    '.download',   // --| Partial download, used by some browsers and downloaders
    '.pake',       // --| Unconfirmed: worth double-checking this isn't a typo
    '_tmp'         // --| Suffix rather than an extension, as in name_tmp
];

/**
 * File extensions commonly used for crash dumps.
 * These files store memory state information when applications crash.
 */
export const crashDumpExtensions = [
    '.dmp',  // --| Windows memory dump
    '.mdmp', // --| Minidump file
    '.hdmp', // --| Heap dump
    '.wer'   // --| Windows Error Reporting report
];

/**
 * File extensions commonly used for log files.
 * These are text-based logs that track application behavior and system events.
 */
export const logExtensions = [
    '.log',     // --| Standard log file
    '.txt_log', // --| Text log with a suffix-style extension
    '.trace',   // --| Trace output
    '.etl',     // --| Windows Event Trace Log
    '.out',     // --| Captured program output (generic, may match non-log files)
    '.err'      // --| Captured error output
];

/**
 * File extensions commonly associated with backup files.
 * These files are typically created as copies of original files for recovery purposes.
 */
export const backupExtensions = [
    '.bak',     // --| Standard backup copy
    '.old',     // --| Previous version of a file
    '.orig',    // --| Original copy kept by merge and patch tools
    '.backup',  // --| Explicit backup file
    '.sav.bak', // --| Save-file backup, may be the only recovery copy of a save
    '~'         // --| Suffix used by editors for backup copies, as in name.txt~
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
    /^setup\.exe$/i,             // --| setup.exe
    /^installer\.exe$/i,         // --| installer.exe
    /^install\.exe$/i,           // --| install.exe
    /^setup-.*\.exe$/i,          // --| Named setup executables, like setup-game.exe
    /^installer-.*\.exe$/i,      // --| Named installer executables, like installer-game.exe
    /^unins\d{3}\.exe$/i,        // --| Inno Setup uninstallers, like unins000.exe
    /^dxsetup\.exe$/i,           // --| DirectX setup executable
    /^eawrapperlauncher\.exe$/i, // --| EA wrapper executable (unconfirmed: name suggests a launcher, verify)
    /^cleanup\.exe$/i            // --| Generic cleanup executable, may be a game's own tool
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
    /^directx.*\.(?:exe|msi|cab|zip)$/i,                // --| DirectX packages and archives
    /^dxsetup.*\.(?:exe|msi)$/i,                        // --| DirectX setup executables
    /^vcredist.*\.(?:exe|msi)$/i,                       // --| Visual C++ redistributables
    /^vc_redist.*\.(?:exe|msi)$/i,                      // --| Visual C++ redistributables, newer naming
    /^dotnet.*\.(?:exe|msi|zip)$/i,                     // --| .NET installers and archives (also matches dotnet.exe, the runtime host)
    /^physx.*\.(?:exe|msi)$/i,                          // --| NVIDIA PhysX installers
    /^xna.*\.(?:exe|msi)$/i,                            // --| Microsoft XNA Framework redistributables
    /^oalinst.*\.exe$/i,                                // --| OpenAL installer (oalinst.exe)
    /^openal.*\.(?:exe|msi|zip)$/i,                     // --| OpenAL installers and archives
    /^eadesktop.*\.(?:exe|msi)$/i,                      // --| EA app installers
    /^epicgameslauncher.*\.(?:exe|msi)$/i,              // --| Epic Games Launcher installers
    /^ubisoftconnect.*\.(?:exe|msi)$/i,                 // --| Ubisoft Connect installers
    /^(?:x64|x86|arm64)_.*redist.*\.(?:exe|msi)$/i,     // --| Architecture-prefixed redistributables, like x64_vcredist.exe
    /^gfwlivesetup.*\.(?:exe|msi)$/i,                   // --| Games for Windows Live setup
    /^rgsc.*\.(?:exe|msi)$/i,                           // --| Rockstar Games Social Club installers
    /^flashplayer.*\.(?:exe|msi)$/i,                    // --| Flash Player installers (also matches a standalone flashplayer.exe some Flash games run on)
    /^7z.*\.(?:exe|msi)$/i,                             // --| 7-Zip installers (also matches 7za.exe tools some games use)
    /^winrar.*\.exe$/i,                                 // --| WinRAR installers
    /^ue[45]?prereqsetup.*\.exe$/i,                     // --| Unreal Engine prerequisite installers (UE4, UE5)
    /^dxwebsetup\.exe$/i,                               // --| DirectX web installer
    /^ndp\d+.*\.exe$/i,                                 // --| .NET Framework installers, like NDP452-KB2901954-Web.exe
    /^vulkanrt.*\.exe$/i,                               // --| Vulkan runtime installers
    /^unins(?:t|tall)\.exe$/i,                          // --| uninstall.exe and uninst.exe
    /^unitycrashhandler(?:32|64)\.exe$/i                // --| Unity crash handler (32-bit and 64-bit)
];
