import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { jest } from '@jest/globals';
import { Home } from './Home';
import type { CleanupCandidate, CleanupResult } from '../../types/cleanup';

interface UpdateCallbacks {
    available?: (version: string) => void;
    progress?: (percent: number) => void;
    downloaded?: (version: string) => void;
}

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

const steamPath = 'C:\\Program Files (x86)\\Steam';
const logPath = 'C:\\Games\\Test Game\\game.log';
const tempPath = 'C:\\Games\\Test Game\\temp';
const scanButton = /Scan Steam Libraries/i;
const recycleBinDialogName = /Move items to Recycle Bin/i;
const updateDialogName = 'SteamSweep Update';

const baseCandidate = {
    gameId: 123456,
    gameName: 'Test Game',
    confidence: 'safe'
} as const;

const candidates: CleanupCandidate[] = [
    { ...baseCandidate, id: 'game-log', path: logPath, type: 'log', size: 4096, reason: 'Log file' },
    { ...baseCandidate, id: 'game-temp', path: tempPath, type: 'temp-folder', size: 2048, reason: 'Temporary folder' }
];

const scanResult = {
    steamPath,
    candidates
};

let updateCallbacks: UpdateCallbacks = {};

/**
 * Creates a mock implementation that stores the callback registered by the component.
 *
 * @param key - Update callback slot to store the registered callback in.
 * @returns   Mock implementation for the matching `onUpdate*` function.
 */
const captureCallback = <Key extends keyof UpdateCallbacks>(key: Key) => (callback: unknown): void => {
    updateCallbacks[key] = callback as UpdateCallbacks[Key];
};

const setup = (): void => {
    [
        mockScan,
        mockClean,
        mockMinimize,
        mockClose,
        mockOpenFolder,
        mockShowFile,
        mockInstallUpdate,
        mockOpenRepository,
        mockOnUpdateAvailable,
        mockOnUpdateProgress,
        mockOnUpdateDownloaded
    ].forEach((mock) => mock.mockReset());

    mockScan.mockResolvedValue(scanResult);
    mockClean.mockResolvedValue({
        results: []
    });
    updateCallbacks = {};
    mockOnUpdateAvailable.mockImplementation(captureCallback('available'));
    mockOnUpdateProgress.mockImplementation(captureCallback('progress'));
    mockOnUpdateDownloaded.mockImplementation(captureCallback('downloaded'));

    render(<Home />);
};

/**
 * Clicks a button found by its accessible name.
 *
 * @param name  - Accessible name of the button.
 * @param scope - Queries to search in, defaults to the whole screen.
 */
const clickButton = (name: string | RegExp, scope: Pick<typeof screen, 'getByRole'> = screen): void => {
    fireEvent.click(scope.getByRole('button', { name }));
};

const selectCandidate = async (path: string): Promise<HTMLInputElement> => {
    const candidatePath = await screen.findByRole('button', {
        name: path
    });
    const candidate = candidatePath.closest('.candidate');

    expect(candidate).not.toBeNull();

    return candidate!.querySelector('input[type="checkbox"]') as HTMLInputElement;
};

/**
 * Scans, selects the log candidate and opens the cleanup confirmation dialog.
 *
 * @returns The cleanup confirmation dialog.
 */
const openCleanupDialog = async (): Promise<HTMLElement> => {
    clickButton(scanButton);
    fireEvent.click(await selectCandidate(logPath));
    clickButton(/Delete Selected/i);

    return screen.getByRole('dialog', { name: recycleBinDialogName });
};

/**
 * Confirms the cleanup dialog. Intentionally synchronous: the caller must reach `waitFor`
 * in the same tick as the click, otherwise the component's async state updates
 * run outside of `act` and React logs warnings.
 *
 * @param dialog - The cleanup confirmation dialog.
 */
const confirmCleanup = (dialog: HTMLElement): void => {
    clickButton('Move to Recycle Bin', within(dialog));
};

const emitDownloadedUpdate = (): void => {
    act(() => {
        updateCallbacks.available?.('1.2.0');
        updateCallbacks.downloaded?.('1.2.0');
    });
};

/**
 * Scrolls the app container far enough to reveal the back-to-top button.
 *
 * @returns The scrolled app container.
 */
const scrollApp = (): HTMLElement => {
    const app = document.querySelector('.app') as HTMLElement;

    Object.defineProperty(app, 'scrollTop', {
        value: 500,
        configurable: true
    });

    act(() => {
        app.dispatchEvent(new Event('scroll'));
    });

    return app;
};

