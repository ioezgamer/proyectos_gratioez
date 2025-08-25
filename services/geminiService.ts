
import { GoogleGenAI } from "@google/genai";
import { Participant, Round, MatchResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("API_KEY for Gemini is not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const formatStandings = (standings: Participant[]): string => {
    return standings
        .slice(0, 5)
        .map((p, index) => `${index + 1}. ${p.name} (${p.score} puntos)`)
        .join('\n');
};

const formatNotableResults = (lastRound: Round): string => {
    const notableMatches = lastRound.matches
        .filter(m => m.result !== MatchResult.Pending && m.whitePlayer && m.blackPlayer)
        .slice(0, 3);
    
    return notableMatches.map(match => {
        const winner = match.result === MatchResult.WhiteWin ? match.whitePlayer : match.blackPlayer;
        const loser = match.result === MatchResult.WhiteWin ? match.blackPlayer : match.whitePlayer;

        if (match.result === MatchResult.Draw) {
            return `- ${match.whitePlayer!.name} y ${match.blackPlayer!.name} empataron en una reñida partida.`;
        }
        return `- ${winner!.name} consiguió una victoria clave contra ${loser!.name}.`;

    }).join('\n');
};


export const generateTournamentSummary = async (standings: Participant[], lastRound: Round, isFinished: boolean): Promise<string> => {
    if (!API_KEY) {
        return "La función de IA está deshabilitada porque la clave API no está configurada.";
    }

    const winnerName = isFinished && standings.length > 0 ? standings[0].name : null;

    const prompt = `
Eres un entusiasta cronista de ajedrez. Escribe un breve y emocionante resumen del torneo de ajedrez. Adopta un tono dramático y cautivador.

Contexto del Torneo:
- Sistema: Suizo
- Ronda Actual: ${lastRound.roundNumber}
- Estado: ${isFinished ? `Finalizado. ¡Tenemos un campeón!` : `En progreso.`}
${winnerName ? `- Campeón: ${winnerName}` : ''}

Tabla de Clasificación (Top 5):
${formatStandings(standings)}

${isFinished ? 'Algunos resultados decisivos de la última ronda:' : 'Resultados Notables de la Última Ronda:'}
${formatNotableResults(lastRound)}

Basado en esta información, ${
        isFinished
            ? `escribe una crónica final celebrando al campeón, ${winnerName}, y destacando la intensidad de la última ronda. Describe su camino a la victoria.`
            : `genera un párrafo vibrante que capture la emoción del estado actual del torneo. ¿Quiénes son los contendientes? ¿Qué nos espera?`
    }
No uses markdown, solo texto plano.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.8,
                topP: 0.9,
            }
        });
        
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate summary from Gemini API.");
    }
};
