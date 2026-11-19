export type SoundCue = 'tap' | 'success' | 'cool' | 'fail' | 'win' | 'level';
export class SoundManager {
  private audio: AudioContext | null = null;
  private muted = false;
  get isMuted(): boolean { return this.muted; }
  toggle(): boolean { this.muted = !this.muted; return this.muted; }
  play(cue: SoundCue): void {
    if (this.muted) return;
    try {
      this.audio ??= new AudioContext();
      if (this.audio.state === 'suspended') void this.audio.resume();
      const time = this.audio.currentTime;
      const oscillator = this.audio.createOscillator();
      const gain = this.audio.createGain();
      oscillator.connect(gain).connect(this.audio.destination);
      const table: Record<SoundCue, [number, number, number, OscillatorType]> = {
        tap: [470, 670, 0.075, 'sine'], success: [650, 990, 0.13, 'sine'],
        cool: [570, 210, 0.3, 'triangle'], fail: [250, 85, 0.45, 'sawtooth'],
        win: [490, 1050, 0.46, 'sine'], level: [500, 760, 0.18, 'triangle'],
      };
      const [start, end, duration, type] = table[cue];
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(start, time);
      oscillator.frequency.exponentialRampToValueAtTime(end, time + duration);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(cue === 'fail' ? 0.075 : 0.055, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      oscillator.start(time); oscillator.stop(time + duration + 0.01);
    } catch { /* autoplay/browser device restrictions: game remains playable */ }
  }
}
