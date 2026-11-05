import { useState } from 'react';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, byNewest, visibleFor } from '../lib/store.jsx';
import Comments from '../components/Comments.jsx';
import { Byline, Empty, ItemActions, Loading, Prose, formatDate } from '../components/ui.jsx';
import { SectionHead } from '../components/Botanical.jsx';

const STATUS = { open: 'פתוחה לשיחה', accepted: 'התקבלה', declined: 'לא כעת' };

// ההגדרה החיה של "מהו חדש" – חלק בעמוד אודות
export default function NewDefinition() {
  const { isHost, requireUser, stamp, name } = useAuth();
  const intro = useContent('newIntro');
  const versions = useCollection('definitionVersions')?.slice().sort(byNewest);
  const proposals = visibleFor(useCollection('definitionProposals'), isHost)?.sort(byNewest);
  const current = versions?.[0];

  const [text, setText] = useState('');
  const [why, setWhy] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [openThread, setOpenThread] = useState(null);

  const propose = async (e) => {
    e.preventDefault();
    if (!text.trim() || !requireUser()) return;
    await backend.add('definitionProposals', { text: text.trim(), why: why.trim(), status: 'open', ...stamp() });
    setText(''); setWhy('');
  };

  const accept = async (p) => {
    if (!window.confirm('לפרסם את ההצעה כגרסה החדשה של ההגדרה?')) return;
    await backend.add('definitionVersions', { text: p.text, note: `מתוך הצעה של ${p.name}`, proposalId: p.id, name });
    await backend.update('definitionProposals', p.id, { status: 'accepted' });
  };

  return (
    <div className="living-def" id="new">
      <SectionHead spaceKey="new" lead={intro} />

      {versions == null ? <Loading /> : current ? (
        <section className="card definition-card">
          <blockquote className="definition">{current.text}</blockquote>
          <p className="muted small">גרסה {versions.length} · {formatDate(current.createdAt)}{current.note ? ` · ${current.note}` : ''}</p>
          {versions.length > 1 ? (
            <button type="button" className="link-btn" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? 'הסתרת הגרסאות הקודמות' : `איך ההגדרה התהוותה (${versions.length - 1} גרסאות קודמות)`}
            </button>
          ) : null}
          {showHistory ? (
            <ol className="history">
              {versions.slice(1).map((v, i) => (
                <li key={v.id}>
                  <p className="muted small">גרסה {versions.length - 1 - i} · {formatDate(v.createdAt)}{v.note ? ` · ${v.note}` : ''}</p>
                  <p>{v.text}</p>
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : <Empty>ההגדרה עוד לא נטענה. מארחים יכולים לטעון את תוכן הפתיחה בממשק הניהול.</Empty>}

      <section className="section">
        <h3>הצעה לניסוח אחר</h3>
        <form className="card form" onSubmit={propose}>
          <label className="field"><span className="field-label">איך היינו מנסחים אחרת?</span>
            <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="אפשר להעתיק את ההגדרה ולשנות בה מה שמבקש להשתנות" />
          </label>
          <label className="field"><span className="field-label">מה מבקש להשתנות, ולמה?</span>
            <textarea rows={3} value={why} onChange={(e) => setWhy(e.target.value)} />
          </label>
          <div className="row-between">
            <button type="button" className="link-btn quiet" onClick={() => current && setText(current.text)}>העתקת ההגדרה הנוכחית</button>
            <button className="btn" disabled={!text.trim()}>שליחת ההצעה</button>
          </div>
        </form>
      </section>

      <section className="section">
        <h3>הצעות ושיחה</h3>
        {proposals == null ? <Loading /> : proposals.length === 0 ? <Empty>עוד אין הצעות.</Empty> : proposals.map((p) => (
          <article key={p.id} className={`card proposal ${p.hidden ? 'is-hidden' : ''}`}>
            <span className={`badge status-${p.status}`}>{STATUS[p.status] || p.status}</span>
            <Prose text={p.text} />
            {p.why ? <p className="muted"><strong>למה: </strong>{p.why}</p> : null}
            <div className="comment-foot">
              <Byline name={p.name} createdAt={p.createdAt} hidden={p.hidden} />
              <ItemActions col="definitionProposals" item={p} />
            </div>
            {isHost && p.status === 'open' ? (
              <div className="host-actions">
                <button type="button" className="btn btn-small" onClick={() => accept(p)}>פרסום כגרסה חדשה</button>
                <button type="button" className="btn btn-small btn-ghost" onClick={() => backend.update('definitionProposals', p.id, { status: 'declined' })}>לא כעת</button>
              </div>
            ) : null}
            <button type="button" className="link-btn" onClick={() => setOpenThread(openThread === p.id ? null : p.id)}>
              {openThread === p.id ? 'סגירת השיחה' : 'שיחה על ההצעה'}
            </button>
            {openThread === p.id ? <Comments targetType="proposal" targetId={p.id} withCompass={false} /> : null}
          </article>
        ))}
      </section>
    </div>
  );
}
