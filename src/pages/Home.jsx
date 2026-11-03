import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCollection, useContent, byNewest } from '../lib/store.jsx';
import { HarvestBanner } from '../components/Layout.jsx';
import { Motif } from '../components/Botanical.jsx';
import GardenScene from '../components/GardenScene.jsx';
import { openIdea } from '../components/IdeaButton.jsx';
import { Prose } from '../components/ui.jsx';
import { SITE, SPACES } from '../content/defaults.js';

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
  const ways = [
    { label: 'לשתף חלום או רעיון', tone: 'blossom', go: () => requireUser() && navigate('/dreams/new') },
    { label: 'להעלות שאלה לחקירה משותפת', tone: 'sky', go: () => navigate('/categories?share=question') },
    { label: 'לשתף התנסות או יוזמה', tone: 'sage', go: () => navigate('/categories?share=experiment') },
    { label: 'להציע מפגש, ידע או תוכן', tone: 'sun', go: () => openIdea('partner', 'איזה מפגש, ידע או תוכן היינו רוצים להביא למרחב?') },
    { label: 'להציע חיבור לאדם או לארגון', tone: 'lilac', go: () => openIdea('partner', 'למי כדאי שנתחבר, ומה החיבור יכול להצמיח?') },
  ];
  return (
    <section className="band band-festive">
      <div className="band-inner">
        <p className="hand">להביא משהו מעצמנו</p>
        <p className="invite-text">{body}</p>
        <div className="ways">
          {ways.map((w) => (
            <button key={w.label} type="button" className={`way tone-${w.tone}`} onClick={w.go}>{w.label}</button>
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
  const versions = useCollection('definitionVersions');
  const current = versions?.slice().sort(byNewest)[0];

  return (
    <div className="home">
      <section className="gate">
        <div className="gate-inner">
          <p className="hand">ברוכות וברוכים הבאים 🌿</p>
          <h1>{SITE.name}</h1>
          <p className="gate-tag">{SITE.tagline}</p>
          <Prose text={welcome} className="gate-text" />
        </div>
        <GardenScene className="gate-scene" />
      </section>

      <section className="band band-sparks">
        <div className="band-inner">
          <p className="hand">ניצוצות</p>
          <Prose text={sparks} className="sparks-text" />
        </div>
      </section>

      <HarvestBanner />

      <section className="section paths-home">
        <h2 className="center scribble">{welcomeQuestion}</h2>
        <div className="doors">
          {SPACES.map((s) => (
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
            <Link to="/compass#new">ההגדרה פתוחה לשיחה ולשינוי ←</Link>
          </div>
        </section>
      ) : null}

      <section className="section open-question">
        <p className="hand">שאלה שמלווה אותנו</p>
        <p className="question">{openQuestion}</p>
      </section>
    </div>
  );
}
