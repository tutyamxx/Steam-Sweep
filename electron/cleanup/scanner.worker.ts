import { parentPort, workerData } from 'node:worker_threads';
import { scanGame } from './scanner.js';
import type { SteamGame } from '../steam/games.js';

/**
 * Steam game received by the worker thread.
 */
const game = workerData as SteamGame;

/**
 * Cleanup candidates discovered while scanning the Steam game.
 */
const candidates = scanGame(game);

/**
 * Sends the scan results back to the Electron main process.
 */
parentPort?.postMessage(candidates);
