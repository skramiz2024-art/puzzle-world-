import React, { useEffect, useState } from 'react';
import {
  Home,
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  HelpCircle,
  Music,
  Volume2,
  VolumeX,
  Star,
  ArrowRight,
  X,
  Trophy,
} from 'lucide-react';
import { GAME_METADATA } from '../data/levels';
import type { AudioSettings, GameOutcome, LevelConfig, PlayState } from '../types/game';

interface GameShellProps {
  levelConfig: LevelConfig;
  score: number;
  movesUsed: number;
  movesLeft?: number;
  targetScore?: number;
  playState: PlayState;
  outcome: GameOutcome | null;
  audioSettings: AudioSettings;
  onPauseToggle: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onBackToLevels: () => void;
  onBackHome: () => void;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  onTimeTick?: (seconds: number) => void;
  elapsedSeconds: number;
  setElapsedSeconds: React.Dispatch<React.SetStateAction<number>>;
  children: React.ReactNode;
}

export function formatTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const GameShell: React.FC<GameShellProps> = ({
  levelConfig,
  score,
  movesUsed,
  movesLeft,
  targetScore,
  playState,
  outcome,
  audioSettings,
  onPauseToggle,
  onRestart,
  onNextLevel,
  onBackToLevels,
  onBackHome,
  onToggleMusic,
  onToggleSfx,
  elapsedSeconds,
  setElapsedSeconds,
  children,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const meta = GAME_METADATA[levelConfig.gameType];

  useEffect(() => {
    if (playState !== 'PLAYING' || showHelp) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [playState, showHelp, setElapsedSeconds]);

  const progressPct =
    targetScore && targetScore > 0 ? Math.min(100, Math.round((score / targetScore) * 100)) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7FB]">
      {/* Compact Top Gameplay HUD */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onBackHome}
              title="Home"
              aria-label="Home"
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 cursor-pointer transition-colors"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onBackToLevels}
              title="Levels"
              aria-label="Back to Levels"
              className="h-10 px-2.5 sm:px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Levels</span>
            </button>
          </div>

          {/* Center Level Identity */}
          <div className="min-w-0 text-center">
            <div className="font-display font-bold text-sm sm:text-base text-slate-950 truncate">
              Level {levelConfig.level} · {meta.shortName}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 truncate">
              {levelConfig.title} · {levelConfig.difficultyLabel}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              title="How to Play"
              aria-label="Instructions"
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 cursor-pointer transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onRestart}
              title="Restart Level"
              aria-label="Restart Level"
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onPauseToggle}
              title={playState === 'PAUSED' ? 'Resume' : 'Pause'}
              aria-label={playState === 'PAUSED' ? 'Resume Game' : 'Pause Game'}
              disabled={playState === 'VICTORY' || playState === 'GAME_OVER'}
              className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center text-white cursor-pointer transition-colors"
            >
              {playState === 'PAUSED' ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Active Game Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col items-center gap-4">
        {/* Metrics Bar */}
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs space-y-2.5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Score</div>
              <div className="font-mono-num text-base sm:text-lg font-bold text-slate-950">
                {score.toLocaleString()}
                {targetScore ? (
                  <span className="text-xs font-normal text-slate-400"> / {targetScore}</span>
                ) : null}
              </div>
            </div>

            <div className="border-x border-slate-100">
              <div className="text-[11px] font-medium text-slate-500">
                {movesLeft !== undefined ? 'Moves Left' : 'Moves'}
              </div>
              <div
                className={`font-mono-num text-base sm:text-lg font-bold ${
                  movesLeft !== undefined && movesLeft <= 4 ? 'text-rose-600' : 'text-slate-950'
                }`}
              >
                {movesLeft !== undefined ? movesLeft : movesUsed}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-500">Time</div>
              <div className="font-mono-num text-base sm:text-lg font-bold text-slate-950">
                {formatTimer(elapsedSeconds)}
              </div>
            </div>
          </div>

          {progressPct !== null && (
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden" aria-label={`Target progress ${progressPct}%`}>
              <div
                className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>

        {/* Game Board Stage */}
        <div className="relative w-full flex flex-col items-center justify-center">
          <div
            className={`w-full flex flex-col items-center transition-opacity duration-150 ${
              playState === 'PAUSED' ? 'opacity-10 pointer-events-none select-none' : 'opacity-100'
            }`}
          >
            {children}
          </div>

          {/* Pause Overlay */}
          {playState === 'PAUSED' && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Game Paused"
              className="absolute inset-0 z-20 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-lg text-center space-y-5 animate-pop-in">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-950">Game Paused</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Level {levelConfig.level} · {meta.name}
                  </p>
                </div>

                {/* Quick Audio Toggles inside Pause Menu */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onToggleMusic}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer ${
                      audioSettings.musicEnabled
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <Music className="w-4 h-4" />
                    <span>Music: {audioSettings.musicEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onToggleSfx}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer ${
                      audioSettings.sfxEnabled
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    {audioSettings.sfxEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                    <span>SFX: {audioSettings.sfxEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={onPauseToggle}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume</span>
                  </button>
                  <button
                    type="button"
                    onClick={onRestart}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restart Level</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onBackToLevels}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm cursor-pointer"
                    >
                      Levels
                    </button>
                    <button
                      type="button"
                      onClick={onBackHome}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm cursor-pointer"
                    >
                      Home
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Victory Modal */}
          {playState === 'VICTORY' && outcome && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Level Completed"
              className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xl text-center space-y-5 animate-pop-in">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Trophy className="w-7 h-7" />
                </div>

                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950">
                    Level {levelConfig.level} Cleared!
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">{outcome.summaryText}</p>
                </div>

                {/* Star Rewards */}
                <div className="flex items-center justify-center gap-3 py-1" aria-label={`Earned ${outcome.stars} out of 3 stars`}>
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-10 h-10 transition-transform ${
                        s <= outcome.stars
                          ? 'fill-amber-400 text-amber-500 scale-105'
                          : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div>
                    <div className="text-[11px] text-slate-500">Score</div>
                    <div className="font-mono-num font-bold text-slate-950">
                      {outcome.score.toLocaleString()}
                    </div>
                  </div>
                  <div className="border-x border-slate-200">
                    <div className="text-[11px] text-slate-500">Time</div>
                    <div className="font-mono-num font-bold text-slate-950">
                      {formatTimer(outcome.elapsedSeconds)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Moves</div>
                    <div className="font-mono-num font-bold text-slate-950">
                      {outcome.movesUsed}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {levelConfig.level < 100 ? (
                    <button
                      type="button"
                      onClick={onNextLevel}
                      className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span>Next Level ({levelConfig.level + 1})</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="py-2 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold">
                      Congratulations! You completed all 100 levels of Puzzle World!
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={onRestart}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm cursor-pointer"
                    >
                      Replay
                    </button>
                    <button
                      type="button"
                      onClick={onBackToLevels}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm cursor-pointer"
                    >
                      Levels
                    </button>
                    <button
                      type="button"
                      onClick={onBackHome}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm cursor-pointer"
                    >
                      Home
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Modal */}
          {playState === 'GAME_OVER' && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Out of Moves"
              className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-center space-y-5 animate-pop-in">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-950">Out of Moves</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    You scored{' '}
                    <strong className="font-mono-num text-slate-900">{score.toLocaleString()}</strong>
                    {targetScore ? (
                      <>
                        {' '}
                        of <strong className="font-mono-num text-slate-900">{targetScore.toLocaleString()}</strong>{' '}
                        needed.
                      </>
                    ) : (
                      '.'
                    )}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={onRestart}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onBackToLevels}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm cursor-pointer"
                    >
                      Levels
                    </button>
                    <button
                      type="button"
                      onClick={onBackHome}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm cursor-pointer"
                    >
                      Home
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Instructions Modal */}
      {showHelp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${meta.name} Instructions`}
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4 animate-pop-in">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-bold text-slate-950">
                How to Play: {meta.name}
              </h2>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="Close instructions"
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-700 list-disc pl-5">
              {meta.instructions.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm cursor-pointer"
            >
              Got it, continue playing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
