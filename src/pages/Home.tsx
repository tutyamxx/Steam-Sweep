import { useEffect, useRef, useState } from 'react';
import { formatBytes, getCandidateLabel } from '../utils/cleanup';
import type { CleanupCandidate } from '../types/cleanup';

const Home = () => {
    const appRef = useRef<HTMLElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [candidates, setCandidates] = useState<CleanupCandidate[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [steamPath, setSteamPath] = useState<string | null>(null);
    const [hasScanned, setHasScanned] = useState(false);

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

    const handleMinimize = (): void => {
        window.steamSweep.window.minimize();
    };

    const handleClose = (): void => {
        window.steamSweep.window.close();
    };

    const handleOpenSteamFolder = (): void => {
        if (steamPath) {
            window.steamSweep.window.openFolder(steamPath);
        }
    };

    const handleScan = async (): Promise<void> => {
        setIsScanning(true);

        try {
            const result = await window.steamSweep.scan();
            setHasScanned(true);
            setSteamPath(result.steamPath);
            setCandidates(result.candidates);
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

    const totalSize = candidates.reduce((sum, candidate) => sum + candidate.size, 0);
    const selectedCandidates = candidates.filter((candidate) => selectedIds.has(candidate.id));
    const selectedSize = selectedCandidates.reduce((sum, candidate) => sum + candidate.size, 0);
    const allSelected =
		candidates.length > 0 &&
		selectedCandidates.length === candidates.length;
    const someSelected = selectedCandidates.length > 0 && !allSelected;

    const toggleAll = (): void => {
        setSelectedIds(() => {
            if (allSelected) {
                return new Set();
            }

            return new Set(candidates.map((candidate) => candidate.id));
        });
    };

    const groupedCandidates = candidates.reduce<Record<string, CleanupCandidate[]>>((groups, candidate) => {
        const key = `${candidate.gameId}-${candidate.gameName}`;
        (groups[key] ??= []).push(candidate);

        return groups;
    }, {});
    const gameGroups = Object.values(groupedCandidates);

    return (
        <main className='app' ref={appRef}>
            <header className='title-bar'>
                <div className='title-bar-drag'>
                    <span>Steam Sweep 🧹</span>
                </div>
                <div className='window-controls'>
                    <button
                        className='window-button minimize-button'
                        type='button'
                        onClick={handleMinimize}
                        aria-label='Minimize'
                    >
                        <span />
                    </button>
                    <button
                        className='window-button close-button'
                        type='button'
                        onClick={handleClose}
                        aria-label='Close'
                    >
						×
                    </button>
                </div>
            </header>

            <section className='hero'>
                <header className='header'>
                    <h1>Steam Sweep 🧹</h1>
                    <p>Find unnecessary leftovers 🗑️ in your Steam libraries.</p>
                </header>

                <section className='summary'>
                    <div className='summary-value'>{formatBytes(totalSize)}</div>
                    <div className='summary-label'>potentially removable</div>
                </section>

                <button
                    className='scan-button'
                    type='button'
                    onClick={handleScan}
                    disabled={isScanning}
                >
                    {isScanning ? 'Scanning... ⚙️' : 'Scan Steam Libraries 🎮'}
                </button>

                <div className={`status ${hasScanned && !steamPath ? 'not-found' : ''}`}>
                    <span
                        className={`status-dot ${
                            steamPath ? 'active' : hasScanned ? 'not-found' : ''
                        }`}
                    />
                    <span>
                        {steamPath ? (
                            <>
								Steam root directory found at{' '}
                                <button
                                    className='status-path'
                                    type='button'
                                    onClick={handleOpenSteamFolder}
                                    title='Open Steam folder in Windows Explorer'
                                >
                                    {steamPath}
                                </button>
                            </>
                        ) : hasScanned ? (
                            'Steam was not found on this computer.'
                        ) : (
                            'Scanning does not modify your files.'
                        )}
                    </span>
                </div>
            </section>

            {candidates.length > 0 && (
                <section className='games'>
                    <div className='section-header'>
                        <div>
                            <h2>Cleanup Candidates</h2>
                            <span>
                                {candidates.length} items · {gameGroups.length} games
                            </span>
                        </div>
                        <label className='select-all'>
                            <input
                                type='checkbox'
                                checked={allSelected}
                                ref={(input) => {
                                    if (input) {
                                        input.indeterminate = someSelected;
                                    }
                                }}
                                onChange={toggleAll}
                            />
                            <span className='checkbox' />
                            <span>Select All</span>
                        </label>
                    </div>

                    {selectedCandidates.length > 0 && (
                        <div className='selection-bar'>
                            <span>
                                {selectedCandidates.length} selected ·{' '}
                                {formatBytes(selectedSize)}
                            </span>
                            <button
                                className='delete-button'
                                type='button'
                            >
								Delete Selected
                            </button>
                        </div>
                    )}

                    <div className='game-list'>
                        {gameGroups.map((gameCandidates) => {
                            const first = gameCandidates[0];
                            if (!first) {
                                return null;
                            }
                            const gameSize = gameCandidates.reduce(
                                (sum, candidate) => sum + candidate.size,
                                0
                            );
                            const selected = gameCandidates.filter((candidate) =>
                                selectedIds.has(candidate.id)
                            );
                            const allGameSelected =
								selected.length === gameCandidates.length;
                            const someGameSelected =
								selected.length > 0 && !allGameSelected;

                            return (
                                <article
                                    className='game-card'
                                    key={`${first.gameId}-${first.gameName}`}
                                >
                                    <div className='game-header'>
                                        <label className='game-select'>
                                            <input
                                                type='checkbox'
                                                checked={allGameSelected}
                                                ref={(input) => {
                                                    if (input) {
                                                        input.indeterminate =
															someGameSelected;
                                                    }
                                                }}
                                                onChange={() =>
                                                    toggleGame(gameCandidates)
                                                }
                                            />
                                            <span className='checkbox' />
                                        </label>
                                        <div className='game-title'>
                                            <strong>{first.gameName}</strong>
                                            <span>
                                                {selected.length > 0
                                                    ? `${selected.length} selected`
                                                    : `${gameCandidates.length} items`}
                                            </span>
                                        </div>
                                        <span className='game-size'>
                                            {formatBytes(gameSize)}
                                        </span>
                                    </div>

                                    <div className='candidate-list'>
                                        {gameCandidates.map((candidate) => {
                                            const isSelected = selectedIds.has(
                                                candidate.id
                                            );

                                            return (
                                                <label
                                                    className={`candidate ${
                                                        isSelected ? 'selected' : ''
                                                    }`}
                                                    key={candidate.id}
                                                >
                                                    <div className='candidate-check'>
                                                        <input
                                                            type='checkbox'
                                                            checked={isSelected}
                                                            onChange={() =>
                                                                toggleCandidate(
                                                                    candidate.id
                                                                )
                                                            }
                                                        />
                                                        <span className='checkbox' />
                                                    </div>
                                                    <div className='candidate-info'>
                                                        <strong>
                                                            {getCandidateLabel(candidate)}
                                                        </strong>
                                                        <div
                                                            className='candidate-path'
                                                            title={candidate.path}
                                                        >
                                                            {candidate.path}
                                                        </div>
                                                    </div>
                                                    <span className='candidate-size'>
                                                        {formatBytes(candidate.size)}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}

            <footer className={`footer ${candidates.length > 0 ? 'has-candidates' : ''}`}>
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
        </main>
    );
};

export { Home };
