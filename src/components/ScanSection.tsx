import { formatBytes } from '../utils/cleanup';

interface HeroProps {
	totalSize: number;
	isScanning: boolean;
	steamPath: string | null;
	hasScanned: boolean;

	onScan: () => void;
	onOpenSteamFolder: () => void;
}

/**
 * Renders the main SteamSweep landing section.
 *
 * @param props - Hero state and event handlers.
 * @returns The application hero section.
 */
const ScanSection = ({
    totalSize,
    isScanning,
    steamPath,
    hasScanned,
    onScan,
    onOpenSteamFolder
}: HeroProps) => {
    return (
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
                onClick={onScan}
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
                                onClick={onOpenSteamFolder}
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
    );
};

export { ScanSection };
export type { HeroProps };
