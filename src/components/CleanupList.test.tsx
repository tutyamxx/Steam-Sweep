import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import type { CleanupCandidate } from '../../types/cleanup';
import { CleanupList } from './CleanupList';

const mockShowFile = jest.fn();

Object.defineProperty(window, 'steamSweep', {
    value: {
        window: {
            showFile: mockShowFile
        }
    },
    configurable: true
});

const candidates: CleanupCandidate[] = [
    {
        id: 'log-1',
        gameId: 123,
        gameName: 'Test Game',
        path: 'C:\\Steam\\steamapps\\common\\Test Game\\game.log',
        type: 'log',
        size: 1024,
        confidence: 'safe',
        reason: 'Log file'
    },
    {
        id: 'temp-1',
        gameId: 123,
        gameName: 'Test Game',
        path: 'C:\\Steam\\steamapps\\common\\Test Game\\temp.tmp',
        type: 'temp-file',
        size: 2048,
        confidence: 'safe',
        reason: 'Temporary file'
    },
    {
        id: 'backup-1',
        gameId: 456,
        gameName: 'Another Game',
        path: 'D:\\Steam\\steamapps\\common\\Another Game\\backup.bak',
        type: 'backup',
        size: 4096,
        confidence: 'review',
        reason: 'Backup file'
    }
];

const renderCleanupList = (selectedIds = new Set<string>()) => {
    const onToggleCandidate = jest.fn();
    const onToggleGame = jest.fn();
    const onToggleAll = jest.fn();
    const onDeleteSelected = jest.fn();
    const onSelectAllByType = jest.fn();

    render(
        <CleanupList candidates={candidates}
            selectedIds={selectedIds}
            selectedType=''
            onToggleCandidate={onToggleCandidate}
            onToggleGame={onToggleGame}
            onToggleAll={onToggleAll}
            onDeleteSelected={onDeleteSelected}
            onSelectAllByType={onSelectAllByType}
        />
    );

    return {
        onToggleCandidate,
        onToggleGame,
        onToggleAll,
        onDeleteSelected,
        onSelectAllByType
    };
};

describe('CleanupList', () => {
    beforeEach(() => {
        mockShowFile.mockReset();
    });

    it('renders nothing when there are no candidates', () => {
        const { container } = render(
            <CleanupList candidates={[]}
                selectedIds={new Set()}
                selectedType=''
                onToggleCandidate={jest.fn()}
                onToggleGame={jest.fn()}
                onToggleAll={jest.fn()}
                onDeleteSelected={jest.fn()}
                onSelectAllByType={jest.fn()}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('renders the candidate and game counts', () => {
        renderCleanupList();

        expect(screen.getByRole('heading', { name: 'Cleanup Candidates' })).toBeInTheDocument();
        expect(screen.getByText('3 items · 2 games')).toBeInTheDocument();
    });

    it('groups candidates by game', () => {
        renderCleanupList();

        expect(screen.getByText('Test Game')).toBeInTheDocument();
        expect(screen.getByText('Another Game')).toBeInTheDocument();
        expect(screen.getAllByText('3.00 KB')).toHaveLength(1);
        expect(screen.getAllByText('1.00 KB')).toHaveLength(1);
        expect(screen.getAllByText('2.00 KB')).toHaveLength(1);
        expect(screen.getAllByText('4.00 KB')).toHaveLength(2);
    });

    it('renders candidate labels and paths', () => {
        renderCleanupList();

        expect(screen.getByText('Logs')).toBeInTheDocument();
        expect(screen.getByText('Temporary files')).toBeInTheDocument();
        expect(screen.getByText('Backups')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: candidates[0]!.path })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: candidates[1]!.path })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: candidates[2]!.path })).toBeInTheDocument();
    });

    it('toggles an individual candidate', () => {
        const { onToggleCandidate } = renderCleanupList();

        fireEvent.click(screen.getAllByRole('checkbox')[2]!);
        expect(onToggleCandidate).toHaveBeenCalledWith('log-1');
    });

    it('toggles a game when its checkbox is clicked', () => {
        const { onToggleGame } = renderCleanupList();

        fireEvent.click(screen.getAllByRole('checkbox')[1]!);
        expect(onToggleGame).toHaveBeenCalledWith([candidates[0], candidates[1]]);
    });

    it('toggles all candidates when Select All is clicked', () => {
        const { onToggleAll } = renderCleanupList();

        fireEvent.click(screen.getByRole('checkbox', { name: /select all/i }));
        expect(onToggleAll).toHaveBeenCalled();
    });

    it('shows the selection bar when candidates are selected', () => {
        renderCleanupList(new Set(['log-1', 'backup-1']));

        expect(screen.getByText('2 selected · 5.00 KB')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete Selected' })).toBeInTheDocument();
    });

    it('deletes selected candidates', () => {
        const { onDeleteSelected } = renderCleanupList(new Set(['log-1']));

        fireEvent.click(screen.getByRole('button', { name: 'Delete Selected' }));
        expect(onDeleteSelected).toHaveBeenCalled();
    });

    it('selects all candidates of the chosen type', () => {
        const { onSelectAllByType } = renderCleanupList();

        fireEvent.change(screen.getByRole('combobox'), {
            target: { value: 'log' }
        });
        expect(onSelectAllByType).toHaveBeenCalledWith('log');
    });

    it('disables Select by type when all candidates are selected', () => {
        renderCleanupList(new Set(candidates.map((candidate) => candidate.id)));
        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('opens a candidate path in File Explorer', () => {
        renderCleanupList();

        fireEvent.click(screen.getByRole('button', { name: candidates[0]!.path }));
        expect(mockShowFile).toHaveBeenCalledWith(candidates[0]!.path);
    });
});
