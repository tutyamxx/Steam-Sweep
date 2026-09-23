import { jest } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';

const mockedStatSync = jest.fn();
const mockedReaddirSync = jest.fn();
const mockedRealpathSync = jest.fn();
const mockedExecFileSync = jest.fn();

jest.unstable_mockModule('node:fs', () => ({
    default: {
        statSync: mockedStatSync,
        readdirSync: mockedReaddirSync,
        realpathSync: {
            native: mockedRealpathSync
        }
    }
}));

jest.unstable_mockModule('node:child_process', () => ({
    execFileSync: mockedExecFileSync
}));

const { getFileSize, getDirectorySize, isDirectoryEmpty, isDirectoryReadOnly, resolveActualPath } = await import('./utils.js');

describe('getFileSize', () => {
    beforeEach(() => {
        mockedStatSync.mockReset();
    });

    it('should return the size of a file', () => {
        mockedStatSync.mockReturnValue({ size: 1024 } as fs.Stats);

        const result = getFileSize('C:\\Steam\\game\\file.log');

        expect(result).toBe(1024);
        expect(mockedStatSync).toHaveBeenCalledWith('C:\\Steam\\game\\file.log');
    });

    it('should return zero for an empty file', () => {
        mockedStatSync.mockReturnValue({ size: 0 } as fs.Stats);

        const result = getFileSize('C:\\Steam\\game\\empty.log');
        expect(result).toBe(0);
    });

    it('should return null when the file cannot be read', () => {
        mockedStatSync.mockImplementation(() => {
            throw new Error('File not found');
        });

        const result = getFileSize('C:\\Steam\\game\\missing.log');
        expect(result).toBeNull();
    });
});

describe('getDirectorySize', () => {
    beforeEach(() => {
        mockedReaddirSync.mockReset();
        mockedStatSync.mockReset();
    });

    it('should return zero for an empty directory', () => {
        mockedReaddirSync.mockReturnValue([]);

        const result = getDirectorySize('C:\\Steam\\game\\empty');

        expect(result).toBe(0);
        expect(mockedReaddirSync).toHaveBeenCalledWith('C:\\Steam\\game\\empty', { withFileTypes: true });
    });

    it('should calculate the total size of files in a directory', () => {
        mockedReaddirSync.mockReturnValue([
            {
                name: 'one.log',
                isSymbolicLink: () => false,
                isDirectory: () => false,
                isFile: () => true
            },
            {
                name: 'two.log',
                isSymbolicLink: () => false,
                isDirectory: () => false,
                isFile: () => true
            }
        ]);
        mockedStatSync.mockReturnValueOnce({ size: 1024 } as fs.Stats).mockReturnValueOnce({ size: 2048 } as fs.Stats);

        const result = getDirectorySize('C:\\Steam\\game');

        expect(result).toBe(3072);
        expect(mockedStatSync).toHaveBeenCalledWith('C:\\Steam\\game/one.log');
        expect(mockedStatSync).toHaveBeenCalledWith('C:\\Steam\\game/two.log');
    });

    it('should calculate the total size recursively', () => {
        mockedReaddirSync
            .mockReturnValueOnce([
                {
                    name: 'root.log',
                    isSymbolicLink: () => false,
                    isDirectory: () => false,
                    isFile: () => true
                },
                {
                    name: 'nested',
                    isSymbolicLink: () => false,
                    isDirectory: () => true,
                    isFile: () => false
                }
            ])
            .mockReturnValueOnce([
                {
                    name: 'nested.log',
                    isSymbolicLink: () => false,
                    isDirectory: () => false,
                    isFile: () => true
                }
            ]);

        mockedStatSync.mockReturnValueOnce({ size: 1024 } as fs.Stats).mockReturnValueOnce({ size: 2048 } as fs.Stats);

        const result = getDirectorySize('C:\\Steam\\game');

        expect(result).toBe(3072);
        expect(mockedReaddirSync).toHaveBeenNthCalledWith(1, 'C:\\Steam\\game', { withFileTypes: true });
        expect(mockedReaddirSync).toHaveBeenNthCalledWith(2, 'C:\\Steam\\game/nested', { withFileTypes: true });
    });

    it('should ignore symbolic links', () => {
        mockedReaddirSync.mockReturnValue([
            {
                name: 'link',
                isSymbolicLink: () => true,
                isDirectory: () => false,
                isFile: () => false
            },
            {
                name: 'file.log',
                isSymbolicLink: () => false,
                isDirectory: () => false,
                isFile: () => true
            }
        ]);
        mockedStatSync.mockReturnValue({ size: 1024 } as fs.Stats);

        const result = getDirectorySize('C:\\Steam\\game');

        expect(result).toBe(1024);
        expect(mockedStatSync).toHaveBeenCalledTimes(1);
        expect(mockedStatSync).toHaveBeenCalledWith('C:\\Steam\\game/file.log');
    });

    it('should ignore entries that are neither files nor directories', () => {
        mockedReaddirSync.mockReturnValue([
            {
                name: 'unknown',
                isSymbolicLink: () => false,
                isDirectory: () => false,
                isFile: () => false
            }
        ]);

        const result = getDirectorySize('C:\\Steam\\game');

        expect(result).toBe(0);
        expect(mockedStatSync).not.toHaveBeenCalled();
    });

    it('should return null when the directory cannot be read', () => {
        mockedReaddirSync.mockImplementation(() => {
            throw new Error('Access denied');
        });

        const result = getDirectorySize('C:\\Steam\\game');
        expect(result).toBeNull();
    });

    it('should return null when a nested directory cannot be read', () => {
        mockedReaddirSync.mockReturnValueOnce([
            {
                name: 'nested',
                isSymbolicLink: () => false,
                isDirectory: () => true,
                isFile: () => false
            }
        ]).mockImplementationOnce(() => {
            throw new Error('Access denied');
        });

        const result = getDirectorySize('C:\\Steam\\game');
        expect(result).toBeNull();
    });

    it('should return null when a file size cannot be read', () => {
        mockedReaddirSync.mockReturnValue([
            {
                name: 'file.log',
                isSymbolicLink: () => false,
                isDirectory: () => false,
                isFile: () => true
            }
        ]);
        mockedStatSync.mockImplementation(() => {
            throw new Error('Access denied');
        });

        const result = getDirectorySize('C:\\Steam\\game');
        expect(result).toBeNull();
    });
});

