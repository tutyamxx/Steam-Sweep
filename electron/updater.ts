import { BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

/**
 * Sends an update event to the renderer process.
 *
 * @param window  - Main application window.
 * @param channel - Update event channel.
 * @param data    - Data to send to the renderer.
 */
const sendUpdateEvent = (window: BrowserWindow, channel: string, data?: unknown): void => {
    if (!window.isDestroyed()) {
        window.webContents.send(channel, data);
    }
};

/**
 * Configures SteamSweep's automatic update events.
 *
 * @param window - Main application window.
 */
export const setupUpdater = (window: BrowserWindow): void => {
    autoUpdater.on('update-available', (info) => {
        /**
         * Handles an available update and notifies the renderer process.
         */
        sendUpdateEvent(window, 'update:available', {
            version: info.version
        });
    });

    autoUpdater.on('download-progress', (progress) => {
        /**
         * Handles update download progress and notifies the renderer process.
         */
        sendUpdateEvent(window, 'update:progress', {
            percent: progress.percent
        });
    });

    autoUpdater.on('update-downloaded', (info) => {
        /**
         * Handles a completed update download and notifies the renderer process.
         */
        sendUpdateEvent(window, 'update:downloaded', {
            version: info.version
        });
    });

    ipcMain.on('update:install', () => {
        /**
         * Installs the downloaded update silently and relaunches the application.
         */
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
