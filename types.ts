
export interface Participant {
    id: number;
    name: string;
    school: string;
    score: number;
    opponentsPlayedIds: number[];
    byes: number;
    buchholz: number;
    colorHistory: ('W' | 'B')[];
}

export enum MatchResult {
    WhiteWin = '1-0',
    BlackWin = '0-1',
    Draw = '1/2-1/2',
    Pending = 'PENDIENTE',
}

export interface Match {
    id: number;
    roundNumber: number;
    whitePlayer: Participant | null; // Null for bye
    blackPlayer: Participant | null; // Null for bye
    result: MatchResult;
}

export interface Round {
    roundNumber: number;
    matches: Match[];
}

export enum View {
    Participants = 'participants',
    Rounds = 'rounds',
    Standings = 'standings',
}
