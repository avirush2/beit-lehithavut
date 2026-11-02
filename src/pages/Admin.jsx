import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { backend, isDemo } from '../lib/backend.js';
import { useAuth, useCollection, useDoc, byNewest, byOrder } from '../lib/store.jsx';
import { seedMissing, upgradeWording } from '../lib/seed.js';
import { nextHarvest } from '../lib/seasons.js';
import { DEFAULT_CONTENT, SPRINGS } from '../content/defaults.js';
import { Empty, Loading, formatDate } from '../components/ui.jsx';

const TEXTS = [
  ['welcomeBody', 'שער הכניסה – טקסט הפתיחה'],
  ['welcomeQuestion', 'שער הכניסה – השאלה מעל השבילים'],
  ['openQuestion', 'שאלה שמלווה אותנו (בשער הכניסה)'],
  ['timingTitle', 'העיתוי – כותרת'],
  ['timingIntro', 'העיתוי – משפט פתיחה'],
  ['timingQuestions', 'העיתוי – שאלות להתבוננות (שאלה בכל שורה)'],
  ['timingBody', 'העיתוי – להעמיק (הכתיבה של אבי)'],
  ['voicesIntro', 'הזמנה ל"קולות מהתפר"'],
  ['dreamsIntro', 'החלום הרחב – פתיח קצר'],
  ['dreamsDeep', 'החלום הרחב – להעמיק'],
  ['categoriesIntro', 'מרחבי חיים – פתיח קצר'],
  ['categoriesDeep', 'מרחבי חיים – להעמיק'],
  ['harvestIntro', 'פתיח לקצירים'],
  ['depthIntro', 'מעמיקים ומשתנים – פתיח קצר'],
  ['depthDeep', 'מעמיקים ומשתנים – להעמיק'],
  ['assumptions', 'נקודות הנחה'],
  ['tickleIntro', 'דגדוג חלומות – פתיח קצר'],
  ['tickleDeep', 'דגדוג חלומות – "ומה אם אין לי חלום?"'],
  ['painIntro', 'מהתפר – פתיח קצר'],
  ['painDeep', 'מהתפר – להעמיק'],
  ['newIntro', 'מהו חדש – פתיח'],
];

function TextEditor({ k, label }) {
  const doc = useDoc('content', k);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => { if (doc !== undefined) setValue(doc?.body ?? DEFAULT_CONTENT[k] ?? ''); }, [doc, k]);
  const save = async () => { await backend.set('content', k, { body: value }); setStatus('נשמר'); setTimeout(() => setStatus(''), 1800); };
  const short = (DEFAULT_CONTENT[k] || '').length < 120 && !(DEFAULT_CONTENT[k] || '').includes('\n');
  return (
    <div className="card form">
      <span className="field-label">{label}</span>
      {short ? <input value={value} onChange={(e) => setValue(e.target.value)} /> : <textarea rows={Math.min(18, 4 + Math.round(value.length / 120))} value={value} onChange={(e) => setValue(e.target.value)} />}
      <div className="row-end">{status ? <span className="notice inline">{status}</span> : null}<button type="button" className="btn btn-small" onClick={save}>שמירה</button></div>
    </div>
  );
}

