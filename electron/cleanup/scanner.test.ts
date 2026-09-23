import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scanGame } from './scanner.js';
import {
    getDirectorySize,
    getFileSize,
    isDirectoryEmpty,
    isDirectoryReadOnly
} from '../utils/utils.js';
import type { SteamGame } from '../steam/games.js';

jest.mock('../utils/utils.js', () => ({
    getDirectorySize: jest.fn(),
    getFileSize: jest.fn(),
    isDirectoryEmpty: jest.fn(),
    isDirectoryReadOnly: jest.fn()
}));

const mockedGetDirectorySize = jest.mocked(getDirectorySize);
const mockedGetFileSize = jest.mocked(getFileSize);
const mockedIsDirectoryEmpty = jest.mocked(isDirectoryEmpty);
const mockedIsDirectoryReadOnly = jest.mocked(isDirectoryReadOnly);

describe('scanGame', () => {
    let temporaryDirectory: string;
    let gamePath: string;
    let game: SteamGame;

    beforeEach(() => {
        temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'steam-sweep-'));
        gamePath = path.join(temporaryDirectory, 'Test Game');
        fs.mkdirSync(gamePath);

        game = {
            appId: 123456,
            name: 'Test Game',
            installPath: gamePath,
            libraryPath: temporaryDirectory
        };

        mockedGetDirectorySize.mockReturnValue(0);
        mockedGetFileSize.mockImplementation((filePath) => fs.statSync(filePath).size);
        mockedIsDirectoryEmpty.mockImplementation((directoryPath) => fs.readdirSync(directoryPath).length === 0);
        mockedIsDirectoryReadOnly.mockReturnValue(false);
    });

    afterEach(() => {
        fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    });

    it('should return no candidates when the game directory does not exist', () => {
        fs.rmSync(gamePath, { recursive: true, force: true });

        expect(scanGame(game)).toEqual([]);
    });

    it('should detect a temporary file', () => {
        const filePath = path.join(gamePath, 'temp.tmp');
        fs.writeFileSync(filePath, 'temporary data');

        const candidates = scanGame(game);

        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toMatchObject({
            id: filePath,
            gameId: game.appId,
            gameName: game.name,
            path: filePath,
            type: 'temp-file',
            confidence: 'safe',
            reason: 'Temporary file inside a Steam game installation.'
        });
    });

    it('should detect a crash dump', () => {
        const filePath = path.join(gamePath, 'crash.dmp');
        fs.writeFileSync(filePath, 'crash data');

        const candidates = scanGame(game);

        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toMatchObject({
            path: filePath,
            type: 'crash-dump',
            confidence: 'safe',
            reason: 'Crash dump inside a Steam game installation.'
        });
    });

    it('should detect a log file as a review candidate', () => {
        const filePath = path.join(gamePath, 'game.log');
        fs.writeFileSync(filePath, 'log data');

        const candidates = scanGame(game);

        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toMatchObject({
            path: filePath,
            type: 'log',
            confidence: 'review',
            reason: 'Log file inside a Steam game installation.'
        });
    });

    it('should detect a backup file as a review candidate', () => {
        const filePath = path.join(gamePath, 'save.bak');
        fs.writeFileSync(filePath, 'backup data');

        const candidates = scanGame(game);

        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toMatchObject({
            path: filePath,
            type: 'backup',
            confidence: 'review',
            reason: 'Backup file inside a Steam game installation.'
        });
    });

    it('should detect a temporary directory', () => {
        const directoryPath = path.join(gamePath, 'temp');
        fs.mkdirSync(directoryPath);

        const candidates = scanGame(game);

        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toMatchObject({
            path: directoryPath,
            type: 'temp-folder',
            confidence: 'safe',
            reason: 'Temporary directory inside a Steam game installation.'
        });
    });

    it('should detect a log directory as a review candidate', () => {
        const directoryPath = path.join(gamePath, 'logs');
        fs.mkdirSync(directoryPath);

        const candidates = scanGame(game);

        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toMatchObject({
            path: directoryPath,
            type: 'log',
            confidence: 'review',
            reason: 'Log directory inside a Steam game installation.'
        });
    });

    it('should detect a crash directory as a review candidate', () => {
        const directoryPath = path.join(gamePath, 'crashdumps');
        fs.mkdirSync(directoryPath);

        const candidates = scanGame(game);

        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toMatchObject({
            path: directoryPath,
            type: 'crash-dump',
            confidence: 'review',
            reason: 'Crash report directory inside a Steam game installation.'
        });
    });

    it('should detect an installer directory as a review candidate', () => {
        const directoryPath = path.join(gamePath, '_commonredist');
        fs.mkdirSync(directoryPath);

        const candidates = scanGame(game);

        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toMatchObject({
            path: directoryPath,
            type: 'installer',
            confidence: 'review',
            reason: 'Directory commonly used for installers or redistributables.'
        });
    });

    it('should detect an empty directory as a safe candidate', () => {
        const directoryPath = path.join(gamePath, 'empty');
        fs.mkdirSync(directoryPath);

        const candidates = scanGame(game);

        expect(mockedIsDirectoryEmpty).toHaveBeenCalledWith(directoryPath);
        expect(mockedIsDirectoryReadOnly).toHaveBeenCalledWith(directoryPath);
        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toMatchObject({
            path: directoryPath,
            type: 'empty-folder',
            size: 0,
            confidence: 'safe',
            reason: 'Empty directory inside a Steam game installation.'
        });
    });

    it('should not detect a read-only empty directory', () => {
        const directoryPath = path.join(gamePath, 'readonly');
        fs.mkdirSync(directoryPath);
        mockedIsDirectoryReadOnly.mockImplementation((directoryPath) => directoryPath === directoryPath);

        const candidates = scanGame(game);

        expect(candidates).toEqual([]);
    });

    it('should recursively scan nested directories', () => {
        const directoryPath = path.join(gamePath, 'data', 'cache');
        const filePath = path.join(directoryPath, 'temporary.tmp');

        fs.mkdirSync(directoryPath, { recursive: true });
        fs.writeFileSync(filePath, 'temporary data');

        const candidates = scanGame(game);

        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toMatchObject({
            path: filePath,
            type: 'temp-file',
            confidence: 'safe'
        });
    });

    it('should skip symbolic links', () => {
        const targetPath = path.join(gamePath, 'target');
        const linkPath = path.join(gamePath, 'link');

        fs.mkdirSync(targetPath);
        fs.writeFileSync(path.join(targetPath, 'file.tmp'), 'temporary data');
        fs.symlinkSync(targetPath, linkPath, 'junction');

        const candidates = scanGame(game);

        expect(candidates.some((candidate) => candidate.path === linkPath)).toBe(false);
    });

    it('should match installer executables as review candidates', () => {
        const filePath = path.join(gamePath, 'setup.exe');
        fs.writeFileSync(filePath, 'installer');

        const candidates = scanGame(game);

        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toMatchObject({
            path: filePath,
            type: 'installer',
            confidence: 'review',
            reason: 'Executable appears to be a standalone installer.'
        });
    });

    it('should match installer archives as review candidates', () => {
        const filePath = path.join(gamePath, 'directx_jun2010.exe');
        fs.writeFileSync(filePath, 'installer');

        const candidates = scanGame(game);

        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toMatchObject({
            path: filePath,
            type: 'installer',
            confidence: 'review',
            reason: 'File appears to be a bundled installer or redistributable.'
        });
    });

    it('should prefer file extension rules over installer rules', () => {
        const filePath = path.join(gamePath, 'setup.tmp');
        fs.writeFileSync(filePath, 'temporary data');

        const candidates = scanGame(game);

        expect(candidates).toHaveLength(1);
        expect(candidates[0]).toMatchObject({
            path: filePath,
            type: 'temp-file',
            confidence: 'safe',
            reason: 'Temporary file inside a Steam game installation.'
        });
    });

    it('should not detect unrelated files', () => {
        const filePath = path.join(gamePath, 'game.exe');
        fs.writeFileSync(filePath, 'game');

        expect(scanGame(game)).toEqual([]);
    });

    it('should detect multiple candidates independently', () => {
        const temporaryFile = path.join(gamePath, 'temp.tmp');
        const logFile = path.join(gamePath, 'game.log');
        const emptyDirectory = path.join(gamePath, 'empty');

        fs.writeFileSync(temporaryFile, 'temporary data');
        fs.writeFileSync(logFile, 'log data');
        fs.mkdirSync(emptyDirectory);

        const candidates = scanGame(game);

        expect(candidates).toHaveLength(3);
        expect(candidates.map((candidate) => candidate.path)).toEqual(
            expect.arrayContaining([
                temporaryFile,
                logFile,
                emptyDirectory
            ])
        );
    });
});
