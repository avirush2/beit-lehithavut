import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { backend } from '../lib/backend.js';
import { useAuth, useDoc, useHappeningKinds, useT } from '../lib/store.jsx';
import Comments from '../components/Comments.jsx';
import {
  Byline, Empty, ItemActions, LifeSpacePicker, Loading, Prose, SpaceBadges,
} from '../components/ui.jsx';

// התרחשויות חיות בתוך מרחבי החיים: מוצעות משם, ומופיעות ברשימה "מה צומח במרחב".
// הפרטים שכל סוג התרחשות יכול לבקש, ושמם הקצר בכרטיס
const DETAILS = [['who', 'עם'], ['when', 'מתי'], ['where', 'איפה'], ['join', 'איך מצטרפים'], ['link', 'קישור']];

export function useKindOf() {
  const kinds = useHappeningKinds();
  return (key) => kinds.find((k) => k.key === key) || kinds[0];
}

// טופס התרחשות: הפרטים משתנים לפי הסוג. propose – הצעה של משתתפ.ת שמגיעה למארחים; אחרת – פרסום ישיר (מארחים).
export function HappeningForm({ initial, propose, onDone }) {
  const { requireUser, stamp } = useAuth();
  const KINDS = useHappeningKinds();
  const t = useT();
  const [d, setD] = useState({ kind: 'dialogue', title: '', body: '', who: '', when: '', where: '', join: '', link: '', spaces: [], contact: '', ...(initial || {}) });
  const [state, setState] = useState('idle');
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value });
  const kind = KINDS.find((k) => k.key === d.kind) || KINDS[0];

  const save = async (e) => {
    e.preventDefault();
    if (!requireUser() || !d.title.trim()) return;
    setState('sending');
    const data = { kind: d.kind, title: d.title.trim(), body: d.body.trim(), spaces: d.spaces };
    DETAILS.forEach(([k]) => { data[k] = kind.fields[k] ? (d[k] || '').trim() : ''; });
    try {
      if (propose) {
        await backend.add('happeningProposals', { ...data, contact: d.contact.trim().slice(0, 200), status: 'new', ...stamp() });
        setState('sent');
        return;
      }
      if (initial?.id) await backend.update('happenings', initial.id, data);
      else await backend.add('happenings', { ...data, closed: false, ...(initial?.fromProposal ? { uid: initial.uid, name: initial.name } : stamp()) });
      onDone(true);
    } catch (err) {
      console.error(err);
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <div className="idea-thanks">
        <p className="idea-thanks-title">{t('happenings-thanks')}</p>
        <div className="row-end"><button type="button" className="btn" onClick={() => onDone(false)}>סגירה</button></div>
      </div>
    );
  }

  return (
    <form className="form happening-form" onSubmit={save}>
      {propose ? <p className="muted small">{t('happenings-suggest-intro')}</p> : null}
      <div className="field"><span className="field-label">איזו התרחשות?</span>
        <div className="chips">
          {KINDS.map((k) => <button key={k.key} type="button" className={`chip ${d.kind === k.key ? 'on' : ''}`} aria-pressed={d.kind === k.key} onClick={() => setD({ ...d, kind: k.key })}>{k.title}</button>)}
        </div>
        <span className="hint">{kind.text}</span>
      </div>
      <label className="field"><span className="field-label">{kind.titleLabel}</span><input value={d.title} onChange={set('title')} maxLength={140} required /></label>
      <label className="field"><span className="field-label">כמה מילים – מה, למה, ולמי זה מתאים</span>
        <textarea rows={4} value={d.body} onChange={set('body')} />
      </label>
      <div className="happening-details">
        {DETAILS.filter(([k]) => kind.fields[k]).map(([k]) => (
          <label key={k} className="field"><span className="field-label">{kind.fields[k]}</span>
            <input value={d[k]} onChange={set(k)} maxLength={k === 'link' ? 300 : 200} dir={k === 'link' ? 'ltr' : undefined} placeholder={k === 'link' ? 'https://' : undefined} />
          </label>
        ))}
      </div>
      <LifeSpacePicker value={d.spaces} onChange={(spaces) => setD({ ...d, spaces })} />
      {propose ? (
        <label className="field"><span className="field-label">דרך ליצור איתך קשר (לא חובה – רק המארחים יראו)</span>
          <input value={d.contact} onChange={set('contact')} maxLength={200} placeholder="מייל או טלפון" />
        </label>
      ) : null}
      {state === 'error' ? <p className="error">משהו לא הצליח בשמירה. אפשר לנסות שוב בעוד רגע.</p> : null}
      <div className="row-end">
        <button type="button" className="btn btn-ghost" onClick={() => onDone(false)}>ביטול</button>
        <button className="btn" disabled={state === 'sending' || !d.title.trim()}>{propose ? 'שליחת ההצעה' : 'פרסום'}</button>
      </div>
    </form>
  );
}

