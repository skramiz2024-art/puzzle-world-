import React, { useCallback, useEffect, useState } from 'react';
import type { LevelConfig, PlayState } from '../../types/game';
import { audioEngine } from '../../utils/audio';

interface NumberPuzzleGameProps {
  levelConfig: LevelConfig;
  playState: PlayState;
  elapsedSeconds: number;
  onScoreChange: (score: number) => void;
  onMovesChange: (moves: number) => void;
  onWin: (finalScore: number, stars: number, movesUsed: number, summaryText: string) => void;
}

function isBoardSolved(board: number[]): boolean {
  for (let i = 0; i < board.length - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[board.length - 1] === 0;
}

function createSolvableBoard(size: number, shuffleSteps: number): number[] {
  const total = size * size;
  const board = Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1));
  let emptyIdx = total - 1;
  let lastEmptyIdx = -1;

  for (let step = 0; step < shuffleSteps; step++) {
    const row = Math.floor(emptyIdx / size);
    const col = emptyIdx % size;
    const neighbors: number[] = [];
    if (row > 0) neighbors.push(emptyIdx - size);
    if (row < size - 1) neighbors.push(emptyIdx + size);
    if (col > 0) neighbors.push(emptyIdx - 1);
    if (col < size - 1) neighbors.push(emptyIdx + 1);

    const candidates = neighbors.filter((idx) => idx !== lastEmptyIdx);
    const nextIdx = candidates[Math.floor(Math.random() * candidates.length)] ?? neighbors[0];

    board[emptyIdx] = board[nextIdx];
    board[nextIdx] = 0;
    lastEmptyIdx = emptyIdx;
    emptyIdx = nextIdx;
  }

  // Guarantee it never starts already solved
  if (isBoardSolved(board)) {
    const swapIdx = emptyIdx === total - 1 ? total - 2 : total - 1;
    board[emptyIdx] = board[swapIdx];
    board[swapIdx] = 0;
  }

  return board;
}

