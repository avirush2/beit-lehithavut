import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, useDoc, useIdeaKinds, useLenses, useSettings, useT, byNewest, byOrder, visibleFor } from '../lib/store.jsx';

function useKind() {
  const kinds = useIdeaKinds();
  return (key) => kinds.find((k) => k.key === key) || kinds[0];
}

import { nextHarvest } from '../lib/seasons.js';
import Comments from '../components/Comments.jsx';
import { HarvestBanner } from '../components/Layout.jsx';
import { GroupHead } from '../components/Botanical.jsx';
import { HappeningCard, HappeningForm } from './Happenings.jsx';
import { ReadingList } from './Library.jsx';
import {
  Byline, CompassBadges, Empty, ItemActions, Loading, Modal, Prose, authorOf, formatDate,
} from '../components/ui.jsx';

// כמה צומח בכל מרחב: רעיונות, שאלות והתרחשויות שתויגו בו
function useGrowingCount() {
  const ideas = useCollection('ideas') || [];
  const happenings = useCollection('happenings') || [];
  return (id) => ideas.filter((i) => i.categoryId === id && !i.hidden).length
    + happenings.filter((h) => h.spaces?.includes(id) && !h.hidden).length;
}

export function CategoriesPage() {
  const intro = useContent('categoriesIntro');
  const categories = useCollection('categories')?.filter((c) => c.active).sort(byOrder);
  const count = useGrowingCount();
  const [params] = useSearchParams();
  const share = params.get('share');
  const ideaKind = useKind();

  return (
    <div className="page">
      <GroupHead group="becoming" current="categories" />
      <Prose text={intro} className="sub-lead" />
      {share ? <p className="notice">באיזה אזור בגן זה צומח? בוחרים מרחב, ושם אפשר לשתף את ה{ideaKind(share).label}.</p> : null}
      <HarvestBanner />
      {categories == null ? <Loading /> : categories.length === 0 ? <Empty>עוד אין מרחבי חיים. מארחים יכולים לטעון את תוכן הפתיחה.</Empty> : (
        <>
        <div className="cat-circle" style={{ '--n': categories.length }}>
          {categories.map((c, i) => (
            <Link key={c.id} to={`/categories/${c.id}${share ? `?share=${share}` : ''}`} className="cat-node" title={c.description} style={{ '--i': i, '--cat': `var(--c${(i % 8) + 1})` }}>
              <strong>{c.name}</strong>
              {count(c.id) ? <span className="small">{count(c.id)} צומחים</span> : null}
            </Link>
          ))}
        </div>
        <div className="cat-grid cat-grid-narrow">
          {categories.map((c, i) => (
            <Link key={c.id} to={`/categories/${c.id}${share ? `?share=${share}` : ''}`} className="cat-card" style={{ '--cat': `var(--c${(i % 8) + 1})` }}>
              <span className="cat-ring" aria-hidden="true">{c.name.replace(/[^֐-׿]/g, '').slice(0, 1)}</span>
              <h2>{c.name}</h2>
              <p>{c.description}</p>
              <span className="muted small">{count(c.id) ? `${count(c.id)} צומחים כאן` : 'עוד שקט כאן'}</span>
            </Link>
          ))}
        </div>
        </>
      )}
    </div>
  );
}

