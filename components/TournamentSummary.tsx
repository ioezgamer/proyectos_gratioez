
import React, { useState, useCallback } from 'react';
import { Participant, Round } from '../types';
import { generateTournamentSummary } from '../services/geminiService';
import { SparklesIcon } from './icons';

interface TournamentSummaryProps {
    standings: Participant[];
    lastRound: Round | null;
    isTournamentFinished: boolean;
}

const TournamentSummary: React.FC<TournamentSummaryProps> = ({ standings, lastRound, isTournamentFinished }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateSummary = useCallback(async () => {
        if (!lastRound) return;
        setIsLoading(true);
        setError('');
        setSummary('');
        try {
            const result = await generateTournamentSummary(standings, lastRound, isTournamentFinished);
            setSummary(result);
        } catch (e) {
            setError('Error al generar el resumen. Inténtalo de nuevo.');
            console.error(e);
        }
        setIsLoading(false);
    }, [standings, lastRound, isTournamentFinished]);

    return (
        <div className="mt-10 bg-brand-secondary p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold mb-4 text-brand-gold">Resumen del Torneo con IA</h3>
            <div className="flex flex-col items-start space-y-4">
                <button
                    onClick={handleGenerateSummary}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    <SparklesIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Generando...' : (isTournamentFinished ? 'Generar Crónica Final' : 'Generar Resumen')}</span>
                </button>
                {isLoading && (
                    <div className="w-full text-center p-4">
                         <div className="animate-pulse">Creando una crónica épica...</div>
                    </div>
                )}
                {error && <p className="text-red-400">{error}</p>}
                {summary && (
                    <div className="prose prose-invert max-w-none bg-brand-accent p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{summary}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TournamentSummary;
