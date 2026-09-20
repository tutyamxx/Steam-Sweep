import { useEffect, useRef, useState } from 'react';
import { CleanupList } from '../components/CleanupList';
import { ScanSection } from '../components/ScanSection';
import { TitleBar } from '../components/TitleBar';
import { formatBytes } from '../utils/utils';
import type { CleanupCandidate, CleanupResult } from '../../types/cleanup';

const Home = () => {
    const appRef = useRef<HTMLElement>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);

    const [showBackToTop, setShowBackToTop] = useState(false);
    const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
    const [showCleanupProgress, setShowCleanupProgress] = useState(false);

    const [candidates, setCandidates] = useState<CleanupCandidate[]>([]);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [steamPath, setSteamPath] = useState<string | null>(null);

    const [hasScanned, setHasScanned] = useState(false);
    const [cleanupError, setCleanupError] = useState<string | null>(null);

    useEffect(() => {
        const app = appRef.current;

        if (!app) {
            return;
        }

        const handleScroll = (): void => {
            setShowBackToTop(app.scrollTop > 400);
        };

        app.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            app.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToTop = (): void => {
        appRef.current?.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const handleMinimize = (): void => window.steamSweep.window.minimize();
    const handleClose = (): void => window.steamSweep.window.close();

    const handleOpenSteamFolder = (): void => {
        if (steamPath) {
            window.steamSweep.window.openFolder(steamPath);
        }
    };

    const handleScan = async (): Promise<void> => {
        setIsScanning(true);
        setCleanupError(null);

        try {
            const result = await window.steamSweep.scan();

            setHasScanned(true);
            setSteamPath(result?.steamPath ?? null);
            setCandidates(result?.candidates ?? []);
            setSelectedIds(new Set());
            scrollToTop();
        } finally {
            setIsScanning(false);
        }
    };

    const toggleCandidate = (id: string): void => {
        setSelectedIds((current) => {
            const next = new Set(current);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const toggleGame = (gameCandidates: CleanupCandidate[]): void => {
        setSelectedIds((current) => {
            const next = new Set(current);
            const allSelected = gameCandidates.every((candidate) => next.has(candidate.id));

            for (const candidate of gameCandidates) {
                if (allSelected) {
                    next.delete(candidate.id);
                } else {
                    next.add(candidate.id);
                }
            }

            return next;
        });
    };

    const toggleAll = (): void => {
        const allSelected = candidates.length > 0 && candidates.every((candidate) => selectedIds.has(candidate.id));

        if (allSelected) {
            setSelectedIds(new Set());

            return;
        }

        setSelectedIds(new Set(candidates.map((candidate) => candidate.id)));
    };

    const handleDeleteSelected = (): void => {
        const selectedCandidates = candidates.filter((candidate) => selectedIds.has(candidate.id));

        if (selectedCandidates.length === 0 || isCleaning) {
            return;
        }

        setCleanupError(null);
        setShowCleanupConfirm(true);
    };

    const handleConfirmCleanup = async (): Promise<void> => {
        const selectedCandidates = candidates.filter((candidate) => selectedIds.has(candidate.id));

        if (selectedCandidates.length === 0 || isCleaning) {
            setShowCleanupConfirm(false);

            return;
        }

        setShowCleanupConfirm(false);
        setShowCleanupProgress(true);
        setIsCleaning(true);
        setCleanupError(null);

        try {
            const result: CleanupResult = await window.steamSweep.clean(selectedCandidates.map((candidate) => candidate.id));
            const successfulIds = new Set(result.results?.filter((cleanupResult) => cleanupResult.success).map((cleanupResult) => cleanupResult.id) ?? []);
            const failedResults = result.results?.filter((cleanupResult) => !cleanupResult.success) ?? [];

            setCandidates((current) => current.filter((candidate) => !successfulIds.has(candidate.id)));

            setSelectedIds((current) => {
                const next = new Set(current);

                for (const id of successfulIds) {
                    next.delete(id);
                }

                return next;
            });

            if (failedResults.length > 0) {
                const error = failedResults[0]?.error;

                setCleanupError(error
                    ? `${failedResults.length} item${failedResults.length === 1 ? '' : 's'} could not be moved to the Recycle Bin: ${error}`
                    : `${failedResults.length} item${failedResults.length === 1 ? '' : 's'} could not be moved to the Recycle Bin.`
                );
            }
        } catch {
            setCleanupError('Cleanup failed. No selected items were removed from the list.');
        } finally {
            setIsCleaning(false);
            setShowCleanupProgress(false);
        }
    };

    const selectedCandidates = candidates.filter((candidate) => selectedIds.has(candidate.id));
    const selectedSize = selectedCandidates.reduce((sum, candidate) => sum + candidate.size, 0);
    const totalSize = candidates.reduce((sum, candidate) => sum + candidate.size, 0);

    return (
        <main className='app' ref={appRef}>
            <TitleBar
                onMinimize={handleMinimize}
                onClose={handleClose}
            />

            <ScanSection
                totalSize={totalSize}
                isScanning={isScanning}
                steamPath={steamPath}
                hasScanned={hasScanned}
                onScan={handleScan}
                onOpenSteamFolder={handleOpenSteamFolder}
            />
            {cleanupError && (
                <div className='cleanup-error' role='alert'>
                    {cleanupError}
                </div>
            )}

            <CleanupList
                candidates={candidates}
                selectedIds={selectedIds}
                onToggleCandidate={toggleCandidate}
                onToggleGame={toggleGame}
                onToggleAll={toggleAll}
                onDeleteSelected={handleDeleteSelected}
            />

            <footer
                className={`footer ${
                    candidates.length > 0 ? 'has-candidates' : ''
                }`}
            >
				This is an unofficial software and is not affiliated with Valve or Steam.
                <br />
				Steam and the Steam logo are trademarks and/or registered trademarks of Valve Corporation in the U.S. and/or other countries.
            </footer>

            {showBackToTop && (
                <button
                    className='back-to-top'
                    type='button'
                    onClick={scrollToTop}
                    aria-label='Back to top'
                >
					↑ Top
                </button>
            )}

            {showCleanupConfirm && (
                <div className='cleanup-modal-backdrop' role='presentation'>
                    <div
                        className='cleanup-modal'
                        role='dialog'
                        aria-modal='true'
                        aria-labelledby='cleanup-modal-title'
                    >
                        <h2 id='cleanup-modal-title'>Move items to Recycle Bin?</h2>
                        <p>
							Move {selectedCandidates.length} item{selectedCandidates.length === 1 ? '' : 's'} (<strong>{formatBytes(selectedSize)}</strong>) to the Windows Recycle Bin?
                        </p>
                        <div className='cleanup-modal-actions'>
                            <button
                                className='cleanup-cancel-button'
                                type='button'
                                onClick={() => setShowCleanupConfirm(false)}
                            >
								Cancel
                            </button>
                            <button
                                className='delete-button'
                                type='button'
                                onClick={handleConfirmCleanup}
                            >
								Move to Recycle Bin
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCleanupProgress && (
                <div className='cleanup-progress-backdrop' role='presentation'>
                    <div
                        className='cleanup-progress'
                        role='status'
                        aria-live='polite'
                        aria-label='Moving files to the Recycle Bin'
                    >
                        <div className='cleanup-progress-spinner' />
                        <h2>Moving files to Recycle Bin...</h2>
                        <span>Deleting {selectedCandidates.length} item{selectedCandidates.length === 1 ? '' : 's'} (<strong>{formatBytes(selectedSize)}</strong>)</span>
                    </div>
                </div>
            )}
        </main>
    );
};

export { Home };
