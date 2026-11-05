import { Link } from 'react-router-dom';
import { useCollection, useContent, useSettings, useT, byNewest } from '../lib/store.jsx';
import { HarvestBanner, useHouse } from '../components/Layout.jsx';
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

// מפת ההתמצאות: שתי כנפיים, לב ושתי רגליים – וכפתורי גישה לכל מרחב
const MAP_TEXT = { dreaming: 'mapDreaming', sensing: 'mapSensing', becoming: 'mapBecoming', about: 'mapAbout', together: 'mapTogether' };

function HousePart({ g }) {
  const text = useContent(MAP_TEXT[g.key]);
  return (
    <article className={`house-part part-${g.key} tone-${g.tone}`}>
      <h3 className="hand">{g.name}</h3>
      <p>{text}</p>
      <div className="house-links">
        {g.items.map((s) => (s.open
          ? <button key={s.key} type="button" className="house-link" onClick={s.open}>{s.title}</button>
          : <Link key={s.key} to={s.to} className="house-link">{s.title}</Link>))}
      </div>
    </article>
  );
}

function HouseMap() {
  const intro = useContent('mapIntro');
  const house = useHouse();
  return (
    <section className="section house-map">
      <p className="house-intro">{intro}</p>
      <div className="house">
        {house.map((g) => <HousePart key={g.key} g={g} />)}
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

      <HouseMap />

      {settings.showGrowing ? <Growing /> : null}
    </div>
  );
}
