import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldFinalizePosSync } from './posSyncCompletion.js';

describe('shouldFinalizePosSync', () => {
  it('does not finalize on stale completed before this run is observed', () => {
    const result = shouldFinalizePosSync({
      status: 'completed',
      sawProcessing: false,
      startedAt: Date.now(),
      now: Date.now(),
      minElapsedMs: 1000,
    });
    assert.equal(result.shouldFinalize, false);
    assert.equal(result.sawProcessing, false);
  });

  it('marks processing as in-progress without finalizing', () => {
    const result = shouldFinalizePosSync({
      status: 'processing',
      sawProcessing: false,
    });
    assert.equal(result.shouldFinalize, false);
    assert.equal(result.sawProcessing, true);
  });

  it('finalizes completed after this run was seen as processing', () => {
    const result = shouldFinalizePosSync({
      status: 'completed',
      sawProcessing: true,
    });
    assert.equal(result.shouldFinalize, true);
  });

  it('finalizes completed when force is set (websocket completion)', () => {
    const result = shouldFinalizePosSync({
      status: 'completed',
      sawProcessing: false,
      force: true,
    });
    assert.equal(result.shouldFinalize, true);
  });

  it('finalizes completed after minElapsedMs even without processing poll', () => {
    const startedAt = 1_000;
    const result = shouldFinalizePosSync({
      status: 'completed',
      sawProcessing: false,
      startedAt,
      now: startedAt + 1000,
      minElapsedMs: 1000,
    });
    assert.equal(result.shouldFinalize, true);
  });

  it('treats sync_started as observed progress', () => {
    const result = shouldFinalizePosSync({
      status: 'sync_started',
      sawProcessing: false,
    });
    assert.equal(result.sawProcessing, true);
    assert.equal(result.shouldFinalize, false);
  });
});
