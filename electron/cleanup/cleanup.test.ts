import { jest } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { SteamGame } from '../steam/games.js';
import type { CleanupCandidate } from '../../types/cleanup.js';

const mockShell = {
    trashItem: jest.fn<() => Promise<void>>()
};

jest.unstable_mockModule('electron', () => ({
    shell: mockShell
}));

const { cleanCandidates } = await import('./cleanup.js');
const mockedTrashItem = mockShell.trashItem;

describe('cleanCandidates', () => {
    let temporaryDirectory: string;
    let gamePath: string;

    const game: SteamGame = {
        appId: 123456,
        name: 'Test Game',
        installPath: '',
        libraryPath: ''
    };

    beforeEach(() => {
        temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'steam-sweep-'));
        gamePath = path.join(temporaryDirectory, 'Test Game');

        fs.mkdirSync(gamePath);

        game.installPath = gamePath;
        mockedTrashItem.mockReset();
    });

    afterEach(() => {
        fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    });

    it('should move a valid candidate to the Recycle Bin', async () => {
        const candidatePath = path.join(gamePath, 'temp');
        fs.mkdirSync(candidatePath);

        const candidate: CleanupCandidate = {
            id: 'candidate-1',
            gameId: game.appId,
            gameName: game.name,
            path: candidatePath,
            type: 'temp-folder',
            size: 1024,
            confidence: 'safe',
            reason: 'Temporary files'
        };

        const result = await cleanCandidates([candidate], [game]);

        expect(mockedTrashItem).toHaveBeenCalledWith(candidatePath);
        expect(result).toEqual({
            results: [
                {
                    id: 'candidate-1',
                    success: true
                }
            ]
        });
    });

    it('should reject a candidate outside the Steam game installation', async () => {
        const candidatePath = path.join(temporaryDirectory, 'outside');
        fs.mkdirSync(candidatePath);

        const candidate: CleanupCandidate = {
            id: 'candidate-2',
            gameId: game.appId,
            gameName: game.name,
            path: candidatePath,
            type: 'temp-folder',
            size: 1024,
            confidence: 'safe',
            reason: 'Temporary files'
        };

        const result = await cleanCandidates([candidate], [game]);

        expect(mockedTrashItem).not.toHaveBeenCalled();
        expect(result).toEqual({
            results: [
                {
                    id: 'candidate-2',
                    success: false,
                    error: 'Candidate is no longer valid or is outside a Steam game installation.'
                }
            ]
        });
    });

    it('should reject a candidate when the game does not match', async () => {
        const candidatePath = path.join(gamePath, 'temp');
        fs.mkdirSync(candidatePath);

        const candidate: CleanupCandidate = {
            id: 'candidate-3',
            gameId: 999999,
            gameName: 'Different Game',
            path: candidatePath,
            type: 'temp-folder',
            size: 1024,
            confidence: 'safe',
            reason: 'Temporary files'
        };

        const result = await cleanCandidates([candidate], [game]);

        expect(mockedTrashItem).not.toHaveBeenCalled();
        expect(result).toEqual({
            results: [
                {
                    id: 'candidate-3',
                    success: false,
                    error: 'Candidate is no longer valid or is outside a Steam game installation.'
                }
            ]
        });
    });

    it('should reject a candidate that no longer exists', async () => {
        const candidatePath = path.join(gamePath, 'deleted');
        const candidate: CleanupCandidate = {
            id: 'candidate-4',
            gameId: game.appId,
            gameName: game.name,
            path: candidatePath,
            type: 'temp-folder',
            size: 1024,
            confidence: 'safe',
            reason: 'Temporary files'
        };
        const result = await cleanCandidates([candidate], [game]);

        expect(mockedTrashItem).not.toHaveBeenCalled();
        expect(result).toEqual({
            results: [
                {
                    id: 'candidate-4',
                    success: false,
                    error: 'Candidate is no longer valid or is outside a Steam game installation.'
                }
            ]
        });
    });

    it('should reject a relative candidate path', async () => {
        const candidate: CleanupCandidate = {
            id: 'candidate-5',
            gameId: game.appId,
            gameName: game.name,
            path: 'temp/file.tmp',
            type: 'temp-file',
            size: 1024,
            confidence: 'safe',
            reason: 'Temporary files'
        };

        const result = await cleanCandidates([candidate], [game]);

        expect(mockedTrashItem).not.toHaveBeenCalled();
        expect(result).toEqual({
            results: [
                {
                    id: 'candidate-5',
                    success: false,
                    error: 'Candidate is no longer valid or is outside a Steam game installation.'
                }
            ]
        });
    });

    it('should reject a symbolic link', async () => {
        const targetPath = path.join(gamePath, 'target');
        const candidatePath = path.join(gamePath, 'link');

        fs.mkdirSync(targetPath);
        fs.symlinkSync(targetPath, candidatePath, 'junction');

        const candidate: CleanupCandidate = {
            id: 'candidate-6',
            gameId: game.appId,
            gameName: game.name,
            path: candidatePath,
            type: 'temp-folder',
            size: 1024,
            confidence: 'safe',
            reason: 'Temporary files'
        };

        const result = await cleanCandidates([candidate], [game]);

        expect(mockedTrashItem).not.toHaveBeenCalled();
        expect(result).toEqual({
            results: [
                {
                    id: 'candidate-6',
                    success: false,
                    error: 'Candidate is no longer valid or is outside a Steam game installation.'
                }
            ]
        });
    });

    it('should return a failure when moving a candidate to the Recycle Bin fails', async () => {
        const candidatePath = path.join(gamePath, 'logs');

        fs.mkdirSync(candidatePath);
        mockedTrashItem.mockRejectedValueOnce(new Error('Recycle Bin unavailable.'));

        const candidate: CleanupCandidate = {
            id: 'candidate-7',
            gameId: game.appId,
            gameName: game.name,
            path: candidatePath,
            type: 'log',
            size: 1024,
            confidence: 'safe',
            reason: 'Log files'
        };

        const result = await cleanCandidates([candidate], [game]);

        expect(mockedTrashItem).toHaveBeenCalledWith(candidatePath);
        expect(result).toEqual({
            results: [
                {
                    id: 'candidate-7',
                    success: false,
                    error: 'Recycle Bin unavailable.'
                }
            ]
        });
    });

    it('should handle non-Error trash failures', async () => {
        const candidatePath = path.join(gamePath, 'logs');

        fs.mkdirSync(candidatePath);
        mockedTrashItem.mockRejectedValueOnce('Unexpected failure');

        const candidate: CleanupCandidate = {
            id: 'candidate-8',
            gameId: game.appId,
            gameName: game.name,
            path: candidatePath,
            type: 'log',
            size: 1024,
            confidence: 'safe',
            reason: 'Log files'
        };

        const result = await cleanCandidates([candidate], [game]);

        expect(result).toEqual({
            results: [
                {
                    id: 'candidate-8',
                    success: false,
                    error: 'Failed to move item to the Recycle Bin.'
                }
            ]
        });
    });

    it('should process multiple candidates independently', async () => {
        const validPath = path.join(gamePath, 'temp');
        const invalidPath = path.join(temporaryDirectory, 'outside');

        fs.mkdirSync(validPath);
        fs.mkdirSync(invalidPath);

        const candidates: CleanupCandidate[] = [
            {
                id: 'candidate-9',
                gameId: game.appId,
                gameName: game.name,
                path: validPath,
                type: 'temp-folder',
                size: 1024,
                confidence: 'safe',
                reason: 'Temporary files'
            },
            {
                id: 'candidate-10',
                gameId: game.appId,
                gameName: game.name,
                path: invalidPath,
                type: 'temp-folder',
                size: 1024,
                confidence: 'safe',
                reason: 'Temporary files'
            }
        ];

        const result = await cleanCandidates(candidates, [game]);

        expect(mockedTrashItem).toHaveBeenCalledTimes(1);
        expect(mockedTrashItem).toHaveBeenCalledWith(validPath);
        expect(result).toEqual({
            results: [
                {
                    id: 'candidate-9',
                    success: true
                },
                {
                    id: 'candidate-10',
                    success: false,
                    error: 'Candidate is no longer valid or is outside a Steam game installation.'
                }
            ]
        });
    });
});
