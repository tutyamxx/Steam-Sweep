interface TitleBarProps {
	onMinimize: () => void;
	onClose: () => void;
}

/**
 * Renders the custom SteamSweep application title bar and window controls.
 *
 * @param props - Title bar event handlers.
 * @returns The application title bar.
 */
const TitleBar = ({ onMinimize, onClose }: TitleBarProps) => {
    return (
        <header className='title-bar'>
            <div className='title-bar-drag'>
                <span>Steam Sweep</span>
            </div>
            <div className='window-controls'>
                <button
                    className='window-button repository-button'
                    type='button'
                    onClick={() => window.steamSweep.openRepository()}
                    aria-label='Open GitHub repository'
                    title='GitHub repository'
                >
                    <svg
                        viewBox='0 0 24 24'
                        aria-hidden='true'
                    >
                        <path
                            fill='currentColor'
                            d='M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.87-1.54-3.87-1.54-.53-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.33.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z'
                        />
                    </svg>
                </button>
                <button
                    className='window-button minimize-button'
                    type='button'
                    onClick={onMinimize}
                    aria-label='Minimize'
                >
                    <span />
                </button>
                <button
                    className='window-button maximize-button'
                    type='button'
                    onClick={() => window.steamSweep.window.maximize()}
                    aria-label='Maximize or restore window'
                    title='Maximize'
                >
                    <svg
                        viewBox='0 0 12 12'
                        aria-hidden='true'
                    >
                        <rect
                            x='2'
                            y='2'
                            width='8'
                            height='8'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='1.2'
                        />
                    </svg>
                </button>
                <button
                    className='window-button close-button'
                    type='button'
                    onClick={onClose}
                    aria-label='Close'
                >
					×
                </button>
            </div>
        </header>
    );
};

export { TitleBar };

export type { TitleBarProps };
