/**
 * Number formatting for the designer. Always en-US: the page is prerendered,
 * and locale-dependent output would differ between build and browser.
 */

export function fmt(value: number, digits = 1): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export function fmtInt(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

/** "950 W", "1.1 kW", "92.5 mW" */
export function fmtWatts(watts: number): string {
  if (watts >= 10_000) return `${fmt(watts / 1000, 1)} kW`;
  if (watts >= 100) return `${fmtInt(watts)} W`;
  if (watts >= 1) return `${fmt(watts, 1)} W`;
  if (watts > 0) return `${fmtInt(watts * 1000)} mW`;
  return '0 W';
}

/** "222 A", "3.8 A", "60 mA" */
export function fmtAmps(amps: number): string {
  if (amps >= 100) return `${fmtInt(amps)} A`;
  if (amps >= 1) return `${fmt(amps, 1)} A`;
  if (amps > 0) return `${fmt(amps * 1000, amps < 0.01 ? 1 : 0)} mA`;
  return '0 A';
}

/** "5 V", "3.3 V" */
export function fmtVolts(volts: number): string {
  return `${fmt(volts, 1)} V`;
}

/** "800 kHz", "30 MHz" */
export function fmtHz(hz: number): string {
  return hz >= 1e6 ? `${fmt(hz / 1e6)} MHz` : `${fmt(hz / 1e3, 0)} kHz`;
}

/** "~67 fps", "~8.3 fps" */
export function fmtFps(fps: number): string {
  return `~${fmt(fps, fps < 10 ? 1 : 0)} fps`;
}

/** "$1,234", "$12.50", "$0.066", "Free" */
export function fmtUsd(value: number): string {
  if (value === 0) return 'Free';
  const digits =
    value < 1
      ? { minimumFractionDigits: 2, maximumFractionDigits: 4 }
      : value < 100
        ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        : { maximumFractionDigits: 0 };
  return `$${value.toLocaleString('en-US', digits)}`;
}

/** Metres with a feet hint: "2 m (6.6 ft)" */
export function fmtMeters(meters: number): string {
  return `${fmt(meters, 1)} m (${fmt(meters * 3.28084, 1)} ft)`;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${fmtInt(count)} ${count === 1 ? singular : pluralForm}`;
}
