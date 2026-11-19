import type { GameType, LevelConfig, WorldChapter } from '../types/game';
import heroPuzzleImg from '../assets/images/hero_puzzle_world_1795077496284.jpg';
import lighthouseImg from '../assets/images/puzzle_art_lighthouse_1795077495376.jpg';
import botanicalImg from '../assets/images/puzzle_art_botanical_1795077495959.jpg';
import observatoryImg from '../assets/images/puzzle_art_observatory_1795077495288.jpg';
import marketImg from '../assets/images/puzzle_art_market_1795077496796.jpg';

export interface PictureAsset {
  id: string;
  title: string;
  src: string;
}

export const PICTURE_ASSETS: PictureAsset[] = [
  {
    id: 'lighthouse',
    title: 'Sunset Lighthouse',
    src: lighthouseImg,
  },
  {
    id: 'botanical',
    title: 'Glasshouse Conservatory',
    src: botanicalImg,
  },
  {
    id: 'observatory',
    title: 'Starlight Observatory',
    src: observatoryImg,
  },
  {
    id: 'market',
    title: 'Sunlit Piazza',
    src: marketImg,
  },
];

export const HERO_IMAGE_SRC = heroPuzzleImg;

export const GAME_METADATA: Record<
  GameType,
  {
    id: GameType;
    name: string;
    shortName: string;
    tagline: string;
    instructions: string[];
    accentColor: string;
    surfaceBg: string;
    borderColor: string;
    textAccent: string;
  }
> = {
  number: {
    id: 'number',
    name: 'Number Puzzle',
    shortName: 'Numbers',
    tagline: 'Slide numbered wooden tiles into ascending order with minimum moves.',
    instructions: [
      'Click or tap any tile adjacent to the empty space to slide it.',
      'You can also tap a tile in the same row or column as the empty space to slide multiple tiles at once, or use Arrow keys.',
      'Arrange all numbers from 1 upwards with the empty space in the bottom-right corner.',
      'Finish within the par moves and time to earn all 3 stars.',
    ],
    accentColor: '#059669',
    surfaceBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textAccent: 'text-emerald-700',
  },
  block: {
    id: 'block',
    name: 'Block Puzzle',
    shortName: 'Blocks',
    tagline: 'Fit geometric block shapes onto the grid and clear full rows or columns.',
    instructions: [
      'Drag any shape from the bottom tray onto the grid, or tap a shape to select it and tap a board cell to place it.',
      'Complete any full horizontal row or vertical column to clear it and earn bonus points.',
      'Clearing multiple lines in a single placement triggers a combo multiplier.',
      'Reach the level target score before running out of room on the board.',
    ],
    accentColor: '#EA580C',
    surfaceBg: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textAccent: 'text-orange-700',
  },
  picture: {
    id: 'picture',
    name: 'Picture / Jigsaw Puzzle',
    shortName: 'Picture',
    tagline: 'Reassemble scrambled artwork pieces into a seamless illustrated scene.',
    instructions: [
      'Tap any two pieces to swap their positions, or drag a piece directly onto another slot.',
      'Pieces sitting in their correct final position show a subtle corner indicator.',
      'Use the Reference Peek button anytime to inspect the completed artwork.',
      'Restore the full illustration in as few swaps as possible for 3 stars.',
    ],
    accentColor: '#7C3AED',
    surfaceBg: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textAccent: 'text-violet-700',
  },
  match3: {
    id: 'match3',
    name: 'Match-3 Puzzle',
    shortName: 'Match-3',
    tagline: 'Swap colorful gems to align 3 or more and trigger cascading combos.',
    instructions: [
      'Tap a gem and then tap an adjacent gem (or swipe/drag toward a neighbor) to swap.',
      'Align 3 or more matching gems horizontally or vertically to clear them and score.',
      'Match 4 or 5 gems at once for extra bonus points, and trigger chain cascades.',
      'Reach the level target score before your move counter reaches zero.',
    ],
    accentColor: '#E11D48',
    surfaceBg: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textAccent: 'text-rose-700',
  },
};