function IdeaForm({ categoryId, idea, initialKind, onDone }) {
  const { stamp, requireUser } = useAuth();
  const navigate = useNavigate();
  const [kind, setKind] = useState(idea?.kind || initialKind || 'idea');
  const [title, setTitle] = useState(idea?.title || '');
  const [body, setBody] = useState(idea?.body || '');
  const compass = idea?.compass || []; // בחירת המצפן הוסרה מהטופס; מה שכבר נבחר נשמר
  const ALL_KINDS = useIdeaKinds();
  // "התנסות או יוזמה" עבר לטופס ההתרחשות – מוצג רק כשעורכים משהו שכבר נכתב כך
  const IDEA_KINDS = ALL_KINDS.filter((x) => !x.retired || x.key === idea?.kind);
  const k = ALL_KINDS.find((x) => x.key === kind) || ALL_KINDS[0];
  const save = async (e) => {
    e.preventDefault();
    if (!requireUser() || !title.trim()) return;
    const data = { kind, title: title.trim(), body: body.trim(), compass };
    if (idea) { await backend.update('ideas', idea.id, data); onDone(); return; }
    const id = await backend.add('ideas', { ...data, categoryId, ...stamp() });
    onDone();
    navigate(`/ideas/${id}`);
  };
  return (
    <form className="card form" onSubmit={save}>
      <div className="field"><span className="field-label">מה מביאים?</span>
        <div className="chips">
          {IDEA_KINDS.map((x) => (
            <button key={x.key} type="button" className={`chip ${kind === x.key ? 'on' : ''}`} aria-pressed={kind === x.key} onClick={() => setKind(x.key)}>{x.label}</button>
          ))}
        </div>
      </div>
      <label className="field"><span className="field-label">{k.titleLabel}</span><input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} /></label>
      <label className="field"><span className="field-label">פירוט</span>
        <textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder={k.placeholder} />
      </label>
      <div className="row-end">
        <button type="button" className="btn btn-ghost" onClick={onDone}>ביטול</button>
        <button className="btn" disabled={!title.trim()}>{idea ? 'שמירה' : 'לשתף'}</button>
      </div>
    </form>
  );
}

function Harvests({ category }) {
  const { isHost, name } = useAuth();
  const intro = useContent('harvestIntro');
  const harvests = useCollection('harvests', ['categoryId', category.id])?.sort(byNewest);
  const next = nextHarvest();
  const [writing, setWriting] = useState(false);
  const [season, setSeason] = useState(next?.label || '');
  const [body, setBody] = useState('');
  const save = async (e) => {
    e.preventDefault();
    await backend.add('harvests', { categoryId: category.id, season: season.trim(), body: body.trim(), name });
    setWriting(false); setBody('');
  };
  return (
    <section className="section harvests">
      <h2>קצירים</h2>
      <p className="muted">{intro}</p>
      {harvests?.length ? harvests.map((h) => (
        <article key={h.id} className="card harvest">
          <p className="eyebrow">{h.season}</p>
          <Prose text={h.body} />
          <p className="muted small">אסף.ה: {h.name} · {formatDate(h.createdAt)}</p>
          {isHost ? <button type="button" className="link-btn quiet small" onClick={() => window.confirm('למחוק את הקציר?') && backend.remove('harvests', h.id)}>מחיקה</button> : null}
        </article>
      )) : <p className="muted small">עוד לא נאסף קציר במרחב הזה.</p>}
      {isHost ? (writing ? (
        <form className="card form" onSubmit={save}>
          <label className="field"><span className="field-label">עונה</span><input value={season} onChange={(e) => setSeason(e.target.value)} /></label>
          <label className="field"><span className="field-label">מה צמח?</span>
            <textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="אילו רעיונות התבהרו, מה התחבר, אילו שאלות נשארו פתוחות" />
          </label>
          <div className="row-end"><button type="button" className="btn btn-ghost" onClick={() => setWriting(false)}>ביטול</button><button className="btn" disabled={!body.trim()}>שמירת הקציר</button></div>
        </form>
      ) : <button type="button" className="btn btn-ghost" onClick={() => setWriting(true)}>לאסוף קציר</button>) : null}
    </section>
  );
}

