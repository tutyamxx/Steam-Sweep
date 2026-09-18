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
	 * @returns Individual results for each requested candidate.
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

    window: {
        /**
		 * Minimizes the SteamSweep application window.
		 */
        minimize: () => {
            ipcRenderer.send('window:minimize');
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
        }
    }
};

contextBridge.exposeInMainWorld('steamSweep', steamSweepApi);
