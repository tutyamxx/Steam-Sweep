import { formatBytes, getCandidateLabel } from '../utils/utils';
import type { CleanupCandidate } from '../../types/cleanup';

interface CleanupListProps {
	candidates: CleanupCandidate[];
	selectedIds: Set<string>;

	onToggleCandidate: (id: string) => void;
	onToggleGame: (candidates: CleanupCandidate[]) => void;
	onToggleAll: () => void;
	onDeleteSelected: () => void;
}

/**
 * Renders cleanup candidates grouped by installed Steam game.
 *
 * @param props - Cleanup candidates, selection state and selection handlers.
 * @returns The cleanup candidate list.
 */
const CleanupList = ({
    candidates,
    selectedIds,
    onToggleCandidate,
    onToggleGame,
    onToggleAll,
    onDeleteSelected
}: CleanupListProps) => {
    const selectedCandidates = candidates.filter((candidate) => selectedIds.has(candidate.id));
    const selectedSize = selectedCandidates.reduce((sum, candidate) => sum + candidate.size, 0);
    const allSelected = candidates.length > 0 && selectedCandidates.length === candidates.length;
    const someSelected = selectedCandidates.length > 0 && !allSelected;

    const groupedCandidates = candidates.reduce<Record<string, CleanupCandidate[]>>((groups, candidate) => {
        const key = `${candidate.gameId}-${candidate.gameName}`;
        (groups[key] ??= []).push(candidate);

        return groups;
    }, {});

    const gameGroups = Object.values(groupedCandidates);

    if (candidates.length === 0) {
        return null;
    }

    return (
        <section className='games'>
            <div className='section-header'>
                <div>
                    <h2>Cleanup Candidates</h2>
                    <span>
                        {candidates.length} items · {gameGroups.length} games
                    </span>
                </div>
                <label className='select-all'>
                    <input
                        type='checkbox'
                        checked={allSelected}
                        ref={(input) => {
                            if (input) {
                                input.indeterminate = someSelected;
                            }
                        }}
                        onChange={onToggleAll}
                    />
                    <span className='checkbox' />
                    <span>Select All</span>
                </label>
            </div>
            {selectedCandidates.length > 0 && (
                <div className='selection-bar'>
                    <span>
                        {selectedCandidates.length} selected ·{' '}
                        {formatBytes(selectedSize)}
                    </span>
                    <button
                        className='delete-button'
                        type='button'
                        onClick={onDeleteSelected}
                    >
						Delete Selected
                    </button>
                </div>
            )}
            <div className='game-list'>
                {gameGroups.map((gameCandidates) => {
                    const first = gameCandidates?.[0];

                    if (!first) {
                        return null;
                    }

                    const gameSize = gameCandidates.reduce((sum, candidate) => sum + candidate.size, 0);
                    const selected = gameCandidates.filter((candidate) => selectedIds.has(candidate.id));
                    const allGameSelected = selected.length === gameCandidates.length;
                    const someGameSelected = selected.length > 0 && !allGameSelected;

                    return (
                        <article
                            className='game-card'
                            key={`${first?.gameId}-${first?.gameName}`}
                        >
                            <div className='game-header'>
                                <label className='game-select'>
                                    <input
                                        type='checkbox'
                                        checked={allGameSelected}
                                        ref={(input) => {
                                            if (input) {
                                                input.indeterminate = someGameSelected;
                                            }
                                        }}
                                        onChange={() => onToggleGame(gameCandidates)}
                                    />
                                    <span className='checkbox' />
                                </label>
                                <div className='game-title'>
                                    <strong>{first?.gameName}</strong>
                                    <span>
                                        {selected.length > 0 ? `${selected.length} selected` : `${gameCandidates.length} items`}
                                    </span>
                                </div>
                                <span className='game-size'>
                                    {formatBytes(gameSize)}
                                </span>
                            </div>
                            <div className='candidate-list'>
                                {gameCandidates.map((candidate) => {
                                    const isSelected = selectedIds.has(candidate.id);

                                    return (
                                        <div
                                            className={`candidate ${isSelected ? 'selected' : ''}`}
                                            key={candidate.id}
                                        >
                                            <label className='candidate-check'>
                                                <input
                                                    type='checkbox'
                                                    checked={isSelected}
                                                    onChange={() => onToggleCandidate(candidate.id)}
                                                />
                                                <span className='checkbox' />
                                            </label>
                                            <div className='candidate-info'>
                                                <strong>
                                                    {getCandidateLabel(candidate)}
                                                </strong>
                                                <div
                                                    className='candidate-path'
                                                    title={candidate.path}
                                                >
                                                    {candidate.path}
                                                </div>
                                            </div>
                                            <span className='candidate-size'>
                                                {formatBytes(candidate.size)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export { CleanupList };

export type { CleanupListProps };
