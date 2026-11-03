import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { backend } from '../lib/backend.js';
import { useAuth } from '../lib/store.jsx';
import { Modal } from './ui.jsx';

// "יש לנו רעיון 🌱" – משוב, רעיונות ושותפות בפיתוח המרחב עצמו.
// פתוח לכולם, גם בלי הרשמה. הפניות נקראות רק בידי מארחים (ראו firestore.rules).
export const FEEDBACK_TYPES = [
  { key: 'feedback', label: 'משוב על האתר', hint: 'מה עובד? מה לא ברור? מה אפשר לשפר?' },
  { key: 'idea', label: 'רעיון חדש', hint: 'מה חסר כאן? מה הייתם רוצים להוסיף?' },
  { key: 'partner', label: 'שותפות בפיתוח', hint: 'רוצים לקחת חלק ביצירה, בתחזוקה, בתוכן, במפגשים או בחיבורים?' },
];

// פתיחה מכל מקום באתר: openIdea('partner', 'טקסט פתיחה אופציונלי')
export function openIdea(type = 'feedback', prompt = '') {
  window.dispatchEvent(new CustomEvent('open-idea', { detail: { type, prompt } }));
}

export default function IdeaButton() {
  const { user, name: myName } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('feedback');
  const [prompt, setPrompt] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [trap, setTrap] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | error

  useEffect(() => {
    const onOpen = (e) => {
      setType(e.detail?.type || 'feedback');
      setPrompt(e.detail?.prompt || '');
      setState('idle');
      setOpen(true);
    };
    window.addEventListener('open-idea', onOpen);
    return () => window.removeEventListener('open-idea', onOpen);
  }, []);

  useEffect(() => { if (open && user && !name) setName(myName || ''); }, [open, user, myName, name]);

  const close = () => setOpen(false);
  const current = FEEDBACK_TYPES.find((t) => t.key === type) || FEEDBACK_TYPES[0];

  const send = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    // שדה נסתר שרק תוכנות אוטומטיות ממלאות
    if (trap) { setState('sent'); return; }
    setState('sending');
    try {
      await backend.add('feedback', {
        type,
        message: message.trim().slice(0, 4000),
        name: name.trim().slice(0, 120),
        contact: contact.trim().slice(0, 200),
        path: pathname.slice(0, 300),
        status: 'new',
        ...(user ? { uid: user.uid } : {}),
      });
      setMessage(''); setContact('');
      setState('sent');
    } catch (err) {
      console.error(err);
      setState('error');
    }
  };

  return (
    <>
      <button type="button" className="idea-fab" onClick={() => openIdea()}>
        יש לנו רעיון <span aria-hidden="true">🌱</span>
      </button>
      <Modal open={open} onClose={close} title="יש לנו רעיון 🌱">
        {state === 'sent' ? (
          <div className="idea-thanks">
            <p className="idea-thanks-title">תודה! משהו קטן נזרע.</p>
            <p className="muted">כל פנייה נקראת. הבית הזה אינו מוצר מוגמר – הוא מתהווה גם דרך מה שאנחנו מביאים אליו.</p>
            <div className="row-end">
              <button type="button" className="btn btn-ghost" onClick={() => setState('idle')}>לשלוח עוד משהו</button>
              <button type="button" className="btn" onClick={close}>סגירה</button>
            </div>
          </div>
        ) : (
          <form onSubmit={send} className="idea-form">
            <p className="muted small">הבית הזה נבנה יחד. אפשר לכתוב בלי להירשם.</p>
            <div className="chips" role="radiogroup" aria-label="סוג הפנייה">
              {FEEDBACK_TYPES.map((t) => (
                <button key={t.key} type="button" role="radio" aria-checked={type === t.key} className={`chip ${type === t.key ? 'on' : ''}`} onClick={() => setType(t.key)}>{t.label}</button>
              ))}
            </div>
            <label className="field">
              <span className="field-label">{prompt || current.hint}</span>
              <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} required />
            </label>
            <div className="idea-contact">
              <label className="field"><span className="field-label">שם (לא חובה)</span>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
              </label>
              <label className="field"><span className="field-label">דרך ליצור קשר (לא חובה)</span>
                <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={200} placeholder="מייל או טלפון" />
              </label>
            </div>
            <p className="hint">פרטי הקשר נשמרים רק לעיני המארחים של המרחב, ולא מוצגים באתר.</p>
            <label className="trap" aria-hidden="true">אל תמלאו שדה זה<input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} /></label>
            {state === 'error' ? <p className="error">משהו לא הצליח בשליחה. אפשר לנסות שוב בעוד רגע.</p> : null}
            <div className="row-end">
              <button type="button" className="btn btn-ghost" onClick={close}>ביטול</button>
              <button className="btn" disabled={state === 'sending' || !message.trim()}>{state === 'sending' ? 'שולח…' : 'לשלוח'}</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