export function HappeningCard({ h }) {
  const kindOf = useKindOf();
  return (
    <Link to={`/happenings/${h.id}`} className={`card happening-card kind-${h.kind} ${h.hidden ? 'is-hidden' : ''}`}>
      <span className="badge">{kindOf(h.kind).title}</span>
      <h3>{h.title}</h3>
      <dl className="happening-meta">
        {DETAILS.filter(([k]) => k !== 'link' && h[k]).map(([k, l]) => <div key={k}><dt>{l}</dt><dd>{h[k]}</dd></div>)}
      </dl>
      {h.kind === 'written' && h.closed ? <span className="muted small">נסגרה לכתיבה</span> : null}
    </Link>
  );
}

export function HappeningView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isHost } = useAuth();
  const h = useDoc('happenings', id);
  const kindOf = useKindOf();
  const t = useT();
  const [editing, setEditing] = useState(false);
  useEffect(() => { setEditing(false); }, [id]);

  if (h === undefined) return <div className="page"><Loading /></div>;
  if (h === null || (h.hidden && !isHost)) return <div className="page"><Empty>ההתרחשות לא נמצאה. <Link to="/categories">חזרה</Link></Empty></div>;
  const kind = kindOf(h.kind);
  const written = h.kind === 'written';
  const home = h.spaces?.[0] ? `/categories/${h.spaces[0]}` : '/categories';

  return (
    <div className="page">
      <Link to={home} className="back">→ {h.spaces?.[0] ? 'מרחב החיים' : 'מרחבי החיים'}</Link>
      {editing ? <div className="card"><HappeningForm initial={h} onDone={() => setEditing(false)} /></div> : (
        <article className={`reading ${h.hidden ? 'is-hidden' : ''}`}>
          <span className="badge">{kind.title}</span>
          <h1>{h.title}</h1>
          <Byline name={h.name} createdAt={h.createdAt} hidden={h.hidden} />
          <Prose text={h.body} />
          <dl className="happening-meta">
            {DETAILS.filter(([k]) => h[k]).map(([k]) => (
              <div key={k}><dt>{kind.fields[k] || k}</dt><dd>{k === 'link' && /^https?:\/\//i.test(h.link) ? <a href={h.link} target="_blank" rel="noreferrer" dir="ltr">{h.link}</a> : h[k]}</dd></div>
            ))}
          </dl>
          <SpaceBadges ids={h.spaces} />
          {isHost ? (
            <div className="row-start wrap host-actions">
              <button type="button" className="btn btn-small btn-ghost" onClick={() => setEditing(true)}>עריכה</button>
              {written ? <button type="button" className="btn btn-small btn-ghost" onClick={() => backend.update('happenings', id, { closed: !h.closed })}>{h.closed ? 'לפתוח שוב לכתיבה' : 'לסגור לכתיבה'}</button> : null}
              <ItemActions col="happenings" item={h} onDeleted={() => navigate(home)} />
            </div>
          ) : null}
        </article>
      )}
      <section className="section">
        <h2>{written ? 'השיחה' : 'שאלות ותגובות'}</h2>
        <Comments targetType="happening" targetId={id} withCompass={false}
          placeholder={written ? 'לכתוב את הקול שלך בשיחה…' : 'שאלה, מחשבה, או "אני מגיע.ה"'}
          closed={written && h.closed} closedText={t('happenings-written-closed')} />
      </section>
    </div>
  );
}
