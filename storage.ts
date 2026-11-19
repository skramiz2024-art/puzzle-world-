import type { AudioSettings, LevelStats, PlayerSaveData } from '../types/game';

const STORAGE_KEY = 'puzzle_world_save_v1';

const DEFAULT_SAVE: PlayerSaveData = {
  highestUnlockedLevel: 1,
  levelStats: {},
  totalScore: 0,
  settings: {
    musicEnabled: true,
    sfxEnabled: true,
  },
};

export function loadPlayerSave(): PlayerSaveData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw) as Partial<PlayerSaveData>;
    const highestUnlockedLevel =
      typeof parsed.highestUnlockedLevel === 'number'
        ? Math.max(1, Math.min(100, Math.floor(parsed.highestUnlockedLevel)))
        : 1;
    const levelStats: Record<number, LevelStats> =
      parsed.levelStats && typeof parsed.levelStats === 'object' ? parsed.levelStats : {};
    const totalScore =
      typeof parsed.totalScore === 'number' && parsed.totalScore >= 0 ? parsed.totalScore : 0;
    const settings: AudioSettings = {
      musicEnabled:
        typeof parsed.settings?.musicEnabled === 'boolean' ? parsed.settings.musicEnabled : true,
      sfxEnabled:
        typeof parsed.settings?.sfxEnabled === 'boolean' ? parsed.settings.sfxEnabled : true,
    };
    return {
      highestUnlockedLevel,
      levelStats,
      totalScore,
      settings,
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function persistPlayerSave(data: PlayerSaveData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function recordLevelVictory(
  current: PlayerSaveData,
  level: number,
  score: number,
  stars: number,
  elapsedSeconds: number
): PlayerSaveData {
  const prev = current.levelStats[level];
  const prevBest = prev?.bestScore ?? 0;
  const bestScore = Math.max(prevBest, score);
  const bestStars = Math.max(prev?.stars ?? 0, stars);
  const bestTimeSeconds =
    prev?.bestTimeSeconds != null ? Math.min(prev.bestTimeSeconds, elapsedSeconds) : elapsedSeconds;

  const updatedStats: Record<number, LevelStats> = {
    ...current.levelStats,
    [level]: {
      completed: true,
      stars: bestStars,
      bestScore,
      bestTimeSeconds,
    },
  };

  const totalScore = Object.values(updatedStats).reduce((acc, s) => acc + (s.bestScore || 0), 0);
  const nextUnlocked = Math.min(100, Math.max(current.highestUnlockedLevel, level + 1));

  const nextSave: PlayerSaveData = {
    ...current,
    highestUnlockedLevel: nextUnlocked,
    levelStats: updatedStats,
    totalScore,
  };
  persistPlayerSave(nextSave);
  return nextSave;
}

export function updateAudioSettings(
  current: PlayerSaveData,
  settings: Partial<AudioSettings>
): PlayerSaveData {
  const nextSave: PlayerSaveData = {
    ...current,
    settings: {
      ...current.settings,
      ...settings,
    },
  };
  persistPlayerSave(nextSave);
  return nextSave;
}

export function clearPlayerProgress(keepAudioSettings = true): PlayerSaveData {
  const current = loadPlayerSave();
  const fresh: PlayerSaveData = {
    ...structuredClone(DEFAULT_SAVE),
    settings: keepAudioSettings ? current.settings : structuredClone(DEFAULT_SAVE.settings),
  };
  persistPlayerSave(fresh);
  return fresh;
}

export function countTotalStars(save: PlayerSaveData): number {
  return Object.values(save.levelStats).reduce((sum, item) => sum + (item.stars || 0), 0);
}

export function countCompletedLevels(save: PlayerSaveData): number {
  return Object.values(save.levelStats).filter((item) => item.completed).length;
}
