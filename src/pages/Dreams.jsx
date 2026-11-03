import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, useDoc, byNewest, byOrder, visibleFor } from '../lib/store.jsx';
import { DREAM_THEMES } from '../content/defaults.js';
import Garden from '../components/Garden.jsx';
import Comments from '../components/Comments.jsx';
import { Paths } from '../components/Layout.jsx';
import { PageHead } from '../components/Botanical.jsx';
import GardenScene from '../components/GardenScene.jsx';
import {
  Byline, Chips, CompassBadges, CompassPicker, Empty, ItemActions, Loading, Modal, Prose, useCompass,
} from '../components/ui.jsx';

export function DreamsPage() {
  const { isHost, requireUser } = useAuth();
  const navigate = useNavigate();
  const intro = useContent('dreamsIntro');
  const deep = useContent('dreamsDeep');
  const dreams = visibleFor(useCollection('dreams'), isHost)?.sort(byNewest);
  const resonances = useCollection('resonances');
  const [view, setView] = useState('garden');

  return (
    <div className="page">
      <div className="space-scene tone-blossom">
        <GardenScene height={200} flowers={30} seed={11} />
      </div>
      <PageHead spaceKey="dreams" lead={intro} deep={deep}>
        <div className="row-start">
          <button type="button" className="btn btn-bloom" onClick={() => requireUser() && navigate('/dreams/new')}>להוסיף ניצוץ ✦</button>
          <Link to="/tickle" className="btn btn-ghost">אין לי חלום… (דגדוג חלומות)</Link>
        </div>
      </PageHead>

      {dreams == null ? <Loading /> : dreams.length === 0 ? (
        <Empty>הגן עוד ריק. הניצוץ הראשון יהיה הזרע הראשון.</Empty>
      ) : (
        <>
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={view === 'garden'} className={view === 'garden' ? 'on' : ''} onClick={() => setView('garden')}>גן החלומות</button>
            <button type="button" role="tab" aria-selected={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>רשימה</button>
          </div>
          {view === 'garden' ? <Garden dreams={dreams} resonances={resonances || []} /> : (
            <div className="grid">
              {dreams.map((d) => (
                <Link key={d.id} to={`/dreams/${d.id}`} className={`card dream-card ${d.hidden ? 'is-hidden' : ''}`}>
                  <h3>{d.title}</h3>
                  <p className="excerpt">{(d.body || '').slice(0, 180)}{(d.body || '').length > 180 ? '…' : ''}</p>
                  {d.themes?.length ? <div className="badges">{d.themes.map((t) => <span key={t} className="badge">{t}</span>)}</div> : null}
                  <Byline name={d.name} createdAt={d.createdAt} hidden={d.hidden} />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
      <Paths keys={['categories', 'tickle', 'timing']} />
    </div>
  );
}

export function DreamForm() {
  const { id } = useParams();
  const { user, loading, requireUser, stamp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const existing = useDoc(id ? 'dreams' : null, id);
  const compass = useCompass();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState(location.state?.draft || '');
  const [themes, setThemes] = useState([]);
  const [freeTheme, setFreeTheme] = useState('');
  const [marked, setMarked] = useState([]);
  const [busy, setBusy] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (existing && !loaded.current) {
      loaded.current = true;
      setTitle(existing.title || ''); setBody(existing.body || '');
      setThemes(existing.themes || []); setMarked(existing.compass || []);
    }
  }, [existing]);

  useEffect(() => { if (!loading && !user) requireUser(); }, [loading, user, requireUser]);

  const allThemes = useMemo(() => [...new Set([...DREAM_THEMES, ...themes])], [themes]);

  const save = async (e) => {
    e.preventDefault();
    if (!requireUser() || !title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      const data = { title: title.trim(), body: body.trim(), themes, compass: marked };
      if (id) {
        await backend.update('dreams', id, data);
        navigate(`/dreams/${id}`);
      } else {
        const newId = await backend.add('dreams', { ...data, ...stamp(), fromPain: location.state?.fromPain || null });
        navigate(`/dreams/${newId}`);
      }
    } finally { setBusy(false); }
  };

  const addFree = () => {
    const t = freeTheme.trim();
    if (t && !themes.includes(t)) setThemes([...themes, t]);
    setFreeTheme('');
  };

  return (
    <div className="page">
      <Link to="/dreams" className="back">→ החלום הרחב</Link>
      <h1>{id ? 'עריכת החלום' : 'לשתף חלום'}</h1>
      <div className="write-layout">
        <form className="card form" onSubmit={save}>
          <label className="field"><span className="field-label">שם לחלום</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={90} placeholder="כמה מילים שמחזיקות אותו" />
          </label>
          <label className="field"><span className="field-label">החלום</span>
            <textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} required placeholder="איך נראים החיים שאת.ה מבקש.ת לחיות? איך נראה הריפוי שמבקש להתהוות דרכך?" />
          </label>
          <div className="field">
            <span className="field-label">באיזו ערוגה הוא צומח? (הנושא הראשון קובע את מקומו בגן)</span>
            <Chips options={allThemes} value={themes} onChange={setThemes} />
            <div className="inline-add">
              <input value={freeTheme} onChange={(e) => setFreeTheme(e.target.value)} placeholder="נושא משלך" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFree(); } }} />
              <button type="button" className="btn btn-small btn-ghost" onClick={addFree}>הוספה</button>
            </div>
          </div>
          <div className="field">
            <span className="field-label">נוגע במצפן? (לא חובה)</span>
            <CompassPicker value={marked} onChange={setMarked} />
          </div>
          <div className="row-end">
            <button className="btn" disabled={busy || !title.trim() || !body.trim()}>{id ? 'שמירה' : 'לשתול בגן'}</button>
          </div>
        </form>
        <aside className="compass-aside">
          <h2>מצפן לכתיבה</h2>
          <p className="muted small">שאלות שמזמינות להעמיק. לא צריך לענות על כולן – אפשר לבחור אחת שקוראת לך.</p>
          <ul className="compass-list">
            {compass.map((c) => (
              <li key={c.id}>
                <strong>{c.title}</strong>
                <span>{c.question}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function SeedModal({ open, onClose, dream, quote }) {
  const { stamp } = useAuth();
  const navigate = useNavigate();
  const categories = useCollection('categories')?.filter((c) => c.active).sort(byOrder) || [];
  const [cat, setCat] = useState('');
  const [title, setTitle] = useState('');
  useEffect(() => { if (open) { setTitle(quote.slice(0, 80)); setCat(''); } }, [open, quote]);
  const plant = async () => {
    const id = await backend.add('ideas', {
      categoryId: cat, title: title.trim(), body: '', seedQuote: quote, fromDreamId: dream.id, fromDreamTitle: dream.title, compass: [], ...stamp(),
    });
    onClose();
    navigate(`/ideas/${id}`);
  };
  return (
    <Modal open={open} onClose={onClose} title="לשתול זרע במרחב חיים">
      <blockquote className="seed-quote">{quote}</blockquote>
      <label className="field"><span className="field-label">שם לרעיון</span><input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <div className="field">
        <span className="field-label">באיזה מרחב חיים?</span>
        <Chips options={categories.map((c) => c.name)} value={cat ? [categories.find((c) => c.id === cat)?.name] : []} onChange={(v) => setCat(categories.find((c) => c.name === v[0])?.id || '')} single />
      </div>
      <div className="row-end"><button type="button" className="btn" disabled={!cat || !title.trim()} onClick={plant}>לשתול</button></div>
    </Modal>
  );
}

function ResonateModal({ open, onClose, dream }) {
  const { isHost, stamp } = useAuth();
  const dreams = visibleFor(useCollection('dreams'), isHost)?.filter((d) => d.id !== dream.id).sort(byNewest) || [];
  const [q, setQ] = useState('');
  const shown = dreams.filter((d) => !q || d.title.includes(q) || (d.body || '').includes(q));
  const link = async (other) => {
    await backend.add('resonances', { a: dream.id, b: other.id, aTitle: dream.title, bTitle: other.title, ...stamp() });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="מהדהד לי עם…">
      <p className="muted">איזה חלום אחר החלום הזה מזכיר לך? החוט ביניהם יופיע בגן.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש" />
      <ul className="pick-list">
        {shown.length === 0 ? <li className="muted">אין עוד חלומות אחרים.</li> : shown.map((d) => (
          <li key={d.id}><button type="button" onClick={() => link(d)}><strong>{d.title}</strong><span className="muted small"> · {d.name}</span></button></li>
        ))}
      </ul>
    </Modal>
  );
}

export function DreamView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isHost, requireUser } = useAuth();
  const dream = useDoc('dreams', id);
  const resonances = useCollection('resonances');
  const seeds = useCollection('ideas', ['fromDreamId', id]);
  const categories = useCollection('categories') || [];
  const [selection, setSelection] = useState('');
  const [seedOpen, setSeedOpen] = useState(false);
  const [resOpen, setResOpen] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    const onSel = () => {
      const s = window.getSelection();
      const text = s ? s.toString().trim() : '';
      if (text && bodyRef.current && s.anchorNode && bodyRef.current.contains(s.anchorNode)) setSelection(text);
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  if (dream === undefined) return <div className="page"><Loading /></div>;
  if (dream === null || (dream.hidden && !isHost && dream.uid !== user?.uid)) {
    return <div className="page"><Empty>החלום לא נמצא. <Link to="/dreams">חזרה לגן</Link></Empty></div>;
  }

  const linked = (resonances || [])
    .filter((r) => r.a === id || r.b === id)
    .map((r) => (r.a === id ? { id: r.b, title: r.bTitle, link: r } : { id: r.a, title: r.aTitle, link: r }));

  return (
    <div className="page">
      <Link to="/dreams" className="back">→ גן החלומות</Link>
      <article className={`reading ${dream.hidden ? 'is-hidden' : ''}`}>
        {dream.themes?.length ? <div className="badges">{dream.themes.map((t) => <span key={t} className="badge">{t}</span>)}</div> : null}
        <h1>{dream.title}</h1>
        <Byline name={dream.name} createdAt={dream.createdAt} hidden={dream.hidden} />
        <div ref={bodyRef} className="selectable"><Prose text={dream.body} /></div>
        <CompassBadges list={dream.compass} />
        <ItemActions col="dreams" item={dream} onEdit={() => navigate(`/dreams/${id}/edit`)} onDeleted={() => navigate('/dreams')} />
      </article>

      <section className="card seed-box">
        <h2>לשתול זרע</h2>
        <p className="muted">מסמנים משפט מתוך החלום, והוא הופך לרעיון באחד ממרחבי החיים – שם אפשר לחלום אותו לפרטים.</p>
        {selection ? <blockquote className="seed-quote">{selection}</blockquote> : <p className="hint">סמנו משפט בטקסט שלמעלה.</p>}
        <button type="button" className="btn" disabled={!selection} onClick={() => requireUser() && setSeedOpen(true)}>לשתול כזרע</button>
        {seeds?.length ? (
          <div className="seeds">
            <p className="field-label">זרעים שכבר נשתלו מהחלום הזה</p>
            <ul>{seeds.map((s) => <li key={s.id}><Link to={`/ideas/${s.id}`}>{s.title}</Link> <span className="muted small">· {categories.find((c) => c.id === s.categoryId)?.name}</span></li>)}</ul>
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>מהדהד</h2>
        {linked.length ? (
          <ul className="resonance-list">
            {linked.map((l) => (
              <li key={l.link.id}>
                <Link to={`/dreams/${l.id}`}>{l.title}</Link>
                <span className="muted small"> · חוט של {l.link.name}</span>
                {(isHost || l.link.uid === user?.uid) ? <button type="button" className="link-btn quiet small" onClick={() => backend.remove('resonances', l.link.id)}>הסרה</button> : null}
              </li>
            ))}
          </ul>
        ) : <p className="muted">עוד אין חוטים לחלום הזה.</p>}
        <button type="button" className="btn btn-ghost" onClick={() => requireUser() && setResOpen(true)}>מהדהד לי עם חלום אחר…</button>
      </section>

      <section className="section">
        <h2>שיחה</h2>
        <Comments targetType="dream" targetId={id} placeholder="מה החלום הזה מעורר בך?" />
      </section>

      <SeedModal open={seedOpen} onClose={() => setSeedOpen(false)} dream={dream} quote={selection} />
      <ResonateModal open={resOpen} onClose={() => setResOpen(false)} dream={dream} />
    </div>
  );
}
