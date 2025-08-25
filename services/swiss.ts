
import { Participant, Match, MatchResult, Round } from '../types';

// Fisher-Yates shuffle algorithm
const shuffle = <T,>(array: T[]): T[] => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

export const calculateScoresAndTiebreaks = (
    participants: Participant[],
    rounds: Round[]
): Participant[] => {
    const participantMap = new Map<number, Participant>(
        participants.map(p => [p.id, { ...p, score: 0, opponentsPlayedIds: [], byes: 0, buchholz: 0, colorHistory: [] }])
    );

    if (rounds.length === 0) {
        return participants.map(p => ({ ...p, score: 0, buchholz: 0, byes: 0, opponentsPlayedIds: [], colorHistory: []}));
    }

    for (const round of rounds) {
        for (const match of round.matches) {
            const white = match.whitePlayer ? participantMap.get(match.whitePlayer.id) : null;
            const black = match.blackPlayer ? participantMap.get(match.blackPlayer.id) : null;

            if (white) white.colorHistory.push('W');
            if (black) black.colorHistory.push('B');
            
            if (white && black) {
                white.opponentsPlayedIds.push(black.id);
                black.opponentsPlayedIds.push(white.id);
            }

            switch (match.result) {
                case MatchResult.WhiteWin:
                    if (white) white.score += 1;
                    break;
                case MatchResult.BlackWin:
                    if (black) black.score += 1;
                    break;
                case MatchResult.Draw:
                    if (white) white.score += 0.5;
                    if (black) black.score += 0.5;
                    break;
                case MatchResult.Pending:
                    if (white && !black) { // Bye for white
                        white.score += 1;
                        white.byes += 1;
                    }
                    if (black && !white) { // Bye for black
                        black.score += 1;
                        black.byes += 1;
                    }
                    break;
            }
        }
    }
    
    // Calculate Buchholz score
    participantMap.forEach(player => {
        let buchholz = 0;
        player.opponentsPlayedIds.forEach(opponentId => {
            const opponent = participantMap.get(opponentId);
            if (opponent) {
                buchholz += opponent.score;
            }
        });
        player.buchholz = buchholz;
    });

    return Array.from(participantMap.values());
};


export const generatePairings = (
    participants: Participant[],
    previousRounds: Round[]
): Match[] => {
    const pairings: Match[] = [];
    // Generar IDs únicos para las partidas basados en timestamp
    let matchIdCounter = Date.now();

    let playersToPair = shuffle([...participants]);

    // Handle bye for odd number of players
    let byePlayer: Participant | null = null;
    if (playersToPair.length % 2 !== 0) {
        // Find player with lowest score who hasn't had a bye
        const sortedForBye = [...playersToPair].sort((a,b) => a.score - b.score || a.buchholz - b.buchholz);
        const byePlayerIndex = sortedForBye.findIndex(p => p.byes === 0);
        
        if (byePlayerIndex !== -1) {
            byePlayer = sortedForBye[byePlayerIndex];
        } else {
            // Everyone has had a bye, give it to the lowest ranked
            byePlayer = sortedForBye[0];
        }
        
        if(byePlayer) {
            pairings.push({
                id: matchIdCounter++,
                roundNumber: previousRounds.length + 1,
                whitePlayer: byePlayer,
                blackPlayer: null,
                result: MatchResult.Pending, // Will be resolved to 1-0 for score calculation
            });
            playersToPair = playersToPair.filter(p => p.id !== byePlayer!.id);
        }
    }

    // Sort by score, then Buchholz
    playersToPair.sort((a, b) => b.score - a.score || b.buchholz - a.buchholz);
    
    const pairedIds = new Set<number>();

    for (const player of playersToPair) {
        if (pairedIds.has(player.id)) continue;
        
        let opponent: Participant | null = null;
        for (const potentialOpponent of playersToPair) {
            if (pairedIds.has(potentialOpponent.id) || player.id === potentialOpponent.id) continue;

            if (!player.opponentsPlayedIds.includes(potentialOpponent.id)) {
                opponent = potentialOpponent;
                break;
            }
        }

        if (opponent) {
            pairedIds.add(player.id);
            pairedIds.add(opponent.id);
            
            // Simple color allocation: try to balance
            const p1WhiteGames = player.colorHistory.filter(c => c === 'W').length;
            const p1BlackGames = player.colorHistory.filter(c => c === 'B').length;
            const p2WhiteGames = opponent.colorHistory.filter(c => c === 'W').length;
            const p2BlackGames = opponent.colorHistory.filter(c => c === 'B').length;

            let whitePlayer = player;
            let blackPlayer = opponent;

            if(p1WhiteGames > p2WhiteGames) {
                whitePlayer = opponent;
                blackPlayer = player;
            } else if (p1BlackGames > p2BlackGames) {
                 whitePlayer = player;
                 blackPlayer = opponent;
            } else {
                // Flip a coin if balanced
                if(Math.random() > 0.5) {
                    [whitePlayer, blackPlayer] = [blackPlayer, whitePlayer];
                }
            }
            
            pairings.push({
                id: matchIdCounter++,
                roundNumber: previousRounds.length + 1,
                whitePlayer,
                blackPlayer,
                result: MatchResult.Pending,
            });
        }
    }

    return pairings;
};
