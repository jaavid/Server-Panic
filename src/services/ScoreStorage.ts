const KEY = 'server-panic:best-score:v1';
export interface ScoreStore { getBest(): number; save(score: number): number; }
export class LocalScoreStore implements ScoreStore {
  getBest(): number { try { return Math.max(0, Number(localStorage.getItem(KEY)) || 0); } catch { return 0; } }
  save(score: number): number {
    const best = Math.max(this.getBest(), score);
    try { localStorage.setItem(KEY, String(best)); } catch { /* private browsing may block storage */ }
    return best;
  }
}
/** Future cloud scores can implement this interface without changing game systems. */
export interface RemoteScoreGateway { submit(score: number, seed: number): Promise<void>; }
