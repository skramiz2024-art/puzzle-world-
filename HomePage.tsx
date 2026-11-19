import React, { useState } from 'react';
import {
  Grid3X3,
  Blocks,
  Image as ImageIcon,
  Gem,
  Play,
  LayoutGrid,
  Settings as SettingsIcon,
  Star,
  Trophy,
  Unlock,
  CheckCircle2,
  Volume2,
  VolumeX,
  Music,
} from 'lucide-react';
import { ALL_LEVELS, GAME_METADATA, HERO_IMAGE_SRC } from '../data/levels';
import type { GameType, PlayerSaveData, ScreenRoute } from '../types/game';
import { countCompletedLevels, countTotalStars } from '../utils/storage';
import { Logo } from './Logo';

interface HomePageProps {
  saveData: PlayerSaveData;
  onPlayLevel: (level: number) => void;
  onNavigate: (route: ScreenRoute, filterGame?: GameType) => void;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
}

const GAME_ICONS: Record<GameType, React.ReactNode> = {
  number: <Grid3X3 className="w-6 h-6 text-emerald-700" />,
  block: <Blocks className="w-6 h-6 text-orange-600" />,
  picture: <ImageIcon className="w-6 h-6 text-violet-700" />,
  match3: <Gem className="w-6 h-6 text-rose-600" />,
};

export const HomePage: React.FC<HomePageProps> = ({
  saveData,
  onPlayLevel,
  onNavigate,
  onToggleMusic,
  onToggleSfx,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const totalStars = countTotalStars(saveData);
  const completedCount = countCompletedLevels(saveData);

  const getNextLevelForGame = (gameType: GameType): number => {
    // Prefer the highest unlocked level of that gameType that isn't completed yet,
    // or fallback to the highest unlocked level of that gameType.
    const unlockedForGame = ALL_LEVELS.filter(
      (lvl) => lvl.gameType === gameType && lvl.level <= saveData.highestUnlockedLevel
    );
    const uncompleted = unlockedForGame.find((lvl) => !saveData.levelStats[lvl.level]?.completed);
    if (uncompleted) return uncompleted.level;
    return unlockedForGame[unlockedForGame.length - 1]?.level ?? 1;
  };

  const getGameProgressSummary = (gameType: GameType) => {
    const levelsOfType = ALL_LEVELS.filter((l) => l.gameType === gameType);
    const done = levelsOfType.filter((l) => saveData.levelStats[l.level]?.completed).length;
    const unlocked = levelsOfType.filter((l) => l.level <= saveData.highestUnlockedLevel).length;
    return { total: levelsOfType.length, done, unlocked };
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      {/* Hero Section: Balanced 2-Column Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 sm:p-9 shadow-xs">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Logo size={42} />
              <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
                <span>100 Progressive Levels</span>
                <span aria-hidden="true">·</span>
                <span>Instant Browser Play</span>
              </div>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-950 text-balance leading-[1.08]">
              Puzzle World
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Master four classic puzzle genres across 100 handcrafted levels. Slide numbered
              tiles, fit geometric blocks, restore illustrated scenes, and trigger cascading
              gem matches—all saved automatically in your browser.
            </p>
          </div>

          <div className="pt-8 space-y-5">
            {/* Primary Action Cluster */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onPlayLevel(saveData.highestUnlockedLevel)}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 min-h-[48px]"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Play Now</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('levels')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-base font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[48px]"
              >
                <LayoutGrid className="w-5 h-5 text-slate-700" />
                <span>Levels</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-base font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[48px]"
              >
                <SettingsIcon className="w-5 h-5 text-slate-600" />
                <span>Settings</span>
              </button>
            </div>

            {/* Quick Audio Controls on Home */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <span>
                Next up: <strong className="text-slate-900">Level {saveData.highestUnlockedLevel}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleMusic}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] ${
                    saveData.settings.musicEnabled
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Music: {saveData.settings.musicEnabled ? 'ON' : 'OFF'}</span>
                </button>
                <button
                  type="button"
                  onClick={onToggleSfx}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] ${
                    saveData.settings.sfxEnabled
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {saveData.settings.sfxEnabled ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                  <span>SFX: {saveData.settings.sfxEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hero Artwork */}
        <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[260px] lg:min-h-[380px] shadow-xs">
          {!heroImgFailed ? (
            <img
              src={HERO_IMAGE_SRC}
              alt="Handcrafted wooden blocks, numbered maple tiles, crystal gems, and jigsaw pieces on a sunlit tabletop"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 p-8 text-white text-center">
              <Logo size={64} />
              <p className="mt-4 font-display text-2xl font-bold">Four Classic Puzzle Studios</p>
              <p className="mt-1 text-sm text-blue-100">Numbers · Blocks · Picture · Match-3</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent p-5 sm:p-6">
            <p className="text-white font-display text-lg font-semibold">
              No downloads, no sign-ups required
            </p>
            <p className="text-slate-200 text-sm">
              Pick up anytime on phone, tablet, or desktop with automatic progress saving.
            </p>
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column Player Progress Strip */}
      <section aria-label="Player Progress Summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Unlocked Levels</p>
            <p className="mt-1 font-mono-num text-2xl font-bold text-slate-950">
              {saveData.highestUnlockedLevel} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Unlock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Completed</p>
            <p className="mt-1 font-mono-num text-2xl font-bold text-slate-950">
              {completedCount} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Stars Earned</p>
            <p className="mt-1 font-mono-num text-2xl font-bold text-slate-950">
              {totalStars} <span className="text-sm font-normal text-slate-400">/ 300</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Score</p>
            <p className="mt-1 font-mono-num text-2xl font-bold text-slate-950">
              {saveData.totalScore.toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
            <Trophy className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* Four Playable Puzzle Genres */}
      <section id="puzzle-genres-section" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Four Playable Puzzle Games
            </h2>
            <p className="mt-1 text-sm sm:text-base text-slate-600">
              Jump directly into your favorite mode or progress sequentially through all 100 levels.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('levels')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            Browse all 100 levels →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(['number', 'block', 'picture', 'match3'] as GameType[]).map((type) => {
            const meta = GAME_METADATA[type];
            const summary = getGameProgressSummary(type);
            const nextLevel = getNextLevelForGame(type);

            return (
              <div
                key={type}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5 hover:border-slate-300 transition-colors shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`w-12 h-12 rounded-xl ${meta.surfaceBg} border ${meta.borderColor} flex items-center justify-center shrink-0`}>
                      {GAME_ICONS[type]}
                    </div>
                    <div className="text-xs font-medium text-slate-500 font-mono-num">
                      {summary.done}/{summary.total} cleared · {summary.unlocked} unlocked
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-950">{meta.name}</h3>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">{meta.tagline}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('levels', type)}
                    className="text-sm font-semibold text-slate-700 hover:text-slate-950 cursor-pointer whitespace-nowrap py-2"
                  >
                    View levels
                  </button>
                  <button
                    type="button"
                    onClick={() => onPlayLevel(nextLevel)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[42px]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play Level {nextLevel}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};