// מה שזורם אל המרחב משאר הבית: חלומות, חישות ומקורות שתויגו בו
function Related({ id }) {
  const { isHost } = useAuth();
  const tagged = (items) => visibleFor(items, isHost)?.filter((x) => x.spaces?.includes(id)).sort(byNewest) || [];
  const dreams = tagged(useCollection('dreams'));
  const pain = tagged(useCollection('pain'));
  const voices = tagged(useCollection('voices'));
  const stories = tagged(useCollection('stories'));
  const readings = (useCollection('readings') || []).filter((r) => r.spaces?.includes(id)).sort(byOrder);
  const sensing = [
    ...pain.map((p) => ({ id: p.id, kind: 'שיתוף קושי', text: p.body, to: `/threshold/${p.id}`, name: p.name })),
    ...voices.map((v) => ({ id: v.id, kind: 'התבוננות', text: [v.dissolving && `מתמוסס: ${v.dissolving}`, v.emerging && `מתהווה: ${v.emerging}`].filter(Boolean).join(' · '), to: '/observe', name: v.name })),
    ...stories.map((s) => ({ id: s.id, kind: 'חגיגה והשראה', text: s.title, to: '/celebrate', name: s.name })),
  ];
  if (!dreams.length && !sensing.length && !readings.length) {
    return <p className="muted small related-empty">כשחלומות, חישות ומקורות יתויגו במרחב הזה – הם יופיעו כאן.</p>;
  }
  const cut = (s, n = 160) => (s && s.length > n ? `${s.slice(0, n)}…` : s);
  return (
    <div className="related">
      {dreams.length ? (
        <section className="section">
          <h2>מהחלימה</h2>
          <ul className="related-list">
            {dreams.map((d) => <li key={d.id}><Link to={`/dreams/${d.id}`}><strong>{d.title}</strong></Link> <span className="muted small">· {authorOf(d)}</span><p className="small">{cut(d.body)}</p></li>)}
          </ul>
        </section>
      ) : null}
      {sensing.length ? (
        <section className="section">
          <h2>מהחישה</h2>
          <ul className="related-list">
            {sensing.map((s) => <li key={s.id}><span className="badge">{s.kind}</span> <Link to={s.to}>{cut(s.text)}</Link> <span className="muted small">· {s.name}</span></li>)}
          </ul>
        </section>
      ) : null}
      {readings.length ? <section className="section"><h2>מקורות להעמקה</h2><ReadingList items={readings} /></section> : null}
    </div>
  );
}

export function CategoryView() {
  const { id } = useParams();
  const { isHost, requireUser } = useAuth();
  const [params] = useSearchParams();
  const share = params.get('share');
  const category = useDoc('categories', id);
  const ideas = visibleFor(useCollection('ideas', ['categoryId', id]), isHost);
  const happenings = visibleFor(useCollection('happenings'), isHost)?.filter((h) => h.spaces?.includes(id));
  const comments = useCollection('comments') || [];
  const [adding, setAdding] = useState(share || null); // סוג הרעיון שכותבים עכשיו
  const [choosing, setChoosing] = useState(false);
  const [proposing, setProposing] = useState(false);
  const ideaKind = useKind();
  const kinds = useIdeaKinds().filter((k) => !k.retired);
  const settings = useSettings();
  const t = useT();
  useEffect(() => { if (share) setAdding(share); }, [share]);

  if (category === undefined) return <div className="page"><Loading /></div>;
  if (category === null) return <div className="page"><Empty>המרחב לא נמצא. <Link to="/categories">חזרה</Link></Empty></div>;
  const talk = (ideaId) => comments.filter((c) => c.targetId === ideaId && !c.hidden).length;
  // רשימה אחת: רעיונות, שאלות והתרחשויות – מהחדש לישן
  const growing = ideas && happenings ? [
    ...ideas.map((x) => ({ ...x, type: 'idea' })),
    ...happenings.map((x) => ({ ...x, type: 'happening' })),
  ].sort(byNewest) : null;
  const choose = (next) => { setChoosing(false); if (next === 'happening') setProposing(true); else setAdding(next); };

  return (
    <div className="page">
      <Link to="/categories" className="back">→ מרחבי החיים</Link>
      <header className="page-head">
        <p className="eyebrow">מרחב חיים</p>
        <h1>{category.name}</h1>
        <p className="lead">{category.description}</p>
      </header>
      {adding ? <IdeaForm categoryId={id} initialKind={adding} onDone={() => setAdding(null)} /> : choosing ? (
        <div className="card bring">
          <p className="field-label">מה מביאים למרחב?</p>
          <div className="bring-options">
            {kinds.map((k) => (
              <button key={k.key} type="button" className="bring-option" onClick={() => choose(k.key)}>
                <strong>{k.label}</strong><span>{k.placeholder}</span>
              </button>
            ))}
            <button type="button" className="bring-option" onClick={() => choose('happening')}>
              <strong>{t('categories-happening')}</strong><span>פאנל, קבוצת למידה, שיחה כתובה, מעגל חלימה, סדנה, יוזמה בשטח…</span>
            </button>
          </div>
          <div className="row-end"><button type="button" className="btn btn-ghost" onClick={() => setChoosing(false)}>ביטול</button></div>
        </div>
      ) : (
        <button type="button" className="btn" onClick={() => requireUser() && setChoosing(true)}>{t('categories-share')}</button>
      )}
      <section className="section">
        <h2>{t('categories-growing')}</h2>
        {growing == null ? <Loading /> : growing.length === 0 ? <Empty>עוד שקט במרחב הזה. אולי הרעיון הראשון מחכה בתוך חלום רחב?</Empty> : (
          <div className="grid">
            {growing.map((i) => (i.type === 'happening' ? <HappeningCard key={`h-${i.id}`} h={i} /> : (
              <Link key={i.id} to={`/ideas/${i.id}`} className={`card idea-card ${i.hidden ? 'is-hidden' : ''}`}>
                {i.seedQuote ? <p className="seed-mark">זרע מתוך חלום</p> : null}
                <span className={`badge kind-${i.kind || 'idea'}`}>{ideaKind(i.kind || 'idea').label}</span>
                <h3>{i.title}</h3>
                {i.body ? <p className="excerpt">{i.body.slice(0, 160)}{i.body.length > 160 ? '…' : ''}</p> : null}
                <CompassBadges list={i.compass} />
                <div className="row-between">
                  <Byline name={i.name} createdAt={i.createdAt} hidden={i.hidden} />
                  <span className="muted small">{talk(i.id)} קולות</span>
                </div>
              </Link>
            )))}
          </div>
        )}
      </section>
      <Related id={id} />
      {settings.showHarvests ? <Harvests category={category} /> : null}
      <Modal open={proposing} onClose={() => setProposing(false)} title={t('happenings-suggest')} wide>
        <HappeningForm key={proposing ? 'open' : 'closed'} propose={!isHost} initial={{ spaces: [id] }} onDone={() => setProposing(false)} />
      </Modal>
    </div>
  );
}

