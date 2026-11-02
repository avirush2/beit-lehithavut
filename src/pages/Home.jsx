import { Link } from 'react-router-dom';
import { useCollection, useContent, byNewest } from '../lib/store.jsx';
import { HarvestBanner } from '../components/Layout.jsx';
import { Motif, Sprig } from '../components/Botanical.jsx';
import { Prose } from '../components/ui.jsx';
import { SITE, SPACES } from '../content/defaults.js';

export default function Home() {
  const welcome = useContent('welcomeBody');
  const welcomeQuestion = useContent('welcomeQuestion');
  const openQuestion = useContent('openQuestion');
  const versions = useCollection('definitionVersions');
  const current = versions?.slice().sort(byNewest)[0];

  return (
    <div className="home">
      <section className="gate">
        <Sprig className="gate-sprig start" />
        <Sprig className="gate-sprig end" />
        <div className="gate-inner">
          <p className="eyebrow">ברוכות וברוכים הבאים 🌿</p>
          <h1>{SITE.name}</h1>
          <p className="gate-tag">{SITE.tagline}</p>
          <Prose text={welcome} className="gate-text" />
        </div>
      </section>

      <HarvestBanner />

      <section className="section paths-home">
        <h2 className="center">{welcomeQuestion}</h2>
        <div className="doors">
          {SPACES.filter((s) => !s.navOnly).map((s) => (
            <Link key={s.key} to={s.to} className={`door tone-${s.tone}`}>
              <Motif kind={s.motif} size={56} />
              <h3>{s.title}</h3>
              <p>{s.line}</p>
            </Link>
          ))}
        </div>
      </section>

      {current ? (
        <section className="band band-soft">
          <div className="band-inner">
            <p className="eyebrow">מהו חדש?</p>
            <blockquote className="definition">{current.text}</blockquote>
            <Link to="/new">ההגדרה פתוחה לשיחה ולשינוי ←</Link>
          </div>
        </section>
      ) : null}

      <section className="section open-question">
        <p className="eyebrow">שאלה שמלווה אותנו</p>
        <p className="question">{openQuestion}</p>
        <Link to="/my-dream/first-dream" className="btn btn-ghost">לשיחה ביומן של אבי</Link>
      </section>
    </div>
  );
}
