import { useState } from 'react';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useSprings, useT, byNewest, visibleFor } from '../lib/store.jsx';
import { STUDY_TOPICS } from '../content/defaults.js';
import { Chips, ItemActions } from '../components/ui.jsx';

const MODES = ['לבד', 'בצמד', 'בחבורה'];

// ללמוד יחד: קבוצות למידה פתוחות – חלק בספריה
export default function StudyCircles() {
  const { user, isHost, requireUser, stamp, name } = useAuth();
  const t = useT();
  const circles = visibleFor(useCollection('studyCircles'), isHost)?.sort(byNewest);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [spring, setSpring] = useState([]);
  const [mode, setMode] = useState(['בחבורה']);
  const [description, setDescription] = useState('');
  const SPRINGS = useSprings();

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
    <section className="section" id="circles">
      <h2>{t('happenings-circles')}</h2>
      <p className="muted">בוחרים נושא, מעיין השראה ואופן למידה. מי שמרגיש.ה משיכה – מצטרפ.ת.</p>
      {open ? (
        <form className="card form" onSubmit={create}>
          <label className="field"><span className="field-label">נושא המחקר</span>
            <input list="study-topics" value={topic} onChange={(e) => setTopic(e.target.value)} required />
            <datalist id="study-topics">{STUDY_TOPICS.map((x) => <option key={x} value={x} />)}</datalist>
          </label>
          <div className="field"><span className="field-label">מעיין ההשראה</span>
            <Chips options={SPRINGS.map((s) => s.title)} value={spring} onChange={setSpring} single />
          </div>
          <div className="field"><span className="field-label">אופן הלמידה</span><Chips options={MODES} value={mode} onChange={setMode} single /></div>
          <label className="field"><span className="field-label">כמה מילים על הכוונה</span>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="להתבונן, לשהות, להקשיב, ליצור, לחקור, לנוע…" />
          </label>
          <div className="row-end"><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>ביטול</button><button className="btn">פתיחת קבוצה</button></div>
        </form>
      ) : <button type="button" className="btn btn-ghost" onClick={() => requireUser() && setOpen(true)}>לפתוח נושא למחקר</button>}

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
