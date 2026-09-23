import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { jest } from '@jest/globals';
import { Home } from './Home';
import type { CleanupCandidate, CleanupResult } from '../../types/cleanup';

Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    value: jest.fn(),
    writable: true
});

const mockScan = jest.fn<() => Promise<{
    steamPath: string | null;
    candidates: CleanupCandidate[];
}>>();

const mockClean = jest.fn<() => Promise<CleanupResult>>();
const mockMinimize = jest.fn();
const mockClose = jest.fn();
const mockOpenFolder = jest.fn();
const mockShowFile = jest.fn();
const mockInstallUpdate = jest.fn();
const mockOpenRepository = jest.fn();
const mockOnUpdateAvailable = jest.fn();
const mockOnUpdateProgress = jest.fn();
const mockOnUpdateDownloaded = jest.fn();

const mockSteamSweep = {
    scan: mockScan,
    clean: mockClean,
    installUpdate: mockInstallUpdate,
    openRepository: mockOpenRepository,
    window: {
        minimize: mockMinimize,
        close: mockClose,
        openFolder: mockOpenFolder,
        showFile: mockShowFile
    },
    onUpdateAvailable: mockOnUpdateAvailable,
    onUpdateProgress: mockOnUpdateProgress,
    onUpdateDownloaded: mockOnUpdateDownloaded
};

Object.defineProperty(window, 'steamSweep', {
    value: mockSteamSweep,
    writable: true,
    configurable: true
});

const candidates: CleanupCandidate[] = [
    {
        id: 'game-log',
        gameId: 123456,
        gameName: 'Test Game',
        path: 'C:\\Games\\Test Game\\game.log',
        type: 'log',
        size: 4096,
        confidence: 'safe',
        reason: 'Log file'
    },
    {
        id: 'game-temp',
        gameId: 123456,
        gameName: 'Test Game',
        path: 'C:\\Games\\Test Game\\temp',
        type: 'temp-folder',
        size: 2048,
        confidence: 'safe',
        reason: 'Temporary folder'
    }
];

const scanResult = {
    steamPath: 'C:\\Program Files (x86)\\Steam',
    candidates
};

let updateAvailableCallback: ((version: string) => void) | undefined;
let updateProgressCallback: ((percent: number) => void) | undefined;
let updateDownloadedCallback: ((version: string) => void) | undefined;

const setup = (): void => {
    mockScan.mockReset();
    mockClean.mockReset();
    mockMinimize.mockReset();
    mockClose.mockReset();
    mockOpenFolder.mockReset();
    mockShowFile.mockReset();
    mockInstallUpdate.mockReset();
    mockOpenRepository.mockReset();
    mockOnUpdateAvailable.mockReset();
    mockOnUpdateProgress.mockReset();
    mockOnUpdateDownloaded.mockReset();
    mockScan.mockResolvedValue(scanResult);
    mockClean.mockResolvedValue({
        results: []
    });
    updateAvailableCallback = undefined;
    updateProgressCallback = undefined;
    updateDownloadedCallback = undefined;
    mockOnUpdateAvailable.mockImplementation((callback: unknown) => {
        updateAvailableCallback = callback as (version: string) => void;
    });
    mockOnUpdateProgress.mockImplementation((callback: unknown) => {
        updateProgressCallback = callback as (percent: number) => void;
    });
    mockOnUpdateDownloaded.mockImplementation((callback: unknown) => {
        updateDownloadedCallback = callback as (version: string) => void;
    });

    render(<Home />);
};

const selectCandidate = async (path: string): Promise<HTMLInputElement> => {
    const candidatePath = await screen.findByRole('button', {
        name: path
    });
    const candidate = candidatePath.closest('.candidate');

    expect(candidate).not.toBeNull();

    return candidate!.querySelector('input[type="checkbox"]') as HTMLInputElement;
};