describe('Home', () => {
    beforeEach(() => {
        setup();
    });

    it('renders the home page', () => {
        expect(screen.getByText('Steam Sweep')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'SteamSweep logo' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: scanButton })).toBeInTheDocument();
    });

    it('registers update listeners', () => {
        [mockOnUpdateAvailable, mockOnUpdateProgress, mockOnUpdateDownloaded].forEach((listener) => {
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });

    it.each([
        { name: 'minimizes the window', button: 'Minimize', action: mockMinimize },
        { name: 'closes the window', button: 'Close', action: mockClose },
        { name: 'opens the GitHub repository', button: 'Open GitHub repository', action: mockOpenRepository }
    ])('$name', ({ button, action }) => {
        clickButton(button);

        expect(action).toHaveBeenCalledTimes(1);
    });

    it('scans Steam libraries', async () => {
        clickButton(scanButton);

        await waitFor(() => {
            expect(mockScan).toHaveBeenCalledTimes(1);
        });

        expect(await screen.findByRole('button', { name: logPath })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: tempPath })).toBeInTheDocument();
        expect(screen.getByText('Test Game')).toBeInTheDocument();
        expect(screen.getByText(steamPath)).toBeInTheDocument();
    });

    it('opens the Steam folder after scanning', async () => {
        clickButton(scanButton);

        await selectCandidate(logPath);

        clickButton(steamPath);
        expect(mockOpenFolder).toHaveBeenCalledWith(steamPath);
    });

    it('does not open the Steam folder before scanning', () => {
        expect(screen.queryByRole('button', { name: /Open Steam folder/i })).not.toBeInTheDocument();
        expect(mockOpenFolder).not.toHaveBeenCalled();
    });

    it('selects a candidate', async () => {
        clickButton(scanButton);

        const checkbox = await selectCandidate(logPath);

        expect(checkbox).not.toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
    });

    it('opens the cleanup confirmation when a candidate is selected', async () => {
        expect(await openCleanupDialog()).toBeInTheDocument();
    });

    it('cancels cleanup', async () => {
        clickButton('Cancel', within(await openCleanupDialog()));

        await waitFor(() => {
            expect(screen.queryByRole('dialog', { name: recycleBinDialogName })).not.toBeInTheDocument();
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

        confirmCleanup(await openCleanupDialog());
        await waitFor(() => {
            expect(mockClean).toHaveBeenCalledWith(['game-log']);
        });
        await waitFor(() => {
            expect(screen.queryByRole('button', { name: logPath })).not.toBeInTheDocument();
        });
    });

    it.each([
        {
            name: 'shows an error when cleanup returns failed results',
            arrange: () => mockClean.mockResolvedValue({
                results: [
                    {
                        id: 'game-log',
                        success: false,
                        error: 'Unable to delete file'
                    }
                ]
            }),
            message: 'Unable to delete file'
        },
        {
            name: 'shows an error when cleanup throws',
            arrange: () => mockClean.mockRejectedValue(new Error('Cleanup failed')),
            message: 'Cleanup failed. No selected items were removed from the list.'
        }
    ])('$name', async ({ arrange, message }) => {
        arrange();

        confirmCleanup(await openCleanupDialog());

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent(message);
        });
    });

    it('shows an available update', async () => {
        act(() => {
            updateCallbacks.available?.('1.2.0');
        });

        const dialog = await screen.findByRole('dialog', { name: updateDialogName });

        expect(dialog).toHaveTextContent('Version 1.2.0 is available');
        expect(dialog).toHaveTextContent('Downloading update...');
        expect(dialog).toHaveTextContent('0%');
    });

    it('updates the download progress', async () => {
        act(() => {
            updateCallbacks.available?.('1.2.0');
            updateCallbacks.progress?.(50);
        });

        const dialog = await screen.findByRole('dialog', { name: updateDialogName });
        expect(dialog).toHaveTextContent('50%');
    });

    it('shows the downloaded update', async () => {
        emitDownloadedUpdate();

        const dialog = await screen.findByRole('dialog', { name: updateDialogName });

        expect(dialog).toHaveTextContent('Version 1.2.0 is ready to install.');
        expect(dialog).toHaveTextContent('Restart SteamSweep to complete the update.');
        expect(screen.getByRole('button', { name: 'Restart Now' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Later' })).toBeInTheDocument();
    });

    it('installs the downloaded update', async () => {
        emitDownloadedUpdate();

        fireEvent.click(await screen.findByRole('button', { name: 'Restart Now' }));
        expect(mockInstallUpdate).toHaveBeenCalledTimes(1);
    });

    it('dismisses the downloaded update', async () => {
        emitDownloadedUpdate();

        fireEvent.click(await screen.findByRole('button', { name: 'Later' }));

        await waitFor(() => {
            expect(screen.queryByRole('dialog', { name: updateDialogName })).not.toBeInTheDocument();
        });
    });

    it('shows the back-to-top button after scrolling', async () => {
        scrollApp();
        expect(await screen.findByRole('button', { name: 'Back to top' })).toBeInTheDocument();
    });

    it('scrolls to the top when back-to-top is clicked', async () => {
        const app = scrollApp();

        fireEvent.click(await screen.findByRole('button', { name: 'Back to top' }));

        expect(app.scrollTo).toHaveBeenCalledWith({
            top: 0,
            behavior: 'smooth'
        });
    });
});
