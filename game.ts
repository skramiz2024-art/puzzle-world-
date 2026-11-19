export type GameType = 'number' | 'block' | 'picture' | 'match3';

export type ScreenRoute = 'home' | 'levels' | 'play' | 'settings';

export type PlayState = 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER';

export interface WorldChapter {
  id: number;
  name: string;
  subtitle: string;
  startLevel: number;
  endLevel: number;
  accentHex: string;
  bgTintClass: string;
}

export interface LevelConfig {
  level: number;
  gameType: GameType;
  worldId: number;
  title: string;
  difficultyLabel: 'Easy' | 'Medium' | 'Hard' | 'Master';
  gridSize: number;
  targetScore: number;
  moveLimit?: number;
  parMoves: number;
  parTimeSeconds: number;
  shuffleSteps?: number;
  gemTypesCount?: number;
  pictureAssetId?: string;
}

export interface LevelStats {
  completed: boolean;
  stars: number; // 0-3
  bestScore: number;
  bestTimeSeconds: number | null;
}

export interface AudioSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

export interface PlayerSaveData {
  highestUnlockedLevel: number; // 1..100
  levelStats: Record<number, LevelStats>;
  totalScore: number;
  settings: AudioSettings;
}

export interface GameOutcome {
  score: number;
  stars: number;
  movesUsed: number;
  elapsedSeconds: number;
  summaryText: string;
}
