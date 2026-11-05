import { Link, useSearchParams } from 'react-router-dom';
import { useAuth, useCollection, byNewest, visibleFor } from '../lib/store.jsx';
import { Empty, Loading, authorOf, useLifeSpaces } from '../components/ui.jsx';

// חיפוש בכל הבית: מילים חופשיות, וסינון לפי מרחב חיים
const SOURCES = [
  ['dreams', 'שיתוף חלום', (x) => x.title, (x) => x.body, (x) => `/dreams/${x.id}`],
  ['ideas', 'מרחבי החיים', (x) => x.title, (x) => x.body, (x) => `/ideas/${x.id}`],
  ['happenings', 'התרחשות', (x) => x.title, (x) => [x.body, x.who, x.where].filter(Boolean).join(' · '), (x) => `/happenings/${x.id}`],
  ['readings', 'ספריה', (x) => x.title, (x) => [x.author, x.note].filter(Boolean).join(' · '), () => '/library'],
  ['stories', 'חגיגה והשראה', (x) => x.title, (x) => x.body, () => '/celebrate'],
  ['pain', 'שיתוף קושי', () => '', (x) => x.body, (x) => `/threshold/${x.id}`],
  ['voices', 'התבוננות', () => '', (x) => [x.dissolving, x.emerging].filter(Boolean).join(' · '), () => '/observe'],
  ['studyCircles', 'קבוצת למידה', (x) => x.topic, (x) => x.description, () => '/library#circles'],
];

const cut = (s, n = 200) => (s && s.length > n ? `${s.slice(0, n)}…` : s || '');

export default function Search() {
  const { isHost } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const space = params.get('space') || '';
  const spaces = useLifeSpaces();
  const lists = SOURCES.map(([col]) => visibleFor(useCollection(col), isHost)); // eslint-disable-line react-hooks/rules-of-hooks
  const update = (next) => setParams(Object.fromEntries(Object.entries({ q, space, ...next }).filter(([, v]) => v)), { replace: true });

  const loading = lists.some((l) => l == null);
  const words = q.trim().split(/\s+/).filter(Boolean);
  const results = loading || (!words.length && !space) ? [] : SOURCES.flatMap(([col, label, title, text, link], i) => lists[i]
    .filter((x) => !space || x.spaces?.includes(space))
    .map((x) => ({ key: `${col}-${x.id}`, label, title: title(x) || '', text: text(x) || '', to: link(x), by: authorOf(x), createdAt: x.createdAt }))
    .filter((r) => words.every((w) => `${r.title} ${r.text} ${r.by}`.includes(w))))
    .sort(byNewest);

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">בכל הבית</p>
        <h1>חיפוש</h1>
      </header>
      <input type="search" className="search-input" value={q} onChange={(e) => update({ q: e.target.value })} placeholder="מילה, שם, נושא…" autoFocus />
      {spaces.length ? (
        <div className="chips search-spaces">
          {spaces.map((s) => <button key={s.id} type="button" className={`chip ${space === s.id ? 'on' : ''}`} onClick={() => update({ space: space === s.id ? '' : s.id })}>{s.name}</button>)}
        </div>
      ) : null}
      {loading ? <Loading /> : !words.length && !space ? (
        <p className="muted">אפשר לחפש מילה, או לבחור מרחב חיים ולראות את כל מה שקשור אליו – חלומות, חישות, התרחשויות ומקורות.</p>
      ) : results.length === 0 ? <Empty>לא מצאנו. אולי במילה אחרת?</Empty> : (
        <>
          <p className="muted small">{results.length} תוצאות</p>
          <ul className="related-list">
            {results.slice(0, 100).map((r) => (
              <li key={r.key}>
                <span className="badge">{r.label}</span> <Link to={r.to}><strong>{r.title || cut(r.text, 90)}</strong></Link>
                {r.by ? <span className="muted small"> · {r.by}</span> : null}
                {r.title && r.text ? <p className="small">{cut(r.text)}</p> : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
