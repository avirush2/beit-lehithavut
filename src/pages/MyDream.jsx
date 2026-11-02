import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useDoc, useContent } from '../lib/store.jsx';
import Comments from '../components/Comments.jsx';
import { Paths } from '../components/Layout.jsx';
import { PageHead } from '../components/Botanical.jsx';
import { Empty, Loading, Prose } from '../components/ui.jsx';

const byDate = (a, b) => String(b.date || '').localeCompare(String(a.date || '')) || (b.createdAt || 0) - (a.createdAt || 0);
const showDate = (d) => (d ? new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

function EntryForm({ entry, onDone }) {
  const [title, setTitle] = useState(entry?.title || '');
  const [date, setDate] = useState(entry?.date || new Date().toISOString().slice(0, 10));
  const [body, setBody] = useState(entry?.body || '');
  const save = async (e) => {
    e.preventDefault();
    const data = { title: title.trim(), date, body };
    if (entry) await backend.update('journal', entry.id, data);
    else await backend.add('journal', data);
    onDone();
  };
  return (
    <form className="card form" onSubmit={save}>
      <label className="field"><span className="field-label">כותרת</span><input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
      <label className="field"><span className="field-label">תאריך</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <label className="field"><span className="field-label">הרשומה</span>
        <textarea rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
        <span className="hint">שורה ריקה = פסקה חדשה. "* " בתחילת שורה = פריט ברשימה. "## " = כותרת.</span>
      </label>
      <div className="row-end">
        <button type="button" className="btn btn-ghost" onClick={onDone}>ביטול</button>
        <button className="btn">שמירה</button>
      </div>
    </form>
  );
}

export function MyDreamList() {
  const { isAdmin } = useAuth();
  const entries = useCollection('journal')?.slice().sort(byDate);
  const openQuestion = useContent('openQuestion');
  const [adding, setAdding] = useState(false);

  return (
    <div className="page">
      <PageHead spaceKey="journal" lead="המרחב הזה הוא גם בית לחקר שלי. כאן אני כותב את החלום כפי שהוא מתהווה – ומזמין שיחה סביבו. — אבי" />
      {isAdmin ? (adding ? <EntryForm onDone={() => setAdding(false)} /> : <button type="button" className="btn" onClick={() => setAdding(true)}>רשומה חדשה</button>) : null}
      {entries == null ? <Loading /> : entries.length === 0 ? <Empty>היומן עוד ריק.</Empty> : (
        <ol className="journal-list">
          {entries.map((e) => (
            <li key={e.id}>
              <Link to={`/my-dream/${e.id}`} className="card journal-item">
                <time className="muted small">{showDate(e.date)}</time>
                <h2>{e.title}</h2>
                <p className="excerpt">{(e.body || '').replace(/[#*]/g, '').slice(0, 220)}…</p>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <section className="section open-question">
        <p className="eyebrow">השאלה הפתוחה</p>
        <p className="question">{openQuestion}</p>
      </section>
      <Paths keys={['dreams', 'tickle']} text="ומה החלום שלך?" />
    </div>
  );
}

export function MyDreamEntry() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const entry = useDoc('journal', id);
  const [editing, setEditing] = useState(false);

  if (entry === undefined) return <div className="page"><Loading /></div>;
  if (entry === null) return <div className="page"><Empty>הרשומה לא נמצאה. <Link to="/my-dream">חזרה ליומן</Link></Empty></div>;

  return (
    <div className="page">
      <Link to="/my-dream" className="back">→ היומן</Link>
      {editing ? <EntryForm entry={entry} onDone={() => setEditing(false)} /> : (
        <article className="reading">
          <time className="muted small">{showDate(entry.date)}</time>
          <h1>{entry.title}</h1>
          <Prose text={entry.body} />
          {isAdmin ? (
            <div className="host-actions">
              <button type="button" className="link-btn" onClick={() => setEditing(true)}>עריכה</button>
              <button type="button" className="link-btn quiet" onClick={async () => {
                if (window.confirm('למחוק את הרשומה?')) { await backend.remove('journal', entry.id); navigate('/my-dream'); }
              }}>מחיקה</button>
            </div>
          ) : null}
        </article>
      )}
      <section className="section">
        <h2>שיחה</h2>
        <Comments targetType="journal" targetId={entry.id} placeholder="מה זה מעורר בך?" />
      </section>
    </div>
  );
}
