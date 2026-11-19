import React, { useState } from 'react';
import {
  ArrowLeft,
  Music,
  Volume2,
  VolumeX,
  Trash2,
  HelpCircle,
  Check,
} from 'lucide-react';
import { GAME_METADATA } from '../data/levels';
import type { GameType, PlayerSaveData } from '../types/game';
import { countCompletedLevels, countTotalStars } from '../utils/storage';
import { audioEngine } from '../utils/audio';

interface SettingsViewProps {
  saveData: PlayerSaveData;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  onResetProgress: () => void;
  onBackHome: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  saveData,
  onToggleMusic,
  onToggleSfx,
  onResetProgress,
  onBackHome,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDoneMsg, setResetDoneMsg] = useState(false);

  const handleConfirmReset = () => {
    onResetProgress();
    setConfirmReset(false);
    setResetDoneMsg(true);
    window.setTimeout(() => setResetDoneMsg(false), 3000);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
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
          Settings &amp; Guide
        </h1>
        <p className="text-sm text-slate-600">
          Manage audio controls, review game instructions, or reset your saved browser progress.
        </p>
      </div>

      {/* Audio Controls */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
        <h2 className="font-display text-xl font-bold text-slate-950">Audio Controls</h2>

        <div className="divide-y divide-slate-100">
          <div className="py-4 first:pt-0 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-950">Background Music</h3>
                <p className="text-sm text-slate-600">
                  Gentle ambient marimba soundtrack while browsing and solving puzzles.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={saveData.settings.musicEnabled}
              onClick={onToggleMusic}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[42px] min-w-[84px] ${
                saveData.settings.musicEnabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {saveData.settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="py-4 last:pb-0 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                {saveData.settings.sfxEnabled ? (
                  <Volume2 className="w-5 h-5 text-blue-700" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-950">Sound Effects</h3>
                <p className="text-sm text-slate-600">
                  Tactile feedback for tile slides, block placements, gem matches, and level wins.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => audioEngine.playMatch(2)}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap min-h-[42px]"
              >
                Test SFX
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={saveData.settings.sfxEnabled}
                onClick={onToggleSfx}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[42px] min-w-[84px] ${
                  saveData.settings.sfxEnabled
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {saveData.settings.sfxEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Saved Progress */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-950">Browser Save Data</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Currently unlocked up to Level {saveData.highestUnlockedLevel} ·{' '}
              {countCompletedLevels(saveData)} levels cleared · {countTotalStars(saveData)} stars earned.
            </p>
          </div>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 cursor-pointer whitespace-nowrap min-h-[42px]"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Progress</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer whitespace-nowrap min-h-[42px]"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer whitespace-nowrap min-h-[42px]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {resetDoneMsg && (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
            <Check className="w-4 h-4" />
            <span>Progress reset to Level 1. Your audio preferences were kept.</span>
          </div>
        )}
      </section>

      {/* Instructions Guide */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h2 className="font-display text-xl font-bold text-slate-950">How to Play Each Mode</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(['number', 'block', 'picture', 'match3'] as GameType[]).map((type) => {
            const meta = GAME_METADATA[type];
            return (
              <div key={type} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                <h3 className={`font-display font-bold text-base ${meta.textAccent}`}>
                  {meta.name}
                </h3>
                <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-4">
                  {meta.instructions.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};
