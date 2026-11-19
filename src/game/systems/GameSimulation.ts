import { DEFAULT_BALANCE } from '../config/balance.js';
import type { BalanceConfig } from '../config/balance.js';
import { SeededRandom } from './SeededRandom.js';

export type GamePhase = 'ready' | 'playing' | 'won' | 'lost';
export type RackStatus = 'idle' | 'processing' | 'overheating' | 'critical' | 'offline' | 'recovery';
export type PacketKind = 'normal' | 'priority';
export interface RequestPacket { id: number; kind: PacketKind; heat: number; points: number; }
export interface Rack {
  id: number; temperature: number; online: boolean; processingUntil: number; recoveryUntil: number;
  pending: RequestPacket | null; justRecoveredUntil: number; status: RackStatus;
}
export type GameEvent =
  | { type: 'spawn'; kind: PacketKind }
  | { type: 'route'; rackId: number; packet: RequestPacket }
  | { type: 'processed'; rackId: number; points: number; combo: number; kind: PacketKind }
  | { type: 'fail'; rackId: number }
  | { type: 'recover'; rackId: number }
  | { type: 'cool'; rackId: number; amount: number }
  | { type: 'level'; level: number }
  | { type: 'end'; result: 'won' | 'lost'; reason: string };
export interface GameSnapshot {
  phase: GamePhase; elapsed: number; remaining: number; score: number; processed: number;
  recovered: number; combo: number; maxCombo: number; level: number; coolingReadyIn: number;
  queue: readonly RequestPacket[]; racks: readonly Rack[]; queueFullFor: number;
  endedBecause: string;
}

