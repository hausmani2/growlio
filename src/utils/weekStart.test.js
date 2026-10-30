import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { weekRangeForKnownStart } from './weekStart.js';

describe('weekRangeForKnownStart', () => {
  it('does not build a week until week_start_day is known', () => {
    assert.equal(weekRangeForKnownStart(undefined, '2026-10-29'), null);
    assert.equal(weekRangeForKnownStart(null, '2026-10-29'), null);
    assert.equal(weekRangeForKnownStart('', '2026-10-29'), null);
  });

  it('uses Monday as the week start when operating info says Monday', () => {
    const range = weekRangeForKnownStart(1, '2026-10-29');
    assert.equal(range.weekStartDay, 1);
    assert.equal(range.start, '2026-10-26');
    assert.equal(range.end, '2026-11-01');
  });

  it('does not keep a Sunday week after the saved start day is Monday', () => {
    const sunday = weekRangeForKnownStart(0, '2026-10-29');
    const monday = weekRangeForKnownStart(1, '2026-10-29');
    assert.equal(sunday.start, '2026-10-25');
    assert.notEqual(monday.start, sunday.start);
    assert.equal(monday.start, '2026-10-26');
  });
});
