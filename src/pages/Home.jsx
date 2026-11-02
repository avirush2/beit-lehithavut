import { useState } from 'react';
import { Link } from 'react-router-dom';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, byNewest, visibleFor } from '../lib/store.jsx';
import { HarvestBanner } from '../components/Layout.jsx';
import { ItemActions, Prose } from '../components/ui.jsx';

const DOORS = [
  { to: '/tickle', title: 'דגדוד חלומות', text: 'למי שאומר.ת "אין לי חלום". קלפים, הקשבה ומשחק.' },
  { to: '/dreams', title: 'תמונת חלום רחבה', text: 'איך נראים החיים שאני מבקש.ת לחיות? איזה ריפוי מבקש להתהוות דרכי?' },
  { to: '/categories', title: 'חלימה במרחבי חיים', text: 'חינוך, אדמה, כלכלה, קבלת החלטות… רעיונות ודיאלוג סביבם.' },
  { to: '/depth', title: 'עומק השינוי', text: 'מעיינות השראה, חומרי קריאה וחבורות לימוד על מהות השינוי.' },
  { to: '/threshold', title: 'מהתפר', text: 'מקום לכאב, לייאוש ולביקורת – כחומר גלם לחלום.' },
];

function Voices() {
  const { isHost, requireUser, stamp } = useAuth();
  const intro = useContent('voicesIntro');
  const items = visibleFor(useCollection('voices'), isHost)?.sort(byNewest).slice(0, 24);
  const [dissolving, setDissolving] = useState('');
  const [emerging, setEmerging] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!(dissolving.trim() || emerging.trim()) || !requireUser()) return;
    setBusy(true);
    try {
      await backend.add('voices', { dissolving: dissolving.trim(), emerging: emerging.trim(), ...stamp() });
      setDissolving(''); setEmerging('');
    } finally { setBusy(false); }
  };

  return (
    <section className="band band-deep">
      <div className="band-inner">
        <h2>קולות מהתפר</h2>
        <p className="lead">{intro}</p>
        <form className="voices-form" onSubmit={submit}>
          <label className="field"><span className="field-label">מה מתמוסס</span>
            <input value={dissolving} onChange={(e) => setDissolving(e.target.value)} maxLength={200} />
          </label>
          <label className="field"><span className="field-label">מה מבקש להתהוות</span>
            <input value={emerging} onChange={(e) => setEmerging(e.target.value)} maxLength={200} />
          </label>
          <button className="btn" disabled={busy}>להוסיף קול</button>
        </form>
        {items?.length ? (
          <ul className="voices">
            {items.map((v) => (
              <li key={v.id} className={v.hidden ? 'is-hidden' : ''}>
                {v.dissolving ? <p><span className="voice-label">מתמוסס</span>{v.dissolving}</p> : null}
                {v.emerging ? <p><span className="voice-label em">מתהווה</span>{v.emerging}</p> : null}
                <div className="comment-foot">
                  <span className="muted small">{v.name}</span>
                  <ItemActions col="voices" item={v} />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export default function Home() {
  const title = useContent('timingTitle');
  const body = useContent('timingBody');
  const openQuestion = useContent('openQuestion');
  const versions = useCollection('definitionVersions');
  const current = versions?.slice().sort(byNewest)[0];

  return (
    <div className="home">
      <section className="hero">
        <p className="eyebrow">העיתוי והצורך</p>
        <h1>{title}</h1>
        <Prose text={body} className="timing" />
      </section>

      <HarvestBanner />

      {current ? (
        <section className="band band-forest">
          <div className="band-inner">
            <p className="eyebrow">מהו חדש?</p>
            <blockquote className="definition">{current.text}</blockquote>
            <Link to="/new" className="link-on-dark">ההגדרה פתוחה לדיון ולשינוי ←</Link>
          </div>
        </section>
      ) : null}

      <Voices />

      <section className="section">
        <h2>דלתות</h2>
        <p className="muted">אפשר להיכנס מכל דלת ולעבור בחופשיות. הסדר הוא רק הצעה למסע.</p>
        <div className="doors">
          {DOORS.map((d, i) => (
            <Link key={d.to} to={d.to} className="door">
              <span className="door-num">{i + 1}</span>
              <h3>{d.title}</h3>
              <p>{d.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section open-question">
        <p className="eyebrow">השאלה הפתוחה</p>
        <p className="question">{openQuestion}</p>
        <Link to="/my-dream/first-dream" className="btn btn-ghost">לשיחה ביומן של אבי</Link>
      </section>
    </div>
  );
}
