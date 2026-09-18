import { useEffect, useRef, useState } from 'react';
import { CleanupList } from '../components/CleanupList';
import { ScanSection } from '../components/ScanSection';
import { TitleBar } from '../components/TitleBar';
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

    const toggleAll = (): void => {
        setSelectedIds(() => {
            if (candidates.length > 0 && candidates.every((candidate) => selectedIds.has(candidate.id))) {
                return new Set();
            }

            return new Set(candidates.map((candidate) => candidate.id));
        });
    };

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

            <CleanupList
                candidates={candidates}
                selectedIds={selectedIds}
                onToggleCandidate={toggleCandidate}
                onToggleGame={toggleGame}
                onToggleAll={toggleAll}
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
        </main>
    );
};

export { Home };
