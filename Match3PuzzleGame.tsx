import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Diamond, Hexagon, Droplet, Star, Triangle, Clover } from 'lucide-react';
import type { LevelConfig, PlayState } from '../../types/game';
import { audioEngine } from '../../utils/audio';

interface Match3PuzzleGameProps {
  levelConfig: LevelConfig;
  playState: PlayState;
  elapsedSeconds: number;
  onScoreChange: (score: number) => void;
  onMovesChange: (moves: number) => void;
  onMovesLeftChange: (movesLeft: number) => void;
  onWin: (finalScore: number, stars: number, movesUsed: number, summaryText: string) => void;
  onGameOver: () => void;
}

interface GemStyle {
  bg: string;
  border: string;
  label: string;
  renderIcon: (cls: string) => React.ReactNode;
}

const GEM_STYLES: GemStyle[] = [
  {
    bg: 'bg-rose-500',
    border: 'border-rose-600',
    label: 'Ruby',
    renderIcon: (cls) => <Diamond className={cls} />,
  },
  {
    bg: 'bg-emerald-500',
    border: 'border-emerald-600',
    label: 'Emerald',
    renderIcon: (cls) => <Hexagon className={cls} />,
  },
  {
    bg: 'bg-blue-500',
    border: 'border-blue-600',
    label: 'Sapphire',
    renderIcon: (cls) => <Droplet className={cls} />,
  },
  {
    bg: 'bg-amber-400',
    border: 'border-amber-500',
    label: 'Topaz',
    renderIcon: (cls) => <Star className={cls} />,
  },
  {
    bg: 'bg-violet-500',
    border: 'border-violet-600',
    label: 'Amethyst',
    renderIcon: (cls) => <Triangle className={cls} />,
  },
  {
    bg: 'bg-teal-500',
    border: 'border-teal-600',
    label: 'Jade',
    renderIcon: (cls) => <Clover className={cls} />,
  },
];

function findMatches(board: number[][]): Set<string> {
  const size = board.length;
  const matched = new Set<string>();

  // Horizontal runs
  for (let r = 0; r < size; r++) {
    let runStart = 0;
    for (let c = 1; c <= size; c++) {
      if (c < size && board[r][c] !== -1 && board[r][c] === board[r][runStart]) {
        continue;
      }
      if (c - runStart >= 3 && board[r][runStart] !== -1) {
        for (let k = runStart; k < c; k++) matched.add(`${r}-${k}`);
      }
      runStart = c;
    }
  }

  // Vertical runs
  for (let c = 0; c < size; c++) {
    let runStart = 0;
    for (let r = 1; r <= size; r++) {
      if (r < size && board[r][c] !== -1 && board[r][c] === board[runStart][c]) {
        continue;
      }
      if (r - runStart >= 3 && board[runStart][c] !== -1) {
        for (let k = runStart; k < r; k++) matched.add(`${k}-${c}`);
      }
      runStart = r;
    }
  }

  return matched;
}

function hasValidSwap(board: number[][]): boolean {
  const size = board.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Try right
      if (c + 1 < size) {
        const copy = board.map((row) => [...row]);
        [copy[r][c], copy[r][c + 1]] = [copy[r][c + 1], copy[r][c]];
        if (findMatches(copy).size > 0) return true;
      }
      // Try down
      if (r + 1 < size) {
        const copy = board.map((row) => [...row]);
        [copy[r][c], copy[r + 1][c]] = [copy[r + 1][c], copy[r][c]];
        if (findMatches(copy).size > 0) return true;
      }
    }
  }
  return false;
}

