import { formatBytes } from '../utils/utils';
import { SteamSweepLogo } from './SteamSweepLogo';

interface ScanProps {
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
 * @returns     The application hero section.
 */
export const ScanSection = ({
    totalSize,
    isScanning,
    steamPath,
    hasScanned,
    onScan,
    onOpenSteamFolder
}: ScanProps) => {
    return (
        <section className='hero'>
            <header className='header'>
                <SteamSweepLogo className='steam-sweep-logo' />
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
                {isScanning ? (
                    <>
                        <svg
                            className='scanning-cog'
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 24 24'
                            aria-hidden='true'
                        >
                            <path
                                d='M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65-2-3.46-2.49 1c-.52-.4-1.08-.73-1.69-.98L15 3h-4l-.36 2.93c-.61.25-1.17.59-1.69.98l-2.49-1-2 3.46 2.11 1.65c-.04.32-.08.65-.08.98s.03.66.08.98l-2.11 1.65 2 3.46 2.49-1c.52.4 1.08.73 1.69.98L11 21h4l.36-2.93c.61-.25 1.17-.59 1.69-.98l2.49 1 2-3.46-2.11-1.65z'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='1.8'
                                strokeLinejoin='round'
                            />
                            <circle
                                cx='13'
                                cy='12'
                                r='3'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='1.8'
                            />
                        </svg>
                        Scanning please wait...
                    </>
                ) : (
                    'Scan Steam Libraries 🎮'
                )}
            </button>

            <div className={`status ${hasScanned && !steamPath ? 'not-found' : ''}`}>
                <span
                    className={`status-dot ${steamPath ? 'active' : hasScanned ? 'not-found' : ''}`}
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

export type { ScanProps };
