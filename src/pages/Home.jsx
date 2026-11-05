import { Link } from 'react-router-dom';
import { useCollection, useContent, useSettings, useT, byNewest } from '../lib/store.jsx';
import { HarvestBanner } from '../components/Layout.jsx';
import GardenScene from '../components/GardenScene.jsx';
import { Prose } from '../components/ui.jsx';
import { SITE } from '../content/defaults.js';

// מה צומח עכשיו: מה שהצטרף לאחרונה – חלומות, רעיונות ושיתופי השראה. מוצג רק אם הופעל בהגדרות.
function Growing() {
  const title = useContent('growingQuestion');
  const pick = (items, kind, to) => (items || []).filter((x) => !x.hidden).map((x) => ({ ...x, kind, to: to(x) }));
  const dreams = useCollection('dreams');
  const ideas = useCollection('ideas');
  const stories = useCollection('stories');
  const all = [
    ...pick(dreams, 'שיתוף חלום', (x) => `/dreams/${x.id}`),
    ...pick(ideas, 'במרחבי החיים', (x) => `/ideas/${x.id}`),
    ...pick(stories, 'חגיגה והשראה', () => '/celebrate'),
  ].sort(byNewest).slice(0, 4);
  if (!all.length) return null;
  return (
    <section className="section growing">
      <h2 className="center">{title}</h2>
      <div className="growing-list">
        {all.map((x) => (
          <Link key={`${x.kind}-${x.id}`} to={x.to} className="growing-item">
            <span className="muted small">{x.kind}</span>
            <strong>{x.title}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const welcome = useContent('welcomeBody');
  const settings = useSettings();
  const t = useT();

  return (
    <div className="home">
      <section className="gate">
        <div className="gate-inner">
          <p className="hand">{t('gate-hello')}</p>
          <h1>{SITE.name}</h1>
          <p className="gate-tag">{t('site-tagline')}</p>
          <Prose text={welcome} className="gate-text" />
        </div>
        <GardenScene className="gate-scene" />
      </section>

      <HarvestBanner />

      {settings.showGrowing ? <Growing /> : null}
    </div>
  );
}
