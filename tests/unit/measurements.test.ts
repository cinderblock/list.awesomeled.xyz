import { describe, expect, test } from 'bun:test';
import { measurementsOf } from '../../app/lib/types';

describe('measurementsOf', () => {
  const entry = {
    color: { pwm_frequency: '1.2kHz' },
    measurements: { 'color.pwm_frequency': [{ value: '4.7kHz', by: 'cpldcpu' }] },
  };

  test("a field's measurements, by dotted path", () => {
    expect(measurementsOf(entry, 'color.pwm_frequency')).toEqual([
      { value: '4.7kHz', by: 'cpldcpu' },
    ]);
  });

  test('none for an unmeasured field or an entry without measurements', () => {
    expect(measurementsOf(entry, 'electrical.channel_current')).toEqual([]);
    expect(measurementsOf({}, 'color.pwm_frequency')).toEqual([]);
    expect(measurementsOf(null, 'color.pwm_frequency')).toEqual([]);
  });
});
