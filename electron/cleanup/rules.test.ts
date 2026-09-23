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
                'dotNetFx'
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
                'telemetry'
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
    });

    describe('file extensions', () => {
        it('should contain common temporary file extensions', () => {
            expect(temporaryExtensions).toEqual(expect.arrayContaining([
                '.tmp',
                '.temp',
                '.crdownload'
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
                '.etl'
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

        it('should not match unrelated executable files', () => {
            const executableNames = [
                'game.exe',
                'launcher.exe',
                'steam.exe',
                'client.exe'
            ];

            for (const executableName of executableNames) {
                expect(installerPatterns.some((pattern) => pattern.test(executableName))).toBe(false);
            }
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
                'x64_redist.exe'
            ];

            for (const installerName of installerNames) {
                expect(installerArchivePatterns.some((pattern) => pattern.test(installerName))).toBe(true);
            }
        });

        it('should not match unrelated archives or executables', () => {
            const fileNames = [
                'game.exe',
                'game.zip',
                'readme.txt',
                'launcher.exe',
                'steam_api64.dll'
            ];

            for (const fileName of fileNames) {
                expect(installerArchivePatterns.some((pattern) => pattern.test(fileName))).toBe(false);
            }
        });
    });
});