export function IdeaView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isHost } = useAuth();
  const idea = useDoc('ideas', id);
  const category = useDoc(idea?.categoryId ? 'categories' : null, idea?.categoryId);
  const [editing, setEditing] = useState(false);
  const LENSES = useLenses();
  const ideaKind = useKind();
  const [lens, setLens] = useState(LENSES[0].key);
  const tabsRef = useRef(null);
  useEffect(() => { setEditing(false); }, [id]);

  if (idea === undefined) return <div className="page"><Loading /></div>;
  if (idea === null || (idea.hidden && !isHost && idea.uid !== user?.uid)) {
    return <div className="page"><Empty>הרעיון לא נמצא. <Link to="/categories">חזרה</Link></Empty></div>;
  }
  const current = LENSES.find((l) => l.key === lens);

  return (
    <div className="page">
      <Link to={`/categories/${idea.categoryId}`} className="back">→ {category?.name || 'מרחב החיים'}</Link>
      {editing ? <IdeaForm idea={idea} categoryId={idea.categoryId} onDone={() => setEditing(false)} /> : (
        <article className={`reading ${idea.hidden ? 'is-hidden' : ''}`}>
          {idea.kind && idea.kind !== 'idea' ? <span className={`badge kind-${idea.kind}`}>{ideaKind(idea.kind).label}</span> : null}
          <h1>{idea.title}</h1>
          <Byline name={idea.name} createdAt={idea.createdAt} hidden={idea.hidden} />
          {idea.seedQuote ? (
            <div className="seed-origin">
              <blockquote className="seed-quote">{idea.seedQuote}</blockquote>
              <p className="muted small">זרע מתוך החלום <Link to={`/dreams/${idea.fromDreamId}`}>{idea.fromDreamTitle}</Link></p>
            </div>
          ) : null}
          <Prose text={idea.body} />
          <CompassBadges list={idea.compass} />
          <ItemActions col="ideas" item={idea} onEdit={() => setEditing(true)} onDeleted={() => navigate(`/categories/${idea.categoryId}`)} />
        </article>
      )}

      <section className="section">
        <h2>דיאלוג סביב הרעיון</h2>
        <div className="tabs lens-tabs" role="tablist" ref={tabsRef}>
          {LENSES.map((l) => (
            <button key={l.key} type="button" role="tab" aria-selected={lens === l.key} className={lens === l.key ? 'on' : ''} onClick={() => setLens(l.key)}>{l.title}</button>
          ))}
        </div>
        <Comments key={current.key} targetType="idea" targetId={id} lens={current} prompt={current.question} />
      </section>
    </div>
  );
}
