import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, useDecks, useSettings, useT } from '../lib/store.jsx';
import { Prose } from '../components/ui.jsx';

// הנבעת חלום: חלק בתוך עמוד החלימה, למי שהחלום עוד מחכה למילים
export default function Tickle() {
  const { user, isHost, requireUser } = useAuth();
  const navigate = useNavigate();
  const intro = useContent('tickleIntro');
  const t = useT();
  const settings = useSettings();
  const DECKS = useDecks();
  const cards = useCollection('cards') || [];

  const [deck, setDeck] = useState(null);
  const [card, setCard] = useState(null);
  const [flipKey, setFlipKey] = useState(0);
  const [answer, setAnswer] = useState('');
  const [gathered, setGathered] = useState([]);
  const [seen, setSeen] = useState([]);
  const [saved, setSaved] = useState('');

  const byDeck = useMemo(() => ({
    inside: cards.filter((c) => c.deck === 'inside'),
    reality: cards.filter((c) => c.deck === 'reality'),
  }), [cards]);

  const draw = (key) => {
    const pool = byDeck[key];
    if (!pool.length) return;
    // לא לחזור על קלף עד שכל החפיסה נשלפה
    let fresh = pool.filter((c) => !seen.includes(c.id));
    if (!fresh.length) { fresh = pool; setSeen([]); }
    const next = fresh[Math.floor(Math.random() * fresh.length)];
    setSeen((s) => [...s, next.id]);
    setDeck(key); setCard(next); setAnswer(''); setSaved(''); setFlipKey((k) => k + 1);
  };

  const gather = () => {
    if (!answer.trim()) return;
    setGathered((g) => [...g, { q: card.text, a: answer.trim() }]);
    setAnswer('');
    draw(deck);
  };

  const savePrivate = async () => {
    if (!answer.trim() || !requireUser()) return;
    await backend.add(`users/${user.uid}/notes`, { question: card.text, answer: answer.trim() });
    setSaved('נשמר ביומן הפרטי שלך. רק את.ה רואה אותו.');
  };

  const toDraft = () => {
    const all = answer.trim() ? [...gathered, { q: card.text, a: answer.trim() }] : gathered;
    const draft = all.map((x) => x.a).join('\n\n');
    navigate('/dreams/new', { state: { draft } });
  };

  return (
    <section className="section tickle tone-sun" id="tickle">
      <header className="section-head">
        <h2>{t('tickle-title')}</h2>
        <Prose text={intro} className="muted" />
      </header>

      {settings.meditationUrl ? (
        <section className="card meditation">
          <h2>{settings.meditationTitle || 'מדיטציה מונחית'}</h2>
          <p className="muted">אפשר להתחיל בכמה דקות של הקשבה פנימה, ולשלוף קלף אחר כך.</p>
          <audio controls preload="none" src={settings.meditationUrl} />
        </section>
      ) : isHost ? (
        <p className="notice">כאן תופיע מדיטציה מונחית ברגע שתוסיפו קובץ שמע בממשק הניהול (הגדרות).</p>
      ) : null}

      <section className="decks">
        {DECKS.map((d) => (
          <button key={d.key} type="button" className={`deck deck-${d.key} ${deck === d.key ? 'on' : ''}`} onClick={() => draw(d.key)} disabled={!byDeck[d.key].length}>
            <span className="deck-stack" aria-hidden="true"><i /><i /><i /></span>
            <span className="deck-title">{d.title}</span>
            <span className="deck-text">{d.text}</span>
            <span className="deck-cta">לשלוף קלף ←</span>
          </button>
        ))}
      </section>

      {card ? (
        <section className="drawn">
          <div key={flipKey} className={`play-card flip deck-${deck}`}>
            <p>{card.text}</p>
          </div>
          <textarea rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="מה עולה?" />
          <div className="row-between wrap">
            <button type="button" className="link-btn" onClick={() => draw(deck)}>קלף אחר</button>
            <div className="row-start">
              <button type="button" className="btn btn-ghost" disabled={!answer.trim()} onClick={savePrivate}>לשמור רק לעצמי</button>
              <button type="button" className="btn" disabled={!answer.trim()} onClick={gather}>לאסוף ולשלוף עוד</button>
            </div>
          </div>
          {saved ? <p className="notice">{saved}</p> : null}
        </section>
      ) : null}

      {gathered.length ? (
        <section className="card gathered">
          <h2>מה נאסף עד עכשיו</h2>
          <ol>{gathered.map((g, i) => <li key={i}><span className="muted small">{g.q}</span><p>{g.a}</p></li>)}</ol>
          {gathered.length >= 3 ? <p className="notice">אולי כבר יש כאן חלום? אפשר לאסוף את התשובות לטיוטה, ולהמשיך משם.</p> : null}
          <button type="button" className="btn" onClick={toDraft}>לאסוף לטיוטת חלום</button>
        </section>
      ) : null}
    </section>
  );
}
