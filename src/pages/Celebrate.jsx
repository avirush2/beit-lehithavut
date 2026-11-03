import { useState } from 'react';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, useSettings, useStoryKinds, useT, byNewest, visibleFor } from '../lib/store.jsx';

function usePrompts() {
  const t = useT();
  return t('celebrate-prompts').split('\n').map((p) => p.trim()).filter(Boolean);
}
import Comments from '../components/Comments.jsx';
import { Paths } from '../components/Layout.jsx';
import { PageHead } from '../components/Botanical.jsx';
import { Byline, Empty, ItemActions, Loading, Prose } from '../components/ui.jsx';

// חגיגה והשראה מההווה: המבט אל מה שכבר צומח. לא גלריה שמוצגת מלמעלה – מקום שכולם מוסיפים אליו.
function StoryForm({ initialKind, onDone }) {
  const { requireUser, stamp } = useAuth();
  const KINDS = useStoryKinds();
  const PROMPTS = usePrompts();
  const [kind, setKind] = useState(initialKind || 'outside');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const save = async (e) => {
    e.preventDefault();
    if (!requireUser() || !title.trim()) return;
    await backend.add('stories', { kind, title: title.trim(), body: body.trim(), link: link.trim(), ...stamp() });
    onDone();
  };
  return (
    <form className="card form" onSubmit={save}>
      <div className="field"><span className="field-label">איפה זה צומח?</span>
        <div className="chips">
          {KINDS.map((k) => <button key={k.key} type="button" className={`chip ${kind === k.key ? 'on' : ''}`} aria-pressed={kind === k.key} onClick={() => setKind(k.key)}>{k.title}</button>)}
        </div>
      </div>
      <label className="field"><span className="field-label">במשפט אחד</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} required /></label>
      <label className="field"><span className="field-label">קצת יותר (לא חובה)</span>
        <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder={PROMPTS.join(' ')} />
      </label>
      <label className="field"><span className="field-label">קישור (לא חובה)</span><input value={link} onChange={(e) => setLink(e.target.value)} dir="ltr" placeholder="https://" /></label>
      <div className="row-end">
        <button type="button" className="btn btn-ghost" onClick={onDone}>ביטול</button>
        <button className="btn" disabled={!title.trim()}>לשתף</button>
      </div>
    </form>
  );
}

function GideiBayit() {
  const text = useContent('gideiBayit');
  const settings = useSettings();
  const t = useT();
  if (!text) return null;
  return (
    <article className="card guest-card">
      <p className="eyebrow">{t('gidulei-eyebrow')}</p>
      <h3>גידולי בית</h3>
      <Prose text={text} />
      {settings.gideiBayitUrl ? <a href={settings.gideiBayitUrl} target="_blank" rel="noreferrer">{t('gidulei-link')}</a> : null}
    </article>
  );
}

export default function Celebrate() {
  const { isHost, requireUser } = useAuth();
  const intro = useContent('celebrateIntro');
  const deep = useContent('celebrateDeep');
  const KINDS = useStoryKinds();
  const PROMPTS = usePrompts();
  const t = useT();
  const stories = visibleFor(useCollection('stories'), isHost)?.sort(byNewest);
  const [tab, setTab] = useState('outside');
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(null);
  const current = KINDS.find((k) => k.key === tab);
  const shown = stories?.filter((s) => s.kind === tab);

  return (
    <div className="page">
      <PageHead spaceKey="celebrate" lead={intro} deep={deep}>
        <ul className="prompts">{PROMPTS.map((p) => <li key={p}>{p}</li>)}</ul>
      </PageHead>

      <div className="tabs" role="tablist">
        {KINDS.map((k) => (
          <button key={k.key} type="button" role="tab" aria-selected={tab === k.key} className={tab === k.key ? 'on' : ''} onClick={() => setTab(k.key)}>{k.title}</button>
        ))}
      </div>
      <p className="layer-question">{current.text}</p>

      {adding ? <StoryForm initialKind={tab} onDone={() => setAdding(false)} /> : (
        <button type="button" className="btn" onClick={() => requireUser() && setAdding(true)}>{t('celebrate-share')}</button>
      )}

      <section className="section">
        {tab === 'ours' ? <GideiBayit /> : null}
        {shown == null ? <Loading /> : shown.length === 0 ? <Empty>עוד אין כאן שיתופים. אולי הראשון מחכה אצלך?</Empty> : (
          <div className="grid">
            {shown.map((s) => (
              <article key={s.id} className={`card story-card ${s.hidden ? 'is-hidden' : ''}`}>
                <h3>{s.title}</h3>
                <Prose text={s.body} />
                {/^https?:\/\//i.test(s.link || '') ? <a href={s.link} target="_blank" rel="noreferrer" dir="ltr" className="small">{s.link.replace(/^https?:\/\//, '').slice(0, 40)}</a> : null}
                <div className="comment-foot">
                  <Byline name={s.name} createdAt={s.createdAt} hidden={s.hidden} />
                  <ItemActions col="stories" item={s} />
                </div>
                <button type="button" className="link-btn" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? 'סגירה' : 'להגיב'}</button>
                {open === s.id ? <Comments targetType="story" targetId={s.id} withCompass={false} placeholder="מה זה מעורר בך?" /> : null}
              </article>
            ))}
          </div>
        )}
      </section>
      <Paths keys={['categories', 'dreams', 'timing']} />
    </div>
  );
}
