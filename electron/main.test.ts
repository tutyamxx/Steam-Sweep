import { jest } from '@jest/globals';

const mockApp = {
    getPath: jest.fn<(name: string) => string>(),
    whenReady: jest.fn<() => Promise<void>>(),
    on: jest.fn<(event: string, listener: (...args: unknown[]) => void) => void>(),
    quit: jest.fn()
};

const mockWindow = {
    getSize: jest.fn<() => [number, number]>(),
    isMaximized: jest.fn<() => boolean>(),
    minimize: jest.fn(),
    maximize: jest.fn(),
    unmaximize: jest.fn(),
    close: jest.fn(),
    isDestroyed: jest.fn<() => boolean>(),
    show: jest.fn(),
    loadURL: jest.fn<(url: string) => void>(),
    loadFile: jest.fn<(filePath: string) => void>(),
    on: jest.fn<(event: string, listener: (...args: unknown[]) => void) => void>(),
    once: jest.fn<(event: string, listener: (...args: unknown[]) => void) => void>(),
    webContents: {
        on: jest.fn<(event: string, listener: (...args: unknown[]) => void) => void>()
    }
};

const mockBrowserWindow = {
    fromWebContents: jest.fn<(webContents: unknown) => typeof mockWindow | null>(),
    getAllWindows: jest.fn<() => typeof mockWindow[]>()
};

class MockBrowserWindow {
    constructor() {
        return mockWindow;
    }

    static fromWebContents = mockBrowserWindow.fromWebContents;
    static getAllWindows = mockBrowserWindow.getAllWindows;
}

const mockIpcMain = {
    handle: jest.fn<(channel: string, listener: (...args: unknown[]) => unknown) => void>(),
    on: jest.fn<(channel: string, listener: (...args: unknown[]) => unknown) => void>()
};

const mockMenu = {
    setApplicationMenu: jest.fn()
};

const mockShell = {
    openPath: jest.fn<(path: string) => Promise<string>>(),
    showItemInFolder: jest.fn<(path: string) => void>(),
    openExternal: jest.fn<(url: string) => Promise<void>>()
};

const mockReadFile = jest.fn<(path: string, encoding: string) => Promise<string>>();
const mockWriteFile = jest.fn<(path: string, data: string, encoding: string) => Promise<void>>();
const mockWorker = {
    once: jest.fn<(event: string, listener: (...args: unknown[]) => void) => void>()
};

const MockWorker = jest.fn<(path: string, options: { workerData: unknown }) => typeof mockWorker>(() => mockWorker);
const mockFindSteamGames = jest.fn();
const mockFindSteamInstall = jest.fn();
const mockFindSteamLibraries = jest.fn();
const mockCleanCandidates = jest.fn();
const mockCheckForUpdates = jest.fn<() => Promise<void>>();
const mockSetupUpdater = jest.fn<(window: typeof mockWindow) => void>();

jest.unstable_mockModule('electron', () => ({
    app: mockApp,
    BrowserWindow: MockBrowserWindow,
    ipcMain: mockIpcMain,
    Menu: mockMenu,
    shell: mockShell
}));

jest.unstable_mockModule('node:fs/promises', () => ({
    readFile: mockReadFile,
    writeFile: mockWriteFile
}));

jest.unstable_mockModule('node:url', () => ({
    fileURLToPath: jest.fn(() => 'C:\\SteamSweep\\dist-electron\\main.js')
}));

jest.unstable_mockModule('node:worker_threads', () => ({
    Worker: MockWorker
}));

jest.unstable_mockModule('./steam/games.js', () => ({
    findSteamGames: mockFindSteamGames
}));

jest.unstable_mockModule('./steam/discovery.js', () => ({
    findSteamInstall: mockFindSteamInstall
}));

jest.unstable_mockModule('./steam/libraryFolders.js', () => ({
    findSteamLibraries: mockFindSteamLibraries
}));
jest.unstable_mockModule('./cleanup/cleanup.js', () => ({
    cleanCandidates: mockCleanCandidates
}));

jest.unstable_mockModule('../src/utils/utils.js', () => ({
    minWindowHeight: 600,
    minWindowWidth: 800
}));

jest.unstable_mockModule('./updater.js', () => ({
    checkForUpdates: mockCheckForUpdates,
    setupUpdater: mockSetupUpdater
}));

Object.defineProperty(process, 'resourcesPath', {
    value: 'C:\\SteamSweep\\resources',
    configurable: true
});

mockApp.getPath.mockReturnValue('C:\\Users\\Test\\AppData\\Roaming\\SteamSweep');
mockReadFile.mockRejectedValue(new Error('State file not found.'));
mockApp.whenReady.mockResolvedValue(undefined);

await import('./main.js');

