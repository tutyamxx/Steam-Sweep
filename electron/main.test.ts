import { jest } from '@jest/globals';

type EventRegistrar = (event: string, listener: (...args: unknown[]) => void) => void;
type IpcRegistrar = (channel: string, listener: (...args: unknown[]) => unknown) => void;

const userDataPath = 'C:\\Users\\Test\\AppData\\Roaming\\SteamSweep';
const repositoryUrl = 'https://github.com/tutyamxx/Steam-Sweep';

const mockEventRegistrar = () => jest.fn<EventRegistrar>();

const mockApp = {
    getPath: jest.fn<(name: string) => string>(),
    whenReady: jest.fn<() => Promise<void>>(),
    on: mockEventRegistrar(),
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
    on: mockEventRegistrar(),
    once: mockEventRegistrar(),
    webContents: {
        on: mockEventRegistrar()
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
    handle: jest.fn<IpcRegistrar>(),
    on: jest.fn<IpcRegistrar>()
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
    once: mockEventRegistrar()
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

mockApp.getPath.mockReturnValue(userDataPath);
mockReadFile.mockRejectedValue(new Error('State file not found.'));
mockApp.whenReady.mockResolvedValue(undefined);

await import('./main.js');

/**
 * Finds the listener the main process registered with `ipcMain.on` for a channel.
 *
 * @param channel - IPC channel name.
 * @returns       The registered listener.
 */
const getIpcHandler = (channel: string): ((...args: unknown[]) => unknown) => {
    const call = mockIpcMain.on.mock.calls.find(([registeredChannel]) => registeredChannel === channel);

    if (!call) {
        throw new Error(`No ipcMain.on handler registered for "${channel}".`);
    }

    return call[1];
};

/**
 * Invokes a window IPC handler as if it was triggered from the mocked window.
 *
 * @param channel - IPC channel name.
 */
const invokeWindowHandler = (channel: string): void => {
    mockBrowserWindow.fromWebContents.mockReturnValue(mockWindow);

    getIpcHandler(channel)({ sender: {} });
};

describe('main process', () => {
    beforeEach(() => {
        const { webContents, ...windowMocks } = mockWindow;

        // The app, ipcMain, menu and updater mocks are intentionally not reset:
        // their assertions rely on calls made while main.js was imported.
        [
            mockReadFile,
            mockWriteFile,
            mockFindSteamGames,
            mockFindSteamInstall,
            mockFindSteamLibraries,
            mockCleanCandidates,
            ...Object.values(mockBrowserWindow),
            ...Object.values(windowMocks),
            webContents.on,
            ...Object.values(mockShell),
            MockWorker,
            mockWorker.once
        ].forEach((mock) => mock.mockReset());

        mockApp.getPath.mockReturnValue(userDataPath);
    });

    it.each([
        ['scan', 'steam:scan'],
        ['clean', 'steam:clean']
    ])('registers the Steam %s IPC handler', (_name, channel) => {
        expect(mockIpcMain.handle).toHaveBeenCalledWith(channel, expect.any(Function));
    });

    it('registers the window IPC handlers', () => {
        const channels = [
            'window:minimize',
            'window:close',
            'folder:open',
            'file:show',
            'repository:open',
            'window:maximize'
        ];

        channels.forEach((channel) => {
            expect(mockIpcMain.on).toHaveBeenCalledWith(channel, expect.any(Function));
        });
    });

    it('removes the application menu when the application is ready', () => {
        expect(mockMenu.setApplicationMenu).toHaveBeenCalledWith(null);
    });

    it('configures the updater when creating the application window', () => {
        expect(mockSetupUpdater).toHaveBeenCalledWith(mockWindow);
        expect(mockCheckForUpdates).toHaveBeenCalled();
    });

    it.each([
        { name: 'minimizes the window', channel: 'window:minimize', action: mockWindow.minimize },
        { name: 'closes the window', channel: 'window:close', action: mockWindow.close }
    ])('$name', ({ channel, action }) => {
        invokeWindowHandler(channel);

        expect(action).toHaveBeenCalled();
    });

    it.each([
        { name: 'opens a folder', channel: 'folder:open', argument: 'C:\\Steam', action: mockShell.openPath },
        { name: 'shows a file in Explorer', channel: 'file:show', argument: 'C:\\Steam\\test.log', action: mockShell.showItemInFolder }
    ])('$name', ({ channel, argument, action }) => {
        getIpcHandler(channel)({}, argument);

        expect(action).toHaveBeenCalledWith(argument);
    });

    it('opens the SteamSweep repository', () => {
        getIpcHandler('repository:open')();

        expect(mockShell.openExternal).toHaveBeenCalledWith(repositoryUrl);
    });

    it.each([
        { name: 'maximizes the window when it is not maximized', isMaximized: false, action: mockWindow.maximize },
        { name: 'restores the window when it is maximized', isMaximized: true, action: mockWindow.unmaximize }
    ])('$name', ({ isMaximized, action }) => {
        mockWindow.isMaximized.mockReturnValue(isMaximized);

        invokeWindowHandler('window:maximize');

        expect(action).toHaveBeenCalled();
    });
});
