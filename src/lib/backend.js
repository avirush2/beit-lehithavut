import { firebaseConfig } from '../firebase-config.js';
import { createFirebaseBackend } from './firebaseBackend.js';
import { createLocalBackend } from './localBackend.js';

// שני מימושים עם אותו ממשק: Firebase אמיתי, או מצב הדגמה שנשמר בדפדפן.
export const isDemo = !firebaseConfig.apiKey;
export const backend = isDemo ? createLocalBackend() : createFirebaseBackend(firebaseConfig);
