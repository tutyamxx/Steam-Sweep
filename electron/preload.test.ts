import { jest } from '@jest/globals';

const mockContextBridge = {
    exposeInMainWorld: jest.fn()
};

const mockIpcRenderer = {
    invoke: jest.fn<(channel: string, ...args: unknown[]) => Promise<unknown>>(),
    send: jest.fn(),
    on: jest.fn()
};

jest.unstable_mockModule('electron', () => ({
    contextBridge: mockContextBridge,
    ipcRenderer: mockIpcRenderer
}));

const { steamSweepApi } = await import('./preload.js');

describe('preload API', () => {
    beforeEach(() => {
        mockIpcRenderer.invoke.mockReset();
        mockIpcRenderer.send.mockReset();
        mockIpcRenderer.on.mockReset();
    });

    it('exposes the SteamSweep API through contextBridge', () => {
        expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith('steamSweep', steamSweepApi);
    });

    it('invokes steam:scan', async () => {
        const result = { games: [] };
        mockIpcRenderer.invoke.mockResolvedValue(result);

        await expect(steamSweepApi.scan()).resolves.toBe(result);
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('steam:scan');
    });

    it('invokes steam:clean with candidate IDs', async () => {
        const candidateIds = ['candidate-1', 'candidate-2'];
        const result = { results: [] };

        mockIpcRenderer.invoke.mockResolvedValue(result);
        await expect(steamSweepApi.clean(candidateIds)).resolves.toBe(result);

        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('steam:clean', candidateIds);
    });

    it('sends repository:open', () => {
        steamSweepApi.openRepository();
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('repository:open');
    });

    it('registers and forwards update:available events', () => {
        const callback = jest.fn();

        steamSweepApi.onUpdateAvailable(callback);
        expect(mockIpcRenderer.on).toHaveBeenCalledWith('update:available', expect.any(Function));

        const listener = mockIpcRenderer.on.mock.calls[0]?.[1] as (
            event: unknown,
            data: { version: string }
        ) => void;

        listener({}, { version: '1.2.0' });
        expect(callback).toHaveBeenCalledWith('1.2.0');
    });

    it('registers and forwards update:progress events', () => {
        const callback = jest.fn();

        steamSweepApi.onUpdateProgress(callback);
        expect(mockIpcRenderer.on).toHaveBeenCalledWith('update:progress', expect.any(Function));

        const listener = mockIpcRenderer.on.mock.calls[0]?.[1] as (
            event: unknown,
            data: { percent: number }
        ) => void;

        listener({}, { percent: 67.5 });
        expect(callback).toHaveBeenCalledWith(67.5);
    });

    it('registers and forwards update:downloaded events', () => {
        const callback = jest.fn();

        steamSweepApi.onUpdateDownloaded(callback);
        expect(mockIpcRenderer.on).toHaveBeenCalledWith('update:downloaded', expect.any(Function));

        const listener = mockIpcRenderer.on.mock.calls[0]?.[1] as (
            event: unknown,
            data: { version: string }
        ) => void;

        listener({}, { version: '1.2.0' });
        expect(callback).toHaveBeenCalledWith('1.2.0');
    });

    it('sends update:install', () => {
        steamSweepApi.installUpdate();
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('update:install');
    });

    it('sends window:minimize', () => {
        steamSweepApi.window.minimize();
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('window:minimize');
    });

    it('sends window:maximize', () => {
        steamSweepApi.window.maximize();
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('window:maximize');
    });

    it('sends window:close', () => {
        steamSweepApi.window.close();
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('window:close');
    });

    it('sends folder:open with the folder path', () => {
        const folderPath = 'C:\\Steam\\steamapps\\common';

        steamSweepApi.window.openFolder(folderPath);
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('folder:open', folderPath);
    });

    it('sends file:show with the file path', () => {
        const filePath = 'C:\\Steam\\steamapps\\common\\Test Game\\logs';

        steamSweepApi.window.showFile(filePath);
        expect(mockIpcRenderer.send).toHaveBeenCalledWith('file:show', filePath);
    });
});