describe('isDirectoryEmpty', () => {
    beforeEach(() => {
        mockedReaddirSync.mockReset();
    });

    it('should return true when the directory is empty', () => {
        mockedReaddirSync.mockReturnValue([]);

        const result = isDirectoryEmpty('C:\\Steam\\game\\empty');

        expect(result).toBe(true);
        expect(mockedReaddirSync).toHaveBeenCalledWith('C:\\Steam\\game\\empty');
    });

    it('should return false when the directory contains entries', () => {
        mockedReaddirSync.mockReturnValue(['file.log']);

        const result = isDirectoryEmpty('C:\\Steam\\game');
        expect(result).toBe(false);
    });

    it('should return false when the directory cannot be read', () => {
        mockedReaddirSync.mockImplementation(() => {
            throw new Error('Access denied');
        });

        const result = isDirectoryEmpty('C:\\Steam\\game');
        expect(result).toBe(false);
    });
});

describe('isDirectoryReadOnly', () => {
    beforeEach(() => {
        mockedExecFileSync.mockReset();
    });

    it('should return true when the read-only attribute is present', () => {
        mockedExecFileSync.mockReturnValue('R    C:\\Steam\\game');

        const result = isDirectoryReadOnly('C:\\Steam\\game');

        expect(result).toBe(true);
        expect(mockedExecFileSync).toHaveBeenCalledWith('attrib', ['C:\\Steam\\game'], {
            encoding: 'utf8',
            windowsHide: true
        });
    });

    it('should return false when the read-only attribute is not present', () => {
        mockedExecFileSync.mockReturnValue('A    C:\\Steam\\game');

        const result = isDirectoryReadOnly('C:\\Steam\\game');
        expect(result).toBe(false);
    });

    it('should handle lowercase read-only attributes', () => {
        mockedExecFileSync.mockReturnValue('r    C:\\Steam\\game');

        const result = isDirectoryReadOnly('C:\\Steam\\game');
        expect(result).toBe(true);
    });

    it('should return false when attrib fails', () => {
        mockedExecFileSync.mockImplementation(() => {
            throw new Error('Command failed');
        });

        const result = isDirectoryReadOnly('C:\\Steam\\game');
        expect(result).toBe(false);
    });

    it('should return false when attrib returns empty output', () => {
        mockedExecFileSync.mockReturnValue('');

        const result = isDirectoryReadOnly('C:\\Steam\\game');
        expect(result).toBe(false);
    });
});

describe('resolveActualPath', () => {
    beforeEach(() => {
        mockedRealpathSync.mockReset();
    });

    it('should return the resolved filesystem path', () => {
        mockedRealpathSync.mockReturnValue('C:\\Steam\\Steam');

        const result = resolveActualPath('C:\\Steam\\steam');

        expect(result).toBe('C:\\Steam\\Steam');
        expect(mockedRealpathSync).toHaveBeenCalledWith(path.normalize('C:\\Steam\\steam'));
    });

    it('should normalise the path before resolving it', () => {
        mockedRealpathSync.mockReturnValue('C:\\Steam\\Games');

        const inputPath = 'C:\\Steam\\Games\\..\\Games';
        const result = resolveActualPath(inputPath);

        expect(result).toBe('C:\\Steam\\Games');
        expect(mockedRealpathSync).toHaveBeenCalledWith(path.normalize(inputPath));
    });

    it('should return the original path when it cannot be resolved', () => {
        const inputPath = 'C:\\Steam\\Missing';

        mockedRealpathSync.mockImplementation(() => {
            throw new Error('Path not found');
        });

        const result = resolveActualPath(inputPath);
        expect(result).toBe(inputPath);
    });
});
