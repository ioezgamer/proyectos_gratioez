import initSqlJs, { Database } from 'sql.js';
import { Participant, Match, MatchResult } from '../types';

// Variable para almacenar la instancia de la base de datos
let db: Database | null = null;
let dbInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Función para inicializar la base de datos
const initializeDb = async (): Promise<void> => {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise<void>(async (resolve) => {
    try {
      // Inicializar SQL.js
      const SQL = await initSqlJs({
        // Localización del archivo wasm de sql.js
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      // Crear una nueva base de datos en memoria
      db = new SQL.Database();

      // Crear tablas
      db.run(`
        CREATE TABLE IF NOT EXISTS participants (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          school TEXT NOT NULL,
          score REAL DEFAULT 0,
          byes INTEGER DEFAULT 0,
          buchholz REAL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS matches (
          id INTEGER PRIMARY KEY,
          roundNumber INTEGER NOT NULL,
          whitePlayerId INTEGER,
          blackPlayerId INTEGER,
          result TEXT DEFAULT 'PENDIENTE',
          FOREIGN KEY (whitePlayerId) REFERENCES participants(id),
          FOREIGN KEY (blackPlayerId) REFERENCES participants(id)
        );

        CREATE TABLE IF NOT EXISTS opponents (
          participantId INTEGER NOT NULL,
          opponentId INTEGER NOT NULL,
          PRIMARY KEY (participantId, opponentId),
          FOREIGN KEY (participantId) REFERENCES participants(id),
          FOREIGN KEY (opponentId) REFERENCES participants(id)
        );

        CREATE TABLE IF NOT EXISTS color_history (
          participantId INTEGER NOT NULL,
          roundNumber INTEGER NOT NULL,
          color TEXT NOT NULL,
          PRIMARY KEY (participantId, roundNumber),
          FOREIGN KEY (participantId) REFERENCES participants(id)
        );
      `);

      // Cargar datos guardados del localStorage si existen
      const savedData = localStorage.getItem('tournamentData');
      if (savedData) {
        try {
          const binaryArray = new Uint8Array(savedData.split(',').map(Number));
          db = new SQL.Database(binaryArray);
        } catch (e) {
          console.error('Error al cargar datos guardados:', e);
          // Si hay error, continuamos con la base de datos vacía
        }
      }

      dbInitialized = true;
      resolve();
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      resolve();
    }
  });

  return initializationPromise;
};

// Función para guardar la base de datos en localStorage
const saveDatabase = () => {
  if (!db) return;
  
  try {
    const data = db.export();
    localStorage.setItem('tournamentData', data.toString());
  } catch (e) {
    console.error('Error al guardar la base de datos:', e);
  }
};

// Asegurar que la base de datos está inicializada antes de cualquier operación
const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    await initializeDb();
  }
  return db;
};

// Funciones para participantes
export const getParticipants = async (): Promise<Participant[]> => {
  const database = await ensureDbInitialized();
  if (!database) return [];
  
  const result = database.exec('SELECT * FROM participants');
  if (!result.length || !result[0].values.length) return [];
  
  const participants: Participant[] = [];
  
  for (const row of result[0].values) {
    const id = row[0] as number;
    const name = row[1] as string;
    const school = row[2] as string;
    const score = row[3] as number;
    const byes = row[4] as number;
    const buchholz = row[5] as number;
    
    // Obtener oponentes
    const opponentsResult = database.exec(
      'SELECT opponentId FROM opponents WHERE participantId = ?',
      [id]
    );
    
    const opponentsPlayedIds = opponentsResult.length && opponentsResult[0].values.length 
      ? opponentsResult[0].values.map(row => row[0] as number)
      : [];
    
    // Obtener historial de colores
    const colorResult = database.exec(
      'SELECT color FROM color_history WHERE participantId = ? ORDER BY roundNumber',
      [id]
    );
    
    const colorHistory = colorResult.length && colorResult[0].values.length
      ? colorResult[0].values.map(row => row[0] as 'W' | 'B')
      : [];
    
    participants.push({
      id,
      name,
      school,
      score,
      byes,
      buchholz,
      opponentsPlayedIds,
      colorHistory
    });
  }
  
  return participants;
};

export const addParticipant = async (name: string, school: string): Promise<Participant> => {
  const database = await ensureDbInitialized();
  if (!database) throw new Error('Base de datos no inicializada');
  
  const id = Date.now();
  database.run(
    'INSERT INTO participants (id, name, school) VALUES (?, ?, ?)',
    [id, name, school]
  );
  
  // Guardar cambios
  saveDatabase();
  
  return {
    id,
    name,
    school,
    score: 0,
    opponentsPlayedIds: [],
    byes: 0,
    buchholz: 0,
    colorHistory: []
  };
};

