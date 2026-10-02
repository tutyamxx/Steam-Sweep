import { jest } from '@jest/globals';

const mockAutoUpdater = {
    // -| Starts as true so the flag test proves updater.ts is what turns it off.
    autoDownload: true,
    autoInstallOnAppQuit: false,
    disableDifferentialDownload: false,
    on: jest.fn(),
    quitAndInstall: jest.fn(),
    checkForUpdates: jest.fn<() => Promise<void>>(),
    downloadUpdate: jest.fn<() => Promise<unknown>>()
};

const mockApp = {
    isPackaged: true
};

const mockIpcMain = {
    on: jest.fn()
};

const mockWebContents = {
    send: jest.fn(),
    once: jest.fn()
};

const mockWindow = {
    isDestroyed: jest.fn(),
    webContents: mockWebContents
};

const moduleMocks: Record<string, () => object> = {
    electron: () => ({ app: mockApp, BrowserWindow: class {}, ipcMain: mockIpcMain }),
    'electron-updater': () => ({ autoUpdater: mockAutoUpdater })
};

Object.entries(moduleMocks).forEach(([specifier, factory]) => {
    jest.unstable_mockModule(specifier, factory);
});

const originalMockUpdate = process.env.MOCK_UPDATE;

/**
 * Loads a fresh copy of updater.ts, because it keeps module-level state
 * (registered listeners, download flag, target window).
 */
const loadUpdater = async (options: { packaged?: boolean; mock?: string } = {}) => {
    const { packaged = true, mock } = options;

    mockApp.isPackaged = packaged;
    mockAutoUpdater.autoDownload = true;
    mockAutoUpdater.autoInstallOnAppQuit = false;
    mockAutoUpdater.disableDifferentialDownload = false;

    if (mock === undefined) {
        delete process.env.MOCK_UPDATE;
    } else {
        process.env.MOCK_UPDATE = mock;
    }

    jest.resetModules();

    return import('./updater.js');
};

let setupUpdater: Awaited<ReturnType<typeof loadUpdater>>['setupUpdater'];
let checkForUpdates: Awaited<ReturnType<typeof loadUpdater>>['checkForUpdates'];

const getIpcHandler = (channel: string): (() => void) => {
    return mockIpcMain.on.mock.calls.find(([registered]) => registered === channel)?.[1] as () => void;
};

const flushPromises = (): Promise<void> => new Promise((resolve) => {
    setTimeout(resolve, 0);
});

const rendererEvents = [
    { event: 'update-available', channel: 'update:available', payload: { version: '1.2.0' } },
    { event: 'download-progress', channel: 'update:progress', payload: { percent: 57.5 } },
    { event: 'update-downloaded', channel: 'update:downloaded', payload: { version: '1.2.0' } },
    { event: 'error', channel: 'update:error', payload: undefined }
];

