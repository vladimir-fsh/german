const test = require('node:test');
const assert = require('node:assert/strict');
const createLoader = require('./load-ts.cjs');
const load = createLoader();
const p = load('src/lib/progress.ts');
const c = load('src/lib/curriculum.ts');
const schedule = load('src/lib/schedule.ts');
const answers = load('src/lib/answers.ts');
const day = new Date('2026-09-28T12:00:00Z');
test('every fifth distinct lesson is a checkpoint, including after import', () => {
  const state = p.createDefaultProgress(day); state.diagnosticCompletedAt = day.toISOString();
  for (let completed = 0; completed < 11; completed++) {
    state.completedLessonIds = Array.from({ length: completed }, (_, index) => `completed-${index}`);
    assert.equal(schedule.getCurrentLesson(state, day).kind, (completed + 1) % 5 === 0 ? 'checkpoint' : 'lesson');
  }
  state.completedLessonIds = ['a', 'b', 'c', 'd', 'd']; assert.equal(schedule.nextLessonKind(state), 'checkpoint');
});
test('mistake drafts preserve hints and attempts through import, then clear after scheduling', () => {
  const lesson = c.makePracticeLesson(p.createDefaultProgress(day), 'cases', day);
  let state = p.updateDraft(p.createDefaultProgress(day), lesson, (draft) => draft, day);
  const wrong = { exerciseId: lesson.exercises[0].id, answer: 'wrong', verdict: 'incorrect', explanationRu: 'Проверьте падеж', corrected: lesson.exercises[0].answer, skillId: 'cases', usedHint: false, checkedAt: day.toISOString() };
  state = p.recordExerciseAttempt(state, lesson, wrong, day); const mistake = state.mistakeLog[0];
  state.mistakePracticeDrafts[mistake.id] = { exerciseId: 'repair-' + mistake.id, answer: 'einen', usedHint: true, attempts: [{ ...wrong, exerciseId: 'repair-' + mistake.id, usedHint: true }], updatedAt: day.toISOString() };
  const restored = p.importProgressFromJson(JSON.stringify(state), day);
  assert.equal(restored.mistakePracticeDrafts[mistake.id].usedHint, true); assert.equal(restored.mistakePracticeDrafts[mistake.id].attempts.length, 1);
  assert.equal(Object.keys(p.recordMistakePractice(restored, mistake.id, false, day).mistakePracticeDrafts).length, 0);
  const broken = JSON.parse(JSON.stringify(state)); broken.mistakePracticeDrafts.unknown = broken.mistakePracticeDrafts[mistake.id]; assert.throws(() => p.importProgressFromJson(JSON.stringify(broken), day));
  delete broken.mistakePracticeDrafts; delete broken.speakingPractice; assert.equal(Object.keys(p.importProgressFromJson(JSON.stringify(broken), day).mistakePracticeDrafts).length, 0);
  assert.throws(() => p.importProgressFromJson('{broken'), /Текущий прогресс не изменен/);
});
function prepare(progress, lesson, date = day, hinted = false) {
  progress = p.updateDraft(progress, lesson, (draft) => ({ ...draft, answers: { freePrompt: Array(25).fill('Deutsch').join(' '), ...Object.fromEntries(lesson.exercises.map((item) => [item.id, item.answer])) } }), date);
  for (const item of lesson.exercises) progress = p.recordExerciseAttempt(progress, lesson, { exerciseId: item.id, answer: item.answer, verdict: 'correct', explanationRu: 'Верно', corrected: item.answer, skillId: item.skillId ?? lesson.skillId, usedHint: hinted, checkedAt: date.toISOString() }, date);
  return progress;
}
function word(id, german = 'die Abholung', sense = '') { return { id, german, russian: 'получение', exampleSentence: 'Die Abholung ist morgen.', difficulty: 'B1', topic: 'Termine', sense }; }

