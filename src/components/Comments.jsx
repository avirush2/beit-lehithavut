import { useState } from 'react';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, byOldest, visibleFor } from '../lib/store.jsx';
import { Byline, Chips, CompassBadges, CompassPicker, ItemActions, Prose } from './ui.jsx';

// שרשור תגובות. lens – כיוון דיון (רווחה / התגשמות / ניסויים) עם תגיות משלו.
export default function Comments({ targetType, targetId, lens, placeholder, prompt, withCompass = true }) {
  const { isHost, requireUser, stamp } = useAuth();
  const all = useCollection('comments', ['targetId', targetId]);
  const items = visibleFor(all, isHost)
    ?.filter((c) => c.targetType === targetType && (lens ? c.lens === lens.key : !c.lens))
    .sort(byOldest);

  const [body, setBody] = useState('');
  const [tags, setTags] = useState([]);
  const [compass, setCompass] = useState([]);
  const [showCompass, setShowCompass] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim() || !requireUser()) return;
    setBusy(true);
    try {
      await backend.add('comments', {
        targetType, targetId, lens: lens?.key || null, body: body.trim(), tags, compass, ...stamp(),
      });
      setBody(''); setTags([]); setCompass([]); setShowCompass(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="comments">
      {prompt ? <p className="prompt">{prompt}</p> : null}
      {items == null ? null : items.length === 0 ? <p className="muted small">עוד אין כאן קולות. אפשר להיות הראשונ.ה.</p> : (
        <ul className="comment-list">
          {items.map((c) => (
            <li key={c.id} className={`comment ${c.hidden ? 'is-hidden' : ''}`}>
              {c.tags?.length ? <div className="badges">{c.tags.map((t) => <span key={t} className="badge">{t}</span>)}</div> : null}
              <Prose text={c.body} />
              <CompassBadges list={c.compass} />
              <div className="comment-foot">
                <Byline name={c.name} createdAt={c.createdAt} hidden={c.hidden} />
                <ItemActions col="comments" item={c} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <form className="comment-form" onSubmit={submit}>
        {lens ? (
          <div className="field">
            <span className="field-label">{lens.tagsLabel}</span>
            <Chips options={lens.tags} value={tags} onChange={setTags} />
          </div>
        ) : null}
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder || 'להוסיף קול…'} rows={3} />
        {withCompass ? (
          showCompass ? (
            <div className="field">
              <span className="field-label">נוגע במצפן? (לא חובה)</span>
              <CompassPicker value={compass} onChange={setCompass} />
            </div>
          ) : (
            <button type="button" className="link-btn quiet" onClick={() => setShowCompass(true)}>+ סימון במצפן</button>
          )
        ) : null}
        <div className="row-end">
          <button className="btn" type="submit" disabled={busy || !body.trim()}>שיתוף</button>
        </div>
      </form>
    </div>
  );
}