export class GameSimulation {
  readonly config: Readonly<BalanceConfig>;
  readonly racks: Rack[];
  readonly queue: RequestPacket[] = [];
  phase: GamePhase = 'ready';
  elapsed = 0;
  score = 0;
  processed = 0;
  recovered = 0;
  combo = 0;
  maxCombo = 0;
  level = 0;
  queueFullFor = 0;
  endedBecause = '';
  coolingAvailableAt = 0;
  private offlineSince = 0;
  private spawnClock = 0;
  private lastProcessedAt = -100;
  private nextPacketId = 1;
  private events: GameEvent[] = [];
  private rng: SeededRandom;
  constructor(seed = 1337, settings: Partial<BalanceConfig> = {}) {
    this.config = { ...DEFAULT_BALANCE, ...settings };
    this.rng = new SeededRandom(seed);
    this.racks = Array.from({ length: 3 }, (_, id) => ({
      id, temperature: this.config.normalTemperature, online: true, processingUntil: 0,
      recoveryUntil: 0, pending: null, justRecoveredUntil: 0, status: 'idle' as RackStatus,
    }));
  }
  start(): void {
    if (this.phase !== 'ready') return;
    this.phase = 'playing';
    this.spawnPacket();
    this.spawnPacket();
  }
  snapshot(): GameSnapshot {
    return {
      phase: this.phase, elapsed: this.elapsed,
      remaining: Math.max(0, this.config.duration - this.elapsed),
      score: this.score, processed: this.processed, recovered: this.recovered,
      combo: this.combo, maxCombo: this.maxCombo, level: this.level,
      coolingReadyIn: Math.max(0, this.coolingAvailableAt - this.elapsed),
      queue: this.queue, racks: this.racks, queueFullFor: this.queueFullFor,
      endedBecause: this.endedBecause,
    };
  }
  drainEvents(): GameEvent[] { return this.events.splice(0); }
  get spawnInterval(): number {
    return Math.max(this.config.minimumSpawnInterval, this.config.initialSpawnInterval - this.level * this.config.spawnAcceleration);
  }
  /** Returns false if the selected rack cannot accept traffic. */
  route(rackId: number): boolean {
    const rack = this.racks[rackId];
    if (this.phase !== 'playing' || !rack?.online || rack.pending || this.queue.length === 0) return false;
    const packet = this.queue.shift();
    if (!packet) return false;
    rack.pending = packet;
    rack.processingUntil = this.elapsed + this.config.processingDuration * (packet.kind === 'priority' ? 1.23 : 1);
    rack.temperature += this.config.routeHeat * packet.heat;
    this.updateStatus(rack);
    this.events.push({ type: 'route', rackId, packet });
    if (rack.temperature >= this.config.criticalTemperature) this.failRack(rack);
    return true;
  }
  cool(rackId: number): boolean {
    const rack = this.racks[rackId];
    if (this.phase !== 'playing' || !rack?.online || this.elapsed < this.coolingAvailableAt) return false;
    const before = rack.temperature;
    rack.temperature = Math.max(21, before - this.config.coolingStrength);
    this.coolingAvailableAt = this.elapsed + this.config.coolingCooldown;
    this.updateStatus(rack);
    this.events.push({ type: 'cool', rackId, amount: before - rack.temperature });
    return true;
  }
  /** Feed elapsed real time, clamped to avoid tab-resume death. */
  advance(realDeltaSeconds: number): void {
    if (this.phase !== 'playing') return;
    let remaining = Math.min(0.2, Math.max(0, realDeltaSeconds));
    while (remaining > 0 && this.phase === 'playing') {
      const delta = Math.min(0.025, remaining);
      this.step(delta);
      remaining -= delta;
    }
  }
  /** Stable simulation steps ensure consistent results across frame rates. */
  private step(dt: number): void {
    const previousLevel = this.level;
    this.elapsed += dt;
    this.level = Math.min(5, Math.floor((this.elapsed + 1e-7) / this.config.difficultyInterval));
    if (this.level > previousLevel) this.events.push({ type: 'level', level: this.level });
    this.spawnClock += dt;
    while (this.spawnClock >= this.spawnInterval) {
      this.spawnClock -= this.spawnInterval;
      this.spawnPacket();
    }
    for (const rack of this.racks) {
      if (!rack.online) {
        if (this.elapsed >= rack.recoveryUntil) {
          rack.online = true;
          rack.temperature = this.config.recoveryTemperature;
          rack.justRecoveredUntil = this.elapsed + 1.2;
          this.recovered++;
          this.events.push({ type: 'recover', rackId: rack.id });
        }
        this.updateStatus(rack);
        continue;
      }
      if (rack.pending) {
        rack.temperature += (this.config.processingHeatPerSecond + this.level * 0.38 - this.config.busyCoolingPerSecond) * dt;
        if (this.elapsed >= rack.processingUntil) this.completeRequest(rack);
      } else rack.temperature -= this.config.idleCoolingPerSecond * dt;
      rack.temperature = Math.max(21, rack.temperature);
      if (rack.temperature >= this.config.criticalTemperature) this.failRack(rack);
      this.updateStatus(rack);
    }
    this.queueFullFor = this.queue.length >= this.config.queueCapacity ? this.queueFullFor + dt : Math.max(0, this.queueFullFor - dt * 1.8);
    this.offlineSince = this.racks.every(r => !r.online) ? this.offlineSince + dt : 0;
    if (this.queueFullFor >= this.config.queueOverloadGrace) this.finish('lost', 'صف درخواست‌ها از کنترل خارج شد');
    else if (this.offlineSince >= this.config.allOfflineGrace) this.finish('lost', 'تمام سرورها از دسترس خارج شدند');
    else if (this.elapsed >= this.config.duration) this.finish('won', 'مرکز داده نجات پیدا کرد!');
  }
  private spawnPacket(): void {
    if (this.queue.length >= this.config.queueCapacity) return;
    const priority = this.rng.next() < Math.min(0.3, 0.11 + this.level * 0.028);
    const packet: RequestPacket = {
      id: this.nextPacketId++, kind: priority ? 'priority' : 'normal',
      heat: priority ? 1.38 : 1, points: Math.round(this.config.basePoints * (priority ? 1.6 : 1)),
    };
    this.queue.push(packet);
    this.events.push({ type: 'spawn', kind: packet.kind });
  }
  private completeRequest(rack: Rack): void {
    if (!rack.pending) return;
    const packet = rack.pending;
    rack.pending = null;
    rack.processingUntil = 0;
    this.combo = this.elapsed - this.lastProcessedAt <= this.config.comboWindow ? this.combo + 1 : 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.lastProcessedAt = this.elapsed;
    const multiplier = Math.min(this.config.maxComboMultiplier, 1 + Math.floor((this.combo - 1) / 3) * 0.5);
    const points = Math.round(packet.points * multiplier);
    this.score += points;
    this.processed++;
    this.events.push({ type: 'processed', rackId: rack.id, points, combo: this.combo, kind: packet.kind });
  }
  private failRack(rack: Rack): void {
    if (!rack.online) return;
    rack.online = false;
    rack.pending = null;
    rack.processingUntil = 0;
    rack.recoveryUntil = this.elapsed + this.config.recoveryDuration;
    rack.temperature = this.config.criticalTemperature;
    this.combo = 0;
    this.events.push({ type: 'fail', rackId: rack.id });
    this.updateStatus(rack);
  }
  private updateStatus(rack: Rack): void {
    if (!rack.online) rack.status = 'offline';
    else if (this.elapsed < rack.justRecoveredUntil) rack.status = 'recovery';
    else if (rack.temperature >= this.config.warnTemperature + 19) rack.status = 'critical';
    else if (rack.temperature >= this.config.warnTemperature) rack.status = 'overheating';
    else if (rack.pending) rack.status = 'processing';
    else rack.status = 'idle';
  }
  private finish(result: 'won' | 'lost', reason: string): void {
    if (this.phase !== 'playing') return;
    this.phase = result;
    this.endedBecause = reason;
    this.events.push({ type: 'end', result, reason });
  }
}
