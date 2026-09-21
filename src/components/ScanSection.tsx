import { formatBytes } from '../utils/utils';

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
                <svg
                    className='steam-sweep-logo'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 512 512'
                    role='img'
                    aria-label='SteamSweep logo'
                >
                    <defs>
                        <radialGradient id='logo-bg' cx='50%' cy='38%' r='65%'>
                            <stop offset='0%' stopColor='#243b52' />
                            <stop offset='70%' stopColor='#162536' />
                            <stop offset='100%' stopColor='#0b1119' />
                        </radialGradient>
                        <linearGradient id='logo-blue' x1='0%' y1='0%' x2='100%' y2='100%'>
                            <stop offset='0%' stopColor='#66d7ff' />
                            <stop offset='45%' stopColor='#1a9fff' />
                            <stop offset='100%' stopColor='#006699' />
                        </linearGradient>
                        <linearGradient id='logo-metal' x1='0%' y1='0%' x2='100%' y2='100%'>
                            <stop offset='0%' stopColor='#ffffff' />
                            <stop offset='45%' stopColor='#d9e2ea' />
                            <stop offset='100%' stopColor='#7d8b96' />
                        </linearGradient>
                        <linearGradient id='logo-bristles' x1='0%' y1='0%' x2='0%' y2='100%'>
                            <stop offset='0%' stopColor='#66e5ff' />
                            <stop offset='100%' stopColor='#008dcc' />
                        </linearGradient>
                        <filter id='logo-glow' x='-40%' y='-40%' width='180%' height='180%'>
                            <feGaussianBlur stdDeviation='7' result='blur' />
                            <feMerge>
                                <feMergeNode in='blur' />
                                <feMergeNode in='SourceGraphic' />
                            </feMerge>
                        </filter>
                    </defs>

                    <circle cx='256' cy='256' r='236' fill='#080d14' />
                    <circle cx='256' cy='256' r='224' fill='url(#logo-bg)' />
                    <circle
                        cx='256'
                        cy='256'
                        r='224'
                        fill='none'
                        stroke='#0b151f'
                        strokeWidth='14'
                    />
                    <circle
                        cx='256'
                        cy='256'
                        r='214'
                        fill='none'
                        stroke='url(#logo-blue)'
                        strokeWidth='5'
                        opacity='0.9'
                    />
                    <circle
                        cx='256'
                        cy='256'
                        r='198'
                        fill='none'
                        stroke='#66c0f4'
                        strokeWidth='2'
                        strokeDasharray='2 18'
                        opacity='0.45'
                    />

                    <circle
                        cx='256'
                        cy='256'
                        r='52'
                        fill='#111d2a'
                        stroke='url(#logo-blue)'
                        strokeWidth='8'
                    />

                    <circle
                        cx='256'
                        cy='256'
                        r='22'
                        fill='url(#logo-blue)'
                        filter='url(#logo-glow)'
                    />

                    <circle cx='256' cy='256' r='9' fill='#ffffff' />

                    <path
                        d='M 217 278 L 151 344'
                        fill='none'
                        stroke='url(#logo-metal)'
                        strokeWidth='20'
                        strokeLinecap='round'
                    />

                    <circle
                        cx='145'
                        cy='350'
                        r='25'
                        fill='#162536'
                        stroke='url(#logo-blue)'
                        strokeWidth='7'
                    />

                    <circle cx='145' cy='350' r='8' fill='#ffffff' />

                    <g transform='rotate(-38 256 256)'>
                        <rect
                            x='246'
                            y='65'
                            width='20'
                            height='255'
                            rx='10'
                            fill='url(#logo-metal)'
                        />

                        <rect
                            x='249'
                            y='70'
                            width='6'
                            height='230'
                            rx='3'
                            fill='#ffffff'
                            opacity='0.6'
                        />

                        <circle
                            cx='256'
                            cy='67'
                            r='18'
                            fill='#162536'
                            stroke='url(#logo-blue)'
                            strokeWidth='6'
                        />

                        <path
                            d='M 205 305 L 307 305 L 326 337 L 186 337 Z'
                            fill='url(#logo-metal)'
                        />

                        <rect
                            x='190'
                            y='331'
                            width='132'
                            height='13'
                            rx='6'
                            fill='#101923'
                            stroke='#66c0f4'
                            strokeWidth='2'
                        />

                        <path
                            d='M 190 340 Q 256 375 322 340 L 382 423 Q 256 470 130 423 Z'
                            fill='url(#logo-bristles)'
                            filter='url(#logo-glow)'
                        />

                        <path
                            d='M 190 343 L 154 426
				M 215 350 L 194 440
				M 240 355 L 232 446
				M 266 355 L 274 446
				M 292 350 L 318 440
				M 317 343 L 356 426'
                            fill='none'
                            stroke='#0c4562'
                            strokeWidth='4'
                            strokeLinecap='round'
                            opacity='0.7'
                        />
                    </g>

                    <path
                        d='M 90 300 A 185 185 0 0 1 405 135'
                        fill='none'
                        stroke='#66e5ff'
                        strokeWidth='7'
                        strokeLinecap='round'
                        opacity='0.65'
                        filter='url(#logo-glow)'
                    />

                    <path
                        d='M 105 330 A 205 205 0 0 1 425 165'
                        fill='none'
                        stroke='#168fd0'
                        strokeWidth='4'
                        strokeLinecap='round'
                        opacity='0.45'
                    />

                    <g fill='#ffffff' filter='url(#logo-glow)'>
                        <path d='M 378 92 L 384 108 L 400 114 L 384 120 L 378 136 L 372 120 L 356 114 L 372 108 Z' />
                        <path d='M 112 155 L 117 168 L 130 173 L 117 178 L 112 191 L 107 178 L 94 173 L 107 168 Z' opacity='0.8' />
                        <circle cx='410' cy='250' r='5' />
                    </g>
                </svg>

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