describe('main process', () => {
    beforeEach(() => {
        const mocks = [
            mockReadFile,
            mockWriteFile,
            mockFindSteamGames,
            mockFindSteamInstall,
            mockFindSteamLibraries,
            mockCleanCandidates,
            mockBrowserWindow.fromWebContents,
            mockBrowserWindow.getAllWindows,
            mockWindow.getSize,
            mockWindow.isMaximized,
            mockWindow.minimize,
            mockWindow.maximize,
            mockWindow.unmaximize,
            mockWindow.close,
            mockWindow.isDestroyed,
            mockWindow.show,
            mockWindow.loadURL,
            mockWindow.loadFile,
            mockWindow.on,
            mockWindow.once,
            mockWindow.webContents.on,
            mockShell.openPath,
            mockShell.showItemInFolder,
            mockShell.openExternal,
            MockWorker,
            mockWorker.once
        ];
        mocks.forEach((mock) => mock.mockReset());
        mockApp.getPath.mockReturnValue('C:\\Users\\Test\\AppData\\Roaming\\SteamSweep');
    });

    it('registers the Steam scan IPC handler', () => {
        expect(mockIpcMain.handle).toHaveBeenCalledWith('steam:scan', expect.any(Function));
    });

    it('registers the Steam clean IPC handler', () => {
        expect(mockIpcMain.handle).toHaveBeenCalledWith('steam:clean', expect.any(Function));
    });

    it('registers the window IPC handlers', () => {
        expect(mockIpcMain.on).toHaveBeenCalledWith('window:minimize', expect.any(Function));
        expect(mockIpcMain.on).toHaveBeenCalledWith('window:close', expect.any(Function));
        expect(mockIpcMain.on).toHaveBeenCalledWith('folder:open', expect.any(Function));
        expect(mockIpcMain.on).toHaveBeenCalledWith('file:show', expect.any(Function));
        expect(mockIpcMain.on).toHaveBeenCalledWith('repository:open', expect.any(Function));
        expect(mockIpcMain.on).toHaveBeenCalledWith('window:maximize', expect.any(Function));
    });

    it('removes the application menu when the application is ready', () => {
        expect(mockMenu.setApplicationMenu).toHaveBeenCalledWith(null);
    });

    it('configures the updater when creating the application window', () => {
        expect(mockSetupUpdater).toHaveBeenCalledWith(mockWindow);
        expect(mockCheckForUpdates).toHaveBeenCalled();
    });

    it('minimizes the window', () => {
        const handler = mockIpcMain.on.mock.calls.find(([channel]) => channel === 'window:minimize')?.[1] as (event: { sender: unknown }) => void;

        mockBrowserWindow.fromWebContents.mockReturnValue(mockWindow);

        handler({ sender: {} });
        expect(mockWindow.minimize).toHaveBeenCalled();
    });

    it('closes the window', () => {
        const handler = mockIpcMain.on.mock.calls.find(([channel]) => channel === 'window:close')?.[1] as (event: { sender: unknown }) => void;

        mockBrowserWindow.fromWebContents.mockReturnValue(mockWindow);

        handler({ sender: {} });
        expect(mockWindow.close).toHaveBeenCalled();
    });

    it('opens a folder', () => {
        const handler = mockIpcMain.on.mock.calls.find(([channel]) => channel === 'folder:open')?.[1] as (event: unknown, folderPath: string) => void;

        handler({}, 'C:\\Steam');
        expect(mockShell.openPath).toHaveBeenCalledWith('C:\\Steam');
    });

    it('shows a file in Explorer', () => {
        const handler = mockIpcMain.on.mock.calls.find(([channel]) => channel === 'file:show')?.[1] as (event: unknown, filePath: string) => void;

        handler({}, 'C:\\Steam\\test.log');
        expect(mockShell.showItemInFolder).toHaveBeenCalledWith('C:\\Steam\\test.log');
    });

    it('opens the SteamSweep repository', () => {
        const handler = mockIpcMain.on.mock.calls.find(([channel]) => channel === 'repository:open')?.[1] as () => void;

        handler();
        expect(mockShell.openExternal).toHaveBeenCalledWith('https://github.com/tutyamxx/Steam-Sweep');
    });

    it('maximizes the window when it is not maximized', () => {
        const handler = mockIpcMain.on.mock.calls.find(([channel]) => channel === 'window:maximize')?.[1] as (event: { sender: unknown }) => void;

        mockBrowserWindow.fromWebContents.mockReturnValue(mockWindow);
        mockWindow.isMaximized.mockReturnValue(false);

        handler({ sender: {} });
        expect(mockWindow.maximize).toHaveBeenCalled();
    });

    it('restores the window when it is maximized', () => {
        const handler = mockIpcMain.on.mock.calls.find(([channel]) => channel === 'window:maximize')?.[1] as (event: { sender: unknown }) => void;

        mockBrowserWindow.fromWebContents.mockReturnValue(mockWindow);
        mockWindow.isMaximized.mockReturnValue(true);

        handler({ sender: {} });
        expect(mockWindow.unmaximize).toHaveBeenCalled();
    });
});
