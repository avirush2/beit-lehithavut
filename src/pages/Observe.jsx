import { useState } from 'react';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, useT, byNewest, visibleFor } from '../lib/store.jsx';
import { Paths } from '../components/Layout.jsx';
import { PageHead } from '../components/Botanical.jsx';
import { ItemActions } from '../components/ui.jsx';

// התבוננות (כנף החישה): שאלות על התקופה, וקולות קצרים – מה מתמוסס ומה מבקש להתהוות
function Voices() {
  const { isHost, requireUser, stamp } = useAuth();
  const intro = useContent('voicesIntro');
  const t = useT();
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
    <section className="section">
      <h2>{t('voices-title')}</h2>
      <p className="muted">{intro}</p>
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
    </section>
  );
}

export default function Observe() {
  const intro = useContent('observeIntro');
  const questions = useContent('timingQuestions');
  const list = String(questions || '').split('\n').map((q) => q.trim()).filter(Boolean);

  return (
    <div className="page">
      <PageHead spaceKey="observe" lead={intro} />
      <ul className="ponder">
        {list.map((q) => <li key={q}>{q}</li>)}
      </ul>
      <Voices />
      <Paths keys={['threshold', 'celebrate', 'dreams']} />
    </div>
  );
}
