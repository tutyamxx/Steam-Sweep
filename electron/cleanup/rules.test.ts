import {
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
} from './rules.js';

describe('cleanup patterns', () => {
    describe('directory names', () => {
        it('should contain common temporary directory names', () => {
            expect(temporaryDirectoryNames).toEqual(expect.arrayContaining([
                'tmp',
                'temp',
                'temporary',
                'tempfiles',
                'temporaryfiles',
                'deriveddatacache',
                'downloading',
                'temp_download',
                '__installer',
                'dotNetFx',
                'webcache',
                'cef_cache'
            ]));
        });

        it('should contain common log directory names', () => {
            expect(logDirectoryNames).toEqual(expect.arrayContaining([
                'log',
                'logs',
                'crashlogs',
                'crash-reports',
                'crashreports',
                'debuglogs',
                'gamelogs',
                'savedlogs',
                'steam_logs'
            ]));
        });

        it('should contain common crash directory names', () => {
            expect(crashDirectoryNames).toEqual(expect.arrayContaining([
                'crash',
                'crashes',
                'crashdump',
                'crashdumps',
                'minidump',
                'minidumps',
                'dumps',
                'bugreport',
                'bugreports',
                'telemetry',
                'reports',
                'wer'
            ]));
        });

        it('should contain common installer directory names', () => {
            expect(installerDirectoryNames).toEqual(expect.arrayContaining([
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
            ]));
        });

        it('should not contain duplicate entries', () => {
            const lists = [
                temporaryDirectoryNames,
                logDirectoryNames,
                crashDirectoryNames,
                installerDirectoryNames
            ];

            for (const list of lists) {
                expect(new Set(list).size).toBe(list.length);
            }
        });
    });

    describe('file extensions', () => {
        it('should contain common temporary file extensions', () => {
            expect(temporaryExtensions).toEqual(expect.arrayContaining([
                '.tmp',
                '.temp',
                '.crdownload',
                '.part',
                '.download',
                '.pake',
                '_tmp'
            ]));
        });

        it('should contain common crash dump extensions', () => {
            expect(crashDumpExtensions).toEqual(expect.arrayContaining([
                '.dmp',
                '.mdmp',
                '.hdmp',
                '.wer'
            ]));
        });

        it('should contain common log file extensions', () => {
            expect(logExtensions).toEqual(expect.arrayContaining([
                '.log',
                '.txt_log',
                '.trace',
                '.etl',
                '.out',
                '.err'
            ]));
        });

        it('should contain common backup file extensions', () => {
            expect(backupExtensions).toEqual(expect.arrayContaining([
                '.bak',
                '.old',
                '.orig',
                '.backup',
                '.sav.bak',
                '~'
            ]));
        });

        it('should not contain duplicate entries', () => {
            const lists = [
                temporaryExtensions,
                crashDumpExtensions,
                logExtensions,
                backupExtensions
            ];

            for (const list of lists) {
                expect(new Set(list).size).toBe(list.length);
            }
        });
    });

    describe('installer patterns', () => {
        it('should match common standalone installer executables', () => {
            const installerNames = [
                'setup.exe',
                'installer.exe',
                'install.exe',
                'setup-game.exe',
                'installer-game.exe',
                'unins001.exe',
                'dxsetup.exe',
                'eawrapperlauncher.exe',
                'cleanup.exe'
            ];

            for (const installerName of installerNames) {
                expect(installerPatterns.some((pattern) => pattern.test(installerName))).toBe(true);
            }
        });

        it('should match installer names case-insensitively', () => {
            const installerNames = [
                'SETUP.EXE',
                'Installer.exe',
                'UNINS000.exe'
            ];

            for (const installerName of installerNames) {
                expect(installerPatterns.some((pattern) => pattern.test(installerName))).toBe(true);
            }
        });

        it('should not match unrelated executable files', () => {
            const executableNames = [
                'game.exe',
                'launcher.exe',
                'steam.exe',
                'client.exe',
                'setup.dll',
                'unins1.exe'
            ];

            for (const executableName of executableNames) {
                expect(installerPatterns.some((pattern) => pattern.test(executableName))).toBe(false);
            }
        });

        it('should not contain duplicate patterns', () => {
            const patterns = installerPatterns.map((pattern) => String(pattern));

            expect(new Set(patterns).size).toBe(patterns.length);
        });
    });

    describe('installer archive patterns', () => {
        it('should match common redistributable installers', () => {
            const installerNames = [
                'directx.exe',
                'directx_jun2010.exe',
                'dxsetup.exe',
                'vcredist.exe',
                'vc_redist.x64.exe',
                'dotnet.exe',
                'physx.exe',
                'xna.exe',
                'oalinst.exe',
                'openal.exe',
                'eadesktop.exe',
                'epicgameslauncher.exe',
                'ubisoftconnect.exe',
                'x64_redist.exe',
                'gfwlivesetup.exe',
                'rgsc.exe',
                'flashplayer.exe',
                '7z.exe',
                '7z2301-x64.exe',
                'winrar.exe',
                'winrar-x64-701.exe'
            ];

            for (const installerName of installerNames) {
                expect(installerArchivePatterns.some((pattern) => pattern.test(installerName))).toBe(true);
            }
        });

        it('should match archive and package extensions where allowed', () => {
            const installerNames = [
                'directx.cab',
                'directx.zip',
                'dotnet.zip',
                'openal.zip',
                'vcredist.msi',
                'x86_vcredist.msi',
                'arm64_redist.exe'
            ];

            for (const installerName of installerNames) {
                expect(installerArchivePatterns.some((pattern) => pattern.test(installerName))).toBe(true);
            }
        });

        it('should match engine prerequisite and runtime installers', () => {
            const installerNames = [
                'UE4PrereqSetup_x64.exe',
                'UE5PrereqSetup_x64.exe',
                'UEPrereqSetup_x64.exe',
                'dxwebsetup.exe',
                'DXWebSetup.exe',
                'NDP452-KB2901954-Web.exe',
                'ndp48-x86-x64-allos-enu.exe',
                'VulkanRT-1.3.268.0-Installer.exe'
            ];

            for (const installerName of installerNames) {
                expect(installerArchivePatterns.some((pattern) => pattern.test(installerName))).toBe(true);
            }
        });

        it('should match common uninstaller executables', () => {
            const uninstallerNames = [
                'uninstall.exe',
                'uninst.exe',
                'UNINSTALL.EXE'
            ];

            for (const uninstallerName of uninstallerNames) {
                expect(installerArchivePatterns.some((pattern) => pattern.test(uninstallerName))).toBe(true);
            }
        });

        it('should match Unity crash handler executables', () => {
            const crashHandlerNames = [
                'UnityCrashHandler64.exe',
                'UnityCrashHandler32.exe',
                'unitycrashhandler64.exe'
            ];

            for (const crashHandlerName of crashHandlerNames) {
                expect(installerArchivePatterns.some((pattern) => pattern.test(crashHandlerName))).toBe(true);
            }
        });

        it('should not match unrelated archives or executables', () => {
            const fileNames = [
                'game.exe',
                'game.zip',
                'readme.txt',
                'launcher.exe',
                'steam_api64.dll',
                'winrar.zip',
                '7z.dll',
                'flashplayer.txt',
                'prereqsetup.exe',
                'dxwebsetup.dll',
                'ndp.exe',
                'vulkaninfo.exe',
                'uninstaller.exe',
                'unins.exe',
                'UnityCrashHandler.exe',
                'UnityPlayer.dll'
            ];

            for (const fileName of fileNames) {
                expect(installerArchivePatterns.some((pattern) => pattern.test(fileName))).toBe(false);
            }
        });

        it('should not contain duplicate patterns', () => {
            const patterns = installerArchivePatterns.map((pattern) => String(pattern));

            expect(new Set(patterns).size).toBe(patterns.length);
        });
    });
});
