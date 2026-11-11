import { useEffect, useState } from 'react';
import { backend, isDemo } from '../lib/backend.js';
import { useAuth } from '../lib/store.jsx';
import { Modal } from './ui.jsx';

const ERRORS = {
  'auth/invalid-credential': 'האימייל או הסיסמה לא תואמים.',
  'auth/email-already-in-use': 'כבר קיים חשבון עם האימייל הזה. אפשר להיכנס.',
  'auth/weak-password': 'הסיסמה צריכה לכלול לפחות 6 תווים.',
  'auth/invalid-email': 'האימייל לא תקין.',
  'auth/popup-closed-by-user': 'החלון נסגר לפני שההתחברות הסתיימה.',
};

// "איך לקרוא לך במרחב?" – נפתח בכניסה הראשונה, ובלחיצה על "שלום, …" בראש העמוד
export function NameChooser() {
  const { nameOpen, closeName, saveName, name } = useAuth();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (nameOpen) { setValue(name); setError(''); } }, [nameOpen, name]);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await saveName(value); closeName(); } catch (err) { console.error(err); setError('לא הצלחנו לשמור. אפשר לנסות שוב.'); } finally { setBusy(false); }
  };
  return (
    <Modal open={nameOpen} onClose={closeName} title="איך לקרוא לך במרחב?">
      <form onSubmit={save}>
        <p className="muted">השם הזה יופיע ליד מה שתשתפו. אפשר שם פרטי, שם מלא או כינוי – ולשנות אותו מתי שרוצים, בלחיצה על השם בראש העמוד.</p>
        <label className="field"><span className="field-label">השם שלך במרחב</span>
          <input value={value} onChange={(e) => setValue(e.target.value)} maxLength={60} required autoFocus />
        </label>
        <p className="muted small">שיתופים שכבר נכתבו ממשיכים להופיע עם השם שהיה אז.</p>
        {error ? <p className="error">{error}</p> : null}
        <div className="row-end"><button className="btn" disabled={busy || !value.trim()}>שמירה</button></div>
      </form>
    </Modal>
  );
}

export default function SignIn() {
  const { signInOpen, closeSignIn } = useAuth();
  const [mode, setMode] = useState('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setError(''); setInfo(''); setBusy(true);
    try {
      await fn();
      closeSignIn();
    } catch (e) {
      setError(ERRORS[e.code] || 'משהו לא הצליח. אפשר לנסות שוב.');
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const signUp = () => run(async () => {
    const u = await backend.signUpEmail(name.trim(), email.trim(), password);
    await backend.set('users', u.uid, { displayName: name.trim(), nameChosen: true, role: 'member', createdAt: Date.now() });
  });

  return (
    <Modal open={signInOpen} onClose={closeSignIn} title="כניסה למרחב">
      <p className="muted">הקריאה פתוחה לכולם. כדי לכתוב, להגיב ולשתף – נכנסים פעם אחת.</p>
      {isDemo ? (
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) run(() => backend.signInDemo(name.trim())); }}>
          <p className="notice">מצב הדגמה: אין סיסמאות, והכל נשמר רק בדפדפן הזה.</p>
          <label className="field"><span className="field-label">איך לקרוא לך?</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </label>
          <div className="row-end"><button className="btn" disabled={!name.trim() || busy}>כניסה</button></div>
        </form>
      ) : (
        <>
          <button type="button" className="btn btn-wide" disabled={busy} onClick={() => run(() => backend.signInGoogle())}>כניסה עם Google</button>
          <div className="or"><span>או באימייל</span></div>
          <form onSubmit={(e) => { e.preventDefault(); if (mode === 'up') signUp(); else run(() => backend.signInEmail(email.trim(), password)); }}>
            {mode === 'up' ? (
              <label className="field"><span className="field-label">שם שיופיע במרחב</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
            ) : null}
            <label className="field"><span className="field-label">אימייל</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
            </label>
            <label className="field"><span className="field-label">סיסמה</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" minLength={6} />
            </label>
            {error ? <p className="error">{error}</p> : null}
            {info ? <p className="notice">{info}</p> : null}
            <div className="row-between">
              <button type="button" className="link-btn" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
                {mode === 'in' ? 'חדש.ה כאן? הרשמה' : 'כבר רשומ.ה? כניסה'}
              </button>
              <button className="btn" disabled={busy}>{mode === 'in' ? 'כניסה' : 'הרשמה'}</button>
            </div>
            {mode === 'in' ? (
              <button type="button" className="link-btn quiet small" onClick={async () => {
                if (!email.trim()) { setError('כתבו קודם את האימייל.'); return; }
                try { await backend.resetPassword(email.trim()); setInfo('נשלח מייל לאיפוס הסיסמה.'); } catch (e) { setError(ERRORS[e.code] || 'לא הצלחנו לשלוח.'); }
              }}>שכחתי סיסמה</button>
            ) : null}
          </form>
        </>
      )}
    </Modal>
  );
}
