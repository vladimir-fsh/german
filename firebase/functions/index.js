"use strict";
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { createHandler, TutorError } = require('./tutor');
const { createQuota } = require('./quota');
const { createKeyStore, createSettingsHandler } = require('./key-store');

initializeApp();
const owner = defineString('TUTOR_OWNER_UID', { description: 'UID владельца личного чата из Firebase Authentication' });
const db = getFirestore();
const store = createKeyStore({ secrets: new SecretManagerServiceClient(), db, timestamp: () => FieldValue.serverTimestamp() });
const handle = createHandler({ getOwner: () => owner.value(), getSecret: uid => store.read(uid), quota: createQuota(db) });
const settings = createSettingsHandler({ getOwner: () => owner.value(), store,
  quota: createQuota(db, Date.now, { collection: 'tutorKeyUsage', perMinute: 2, daily: 10, leaseMs: 120000 }) });
const options = {
  region: 'europe-west3', cors: ['https://vladimir-fsh.github.io'],
  serviceAccount: 'german-tutor@deutsch-a2-b1.iam.gserviceaccount.com',
  timeoutSeconds: 70, memory: '256MiB', minInstances: 0, maxInstances: 1, concurrency: 10
};

function callable(handler) { return onCall(options, async request => {
  try { return await handler(request); }
  catch (e) {
    if (e instanceof TutorError) throw new HttpsError(e.code, e.message);
    throw new HttpsError('unavailable', 'Сервис объяснений временно недоступен. Повторите позже.');
  }
}); }
exports.explainGerman = callable(handle);
exports.tutorSettings = callable(settings);
