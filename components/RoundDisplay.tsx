
import React from 'react';
import { Round, MatchResult, Match } from '../types';

interface RoundDisplayProps {
    round: Round;
    onRecordResult: (matchId: number, result: MatchResult) => void;
    totalRounds: number;
}

const MatchCard: React.FC<{ match: Match, onRecordResult: (matchId: number, result: MatchResult) => void }> = ({ match, onRecordResult }) => {
    const isBye = !match.whitePlayer || !match.blackPlayer;

    const ResultButton = ({ result, label }: { result: MatchResult, label: string }) => (
        <button
            onClick={() => onRecordResult(match.id, result)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
                match.result === result
                    ? 'bg-brand-gold text-brand-primary font-bold'
                    : 'bg-brand-accent hover:bg-gray-600'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-brand-secondary rounded-xl shadow-lg p-4">
            <div className="text-center text-sm text-gray-400 mb-2">Mesa {match.id % 100}</div>
            <div className="grid grid-cols-3 items-center gap-2">
                <div className="text-right">
                    <p className="font-semibold">{match.whitePlayer?.name ?? '---'}</p>
                    <p className="text-xs text-gray-400">{match.whitePlayer?.school ?? 'Descanso'}</p>
                </div>
                <div className="text-center font-bold text-lg text-brand-gold">VS</div>
                <div className="text-left">
                    <p className="font-semibold">{match.blackPlayer?.name ?? '---'}</p>
                    <p className="text-xs text-gray-400">{match.blackPlayer?.school ?? 'Descanso'}</p>
                </div>
            </div>
            {isBye ? (
                <div className="mt-4 text-center font-bold text-green-400">DESCANSO (1 pto)</div>
            ) : (
                <div className="mt-4 flex justify-center space-x-2">
                    {match.result === MatchResult.Pending ? (
                        <>
                            <ResultButton result={MatchResult.WhiteWin} label="1-0" />
                            <ResultButton result={MatchResult.Draw} label="½-½" />
                            <ResultButton result={MatchResult.BlackWin} label="0-1" />
                        </>
                    ) : (
                         <div className="text-center font-bold text-brand-gold p-1">Resultado: {match.result}</div>
                    )}
                </div>
            )}
        </div>
    );
};

const RoundDisplay: React.FC<RoundDisplayProps> = ({ round, onRecordResult, totalRounds }) => {
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-brand-gold">
                Ronda {round.roundNumber}
                {totalRounds > 0 && <span className="text-xl text-gray-400 font-normal"> de {totalRounds}</span>}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {round.matches.map(match => (
                    <MatchCard key={match.id} match={match} onRecordResult={onRecordResult} />
                ))}
            </div>
        </div>
    );
};

export default RoundDisplay;
