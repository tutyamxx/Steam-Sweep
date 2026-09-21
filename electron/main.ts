import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';

import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';

import { findSteamGames, SteamGame } from './steam/games.js';
import { findSteamInstall } from './steam/discovery.js';
import { findSteamLibraries } from './steam/libraryFolders.js';
import { cleanCandidates } from './cleanup/cleanup.js';

import type { CleanupCandidate } from '../types/cleanup.js';

import type { WindowState } from '../types/window.js';
import { minWindowHeight, minWindowWidth } from '../src/utils/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { checkForUpdates, setupUpdater } from './updater.js';

/**
 * Loads the saved application window size.
 *
 * @returns The saved window dimensions or null when unavailable.
 */
const loadWindowState = async (): Promise<WindowState | null> => {
    try {
        const data = await readFile(path.join(app.getPath('userData'), 'window-state.json'), 'utf8');
        const state = JSON.parse(data) as WindowState;

        if (state.width < minWindowWidth || state.height < minWindowHeight) {
            return null;
        }

        return state;
    } catch {
        return null;
    }
};

/**
 * Saves the current application window size.
 *
 * @param window - The application window.
 */
const saveWindowState = async (window: BrowserWindow): Promise<void> => {
    const [width, height] = window.getSize();
    await writeFile(path.join(app.getPath('userData'), 'window-state.json'), JSON.stringify({ width, height }, null, 4), 'utf8');
};

/**
 * Scans a Steam game inside an isolated worker thread.
 *
 * @param game - Installed Steam game to scan.
 * @returns    Cleanup candidates discovered inside the game.
 */
const scanGameInWorker = (game: SteamGame): Promise<CleanupCandidate[]> => {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, 'scanner.worker.js'), { workerData: game });

        worker.once('message', (candidates: CleanupCandidate[]) => resolve(candidates));
        worker.once('error', reject);
        worker.once('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Scanner worker stopped with exit code ${code}.`));
            }
        });
    });
};

/**
 * Scans all installed Steam games concurrently using worker threads.
 *
 * @param games - Installed Steam games to scan.
 * @returns     Cleanup candidates discovered across all games.
 */
const scanGames = async (games: SteamGame[]): Promise<CleanupCandidate[]> => {
    const workers = games.map((game) => scanGameInWorker(game));
    const results = await Promise.all(workers);

    return results.flat();
};

/**
 * Creates the main SteamSweep application window.
 */
const createWindow = async (): Promise<void> => {
    const savedState = await loadWindowState();

    const window = new BrowserWindow({
        width: savedState?.width ?? minWindowWidth,
        height: savedState?.height ?? minWindowHeight,
        minWidth: minWindowWidth,
        minHeight: minWindowHeight,
        resizable: true,
        frame: false,
        show: false,
        title: 'Steam Sweep',
        thickFrame: false,
        icon: process.env.VITE_DEV_SERVER_URL ? path.join(__dirname, '../build/icon.ico') : path.join(process.resourcesPath, 'icon.ico'),
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            contextIsolation: true,
            nodeIntegration: false,
            backgroundThrottling: false

        }
    });

    setupUpdater(window);
    void checkForUpdates();

    /**
     * Saves the window size when the application window is resized.
     *
     * Maximized dimensions are ignored so the user's normal window size is preserved.
     */
    window.on('resize', () => {
        if (!window.isMaximized()) {
            void saveWindowState(window);
        }
    });

    window.webContents.on('before-input-event', (event, input) => {
        /**
         * Prevents the default Electron reload shortcut.
         */
        if (input.control && input.shift && input.key.toLowerCase() === 'r') {
            event.preventDefault();
        }
    });

    window.once('ready-to-show', () => {
        /**
         * Shows the application window once the renderer is ready.
         */
        window.show();
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        window.loadURL(process.env.VITE_DEV_SERVER_URL);

        return;
    }

    window.loadFile(path.join(__dirname, '../dist/index.html'));
};

/**
 * Scans the system for the Steam installation, libraries,
 * installed games and potentially unnecessary files.
 *
 * @returns An object containing the discovered Steam installation, libraries, games and cleanup candidates.
 */
