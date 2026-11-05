import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCollection, useContent, useSprings, useT, byOrder } from '../lib/store.jsx';
import Comments from '../components/Comments.jsx';
import { GroupHead } from '../components/Botanical.jsx';
import { openIdea } from '../components/IdeaButton.jsx';
import StudyCircles from './StudyCircles.jsx';
import { Empty, Loading, Prose, SpaceBadges, useLifeSpaces } from '../components/ui.jsx';

export function ReadingList({ items }) {
  const SPRINGS = useSprings();
  return (
    <ul className="reading-list">
      {items.map((r) => (
        <li key={r.id} className="card reading-item">
          <h3>{/^https?:\/\//i.test(r.url || '') ? <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a> : r.title}</h3>
          {r.author ? <p className="muted small">{r.author}</p> : null}
          {r.note ? <p>{r.note}</p> : null}
          <div className="badges">
            {r.spring ? <span className="badge compass-badge">{SPRINGS.find((s) => s.key === r.spring)?.title}</span> : null}
          </div>
          <SpaceBadges ids={r.spaces} />
        </li>
      ))}
    </ul>
  );
}

// התהוות ← ספריה: מקורות להעמקה וקבוצות למידה. הסינון הראשי – לפי מרחב חיים; המעיינות – סינון משני.
export default function Library() {
  const intro = useContent('depthIntro');
  const assumptions = useContent('assumptions');
  const t = useT();
  const readings = useCollection('readings')?.slice().sort(byOrder);
  const SPRINGS = useSprings();
  const spaces = useLifeSpaces();
  const [space, setSpace] = useState('');
  const [spring, setSpring] = useState('');
  const shown = readings?.filter((r) => (!space || r.spaces?.includes(space)) && (!spring || r.spring === spring));

  return (
    <div className="page">
      <GroupHead group="becoming" current="library" />
      <Prose text={intro} className="sub-lead" />
      <div className="row-start">
        <button type="button" className="btn" onClick={() => openIdea('idea', t('library-suggest-prompt'))}>{t('library-suggest')}</button>
        <Link to="/library#circles" className="btn btn-ghost">{t('happenings-circles')}</Link>
      </div>

      <section className="section">
        <div className="filters">
          <span className="field-label">לפי מרחב חיים</span>
          <div className="chips">
            <button type="button" className={`chip ${space ? '' : 'on'}`} onClick={() => setSpace('')}>הכול</button>
            {spaces.map((s) => <button key={s.id} type="button" className={`chip ${space === s.id ? 'on' : ''}`} onClick={() => setSpace(space === s.id ? '' : s.id)}>{s.name}</button>)}
          </div>
          <span className="field-label">לפי מעיין</span>
          <div className="chips small-chips">
            {SPRINGS.map((s) => <button key={s.key} type="button" className={`chip ${spring === s.key ? 'on' : ''}`} title={s.short} onClick={() => setSpring(spring === s.key ? '' : s.key)}>{s.title}</button>)}
          </div>
        </div>
        {shown == null ? <Loading /> : shown.length === 0 ? <Empty>עוד אין כאן מקורות כאלה. אפשר להציע אחד.</Empty> : <ReadingList items={shown} />}
      </section>

      <details className="card assumptions">
        <summary>ארבעת המעיינות – מאיפה אנחנו שואבים</summary>
        <ul className="springs-list">
          {SPRINGS.map((s) => <li key={s.key}><strong>{s.title}</strong> – {s.short} <span className="muted">{s.text}</span></li>)}
        </ul>
      </details>

      <details className="card assumptions">
        <summary>נקודות הנחה לפתח הלימוד</summary>
        <Prose text={assumptions} />
      </details>

      <StudyCircles />

      <section className="section">
        <h2>שיחה על מהות השינוי</h2>
        <Comments targetType="depth" targetId="library" placeholder="מחשבה על השינוי שמתקיים עכשיו, או מקור שכדאי להכיר" />
      </section>
    </div>
  );
}
