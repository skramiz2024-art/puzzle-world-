// Synthesized Web Audio API engine for pleasant background music and tactile game SFX

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicEnabled = true;
  private sfxEnabled = true;
  private musicTimer: number | null = null;
  private stepIndex = 0;

  // Gentle pentatonic progression (C major / A minor warm marimba intervals)
  private readonly melodyNotes = [
    523.25, // C5
    659.25, // E5
    783.99, // G5
    659.25, // E5
    587.33, // D5
    698.46, // F5
    880.0,  // A5
    698.46, // F5
    493.88, // B4
    587.33, // D5
    783.99, // G5
    587.33, // D5
    440.0,  // A4
    523.25, // C5
    659.25, // E5
    523.25, // C5
  ];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockFromGesture(): void {
    const ctx = this.ensureContext();
    if (ctx && this.musicEnabled && this.musicTimer === null) {
      this.startMusicLoop();
    }
  }

  public syncSettings(musicEnabled: boolean, sfxEnabled: boolean): void {
    this.musicEnabled = musicEnabled;
    this.sfxEnabled = sfxEnabled;
    if (musicEnabled) {
      if (this.ctx && this.ctx.state === 'running' && this.musicTimer === null) {
        this.startMusicLoop();
      }
    } else {
      this.stopMusicLoop();
    }
  }

  private startMusicLoop(): void {
    if (this.musicTimer !== null) return;
    const playStep = () => {
      if (!this.musicEnabled) return;
      const ctx = this.ensureContext();
      if (!ctx || ctx.state !== 'running') return;

      const freq = this.melodyNotes[this.stepIndex % this.melodyNotes.length];
      const now = ctx.currentTime;

      // Soft warm marimba-like sine + triangle blend
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.028, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);

      // Gentle bass root every 4 steps
      if (this.stepIndex % 4 === 0) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(freq / 4, now);
        bassGain.gain.setValueAtTime(0.0001, now);
        bassGain.gain.exponentialRampToValueAtTime(0.022, now + 0.05);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 1.15);
      }

      this.stepIndex = (this.stepIndex + 1) % this.melodyNotes.length;
    };

    playStep();
    this.musicTimer = window.setInterval(playStep, 560);
  }

  private stopMusicLoop(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.09,
    delay = 0,
    endFreq?: number
  ): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick(): void {
    this.unlockFromGesture();
    this.playTone(540, 0.07, 'sine', 0.06, 0, 620);
  }

  public playSlide(): void {
    this.unlockFromGesture();
    this.playTone(340, 0.09, 'triangle', 0.08, 0, 480);
  }

  public playPlaceBlock(): void {
    this.unlockFromGesture();
    this.playTone(260, 0.09, 'triangle', 0.1, 0, 190);
    this.playTone(390, 0.07, 'sine', 0.06, 0.02);
  }

  public playLineClear(lines = 1): void {
    this.unlockFromGesture();
    const base = 523.25;
    const notes = Math.min(4, lines + 1);
    for (let i = 0; i < notes; i++) {
      this.playTone(base * Math.pow(1.12246, i * 2), 0.16, 'sine', 0.1, i * 0.055);
    }
  }

  public playSwap(): void {
    this.unlockFromGesture();
    this.playTone(440, 0.08, 'sine', 0.07, 0, 560);
  }

  public playMatch(combo = 1): void {
    this.unlockFromGesture();
    const pitchBoost = Math.min(6, combo - 1);
    const root = 440 * Math.pow(1.06, pitchBoost);
    this.playTone(root, 0.12, 'sine', 0.09, 0, root * 1.25);
    this.playTone(root * 1.5, 0.14, 'triangle', 0.07, 0.04);
  }

  public playInvalid(): void {
    this.unlockFromGesture();
    this.playTone(190, 0.14, 'sawtooth', 0.05, 0, 140);
  }

  public playWin(): void {
    this.unlockFromGesture();
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((f, idx) => {
      this.playTone(f, 0.28, 'triangle', 0.1, idx * 0.09);
    });
  }

  public playGameOver(): void {
    this.unlockFromGesture();
    const notes = [392.0, 349.23, 311.13, 261.63];
    notes.forEach((f, idx) => {
      this.playTone(f, 0.22, 'sine', 0.08, idx * 0.11);
    });
  }
}

export const audioEngine = new AudioEngine();
