import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { ScanSection } from './ScanSection';

jest.unstable_mockModule('./SteamSweepLogo.js', () => ({
    SteamSweepLogo: ({ className }: { className?: string }) => (
        <div className={className}>SteamSweep Logo</div>
    )
}));

describe('ScanSection', () => {
    const renderScanSection = (overrides = {}) => {
        const props = {
            totalSize: 1024,
            isScanning: false,
            steamPath: null,
            hasScanned: false,
            onScan: jest.fn(),
            onOpenSteamFolder: jest.fn(),
            ...overrides
        };
        render(<ScanSection {...props} />);

        return props;
    };

    it('renders the landing section', () => {
        renderScanSection();

        expect(screen.getByRole('heading', { name: 'Steam Sweep 🧹' })).toBeInTheDocument();
        expect(screen.getByText('Find unnecessary leftovers 🗑️ in your Steam libraries.')).toBeInTheDocument();
        expect(screen.getByText('potentially removable')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Scan Steam Libraries 🎮' })).toBeInTheDocument();
        expect(screen.getByText('Scanning does not modify your files.')).toBeInTheDocument();
    });

    it('formats the total removable size', () => {
        renderScanSection({ totalSize: 2048 });
        expect(screen.getByText('2.00 KB')).toBeInTheDocument();
    });

    it('starts a scan when the scan button is clicked', () => {
        const { onScan } = renderScanSection();

        fireEvent.click(screen.getByRole('button', { name: 'Scan Steam Libraries 🎮' }));
        expect(onScan).toHaveBeenCalled();
    });

    it('disables the scan button and shows the scanning state while scanning', () => {
        renderScanSection({ isScanning: true });

        const scanButton = screen.getByRole('button', { name: 'Scanning please wait...' });

        expect(scanButton).toBeDisabled();
        expect(screen.getByText('Scanning please wait...')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Scan Steam Libraries 🎮' })).not.toBeInTheDocument();
    });

    it('shows the Steam root directory when Steam is found', () => {
        const steamPath = 'C:\\Program Files (x86)\\Steam';
        const { onOpenSteamFolder } = renderScanSection({ steamPath, hasScanned: true });

        expect(screen.getByText('Steam root directory found at')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: steamPath })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: steamPath })).toHaveAttribute('title', 'Open Steam folder in Windows Explorer');

        fireEvent.click(screen.getByRole('button', { name: steamPath }));
        expect(onOpenSteamFolder).toHaveBeenCalled();
    });

    it('shows the Steam not found state after scanning', () => {
        renderScanSection({ hasScanned: true });

        expect(screen.getByText('Steam was not found on this computer.')).toBeInTheDocument();
        expect(screen.queryByText('Scanning does not modify your files.')).not.toBeInTheDocument();
    });

    it('applies the not-found status class after a scan without Steam', () => {
        renderScanSection({ hasScanned: true });

        const statusMessage = screen.getByText('Steam was not found on this computer.');
        const status = statusMessage.closest('.status');
        const statusDot = status?.querySelector('.status-dot');

        expect(status).toHaveClass('status', 'not-found');
        expect(statusDot).toHaveClass('status-dot', 'not-found');
    });

    it('applies the active status class when Steam is found', () => {
        const steamPath = 'D:\\Steam';
        renderScanSection({ steamPath });

        const statusMessage = screen.getByText('Steam root directory found at');
        const status = statusMessage.closest('.status');
        const statusDot = status?.querySelector('.status-dot');

        expect(status).not.toHaveClass('not-found');
        expect(statusDot).toHaveClass('status-dot', 'active');
    });
});
