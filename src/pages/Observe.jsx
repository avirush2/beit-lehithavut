import { useState } from 'react';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, useT, byNewest, visibleFor } from '../lib/store.jsx';
import { GroupHead } from '../components/Botanical.jsx';
import { ItemActions, LifeSpacePicker, SpaceBadges } from '../components/ui.jsx';

// חישה ← התבוננות: הזמנה אחת שזורמת – מה מתמוסס עכשיו, ומה מבקש להתהוות – וקולות קצרים שמצטרפים לתמונה
function Voices() {
  const { isHost, requireUser, stamp } = useAuth();
  const lead = useContent('observeIntro');
  const after = useContent('voicesIntro');
  const t = useT();
  const items = visibleFor(useCollection('voices'), isHost)?.sort(byNewest).slice(0, 24);
  const [dissolving, setDissolving] = useState('');
  const [emerging, setEmerging] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    if (!(dissolving.trim() || emerging.trim()) || !requireUser()) return;
    setBusy(true);
    try {
      await backend.add('voices', { dissolving: dissolving.trim(), emerging: emerging.trim(), spaces, ...stamp() });
      setDissolving(''); setEmerging(''); setSpaces([]); setSent(sent + 1);
    } finally { setBusy(false); }
  };

  return (
    <section className="section">
      <form className="observe" onSubmit={submit}>
        <p className="observe-lead">{lead}</p>
        <div className="observe-pair">
          <label className="observe-half dissolving">
            <span className="observe-q">{t('voices-dissolving')}</span>
            <textarea rows={3} value={dissolving} onChange={(e) => setDissolving(e.target.value)} maxLength={200} />
          </label>
          <label className="observe-half emerging">
            <span className="observe-q">{t('voices-emerging')}</span>
            <textarea rows={3} value={emerging} onChange={(e) => setEmerging(e.target.value)} maxLength={200} />
          </label>
        </div>
        <p className="observe-after">{after}</p>
        <LifeSpacePicker key={sent} value={spaces} onChange={setSpaces} collapsible />
        <div className="row-end"><button className="btn" disabled={busy || !(dissolving.trim() || emerging.trim())}>להוסיף קול</button></div>
      </form>
      {items?.length ? (
        <ul className="voices">
          {items.map((v) => (
            <li key={v.id} className={v.hidden ? 'is-hidden' : ''}>
              {v.dissolving ? <p><span className="voice-label">מתמוסס</span>{v.dissolving}</p> : null}
              {v.emerging ? <p><span className="voice-label em">מתהווה</span>{v.emerging}</p> : null}
              <SpaceBadges ids={v.spaces} />
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
  return (
    <div className="page">
      <GroupHead group="sensing" current="observe" />
      <Voices />
    </div>
  );
}
