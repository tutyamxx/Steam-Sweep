import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanGame } from './cleanup/scanner.js';
import { findSteamGames } from './steam/games.js';
import { findSteamInstall } from './steam/discovery.js';
import { findSteamLibraries } from './steam/libraryFolders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates the main SteamSweep application window.
 */
const createWindow = (): void => {
    const window = new BrowserWindow({
        width: 1100,
        height: 760,
        minWidth: 1100,
        minHeight: 760,
        maxWidth: 1100,
        maxHeight: 760,
        resizable: false,
        frame: false,
        show: false,
        title: 'Steam Sweep',
        icon: path.join(__dirname, '../build/icon.ico'),
        backgroundColor: '#0d0f12',
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    window.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.shift && input.key.toLowerCase() === 'r') {
            event.preventDefault();
        }
    });

    window.once('ready-to-show', () => {
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
 * @returns An object containing the discovered Steam installation,
 * libraries, games and cleanup candidates.
 */
const scanSteam = () => {
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
    const candidates = games.flatMap((game) => scanGame(game));

    return {
        steamPath,
        libraries,
        games,
        candidates
    };
};

ipcMain.handle('steam:scan', () => {
    return scanSteam();
});

ipcMain.on('window:minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
});

ipcMain.on('window:close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.close();
});

ipcMain.on('folder:open', (_event, folderPath: string) => {
    void shell.openPath(folderPath);
});

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
