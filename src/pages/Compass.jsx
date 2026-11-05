import { Navigate, useLocation } from 'react-router-dom';
import { useContent } from '../lib/store.jsx';
import { Paths } from '../components/Layout.jsx';
import { PageHead } from '../components/Botanical.jsx';
import { Empty, useCompass } from '../components/ui.jsx';

// המצפן: שבעת העקרונות שמכוונים את ההתבוננות והחקירה. ("מהו חדש" עבר לעמוד משלו באודות.)
export default function Compass() {
  const intro = useContent('compassIntro');
  const deep = useContent('compassDeep');
  const items = useCompass();
  const { hash } = useLocation();

  if (hash === '#new') return <Navigate to="/new" replace />;

  return (
    <div className="page">
      <PageHead spaceKey="compass" lead={intro} deep={deep} />
      {items.length === 0 ? <Empty>המצפן עוד לא נטען.</Empty> : (
        <ol className="compass-cards">
          {items.map((c, i) => (
            <li key={c.id} className="card compass-card">
              <span className="compass-num" aria-hidden="true">{i + 1}</span>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              {c.question ? <p className="compass-q">{c.question}</p> : null}
            </li>
          ))}
        </ol>
      )}
      <Paths keys={['new', 'vision', 'dreams']} />
    </div>
  );
}
