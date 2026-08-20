const STORAGE_KEY = 'growlio_closed_weeks';

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / private mode
  }
}

export function isWeekClosedLocal(scopeKey, weekStart) {
  if (!scopeKey || !weekStart) return false;
  const record = readStore()?.[scopeKey]?.[weekStart];
  if (!record || typeof record !== 'object') return false;
  const status = String(record.status || '').toLowerCase();
  return status === 'closed' || status === 'closed_with_exceptions';
}

export function markWeekClosedLocal(scopeKey, weekStart, sectionData = {}) {
  if (!scopeKey || !weekStart) return;
  const store = readStore();
  if (!store[scopeKey] || typeof store[scopeKey] !== 'object') {
    store[scopeKey] = {};
  }
  store[scopeKey][weekStart] = {
    status: sectionData.status || 'closed_with_exceptions',
    closed_at: sectionData.closed_at || new Date().toISOString(),
    exceptions: Array.isArray(sectionData.exceptions) ? sectionData.exceptions : [],
  };
  writeStore(store);
}
