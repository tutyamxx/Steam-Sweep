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
                    className='window-button minimize-button'
                    type='button'
                    onClick={onMinimize}
                    aria-label='Minimize'
                >
                    <span />
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