test('migration preserves v1 results and AI words; export can be imported again', () => {
  const old = JSON.parse(JSON.stringify(p.createDefaultProgress(day)));
  old.version = 1;
  for (const name of ['customVocabulary', 'drafts', 'attempts', 'skillEvidence', 'examId', 'targetLevel', 'preferredTopics', 'diagnosticCompletedAt', 'speakingPractice']) delete old[name];
  for (const state of Object.values(old.reviewState)) for (const name of ['stage', 'intervalDays', 'successes', 'lapses', 'direction', 'introducedAt']) delete state[name];
  const lesson = { ...c.makePracticeLesson(p.createDefaultProgress(day), 'requests', day), id: 'old-ai', vocabularyIds: [], vocabularyItems: [word('old-word')], source: 'ai' };
  old.generatedLessons = { 'old-ai': lesson }; old.currentGeneratedLessonId = 'old-ai'; old.completedLessonIds = ['old-ai']; old.completedDates = ['2026-09-28']; old.totalCompletedLessons = 99;
  old.lessonResults = { 'old-ai': { lessonId: 'old-ai', completedAt: day.toISOString(), completedDate: '2026-09-28', exerciseAnswers: { freePrompt: 'Старый ответ' } } };
  const migrated = p.importProgressFromJson(JSON.stringify(old), day);
  assert.equal(migrated.version, 2); assert.equal(migrated.totalCompletedLessons, 1); assert.equal(migrated.attempts[0].exerciseAnswers.freePrompt, 'Старый ответ');
  const id = migrated.generatedLessons['old-ai'].vocabularyIds[0]; assert.equal(p.getVocabularyCatalog(migrated)[id].german, 'die Abholung'); assert.ok(migrated.reviewState[id]);
  const restored = p.importProgressFromJson(JSON.stringify(migrated), day); assert.equal(restored.currentGeneratedLessonId, 'old-ai'); assert.equal(restored.attempts.length, 1);
});
test('lexical identity survives changed AI IDs, but separate senses are not merged', () => {
  let state = p.createDefaultProgress(day);
  for (const [id, words] of [['first', [word('random-1')]], ['second', [word('random-2')]], ['third', [word('random-3', 'die Abholung', 'anderer Sinn')]]]) state = p.saveGeneratedLesson(state, { ...c.makePracticeLesson(state, 'requests', day), id, vocabularyItems: words, vocabularyIds: [] }, day);
  assert.equal(Object.keys(state.customVocabulary).length, 2);
  assert.equal(state.generatedLessons.first.vocabularyIds[0], state.generatedLessons.second.vocabularyIds[0]);
  assert.notEqual(state.generatedLessons.first.vocabularyIds[0], state.generatedLessons.third.vocabularyIds[0]);
});
test('empty work cannot be completed; separate lessons on same day count separately; repeated click is idempotent', () => {
  let state = p.createDefaultProgress(day); let lesson = c.makePracticeLesson(state, 'cases', day);
  assert.throws(() => p.completeLesson(state, lesson, day));
  state = p.completeLesson(prepare(state, lesson), lesson, day);
  state = p.completeLesson(state, lesson, day); assert.equal(state.attempts.length, 1);
  lesson = c.makePracticeLesson(state, 'requests', day); state = p.completeLesson(prepare(state, lesson), lesson, day);
  assert.equal(state.totalCompletedLessons, 2); assert.equal(state.completedDates.length, 1); assert.equal(state.attempts.length, 2);
});
test('first attempt and hints control evidence; repeated successful clicks do not manufacture mastery', () => {
  let state = p.createDefaultProgress(day); const lesson = c.makePracticeLesson(state, 'cases', day);
  state = prepare(state, lesson, day, true); state = p.completeLesson(state, lesson, day);
  assert.equal(state.skillEvidence.cases[0].successful, false); assert.equal(c.skillStatus(state, 'cases', '2026-09-28'), 'learning');
});
test('valid alternate translations stay uncertain until semantic check; capitalization stays visible', () => {
  const exercise = c.skillExercises.requests[2];
  assert.equal(answers.checkAnswer(exercise, 'Ich möchte gern den Termin verschieben.'), 'correct');
  assert.equal(answers.checkAnswer(exercise, 'Ich würde meinen Termin gerne verschieben.'), 'needs-review');
  assert.equal(answers.checkAnswer(exercise, 'ich möchte den termin verschieben.'), 'capitalization');
  let state = p.createDefaultProgress(day); const lesson = { ...c.makePracticeLesson(state, 'requests', day), exercises: [exercise] };
  const attempt = { exerciseId: exercise.id, answer: 'another', verdict: 'needs-review', explanationRu: '', corrected: exercise.answer, skillId: 'requests', usedHint: false, checkedAt: day.toISOString() };
  state = p.recordExerciseAttempt(state, lesson, attempt, day); state = p.recordExerciseAttempt(state, lesson, { ...attempt, verdict: 'correct' }, day);
  assert.equal(state.drafts[lesson.id].checks[exercise.id].length, 1); assert.equal(state.drafts[lesson.id].checks[exercise.id][0].verdict, 'correct');
});
test('retention needs different tasks and delayed observation, and expires', () => {
  const state = p.createDefaultProgress(day);
  state.skillEvidence.cases = [{ date: '2026-09-24', lessonId: 'a', successful: true, source: 'exercise', taskKey: 'a' }, { date: '2026-09-28', lessonId: 'b', successful: true, source: 'exercise', taskKey: 'a' }];
  assert.equal(c.skillStatus(state, 'cases', '2026-09-28'), 'practicing'); state.skillEvidence.cases[1].taskKey = 'b';
  assert.equal(c.skillStatus(state, 'cases', '2026-09-28'), 'retained'); assert.equal(c.skillStatus(state, 'cases', '2026-11-01'), 'practicing');
});
test('streak survives weekend but expires after missed weekday', () => {
  assert.equal(p.streakStats(['2026-09-24', '2026-09-25', '2026-09-26'], new Date('2026-09-28T12:00:00Z')).currentStreak, 2);
  assert.equal(p.streakStats(['2026-09-24', '2026-09-25'], new Date('2026-09-29T12:00:00Z')).currentStreak, 0);
  assert.equal(p.streakStats(['2026-09-25', '2026-09-28'], new Date('2026-09-28T12:00:00Z')).currentStreak, 2);
});
test('SRS starts with short steps; early repeated click cannot advance interval; new daily load is capped', () => {
  let state = p.createDefaultProgress(day); const ids = Object.keys(state.reviewState);
  state = p.introduceVocabulary(state, ids, day); assert.equal(Object.values(state.reviewState).filter((item) => item.stage === 'learning').length, 5);
  state = p.markVocabularyKnowledge(state, ids[0], true, day); const first = state.reviewState[ids[0]];
  assert.equal(new Date(first.dueAt) - day, 10 * 60000); assert.equal(first.stage, 'learning');
  state = p.markVocabularyKnowledge(state, ids[0], true, day); assert.equal(state.reviewState[ids[0]].reviewCount, 1);
  const tenMinutes = new Date(day.getTime() + 10 * 60000); state = p.markVocabularyKnowledge(state, ids[0], true, tenMinutes);
  assert.equal(state.reviewState[ids[0]].intervalDays, 1); assert.equal(state.reviewState[ids[0]].stage, 'review');
  const tomorrow = new Date(tenMinutes.getTime() + 86400000); state = p.markVocabularyKnowledge(state, ids[0], false, tomorrow);
  assert.equal(new Date(state.reviewState[ids[0]].dueAt) - tomorrow, 60000); assert.equal(state.reviewState[ids[0]].lapses, 1);
});
test('imports reject invalid structure, dates, unknown references and prototype keys before writes', () => {
  for (const change of [(x) => x.completedDates = null, (x) => x.studyTime = '99:00', (x) => x.startDate = '2026-02-30', (x) => x.reviewState = [], (x) => x.currentGeneratedLessonId = 'missing', (x) => x.preferredTopics = [5], (x) => x.skillEvidence.cases = [false]]) {
    const value = JSON.parse(JSON.stringify(p.createDefaultProgress(day))); change(value); assert.throws(() => p.importProgressFromJson(JSON.stringify(value), day));
  }
  const value = JSON.stringify(p.createDefaultProgress(day)).replace('"drafts":{}', '"drafts":{"__proto__":{}}'); assert.throws(() => p.importProgressFromJson(value, day));
});
test('failed generation leaves draft; late writing feedback preserves newer lesson and completion', () => {
  let state = p.createDefaultProgress(day); const first = c.makePracticeLesson(state, 'cases', day);
  state = prepare(state, first); state = p.completeLesson(state, first, day); const second = c.makePracticeLesson(state, 'requests', day);
  state = p.saveGeneratedLesson(state, second, day);
  const feedback = { correctedText: 'Ich lerne Deutsch.', levelEstimate: null, score: 5, strengths: [], corrections: [], grammarTipsRu: [], nextPracticeRu: 'Еще одна попытка' };
  state = p.recordWritingFeedback(state, first.id, feedback, day, 'старое письмо');
  assert.equal(state.currentGeneratedLessonId, second.id); assert.equal(state.completedLessonIds.length, 1); assert.ok(state.drafts[first.id].answers.freePrompt);
  assert.throws(() => p.saveGeneratedLesson(state, { id: 'invalid' }, day)); assert.equal(state.currentGeneratedLessonId, second.id);
});
test('error deduplication ignores style; recurrence reopens a retained error', () => {
  let state = p.createDefaultProgress(day);
  const feedback = { correctedText: 'Text', levelEstimate: null, score: 5, strengths: [], grammarTipsRu: [], nextPracticeRu: 'Practice', corrections: [{ original: 'ich lerne', corrected: 'Ich lerne', explanationRu: 'Заглавная буква', skillId: 'word-order', kind: 'error' }, { original: 'gern', corrected: 'gerne', explanationRu: 'Стиль', skillId: 'writing', kind: 'style' }] };
  state = p.recordWritingFeedback(state, 'one', feedback, day); state = p.recordWritingFeedback(state, 'one', feedback, day); assert.equal(state.mistakeLog.length, 1);
  const id = state.mistakeLog[0].id; state = p.recordMistakePractice(state, id, true, day); state = p.recordMistakePractice(state, id, true, new Date('2026-10-01T12:00:00Z'));
  assert.equal(state.mistakeLog[0].status, 'retained'); state = p.recordWritingFeedback(state, 'two', feedback, new Date('2026-10-02T12:00:00Z')); assert.equal(state.mistakeLog[0].status, 'open');
});
test('completed active lesson is shown today; tomorrow planner selects next; full draft survives import', () => {
  let state = p.createDefaultProgress(day); let lesson = c.makePracticeLesson(state, 'word-order', day, 'diagnostic'); state = p.completeLesson(prepare(state, lesson), lesson, day);
  assert.equal(schedule.getCurrentLesson(state, day).id, lesson.id); assert.notEqual(schedule.getCurrentLesson(state, new Date('2026-09-29T12:00:00Z')).id, lesson.id);
  const restored = p.importProgressFromJson(JSON.stringify(state), day); assert.equal(restored.drafts[lesson.id].answers.freePrompt, state.drafts[lesson.id].answers.freePrompt);
});
test('speech cumulative events replace the current session rather than duplicating final phrases', () => {
  const { recognitionText } = load('src/lib/speech.ts');
  const first = recognitionText('Before.', [{ isFinal: true, 0: { transcript: 'Ich lerne Deutsch.' } }]);
  const second = recognitionText('Before.', [{ isFinal: true, 0: { transcript: 'Ich lerne Deutsch.' } }, { isFinal: true, 0: { transcript: 'Weil ich hier wohne.' } }]);
  assert.equal(first.transcript, 'Before. Ich lerne Deutsch.'); assert.equal(second.transcript, 'Before. Ich lerne Deutsch. Weil ich hier wohne.');
});
