import React from 'react';
import {
  Grid3X3,
  Blocks,
  Image as ImageIcon,
  Gem,
  Lock,
  Star,
  Play,
  ArrowLeft,
} from 'lucide-react';
import { ALL_LEVELS, GAME_METADATA, WORLD_CHAPTERS } from '../data/levels';
import type { GameType, PlayerSaveData } from '../types/game';
import { countCompletedLevels, countTotalStars } from '../utils/storage';

interface LevelsPageProps {
  saveData: PlayerSaveData;
  activeFilter: GameType | 'all';
  onFilterChange: (filter: GameType | 'all') => void;
  onPlayLevel: (level: number) => void;
  onBackHome: () => void;
}

const MINI_ICONS: Record<GameType, React.ReactNode> = {
  number: <Grid3X3 className="w-4 h-4 text-emerald-700" />,
  block: <Blocks className="w-4 h-4 text-orange-600" />,
  picture: <ImageIcon className="w-4 h-4 text-violet-700" />,
  match3: <Gem className="w-4 h-4 text-rose-600" />,
};

export const LevelsPage: React.FC<LevelsPageProps> = ({
  saveData,
  activeFilter,
  onFilterChange,
  onPlayLevel,
  onBackHome,
}) => {
  const totalStars = countTotalStars(saveData);
  const completedLevels = countCompletedLevels(saveData);

  const filterOptions: Array<{ id: GameType | 'all'; label: string }> = [
    { id: 'all', label: 'All 100 Levels' },
    { id: 'number', label: 'Number' },
    { id: 'block', label: 'Block' },
    { id: 'picture', label: 'Picture' },
    { id: 'match3', label: 'Match-3' },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header & Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-950 cursor-pointer mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
            Level Select
          </h1>
          <p className="text-sm text-slate-600">
            Complete each level to unlock the next challenge. Replay any unlocked level to earn 3 stars.
          </p>
        </div>

        <div className="flex items-center gap-6 bg-white border border-slate-200 rounded-xl px-5 py-3.5 shrink-0">
          <div>
            <div className="text-xs text-slate-500">Unlocked</div>
            <div className="font-mono-num text-lg font-bold text-slate-950">
              {saveData.highestUnlockedLevel}/100
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-xs text-slate-500">Completed</div>
            <div className="font-mono-num text-lg font-bold text-emerald-700">
              {completedLevels}/100
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-xs text-slate-500">Stars</div>
            <div className="font-mono-num text-lg font-bold text-amber-600 flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{totalStars}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-200/70 p-1.5 rounded-xl w-fit">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onFilterChange(opt.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              activeFilter === opt.id
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* World Chapters */}
      <div className="space-y-10">
        {WORLD_CHAPTERS.map((chapter) => {
          const chapterLevels = ALL_LEVELS.filter(
            (lvl) =>
              lvl.worldId === chapter.id &&
              (activeFilter === 'all' || lvl.gameType === activeFilter)
          );

          if (chapterLevels.length === 0) return null;

          const chapterCompleted = chapterLevels.filter(
            (lvl) => saveData.levelStats[lvl.level]?.completed
          ).length;

          return (
            <section key={chapter.id} className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-950">
                    World {chapter.id}: {chapter.name}
                  </h2>
                  <p className="text-sm text-slate-600">
                    Levels {chapter.startLevel}–{chapter.endLevel} · {chapter.subtitle}
                  </p>
                </div>
                <span className="text-xs font-mono-num font-semibold text-slate-600">
                  {chapterCompleted} / {chapterLevels.length} cleared
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {chapterLevels.map((lvl) => {
                  const isUnlocked = lvl.level <= saveData.highestUnlockedLevel;
                  const isCurrent = lvl.level === saveData.highestUnlockedLevel;
                  const stats = saveData.levelStats[lvl.level];
                  const earnedStars = stats?.stars ?? 0;
                  const meta = GAME_METADATA[lvl.gameType];

                  return (
                    <button
                      key={lvl.level}
                      type="button"
                      disabled={!isUnlocked}
                      onClick={() => isUnlocked && onPlayLevel(lvl.level)}
                      aria-label={
                        isUnlocked
                          ? `Play Level ${lvl.level}: ${meta.name}, ${earnedStars} of 3 stars`
                          : `Level ${lvl.level} locked`
                      }
                      className={`group relative text-left rounded-xl p-4 border transition-all flex flex-col justify-between min-h-[124px] ${
                        isCurrent
                          ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 hover:bg-blue-50 cursor-pointer shadow-xs'
                          : isUnlocked
                            ? 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-xs cursor-pointer'
                            : 'bg-slate-100/80 border-slate-200/80 opacity-75 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`font-mono-num text-xl font-bold ${
                            isCurrent
                              ? 'text-blue-700'
                              : isUnlocked
                                ? 'text-slate-950'
                                : 'text-slate-400'
                          }`}
                        >
                          {lvl.level}
                        </span>

                        {isUnlocked ? (
                          <div
                            className={`w-7 h-7 rounded-lg ${meta.surfaceBg} border ${meta.borderColor} flex items-center justify-center shrink-0`}
                          >
                            {MINI_ICONS[lvl.gameType]}
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-200/80 flex items-center justify-center shrink-0">
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        )}
                      </div>

                      <div className="mt-2 space-y-1.5">
                        <div className="text-xs font-medium text-slate-600 truncate">
                          {meta.shortName} · {lvl.gridSize}×{lvl.gridSize}
                        </div>

                        {isUnlocked ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-0.5" aria-hidden="true">
                              {[1, 2, 3].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-4 h-4 ${
                                    s <= earnedStars
                                      ? 'fill-amber-400 text-amber-500'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                                <Play className="w-3 h-3 fill-current" />
                                Play
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] font-medium text-slate-400">
                            Clear Level {lvl.level - 1}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
};