function createInitialBoard(size: number, gemTypes: number): number[][] {
  for (let attempt = 0; attempt < 25; attempt++) {
    const board: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        let gem = Math.floor(Math.random() * gemTypes);
        // Prevent initial 3-in-a-row
        while (
          (c >= 2 && board[r][c - 1] === gem && board[r][c - 2] === gem) ||
          (r >= 2 && board[r - 1][c] === gem && board[r - 2][c] === gem)
        ) {
          gem = (gem + 1) % gemTypes;
        }
        board[r][c] = gem;
      }
    }
    if (hasValidSwap(board)) return board;
  }
  // Fallback deterministic playable pattern
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (__, c) => (r * 2 + c) % gemTypes)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export const Match3PuzzleGame: React.FC<Match3PuzzleGameProps> = ({
  levelConfig,
  playState,
  elapsedSeconds,
  onScoreChange,
  onMovesChange,
  onMovesLeftChange,
  onWin,
  onGameOver,
}) => {
  const size = levelConfig.gridSize;
  const gemTypes = levelConfig.gemTypesCount ?? 5;
  const initialMoves = levelConfig.moveLimit ?? 22;

  const [board, setBoard] = useState<number[][]>(() => createInitialBoard(size, gemTypes));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [matchedKeys, setMatchedKeys] = useState<Set<string>>(new Set());
  const [shakePair, setShakePair] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(initialMoves);
  const [isBusy, setIsBusy] = useState(false);
  const [comboBanner, setComboBanner] = useState<string | null>(null);

  const swipeStartRef = useRef<{ row: number; col: number; x: number; y: number } | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    onMovesLeftChange(initialMoves);
    return () => {
      mountedRef.current = false;
    };
  }, [initialMoves, onMovesLeftChange]);

  const attemptSwap = useCallback(
    async (r1: number, c1: number, r2: number, c2: number) => {
      if (playState !== 'PLAYING' || isBusy) return;
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) {
        setSelected([r2, c2]);
        audioEngine.playClick();
        return;
      }

      setSelected(null);
      setIsBusy(true);

      const swapped = board.map((row) => [...row]);
      [swapped[r1][c1], swapped[r2][c2]] = [swapped[r2][c2], swapped[r1][c1]];

      const firstMatches = findMatches(swapped);
      if (firstMatches.size === 0) {
        audioEngine.playInvalid();
        setShakePair(new Set([`${r1}-${c1}`, `${r2}-${c2}`]));
        await sleep(240);
        if (!mountedRef.current) return;
        setShakePair(new Set());
        setIsBusy(false);
        return;
      }

      const nextMovesLeft = movesLeft - 1;
      const movesUsed = initialMoves - nextMovesLeft;
      setMovesLeft(nextMovesLeft);
      onMovesLeftChange(nextMovesLeft);
      onMovesChange(movesUsed);

      let workingBoard = swapped;
      let runningScore = score;
      let combo = 1;
      let currentMatches = firstMatches;

      setBoard(workingBoard);

      while (currentMatches.size > 0) {
        if (!mountedRef.current) return;
        setMatchedKeys(currentMatches);
        audioEngine.playMatch(combo);

        const basePoints = currentMatches.size * 20;
        const multiGemBonus = currentMatches.size >= 4 ? (currentMatches.size - 3) * 35 : 0;
        const gained = (basePoints + multiGemBonus) * combo;
        runningScore += gained;
        setScore(runningScore);
        onScoreChange(runningScore);

        if (combo > 1) {
          setComboBanner(`${combo}× Cascade! +${gained}`);
        } else if (currentMatches.size >= 4) {
          setComboBanner(`${currentMatches.size}-Gem Burst! +${gained}`);
        }

        await sleep(220);
        if (!mountedRef.current) return;

        // Clear matched cells
        const afterClear = workingBoard.map((row) => [...row]);
        for (const key of currentMatches) {
          const [rr, cc] = key.split('-').map(Number);
          afterClear[rr][cc] = -1;
        }
        setMatchedKeys(new Set());

        // Gravity drop & refill
        for (let c = 0; c < size; c++) {
          let writeRow = size - 1;
          for (let r = size - 1; r >= 0; r--) {
            if (afterClear[r][c] !== -1) {
              afterClear[writeRow][c] = afterClear[r][c];
              if (writeRow !== r) afterClear[r][c] = -1;
              writeRow--;
            }
          }
          for (let r = writeRow; r >= 0; r--) {
            afterClear[r][c] = Math.floor(Math.random() * gemTypes);
          }
        }

        workingBoard = afterClear;
        setBoard(workingBoard);
        await sleep(200);
        if (!mountedRef.current) return;

        currentMatches = findMatches(workingBoard);
        combo += 1;
      }

      setComboBanner(null);

      // Check victory
      if (runningScore >= levelConfig.targetScore) {
        const remainingBonus = nextMovesLeft * 30;
        const finalScore = runningScore + remainingBonus;
        setScore(finalScore);
        onScoreChange(finalScore);

        let stars = 1;
        if (nextMovesLeft >= Math.ceil(initialMoves * 0.28)) {
          stars = 3;
        } else if (nextMovesLeft >= 2 || elapsedSeconds <= levelConfig.parTimeSeconds) {
          stars = 2;
        }

        audioEngine.playWin();
        setIsBusy(false);
        onWin(
          finalScore,
          stars,
          movesUsed,
          `Cleared target with ${nextMovesLeft} moves remaining!`
        );
        return;
      }

      // Check Game Over
      if (nextMovesLeft <= 0) {
        audioEngine.playGameOver();
        setIsBusy(false);
        onGameOver();
        return;
      }

      // Auto-reshuffle if no valid swap exists
      if (!hasValidSwap(workingBoard)) {
        setComboBanner('No moves left — reshuffling board...');
        await sleep(500);
        if (!mountedRef.current) return;
        setBoard(createInitialBoard(size, gemTypes));
        setComboBanner(null);
      }

      setIsBusy(false);
    },
    [
      board,
      elapsedSeconds,
      gemTypes,
      initialMoves,
      isBusy,
      levelConfig.parTimeSeconds,
      levelConfig.targetScore,
      movesLeft,
      onGameOver,
      onMovesChange,
      onMovesLeftChange,
      onScoreChange,
      onWin,
      playState,
      score,
      size,
    ]
  );

  const handleCellClick = (r: number, c: number) => {
    if (playState !== 'PLAYING' || isBusy) return;
    if (!selected) {
      audioEngine.playClick();
      setSelected([r, c]);
      return;
    }
    const [sr, sc] = selected;
    if (sr === r && sc === c) {
      setSelected(null);
      return;
    }
    void attemptSwap(sr, sc, r, c);
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4 select-none">
      <div className="w-full flex items-center justify-between text-xs sm:text-sm text-slate-600 px-1 min-h-[24px]">
        <span>
          Target:{' '}
          <strong className="font-mono-num text-rose-700">
            {levelConfig.targetScore.toLocaleString()}
          </strong>
        </span>
        {comboBanner ? (
          <span className="font-display font-bold text-rose-600 animate-pop-in">
            {comboBanner}
          </span>
        ) : (
          <span className="text-slate-500">Tap or swipe adjacent gems</span>
        )}
      </div>

      {/* Match-3 Board */}
      <div
        className="w-full aspect-square bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-700 shadow-md grid gap-1.5 touch-none"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {board.map((row, r) =>
          row.map((gemId, c) => {
            const key = `${r}-${c}`;
            const gem = GEM_STYLES[gemId] ?? GEM_STYLES[0];
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isMatched = matchedKeys.has(key);
            const isShaking = shakePair.has(key);

            return (
              <button
                key={key}
                type="button"
                aria-label={`${gem.label} gem at row ${r + 1} column ${c + 1}`}
                onPointerDown={(e) => {
                  if (playState !== 'PLAYING' || isBusy) return;
                  swipeStartRef.current = { row: r, col: c, x: e.clientX, y: e.clientY };
                }}
                onPointerUp={(e) => {
                  const start = swipeStartRef.current;
                  swipeStartRef.current = null;
                  if (!start || playState !== 'PLAYING' || isBusy) return;

                  const dx = e.clientX - start.x;
                  const dy = e.clientY - start.y;
                  if (Math.abs(dx) > 18 || Math.abs(dy) > 18) {
                    if (Math.abs(dx) > Math.abs(dy)) {
                      const nc = start.col + (dx > 0 ? 1 : -1);
                      if (nc >= 0 && nc < size) void attemptSwap(start.row, start.col, start.row, nc);
                    } else {
                      const nr = start.row + (dy > 0 ? 1 : -1);
                      if (nr >= 0 && nr < size) void attemptSwap(start.row, start.col, nr, start.col);
                    }
                  } else {
                    handleCellClick(r, c);
                  }
                }}
                className={`rounded-xl border flex items-center justify-center transition-transform duration-150 cursor-pointer ${
                  gem.bg
                } ${gem.border} ${
                  isSelected ? 'ring-3 ring-white scale-105 z-10 shadow-lg' : 'hover:brightness-105'
                } ${isMatched ? 'animate-burst' : ''} ${isShaking ? 'animate-shake' : ''}`}
              >
                {gem.renderIcon(
                  size <= 6
                    ? 'w-6 h-6 sm:w-7 sm:h-7 text-white fill-white/25 stroke-[2.2]'
                    : 'w-5 h-5 sm:w-6 sm:h-6 text-white fill-white/25 stroke-[2.2]'
                )}
              </button>
            );
          })
        )}
      </div>

      <p className="text-xs text-slate-500 text-center">
        Swipe a gem or tap two adjacent gems to match 3 or more of the same shape.
      </p>
    </div>
  );
};
