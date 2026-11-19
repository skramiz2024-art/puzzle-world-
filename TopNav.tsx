import React from 'react';
import type { ScreenRoute } from '../types/game';
import { Logo } from './Logo';

interface TopNavProps {
  currentRoute: ScreenRoute;
  highestUnlockedLevel: number;
  onNavigate: (route: ScreenRoute) => void;
  onPlayNow: () => void;
  onScrollToGames: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentRoute,
  highestUnlockedLevel,
  onNavigate,
  onPlayNow,
  onScrollToGames,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line brand mark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Logo size={32} />
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            Puzzle World
          </span>
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
              currentRoute === 'home'
                ? 'text-slate-950 border-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-950'
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => onNavigate('levels')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
              currentRoute === 'levels'
                ? 'text-slate-950 border-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-950'
            }`}
          >
            Levels
          </button>
          <button
            type="button"
            onClick={onScrollToGames}
            className="py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 border-transparent hover:text-slate-950"
          >
            Games
          </button>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
              currentRoute === 'settings'
                ? 'text-slate-950 border-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-950'
            }`}
          >
            Settings
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onPlayNow}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all whitespace-nowrap shrink-0 shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Play Level {highestUnlockedLevel}
          </button>
        </div>
      </div>

      {/* Compact mobile secondary nav strip (within 15% mobile sticky cap) */}
      <nav
        aria-label="Mobile Navigation"
        className="flex md:hidden items-center justify-around border-t border-slate-100 bg-white px-2 h-11 text-xs font-medium text-slate-600"
      >
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
            currentRoute === 'home' ? 'text-blue-700 font-semibold bg-blue-50' : ''
          }`}
        >
          Home
        </button>
        <button
          type="button"
          onClick={() => onNavigate('levels')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
            currentRoute === 'levels' ? 'text-blue-700 font-semibold bg-blue-50' : ''
          }`}
        >
          Levels
        </button>
        <button
          type="button"
          onClick={onScrollToGames}
          className="px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0"
        >
          Games
        </button>
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
            currentRoute === 'settings' ? 'text-blue-700 font-semibold bg-blue-50' : ''
          }`}
        >
          Settings
        </button>
      </nav>
    </header>
  );
};
