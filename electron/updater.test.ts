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

jest.unstable_mockModule('electron', () => ({
    BrowserWindow: class {},
    ipcMain: mockIpcMain
}));

jest.unstable_mockModule('electron-updater', () => ({
    autoUpdater: mockAutoUpdater
}));

const { setupUpdater, checkForUpdates } = await import('./updater.js');

describe('updater', () => {
    beforeEach(() => {
        mockAutoUpdater.on.mockReset();
        mockAutoUpdater.quitAndInstall.mockReset();
        mockAutoUpdater.checkForUpdates.mockReset();
        mockIpcMain.on.mockReset();
        mockWebContents.send.mockReset();
        mockWindow.isDestroyed.mockReset();
    });

    it('enables automatic downloading', () => {
        expect(mockAutoUpdater.autoDownload).toBe(true);
    });

    it('enables automatic installation when the application quits', () => {
        expect(mockAutoUpdater.autoInstallOnAppQuit).toBe(true);
    });

    it('registers update event handlers', () => {
        setupUpdater(mockWindow as never);
        expect(mockAutoUpdater.on).toHaveBeenCalledWith('update-available', expect.any(Function));
        expect(mockAutoUpdater.on).toHaveBeenCalledWith('download-progress', expect.any(Function));
        expect(mockAutoUpdater.on).toHaveBeenCalledWith('update-downloaded', expect.any(Function));
    });

    it('sends the available update version to the renderer', () => {
        mockWindow.isDestroyed.mockReturnValue(false);
        setupUpdater(mockWindow as never);
        const handler = mockAutoUpdater.on.mock.calls.find(([event]) => event === 'update-available')?.[1] as (info: { version: string }) => void;
        handler({ version: '1.2.0' });
        expect(mockWebContents.send).toHaveBeenCalledWith('update:available', { version: '1.2.0' });
    });

    it('sends download progress to the renderer', () => {
        mockWindow.isDestroyed.mockReturnValue(false);
        setupUpdater(mockWindow as never);
        const handler = mockAutoUpdater.on.mock.calls.find(([event]) => event === 'download-progress')?.[1] as (progress: { percent: number }) => void;
        handler({ percent: 57.5 });
        expect(mockWebContents.send).toHaveBeenCalledWith('update:progress', { percent: 57.5 });
    });

    it('sends the downloaded update version to the renderer', () => {
        mockWindow.isDestroyed.mockReturnValue(false);
        setupUpdater(mockWindow as never);
        const handler = mockAutoUpdater.on.mock.calls.find(([event]) => event === 'update-downloaded')?.[1] as (info: { version: string }) => void;
        handler({ version: '1.2.0' });
        expect(mockWebContents.send).toHaveBeenCalledWith('update:downloaded', { version: '1.2.0' });
    });

    it('does not send update events when the window is destroyed', () => {
        mockWindow.isDestroyed.mockReturnValue(true);
        setupUpdater(mockWindow as never);
        const handler = mockAutoUpdater.on.mock.calls.find(([event]) => event === 'update-available')?.[1] as (info: { version: string }) => void;
        handler({ version: '1.2.0' });
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
