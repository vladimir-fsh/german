const test = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-ts.cjs');
function service() {
  const state = { calls: 0, constructed: 0, response: { status: 'completed', output_text: '{}' }, fail: false };
  class FakeOpenAI { constructor() { state.constructed++; this.responses = { create: async () => { state.calls++; if (state.fail) throw new Error('private provider details'); return state.response; } }; } }
  FakeOpenAI.APIError = class extends Error {};
  const load = createLoader({}, { openai: FakeOpenAI });
  return { load, state };
}
async function env(values, work) { const before = {}; for (const [key, value] of Object.entries(values)) { before[key] = process.env[key]; if (value === undefined) delete process.env[key]; else process.env[key] = value; } try { return await work(); } finally { for (const [key, value] of Object.entries(before)) if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
const request = (body, origin) => new Request('http://localhost:3105/api/ai/check-writing', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const writingRequest = { lessonId: 'unit', examId: 'goethe-b1', answer: 'Ich kann morgen leider nicht zum Unterricht kommen, weil ich arbeiten muss. Könnten wir bitte einen neuen Termin vereinbaren?', lessonContext: { title: 'Termin', level: 'A2', grammarTitle: 'weil', freePromptRu: 'Попросите перенос занятия.', successCriteria: [] } };
const feedback = { correctedText: writingRequest.answer, levelEstimate: 'B1', score: 10, assessmentNoteRu: 'Учебная оценка', strengths: ['Понятно'], grammarTipsRu: [], nextPracticeRu: 'Повторите позже.', corrections: [], rubric: ['task', 'coherence', 'register', 'vocabulary', 'grammar'].map((criterion) => ({ criterion, score: 2, explanationRu: 'В основном получилось.' })) };
test('routes load without credentials and return JSON 503 without constructing client', async () => env({ OPENAI_API_KEY: undefined, NODE_ENV: 'development' }, async () => {
  const { load, state } = service();
  for (const name of ['check-writing', 'check-speaking', 'check-exercise', 'generate-lesson']) { const result = await load(`src/app/api/ai/${name}/route.ts`).POST(request({})); assert.equal(result.status, 503); assert.ok((await result.json()).error); }
  assert.equal(state.constructed, 0);
}));
test('production AI needs access configuration; requests from another origin are blocked', async () => env({ OPENAI_API_KEY: 'test-placeholder', NODE_ENV: 'production', APP_ACCESS_PASSWORD: undefined }, async () => {
  const { load, state } = service(); const route = load('src/app/api/ai/check-writing/route.ts');
  assert.equal((await route.POST(request(writingRequest))).status, 503); assert.equal((await route.POST(request(writingRequest, 'https://other.example'))).status, 403); assert.equal(state.calls, 0);
}));
test('malformed and oversized requests fail before provider call', async () => env({ OPENAI_API_KEY: 'test-placeholder', NODE_ENV: 'development' }, async () => {
  const { load, state } = service(); const route = load('src/app/api/ai/check-writing/route.ts');
  assert.equal((await route.POST(request('{bad'))).status, 400); assert.equal((await route.POST(request({ ...writingRequest, lessonContext: null }))).status, 400);
  assert.equal((await route.POST(request('x'.repeat(50001)))).status, 413);
  const generate = load('src/app/api/ai/generate-lesson/route.ts'); assert.equal((await generate.POST(request({ completedLessonIds: [], weakVocabulary: [] }))).status, 400); assert.equal(state.calls, 0);
}));
test('short writing has no forced level; score is derived from five rubric criteria', async () => env({ OPENAI_API_KEY: 'test-placeholder', NODE_ENV: 'development' }, async () => {
  const { load, state } = service(); state.response.output_text = JSON.stringify(feedback);
  const result = await load('src/app/api/ai/check-writing/route.ts').POST(request(writingRequest)); assert.equal(result.status, 200); const body = await result.json(); assert.equal(body.feedback.levelEstimate, null); assert.equal(body.feedback.score, 7);
}));
test('provider failure, refusal and truncated output produce safe JSON errors', async () => env({ OPENAI_API_KEY: 'test-placeholder', NODE_ENV: 'development' }, async () => {
  const { load, state } = service(); const route = load('src/app/api/ai/check-writing/route.ts'); state.fail = true;
  let result = await route.POST(request(writingRequest)); assert.equal(result.status, 502); assert.ok(!(await result.text()).includes('private provider'));
  state.fail = false; state.response = { status: 'completed', output_text: '' }; assert.equal((await route.POST(request(writingRequest))).status, 502);
  state.response = { status: 'incomplete', output_text: JSON.stringify(feedback) }; assert.equal((await route.POST(request(writingRequest))).status, 502);
  state.response = { status: 'completed', output_text: '{}' }; assert.equal((await route.POST(request(writingRequest))).status, 502);
}));
test('generated reading lessons and checkpoints keep their selected profile and timer', async () => env({ OPENAI_API_KEY: 'test-placeholder', NODE_ENV: 'development' }, async () => {
  const { load, state } = service(); const progress = load('src/lib/progress.ts').createDefaultProgress();
  const sample = load('src/lib/curriculum.ts').makePracticeLesson(progress, 'reading');
  sample.exercises.push({ ...sample.exercises.at(-1), id: 'second-reading' });
  state.response.output_text = JSON.stringify(sample);
  const route = load('src/app/api/ai/generate-lesson/route.ts');
  for (const [examId, minutes] of [['goethe-b1', 60], ['telc-b1', 30]]) {
    const result = await route.POST(request({ examId, targetLevel: 'B1', skillId: 'reading', kind: 'checkpoint', studyDay: 5, preferredTopics: ['Alltag'], weakVocabulary: [], recentLessons: [], recentMistakes: [] }));
    assert.equal(result.status, 200); const body = await result.json(); assert.equal(body.lesson.kind, 'checkpoint'); assert.equal(body.lesson.timeLimitMinutes, minutes); assert.equal(body.lesson.level, 'B1'); assert.equal(body.lesson.examId, examId);
  }
}));
test('access middleware accepts UTF-8 credentials and rejects wrong credentials', async () => env({ APP_ACCESS_USERNAME: 'ученик', APP_ACCESS_PASSWORD: 'Prüfung-123' }, async () => {
  const middleware = createLoader({ atob: globalThis.atob })('src/middleware.ts').middleware;
  const call = (credentials) => middleware(new Request('http://localhost:3105/', { headers: { authorization: 'Basic ' + Buffer.from(credentials, 'utf8').toString('base64') } }));
  assert.equal(call('ученик:Prüfung-123').status, 200);
  assert.equal(call('ученик:wrong').status, 401); assert.equal(call('ученик:Prüfung-123extra').status, 401);
}));
