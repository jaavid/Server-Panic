export interface BalanceConfig {
  duration: number;
  queueCapacity: number;
  initialSpawnInterval: number;
  minimumSpawnInterval: number;
  difficultyInterval: number;
  spawnAcceleration: number;
  processingDuration: number;
  idleCoolingPerSecond: number;
  processingHeatPerSecond: number;
  busyCoolingPerSecond: number;
  routeHeat: number;
  warnTemperature: number;
  criticalTemperature: number;
  normalTemperature: number;
  recoveryDuration: number;
  recoveryTemperature: number;
  coolingStrength: number;
  coolingCooldown: number;
  queueOverloadGrace: number;
  allOfflineGrace: number;
  comboWindow: number;
  maxComboMultiplier: number;
  basePoints: number;
}
export const DEFAULT_BALANCE: Readonly<BalanceConfig> = Object.freeze({
  duration: 90,
  queueCapacity: 9,
  initialSpawnInterval: 1.7,
  minimumSpawnInterval: 0.88,
  difficultyInterval: 15,
  spawnAcceleration: 0.16,
  processingDuration: 0.76,
  idleCoolingPerSecond: 2.2,
  processingHeatPerSecond: 5.0,
  busyCoolingPerSecond: 0.7,
  routeHeat: 13.5,
  warnTemperature: 66,
  criticalTemperature: 100,
  normalTemperature: 30,
  recoveryDuration: 5.2,
  recoveryTemperature: 43,
  coolingStrength: 43,
  coolingCooldown: 11.5,
  queueOverloadGrace: 5,
  allOfflineGrace: 3.2,
  comboWindow: 4.2,
  maxComboMultiplier: 4,
  basePoints: 100,
});
export const RACK_NAMES = ['آلفا', 'بتا', 'گاما'] as const;
export const PALETTE = {
  navy: '#101827', blue: '#1C2940', cyan: '#30D9E8', mint: '#67E6B5',
  yellow: '#FFC857', orange: '#FF8757', red: '#FF4D6D', violet: '#9475FF',
};