describe('Home', () => {
    beforeEach(() => {
        setup();
    });

    it('renders the home page', () => {
        expect(screen.getByText('Steam Sweep')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'SteamSweep logo' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Scan Steam Libraries/i })).toBeInTheDocument();
    });

    it('registers update listeners', () => {
        expect(mockOnUpdateAvailable).toHaveBeenCalledTimes(1);
        expect(mockOnUpdateProgress).toHaveBeenCalledTimes(1);
        expect(mockOnUpdateDownloaded).toHaveBeenCalledTimes(1);
    });

    it('minimizes the window', () => {
        fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));
        expect(mockMinimize).toHaveBeenCalledTimes(1);
    });

    it('closes the window', () => {
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('opens the GitHub repository', () => {
        fireEvent.click(screen.getByRole('button', { name: 'Open GitHub repository' }));
        expect(mockOpenRepository).toHaveBeenCalledTimes(1);
    });

    it('scans Steam libraries', async () => {
        fireEvent.click(screen.getByRole('button', { name: /Scan Steam Libraries/i }));

        await waitFor(() => {
            expect(mockScan).toHaveBeenCalledTimes(1);
        });

        expect(await screen.findByRole('button', { name: 'C:\\Games\\Test Game\\game.log' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'C:\\Games\\Test Game\\temp' })).toBeInTheDocument();
        expect(screen.getByText('Test Game')).toBeInTheDocument();
        expect(screen.getByText('C:\\Program Files (x86)\\Steam')).toBeInTheDocument();
    });

    it('opens the Steam folder after scanning', async () => {
        fireEvent.click(screen.getByRole('button', { name: /Scan Steam Libraries/i }));

        await selectCandidate('C:\\Games\\Test Game\\game.log');

        fireEvent.click(screen.getByRole('button', { name: 'C:\\Program Files (x86)\\Steam' }));
        expect(mockOpenFolder).toHaveBeenCalledWith('C:\\Program Files (x86)\\Steam');
    });

    it('does not open the Steam folder before scanning', () => {
        expect(screen.queryByRole('button', { name: /Open Steam folder/i })).not.toBeInTheDocument();
        expect(mockOpenFolder).not.toHaveBeenCalled();
    });

    it('selects a candidate', async () => {
        fireEvent.click(screen.getByRole('button', { name: /Scan Steam Libraries/i }));

        const checkbox = await selectCandidate('C:\\Games\\Test Game\\game.log');

        expect(checkbox).not.toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
    });

    it('opens the cleanup confirmation when a candidate is selected', async () => {
        fireEvent.click(screen.getByRole('button', { name: /Scan Steam Libraries/i }));

        const checkbox = await selectCandidate('C:\\Games\\Test Game\\game.log');

        fireEvent.click(checkbox);
        fireEvent.click(screen.getByRole('button', { name: /Delete Selected/i }));
        expect(screen.getByRole('dialog', { name: /Move items to Recycle Bin/i })).toBeInTheDocument();
    });

    it('cancels cleanup', async () => {
        fireEvent.click(screen.getByRole('button', { name: /Scan Steam Libraries/i }));

        const checkbox = await selectCandidate('C:\\Games\\Test Game\\game.log');

        fireEvent.click(checkbox);
        fireEvent.click(screen.getByRole('button', { name: /Delete Selected/i }));

        const dialog = screen.getByRole('dialog', { name: /Move items to Recycle Bin/i });
        fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

        await waitFor(() => {
            expect(screen.queryByRole('dialog', { name: /Move items to Recycle Bin/i })).not.toBeInTheDocument();
        });
    });

    it('cleans selected candidates successfully', async () => {
        mockClean.mockResolvedValue({
            results: [
                {
                    id: 'game-log',
                    success: true
                }
            ]
        });
        fireEvent.click(screen.getByRole('button', { name: /Scan Steam Libraries/i }));

        const checkbox = await selectCandidate('C:\\Games\\Test Game\\game.log');

        fireEvent.click(checkbox);
        fireEvent.click(screen.getByRole('button', { name: /Delete Selected/i }));

        const dialog = screen.getByRole('dialog', { name: /Move items to Recycle Bin/i });

        fireEvent.click(within(dialog).getByRole('button', { name: 'Move to Recycle Bin' }));
        await waitFor(() => {
            expect(mockClean).toHaveBeenCalledWith(['game-log']);
        });
        await waitFor(() => {
            expect(screen.queryByRole('button', { name: 'C:\\Games\\Test Game\\game.log' })).not.toBeInTheDocument();
        });
    });

    it('shows an error when cleanup returns failed results', async () => {
        mockClean.mockResolvedValue({
            results: [
                {
                    id: 'game-log',
                    success: false,
                    error: 'Unable to delete file'
                }
            ]
        });
        fireEvent.click(screen.getByRole('button', { name: /Scan Steam Libraries/i }));

        const checkbox = await selectCandidate('C:\\Games\\Test Game\\game.log');

        fireEvent.click(checkbox);
        fireEvent.click(screen.getByRole('button', { name: /Delete Selected/i }));

        const dialog = screen.getByRole('dialog', { name: /Move items to Recycle Bin/i });

        fireEvent.click(within(dialog).getByRole('button', { name: 'Move to Recycle Bin' }));

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Unable to delete file');
        });
    });

    it('shows an error when cleanup throws', async () => {
        mockClean.mockRejectedValue(new Error('Cleanup failed'));
        fireEvent.click(screen.getByRole('button', { name: /Scan Steam Libraries/i }));

        const checkbox = await selectCandidate('C:\\Games\\Test Game\\game.log');

        fireEvent.click(checkbox);
        fireEvent.click(screen.getByRole('button', { name: /Delete Selected/i }));
        const dialog = screen.getByRole('dialog', { name: /Move items to Recycle Bin/i });

        fireEvent.click(within(dialog).getByRole('button', { name: 'Move to Recycle Bin' }));

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Cleanup failed. No selected items were removed from the list.');
        });
    });

    it('shows an available update', async () => {
        act(() => {
            updateAvailableCallback?.('1.2.0');
        });

        const dialog = await screen.findByRole('dialog', { name: 'SteamSweep Update' });

        expect(dialog).toHaveTextContent('Version 1.2.0 is available');
        expect(dialog).toHaveTextContent('Downloading update...');
        expect(dialog).toHaveTextContent('0%');
    });

    it('updates the download progress', async () => {
        act(() => {
            updateAvailableCallback?.('1.2.0');
            updateProgressCallback?.(50);
        });

        const dialog = await screen.findByRole('dialog', { name: 'SteamSweep Update' });
        expect(dialog).toHaveTextContent('50%');
    });

    it('shows the downloaded update', async () => {
        act(() => {
            updateAvailableCallback?.('1.2.0');
            updateDownloadedCallback?.('1.2.0');
        });

        const dialog = await screen.findByRole('dialog', { name: 'SteamSweep Update' });

        expect(dialog).toHaveTextContent('Version 1.2.0 is ready to install.');
        expect(dialog).toHaveTextContent('Restart SteamSweep to complete the update.');
        expect(screen.getByRole('button', { name: 'Restart Now' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Later' })).toBeInTheDocument();
    });

    it('installs the downloaded update', async () => {
        act(() => {
            updateAvailableCallback?.('1.2.0');
            updateDownloadedCallback?.('1.2.0');
        });

        fireEvent.click(await screen.findByRole('button', { name: 'Restart Now' }));
        expect(mockInstallUpdate).toHaveBeenCalledTimes(1);
    });

    it('dismisses the downloaded update', async () => {
        act(() => {
            updateAvailableCallback?.('1.2.0');
            updateDownloadedCallback?.('1.2.0');
        });

        fireEvent.click(await screen.findByRole('button', { name: 'Later' }));

        await waitFor(() => {
            expect(screen.queryByRole('dialog', { name: 'SteamSweep Update' })).not.toBeInTheDocument();
        });
    });

    it('shows the back-to-top button after scrolling', async () => {
        const app = document.querySelector('.app') as HTMLElement;

        Object.defineProperty(app, 'scrollTop', {
            value: 500,
            configurable: true
        });

        act(() => {
            app.dispatchEvent(new Event('scroll'));
        });
        expect(await screen.findByRole('button', { name: 'Back to top' })).toBeInTheDocument();
    });

    it('scrolls to the top when back-to-top is clicked', async () => {
        const app = document.querySelector('.app') as HTMLElement;

        Object.defineProperty(app, 'scrollTop', {
            value: 500,
            configurable: true
        });

        act(() => {
            app.dispatchEvent(new Event('scroll'));
        });

        fireEvent.click(await screen.findByRole('button', { name: 'Back to top' }));

        expect(app.scrollTo).toHaveBeenCalledWith({
            top: 0,
            behavior: 'smooth'
        });
    });
});
