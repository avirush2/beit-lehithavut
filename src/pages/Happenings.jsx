import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, useDoc, useHappeningKinds, useSprings, useT, byNewest, visibleFor } from '../lib/store.jsx';
import { STUDY_TOPICS } from '../content/defaults.js';
import Comments from '../components/Comments.jsx';
import { Paths } from '../components/Layout.jsx';
import { PageHead } from '../components/Botanical.jsx';
import {
  Byline, Chips, Empty, ItemActions, LifeSpacePicker, Loading, Modal, Prose, SpaceBadges,
} from '../components/ui.jsx';

const MODES = ['לבד', 'בצמד', 'בחבורה'];
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

function StudyCircles() {
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
    <section className="section">
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

export function HappeningCards({ items }) {
  const kindOf = useKindOf();
  return (
    <div className="grid">
      {items.map((h) => (
        <Link key={h.id} to={`/happenings/${h.id}`} className={`card happening-card kind-${h.kind} ${h.hidden ? 'is-hidden' : ''}`}>
          <span className="badge">{kindOf(h.kind).title}</span>
          <h3>{h.title}</h3>
          <dl className="happening-meta">
            {DETAILS.filter(([k]) => k !== 'link' && h[k]).map(([k, l]) => <div key={k}><dt>{l}</dt><dd>{h[k]}</dd></div>)}
          </dl>
          {h.kind === 'written' && h.closed ? <span className="muted small">נסגרה לכתיבה</span> : null}
        </Link>
      ))}
    </div>
  );
}

// התרחשות (לב ההתהוות): מה קורה בבית ואיך מצטרפים
export default function Happenings() {
  const { isHost, requireUser } = useAuth();
  const intro = useContent('happeningsIntro');
  const t = useT();
  const KINDS = useHappeningKinds();
  const items = visibleFor(useCollection('happenings'), isHost)?.sort(byNewest);
  const [proposing, setProposing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [kind, setKind] = useState('');
  const present = KINDS.filter((k) => items?.some((h) => h.kind === k.key));
  const shown = items?.filter((h) => !kind || h.kind === kind);

  return (
    <div className="page">
      <PageHead spaceKey="happenings" lead={intro}>
        <div className="row-start">
          <button type="button" className="btn" onClick={() => requireUser() && setProposing(true)}>{t('happenings-suggest')}</button>
          {isHost ? <button type="button" className="btn btn-ghost" onClick={() => setPublishing(true)}>פרסום התרחשות (מארחים)</button> : null}
        </div>
      </PageHead>

      {publishing ? <div className="card"><HappeningForm onDone={() => setPublishing(false)} /></div> : null}

      <section className="section">
        {present.length > 1 ? (
          <div className="chips kind-filter">
            <button type="button" className={`chip ${kind ? '' : 'on'}`} onClick={() => setKind('')}>הכול</button>
            {present.map((k) => <button key={k.key} type="button" className={`chip ${kind === k.key ? 'on' : ''}`} onClick={() => setKind(kind === k.key ? '' : k.key)}>{k.title}</button>)}
          </div>
        ) : null}
        {shown == null ? <Loading /> : shown.length === 0 ? (
          <Empty>עוד אין כאן התרחשויות. אולי הראשונה מחכה להצעה שלך?</Empty>
        ) : <HappeningCards items={shown} />}
      </section>

      <StudyCircles />
      <Paths keys={['categories', 'library', 'dreams']} />

      <Modal open={proposing} onClose={() => setProposing(false)} title={t('happenings-suggest')} wide>
        <HappeningForm key={proposing ? 'open' : 'closed'} propose onDone={() => setProposing(false)} />
      </Modal>
    </div>
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
  if (h === null || (h.hidden && !isHost)) return <div className="page"><Empty>ההתרחשות לא נמצאה. <Link to="/happenings">חזרה</Link></Empty></div>;
  const kind = kindOf(h.kind);
  const written = h.kind === 'written';

  return (
    <div className="page">
      <Link to="/happenings" className="back">→ התרחשות</Link>
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
              <ItemActions col="happenings" item={h} onDeleted={() => navigate('/happenings')} />
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
