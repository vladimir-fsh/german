const test = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-ts.cjs');
function store(raw = null) {
  let data = raw; let failWrite = false; const handlers = new Map(); const effects = [];
  const window = { localStorage: { getItem: () => data, setItem: (_, value) => { if (failWrite) throw new Error('QuotaExceededError'); data = value; } }, addEventListener: (name, fn) => handlers.set(name, fn), removeEventListener: () => {}, setInterval: () => 1, clearInterval: () => {} };
  const load = createLoader({ window }, { react: { useEffect: (effect) => effects.push(effect), useSyncExternalStore: (_, get) => get() } });
  const hook = load('src/lib/useProgress.ts').useProgress;
  const first = hook(); effects.shift()();
  return { first, read: hook, load, raw: () => data, external: (value) => { data = value; handlers.get('storage')({ key: 'german-b1-progress-v1' }); }, fail: () => { failWrite = true; }, recover: () => { failWrite = false; } };
}
test('corrupt storage stays untouched and blocks automatic writes; valid import restores editing', () => {
  const s = store('{broken'); assert.equal(s.raw(), '{broken'); assert.equal(s.read().blocked, true);
  assert.throws(() => s.read().setProgress((value) => value)); assert.equal(s.raw(), '{broken');
  const p = s.load('src/lib/progress.ts'); s.read().importProgress(JSON.stringify(p.createDefaultProgress())); assert.equal(s.read().canEdit, true);
});
test('functional updates apply to current state, avoiding lost results after asynchronous work', () => {
  const s = store(); const requestSnapshot = s.read(); requestSnapshot.setProgress((value) => ({ ...value, completedLessonIds: ['finished'] }));
  requestSnapshot.setProgress((value) => ({ ...value, studyTime: '07:30' })); assert.equal(s.read().progress.completedLessonIds[0], 'finished'); assert.equal(s.read().progress.studyTime, '07:30');
  assert.equal(JSON.parse(s.raw()).completedLessonIds[0], 'finished');
});
test('quota failure retains unsaved work for export; successful retry saves it', () => {
  const s = store(); s.fail(); s.read().setProgress((value) => ({ ...value, studyTime: '09:00' }));
  assert.equal(s.read().dirty, true); assert.equal(s.read().progress.studyTime, '09:00'); assert.equal(s.raw(), null);
  s.recover(); s.read().retrySave(); assert.equal(s.read().dirty, false); assert.equal(JSON.parse(s.raw()).studyTime, '09:00');
});
test('changes from other tabs synchronize; external change never replaces unsaved local work', () => {
  const s = store(); const p = s.load('src/lib/progress.ts'); const remote = { ...p.createDefaultProgress(), studyTime: '10:00' };
  s.external(JSON.stringify(remote)); assert.equal(s.read().progress.studyTime, '10:00');
  s.fail(); s.read().setProgress((value) => ({ ...value, studyTime: '11:00' })); s.external(JSON.stringify({ ...remote, studyTime: '12:00' }));
  assert.equal(s.read().progress.studyTime, '11:00'); assert.ok(s.read().storageError.includes('Другая вкладка'));
});
