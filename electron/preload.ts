import { contextBridge, ipcRenderer } from 'electron';

const steamSweepApi = {
    /**
	 * Scans Steam installations and returns discovered libraries and games.
	 */
    scan: () => {
        return ipcRenderer.invoke('steam:scan');
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
