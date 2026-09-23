import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./pages/Home', () => ({
    Home: () => <div>Home Page</div>
}));

describe('App', () => {
    it('renders the home page', () => {
        render(<App />);

        expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
});
