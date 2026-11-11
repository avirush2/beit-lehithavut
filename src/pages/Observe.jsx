import { useState } from 'react';
import { Link } from 'react-router-dom';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, useT, byNewest, visibleFor } from '../lib/store.jsx';
import { GroupHead } from '../components/Botanical.jsx';
import { ItemActions, LifeSpacePicker, Prose, SpaceBadges } from '../components/ui.jsx';

// חישה ← מה מתמוסס: הזמנה אחת – מה מתמוסס ומה קשה עכשיו. מאחד את "התבוננות" ו"שיתוף קושי":
// שיתופים חדשים נשמרים בקולות; קולות ישנים (גם עם "מה מתהווה") ושיתופי קושי ישנים מוצגים יחד ברשימה אחת.
function Voices() {
  const { isHost, requireUser, stamp } = useAuth();
  const lead = useContent('observeIntro');
  const after = useContent('voicesIntro');
  const t = useT();
  const voices = visibleFor(useCollection('voices'), isHost)?.filter((v) => v.kind !== 'free');
  const pains = visibleFor(useCollection('pain'), isHost);
  const items = voices && pains
    ? [...voices.map((v) => ({ ...v, col: 'voices' })), ...pains.map((p) => ({ ...p, col: 'pain' }))].sort(byNewest).slice(0, 36)
    : null;
  const [text, setText] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !requireUser()) return;
    setBusy(true);
    try {
      await backend.add('voices', { dissolving: text.trim(), spaces, ...stamp() });
      setText(''); setSpaces([]); setSent(sent + 1);
    } finally { setBusy(false); }
  };

  return (
    <section className="section">
      <form className="invite tone-peach" onSubmit={submit}>
        <p className="invite-lead">{lead}</p>
        <label className="invite-q" htmlFor="voice-text">{t('voices-question')}</label>
        <textarea id="voice-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={600} />
        <p className="invite-after">{after}</p>
        <LifeSpacePicker key={sent} value={spaces} onChange={setSpaces} collapsible />
        <div className="row-end"><button className="btn" disabled={busy || !text.trim()}>{t('voices-send')}</button></div>
      </form>
      <Prose text={t('voices-to-dream')} className="invite-bridge" />
      {items?.length ? (
        <ul className="shares">
          {items.map((v) => (
            <li key={`${v.col}-${v.id}`} className={`share ${v.hidden ? 'is-hidden' : ''}`}>
              {v.col === 'pain' ? (
                <>
                  <p>{v.body.length > 260 ? `${v.body.slice(0, 260)}…` : v.body}</p>
                  <SpaceBadges ids={v.spaces} />
                  <div className="comment-foot">
                    <span className="muted small">{v.name}</span>
                    <Link to={`/threshold/${v.id}`} className="small">{t('voices-listen')} ←</Link>
                  </div>
                </>
              ) : (
                <>
                  {v.dissolving ? <p>{v.dissolving}</p> : null}
                  {v.emerging ? <p><span className="voice-label">מתהווה</span>{v.emerging}</p> : null}
                  <SpaceBadges ids={v.spaces} />
                  <div className="comment-foot">
                    <span className="muted small">{v.name}</span>
                    <ItemActions col="voices" item={v} />
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

// חישה ← שיתוף חופשי: אותו כרטיס הזמנה, בלי נושא מוגדר. נשמר בקולות עם kind: 'free'.
export function FreeShare() {
  const { isHost, requireUser, stamp } = useAuth();
  const t = useT();
  const items = visibleFor(useCollection('voices'), isHost)?.filter((v) => v.kind === 'free').sort(byNewest);
  const [text, setText] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !requireUser()) return;
    setBusy(true);
    try {
      await backend.add('voices', { kind: 'free', text: text.trim(), spaces, ...stamp() });
      setText(''); setSpaces([]); setSent(sent + 1);
    } finally { setBusy(false); }
  };

  return (
    <div className="page">
      <GroupHead group="sensing" current="free" />
      <section className="section">
        <form className="invite tone-lilac" onSubmit={submit}>
          <p className="invite-lead">{t('free-lead')}</p>
          <label className="invite-q" htmlFor="free-text">{t('free-question')}</label>
          <textarea id="free-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
          <p className="invite-after">{t('free-after')}</p>
          <LifeSpacePicker key={sent} value={spaces} onChange={setSpaces} collapsible />
          <div className="row-end"><button className="btn" disabled={busy || !text.trim()}>{t('free-send')}</button></div>
        </form>
        {items?.length ? (
          <ul className="shares">
            {items.map((v) => (
              <li key={v.id} className={`share ${v.hidden ? 'is-hidden' : ''}`}>
                <Prose text={v.text} />
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
    </div>
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
