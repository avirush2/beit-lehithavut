import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, useDoc, useIdeaKinds, useLenses, useT, byNewest, byOrder, visibleFor } from '../lib/store.jsx';

function useKind() {
  const kinds = useIdeaKinds();
  return (key) => kinds.find((k) => k.key === key) || kinds[0];
}

import { nextHarvest } from '../lib/seasons.js';
import Comments from '../components/Comments.jsx';
import { HarvestBanner, Paths } from '../components/Layout.jsx';
import { PageHead } from '../components/Botanical.jsx';
import {
  Byline, CompassBadges, CompassPicker, Empty, ItemActions, Loading, Prose, formatDate,
} from '../components/ui.jsx';

export function CategoriesPage() {
  const intro = useContent('categoriesIntro');
  const deep = useContent('categoriesDeep');
  const categories = useCollection('categories')?.filter((c) => c.active).sort(byOrder);
  const ideas = useCollection('ideas') || [];
  const count = (id) => ideas.filter((i) => i.categoryId === id && !i.hidden).length;
  const [params] = useSearchParams();
  const share = params.get('share');
  const ideaKind = useKind();

  return (
    <div className="page">
      <PageHead spaceKey="categories" lead={intro} deep={deep} />
      {share ? <p className="notice">באיזה אזור בגן זה צומח? בוחרים מרחב, ושם אפשר לשתף את ה{ideaKind(share).label}.</p> : null}
      <HarvestBanner />
      {categories == null ? <Loading /> : categories.length === 0 ? <Empty>עוד אין מרחבי חיים. מארחים יכולים לטעון את תוכן הפתיחה.</Empty> : (
        <div className="cat-grid">
          {categories.map((c, i) => (
            <Link key={c.id} to={`/categories/${c.id}${share ? `?share=${share}` : ''}`} className="cat-card" style={{ '--cat': `var(--c${(i % 8) + 1})` }}>
              <span className="cat-ring" aria-hidden="true">{c.name.replace(/[^֐-׿]/g, '').slice(0, 1)}</span>
              <h2>{c.name}</h2>
              <p>{c.description}</p>
              <span className="muted small">{count(c.id) ? `${count(c.id)} רעיונות` : 'עוד אין רעיונות'}</span>
            </Link>
          ))}
        </div>
      )}
      <Paths keys={['happenings', 'library', 'dreams']} />
    </div>
  );
}

function IdeaForm({ categoryId, idea, initialKind, onDone }) {
  const { stamp, requireUser } = useAuth();
  const navigate = useNavigate();
  const [kind, setKind] = useState(idea?.kind || initialKind || 'idea');
  const [title, setTitle] = useState(idea?.title || '');
  const [body, setBody] = useState(idea?.body || '');
  const [compass, setCompass] = useState(idea?.compass || []);
  const IDEA_KINDS = useIdeaKinds();
  const k = IDEA_KINDS.find((x) => x.key === kind) || IDEA_KINDS[0];
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
      <div className="field"><span className="field-label">נוגע במצפן? (לא חובה)</span><CompassPicker value={compass} onChange={setCompass} /></div>
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

export function CategoryView() {
  const { id } = useParams();
  const { isHost, requireUser } = useAuth();
  const [params] = useSearchParams();
  const share = params.get('share');
  const category = useDoc('categories', id);
  const ideas = visibleFor(useCollection('ideas', ['categoryId', id]), isHost)?.sort(byNewest);
  const comments = useCollection('comments') || [];
  const [adding, setAdding] = useState(!!share);
  const ideaKind = useKind();
  const t = useT();
  useEffect(() => { if (share) setAdding(true); }, [share]);

  if (category === undefined) return <div className="page"><Loading /></div>;
  if (category === null) return <div className="page"><Empty>המרחב לא נמצא. <Link to="/categories">חזרה</Link></Empty></div>;
  const talk = (ideaId) => comments.filter((c) => c.targetId === ideaId && !c.hidden).length;

  return (
    <div className="page">
      <Link to="/categories" className="back">→ מרחבי החיים</Link>
      <header className="page-head">
        <p className="eyebrow">מרחב חיים</p>
        <h1>{category.name}</h1>
        <p className="lead">{category.description}</p>
      </header>
      {adding ? <IdeaForm categoryId={id} initialKind={share} onDone={() => setAdding(false)} /> : (
        <button type="button" className="btn" onClick={() => requireUser() && setAdding(true)}>{t('categories-share')}</button>
      )}
      <section className="section">
        {ideas == null ? <Loading /> : ideas.length === 0 ? <Empty>עוד אין רעיונות במרחב הזה. אולי הרעיון הראשון מחכה בתוך חלום רחב?</Empty> : (
          <div className="grid">
            {ideas.map((i) => (
              <Link key={i.id} to={`/ideas/${i.id}`} className={`card idea-card ${i.hidden ? 'is-hidden' : ''}`}>
                {i.seedQuote ? <p className="seed-mark">זרע מתוך חלום</p> : null}
                {i.kind && i.kind !== 'idea' ? <span className={`badge kind-${i.kind}`}>{ideaKind(i.kind).label}</span> : null}
                <h3>{i.title}</h3>
                {i.body ? <p className="excerpt">{i.body.slice(0, 160)}{i.body.length > 160 ? '…' : ''}</p> : null}
                <CompassBadges list={i.compass} />
                <div className="row-between">
                  <Byline name={i.name} createdAt={i.createdAt} hidden={i.hidden} />
                  <span className="muted small">{talk(i.id)} קולות</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <Harvests category={category} />
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
