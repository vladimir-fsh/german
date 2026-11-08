/* Значение ключа - только в Secret Manager. Firestore хранит указатель на версию. */
"use strict";
const { TutorError, authorize } = require('./tutor');

function createKeyStore({ secrets, db, timestamp }) {
  function ref(uid) { return db.collection('tutorSettings').doc(uid); }
  async function parent() { return 'projects/' + await secrets.getProjectId() + '/secrets/OPENAI_API_KEY'; }
  function isVersion(name, resource) {
    if (typeof name !== 'string') return false;
    const match = /^projects\/([^/]+)\/secrets\/OPENAI_API_KEY\/versions\/([1-9]\d*)$/.exec(name);
    // Google может вернуть канонический номер проекта вместо его ID.
    // Указатель пишет только сервер; IAM допускает чтение лишь одного секрета.
    return !!(match && (match[1] === resource.split('/')[1] || /^\d+$/.test(match[1])));
  }
  async function version(uid) {
    const doc = await ref(uid).get();
    if (!doc.exists) return null;
    const name = doc.data().version;
    if (!isVersion(name, await parent()))
      throw new TutorError('failed-precondition', 'Настройки ключа повреждены. Сохраните ключ заново.');
    return name;
  }
  return {
    async status(uid) { return { configured: !!(await version(uid)) }; },
    async read(uid) {
      const name = await version(uid);
      if (!name) return '';
      // Точный номер версии читается согласованно сразу после сохранения.
      const [result] = await secrets.accessSecretVersion({ name }, { timeout: 10000 });
      if (!result.payload || !result.payload.data) return '';
      return Buffer.from(result.payload.data).toString('utf8');
    },
    async save(uid, key) {
      const name = await parent();
      const bytes = Buffer.from(key, 'utf8');
      let added;
      try { [added] = await secrets.addSecretVersion({ parent: name, payload: { data: bytes } }, { timeout: 10000 }); }
      finally { bytes.fill(0); }
      if (!added || !isVersion(added.name, name))
        throw new TutorError('unavailable', 'Не удалось сохранить ключ. Повторите позже.');
      // Если эта запись не сохранится, прежняя версия останется активной.
      await ref(uid).set({ version: added.name, updatedAt: timestamp() });
      return { configured: true };
    }
  };
}

function createSettingsHandler({ getOwner, store, quota }) {
  return async request => {
    const owner = authorize(request, getOwner), data = request.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new TutorError('invalid-argument', 'Некорректные настройки чата.');
    if (data.action === 'status' && Object.keys(data).length === 1) return store.status(owner);
    if (data.action !== 'save' || Object.keys(data).some(k => !['action','key'].includes(k)) ||
        typeof data.key !== 'string' || !/^sk-[\w-]{10,500}$/.test(data.key.trim()))
      throw new TutorError('invalid-argument', 'Проверьте ключ OpenAI: он должен начинаться с sk-.');
    const lease = await quota.reserve(owner);
    try { return await store.save(owner, data.key.trim()); }
    catch (e) {
      // Не отправляем клиенту сообщения SDK: они могут содержать входные данные.
      if (e instanceof TutorError) throw e;
      throw new TutorError('unavailable', 'Не удалось сохранить ключ в Firebase. Повторите позже.');
    } finally { await quota.release(owner, lease).catch(() => {}); }
  };
}
module.exports = { createKeyStore, createSettingsHandler };
