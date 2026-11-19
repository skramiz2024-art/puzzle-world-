import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { LevelConfig, PlayState } from '../../types/game';
import { audioEngine } from '../../utils/audio';

interface BlockPuzzleGameProps {
  levelConfig: LevelConfig;
  playState: PlayState;
  elapsedSeconds: number;
  onScoreChange: (score: number) => void;
  onMovesChange: (moves: number) => void;
  onWin: (finalScore: number, stars: number, movesUsed: number, summaryText: string) => void;
  onGameOver: () => void;
}

interface BlockShape {
  id: string;
  cells: Array<[number, number]>; // [rowOffset, colOffset]
  colorClass: string;
  previewClass: string;
  tierMin: number;
}

const SHAPE_CATALOG: BlockShape[] = [
  { id: 'dot', cells: [[0, 0]], colorClass: 'bg-sky-500 border-sky-600', previewClass: 'bg-sky-400/50', tierMin: 0 },
  { id: 'h2', cells: [[0, 0], [0, 1]], colorClass: 'bg-emerald-500 border-emerald-600', previewClass: 'bg-emerald-400/50', tierMin: 0 },
  { id: 'v2', cells: [[0, 0], [1, 0]], colorClass: 'bg-emerald-500 border-emerald-600', previewClass: 'bg-emerald-400/50', tierMin: 0 },
  { id: 'h3', cells: [[0, 0], [0, 1], [0, 2]], colorClass: 'bg-amber-500 border-amber-600', previewClass: 'bg-amber-400/50', tierMin: 0 },
  { id: 'v3', cells: [[0, 0], [1, 0], [2, 0]], colorClass: 'bg-amber-500 border-amber-600', previewClass: 'bg-amber-400/50', tierMin: 0 },
  { id: 'sq2', cells: [[0, 0], [0, 1], [1, 0], [1, 1]], colorClass: 'bg-orange-500 border-orange-600', previewClass: 'bg-orange-400/50', tierMin: 0 },
  { id: 'l3a', cells: [[0, 0], [1, 0], [1, 1]], colorClass: 'bg-violet-500 border-violet-600', previewClass: 'bg-violet-400/50', tierMin: 0 },
  { id: 'l3b', cells: [[0, 0], [0, 1], [1, 0]], colorClass: 'bg-violet-500 border-violet-600', previewClass: 'bg-violet-400/50', tierMin: 0 },
  { id: 'h4', cells: [[0, 0], [0, 1], [0, 2], [0, 3]], colorClass: 'bg-rose-500 border-rose-600', previewClass: 'bg-rose-400/50', tierMin: 2 },
  { id: 'v4', cells: [[0, 0], [1, 0], [2, 0], [3, 0]], colorClass: 'bg-rose-500 border-rose-600', previewClass: 'bg-rose-400/50', tierMin: 2 },
  { id: 't4', cells: [[0, 0], [0, 1], [0, 2], [1, 1]], colorClass: 'bg-indigo-500 border-indigo-600', previewClass: 'bg-indigo-400/50', tierMin: 3 },
  { id: 'z4', cells: [[0, 0], [0, 1], [1, 1], [1, 2]], colorClass: 'bg-teal-500 border-teal-600', previewClass: 'bg-teal-400/50', tierMin: 4 },
  { id: 'l4', cells: [[0, 0], [1, 0], [2, 0], [2, 1]], colorClass: 'bg-cyan-600 border-cyan-700', previewClass: 'bg-cyan-400/50', tierMin: 5 },
  { id: 'bigL', cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], colorClass: 'bg-fuchsia-600 border-fuchsia-700', previewClass: 'bg-fuchsia-400/50', tierMin: 8 },
  { id: 'sq3', cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], colorClass: 'bg-rose-600 border-rose-700', previewClass: 'bg-rose-400/50', tierMin: 10 },
];

interface TrayPiece {
  uid: string;
  shape: BlockShape;
}

function canPlaceAt(
  grid: Array<Array<string | null>>,
  shape: BlockShape,
  anchorRow: number,
  anchorCol: number
): boolean {
  const size = grid.length;
  for (const [dr, dc] of shape.cells) {
    const r = anchorRow + dr;
    const c = anchorCol + dc;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    if (grid[r][c] !== null) return false;
  }
  return true;
}

function canShapeFitAnywhere(grid: Array<Array<string | null>>, shape: BlockShape): boolean {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (canPlaceAt(grid, shape, r, c)) return true;
    }
  }
  return false;
}