// עורך כללי לאוסף: שורה לכל פריט, שדות לפי הגדרה
function CollectionEditor({ col, fields, blank, filter }) {
  const items = useCollection(col)?.slice().sort(byOrder);
  const shown = items && filter ? items.filter(filter) : items;
  const [drafts, setDrafts] = useState({});
  const edit = (id, key, value) => setDrafts((d) => ({ ...d, [id]: { ...(d[id] || {}), [key]: value } }));
  const val = (item, key) => (drafts[item.id]?.[key] ?? item[key] ?? '');
  const save = async (item) => {
    if (!drafts[item.id]) return;
    await backend.update(col, item.id, drafts[item.id]);
    setDrafts((d) => { const n = { ...d }; delete n[item.id]; return n; });
  };
  const add = async () => {
    const max = Math.max(0, ...(items || []).map((i) => i.order || 0));
    await backend.add(col, { ...blank, order: max + 1 });
  };
  if (shown == null) return <Loading />;
  return (
    <div className="editor">
      {shown.map((item) => (
        <div key={item.id} className="card editor-row">
          {fields.map((f) => (
            <label key={f.key} className={`field ${f.type === 'textarea' ? 'grow' : ''}`}>
              <span className="field-label">{f.label}</span>
              {f.type === 'textarea' ? <textarea rows={3} value={val(item, f.key)} onChange={(e) => edit(item.id, f.key, e.target.value)} />
                : f.type === 'select' ? (
                  <select value={val(item, f.key)} onChange={(e) => edit(item.id, f.key, e.target.value)}>
                    {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ) : f.type === 'checkbox' ? <input type="checkbox" checked={!!val(item, f.key)} onChange={(e) => edit(item.id, f.key, e.target.checked)} />
                  : f.type === 'number' ? <input type="number" value={val(item, f.key)} onChange={(e) => edit(item.id, f.key, Number(e.target.value))} />
                    : <input value={val(item, f.key)} onChange={(e) => edit(item.id, f.key, e.target.value)} dir={f.ltr ? 'ltr' : undefined} />}
            </label>
          ))}
          <div className="row-end">
            <button type="button" className="link-btn quiet" onClick={() => window.confirm('למחוק?') && backend.remove(col, item.id)}>מחיקה</button>
            <button type="button" className="btn btn-small" disabled={!drafts[item.id]} onClick={() => save(item)}>שמירה</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-ghost" onClick={add}>+ הוספה</button>
    </div>
  );
}

function Reports() {
  const reports = useCollection('reports')?.sort(byNewest);
  if (reports == null) return <Loading />;
  if (!reports.length) return <Empty>אין דיווחים פתוחים.</Empty>;
  return (
    <ul className="admin-list">
      {reports.map((r) => (
        <li key={r.id} className="card">
          <p><strong>{r.reason}</strong> · דווח על ידי {r.name} · {formatDate(r.createdAt)}</p>
          {r.note ? <p className="muted">{r.note}</p> : null}
          <div className="row-start wrap">
            <Link to={r.path} className="link-btn">לצפייה</Link>
            <button type="button" className="btn btn-small" onClick={async () => { await backend.update(r.col, r.targetId, { hidden: true }).catch(() => {}); await backend.remove('reports', r.id); }}>הסתרת התוכן</button>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => backend.remove('reports', r.id)}>אין צורך בפעולה</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function People() {
  const { isAdmin, owner } = useAuth();
  const users = useCollection('users')?.sort(byNewest);
  if (users == null) return <Loading />;
  return (
    <>
      <p className="muted">מארחים יכולים לערוך תוכן, להסתיר ולטפל בדיווחים. מנהלים יכולים גם לתת הרשאות.</p>
      <ul className="admin-list">
        {users.map((u) => (
          <li key={u.id} className="card row-between wrap">
            <span><strong>{u.displayName}</strong> <span className="muted small">· הצטרפ.ה {formatDate(u.createdAt)}</span></span>
            {owner?.uid === u.id ? <span className="badge">מארח ראשי</span> : (
              <select value={u.role || 'member'} disabled={!isAdmin} onChange={(e) => backend.update('users', u.id, { role: e.target.value })}>
                <option value="member">משתתפ.ת</option>
                <option value="host">מארח.ת</option>
                <option value="admin">מנהל.ת</option>
              </select>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function Settings() {
  const doc = useDoc('settings', 'site');
  const [s, setS] = useState({});
  const [status, setStatus] = useState('');
  useEffect(() => { if (doc !== undefined) setS(doc || {}); }, [doc]);
  const f = (key, label, hint) => (
    <label className="field"><span className="field-label">{label}</span>
      <input value={s[key] || ''} onChange={(e) => setS({ ...s, [key]: e.target.value })} dir={key.endsWith('Url') ? 'ltr' : undefined} />
      {hint ? <span className="hint">{hint}</span> : null}
    </label>
  );
  return (
    <div className="card form">
      {f('musicUrl', 'קישור לקובץ מוזיקת רקע', 'קובץ mp3. הדרך הפשוטה: לשים את הקובץ בתיקייה public/audio ולכתוב כאן /audio/שם-הקובץ.mp3')}
      {f('musicTitle', 'שם היצירה (מופיע במעבר עכבר)')}
      {f('meditationUrl', 'קישור לקובץ מדיטציה מונחית', 'מופיע בדף דגדוג החלומות. גם כאן: /audio/שם-הקובץ.mp3')}
      {f('meditationTitle', 'כותרת המדיטציה')}
      <p className="hint">חשוב: רק מוזיקה שלך או ברישיון שימוש חופשי.</p>
      <div className="row-end">{status ? <span className="notice inline">{status}</span> : null}
        <button type="button" className="btn" onClick={async () => { await backend.set('settings', 'site', s); setStatus('נשמר'); setTimeout(() => setStatus(''), 1800); }}>שמירה</button>
      </div>
    </div>
  );
}

function Start() {
  const categories = useCollection('categories')?.filter((c) => c.active).sort(byOrder) || [];
  const harvests = useCollection('harvests') || [];
  const [result, setResult] = useState(null);
  const [upgraded, setUpgraded] = useState(null);
  const [busy, setBusy] = useState(false);
  const next = nextHarvest();
  const done = (catId) => harvests.some((h) => h.categoryId === catId && h.season === next?.label);

  return (
    <>
      <section className="card">
        <h2>תוכן הפתיחה</h2>
        <p className="muted">טוען את הטקסטים, ההגדרה, המצפן, מרחבי החיים, הקלפים, הספרייה והרשומה הראשונה ביומן. רק מה שעוד חסר נכתב – עריכות קיימות לא נדרסות.</p>
        <button type="button" className="btn" disabled={busy} onClick={async () => { setBusy(true); try { setResult(await seedMissing()); } finally { setBusy(false); } }}>טעינת תוכן הפתיחה</button>
        {result ? <p className="notice">{result.length ? `נטען: ${result.join(', ')}` : 'הכל כבר קיים.'}</p> : null}
      </section>
      <section className="card">
        <h2>עדכון לנוסח החדש</h2>
        <p className="muted">מעדכן את הטקסטים ואת מרחבי החיים לנוסח האחרון (קול משותף, פתיח קצר ושכבת "להעמיק"), ומוסיף טקסטים חדשים. טקסט שערכת בעצמך לא משתנה.</p>
        <button type="button" className="btn" disabled={busy} onClick={async () => { setBusy(true); try { setUpgraded(await upgradeWording()); } finally { setBusy(false); } }}>עדכון לנוסח החדש</button>
        {upgraded ? <p className="notice">{upgraded.length ? upgraded.join(' · ') : 'הכל כבר מעודכן.'}</p> : null}
      </section>
      <section className="card">
        <h2>הקציר הבא</h2>
        {next ? <p><strong>{next.label}</strong> · {next.date.toLocaleDateString('he-IL')} · {next.days === 0 ? 'היום' : `בעוד ${next.days} ימים`}</p> : null}
        <p className="muted">באנר תזכורת מופיע לכולם שבועיים לפני מעבר העונה. מצב הקציר בכל מרחב:</p>
        <ul className="harvest-status">
          {categories.map((c) => (
            <li key={c.id}><Link to={`/categories/${c.id}`}>{c.name}</Link> <span className={`badge ${done(c.id) ? '' : 'warn'}`}>{done(c.id) ? 'נאסף' : 'עוד לא'}</span></li>
          ))}
        </ul>
        <a className="btn btn-ghost" href="/harvest-reminders.ics" download>תזכורות קציר ליומן (Google / אאוטלוק)</a>
      </section>
    </>
  );
}

const TABS = [
  ['start', 'התחלה'], ['texts', 'טקסטים'], ['compass', 'מצפן'], ['categories', 'מרחבי חיים'],
  ['cards', 'קלפים'], ['readings', 'ספרייה'], ['reports', 'דיווחים'], ['people', 'משתתפים'], ['settings', 'הגדרות'],
];

export default function Admin() {
  const { user, loading, isHost, owner, openSignIn, stamp } = useAuth();
  const [tab, setTab] = useState('start');

  if (loading || owner === undefined) return <div className="page"><Loading /></div>;
  if (!user) return <div className="page"><Empty>צריך להיכנס קודם. <button type="button" className="link-btn" onClick={openSignIn}>כניסה</button></Empty></div>;

  if (!isDemo && owner === null) {
    return (
      <div className="page">
        <h1>הקמת המרחב</h1>
        <div className="card">
          <p>עוד אין מארח ראשי למרחב. מי שלוחצ.ת כאן ראשונ.ה הופכ.ת למארח.ת הראשי.ת – ואי אפשר לשנות את זה מהאתר.</p>
          <button type="button" className="btn" onClick={() => backend.set('meta', 'owner', { uid: user.uid, name: stamp().name, createdAt: Date.now() }, false)}>אני המארח הראשי</button>
        </div>
      </div>
    );
  }
  if (!isHost) return <div className="page"><Empty>הדף הזה מיועד למארחי המרחב.</Empty></div>;

  return (
    <div className="page admin">
      <h1>ניהול המרחב</h1>
      <div className="tabs wrap" role="tablist">
        {TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'start' ? <Start /> : null}
      {tab === 'texts' ? (
        <>
          <p className="hint">שורה ריקה = פסקה חדשה. "* " בתחילת שורה = פריט ברשימה. "## " = כותרת. רשומות היומן נערכות ישירות בדף "החלום שלי".</p>
          {TEXTS.map(([k, l]) => <TextEditor key={k} k={k} label={l} />)}
        </>
      ) : null}
      {tab === 'compass' ? (
        <CollectionEditor col="compass" blank={{ title: 'קו מנחה חדש', text: '', question: '' }} fields={[
          { key: 'title', label: 'שם' }, { key: 'text', label: 'הסבר', type: 'textarea' }, { key: 'question', label: 'שאלה לכותבים', type: 'textarea' }, { key: 'order', label: 'סדר', type: 'number' },
        ]} />
      ) : null}
      {tab === 'categories' ? (
        <CollectionEditor col="categories" blank={{ name: 'מרחב חדש', description: '', active: false }} fields={[
          { key: 'name', label: 'שם' }, { key: 'description', label: 'תיאור', type: 'textarea' }, { key: 'active', label: 'פעיל', type: 'checkbox' }, { key: 'order', label: 'סדר', type: 'number' },
        ]} />
      ) : null}
      {tab === 'cards' ? (
        <CollectionEditor col="cards" blank={{ deck: 'inside', text: '' }} fields={[
          { key: 'deck', label: 'חפיסה', type: 'select', options: [['inside', 'מבפנים'], ['reality', 'מהמציאות']] }, { key: 'text', label: 'הקלף', type: 'textarea' }, { key: 'order', label: 'סדר', type: 'number' },
        ]} />
      ) : null}
      {tab === 'readings' ? (
        <CollectionEditor col="readings" blank={{ spring: 'present', title: '', author: '', url: '', note: '' }} fields={[
          { key: 'spring', label: 'מעיין', type: 'select', options: SPRINGS.map((s) => [s.key, s.title]) },
          { key: 'title', label: 'כותרת' }, { key: 'author', label: 'מחבר.ת / מקום' }, { key: 'url', label: 'קישור', ltr: true }, { key: 'note', label: 'כמה מילים', type: 'textarea' }, { key: 'order', label: 'סדר', type: 'number' },
        ]} />
      ) : null}
      {tab === 'reports' ? <Reports /> : null}
      {tab === 'people' ? <People /> : null}
      {tab === 'settings' ? <Settings /> : null}
    </div>
  );
}
