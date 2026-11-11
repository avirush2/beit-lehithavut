import { backend } from './backend.js';
import {
  DEFAULT_CONTENT, DEFAULT_DEFINITION, DEFAULT_COMPASS, DEFAULT_CATEGORIES, DEFAULT_READINGS, DEFAULT_CARDS,
} from '../content/defaults.js';
import { PREVIOUS_CONTENT, PREVIOUS_CATEGORIES, PREVIOUS_DEFINITION } from '../content/previous.js';

// רשומות היומן הישן הופכות לחלומות רגילים בגן, בחתימת מי שמריץ.ה את העדכון (המארח הראשי).
// הרשומה המקורית לא נמחקת – היא מסומנת כמועברת ומוסתרת, והתגובות עוברות עם החלום.
async function moveJournalToGarden(stamp) {
  const written = [];
  const entries = await backend.list('journal');
  for (const entry of entries) {
    if (entry.movedTo) continue;
    const { id, title, body, date } = entry;
    if (!(await backend.get('dreams', id))) {
      const created = date ? new Date(date).getTime() : Date.now();
      await backend.set('dreams', id, {
        title, body, themes: ['אדמה ומזון', 'קהילה'], compass: [], ...stamp, createdAt: created || Date.now(),
      }, false);
    }
    const comments = await backend.list('comments', ['targetId', id]);
    for (const c of comments.filter((x) => x.targetType === 'journal')) {
      await backend.update('comments', c.id, { targetType: 'dream' });
    }
    await backend.update('journal', id, { movedTo: `dreams/${id}`, hidden: true });
    written.push(`הועבר לגן: ${title}`);
  }
  return written;
}

// מעדכן לנוסח החדש רק טקסטים שלא נערכו ידנית (שעדיין זהים לנוסח קודם),
// ומוסיף טקסטים חדשים שעוד חסרים. owner = האם המריצ.ה הוא המארח הראשי.
export async function upgradeWording({ stamp, isOwner } = {}) {
  const written = [];
  for (const [key, body] of Object.entries(DEFAULT_CONTENT)) {
    const doc = await backend.get('content', key);
    if (!doc) {
      await backend.set('content', key, { body });
      written.push(`חדש: ${key}`);
    } else if (doc.body !== body && (PREVIOUS_CONTENT[key] || []).includes(doc.body)) {
      await backend.set('content', key, { body });
      written.push(`עודכן: ${key}`);
    }
  }
  for (const cat of DEFAULT_CATEGORIES) {
    const doc = await backend.get('categories', cat.id);
    // נוסח מרחבי החיים לפי גרסה: מרחב שהגרסה שלו ישנה יותר מתעדכן כולו (פעם אחת), ומרחב חסר נוצר
    if (cat.wording && (doc?.wording || 1) < cat.wording) {
      const { id, ...fields } = cat;
      if (doc) await backend.update('categories', id, fields);
      else await backend.set('categories', id, fields);
      written.push(`מרחב: ${cat.name}`);
      continue;
    }
    const prev = PREVIOUS_CATEGORIES[cat.id];
    if (!prev || !doc) continue;
    const patch = {};
    for (const [field, oldValue] of Object.entries(prev)) {
      if (doc[field] === oldValue) patch[field] = cat[field];
    }
    if (Object.keys(patch).length) {
      await backend.update('categories', cat.id, patch);
      written.push(`מרחב: ${cat.name}`);
    }
  }

  const v1 = await backend.get('definitionVersions', 'v1');
  if (v1 && (v1.text === PREVIOUS_DEFINITION || v1.name)) {
    await backend.update('definitionVersions', 'v1', {
      ...(v1.text === PREVIOUS_DEFINITION ? { text: DEFAULT_DEFINITION } : {}), name: '',
    });
    written.push('ההגדרה: נוסח משותף');
  }

  if (isOwner && stamp) {
    written.push(...await moveJournalToGarden(stamp));
    const owner = await backend.get('meta', 'owner');
    if (owner?.name) {
      await backend.set('meta', 'owner', { uid: owner.uid, createdAt: owner.createdAt || Date.now() }, false);
      written.push('רשומת המארח: בלי שם');
    }
  }
  return written;
}

// כותב את תוכן הפתיחה רק היכן שעוד אין תוכן – כדי לא לדרוס עריכות.
export async function seedMissing() {
  const written = [];

  for (const [key, body] of Object.entries(DEFAULT_CONTENT)) {
    if (!(await backend.get('content', key))) {
      await backend.set('content', key, { body });
      written.push(`content/${key}`);
    }
  }

  const seedCollection = async (col, items, idOf) => {
    const existing = await backend.list(col);
    if (existing.length) return;
    for (const [i, item] of items.entries()) {
      const { id, ...data } = item;
      await backend.set(col, id || idOf(item, i), { ...data, createdAt: Date.now() + i }, false);
    }
    written.push(`${col} (${items.length})`);
  };

  await seedCollection('definitionVersions', [{ id: 'v1', text: DEFAULT_DEFINITION, note: 'הגרסה הראשונה' }]);
  await seedCollection('compass', DEFAULT_COMPASS);
  await seedCollection('categories', DEFAULT_CATEGORIES);
  await seedCollection('readings', DEFAULT_READINGS);
  await seedCollection('cards', DEFAULT_CARDS, (c) => `${c.deck}-${c.order}`);

  if (!(await backend.get('settings', 'site'))) {
    await backend.set('settings', 'site', { musicUrl: '', musicTitle: '', meditationUrl: '', meditationTitle: '' });
    written.push('settings/site');
  }
  return written;
}
