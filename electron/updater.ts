import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.disableDifferentialDownload = true;

/**
 * Dev-only update simulation, never active in a packaged build.
 *
 * MOCK_UPDATE=1    - simulates a successful update flow.
 * MOCK_UPDATE=fail - simulates a download that fails at 50%.
 */
const mockMode = app.isPackaged ? undefined : process.env.MOCK_UPDATE;
const mockVersion = '9.9.9';

let updaterWindow: BrowserWindow | null = null;
let listenersRegistered = false;
let isDownloading = false;

/**
 * Sends an update event to the renderer process.
 *
 * @param channel - Update event channel.
 * @param data    - Data to send to the renderer.
 */
const sendUpdateEvent = (channel: string, data?: unknown): void => {
    if (updaterWindow && !updaterWindow.isDestroyed()) {
        updaterWindow.webContents.send(channel, data);
    }
};

/**
 * Simulates an update download by emitting fake progress events.
 */
const simulateDownload = (): void => {
    let percent = 0;

    const timer = setInterval(() => {
        percent += 10;

        if (mockMode === 'fail' && percent >= 50) {
            clearInterval(timer);
            isDownloading = false;
            sendUpdateEvent('update:error');

            return;
        }

        sendUpdateEvent('update:progress', { percent });

        if (percent >= 100) {
            clearInterval(timer);
            isDownloading = false;
            sendUpdateEvent('update:downloaded', { version: mockVersion });
        }
    }, 400);
};

/**
 * Configures SteamSweep's update events.
 *
 * Listeners are registered only once, so recreating the window
 * only swaps the window that receives the events.
 *
 * @param window - Main application window.
 */
export const setupUpdater = (window: BrowserWindow): void => {
    updaterWindow = window;

    if (mockMode) {
        window.webContents.once('did-finish-load', () => {
            setTimeout(() => sendUpdateEvent('update:available', { version: mockVersion }), 1500);
        });
    }

    if (listenersRegistered) {
        return;
    }

    listenersRegistered = true;

    autoUpdater.on('update-available', (info) => {
        sendUpdateEvent('update:available', {
            version: info.version
        });
    });

    autoUpdater.on('download-progress', (progress) => {
        sendUpdateEvent('update:progress', {
            percent: progress.percent
        });
    });

    autoUpdater.on('update-downloaded', (info) => {
        isDownloading = false;

        sendUpdateEvent('update:downloaded', {
            version: info.version
        });
    });

    autoUpdater.on('error', () => {
        isDownloading = false;
        sendUpdateEvent('update:error');
    });

    ipcMain.on('update:download', () => {
        if (isDownloading) {
            return;
        }

        isDownloading = true;

        if (mockMode) {
            simulateDownload();

            return;
        }

        autoUpdater.downloadUpdate().catch(() => {
            isDownloading = false;
        });
    });

    ipcMain.on('update:install', () => {
        if (mockMode) {
            // eslint-disable-next-line no-console
            console.log('[mock update] quitAndInstall would run here.');

            return;
        }

        autoUpdater.quitAndInstall(true, true);
    });
};

/**
 * Checks GitHub Releases for a newer version of SteamSweep.
 */
export const checkForUpdates = async (): Promise<void> => {
    try {
        await autoUpdater.checkForUpdates();
    // eslint-disable-next-line no-empty
    } catch { }
};