describe('updater', () => {
    beforeEach(async () => {
        mockAutoUpdater.on.mockReset();
        mockAutoUpdater.quitAndInstall.mockReset();
        mockAutoUpdater.checkForUpdates.mockReset();
        mockAutoUpdater.downloadUpdate.mockReset();
        mockIpcMain.on.mockReset();
        mockWebContents.send.mockReset();
        mockWebContents.once.mockReset();
        mockWindow.isDestroyed.mockReset();

        ({ setupUpdater, checkForUpdates } = await loadUpdater());
    });

    afterEach(() => {
        jest.useRealTimers();

        if (originalMockUpdate === undefined) {
            delete process.env.MOCK_UPDATE;
        } else {
            process.env.MOCK_UPDATE = originalMockUpdate;
        }
    });

    it.each([
        ['automatic downloading', 'autoDownload', false],
        ['automatic installation when the application quits', 'autoInstallOnAppQuit', true],
        ['differential downloads', 'disableDifferentialDownload', true]
    ] as const)('sets %s to the expected value', (_name, flag, expected) => {
        expect(mockAutoUpdater[flag]).toBe(expected);
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

    it('registers listeners only once when setupUpdater is called repeatedly', () => {
        setupUpdater(mockWindow as never);
        setupUpdater(mockWindow as never);

        expect(mockAutoUpdater.on).toHaveBeenCalledTimes(rendererEvents.length);
        expect(mockIpcMain.on).toHaveBeenCalledTimes(2);
    });

    it('sends events to the most recently registered window', () => {
        const secondWindow = {
            isDestroyed: jest.fn().mockReturnValue(false),
            webContents: { send: jest.fn(), once: jest.fn() }
        };

        mockWindow.isDestroyed.mockReturnValue(false);
        setupUpdater(mockWindow as never);
        setupUpdater(secondWindow as never);

        const handler = mockAutoUpdater.on.mock.calls.find(([registered]) => registered === 'update-available')?.[1] as (data: unknown) => void;
        handler({ version: '1.2.0' });

        expect(secondWindow.webContents.send).toHaveBeenCalledWith('update:available', { version: '1.2.0' });
        expect(mockWebContents.send).not.toHaveBeenCalled();
    });

    it('registers the update download handler', () => {
        setupUpdater(mockWindow as never);
        expect(mockIpcMain.on).toHaveBeenCalledWith('update:download', expect.any(Function));
    });

    it('starts downloading when update:download is received', () => {
        mockAutoUpdater.downloadUpdate.mockResolvedValue(undefined);
        setupUpdater(mockWindow as never);

        getIpcHandler('update:download')();

        expect(mockAutoUpdater.downloadUpdate).toHaveBeenCalledTimes(1);
    });

    it('ignores repeated download requests while a download is in progress', () => {
        mockAutoUpdater.downloadUpdate.mockResolvedValue(undefined);
        setupUpdater(mockWindow as never);

        const download = getIpcHandler('update:download');
        download();
        download();

        expect(mockAutoUpdater.downloadUpdate).toHaveBeenCalledTimes(1);
    });

    it('allows another download once the update has downloaded', () => {
        mockAutoUpdater.downloadUpdate.mockResolvedValue(undefined);
        mockWindow.isDestroyed.mockReturnValue(false);
        setupUpdater(mockWindow as never);

        const download = getIpcHandler('update:download');
        download();

        const downloaded = mockAutoUpdater.on.mock.calls.find(([registered]) => registered === 'update-downloaded')?.[1] as (data: unknown) => void;
        downloaded({ version: '1.2.0' });
        download();

        expect(mockAutoUpdater.downloadUpdate).toHaveBeenCalledTimes(2);
    });

    it('allows a retry after the updater reports an error', () => {
        mockAutoUpdater.downloadUpdate.mockResolvedValue(undefined);
        mockWindow.isDestroyed.mockReturnValue(false);
        setupUpdater(mockWindow as never);

        const download = getIpcHandler('update:download');
        download();

        const failed = mockAutoUpdater.on.mock.calls.find(([registered]) => registered === 'error')?.[1] as () => void;
        failed();

        download();
        expect(mockAutoUpdater.downloadUpdate).toHaveBeenCalledTimes(2);
    });

    it('allows a retry when downloadUpdate rejects', async () => {
        mockAutoUpdater.downloadUpdate.mockRejectedValue(new Error('Download failed'));
        setupUpdater(mockWindow as never);

        const download = getIpcHandler('update:download');
        download();

        await flushPromises();
        download();

        expect(mockAutoUpdater.downloadUpdate).toHaveBeenCalledTimes(2);
    });

    describe('mock mode', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            mockWindow.isDestroyed.mockReturnValue(false);
        });

        it('is ignored in packaged builds', async () => {
            const updater = await loadUpdater({ packaged: true, mock: '1' });
            updater.setupUpdater(mockWindow as never);

            expect(mockWebContents.once).not.toHaveBeenCalled();
        });

        it('announces a fake update after the window finishes loading', async () => {
            const updater = await loadUpdater({ packaged: false, mock: '1' });
            updater.setupUpdater(mockWindow as never);

            expect(mockWebContents.once).toHaveBeenCalledWith('did-finish-load', expect.any(Function));

            const onFinishLoad = mockWebContents.once.mock.calls[0]?.[1] as () => void;
            onFinishLoad();

            jest.advanceTimersByTime(1500);
            expect(mockWebContents.send).toHaveBeenCalledWith('update:available', { version: '9.9.9' });
        });

        it('simulates a successful download without touching electron-updater', async () => {
            const updater = await loadUpdater({ packaged: false, mock: '1' });
            updater.setupUpdater(mockWindow as never);

            getIpcHandler('update:download')();
            jest.advanceTimersByTime(4000);

            expect(mockAutoUpdater.downloadUpdate).not.toHaveBeenCalled();
            expect(mockWebContents.send).toHaveBeenCalledWith('update:progress', { percent: 10 });
            expect(mockWebContents.send).toHaveBeenCalledWith('update:progress', { percent: 100 });
            expect(mockWebContents.send).toHaveBeenLastCalledWith('update:downloaded', { version: '9.9.9' });
        });

        it('simulates a failed download at 50% in fail mode', async () => {
            const updater = await loadUpdater({ packaged: false, mock: 'fail' });
            updater.setupUpdater(mockWindow as never);

            getIpcHandler('update:download')();
            jest.advanceTimersByTime(4000);

            expect(mockWebContents.send).toHaveBeenCalledWith('update:progress', { percent: 40 });
            expect(mockWebContents.send).not.toHaveBeenCalledWith('update:progress', { percent: 50 });
            expect(mockWebContents.send).not.toHaveBeenCalledWith('update:downloaded', expect.anything());
            expect(mockWebContents.send).toHaveBeenLastCalledWith('update:error', undefined);
        });

        it('does not quit and install in mock mode', async () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

            const updater = await loadUpdater({ packaged: false, mock: '1' });
            updater.setupUpdater(mockWindow as never);

            getIpcHandler('update:install')();
            expect(mockAutoUpdater.quitAndInstall).not.toHaveBeenCalled();

            logSpy.mockRestore();
        });
    });
});
