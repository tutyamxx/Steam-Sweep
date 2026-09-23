import { jest } from '@jest/globals';
import path from 'node:path';

const mockedExistsSync = jest.fn();
const mockedReadFileSync = jest.fn();

jest.unstable_mockModule('node:fs', () => ({
    default: {
        existsSync: mockedExistsSync,
        readFileSync: mockedReadFileSync
    }
}));

const { findSteamLibraries } = await import('./libraryFolders.js');

describe('findSteamLibraries', () => {
    const steamPath = 'C:\\Program Files (x86)\\Steam';
    const mainSteamAppsPath = path.join(steamPath, 'steamapps');
    const libraryFoldersPath = path.join(mainSteamAppsPath, 'libraryfolders.vdf');

    beforeEach(() => {
        mockedExistsSync.mockReset();
        mockedReadFileSync.mockReset();
    });

    it('should find the main Steam library', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue('');

        const result = findSteamLibraries(steamPath);

        expect(result).toEqual([
            {
                path: path.normalize(steamPath),
                steamAppsPath: mainSteamAppsPath
            }
        ]);
    });

    it('should return the main Steam library when the library folders file does not exist', () => {
        mockedExistsSync.mockImplementation((filePath) => filePath !== libraryFoldersPath);

        const result = findSteamLibraries(steamPath);

        expect(result).toEqual([
            {
                path: path.normalize(steamPath),
                steamAppsPath: mainSteamAppsPath
            }
        ]);
        expect(mockedReadFileSync).not.toHaveBeenCalled();
    });

    it('should find libraries registered in the library folders file', () => {
        const secondaryLibraryPath = 'D:\\SteamLibrary';

        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue(`
			"library"
			{
				"0"
				{
					"path"		"${steamPath}"
				}
				"1"
				{
					"path"		"${secondaryLibraryPath}"
				}
			}
		`);

        const result = findSteamLibraries(steamPath);

        expect(result).toEqual([
            {
                path: path.normalize(steamPath),
                steamAppsPath: mainSteamAppsPath
            },
            {
                path: path.normalize(secondaryLibraryPath),
                steamAppsPath: path.join(secondaryLibraryPath, 'steamapps')
            }
        ]);
    });

    it('should skip a registered library when its steamapps directory does not exist', () => {
        const secondaryLibraryPath = 'D:\\SteamLibrary';
        const secondarySteamAppsPath = path.join(secondaryLibraryPath, 'steamapps');

        mockedExistsSync.mockImplementation((filePath) => filePath !== secondarySteamAppsPath);
        mockedReadFileSync.mockReturnValue(`
			"library"
			{
				"1"
				{
					"path"		"${secondaryLibraryPath}"
				}
			}
		`);

        const result = findSteamLibraries(steamPath);

        expect(result).toEqual([
            {
                path: path.normalize(steamPath),
                steamAppsPath: mainSteamAppsPath
            }
        ]);
    });

    it('should skip the main Steam library when its steamapps directory does not exist', () => {
        mockedExistsSync.mockReturnValue(false);

        const result = findSteamLibraries(steamPath);

        expect(result).toEqual([]);
        expect(mockedReadFileSync).not.toHaveBeenCalled();
    });

    it('should skip empty library paths', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue(`
			"library"
			{
				"0"
				{
					"path"		""
				}
				"1"
				{
					"path"		"D:\\SteamLibrary"
				}
			}
		`);

        const result = findSteamLibraries(steamPath);

        expect(result).toEqual([
            {
                path: path.normalize(steamPath),
                steamAppsPath: mainSteamAppsPath
            },
            {
                path: path.normalize('D:\\SteamLibrary'),
                steamAppsPath: path.join('D:\\SteamLibrary', 'steamapps')
            }
        ]);
    });

    it('should ignore duplicate library paths', () => {
        const secondaryLibraryPath = 'D:\\SteamLibrary';

        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue(`
			"library"
			{
				"0"
				{
					"path"		"${secondaryLibraryPath}"
				}
				"1"
				{
					"path"		"${secondaryLibraryPath}"
				}
			}
		`);

        const result = findSteamLibraries(steamPath);

        expect(result).toEqual([
            {
                path: path.normalize(steamPath),
                steamAppsPath: mainSteamAppsPath
            },
            {
                path: path.normalize(secondaryLibraryPath),
                steamAppsPath: path.join(secondaryLibraryPath, 'steamapps')
            }
        ]);
    });

    it('should treat library paths with different casing as duplicates', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue(`
			"library"
			{
				"0"
				{
					"path"		"D:\\SteamLibrary"
				}
				"1"
				{
					"path"		"d:\\steamlibrary"
				}
			}
		`);

        const result = findSteamLibraries(steamPath);

        expect(result).toEqual([
            {
                path: path.normalize(steamPath),
                steamAppsPath: mainSteamAppsPath
            },
            {
                path: path.normalize('d:\\steamlibrary'),
                steamAppsPath: path.join(
                    path.normalize('d:\\steamlibrary'),
                    'steamapps'
                )
            }
        ]);
    });

    it('should normalise discovered library paths', () => {
        const secondaryLibraryPath = 'D:\\SteamLibrary\\..\\SteamLibrary';

        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue(`
			"library"
			{
				"0"
				{
					"path"		"${secondaryLibraryPath}"
				}
			}
		`);

        const result = findSteamLibraries(steamPath);

        expect(result).toEqual([
            {
                path: path.normalize(steamPath),
                steamAppsPath: mainSteamAppsPath
            },
            {
                path: path.normalize(secondaryLibraryPath),
                steamAppsPath: path.join(
                    path.normalize(secondaryLibraryPath),
                    'steamapps'
                )
            }
        ]);
    });

    it('should read the library folders file from the main Steam library', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue('');

        findSteamLibraries(steamPath);

        expect(mockedExistsSync).toHaveBeenCalledWith(mainSteamAppsPath);
        expect(mockedExistsSync).toHaveBeenCalledWith(libraryFoldersPath);
        expect(mockedReadFileSync).toHaveBeenCalledWith(
            libraryFoldersPath,
            'utf8'
        );
    });

    it('should find multiple registered libraries', () => {
        const libraryPaths = [
            'D:\\SteamLibrary',
            'E:\\Games\\Steam',
            'F:\\SteamLibrary'
        ];

        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue(`
			"library"
			{
				"0"
				{
					"path"		"${libraryPaths[0]}"
				}
				"1"
				{
					"path"		"${libraryPaths[1]}"
				}
				"2"
				{
					"path"		"${libraryPaths[2]}"
				}
			}
		`);

        const result = findSteamLibraries(steamPath);

        expect(result).toEqual([
            {
                path: path.normalize(steamPath),
                steamAppsPath: mainSteamAppsPath
            },
            ...libraryPaths.map((libraryPath) => ({
                path: path.normalize(libraryPath),
                steamAppsPath: path.join(
                    path.normalize(libraryPath),
                    'steamapps'
                )
            }))
        ]);
    });

    it('should ignore malformed library folders content without paths', () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue(`
			"library"
			{
				"0"
				{
					"label"		"Steam Library"
				}
			}
		`);

        const result = findSteamLibraries(steamPath);

        expect(result).toEqual([
            {
                path: path.normalize(steamPath),
                steamAppsPath: mainSteamAppsPath
            }
        ]);
    });
});
