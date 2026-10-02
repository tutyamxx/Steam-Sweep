import { contextBridge, ipcRenderer } from 'electron';
import type { CleanupResult } from '../types/cleanup.js';

export const steamSweepApi = {
    /**
     * Scans Steam installations and returns discovered libraries and games.
     */
    scan: () => {
        return ipcRenderer.invoke('steam:scan');
    },

    /**
     * Moves selected cleanup candidates to the Windows Recycle Bin.
     *
     * @param candidateIds - IDs of cleanup candidates to process.
     * @returns            Individual results for each requested candidate.
     */
    clean: (candidateIds: string[]): Promise<CleanupResult> => {
        return ipcRenderer.invoke('steam:clean', candidateIds);
    },

    /**
     * Opens the SteamSweep GitHub repository in the default browser.
     */
    openRepository: () => {
        ipcRenderer.send('repository:open');
    },

    /**
     * Registers a callback for when a new SteamSweep update is available.
     *
     * @param callback - Function called with the available version.
     * @returns        Function that removes the listener.
     */
    onUpdateAvailable: (callback: (version: string) => void): (() => void) => {
        const listener = (_: Electron.IpcRendererEvent, data: { version: string }): void => {
            callback(data.version);
        };

        ipcRenderer.on('update:available', listener);

        return () => {
            ipcRenderer.removeListener('update:available', listener);
        };
    },

    /**
     * Registers a callback for SteamSweep update download progress.
     *
     * @param callback - Function called with the download percentage.
     * @returns        Function that removes the listener.
     */
    onUpdateProgress: (callback: (percent: number) => void): (() => void) => {
        const listener = (_: Electron.IpcRendererEvent, data: { percent: number }): void => {
            callback(data.percent);
        };

        ipcRenderer.on('update:progress', listener);

        return () => {
            ipcRenderer.removeListener('update:progress', listener);
        };
    },

    /**
     * Registers a callback for when a SteamSweep update has finished downloading.
     *
     * @param callback - Function called with the downloaded version.
     * @returns        Function that removes the listener.
     */
    onUpdateDownloaded: (callback: (version: string) => void): (() => void) => {
        const listener = (_: Electron.IpcRendererEvent, data: { version: string }): void => {
            callback(data.version);
        };

        ipcRenderer.on('update:downloaded', listener);

        return () => {
            ipcRenderer.removeListener('update:downloaded', listener);
        };
    },

    /**
     * Registers a callback for when an update check or download fails.
     *
     * @param callback - Function called when the updater reports an error.
     * @returns        Function that removes the listener.
     */
    onUpdateError: (callback: () => void): (() => void) => {
        const listener = (): void => {
            callback();
        };

        ipcRenderer.on('update:error', listener);

        return () => {
            ipcRenderer.removeListener('update:error', listener);
        };
    },

    /**
     * Starts downloading the available update.
     */
    downloadUpdate: () => {
        ipcRenderer.send('update:download');
    },

    /**
     * Restarts SteamSweep and installs the downloaded update.
     */
    installUpdate: () => {
        ipcRenderer.send('update:install');
    },

    window: {
        /**
         * Minimizes the SteamSweep application window.
         */
        minimize: () => {
            ipcRenderer.send('window:minimize');
        },

        /**
         * Maximizes or restores the SteamSweep application window.
         */
        maximize: () => {
            ipcRenderer.send('window:maximize');
        },

        /**
         * Closes the SteamSweep application window.
         */
        close: () => {
            ipcRenderer.send('window:close');
        },

        /**
         * Opens a filesystem folder in Windows Explorer.
         *
         * @param folderPath - Absolute path to the folder to open.
         */
        openFolder: (folderPath: string) => {
            ipcRenderer.send('folder:open', folderPath);
        },

        /**
         * Opens Windows Explorer and selects a filesystem item.
         *
         * @param filePath - Absolute path to the file or folder to show.
         */
        showFile: (filePath: string) => {
            ipcRenderer.send('file:show', filePath);
        }
    }
};

contextBridge.exposeInMainWorld('steamSweep', steamSweepApi);