export const WORLD_CHAPTERS: WorldChapter[] = [
  {
    id: 1,
    name: 'Sunlit Meadow',
    subtitle: 'Foundations & gentle warm-up puzzles',
    startLevel: 1,
    endLevel: 25,
    accentHex: '#059669',
    bgTintClass: 'bg-emerald-50/70',
  },
  {
    id: 2,
    name: 'Coastal Harbor',
    subtitle: 'Larger grids & multi-step planning',
    startLevel: 26,
    endLevel: 50,
    accentHex: '#2563EB',
    bgTintClass: 'bg-blue-50/70',
  },
  {
    id: 3,
    name: 'Starlight Ridge',
    subtitle: 'Tighter move budgets & clever combos',
    startLevel: 51,
    endLevel: 75,
    accentHex: '#7C3AED',
    bgTintClass: 'bg-violet-50/70',
  },
  {
    id: 4,
    name: 'Grand Summit',
    subtitle: 'Master challenges for puzzle veterans',
    startLevel: 76,
    endLevel: 100,
    accentHex: '#EA580C',
    bgTintClass: 'bg-orange-50/70',
  },
];

const CYCLE_ORDER: GameType[] = ['number', 'block', 'picture', 'match3'];

function getDifficultyLabel(level: number): LevelConfig['difficultyLabel'] {
  if (level <= 25) return 'Easy';
  if (level <= 50) return 'Medium';
  if (level <= 75) return 'Hard';
  return 'Master';
}

function getWorldId(level: number): number {
  if (level <= 25) return 1;
  if (level <= 50) return 2;
  if (level <= 75) return 3;
  return 4;
}

function buildLevelConfig(level: number): LevelConfig {
  const gameType = CYCLE_ORDER[(level - 1) % 4];
  const worldId = getWorldId(level);
  const difficultyLabel = getDifficultyLabel(level);
  const tier = Math.floor((level - 1) / 4); // 0..24 within each game type

  if (gameType === 'number') {
    // Levels 1..25 (tier 0..6): 3x3; tier 7..18: 4x4; tier 19..24: 5x5
    const gridSize = tier < 7 ? 3 : tier < 19 ? 4 : 5;
    const shuffleSteps =
      gridSize === 3
        ? 10 + tier * 4
        : gridSize === 4
          ? 24 + (tier - 7) * 5
          : 45 + (tier - 19) * 6;
    const parMoves = Math.round(shuffleSteps * 1.4) + 6;
    const parTimeSeconds = gridSize === 3 ? 65 : gridSize === 4 ? 145 : 220;
    return {
      level,
      gameType,
      worldId,
      title: `Number Grid ${gridSize}×${gridSize}`,
      difficultyLabel,
      gridSize,
      targetScore: 1000 + level * 45,
      parMoves,
      parTimeSeconds,
      shuffleSteps,
    };
  }

  if (gameType === 'block') {
    // 8x8 early, 9x9 mid, 10x10 advanced with escalating target scores
    const gridSize = tier < 6 ? 8 : tier < 14 ? 9 : 10;
    const targetScore = 220 + tier * 55;
    const parTimeSeconds = 120 + tier * 6;
    return {
      level,
      gameType,
      worldId,
      title: `Block Fit ${gridSize}×${gridSize}`,
      difficultyLabel,
      gridSize,
      targetScore,
      parMoves: 18 + Math.floor(tier / 2),
      parTimeSeconds,
    };
  }

  if (gameType === 'picture') {
    const gridSize = tier < 7 ? 3 : tier < 18 ? 4 : 5;
    const asset = PICTURE_ASSETS[tier % PICTURE_ASSETS.length];
    const parMoves = gridSize === 3 ? 12 : gridSize === 4 ? 22 : 34;
    const parTimeSeconds = gridSize === 3 ? 60 : gridSize === 4 ? 120 : 180;
    return {
      level,
      gameType,
      worldId,
      title: asset.title,
      difficultyLabel,
      gridSize,
      targetScore: 1000 + level * 40,
      parMoves,
      parTimeSeconds,
      pictureAssetId: asset.id,
    };
  }

  // match3
  const gridSize = tier < 6 ? 6 : tier < 15 ? 7 : 8;
  const gemTypesCount = tier < 10 ? 5 : 6;
  const moveLimit = Math.max(16, 26 - Math.floor(tier / 3));
  const targetScore = 450 + tier * 95;
  return {
    level,
    gameType,
    worldId,
    title: `Gem Cascade ${gridSize}×${gridSize}`,
    difficultyLabel,
    gridSize,
    targetScore,
    moveLimit,
    parMoves: moveLimit,
    parTimeSeconds: 120 + tier * 4,
    gemTypesCount,
  };
}

export const ALL_LEVELS: LevelConfig[] = Array.from({ length: 100 }, (_, idx) =>
  buildLevelConfig(idx + 1)
);

export function getLevelConfig(level: number): LevelConfig {
  const clamped = Math.max(1, Math.min(100, level));
  return ALL_LEVELS[clamped - 1];
}