export const NumberPuzzleGame: React.FC<NumberPuzzleGameProps> = ({
  levelConfig,
  playState,
  elapsedSeconds,
  onScoreChange,
  onMovesChange,
  onWin,
}) => {
  const size = levelConfig.gridSize;
  const [board, setBoard] = useState<number[]>(() =>
    createSolvableBoard(size, levelConfig.shuffleSteps ?? 20)
  );
  const [moves, setMoves] = useState(0);

  // Sync live score projection
  useEffect(() => {
    const correctCount = board.reduce((acc, val, idx) => {
      if (val !== 0 && val === idx + 1) return acc + 1;
      return acc;
    }, 0);
    onScoreChange(correctCount * 40);
  }, [board, onScoreChange]);

  const commitMove = useCallback(
    (nextBoard: number[], nextMoves: number) => {
      setBoard(nextBoard);
      setMoves(nextMoves);
      onMovesChange(nextMoves);
      audioEngine.playSlide();

      if (isBoardSolved(nextBoard)) {
        const moveBonus = Math.max(0, (levelConfig.parMoves - nextMoves) * 25);
        const timeBonus = Math.max(0, (levelConfig.parTimeSeconds - elapsedSeconds) * 5);
        const finalScore = levelConfig.targetScore + moveBonus + timeBonus;
        let stars = 1;
        if (nextMoves <= levelConfig.parMoves && elapsedSeconds <= levelConfig.parTimeSeconds) {
          stars = 3;
        } else if (nextMoves <= Math.round(levelConfig.parMoves * 1.45)) {
          stars = 2;
        }
        onScoreChange(finalScore);
        audioEngine.playWin();
        onWin(
          finalScore,
          stars,
          nextMoves,
          `Solved the ${size}×${size} grid in ${nextMoves} moves.`
        );
      }
    },
    [elapsedSeconds, levelConfig, onMovesChange, onScoreChange, onWin, size]
  );

  const handleTileClick = useCallback(
    (tileIdx: number) => {
      if (playState !== 'PLAYING') return;
      const emptyIdx = board.indexOf(0);
      if (tileIdx === emptyIdx) return;

      const tileRow = Math.floor(tileIdx / size);
      const tileCol = tileIdx % size;
      const emptyRow = Math.floor(emptyIdx / size);
      const emptyCol = emptyIdx % size;

      // Only slide if in same row or same column
      if (tileRow !== emptyRow && tileCol !== emptyCol) {
        audioEngine.playInvalid();
        return;
      }

      const nextBoard = [...board];
      if (tileRow === emptyRow) {
        const step = tileCol < emptyCol ? -1 : 1;
        for (let c = emptyCol; c !== tileCol; c += step) {
          const curr = emptyRow * size + c;
          const prev = emptyRow * size + (c + step);
          nextBoard[curr] = nextBoard[prev];
        }
        nextBoard[tileIdx] = 0;
      } else {
        const step = tileRow < emptyRow ? -1 : 1;
        for (let r = emptyRow; r !== tileRow; r += step) {
          const curr = r * size + emptyCol;
          const prev = (r + step) * size + emptyCol;
          nextBoard[curr] = nextBoard[prev];
        }
        nextBoard[tileIdx] = 0;
      }

      commitMove(nextBoard, moves + 1);
    },
    [board, commitMove, moves, playState, size]
  );

  // Keyboard Arrow & WASD support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (playState !== 'PLAYING') return;
      const emptyIdx = board.indexOf(0);
      const emptyRow = Math.floor(emptyIdx / size);
      const emptyCol = emptyIdx % size;

      let targetIdx = -1;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (emptyRow < size - 1) targetIdx = emptyIdx + size;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (emptyRow > 0) targetIdx = emptyIdx - size;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (emptyCol < size - 1) targetIdx = emptyIdx + 1;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (emptyCol > 0) targetIdx = emptyIdx - 1;
      }

      if (targetIdx !== -1) {
        e.preventDefault();
        handleTileClick(targetIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, handleTileClick, playState, size]);

  const correctCount = board.filter((v, i) => v !== 0 && v === i + 1).length;

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4">
      <div className="w-full flex items-center justify-between text-xs sm:text-sm text-slate-600 px-1">
        <span>
          Tiles in place:{' '}
          <strong className="font-mono-num text-emerald-700">
            {correctCount}/{size * size - 1}
          </strong>
        </span>
        <span>
          Par moves: <strong className="font-mono-num text-slate-900">{levelConfig.parMoves}</strong>
        </span>
      </div>

      {/* Tactile Wooden/Slate Number Grid */}
      <div
        className="w-full aspect-square bg-slate-800 p-2.5 sm:p-3.5 rounded-2xl shadow-md border border-slate-700 grid gap-2 sm:gap-2.5 select-none touch-manipulation"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {board.map((value, idx) => {
          if (value === 0) {
            return (
              <div
                key={`empty-${idx}`}
                aria-label="Empty slot"
                className="rounded-xl bg-slate-900/70 border border-slate-700/60 shadow-inner"
              />
            );
          }

          const isCorrectSlot = value === idx + 1;

          return (
            <button
              key={value}
              type="button"
              onClick={() => handleTileClick(idx)}
              className={`relative rounded-xl font-display font-extrabold flex items-center justify-center transition-transform duration-100 active:scale-95 cursor-pointer shadow-sm border select-none ${
                size === 3
                  ? 'text-3xl sm:text-4xl'
                  : size === 4
                    ? 'text-2xl sm:text-3xl'
                    : 'text-lg sm:text-2xl'
              } ${
                isCorrectSlot
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-slate-900 border-amber-200 hover:bg-white'
              }`}
            >
              <span>{value}</span>
              {isCorrectSlot && (
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500"
                />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 text-center">
        Tap any tile in the same row or column as the gap to slide, or use Arrow keys.
      </p>
    </div>
  );
};
