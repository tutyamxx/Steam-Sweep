import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { findSteamInstall } from './discovery.js';
import { resolveActualPath } from '../utils/utils.js';

jest.mock('node:child_process', () => ({ execFileSync: jest.fn() }));
jest.mock('node:fs', () => ({ existsSync: jest.fn() }));
jest.mock('../utils/utils.js', () => ({ resolveActualPath: jest.fn() }));

const mockedExecFileSync = jest.mocked(execFileSync);
const mockedExistsSync = jest.mocked(fs.existsSync);
const mockedResolveActualPath = jest.mocked(resolveActualPath);

describe('findSteamInstall', () => {
    beforeEach(() => {
        mockedExecFileSync.mockReset();
        mockedExistsSync.mockReset();
        mockedResolveActualPath.mockReset();

        delete process.env.ProgramFiles;
        delete process.env['ProgramFiles(x86)'];
    });

    it('should find Steam from the registry SteamPath value', () => {
        mockedExecFileSync.mockReturnValue('    SteamPath    REG_SZ    C:\\Steam\r\n');
        mockedExistsSync.mockReturnValue(true);
        mockedResolveActualPath.mockReturnValue('C:\\Steam');

        const result = findSteamInstall();

        expect(result).toBe('C:\\Steam');
        expect(mockedExecFileSync).toHaveBeenCalledWith(
            'reg',
            ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'],
            {
                encoding: 'utf8',
                windowsHide: true
            }
        );
        expect(mockedResolveActualPath).toHaveBeenCalledWith('C:\\Steam');
    });

    it('should find Steam from the registry SteamExe value', () => {
        mockedExecFileSync.mockImplementationOnce(() => {
            throw new Error('SteamPath not found.');
        }).mockReturnValueOnce('    SteamExe    REG_SZ    D:\\Games\\Steam\\steam.exe\r\n');
        mockedExistsSync.mockReturnValue(true);
        mockedResolveActualPath.mockReturnValue('D:\\Games\\Steam');

        const result = findSteamInstall();

        expect(result).toBe('D:\\Games\\Steam');
        expect(mockedExecFileSync).toHaveBeenNthCalledWith(
            2,
            'reg',
            ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamExe'],
            {
                encoding: 'utf8',
                windowsHide: true
            }
        );
        expect(mockedResolveActualPath).toHaveBeenCalledWith('D:\\Games\\Steam');
    });

    it('should replace forward slashes in a registry path', () => {
        mockedExecFileSync.mockReturnValue('    SteamPath    REG_SZ    D:/Steam\r\n');
        mockedExistsSync.mockReturnValue(true);
        mockedResolveActualPath.mockReturnValue('D:\\Steam');

        const result = findSteamInstall();

        expect(result).toBe('D:\\Steam');
        expect(mockedResolveActualPath).toHaveBeenCalledWith('D:\\Steam');
    });

    it('should use ProgramFiles as a fallback when registry lookup fails', () => {
        process.env.ProgramFiles = 'C:\\Program Files';

        mockedExecFileSync.mockImplementation(() => {
            throw new Error('Registry unavailable.');
        });
        mockedExistsSync.mockImplementation((filePath) => {
            return filePath === path.join('C:\\Program Files', 'Steam');
        });
        mockedResolveActualPath.mockReturnValue('C:\\Program Files\\Steam');

        const result = findSteamInstall();

        expect(result).toBe('C:\\Program Files\\Steam');
        expect(mockedResolveActualPath).toHaveBeenCalledWith('C:\\Program Files\\Steam');
    });

    it('should use ProgramFiles(x86) as a fallback when ProgramFiles does not contain Steam', () => {
        process.env.ProgramFiles = 'C:\\Program Files';
        process.env['ProgramFiles(x86)'] = 'C:\\Program Files (x86)';

        mockedExecFileSync.mockImplementation(() => {
            throw new Error('Registry unavailable.');
        });
        mockedExistsSync.mockImplementation((filePath) => {
            return filePath === path.join(
                'C:\\Program Files (x86)',
                'Steam'
            );
        });
        mockedResolveActualPath.mockReturnValue('C:\\Program Files (x86)\\Steam');

        const result = findSteamInstall();

        expect(result).toBe('C:\\Program Files (x86)\\Steam');
        expect(mockedResolveActualPath).toHaveBeenCalledWith('C:\\Program Files (x86)\\Steam');
    });

    it('should prefer ProgramFiles over ProgramFiles(x86) when both contain Steam', () => {
        process.env.ProgramFiles = 'C:\\Program Files';
        process.env['ProgramFiles(x86)'] = 'C:\\Program Files (x86)';

        mockedExecFileSync.mockImplementation(() => {
            throw new Error('Registry unavailable.');
        });
        mockedExistsSync.mockReturnValue(true);
        mockedResolveActualPath.mockReturnValue('C:\\Program Files\\Steam');

        const result = findSteamInstall();

        expect(result).toBe('C:\\Program Files\\Steam');
        expect(mockedResolveActualPath).toHaveBeenCalledWith('C:\\Program Files\\Steam');
    });

    it('should return null when Steam cannot be found', () => {
        mockedExecFileSync.mockImplementation(() => {
            throw new Error('Registry unavailable.');
        });
        mockedExistsSync.mockReturnValue(false);

        const result = findSteamInstall();

        expect(result).toBeNull();
        expect(mockedResolveActualPath).not.toHaveBeenCalled();
    });

    it('should skip registry entries that cannot be parsed', () => {
        mockedExecFileSync.mockReturnValue('Invalid registry output\r\n');
        mockedExistsSync.mockReturnValue(false);

        const result = findSteamInstall();

        expect(result).toBeNull();
        expect(mockedResolveActualPath).not.toHaveBeenCalled();
    });

    it('should continue when a registry query fails', () => {
        mockedExecFileSync.mockImplementationOnce(() => {
            throw new Error('HKCU unavailable.');
        }).mockReturnValueOnce('    SteamExe    REG_SZ    C:\\Steam\\steam.exe\r\n');
        mockedExistsSync.mockReturnValue(true);
        mockedResolveActualPath.mockReturnValue('C:\\Steam');

        const result = findSteamInstall();

        expect(result).toBe('C:\\Steam');
        expect(mockedExecFileSync).toHaveBeenCalledTimes(2);
    });

    it('should skip a registry path when Steam executable does not exist', () => {
        process.env.ProgramFiles = 'C:\\Program Files';

        mockedExecFileSync.mockReturnValue('    SteamPath    REG_SZ    C:\\Steam\r\n');
        mockedExistsSync.mockImplementation((filePath) => {
            return filePath === path.join('C:\\Program Files', 'Steam');
        });
        mockedResolveActualPath.mockReturnValue('C:\\Program Files\\Steam');

        const result = findSteamInstall();

        expect(result).toBe('C:\\Program Files\\Steam');
        expect(mockedResolveActualPath).toHaveBeenCalledWith('C:\\Program Files\\Steam');
    });

    it('should ignore missing ProgramFiles environment variables', () => {
        mockedExecFileSync.mockImplementation(() => {
            throw new Error('Registry unavailable.');
        });
        mockedExistsSync.mockReturnValue(false);

        const result = findSteamInstall();

        expect(result).toBeNull();
        expect(mockedResolveActualPath).not.toHaveBeenCalled();
    });
});
