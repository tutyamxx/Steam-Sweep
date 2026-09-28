import { jest } from '@jest/globals';

const mockAutoUpdater = {
    autoDownload: false,
    autoInstallOnAppQuit: false,
    on: jest.fn(),
    quitAndInstall: jest.fn(),
    checkForUpdates: jest.fn<() => Promise<void>>()
};

const mockIpcMain = {
    on: jest.fn()
};

const mockWebContents = {
    send: jest.fn()
};

const mockWindow = {
    isDestroyed: jest.fn(),
    webContents: mockWebContents
};

const moduleMocks: Record<string, () => object> = {
    electron: () => ({ BrowserWindow: class {}, ipcMain: mockIpcMain }),
    'electron-updater': () => ({ autoUpdater: mockAutoUpdater })
};

Object.entries(moduleMocks).forEach(([specifier, factory]) => {
    jest.unstable_mockModule(specifier, factory);
});

const { setupUpdater, checkForUpdates } = await import('./updater.js');

const rendererEvents = [
    { event: 'update-available', channel: 'update:available', payload: { version: '1.2.0' } },
    { event: 'download-progress', channel: 'update:progress', payload: { percent: 57.5 } },
    { event: 'update-downloaded', channel: 'update:downloaded', payload: { version: '1.2.0' } }
];

describe('updater', () => {
    beforeEach(() => {
        mockAutoUpdater.on.mockReset();
        mockAutoUpdater.quitAndInstall.mockReset();
        mockAutoUpdater.checkForUpdates.mockReset();
        mockIpcMain.on.mockReset();
        mockWebContents.send.mockReset();
        mockWindow.isDestroyed.mockReset();
    });

    it.each([
        ['automatic downloading', 'autoDownload'],
        ['automatic installation when the application quits', 'autoInstallOnAppQuit']
    ] as const)('enables %s', (_name, flag) => {
        expect(mockAutoUpdater[flag]).toBe(true);
    });

    it.each(rendererEvents)('registers the $event handler', ({ event }) => {
        setupUpdater(mockWindow as never);

        expect(mockAutoUpdater.on).toHaveBeenCalledWith(event, expect.any(Function));
    });

    it.each(rendererEvents)('forwards $event to the renderer as $channel', ({ event, channel, payload }) => {
        mockWindow.isDestroyed.mockReturnValue(false);
        setupUpdater(mockWindow as never);

        const handler = mockAutoUpdater.on.mock.calls.find(([registered]) => registered === event)?.[1] as (data: unknown) => void;
        handler(payload);

        expect(mockWebContents.send).toHaveBeenCalledWith(channel, payload);
    });

    it.each(rendererEvents)('does not forward $event when the window is destroyed', ({ event, payload }) => {
        mockWindow.isDestroyed.mockReturnValue(true);
        setupUpdater(mockWindow as never);

        const handler = mockAutoUpdater.on.mock.calls.find(([registered]) => registered === event)?.[1] as (data: unknown) => void;
        handler(payload);

        expect(mockWebContents.send).not.toHaveBeenCalled();
    });

    it('registers the update install handler', () => {
        setupUpdater(mockWindow as never);
        expect(mockIpcMain.on).toHaveBeenCalledWith('update:install', expect.any(Function));
    });

    it('installs the update when update:install is received', () => {
        setupUpdater(mockWindow as never);

        const handler = mockIpcMain.on.mock.calls.find(([channel]) => channel === 'update:install')?.[1] as () => void;
        handler();

        expect(mockAutoUpdater.quitAndInstall).toHaveBeenCalledWith(true, true);
    });

    it('checks for updates', async () => {
        mockAutoUpdater.checkForUpdates.mockResolvedValue(undefined);

        await checkForUpdates();
        expect(mockAutoUpdater.checkForUpdates).toHaveBeenCalledTimes(1);
    });

    it('ignores update check failures', async () => {
        mockAutoUpdater.checkForUpdates.mockRejectedValue(new Error('Update check failed'));

        await expect(checkForUpdates()).resolves.toBeUndefined();
        expect(mockAutoUpdater.checkForUpdates).toHaveBeenCalledTimes(1);
    });
});
