import { parentPort } from 'node:worker_threads';
import { scanGame } from './scanner.js';
import type { SteamGame } from '../steam/games.js';
import type { CleanupCandidate } from '../../types/cleanup.js';

jest.mock('node:worker_threads', () => ({
    parentPort: {
        postMessage: jest.fn()
    },
    workerData: {
        appId: 123456,
        name: 'Test Game',
        installPath: 'C:\\Games\\Test Game',
        libraryPath: 'C:\\Games'
    }
}));

jest.mock('./scanner.js', () => ({
    scanGame: jest.fn()
}));

const mockedScanGame = jest.mocked(scanGame);
const mockedPostMessage = jest.mocked(parentPort!.postMessage);

describe('scanner worker', () => {
    it('should scan the worker game and send the cleanup candidates to the parent thread', async () => {
        const steamGame: SteamGame = {
            appId: 123456,
            name: 'Test Game',
            installPath: 'C:\\Games\\Test Game',
            libraryPath: 'C:\\Games'
        };

        const cleanupCandidates: CleanupCandidate[] = [
            {
                id: 'candidate-1',
                gameId: 123456,
                gameName: 'Test Game',
                path: 'C:\\Games\\Test Game\\temp.tmp',
                type: 'temp-file',
                size: 1024,
                confidence: 'safe',
                reason: 'Temporary file inside a Steam game installation.'
            }
        ];

        mockedScanGame.mockReturnValue(cleanupCandidates);

        await import('./scanner.worker.js');

        expect(mockedScanGame).toHaveBeenCalledWith(steamGame);
        expect(mockedPostMessage).toHaveBeenCalledWith(cleanupCandidates);
    });
});