const scanSteam = async () => {
    const steamPath = findSteamInstall();

    if (!steamPath) {
        return {
            steamPath: null,
            libraries: [],
            games: [],
            candidates: []
        };
    }

    const libraries = findSteamLibraries(steamPath);
    const games = findSteamGames(libraries);
    const candidates = await scanGames(games);

    return {
        steamPath,
        libraries,
        games,
        candidates
    };
};

/**
 * Handles requests from the renderer to scan the Steam installation
 * and return discovered games and cleanup candidates.
 */
ipcMain.handle('steam:scan', () => {
    return scanSteam();
});

/**
 * Handles requests from the renderer to clean selected candidates.
 *
 * The candidates are re-scanned and validated in the Electron process
 * before they are moved to the Windows Recycle Bin.
 *
 * @param _event       - IPC event from the renderer process.
 * @param candidateIds - IDs of cleanup candidates selected by the user.
 * @returns            Cleanup results for each requested candidate.
 */
ipcMain.handle('steam:clean', async (_event, candidateIds: string[]) => {
    if (!Array.isArray(candidateIds) || candidateIds.some((id) => typeof id !== 'string')) {
        return {
            results: []
        };
    }

    const steamPath = findSteamInstall();

    if (!steamPath) {
        return {
            results: candidateIds.map((id) => ({
                id,
                success: false,
                error: 'Steam installation could not be found.'
            }))
        };
    }

    const libraries = findSteamLibraries(steamPath);
    const games = findSteamGames(libraries);
    const candidates = await scanGames(games);
    const candidateMap = new Map(candidates.map((candidate) => [candidate.id, candidate]));

    const selectedCandidates = candidateIds
        .map((id) => candidateMap.get(id))
        .filter((candidate): candidate is typeof candidates[number] => Boolean(candidate));

    const result = await cleanCandidates(selectedCandidates, games);
    const foundIds = new Set(selectedCandidates.map((candidate) => candidate.id));

    const missingResults = candidateIds
        .filter((id) => !foundIds.has(id))
        .map((id) => ({
            id,
            success: false,
            error: 'Candidate was not found during the validation scan.'
        }));

    return {
        results: [...result.results, ...missingResults]
    };
});

/**
 * Handles requests from the renderer to minimize the application window.
 *
 * @param event - IPC event containing the renderer web contents.
 */
ipcMain.on('window:minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
});

/**
 * Handles requests from the renderer to close the application window.
 *
 * @param event - IPC event containing the renderer web contents.
 */
ipcMain.on('window:close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.close();
});

/**
 * Handles requests from the renderer to open a filesystem folder in Windows Explorer.
 *
 * @param _event     - IPC event from the renderer process.
 * @param folderPath - Absolute filesystem path to open.
 */
ipcMain.on('folder:open', (_event, folderPath: string) => {
    void shell.openPath(folderPath);
});

/**
 * Opens Windows Explorer and selects the specified filesystem item.
 *
 * @param filePath - Absolute path to the file or folder to show.
 */
ipcMain.on('file:show', (_, filePath: string) => {
    shell.showItemInFolder(filePath);
});

/**
 * Handles requests from the renderer to open the SteamSweep GitHub repository.
 */
ipcMain.on('repository:open', () => {
    void shell.openExternal('https://github.com/tutyamxx/Steam-Sweep');
});

/**
 * Handles requests from the renderer to maximize or restore the application window.
 *
 * @param event - IPC event containing the renderer web contents.
 */
ipcMain.on('window:maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!window) {
        return;
    }

    if (window.isMaximized()) {
        window.unmaximize();

        return;
    }

    window.maximize();
});

/**
 * Initializes the Electron application once it is ready.
 *
 * Removes the default application menu, creates the main window
 * and recreates it when the application is activated without an existing window.
 */
app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

/**
 * Quits the application when all windows have been closed.
 *
 * macOS keeps applications running without open windows, while
 * other platforms exit when the final window is closed.
 */
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
