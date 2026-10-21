/**
 * Decide whether a merchant sync poll should finalize THIS run.
 *
 * After a prior sync, square_sync_status stays "completed". A new sync returns
 * 202 before the background thread flips status to "processing", so an immediate
 * poll can see stale "completed" and refresh an empty dashboard.
 *
 * Mirror OnboardingPosImport: only treat "completed" as done after this run has
 * been observed as started/processing, or when force/elapsed allows it.
 */
export function shouldFinalizePosSync({
  status,
  sawProcessing = false,
  force = false,
  startedAt = null,
  now = Date.now(),
  minElapsedMs = 1000,
} = {}) {
  const normalized = String(status || '').toLowerCase();

  if (
    normalized === 'processing' ||
    normalized === 'sync_started' ||
    normalized === 'pending'
  ) {
    return { sawProcessing: true, shouldFinalize: false };
  }

  if (normalized === 'completed') {
    const elapsedOk =
      typeof startedAt === 'number' && now - startedAt >= minElapsedMs;
    if (force || sawProcessing || elapsedOk) {
      return { sawProcessing, shouldFinalize: true };
    }
  }

  return { sawProcessing, shouldFinalize: false };
}
