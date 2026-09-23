import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { SteamSweepLogo } from './SteamSweepLogo';

describe('SteamSweepLogo', () => {
    it('renders the logo with its accessible label', () => {
        render(<SteamSweepLogo />);
        expect(screen.getByRole('img', { name: 'SteamSweep logo' })).toBeInTheDocument();
    });

    it('renders the SVG with the correct viewBox', () => {
        render(<SteamSweepLogo />);
        expect(screen.getByRole('img', { name: 'SteamSweep logo' })).toHaveAttribute('viewBox', '0 0 512 512');
    });

    it('applies the provided className', () => {
        render(<SteamSweepLogo className='steam-sweep-logo' />);
        expect(screen.getByRole('img', { name: 'SteamSweep logo' })).toHaveClass('steam-sweep-logo');
    });

    it('renders the logo gradients and filter', () => {
        render(<SteamSweepLogo />);

        const logo = screen.getByRole('img', { name: 'SteamSweep logo' });

        expect(logo.querySelector('#steam-sweep-logo-bg')).toBeInTheDocument();
        expect(logo.querySelector('#steam-sweep-logo-blue')).toBeInTheDocument();
        expect(logo.querySelector('#steam-sweep-logo-metal')).toBeInTheDocument();
        expect(logo.querySelector('#steam-sweep-logo-bristles')).toBeInTheDocument();
        expect(logo.querySelector('#steam-sweep-logo-glow')).toBeInTheDocument();
    });

    it('renders the main logo shapes', () => {
        render(<SteamSweepLogo />);

        const logo = screen.getByRole('img', { name: 'SteamSweep logo' });

        expect(logo.querySelectorAll('circle').length).toBeGreaterThan(0);
        expect(logo.querySelectorAll('path').length).toBeGreaterThan(0);
        expect(logo.querySelector('g')).toBeInTheDocument();
        expect(logo.querySelector('rect')).toBeInTheDocument();
    });
});
