import { Component, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { backend, isDemo } from '../lib/backend.js';
import { useAuth, useCollection, useFeedbackTypes, useNavGroups, useSettings, useSpaces, useT } from '../lib/store.jsx';
import { harvestWindow } from '../lib/seasons.js';
import { SITE } from '../content/defaults.js';
import { Motif } from './Botanical.jsx';
import SignIn from './SignIn.jsx';
import IdeaButton, { openIdea } from './IdeaButton.jsx';

// מונה פניות חדשות – נטען רק אצל מארחים (רק להם מותר לקרוא פניות)
function NewFeedbackCount() {
  const fresh = useCollection('feedback', ['status', 'new']);
  return fresh?.length ? <span className="count-badge" title="פניות חדשות ב'יש לנו רעיון'">{fresh.length}</span> : null;
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

// מבנה הבית: כל לשונית עם הפריטים שלה – מרחבים (קישורים) או סוגי פנייה ב"יש לנו רעיון"
export function useHouse() {
  const spaces = useSpaces();
  const groups = useNavGroups();
  const feedbackTypes = useFeedbackTypes();
  return groups.map((g) => ({
    ...g,
    items: g.together
      ? feedbackTypes.map((f) => ({ key: f.key, title: f.label, line: f.hint, tone: g.tone, open: () => openIdea(f.key) }))
      : g.spaces.map((k) => spaces.find((s) => s.key === k)).filter(Boolean),
  }));
}

const inSpace = (pathname, s) => [s.to, ...(s.also || [])].some((p) => pathname === p || pathname.startsWith(`${p}/`));

function MainNav() {
  const house = useHouse();
  const t = useT();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(null);
  const ref = useRef(null);
  useEffect(() => { setOpen(null); }, [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!ref.current?.contains(e.target)) setOpen(null); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  const current = house.find((g) => g.items.some((s) => s.to && inSpace(pathname, s)));
  const panel = house.find((g) => g.key === open);

  return (
    <nav className="site-nav" aria-label="ניווט ראשי" ref={ref}>
      <div className="nav-row">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>{t('nav-home')}</NavLink>
        {house.map((g) => (
          <button key={g.key} type="button" aria-expanded={open === g.key}
            className={`${current?.key === g.key ? 'active' : ''} ${open === g.key ? 'open' : ''}`}
            onClick={() => setOpen(open === g.key ? null : g.key)}>
            {g.title}<span className="caret" aria-hidden="true">⌄</span>
          </button>
        ))}
      </div>
      {panel ? (
        <div className="nav-panel">
          <p className="nav-panel-name">{panel.name}</p>
          <div className="nav-items">
            {panel.items.map((s) => (s.open ? (
              <button key={s.key} type="button" className={`nav-item tone-${s.tone}`} onClick={() => { setOpen(null); s.open(); }}>
                <strong>{s.title}</strong><span>{s.line}</span>
              </button>
            ) : (
              <Link key={s.key} to={s.to} className={`nav-item tone-${s.tone} ${inSpace(pathname, s) ? 'here' : ''}`}>
                <strong>{s.title}</strong><span>{s.line}</span>
              </Link>
            )))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}

export default function Layout() {
  const { user, name, isAdmin, isHost, openSignIn } = useAuth();
  const { pathname } = useLocation();
  const t = useT();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

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

// שבילים שיוצאים מכאן – הצעות, לא מסלול
export function Paths({ keys, text = 'שבילים שיוצאים מכאן' }) {
  const spaces = useSpaces();
  return (
    <nav className="paths" aria-label={text}>
      <p className="muted small">{text}</p>
      <div className="paths-list">
        {keys.map((k) => spaces.find((s) => s.key === k)).filter(Boolean).map((s) => (
          <Link key={s.key} to={s.to} className={`path-link tone-${s.tone}`}>
            <Motif kind={s.motif} size={36} />
            <span>{s.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
