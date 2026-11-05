import { Component, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { backend, isDemo } from '../lib/backend.js';
import { useAuth, useCollection, useNavGroups, useSettings, useSpaces, useT } from '../lib/store.jsx';
import { harvestWindow } from '../lib/seasons.js';
import { SITE } from '../content/defaults.js';
import SignIn from './SignIn.jsx';
import IdeaButton, { openIdea } from './IdeaButton.jsx';

// מונה פניות חדשות – נטען רק אצל מארחים (רק להם מותר לקרוא פניות)
function NewFeedbackCount() {
  const fresh = useCollection('feedback', ['status', 'new']);
  const proposals = useCollection('happeningProposals', ['status', 'new']);
  const n = (fresh?.length || 0) + (proposals?.length || 0);
  return n ? <span className="count-badge" title="פניות והצעות חדשות">{n}</span> : null;
}


export function Rings({ size = 34 }) {
  // סמל טבעות העץ: עצמי ← משפחה ← קהילה ← אדמה
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="rings">
      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".35" />
      <circle cx="21" cy="19.5" r="13" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".55" />
      <circle cx="21.5" cy="19" r="8" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".8" />
      <circle cx="22" cy="18.6" r="3" fill="var(--pollen)" />
    </svg>
  );
}

function MusicPlayer() {
  const settings = useSettings();
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  if (!settings.musicUrl) return null;
  const toggle = async () => {
    const a = audio.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); return; }
    a.volume = 0.35;
    try { await a.play(); setPlaying(true); } catch { setPlaying(false); }
  };
  return (
    <div className={`music ${playing ? 'on' : ''}`}>
      <audio ref={audio} src={settings.musicUrl} loop preload="none" />
      <button type="button" onClick={toggle} aria-pressed={playing} title={settings.musicTitle || 'מוזיקה'}>
        <span className="music-bars" aria-hidden="true"><i /><i /><i /></span>
        {playing ? 'השתקה' : 'מוזיקה'}
      </button>
    </div>
  );
}

export function HarvestBanner() {
  const h = harvestWindow();
  if (!h) return null;
  return (
    <div className="harvest-banner">
      <strong>{h.label}</strong>
      <span>{h.after ? ' – העונה התחלפה.' : h.days === 0 ? ' – היום.' : ` – בעוד ${h.days} ימים.`}</span>
      <span> מה צמח אצלנו העונה? </span>
      <Link to="/categories">לקציר במרחבי החיים</Link>
    </div>
  );
}

// תקלה בדף אחד לא מפילה את כל האתר
class PageBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error(error); }
  componentDidUpdate(prev) { if (prev.path !== this.props.path && this.state.error) this.setState({ error: null }); }
  render() {
    if (this.state.error) return <div className="page"><div className="empty">משהו בדף הזה לא הצליח להיטען. אפשר לרענן, או לחזור <Link to="/">לעמוד הבית</Link>.</div></div>;
    return this.props.children;
  }
}

// הלשונית שהעמוד הנוכחי שייך אליה: לפי הכתובת שלה ושל המרחבים שבה
function useCurrentGroup() {
  const groups = useNavGroups();
  const spaces = useSpaces();
  const { pathname } = useLocation();
  const paths = (g) => [g.to, ...g.spaces.flatMap((k) => {
    const s = spaces.find((x) => x.key === k);
    return s ? [s.to.split('#')[0], ...(s.also || [])] : [];
  })];
  return groups.find((g) => !g.together && paths(g).some((p) => pathname === p || pathname.startsWith(`${p}/`)));
}

// כל לשונית פותחת עמוד; "יחד בבית" פותח את חלון השיתוף
function MainNav() {
  const groups = useNavGroups();
  const current = useCurrentGroup();
  const t = useT();
  return (
    <nav className="site-nav" aria-label="ניווט ראשי">
      <div className="nav-row">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>{t('nav-home')}</NavLink>
        {groups.map((g) => (g.together
          ? <button key={g.key} type="button" onClick={() => openIdea()}>{g.title}</button>
          : <Link key={g.key} to={g.to} className={current?.key === g.key ? 'active' : ''}>{g.title}</Link>))}
      </div>
    </nav>
  );
}

// מעבר לעמוד – לראש העמוד; קישור עם # – לחלק המתאים (מחכים רגע שהתוכן ייטען)
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return undefined; }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++tries > 25) {
        clearInterval(timer);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
    return () => clearInterval(timer);
  }, [pathname, hash]);
}

export default function Layout() {
  const { user, name, isAdmin, isHost, openSignIn } = useAuth();
  const { pathname } = useLocation();
  const t = useT();
  useScrollOnNavigate();

  return (
    <div className="app">
      {isDemo ? <div className="demo-bar">מצב הדגמה – התוכן נשמר רק בדפדפן הזה, עד שנחבר את Firebase.</div> : null}
      <header className="site-header">
        <Link to="/" className="brand">
          <Rings />
          <span>
            <span className="brand-name">{SITE.name}</span>
            <span className="brand-tag">{t('site-tagline')}</span>
          </span>
        </Link>
        <div className="user-area">
          <Link to="/search" className="link-btn quiet search-link" aria-label="חיפוש">⌕ חיפוש</Link>
          {isHost ? <Link to="/admin" className="link-btn">{isAdmin ? 'ניהול' : 'אירוח'}<NewFeedbackCount /></Link> : null}
          {user ? (
            <>
              <span className="hello">שלום, {name}</span>
              <button type="button" className="link-btn quiet" onClick={() => backend.signOut()}>יציאה</button>
            </>
          ) : (
            <button type="button" className="btn btn-small" onClick={openSignIn}>כניסה</button>
          )}
        </div>
      </header>
      <MainNav />
      <main className="main">
        <PageBoundary path={pathname}><Outlet /></PageBoundary>
      </main>
      <footer className="site-footer">
        <Rings size={26} />
        <p>{SITE.name} · {t('site-tagline')}</p>
        <p className="muted small">{t('footer-line')}</p>
        <p className="footer-share">
          הבית הזה נבנה יחד · <button type="button" className="link-btn" onClick={() => openIdea()}>{t('footer-share')}</button>
        </p>
      </footer>
      <IdeaButton />
      <MusicPlayer />
      <SignIn />
    </div>
  );
}