export const updateParticipantScores = async (participants: Participant[]): Promise<void> => {
  const database = await ensureDbInitialized();
  if (!database) return;
  
  // Usar transacción para actualizar todo de una vez
  database.run('BEGIN TRANSACTION');
  
  try {
    for (const participant of participants) {
      // Actualizar puntuación y desempates
      database.run(
        'UPDATE participants SET score = ?, byes = ?, buchholz = ? WHERE id = ?',
        [participant.score, participant.byes, participant.buchholz, participant.id]
      );
      
      // Actualizar oponentes
      database.run('DELETE FROM opponents WHERE participantId = ?', [participant.id]);
      for (const opponentId of participant.opponentsPlayedIds) {
        database.run(
          'INSERT OR IGNORE INTO opponents (participantId, opponentId) VALUES (?, ?)',
          [participant.id, opponentId]
        );
      }
      
      // Actualizar historial de colores
      database.run('DELETE FROM color_history WHERE participantId = ?', [participant.id]);
      participant.colorHistory.forEach((color, index) => {
        database.run(
          'INSERT INTO color_history (participantId, roundNumber, color) VALUES (?, ?, ?)',
          [participant.id, index + 1, color]
        );
      });
    }
    
    database.run('COMMIT');
    
    // Guardar cambios
    saveDatabase();
  } catch (e) {
    database.run('ROLLBACK');
    console.error('Error al actualizar puntuaciones:', e);
  }
};

// Funciones para partidas
export const getMatches = async (roundNumber?: number): Promise<Match[]> => {
  const database = await ensureDbInitialized();
  if (!database) return [];
  
  let query = 'SELECT * FROM matches';
  const params: any[] = [];
  
  if (roundNumber !== undefined) {
    query += ' WHERE roundNumber = ?';
    params.push(roundNumber);
  }
  
  const result = database.exec(query, params);
  if (!result.length || !result[0].values.length) return [];
  
  const participants = await getParticipants();
  const matches: Match[] = [];
  
  for (const row of result[0].values) {
    const id = row[0] as number;
    const roundNum = row[1] as number;
    const whitePlayerId = row[2] as number | null;
    const blackPlayerId = row[3] as number | null;
    const result = row[4] as MatchResult;
    
    matches.push({
      id,
      roundNumber: roundNum,
      whitePlayer: whitePlayerId ? participants.find(p => p.id === whitePlayerId) || null : null,
      blackPlayer: blackPlayerId ? participants.find(p => p.id === blackPlayerId) || null : null,
      result
    });
  }
  
  return matches;
};

export const saveMatches = async (matches: Match[]): Promise<void> => {
  const database = await ensureDbInitialized();
  if (!database) return;
  
  database.run('BEGIN TRANSACTION');
  
  try {
    for (const match of matches) {
      database.run(
        'INSERT OR REPLACE INTO matches (id, roundNumber, whitePlayerId, blackPlayerId, result) VALUES (?, ?, ?, ?, ?)',
        [
          match.id,
          match.roundNumber,
          match.whitePlayer?.id || null,
          match.blackPlayer?.id || null,
          match.result
        ]
      );
    }
    
    database.run('COMMIT');
    
    // Guardar cambios
    saveDatabase();
  } catch (e) {
    database.run('ROLLBACK');
    console.error('Error al guardar partidas:', e);
  }
};

export const updateMatchResult = async (matchId: number, result: MatchResult): Promise<void> => {
  const database = await ensureDbInitialized();
  if (!database) return;
  
  database.run('UPDATE matches SET result = ? WHERE id = ?', [result, matchId]);
  
  // Guardar cambios
  saveDatabase();
};

// Función para limpiar la base de datos (útil para reiniciar el torneo)
export const clearDatabase = async (): Promise<void> => {
  const database = await ensureDbInitialized();
  if (!database) return;
  
  database.run(`
    DELETE FROM color_history;
    DELETE FROM opponents;
    DELETE FROM matches;
    DELETE FROM participants;
  `);
  
  // Guardar cambios
  saveDatabase();
};

// Inicializar la base de datos al cargar el módulo
initializeDb();

export default {
  getParticipants,
  addParticipant,
  updateParticipantScores,
  getMatches,
  saveMatches,
  updateMatchResult,
  clearDatabase
};