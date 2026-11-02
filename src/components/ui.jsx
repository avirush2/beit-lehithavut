import { useEffect, useState } from 'react';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, byOrder } from '../lib/store.jsx';
import { useLocation } from 'react-router-dom';

export function formatDate(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

// טקסט פשוט: שורה ריקה = פסקה חדשה, "* " = פריט ברשימה, "## " = כותרת
export function Prose({ text, className = '' }) {
  if (!text) return null;
  const blocks = String(text).replace(/\r/g, '').split(/\n\s*\n/);
  return (
    <div className={`prose ${className}`}>
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter((l) => l.trim() !== '');
        const out = [];
        let list = [];
        const flush = (k) => {
          if (list.length) out.push(<ul key={`u${k}`}>{list.map((li, j) => <li key={j}>{li}</li>)}</ul>);
          list = [];
        };
        lines.forEach((line, j) => {
          const t = line.trim();
          if (/^[*-]\s+/.test(t)) list.push(t.replace(/^[*-]\s+/, ''));
          else if (t.startsWith('## ')) { flush(j); out.push(<h3 key={j}>{t.slice(3)}</h3>); }
          else { flush(j); out.push(<p key={j}>{t}</p>); }
        });
        flush('end');
        return <div key={i} className="prose-block">{out}</div>;
      })}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="סגירה">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Chips({ options, value = [], onChange, single }) {
  const toggle = (o) => {
    if (single) onChange(value[0] === o ? [] : [o]);
    else onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  };
  return (
    <div className="chips">
      {options.map((o) => (
        <button type="button" key={o} className={`chip ${value.includes(o) ? 'on' : ''}`} onClick={() => toggle(o)} aria-pressed={value.includes(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function useCompass() {
  const items = useCollection('compass');
  return items ? [...items].sort(byOrder) : [];
}

export function CompassPicker({ value, onChange }) {
  const compass = useCompass();
  return <Chips options={compass.map((c) => c.title)} value={value} onChange={onChange} />;
}

export function CompassBadges({ list }) {
  if (!list?.length) return null;
  return (
    <div className="badges">
      {list.map((c) => <span key={c} className="badge compass-badge" title="נוגע במצפן">{c}</span>)}
    </div>
  );
}

export function Byline({ name, createdAt, hidden }) {
  return (
    <div className="byline">
      <span>{name || 'משתתפ.ת'}</span>
      {createdAt ? <span className="dot">·</span> : null}
      {createdAt ? <time>{formatDate(createdAt)}</time> : null}
      {hidden ? <span className="badge warn">מוסתר</span> : null}
    </div>
  );
}

const REASONS = ['פגיעה אישית', 'פרסום ומכירה', 'חשיפת פרטים של אחרים', 'אחר'];

export function ReportButton({ col, id }) {
  const { requireUser, stamp } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState([]);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const send = async () => {
    await backend.add('reports', { col, targetId: id, reason: reason[0] || 'אחר', note, path: location.pathname, ...stamp() });
    setSent(true);
  };
  return (
    <>
      <button type="button" className="link-btn quiet" onClick={() => requireUser() && setOpen(true)}>דיווח</button>
      <Modal open={open} onClose={() => { setOpen(false); setSent(false); }} title="דיווח למארחים">
        {sent ? <p>תודה. המארחים יתבוננו בזה.</p> : (
          <>
            <p className="muted">המרחב מסיר רק מה שחוצה את הקווים האדומים. ביקורת, כאב ומחלוקת – יש להם מקום.</p>
            <Chips options={REASONS} value={reason} onChange={setReason} single />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="מילה נוספת (לא חובה)" rows={3} />
            <div className="row-end"><button type="button" className="btn" disabled={!reason.length} onClick={send}>שליחה</button></div>
          </>
        )}
      </Modal>
    </>
  );
}

// פעולות על פריט: מחיקה לבעלים, הסתרה ומחיקה למארחים
export function ItemActions({ col, item, onEdit, onDeleted }) {
  const { user, isHost } = useAuth();
  const mine = user && item.uid === user.uid;
  const del = async () => {
    if (!window.confirm('למחוק לצמיתות?')) return;
    await backend.remove(col, item.id);
    onDeleted?.();
  };
  return (
    <div className="item-actions">
      {mine && onEdit ? <button type="button" className="link-btn quiet" onClick={onEdit}>עריכה</button> : null}
      {isHost ? (
        <button type="button" className="link-btn quiet" onClick={() => backend.update(col, item.id, { hidden: !item.hidden })}>
          {item.hidden ? 'החזרה' : 'הסתרה'}
        </button>
      ) : null}
      {mine || isHost ? <button type="button" className="link-btn quiet" onClick={del}>מחיקה</button> : null}
      {!mine ? <ReportButton col={col} id={item.id} /> : null}
    </div>
  );
}

export function Loading() {
  return <p className="muted loading">רגע, נטען…</p>;
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

// כפתור שמבקש הרשמה לפני פעולה
export function useGuarded(fn) {
  const { requireUser } = useAuth();
  return (...args) => { if (requireUser()) fn(...args); };
}
