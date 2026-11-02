import { backend } from './backend.js';
import {
  DEFAULT_CONTENT, DEFAULT_DEFINITION, DEFAULT_COMPASS, DEFAULT_CATEGORIES, DEFAULT_READINGS, DEFAULT_CARDS, DEFAULT_JOURNAL,
} from '../content/defaults.js';

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

  await seedCollection('definitionVersions', [{ id: 'v1', text: DEFAULT_DEFINITION, note: 'הגרסה הראשונה', name: 'אבי' }]);
  await seedCollection('compass', DEFAULT_COMPASS);
  await seedCollection('categories', DEFAULT_CATEGORIES);
  await seedCollection('readings', DEFAULT_READINGS);
  await seedCollection('cards', DEFAULT_CARDS, (c) => `${c.deck}-${c.order}`);
  await seedCollection('journal', DEFAULT_JOURNAL);

  if (!(await backend.get('settings', 'site'))) {
    await backend.set('settings', 'site', { musicUrl: '', musicTitle: '', meditationUrl: '', meditationTitle: '' });
    written.push('settings/site');
  }
  return written;
}
