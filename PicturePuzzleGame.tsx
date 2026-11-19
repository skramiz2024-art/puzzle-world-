import React, { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import { PICTURE_ASSETS } from '../../data/levels';
import type { LevelConfig, PlayState } from '../../types/game';
import { audioEngine } from '../../utils/audio';

interface PicturePuzzleGameProps {
  levelConfig: LevelConfig;
  playState: PlayState;
  elapsedSeconds: number;
  onScoreChange: (score: number) => void;
  onMovesChange: (moves: number) => void;
  onWin: (finalScore: number, stars: number, movesUsed: number, summaryText: string) => void;
}

function createScrambledTiles(total: number): number[] {
  const arr = Array.from({ length: total }, (_, i) => i);
  for (let attempt = 0; attempt < 5; attempt++) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const correctCount = arr.filter((v, idx) => v === idx).length;
    if (correctCount <= Math.floor(total / 3)) return arr;
  }
  // Ensure never starts solved
  if (arr.every((v, idx) => v === idx)) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

export const PicturePuzzleGame: React.FC<PicturePuzzleGameProps> = ({
  levelConfig,
  playState,
  elapsedSeconds,
  onScoreChange,
  onMovesChange,
  onWin,
}) => {
  const size = levelConfig.gridSize;
  const total = size * size;
  const asset =
    PICTURE_ASSETS.find((a) => a.id === levelConfig.pictureAssetId) ?? PICTURE_ASSETS[0];

  const [tiles, setTiles] = useState<number[]>(() => createScrambledTiles(total));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [showReference, setShowReference] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // Preload check so CSS background fallback works cleanly if offline
  useEffect(() => {
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.onload = () => setImgFailed(false);
    img.onerror = () => setImgFailed(true);
    img.src = asset.src;
  }, [asset.src]);

  useEffect(() => {
    const correct = tiles.filter((val, idx) => val === idx).length;
    onScoreChange(correct * 50);
  }, [tiles, onScoreChange]);

  const swapSlots = useCallback(
    (slotA: number, slotB: number) => {
      if (playState !== 'PLAYING' || slotA === slotB) return;

      const nextTiles = [...tiles];
      [nextTiles[slotA], nextTiles[slotB]] = [nextTiles[slotB], nextTiles[slotA]];
      const nextMoves = moves + 1;

      setTiles(nextTiles);
      setMoves(nextMoves);
      setSelectedSlot(null);
      onMovesChange(nextMoves);
      audioEngine.playSwap();

      const solved = nextTiles.every((val, idx) => val === idx);
      if (solved) {
        const moveBonus = Math.max(0, (levelConfig.parMoves - nextMoves) * 35);
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
          `Restored "${asset.title}" (${size}×${size}) in ${nextMoves} swaps.`
        );
      }
    },
    [asset.title, elapsedSeconds, levelConfig, moves, onMovesChange, onScoreChange, onWin, playState, size, tiles]
  );

  const handleSlotTap = (slotIdx: number) => {
    if (playState !== 'PLAYING' || showReference) return;
    if (selectedSlot === null) {
      audioEngine.playClick();
      setSelectedSlot(slotIdx);
    } else if (selectedSlot === slotIdx) {
      setSelectedSlot(null);
    } else {
      swapSlots(selectedSlot, slotIdx);
    }
  };

  const correctPieces = tiles.filter((v, idx) => v === idx).length;

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4">
      <div className="w-full flex items-center justify-between gap-2 px-1">
        <div className="text-xs sm:text-sm text-slate-600">
          Pieces placed:{' '}
          <strong className="font-mono-num text-violet-700">
            {correctPieces}/{total}
          </strong>
        </div>

        <button
          type="button"
          onClick={() => setShowReference((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap min-h-[36px] ${
            showReference
              ? 'bg-violet-600 border-violet-600 text-white'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {showReference ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showReference ? 'Hide Reference' : 'Peek Picture'}</span>
        </button>
      </div>

      {/* Puzzle Canvas */}
      <div className="relative w-full aspect-square bg-slate-900 p-2 rounded-2xl border border-slate-700 shadow-md">
        {showReference ? (
          <div className="w-full h-full rounded-xl overflow-hidden relative">
            {!imgFailed ? (
              <img
                src={asset.src}
                alt={`${asset.title} reference`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-600 to-indigo-800 flex items-center justify-center text-white font-display font-bold text-xl">
                {asset.title}
              </div>
            )}
            <div className="absolute bottom-3 inset-x-3 bg-slate-950/75 text-white text-xs font-medium py-1.5 px-3 rounded-lg text-center">
              Reference Preview — tap &ldquo;Hide Reference&rdquo; to continue swapping
            </div>
          </div>
        ) : (
          <div
            className="w-full h-full grid gap-1 select-none touch-manipulation"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {tiles.map((pieceId, slotIdx) => {
              const targetRow = Math.floor(pieceId / size);
              const targetCol = pieceId % size;
              const isSelected = selectedSlot === slotIdx;
              const isCorrect = pieceId === slotIdx;

              const bgPosX = size > 1 ? (targetCol / (size - 1)) * 100 : 0;
              const bgPosY = size > 1 ? (targetRow / (size - 1)) * 100 : 0;

              return (
                <button
                  key={`slot-${slotIdx}`}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(slotIdx));
                    setSelectedSlot(slotIdx);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIdx = Number(e.dataTransfer.getData('text/plain'));
                    if (!Number.isNaN(fromIdx)) {
                      swapSlots(fromIdx, slotIdx);
                    }
                  }}
                  onClick={() => handleSlotTap(slotIdx)}
                  aria-label={`Puzzle slot ${slotIdx + 1}, piece ${pieceId + 1}`}
                  className={`relative rounded-lg overflow-hidden transition-transform duration-100 cursor-pointer ${
                    isSelected
                      ? 'ring-3 ring-amber-400 scale-[0.95] z-10 shadow-lg'
                      : isCorrect
                        ? 'ring-1 ring-emerald-400/80'
                        : 'ring-1 ring-white/15 hover:brightness-105'
                  }`}
                  style={
                    !imgFailed
                      ? {
                          backgroundImage: `url("${asset.src}")`,
                          backgroundSize: `${size * 100}% ${size * 100}%`,
                          backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                        }
                      : {
                          background: `hsl(${(pieceId * 37) % 360}, 65%, 45%)`,
                        }
                  }
                >
                  {imgFailed && (
                    <span className="font-display font-bold text-white text-lg drop-shadow">
                      {pieceId + 1}
                    </span>
                  )}

                  {isCorrect && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-xs"
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 text-center">
        Tap two pieces to swap them, or drag one piece onto another.
      </p>
    </div>
  );
};
