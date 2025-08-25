
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Participant, Round, MatchResult, View } from './types';
import { generatePairings, calculateScoresAndTiebreaks } from './services/swiss';
import { getParticipants, addParticipant as dbAddParticipant, updateParticipantScores, getMatches, saveMatches, updateMatchResult as dbUpdateMatchResult } from './services/db';
import ParticipantForm from './components/ParticipantForm';
import ParticipantList from './components/ParticipantList';
import RoundDisplay from './components/RoundDisplay';
import StandingsTable from './components/StandingsTable';
import TournamentSummary from './components/TournamentSummary';
import DatabaseManager from './components/DatabaseManager';
import { ChessBoardIcon, UsersIcon, TrophyIcon, PlusIcon, PlayIcon, NextIcon } from './components/icons';

const calculateTotalRounds = (playerCount: number): number => {
    if (playerCount <= 5) return 3;
    if (playerCount <= 11) return 4;
    if (playerCount <= 23) return 5;
    if (playerCount <= 39) return 6;
    return 7;
};

const App: React.FC = () => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [rounds, setRounds] = useState<Round[]>([]);
    const [currentView, setCurrentView] = useState<View>(View.Participants);
    const [totalRounds, setTotalRounds] = useState<number>(0);
    
    // Cargar participantes y partidas desde la base de datos al iniciar
    useEffect(() => {
        const loadData = async () => {
            try {
                const loadedParticipants = await getParticipants();
                setParticipants(loadedParticipants);
                
                // Si hay participantes, cargar las rondas
                if (loadedParticipants.length > 0) {
                    const allMatches = await getMatches();
                    if (allMatches.length > 0) {
                        // Agrupar partidas por número de ronda
                        const maxRound = Math.max(...allMatches.map(m => m.roundNumber));
                        const loadedRounds: Round[] = [];
                        
                        for (let i = 1; i <= maxRound; i++) {
                            const roundMatches = allMatches.filter(m => m.roundNumber === i);
                            if (roundMatches.length > 0) {
                                loadedRounds.push({
                                    roundNumber: i,
                                    matches: roundMatches
                                });
                            }
                        }
                        
                        setRounds(loadedRounds);
                        setTotalRounds(calculateTotalRounds(loadedParticipants.length));
                    }
                }
            } catch (error) {
                console.error('Error al cargar datos:', error);
            }
        };
        
        loadData();
    }, []);

    const sortedParticipants = useMemo(() => {
        return [...participants].sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            if (b.buchholz !== a.buchholz) {
                return b.buchholz - a.buchholz;
            }
            return a.name.localeCompare(b.name);
        });
    }, [participants]);
    
    const isTournamentStarted = rounds.length > 0;
    const currentRound = isTournamentStarted ? rounds[rounds.length - 1] : null;
    const isCurrentRoundFinished = currentRound?.matches.every(m => m.result !== MatchResult.Pending) ?? false;
    const isTournamentFinished = isTournamentStarted && isCurrentRoundFinished && rounds.length === totalRounds && totalRounds > 0;

    const addParticipant = async (name: string, school: string) => {
        try {
            const newParticipant = await dbAddParticipant(name, school);
            setParticipants(prev => [...prev, newParticipant]);
        } catch (error) {
            console.error('Error al añadir participante:', error);
        }
    };

    const startTournament = useCallback(() => {
        if (participants.length < 2) {
            alert("Se necesitan al menos 2 participantes para iniciar el torneo.");
            return;
        }
        const numRounds = calculateTotalRounds(participants.length);
        setTotalRounds(numRounds);

        const firstRoundMatches = generatePairings(participants, []);
        const firstRound: Round = {
            roundNumber: 1,
            matches: firstRoundMatches,
        };
        setRounds([firstRound]);
        setCurrentView(View.Rounds);
    }, [participants]);
    
    const updateStandings = useCallback(async () => {
        try {
            const updatedParticipants = calculateScoresAndTiebreaks(participants, rounds);
            await updateParticipantScores(updatedParticipants);
            setParticipants(updatedParticipants);
        } catch (error) {
            console.error('Error al actualizar clasificación:', error);
        }
    }, [participants, rounds]);

    const recordResult = async (matchId: number, result: MatchResult) => {
        try {
            // Actualizar en la base de datos
            await dbUpdateMatchResult(matchId, result);
            
            // Actualizar el estado local
            setRounds(prevRounds => {
                const newRounds = [...prevRounds];
                const lastRound = newRounds[newRounds.length - 1];
                const matchIndex = lastRound.matches.findIndex(m => m.id === matchId);
                if (matchIndex > -1) {
                    lastRound.matches[matchIndex].result = result;
                }
                return newRounds;
            });
        } catch (error) {
            console.error('Error al registrar resultado:', error);
        }
    };
    
    useEffect(() => {
        if (isTournamentStarted) {
           updateStandings();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rounds]);

    const generateNextRound = useCallback(async () => {
        if (!isCurrentRoundFinished) {
            alert("Por favor, registre todos los resultados de la ronda actual antes de continuar.");
            return;
        }
        
        if (rounds.length >= totalRounds) {
            return; 
        }

        try {
            const updatedParticipantsWithScores = calculateScoresAndTiebreaks(participants, rounds);
            setParticipants(updatedParticipantsWithScores);

            const nextRoundMatches = generatePairings(updatedParticipantsWithScores, rounds);
            const nextRound: Round = {
                roundNumber: rounds.length + 1,
                matches: nextRoundMatches,
            };
            
            // Guardar las nuevas partidas en la base de datos
            await saveMatches(nextRoundMatches);
            
            setRounds(prev => [...prev, nextRound]);
        } catch (error) {
            console.error('Error al generar siguiente ronda:', error);
        }
    }, [isCurrentRoundFinished, participants, rounds, totalRounds]);

    useEffect(() => {
        if (isTournamentFinished) {
            setCurrentView(View.Standings);
        }
    }, [isTournamentFinished]);

    const NavButton = ({ view, icon, label }: { view: View, icon: React.ReactNode, label: string }) => (
        <button
            onClick={() => setCurrentView(view)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 w-full text-left ${currentView === view ? 'bg-brand-gold text-brand-primary font-bold' : 'hover:bg-brand-accent'}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    // Función para recargar los datos desde la base de datos
    const reloadData = useCallback(async () => {
        try {
            const loadedParticipants = await getParticipants();
            setParticipants(loadedParticipants);
            
            if (loadedParticipants.length > 0) {
                const allMatches = await getMatches();
                if (allMatches.length > 0) {
                    const maxRound = Math.max(...allMatches.map(m => m.roundNumber));
                    const loadedRounds: Round[] = [];
                    
                    for (let i = 1; i <= maxRound; i++) {
                        const roundMatches = allMatches.filter(m => m.roundNumber === i);
                        if (roundMatches.length > 0) {
                            loadedRounds.push({
                                roundNumber: i,
                                matches: roundMatches
                            });
                        }
                    }
                    
                    setRounds(loadedRounds);
                    setTotalRounds(calculateTotalRounds(loadedParticipants.length));
                } else {
                    setRounds([]);
                }
            } else {
                setParticipants([]);
                setRounds([]);
                setTotalRounds(0);
            }
        } catch (error) {
            console.error('Error al recargar datos:', error);
        }
    }, []);

    const renderContent = () => {
        switch (currentView) {
            case View.Participants:
                return (
                    <div>
                        <DatabaseManager onReload={reloadData} disabled={isTournamentStarted} />
                        <ParticipantForm onAddParticipant={addParticipant} disabled={isTournamentStarted} />
                        <ParticipantList participants={participants} />
                    </div>
                );
            case View.Rounds:
                if (!currentRound) return <p className="text-center mt-8">El torneo aún no ha comenzado.</p>;
                return <RoundDisplay round={currentRound} onRecordResult={recordResult} totalRounds={totalRounds} />;
            case View.Standings:
                 if (!isTournamentStarted) return <p className="text-center mt-8">El torneo aún no ha comenzado. No hay clasificación para mostrar.</p>;
                return <StandingsTable participants={sortedParticipants} isTournamentFinished={isTournamentFinished}/>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-brand-primary flex flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-brand-secondary p-4 flex flex-col space-y-4">
                <div className="flex items-center space-x-3 px-2">
                    <ChessBoardIcon className="w-8 h-8 text-brand-gold" />
                    <h1 className="text-xl font-bold text-white">Ajedrez CREA</h1>
                </div>
                <nav className="flex-grow space-y-2">
                    <NavButton view={View.Participants} icon={<UsersIcon className="w-5 h-5" />} label="Participantes" />
                    <NavButton view={View.Rounds} icon={<PlayIcon className="w-5 h-5" />} label="Rondas" />
                    <NavButton view={View.Standings} icon={<TrophyIcon className="w-5 h-5" />} label="Clasificación" />
                </nav>
                <div className="space-y-2">
                    {!isTournamentStarted && participants.length >= 2 && (
                         <button onClick={startTournament} className="w-full flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <PlayIcon className="w-5 h-5"/>
                            <span>Iniciar Torneo</span>
                        </button>
                    )}
                    {isTournamentStarted && isCurrentRoundFinished && !isTournamentFinished && (
                         <button onClick={generateNextRound} className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <NextIcon className="w-5 h-5"/>
                            <span>Siguiente Ronda ({rounds.length + 1}/{totalRounds})</span>
                        </button>
                    )}
                    {isTournamentFinished && (
                        <div className="text-center p-2 bg-brand-gold text-brand-primary rounded-lg font-bold">
                            ¡Torneo Finalizado!
                        </div>
                    )}
                </div>
            </aside>

            <main className="flex-1 p-6 lg:p-10 overflow-auto">
                {renderContent()}
                {isTournamentStarted && currentView !== View.Participants && (
                     <TournamentSummary
                        standings={sortedParticipants}
                        lastRound={currentRound}
                        isTournamentFinished={isTournamentFinished}
                    />
                )}
            </main>
        </div>
    );
};

export default App;
