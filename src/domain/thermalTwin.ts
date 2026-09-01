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
  interval95C: { lower: number; upper: number };
  residualStdC: number;
  anomaly: { detected: boolean; robustScore: number };
  changePoint: { detected: boolean; shiftC: number; robustScore: number };
  calibration: { status: 'declared' | 'unknown'; maxUncertaintyC: number | null };
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1]! + sorted[middle]!) / 2;
  }
  return sorted[middle]!;
}

export function forecastTemperature(
  readings: Reading[],
  horizonHours = 2,
  windowHours = 6,
): ThermalForecast | null {
  const temperatures = readings
    .filter((reading) => reading.parameter === 'temperature' && Number.isFinite(reading.value))
    .map((reading) => ({ value: reading.value + (reading.calibration?.offset ?? 0), at: Date.parse(reading.observedAt), calibration: reading.calibration }))
    .filter((reading) => Number.isFinite(reading.at))
    .sort((a, b) => a.at - b.at);

  if (temperatures.length < 3) return null;
  const newest = temperatures[temperatures.length - 1]!;
  const cutoff = newest.at - windowHours * 3_600_000;
  const points = temperatures.filter((reading) => reading.at >= cutoff);
  if (points.length < 3) return null;

  const origin = points[0]!.at;
  const xs = points.map((point) => (point.at - origin) / 3_600_000);
  const ys = points.map((point) => point.value);
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  const numerator = xs.reduce((sum, x, index) => sum + (x - meanX) * (ys[index]! - meanY), 0);
  const denominator = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  const slope = denominator > 0 ? numerator / denominator : 0;
  const spanHours = Math.max(0, xs[xs.length - 1]! - xs[0]!);
  const currentC = newest.value;
  const projectedC = currentC + slope * horizonHours;
  const baselineMedianC = median(ys);
  const predicted = xs.map((x) => meanY + slope * (x - meanX));
  const residuals = ys.map((value, index) => value - predicted[index]!);
  const residualStdC = Math.sqrt(residuals.reduce((sum, value) => sum + value ** 2, 0) / Math.max(1, residuals.length - 2));
  const forecastX = xs[xs.length - 1]! + horizonHours;
  const spread = Math.max(.1, residualStdC) * Math.sqrt(1 + (1 / xs.length) + ((forecastX - meanX) ** 2 / Math.max(denominator, .001)));
  const calibrationUncertainty = Math.max(0, ...points.map(point => point.calibration?.uncertainty ?? 0));
  const interval = 1.96 * Math.sqrt(spread ** 2 + calibrationUncertainty ** 2);
  const history = ys.slice(0, -1);
  const historyMedian = median(history);
  const mad = median(history.map(value => Math.abs(value - historyMedian)));
  const robustScale = Math.max(.1, mad * 1.4826);
  const anomalyScore = Math.abs(currentC - historyMedian) / robustScale;
  const recent = ys.slice(-3); const prior = ys.slice(Math.max(0, ys.length - 6), -3);
  const recentMean = recent.reduce((sum,value)=>sum+value,0)/recent.length;
  const priorMean = prior.length ? prior.reduce((sum,value)=>sum+value,0)/prior.length : recentMean;
  const shift = recentMean - priorMean; const changeScore = Math.abs(shift) / robustScale;

  let confidence: ThermalForecast['confidence'] = 'limited';
  // Seven hourly samples span a complete six-hour inclusive window.
  if (points.length >= 7 && spanHours >= 6) confidence = 'strong';
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
    interval95C: { lower: projectedC - interval, upper: projectedC + interval },
    residualStdC,
    anomaly: { detected: anomalyScore >= 3.5, robustScore: anomalyScore },
    changePoint: { detected: prior.length >= 3 && Math.abs(shift) >= .5 && changeScore >= 3, shiftC: shift, robustScore: changeScore },
    calibration: { status: points.every(point => point.calibration) ? 'declared' : 'unknown', maxUncertaintyC: points.some(point => point.calibration) ? calibrationUncertainty : null },
  };
}
