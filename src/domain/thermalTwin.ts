import { Reading } from './types';

export type ThermalForecast = {
  currentC: number;
  projectedC: number;
  horizonHours: number;
  slopeCPerHour: number;
  sampleCount: number;
  spanHours: number;
  confidence: 'limited' | 'partial' | 'strong';
  baselineMedianC: number;
  deviationFromBaselineC: number;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function forecastTemperature(
  readings: Reading[],
  horizonHours = 2,
  windowHours = 6,
): ThermalForecast | null {
  const temperatures = readings
    .filter((reading) => reading.parameter === 'temperature' && Number.isFinite(reading.value))
    .map((reading) => ({ value: reading.value, at: Date.parse(reading.observedAt) }))
    .filter((reading) => Number.isFinite(reading.at))
    .sort((a, b) => a.at - b.at);

  if (temperatures.length < 3) return null;
  const newest = temperatures[temperatures.length - 1];
  const cutoff = newest.at - windowHours * 3_600_000;
  const points = temperatures.filter((reading) => reading.at >= cutoff);
  if (points.length < 3) return null;

  const origin = points[0].at;
  const xs = points.map((point) => (point.at - origin) / 3_600_000);
  const ys = points.map((point) => point.value);
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  const numerator = xs.reduce((sum, x, index) => sum + (x - meanX) * (ys[index] - meanY), 0);
  const denominator = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  const slope = denominator > 0 ? numerator / denominator : 0;
  const spanHours = Math.max(0, xs[xs.length - 1] - xs[0]);
  const currentC = newest.value;
  const projectedC = currentC + slope * horizonHours;
  const baselineMedianC = median(ys);

  let confidence: ThermalForecast['confidence'] = 'limited';
  if (points.length >= 8 && spanHours >= 4) confidence = 'strong';
  else if (points.length >= 5 && spanHours >= 2) confidence = 'partial';

  return {
    currentC,
    projectedC,
    horizonHours,
    slopeCPerHour: slope,
    sampleCount: points.length,
    spanHours,
    confidence,
    baselineMedianC,
    deviationFromBaselineC: projectedC - baselineMedianC,
  };
}
