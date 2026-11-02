// מצב הדגמה: אותו ממשק כמו Firebase, אבל הכל נשמר ב-localStorage של הדפדפן.
const DB_KEY = 'bl-demo-db-v1';
const USER_KEY = 'bl-demo-user';

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be blocked */ }
}
const clone = (v) => JSON.parse(JSON.stringify(v));
const newId = () => Math.random().toString(36).slice(2, 12);

export function createLocalBackend() {
  const db = load(DB_KEY, {});
  let user = load(USER_KEY, null);
  const listeners = new Set();
  const authListeners = new Set();

  const listOf = (col, filter) => Object.entries(db[col] || {})
    .map(([id, d]) => ({ id, ...d }))
    .filter((d) => !filter || d[filter[0]] === filter[1]);
  const commit = (col) => {
    save(DB_KEY, db);
    for (const l of [...listeners]) if (l.col === col) l.fire();
  };
  const colOf = (col) => (db[col] ||= {});

  return {
    subscribe(col, filter, cb) {
      const l = { col, fire: () => cb(clone(listOf(col, filter))) };
      listeners.add(l);
      l.fire();
      return () => listeners.delete(l);
    },
    subscribeDoc(col, id, cb) {
      const l = { col, fire: () => { const d = db[col]?.[id]; cb(d ? clone({ id, ...d }) : null); } };
      listeners.add(l);
      l.fire();
      return () => listeners.delete(l);
    },
    async list(col, filter) { return clone(listOf(col, filter)); },
    async get(col, id) { const d = db[col]?.[id]; return d ? clone({ id, ...d }) : null; },
    async add(col, data) {
      const id = newId();
      colOf(col)[id] = clone({ ...data, createdAt: Date.now() });
      commit(col);
      return id;
    },
    async set(col, id, data, merge = true) {
      colOf(col)[id] = clone(merge ? { ...(db[col]?.[id] || {}), ...data } : data);
      commit(col);
    },
    async update(col, id, data) {
      if (!db[col]?.[id]) throw new Error('המסמך לא נמצא');
      Object.assign(db[col][id], clone(data));
      commit(col);
    },
    async remove(col, id) {
      if (db[col]) delete db[col][id];
      commit(col);
    },

    onAuth(cb) {
      authListeners.add(cb);
      cb(user);
      return () => authListeners.delete(cb);
    },
    async signInDemo(name) {
      user = { uid: 'demo-' + newId(), displayName: name };
      save(USER_KEY, user);
      authListeners.forEach((f) => f(user));
    },
    async signOut() {
      user = null;
      save(USER_KEY, null);
      authListeners.forEach((f) => f(user));
    },
  };
}
