export const MIN_PAUSE_SECONDS = 0.01;
export const MAX_PAUSE_SECONDS = 99.99;

export function formatPauseSeconds(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, '');
}
