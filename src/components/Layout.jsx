import { Component, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { backend, isDemo } from '../lib/backend.js';
import { useAuth, useSettings } from '../lib/store.jsx';
import { harvestWindow } from '../lib/seasons.js';
import { SITE, SPACES, space } from '../content/defaults.js';
import { Motif } from './Botanical.jsx';
import SignIn from './SignIn.jsx';

export const NAV = [
  { to: '/', label: 'שער הכניסה', end: true },
  ...SPACES.map((s) => ({ to: s.to, label: s.title })),
];

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

export default function Layout() {
  const { user, name, isAdmin, isHost, openSignIn } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="app">
      {isDemo ? <div className="demo-bar">מצב הדגמה – התוכן נשמר רק בדפדפן הזה, עד שנחבר את Firebase.</div> : null}
      <header className="site-header">
        <Link to="/" className="brand">
          <Rings />
          <span>
            <span className="brand-name">{SITE.name}</span>
            <span className="brand-tag">{SITE.tagline}</span>
          </span>
        </Link>
        <div className="user-area">
          {isHost ? <Link to="/admin" className="link-btn">{isAdmin ? 'ניהול' : 'אירוח'}</Link> : null}
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
      <nav className="site-nav" aria-label="ניווט ראשי">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>{n.label}</NavLink>
        ))}
      </nav>
      <main className="main">
        <PageBoundary path={pathname}><Outlet /></PageBoundary>
      </main>
      <footer className="site-footer">
        <Rings size={26} />
        <p>{SITE.name} · {SITE.tagline}</p>
        <p className="muted small">הדרך תמשיך להיות חכמה מאיתנו.</p>
      </footer>
      <MusicPlayer />
      <SignIn />
    </div>
  );
}

// שבילים שיוצאים מכאן – הצעות, לא מסלול
export function Paths({ keys, text = 'שבילים שיוצאים מכאן' }) {
  return (
    <nav className="paths" aria-label={text}>
      <p className="muted small">{text}</p>
      <div className="paths-list">
        {keys.map(space).filter(Boolean).map((s) => (
          <Link key={s.key} to={s.to} className={`path-link tone-${s.tone}`}>
            <Motif kind={s.motif} size={36} />
            <span>{s.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
