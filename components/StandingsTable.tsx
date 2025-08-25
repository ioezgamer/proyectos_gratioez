
import React from 'react';
import { Participant } from '../types';
import { TrophyIcon } from './icons';

interface StandingsTableProps {
    participants: Participant[];
    isTournamentFinished: boolean;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ participants, isTournamentFinished }) => {
    const getRankColor = (rank: number) => {
        if (rank === 1) return 'text-yellow-400';
        if (rank === 2) return 'text-gray-300';
        if (rank === 3) return 'text-yellow-600';
        return '';
    };

    const winner = isTournamentFinished && participants.length > 0 ? participants[0] : null;

    return (
        <div className="bg-brand-secondary p-6 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-2 text-brand-gold">
                {isTournamentFinished ? 'Clasificación Final' : 'Tabla de Clasificación'}
            </h2>
            {winner && (
                 <div className="mb-6 p-4 bg-brand-accent rounded-lg flex items-center space-x-4">
                    <TrophyIcon className="w-10 h-10 text-brand-gold" />
                    <div>
                        <p className="font-bold text-lg text-brand-gold">¡El torneo ha finalizado!</p>
                        <p className="text-lg">Felicidades a <span className="font-bold">{winner.name}</span>, ¡el campeón del torneo!</p>
                    </div>
                </div>
            )}
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b-2 border-brand-accent">
                        <tr>
                            <th className="p-3 text-sm font-semibold tracking-wide">Rank</th>
                            <th className="p-3 text-sm font-semibold tracking-wide">Nombre</th>
                            <th className="p-3 text-sm font-semibold tracking-wide">Escuela / Comunidad</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-center">Puntos</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-center">Buchholz</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((p, index) => (
                            <tr key={p.id} className="border-b border-brand-accent last:border-b-0 hover:bg-brand-accent transition-colors">
                                <td className={`p-3 font-bold text-lg ${getRankColor(index + 1)}`}>
                                    <div className="flex items-center space-x-2">
                                        <span>{index + 1}</span>
                                        {index < 3 && <TrophyIcon className="w-5 h-5" />}
                                    </div>
                                </td>
                                <td className="p-3 font-medium">{p.name}</td>
                                <td className="p-3 text-gray-400">{p.school}</td>
                                <td className="p-3 text-center font-bold text-xl">{p.score.toFixed(1)}</td>
                                <td className="p-3 text-center font-semibold text-gray-300">{p.buchholz.toFixed(1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    );
};

export default StandingsTable;
