import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import packageJson from '../../package.json';
import { jest } from '@jest/globals';
import { TitleBar } from './TitleBar';

const mockOpenRepository = jest.fn();
const mockMaximize = jest.fn();

Object.defineProperty(window, 'steamSweep', {
    value: {
        openRepository: mockOpenRepository,
        window: {
            maximize: mockMaximize
        }
    },
    configurable: true
});

describe('TitleBar', () => {
    beforeEach(() => {
        mockOpenRepository.mockReset();
        mockMaximize.mockReset();
    });

    const renderTitleBar = () => {
        const onMinimize = jest.fn();
        const onClose = jest.fn();

        render(
            <TitleBar onMinimize={onMinimize}
                onClose={onClose}
            />
        );

        return {
            onMinimize,
            onClose
        };
    };

    it('renders the application title and version', () => {
        renderTitleBar();

        expect(screen.getByText('Steam Sweep')).toBeInTheDocument();
        expect(screen.getByText(`v${packageJson.version}`)).toBeInTheDocument();
    });

    it('renders the window controls', () => {
        renderTitleBar();

        expect(screen.getByRole('button', { name: 'Open GitHub repository' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Maximize or restore window' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('opens the GitHub repository when the repository button is clicked', () => {
        renderTitleBar();

        fireEvent.click(screen.getByRole('button', { name: 'Open GitHub repository' }));
        expect(mockOpenRepository).toHaveBeenCalled();
    });

    it('minimizes the window when the minimize button is clicked', () => {
        const { onMinimize } = renderTitleBar();

        fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));
        expect(onMinimize).toHaveBeenCalled();
    });

    it('maximizes or restores the window when the maximize button is clicked', () => {
        renderTitleBar();

        fireEvent.click(screen.getByRole('button', { name: 'Maximize or restore window' }));
        expect(mockMaximize).toHaveBeenCalled();
    });

    it('closes the window when the close button is clicked', () => {
        const { onClose } = renderTitleBar();

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(onClose).toHaveBeenCalled();
    });

    it('renders the expected control titles', () => {
        renderTitleBar();

        expect(screen.getByRole('button', { name: 'Open GitHub repository' })).toHaveAttribute('title', 'GitHub repository');
        expect(screen.getByRole('button', { name: 'Maximize or restore window' })).toHaveAttribute('title', 'Maximize');
        expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('title', 'Close');
    });

    it('renders the repository, maximize and close SVG icons', () => {
        renderTitleBar();

        const repositoryButton = screen.getByRole('button', { name: 'Open GitHub repository' });
        const maximizeButton = screen.getByRole('button', { name: 'Maximize or restore window' });
        const closeButton = screen.getByRole('button', { name: 'Close' });

        expect(repositoryButton.querySelector('svg')).toBeInTheDocument();
        expect(maximizeButton.querySelector('svg')).toBeInTheDocument();
        expect(closeButton.querySelector('svg')).toBeInTheDocument();
    });
});
