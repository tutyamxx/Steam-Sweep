import { contextBridge, ipcRenderer } from 'electron';
import type { CleanupResult } from '../types/cleanup.js';

const steamSweepApi = {
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
     */
    onUpdateAvailable: (callback: (version: string) => void) => {
        ipcRenderer.on('update:available', (_, data: { version: string }) => {
            callback(data.version);
        });
    },

    /**
     * Registers a callback for SteamSweep update download progress.
     *
     * @param callback - Function called with the download percentage.
     */
    onUpdateProgress: (callback: (percent: number) => void) => {
        ipcRenderer.on('update:progress', (_, data: { percent: number }) => {
            callback(data.percent);
        });
    },

    /**
     * Registers a callback for when a SteamSweep update has finished downloading.
     *
     * @param callback - Function called with the downloaded version.
     */
    onUpdateDownloaded: (callback: (version: string) => void) => {
        ipcRenderer.on('update:downloaded', (_, data: { version: string }) => {
            callback(data.version);
        });
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
