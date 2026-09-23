import fs from 'node:fs';
import path from 'node:path';
import { findSteamManifests } from './manifests.js';

jest.mock('node:fs', () => ({
    existsSync: jest.fn(),
    readdirSync: jest.fn(),
    readFileSync: jest.fn()
}));

const mockedExistsSync = jest.mocked(fs.existsSync);
const mockedReaddirSync = fs.readdirSync as unknown as jest.MockedFunction<() => string[]>;
const mockedReadFileSync = jest.mocked(fs.readFileSync);

describe('findSteamManifests', () => {
    const steamAppsPath = 'C:\\Steam\\steamapps';

    beforeEach(() => {
        mockedExistsSync.mockReset();
        mockedReaddirSync.mockReset();
        mockedReadFileSync.mockReset();
    });

    it('should return no manifests when the Steam apps directory does not exist', () => {
        mockedExistsSync.mockReturnValue(false);

        const result = findSteamManifests(steamAppsPath);

        expect(result).toEqual([]);
        expect(mockedReaddirSync).not.toHaveBeenCalled();
        expect(mockedReadFileSync).not.toHaveBeenCalled();
    });

    it('should find and parse a valid Steam manifest', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReaddirSync.mockReturnValue(['appmanifest_123456.acf']);
        mockedReadFileSync.mockReturnValue('"appid" "123456"\n"name" "Test Game"\n"installdir" "Test Game"');

        const result = findSteamManifests(steamAppsPath);

        expect(result).toEqual([
            {
                appId: 123456,
                name: 'Test Game',
                installDir: 'Test Game'
            }
        ]);
        expect(mockedReadFileSync).toHaveBeenCalledWith(path.join(steamAppsPath, 'appmanifest_123456.acf'), 'utf8');
    });

    it('should find multiple valid Steam manifests', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReaddirSync.mockReturnValue(['appmanifest_123456.acf', 'appmanifest_789012.acf']);
        mockedReadFileSync
            .mockReturnValueOnce('"appid" "123456"\n"name" "Test Game"\n"installdir" "Test Game"')
            .mockReturnValueOnce('"appid" "789012"\n"name" "Another Game"\n"installdir" "Another Game"');

        const result = findSteamManifests(steamAppsPath);

        expect(result).toEqual([
            {
                appId: 123456,
                name: 'Test Game',
                installDir: 'Test Game'
            },
            {
                appId: 789012,
                name: 'Another Game',
                installDir: 'Another Game'
            }
        ]);
    });

    it('should ignore files that are not Steam application manifests', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReaddirSync.mockReturnValue(['appmanifest_123456.acf', 'libraryfolders.vdf', 'steam.dll', 'not-a-manifest.acf', 'appmanifest_789012.txt']);
        mockedReadFileSync.mockReturnValue('"appid" "123456"\n"name" "Test Game"\n"installdir" "Test Game"');

        const result = findSteamManifests(steamAppsPath);

        expect(result).toEqual([
            {
                appId: 123456,
                name: 'Test Game',
                installDir: 'Test Game'
            }
        ]);
        expect(mockedReadFileSync).toHaveBeenCalledTimes(1);
    });

    it('should skip a manifest without an app ID', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReaddirSync.mockReturnValue(['appmanifest_123456.acf']);
        mockedReadFileSync.mockReturnValue('"name" "Test Game"\n"installdir" "Test Game"');

        const result = findSteamManifests(steamAppsPath);

        expect(result).toEqual([]);
    });

    it('should skip a manifest without a name', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReaddirSync.mockReturnValue(['appmanifest_123456.acf']);
        mockedReadFileSync.mockReturnValue('"appid" "123456"\n"installdir" "Test Game"');

        const result = findSteamManifests(steamAppsPath);

        expect(result).toEqual([]);
    });

    it('should skip a manifest without an install directory', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReaddirSync.mockReturnValue(['appmanifest_123456.acf']);
        mockedReadFileSync.mockReturnValue('"appid" "123456"\n"name" "Test Game"');

        const result = findSteamManifests(steamAppsPath);

        expect(result).toEqual([]);
    });

    it('should skip manifests missing multiple required fields', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReaddirSync.mockReturnValue(['appmanifest_123456.acf', 'appmanifest_789012.acf']);
        mockedReadFileSync.mockReturnValueOnce('"appid" "123456"').mockReturnValueOnce('"name" "Another Game"');

        const result = findSteamManifests(steamAppsPath);

        expect(result).toEqual([]);
    });

    it('should parse manifest values containing spaces', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReaddirSync.mockReturnValue(['appmanifest_123456.acf']);
        mockedReadFileSync.mockReturnValue('"appid" "123456"\n"name" "Elden Ring"\n"installdir" "ELDEN RING"');

        const result = findSteamManifests(steamAppsPath);

        expect(result).toEqual([
            {
                appId: 123456,
                name: 'Elden Ring',
                installDir: 'ELDEN RING'
            }
        ]);
    });

    it('should parse an app ID as a number', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReaddirSync.mockReturnValue(['appmanifest_123456.acf']);
        mockedReadFileSync.mockReturnValue('"appid" "123456"\n"name" "Test Game"\n"installdir" "Test Game"');

        const result = findSteamManifests(steamAppsPath);

        expect(result[0]?.appId).toBe(123456);
        expect(typeof result[0]?.appId).toBe('number');
    });

    it('should read manifests from the provided Steam apps path', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReaddirSync.mockReturnValue([]);

        findSteamManifests(steamAppsPath);

        expect(mockedExistsSync).toHaveBeenCalledWith(steamAppsPath);
        expect(mockedReaddirSync).toHaveBeenCalledWith(steamAppsPath);
    });

    it('should return an empty array when no manifest files are present', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReaddirSync.mockReturnValue(['libraryfolders.vdf', 'steam.dll', 'config.vdf']);

        const result = findSteamManifests(steamAppsPath);

        expect(result).toEqual([]);
        expect(mockedReadFileSync).not.toHaveBeenCalled();
    });
});
