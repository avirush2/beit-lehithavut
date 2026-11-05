import { useCollection, useContent, useSprings, byOrder } from '../lib/store.jsx';
import Comments from '../components/Comments.jsx';
import { Paths } from '../components/Layout.jsx';
import { Motif, PageHead } from '../components/Botanical.jsx';
import { Empty, Prose } from '../components/ui.jsx';

// ספריה (לב ההתהוות): מקורות להעמקה לפי ארבעת המעיינות, והצעות למקורות נוספים
export default function Library() {
  const intro = useContent('depthIntro');
  const deep = useContent('depthDeep');
  const assumptions = useContent('assumptions');
  const readings = useCollection('readings')?.slice().sort(byOrder) || [];
  const SPRINGS = useSprings();

  return (
    <div className="page">
      <PageHead spaceKey="library" lead={intro} deep={deep} />

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

      <section className="section">
        <h2>הצעות למקורות ושיחה על מהות השינוי</h2>
        <Comments targetType="depth" targetId="library" placeholder="ספר, מאמר, מקום, מסורת, ניסוי שכבר קיים – או מחשבה על השינוי שמתקיים עכשיו" />
      </section>
      <Paths keys={['categories', 'happenings', 'compass']} />
    </div>
  );
}
