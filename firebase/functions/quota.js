"use strict";
const { randomUUID } = require('node:crypto');
const { TutorError } = require('./tutor');

function createQuota(db, now = Date.now, options = {}) {
  const perMinute = options.perMinute || 5, daily = options.daily || 60;
  function ref(uid) { return db.collection(options.collection || 'tutorUsage').doc(uid); }
  return {
    async reserve(uid) {
      const lease = randomUUID();
      await db.runTransaction(async tx => {
        const doc = await tx.get(ref(uid)), old = doc.exists ? doc.data() : {};
        const time = now(), minute = Math.floor(time / 60000), day = Math.floor(time / 86400000);
        const minuteCount = old.minute === minute ? old.minuteCount || 0 : 0;
        const dayCount = old.day === day ? old.dayCount || 0 : 0;
        if (old.busyUntil > time) throw new TutorError('resource-exhausted', 'Предыдущий запрос ещё обрабатывается. Подождите его завершения.');
        if (minuteCount >= perMinute || dayCount >= daily) throw new TutorError('resource-exhausted', 'Достигнут лимит: ' + perMinute + ' запросов в минуту или ' + daily + ' в сутки.');
        tx.set(ref(uid), { minute, day, minuteCount: minuteCount + 1, dayCount: dayCount + 1, lease, busyUntil: time + (options.leaseMs || 65000) });
      });
      return lease;
    },
    async release(uid, lease) {
      await db.runTransaction(async tx => {
        const doc = await tx.get(ref(uid));
        if (doc.exists && doc.data().lease === lease) tx.update(ref(uid), { busyUntil: 0 });
      });
    }
  };
}
module.exports = { createQuota };