function generateTray(tier: number, grid: Array<Array<string | null>>): TrayPiece[] {
  const pool = SHAPE_CATALOG.filter((s) => s.tierMin <= tier);
  for (let attempt = 0; attempt < 8; attempt++) {
    const pieces = Array.from({ length: 3 }, (_, idx) => {
      const shape = pool[Math.floor(Math.random() * pool.length)];
      return { uid: `${Date.now()}-${attempt}-${idx}-${Math.random()}`, shape };
    });
    if (pieces.some((p) => canShapeFitAnywhere(grid, p.shape))) {
      return pieces;
    }
  }
  return Array.from({ length: 3 }, (_, idx) => ({
    uid: `${Date.now()}-fallback-${idx}-${Math.random()}`,
    shape: pool[Math.floor(Math.random() * pool.length)],
  }));
}

function getShapeDimensions(shape: BlockShape): { rows: number; cols: number } {
  const maxR = Math.max(...shape.cells.map(([r]) => r));
  const maxC = Math.max(...shape.cells.map(([, c]) => c));
  return { rows: maxR + 1, cols: maxC + 1 };
}

export const BlockPuzzleGame: React.FC<BlockPuzzleGameProps> = ({
  levelConfig,
  playState,
  elapsedSeconds,
  onScoreChange,
  onMovesChange,
  onWin,
  onGameOver,
}) => {
  const size = levelConfig.gridSize;
  const tier = Math.floor((levelConfig.level - 1) / 4);

  const [grid, setGrid] = useState<Array<Array<string | null>>>(() =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => null))
  );
  const [tray, setTray] = useState<Array<TrayPiece | null>>(() => {
    const empty = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
    return generateTray(tier, empty);
  });
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [lastClearBanner, setLastClearBanner] = useState<string | null>(null);

  // Pointer drag state
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const pointerTypeRef = useRef<string>('mouse');

  const activePieceIdx = draggingIdx !== null ? draggingIdx : selectedIdx;
  const activePiece = activePieceIdx !== null ? tray[activePieceIdx] : null;

  const getAnchorFromPointer = useCallback(
    (clientX: number, clientY: number, piece: TrayPiece, isTouch: boolean): [number, number] | null => {
      const el = boardRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const offsetY = isTouch ? -48 : 0;
      const relX = clientX - rect.left;
      const relY = clientY + offsetY - rect.top;
      if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) return null;

      const cellW = rect.width / size;
      const cellH = rect.height / size;
      const dims = getShapeDimensions(piece.shape);

      // Center shape around cursor/finger
      const rawCol = Math.floor(relX / cellW - (dims.cols - 1) / 2);
      const rawRow = Math.floor(relY / cellH - (dims.rows - 1) / 2);
      return [rawRow, rawCol];
    },
    [size]
  );

  const placePieceAt = useCallback(
    (trayIndex: number, anchorRow: number, anchorCol: number) => {
      if (playState !== 'PLAYING') return;
      const piece = tray[trayIndex];
      if (!piece) return;

      if (!canPlaceAt(grid, piece.shape, anchorRow, anchorCol)) {
        audioEngine.playInvalid();
        return;
      }

      const nextGrid = grid.map((r) => [...r]);
      for (const [dr, dc] of piece.shape.cells) {
        nextGrid[anchorRow + dr][anchorCol + dc] = piece.shape.colorClass;
      }

      // Detect completed rows and columns
      const fullRows: number[] = [];
      const fullCols: number[] = [];
      for (let r = 0; r < size; r++) {
        if (nextGrid[r].every((c) => c !== null)) fullRows.push(r);
      }
      for (let c = 0; c < size; c++) {
        let allFilled = true;
        for (let r = 0; r < size; r++) {
          if (nextGrid[r][c] === null) {
            allFilled = false;
            break;
          }
        }
        if (allFilled) fullCols.push(c);
      }

      for (const r of fullRows) {
        for (let c = 0; c < size; c++) nextGrid[r][c] = null;
      }
      for (const c of fullCols) {
        for (let r = 0; r < size; r++) nextGrid[r][c] = null;
      }

      const linesCleared = fullRows.length + fullCols.length;
      const placementPoints = piece.shape.cells.length * 10;
      const clearPoints = linesCleared > 0 ? linesCleared * size * 14 * linesCleared : 0;
      const nextScore = score + placementPoints + clearPoints;
      const nextMoves = moves + 1;

      if (linesCleared > 0) {
        audioEngine.playLineClear(linesCleared);
        setLastClearBanner(
          linesCleared > 1
            ? `${linesCleared}× Line Combo! +${clearPoints}`
            : `Line Cleared! +${clearPoints}`
        );
        window.setTimeout(() => setLastClearBanner(null), 1300);
      } else {
        audioEngine.playPlaceBlock();
      }

      let nextTray = tray.map((item, idx) => (idx === trayIndex ? null : item));
      if (nextTray.every((item) => item === null)) {
        nextTray = generateTray(tier, nextGrid);
      }

      setGrid(nextGrid);
      setTray(nextTray);
      setScore(nextScore);
      setMoves(nextMoves);
      setHoverCell(null);
      onScoreChange(nextScore);
      onMovesChange(nextMoves);

      // Select next available piece automatically
      const nextAvailable = nextTray.findIndex((item) => item !== null);
      setSelectedIdx(nextAvailable !== -1 ? nextAvailable : null);

      // Check victory first
      if (nextScore >= levelConfig.targetScore) {
        let stars = 1;
        if (elapsedSeconds <= levelConfig.parTimeSeconds && nextMoves <= levelConfig.parMoves + 6) {
          stars = 3;
        } else if (elapsedSeconds <= Math.round(levelConfig.parTimeSeconds * 1.45)) {
          stars = 2;
        }
        audioEngine.playWin();
        onWin(
          nextScore,
          stars,
          nextMoves,
          `Reached ${nextScore.toLocaleString()} points on the ${size}×${size} block board.`
        );
        return;
      }

      // Check if any remaining piece in tray fits anywhere
      const remaining = nextTray.filter((p): p is TrayPiece => p !== null);
      const anyFits = remaining.some((p) => canShapeFitAnywhere(nextGrid, p.shape));
      if (!anyFits) {
        audioEngine.playGameOver();
        onGameOver();
      }
    },
    [
      elapsedSeconds,
      grid,
      levelConfig.parMoves,
      levelConfig.parTimeSeconds,
      levelConfig.targetScore,
      moves,
      onGameOver,
      onMovesChange,
      onScoreChange,
      onWin,
      playState,
      score,
      size,
      tier,
      tray,
    ]
  );

  // Global pointer move & up listeners when dragging a tray piece
  useEffect(() => {
    if (draggingIdx === null) return;
    const piece = tray[draggingIdx];
    if (!piece) return;

    const handlePointerMove = (e: PointerEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });
      const anchor = getAnchorFromPointer(
        e.clientX,
        e.clientY,
        piece,
        pointerTypeRef.current === 'touch'
      );
      setHoverCell(anchor);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const anchor = getAnchorFromPointer(
        e.clientX,
        e.clientY,
        piece,
        pointerTypeRef.current === 'touch'
      );
      if (anchor) {
        placePieceAt(draggingIdx, anchor[0], anchor[1]);
      }
      setDraggingIdx(null);
      setDragPos(null);
      setHoverCell(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [draggingIdx, getAnchorFromPointer, placePieceAt, tray]);

  // Compute ghost preview cells and prospective line clears
  const previewValid =
    activePiece && hoverCell
      ? canPlaceAt(grid, activePiece.shape, hoverCell[0], hoverCell[1])
      : false;

  const previewSet = new Set<string>();
  const clearRowSet = new Set<number>();
  const clearColSet = new Set<number>();

  if (activePiece && hoverCell) {
    for (const [dr, dc] of activePiece.shape.cells) {
      const r = hoverCell[0] + dr;
      const c = hoverCell[1] + dc;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        previewSet.add(`${r}-${c}`);
      }
    }
    if (previewValid) {
      for (let r = 0; r < size; r++) {
        let filled = true;
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === null && !previewSet.has(`${r}-${c}`)) {
            filled = false;
            break;
          }
        }
        if (filled) clearRowSet.add(r);
      }
      for (let c = 0; c < size; c++) {
        let filled = true;
        for (let r = 0; r < size; r++) {
          if (grid[r][c] === null && !previewSet.has(`${r}-${c}`)) {
            filled = false;
            break;
          }
        }
        if (filled) clearColSet.add(c);
      }
    }
  }

  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-4 select-none">
      {/* Status Line */}
      <div className="w-full flex items-center justify-between text-xs sm:text-sm text-slate-600 px-1 min-h-[24px]">
        <span>
          Target Score:{' '}
          <strong className="font-mono-num text-slate-950">
            {levelConfig.targetScore.toLocaleString()}
          </strong>
        </span>
        {lastClearBanner ? (
          <span className="font-display font-bold text-orange-600 animate-pop-in">
            {lastClearBanner}
          </span>
        ) : (
          <span className="text-slate-500">Drag a shape or tap to place</span>
        )}
      </div>

      {/* Block Grid */}
      <div
        ref={boardRef}
        onMouseLeave={() => draggingIdx === null && setHoverCell(null)}
        className="w-full max-w-[420px] aspect-square bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-700 shadow-md grid gap-1 touch-none"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.map((row, rIdx) =>
          row.map((cellColor, cIdx) => {
            const key = `${rIdx}-${cIdx}`;
            const isPreview = previewSet.has(key);
            const willClear = clearRowSet.has(rIdx) || clearColSet.has(cIdx);

            let cellClass = 'bg-slate-800 border-slate-700/70';
            if (cellColor) {
              cellClass = willClear ? 'bg-amber-300 border-amber-200 scale-95' : cellColor;
            } else if (isPreview) {
              cellClass = previewValid
                ? `${activePiece?.shape.previewClass ?? 'bg-emerald-400/50'} border-white/60`
                : 'bg-rose-500/40 border-rose-400/70';
            }

            return (
              <button
                key={key}
                type="button"
                aria-label={`Grid cell row ${rIdx + 1} column ${cIdx + 1}`}
                onMouseEnter={() => {
                  if (draggingIdx === null && activePiece) {
                    setHoverCell([rIdx, cIdx]);
                  }
                }}
                onClick={() => {
                  if (selectedIdx !== null && tray[selectedIdx]) {
                    placePieceAt(selectedIdx, rIdx, cIdx);
                  }
                }}
                className={`rounded-md border transition-colors duration-75 cursor-pointer ${cellClass}`}
              />
            );
          })
        )}
      </div>

      {/* 3-Piece Tray */}
      <div className="w-full max-w-[420px] grid grid-cols-3 gap-2.5 sm:gap-3">
        {tray.map((piece, idx) => {
          if (!piece) {
            return (
              <div
                key={`empty-slot-${idx}`}
                className="h-24 sm:h-28 rounded-2xl bg-slate-100 border border-dashed border-slate-300"
              />
            );
          }

          const dims = getShapeDimensions(piece.shape);
          const isSelected = selectedIdx === idx;
          const fits = canShapeFitAnywhere(grid, piece.shape);

          return (
            <div
              key={piece.uid}
              role="button"
              tabIndex={0}
              aria-label={`Block shape ${idx + 1}${!fits ? ' (no room)' : ''}`}
              onPointerDown={(e) => {
                if (playState !== 'PLAYING') return;
                pointerTypeRef.current = e.pointerType;
                setSelectedIdx(idx);
                setDraggingIdx(idx);
                setDragPos({ x: e.clientX, y: e.clientY });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedIdx(idx);
                }
              }}
              className={`h-24 sm:h-28 rounded-2xl border flex items-center justify-center p-2 transition-all touch-none cursor-grab active:cursor-grabbing ${
                !fits
                  ? 'bg-slate-100 border-slate-200 opacity-45'
                  : isSelected
                    ? 'bg-white border-blue-600 ring-2 ring-blue-600/25 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${dims.cols}, 14px)`,
                  gridTemplateRows: `repeat(${dims.rows}, 14px)`,
                }}
              >
                {Array.from({ length: dims.rows }).map((_, r) =>
                  Array.from({ length: dims.cols }).map((__, c) => {
                    const filled = piece.shape.cells.some(([cr, cc]) => cr === r && cc === c);
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`w-3.5 h-3.5 rounded-[3px] ${
                          filled ? `${piece.shape.colorClass} border` : 'bg-transparent'
                        }`}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Drag Ghost */}
      {draggingIdx !== null && dragPos && tray[draggingIdx] && (
        <div
          aria-hidden="true"
          className="fixed z-50 pointer-events-none"
          style={{
            left: dragPos.x,
            top: dragPos.y + (pointerTypeRef.current === 'touch' ? -48 : 0),
            transform: 'translate(-50%, -50%)',
          }}
        >
          {(() => {
            const shape = tray[draggingIdx]!.shape;
            const dims = getShapeDimensions(shape);
            return (
              <div
                className="grid gap-1 opacity-90 drop-shadow-md"
                style={{
                  gridTemplateColumns: `repeat(${dims.cols}, 26px)`,
                  gridTemplateRows: `repeat(${dims.rows}, 26px)`,
                }}
              >
                {Array.from({ length: dims.rows }).map((_, r) =>
                  Array.from({ length: dims.cols }).map((__, c) => {
                    const filled = shape.cells.some(([cr, cc]) => cr === r && cc === c);
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`w-[26px] h-[26px] rounded-md ${
                          filled ? `${shape.colorClass} border` : 'bg-transparent'
                        }`}
                      />
                    );
                  })
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
