import { parentPort, workerData } from 'node:worker_threads';
import { scanGame } from './scanner.js';
import type { SteamGame } from '../steam/games.js';

/**
 * Steam game data received by the worker thread.
 */
const steamGame = workerData as SteamGame;

/**
 * Cleanup candidates discovered while scanning the Steam game.
 */
const cleanupCandidates = scanGame(steamGame);

/**
 * Sends the scan results back to the Electron main process.
 */
parentPort?.postMessage(cleanupCandidates);
