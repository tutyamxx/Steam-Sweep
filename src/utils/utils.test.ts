import {
    formatBytes,
    getCandidateLabel,
    minWindowHeight,
    minWindowWidth
} from './utils';
import type { CleanupCandidate } from '../../types/cleanup';

describe('formatBytes', () => {
    it('formats zero bytes', () => { expect(formatBytes(0)).toBe('0 B'); });
    it('formats bytes', () => { expect(formatBytes(512)).toBe('512 B'); });
    it('formats kilobytes', () => { expect(formatBytes(1024)).toBe('1.00 KB'); });
    it('formats megabytes', () => { expect(formatBytes(1024 * 1024)).toBe('1.00 MB'); });
    it('formats gigabytes', () => { expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB'); });
    it('formats terabytes', () => { expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1.00 TB'); });
    it('formats values below ten with two decimal places', () => { expect(formatBytes(1536)).toBe('1.50 KB'); });
    it('formats values of ten or more without decimal places', () => { expect(formatBytes(10 * 1024 + 512)).toBe('11 KB'); });
});

describe('getCandidateLabel', () => {
    const createCandidate = (type: CleanupCandidate['type']): CleanupCandidate => ({
        id: 'test',
        gameId: 123,
        gameName: 'Test Game',
        path: 'C:\\Games\\Test Game',
        type,
        size: 1024,
        confidence: 'safe',
        reason: 'Test candidate'
    });

    it.each([
        ['empty-folder', 'Empty folders'],
        ['temp-folder', 'Temporary folders'],
        ['temp-file', 'Temporary files'],
        ['log', 'Logs'],
        ['crash-dump', 'Crash dumps'],
        ['installer', 'Installers'],
        ['backup', 'Backups']
    ] as const)('returns the label for %s', (type, label) => {
        expect(getCandidateLabel(createCandidate(type))).toBe(label);
    });
});

describe('window dimensions', () => {
    it('defines the minimum window width', () => {
        expect(minWindowWidth).toBe(900);
    });

    it('defines the minimum window height', () => {
        expect(minWindowHeight).toBe(650);
    });
});
