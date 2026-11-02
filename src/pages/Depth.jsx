import { useState } from 'react';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, byNewest, byOrder, visibleFor } from '../lib/store.jsx';
import { SPRINGS, STUDY_TOPICS } from '../content/defaults.js';
import Comments from '../components/Comments.jsx';
import { Paths } from '../components/Layout.jsx';
import { Motif, PageHead } from '../components/Botanical.jsx';
import { Chips, Empty, ItemActions, Prose } from '../components/ui.jsx';

const MODES = ['לבד', 'בצמד', 'בחבורה'];

function StudyCircles() {
  const { user, isHost, requireUser, stamp, name } = useAuth();
  const circles = visibleFor(useCollection('studyCircles'), isHost)?.sort(byNewest);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [spring, setSpring] = useState([]);
  const [mode, setMode] = useState(['בחבורה']);
  const [description, setDescription] = useState('');

  const create = async (e) => {
    e.preventDefault();
    if (!requireUser() || !topic.trim()) return;
    await backend.add('studyCircles', {
      topic: topic.trim(), spring: spring[0] || '', mode: mode[0] || '', description: description.trim(),
      members: [{ uid: user.uid, name }], ...stamp(),
    });
    setOpen(false); setTopic(''); setDescription(''); setSpring([]);
  };

  const toggleJoin = async (c) => {
    if (!requireUser()) return;
    const members = c.members || [];
    const inIt = members.some((m) => m.uid === user.uid);
    await backend.update('studyCircles', c.id, {
      members: inIt ? members.filter((m) => m.uid !== user.uid) : [...members, { uid: user.uid, name }],
    });
  };

  return (
    <section className="section">
      <h2>חבורות לימוד</h2>
      <p className="muted">בוחרים נושא, מעיין השראה ואופן למידה. מי שמרגיש.ה משיכה – מצטרפ.ת.</p>
      {open ? (
        <form className="card form" onSubmit={create}>
          <label className="field"><span className="field-label">נושא המחקר</span>
            <input list="study-topics" value={topic} onChange={(e) => setTopic(e.target.value)} required />
            <datalist id="study-topics">{STUDY_TOPICS.map((t) => <option key={t} value={t} />)}</datalist>
          </label>
          <div className="field"><span className="field-label">מעיין ההשראה</span>
            <Chips options={SPRINGS.map((s) => s.title)} value={spring} onChange={setSpring} single />
          </div>
          <div className="field"><span className="field-label">אופן הלמידה</span><Chips options={MODES} value={mode} onChange={setMode} single /></div>
          <label className="field"><span className="field-label">כמה מילים על הכוונה</span>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="להתבונן, לשהות, להקשיב, ליצור, לחקור, לנוע…" />
          </label>
          <div className="row-end"><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>ביטול</button><button className="btn">פתיחת חבורה</button></div>
        </form>
      ) : <button type="button" className="btn" onClick={() => requireUser() && setOpen(true)}>לפתוח נושא למחקר</button>}

      {circles?.length ? (
        <div className="grid">
          {circles.map((c) => {
            const inIt = user && (c.members || []).some((m) => m.uid === user.uid);
            return (
              <article key={c.id} className={`card circle ${c.hidden ? 'is-hidden' : ''}`}>
                <div className="badges">
                  {c.mode ? <span className="badge">{c.mode}</span> : null}
                  {c.spring ? <span className="badge compass-badge">{c.spring}</span> : null}
                </div>
                <h3>{c.topic}</h3>
                {c.description ? <p>{c.description}</p> : null}
                <p className="muted small">{(c.members || []).map((m) => m.name).join(', ')}</p>
                <div className="row-between">
                  <button type="button" className="btn btn-small btn-ghost" onClick={() => toggleJoin(c)}>{inIt ? 'לעזוב' : 'להצטרף'}</button>
                  <ItemActions col="studyCircles" item={c} />
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default function Depth() {
  const intro = useContent('depthIntro');
  const deep = useContent('depthDeep');
  const assumptions = useContent('assumptions');
  const readings = useCollection('readings')?.slice().sort(byOrder) || [];

  return (
    <div className="page">
      <PageHead spaceKey="depth" lead={intro} deep={deep} />

      <section className="section">
        <h2>ארבעה מעיינות</h2>
        <div className="springs">
          {SPRINGS.map((s, i) => {
            const items = readings.filter((r) => r.spring === s.key);
            return (
              <article key={s.key} className={`card spring tone-${['sun', 'turquoise', 'sage', 'blossom'][i % 4]}`}>
                <Motif kind="spring" size={44} />
                <h3>{s.title}</h3>
                <p className="spring-short">{s.short}</p>
                <details className="deeper inline"><summary>להעמיק</summary><p className="muted">{s.text}</p></details>
                {items.length ? (
                  <ul className="readings">
                    {items.map((r) => (
                      <li key={r.id}>
                        {r.url ? <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a> : <strong>{r.title}</strong>}
                        {r.author ? <span className="muted"> · {r.author}</span> : null}
                        {r.note ? <p className="small">{r.note}</p> : null}
                      </li>
                    ))}
                  </ul>
                ) : <Empty>עוד אין כאן מקורות.</Empty>}
              </article>
            );
          })}
        </div>
      </section>

      <details className="card assumptions">
        <summary>נקודות הנחה לפתח הלימוד</summary>
        <Prose text={assumptions} />
      </details>

      <StudyCircles />

      <section className="section">
        <h2>הצעות למקורות ושיחה על מהות השינוי</h2>
        <Comments targetType="depth" targetId="library" placeholder="ספר, מאמר, מקום, מסורת, ניסוי שכבר קיים – או מחשבה על השינוי שמתקיים עכשיו" />
      </section>
      <Paths keys={['categories', 'tickle', 'new']} />
    </div>
  );
}
