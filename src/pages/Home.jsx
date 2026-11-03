import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCollection, useContent, useInviteWays, useSpaces, useT, byNewest } from '../lib/store.jsx';
import { HarvestBanner } from '../components/Layout.jsx';
import { Motif } from '../components/Botanical.jsx';
import GardenScene from '../components/GardenScene.jsx';
import { openIdea } from '../components/IdeaButton.jsx';
import { Prose } from '../components/ui.jsx';
import { SITE } from '../content/defaults.js';

// גדלים שונים לדלתות – כדי שהשער ירגיש כמו גן ולא כמו טבלה
const DOOR_SIZE = { dreams: 'big', celebrate: 'wide' };

// מה צומח עכשיו: מה שהצטרף לאחרונה – חלומות, רעיונות ושיתופי השראה. מתחלף מעצמו.
function Growing() {
  const title = useContent('growingQuestion');
  const pick = (items, kind, to) => (items || []).filter((x) => !x.hidden).map((x) => ({ ...x, kind, to: to(x) }));
  const dreams = useCollection('dreams');
  const ideas = useCollection('ideas');
  const stories = useCollection('stories');
  const all = [
    ...pick(dreams, 'ניצוץ של חלום', (x) => `/dreams/${x.id}`),
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

function Invite() {
  const { requireUser } = useAuth();
  const navigate = useNavigate();
  const body = useContent('inviteBody');
  const t = useT();
  const go = {
    dream: () => requireUser() && navigate('/dreams/new'),
    question: () => navigate('/categories?share=question'),
    experiment: () => navigate('/categories?share=experiment'),
  };
  const ways = useInviteWays().map((w) => ({ ...w, go: go[w.key] || (() => openIdea('partner', w.prompt)) }));
  return (
    <section className="band band-festive">
      <div className="band-inner">
        <p className="hand">{t('gate-invite')}</p>
        <p className="invite-text">{body}</p>
        <div className="ways">
          {ways.map((w) => (
            <button key={w.key} type="button" className={`way tone-${w.tone}`} onClick={w.go}>{w.label}</button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const welcome = useContent('welcomeBody');
  const welcomeQuestion = useContent('welcomeQuestion');
  const sparks = useContent('sparksBody');
  const openQuestion = useContent('openQuestion');
  const spaces = useSpaces();
  const t = useT();
  const versions = useCollection('definitionVersions');
  const current = versions?.slice().sort(byNewest)[0];

  return (
    <div className="home">
      <section className="gate">
        <div className="gate-inner">
          <p className="hand">{t('gate-hello')}</p>
          <h1>{SITE.name}</h1>
          <p className="gate-tag">{SITE.tagline}</p>
          <Prose text={welcome} className="gate-text" />
        </div>
        <GardenScene className="gate-scene" />
      </section>

      <section className="band band-sparks">
        <div className="band-inner">
          <p className="hand">{t('gate-sparks')}</p>
          <Prose text={sparks} className="sparks-text" />
        </div>
      </section>

      <HarvestBanner />

      <section className="section paths-home">
        <h2 className="center scribble">{welcomeQuestion}</h2>
        <div className="doors">
          {spaces.map((s) => (
            <Link key={s.key} to={s.to} className={`door tone-${s.tone} ${DOOR_SIZE[s.key] || ''}`}>
              <Motif kind={s.motif} size={DOOR_SIZE[s.key] === 'big' ? 110 : 56} />
              <h3>{s.title}</h3>
              <p>{s.line}</p>
            </Link>
          ))}
        </div>
      </section>

      <Growing />

      <Invite />

      {current ? (
        <section className="band band-soft">
          <div className="band-inner">
            <p className="eyebrow">מהו חדש?</p>
            <blockquote className="definition">{current.text}</blockquote>
            <Link to="/compass#new">{t('gate-definition')}</Link>
          </div>
        </section>
      ) : null}

      <section className="section open-question">
        <p className="hand">{t('gate-open')}</p>
        <p className="question">{openQuestion}</p>
      </section>
    </div>
  );
}
