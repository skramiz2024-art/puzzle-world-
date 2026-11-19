import { useCallback, useEffect, useState } from 'react';
import { getLevelConfig } from './data/levels';
import type { GameOutcome, GameType, PlayerSaveData, PlayState, ScreenRoute } from './types/game';
import { audioEngine } from './utils/audio';
import {
  clearPlayerProgress,
  loadPlayerSave,
  recordLevelVictory,
  updateAudioSettings,
} from './utils/storage';
import { TopNav } from './components/TopNav';
import { HomePage } from './components/HomePage';
import { LevelsPage } from './components/LevelsPage';
import { SettingsView } from './components/SettingsView';
import { GameShell } from './components/GameShell';
import { NumberPuzzleGame } from './components/games/NumberPuzzleGame';
import { BlockPuzzleGame } from './components/games/BlockPuzzleGame';
import { PicturePuzzleGame } from './components/games/PicturePuzzleGame';
import { Match3PuzzleGame } from './components/games/Match3PuzzleGame';

export default function App() {
  const [saveData, setSaveData] = useState<PlayerSaveData>(() => loadPlayerSave());
  const [route, setRoute] = useState<ScreenRoute>('home');
  const [levelsFilter, setLevelsFilter] = useState<GameType | 'all'>('all');
  const [activeLevel, setActiveLevel] = useState<number>(() => loadPlayerSave().highestUnlockedLevel);

  // Active game session state
  const [playState, setPlayState] = useState<PlayState>('PLAYING');
  const [score, setScore] = useState(0);
  const [movesUsed, setMovesUsed] = useState(0);
  const [movesLeft, setMovesLeft] = useState<number | undefined>(undefined);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);
  const [restartCounter, setRestartCounter] = useState(0);

  // Sync audio settings with Web Audio engine
  useEffect(() => {
    audioEngine.syncSettings(saveData.settings.musicEnabled, saveData.settings.sfxEnabled);
  }, [saveData.settings.musicEnabled, saveData.settings.sfxEnabled]);

  // Unlock browser Web Audio on first user interaction
  useEffect(() => {
    const unlock = () => {
      audioEngine.unlockFromGesture();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const resetSessionState = useCallback((targetLevel: number) => {
    const cfg = getLevelConfig(targetLevel);
    setScore(0);
    setMovesUsed(0);
    setMovesLeft(cfg.moveLimit);
    setElapsedSeconds(0);
    setOutcome(null);
    setPlayState('PLAYING');
    setRestartCounter((c) => c + 1);
  }, []);

  const startLevel = useCallback(
    (level: number) => {
      audioEngine.playClick();
      const safeLevel = Math.max(1, Math.min(saveData.highestUnlockedLevel, level));
      setActiveLevel(safeLevel);
      resetSessionState(safeLevel);
      setRoute('play');
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    },
    [resetSessionState, saveData.highestUnlockedLevel]
  );

  const handleNavigate = useCallback(
    (nextRoute: ScreenRoute, filterGame?: GameType) => {
      audioEngine.playClick();
      if (filterGame) {
        setLevelsFilter(filterGame);
      } else if (nextRoute === 'levels') {
        setLevelsFilter('all');
      }
      setRoute(nextRoute);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    },
    []
  );

  const handleScrollToGames = useCallback(() => {
    audioEngine.playClick();
    if (route !== 'home') {
      setRoute('home');
      window.setTimeout(() => {
        document.getElementById('puzzle-genres-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      document.getElementById('puzzle-genres-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [route]);

  const handleToggleMusic = useCallback(() => {
    setSaveData((prev) => {
      const next = updateAudioSettings(prev, { musicEnabled: !prev.settings.musicEnabled });
      audioEngine.syncSettings(next.settings.musicEnabled, next.settings.sfxEnabled);
      return next;
    });
    audioEngine.playClick();
  }, []);

  const handleToggleSfx = useCallback(() => {
    setSaveData((prev) => {
      const next = updateAudioSettings(prev, { sfxEnabled: !prev.settings.sfxEnabled });
      audioEngine.syncSettings(next.settings.musicEnabled, next.settings.sfxEnabled);
      if (next.settings.sfxEnabled) {
        audioEngine.playClick();
      }
      return next;
    });
  }, []);

  const handleResetProgress = useCallback(() => {
    const fresh = clearPlayerProgress(true);
    setSaveData(fresh);
    setActiveLevel(1);
    audioEngine.playClick();
  }, []);

  const handleWin = useCallback(
    (finalScore: number, stars: number, totalMoves: number, summaryText: string) => {
      setPlayState('VICTORY');
      setOutcome({
        score: finalScore,
        stars,
        movesUsed: totalMoves,
        elapsedSeconds,
        summaryText,
      });
      setSaveData((prev) =>
        recordLevelVictory(prev, activeLevel, finalScore, stars, elapsedSeconds)
      );
    },
    [activeLevel, elapsedSeconds]
  );

  const handleGameOver = useCallback(() => {
    setPlayState('GAME_OVER');
  }, []);

  const handleRestartLevel = useCallback(() => {
    audioEngine.playClick();
    resetSessionState(activeLevel);
  }, [activeLevel, resetSessionState]);

  const handleNextLevel = useCallback(() => {
    const next = Math.min(100, activeLevel + 1);
    audioEngine.playClick();
    setActiveLevel(next);
    resetSessionState(next);
  }, [activeLevel, resetSessionState]);

  const handlePauseToggle = useCallback(() => {
    audioEngine.playClick();
    setPlayState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
  }, []);

  const currentLevelConfig = getLevelConfig(activeLevel);
  const gameInstanceKey = `${activeLevel}-${restartCounter}`;

  if (route === 'play') {
    const targetForBar =
      currentLevelConfig.gameType === 'block' || currentLevelConfig.gameType === 'match3'
        ? currentLevelConfig.targetScore
        : undefined;

    return (
      <GameShell
        levelConfig={currentLevelConfig}
        score={score}
        movesUsed={movesUsed}
        movesLeft={movesLeft}
        targetScore={targetForBar}
        playState={playState}
        outcome={outcome}
        audioSettings={saveData.settings}
        onPauseToggle={handlePauseToggle}
        onRestart={handleRestartLevel}
        onNextLevel={handleNextLevel}
        onBackToLevels={() => handleNavigate('levels')}
        onBackHome={() => handleNavigate('home')}
        onToggleMusic={handleToggleMusic}
        onToggleSfx={handleToggleSfx}
        elapsedSeconds={elapsedSeconds}
        setElapsedSeconds={setElapsedSeconds}
      >
        {currentLevelConfig.gameType === 'number' && (
          <NumberPuzzleGame
            key={gameInstanceKey}
            levelConfig={currentLevelConfig}
            playState={playState}
            elapsedSeconds={elapsedSeconds}
            onScoreChange={setScore}
            onMovesChange={setMovesUsed}
            onWin={handleWin}
          />
        )}

        {currentLevelConfig.gameType === 'block' && (
          <BlockPuzzleGame
            key={gameInstanceKey}
            levelConfig={currentLevelConfig}
            playState={playState}
            elapsedSeconds={elapsedSeconds}
            onScoreChange={setScore}
            onMovesChange={setMovesUsed}
            onWin={handleWin}
            onGameOver={handleGameOver}
          />
        )}

        {currentLevelConfig.gameType === 'picture' && (
          <PicturePuzzleGame
            key={gameInstanceKey}
            levelConfig={currentLevelConfig}
            playState={playState}
            elapsedSeconds={elapsedSeconds}
            onScoreChange={setScore}
            onMovesChange={setMovesUsed}
            onWin={handleWin}
          />
        )}

        {currentLevelConfig.gameType === 'match3' && (
          <Match3PuzzleGame
            key={gameInstanceKey}
            levelConfig={currentLevelConfig}
            playState={playState}
            elapsedSeconds={elapsedSeconds}
            onScoreChange={setScore}
            onMovesChange={setMovesUsed}
            onMovesLeftChange={setMovesLeft}
            onWin={handleWin}
            onGameOver={handleGameOver}
          />
        )}
      </GameShell>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7FB]">
      <TopNav
        currentRoute={route}
        highestUnlockedLevel={saveData.highestUnlockedLevel}
        onNavigate={(r) => handleNavigate(r)}
        onPlayNow={() => startLevel(saveData.highestUnlockedLevel)}
        onScrollToGames={handleScrollToGames}
      />

      <div className="flex-1">
        {route === 'home' && (
          <HomePage
            saveData={saveData}
            onPlayLevel={startLevel}
            onNavigate={handleNavigate}
            onToggleMusic={handleToggleMusic}
            onToggleSfx={handleToggleSfx}
          />
        )}

        {route === 'levels' && (
          <LevelsPage
            saveData={saveData}
            activeFilter={levelsFilter}
            onFilterChange={setLevelsFilter}
            onPlayLevel={startLevel}
            onBackHome={() => handleNavigate('home')}
          />
        )}

        {route === 'settings' && (
          <SettingsView
            saveData={saveData}
            onToggleMusic={handleToggleMusic}
            onToggleSfx={handleToggleSfx}
            onResetProgress={handleResetProgress}
            onBackHome={() => handleNavigate('home')}
          />
        )}
      </div>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500">
          <div className="font-medium text-slate-700">
            Puzzle World · 100 Progressive Browser Puzzles
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => handleNavigate('home')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('levels')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Levels
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('settings')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
