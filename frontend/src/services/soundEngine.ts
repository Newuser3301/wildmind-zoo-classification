// 🎮 Ultimate Video Game Audio Engine (Web Audio API Synthesizer)
// Recreates authentic Arcade, Cyberpunk, RPG & Retro game sound effects
// 100% Zero external file dependencies - instant, ultra-responsive, zero latency

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.4;

  constructor() {
    // Initialized on first user click to satisfy browser autoplay policies
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * 🕹️ 1. Arcade Button Hover (8-Bit Cursor Blip)
   */
  public playHover() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.025);

    gain.gain.setValueAtTime(this.volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  }

  /**
   * 🔘 2. Arcade Menu Select / Button Press (Punchy Cyber Click)
   */
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

    gain.gain.setValueAtTime(this.volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * 🪙 3. Coin / Item Pickup Sound (Super Mario / Sonic Style)
   * Plays when an Animal Preset is selected
   */
  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Tone 1: B5 (987.77 Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = "square";
    osc1.frequency.setValueAtTime(987.77, now);

    gain1.gain.setValueAtTime(this.volume * 0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Tone 2: E6 (1318.51 Hz) - slightly delayed
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(1318.51, now + 0.07);

    gain2.gain.setValueAtTime(this.volume * 0.4, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.35);
  }

  /**
   * ⚡ 4. Laser / Cyber Warp Sound (Decision Tree Node Traversal)
   */
  public playLaserWarp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

    gain.gain.setValueAtTime(this.volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * 🎯 5. Target Lock-On / Radar Beep (KNN Neighbor Found)
   */
  public playTargetLock(rank: number = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pitchMultiplier = 1 + (rank - 1) * 0.12;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(600 * pitchMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(1200 * pitchMultiplier, now + 0.06);

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * 📡 6. Radar Scan Pulse (KNN Radar Pulse Sweep)
   */
  public playRadarScan() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.3);

    gain.gain.setValueAtTime(this.volume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * 🎰 7. Rapid XP / Slot Machine Ticks (Random Forest 100 Trees Voting)
   */
  public playScoreTick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(800 + Math.random() * 300, now);

    gain.gain.setValueAtTime(this.volume * 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  /**
   * 🛡️ 8. Inventory Toggle / Equip Sound (Animal Feature Switch 0/1)
   */
  public playToggle(isOn: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    if (isOn) {
      // Power-up chirp
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.07);
    } else {
      // Power-down chirp
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.07);
    }

    gain.gain.setValueAtTime(this.volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * 🏆 9. Victory Fanfare / Stage Clear (Decision Tree Leaf & RF Consensus)
   * The iconic Final Fantasy / 8-Bit Stage Clear Melodic Jingle!
   */
  public playVictoryFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Classic triumphant sequence: C4, C4, C4, C4, G#4, A#4, C5 (Stage Clear!)
    const notes = [
      { f: 523.25, d: 0.1, delay: 0 },      // C5
      { f: 523.25, d: 0.1, delay: 0.12 },   // C5
      { f: 523.25, d: 0.1, delay: 0.24 },   // C5
      { f: 659.25, d: 0.25, delay: 0.36 },  // E5
      { f: 587.33, d: 0.12, delay: 0.65 },  // D5
      { f: 783.99, d: 0.45, delay: 0.8 },   // G5 (Grand Finale!)
    ];

    notes.forEach((note) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + note.delay;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(this.volume * 0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);
    });
  }

  /**
   * 🌟 10. Level-Up Sound (Confetti / Grand consensus match)
   */
  public playLevelUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const arpeggio = [440, 554.37, 659.25, 880, 1108.73, 1318.51];

    arpeggio.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.055;

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.volume * 0.32, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    });
  }
}

export const gameAudio = new GameAudioEngine();
// Alias for backwards compatibility with any remaining references
export const sound = gameAudio;
