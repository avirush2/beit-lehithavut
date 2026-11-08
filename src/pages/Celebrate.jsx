import { useState } from 'react';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, useSettings, useStoryKinds, useT, byNewest, visibleFor } from '../lib/store.jsx';
import Comments from '../components/Comments.jsx';
import { GroupHead } from '../components/Botanical.jsx';
import { Byline, Empty, ItemActions, LifeSpacePicker, Loading, Prose, SpaceBadges } from '../components/ui.jsx';

function usePrompts() {
  const t = useT();
  return t('celebrate-prompts').split('\n').map((p) => p.trim()).filter(Boolean);
}

// חגיגה והשראה מההווה: אותו קו כמו "מה מתמוסס" – כרטיס הזמנה (בגוון שמש) ומתחתיו השיתופים.
function StoryForm() {
  const { requireUser, stamp } = useAuth();
  const KINDS = useStoryKinds();
  const PROMPTS = usePrompts();
  const intro = useContent('celebrateIntro');
  const t = useT();
  const [kind, setKind] = useState('outside');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [sent, setSent] = useState(0);
  const save = async (e) => {
    e.preventDefault();
    if (!title.trim() || !requireUser()) return;
    await backend.add('stories', { kind, title: title.trim(), body: body.trim(), link: link.trim(), spaces, ...stamp() });
    setTitle(''); setBody(''); setLink(''); setSpaces([]); setSent(sent + 1);
  };
  return (
    <form className="invite tone-sun" onSubmit={save}>
      <p className="invite-lead">{t('celebrate-lead')}</p>
      <label className="invite-q" htmlFor="story-title">{t('celebrate-question')}</label>
      <input id="story-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="במשפט אחד" />
      <Prose text={intro} className="invite-after" />
      <div className="field"><span className="field-label">איפה זה צומח?</span>
        <div className="chips">
          {KINDS.map((k) => <button key={k.key} type="button" className={`chip ${kind === k.key ? 'on' : ''}`} aria-pressed={kind === k.key} onClick={() => setKind(k.key)}>{k.title}</button>)}
        </div>
      </div>
      <details className="invite-more" key={sent}>
        <summary>להוסיף עוד (פירוט, קישור)</summary>
        <label className="field"><span className="field-label">קצת יותר</span>
          <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder={PROMPTS.join(' ')} />
        </label>
        <label className="field"><span className="field-label">קישור</span><input value={link} onChange={(e) => setLink(e.target.value)} dir="ltr" placeholder="https://" /></label>
      </details>
      <LifeSpacePicker key={`s${sent}`} value={spaces} onChange={setSpaces} collapsible />
      <div className="row-end"><button className="btn" disabled={!title.trim()}>{t('celebrate-share')}</button></div>
    </form>
  );
}

function GideiBayit() {
  const text = useContent('gideiBayit');
  const settings = useSettings();
  const t = useT();
  if (!text) return null;
  return (
    <li className="share guest-card">
      <p className="eyebrow">{t('gidulei-eyebrow')}</p>
      <h3>גידולי בית</h3>
      <Prose text={text} />
      {settings.gideiBayitUrl ? <a href={settings.gideiBayitUrl} target="_blank" rel="noreferrer">{t('gidulei-link')}</a> : null}
    </li>
  );
}

export default function Celebrate() {
  const { isHost } = useAuth();
  const KINDS = useStoryKinds();
  const stories = visibleFor(useCollection('stories'), isHost)?.sort(byNewest);
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(null);
  const shown = tab === 'all' ? stories : stories?.filter((s) => s.kind === tab);
  const current = KINDS.find((k) => k.key === tab);

  return (
    <div className="page">
      <GroupHead group="sensing" current="celebrate" />
      <StoryForm />

      <section className="section">
        <div className="chips filter-chips" role="group" aria-label="סינון">
          <button type="button" className={`chip ${tab === 'all' ? 'on' : ''}`} aria-pressed={tab === 'all'} onClick={() => setTab('all')}>הכול</button>
          {KINDS.map((k) => (
            <button key={k.key} type="button" className={`chip ${tab === k.key ? 'on' : ''}`} aria-pressed={tab === k.key} onClick={() => setTab(k.key)}>{k.title}</button>
          ))}
        </div>
        {current ? <p className="muted filter-note">{current.text}</p> : null}
        {shown == null ? <Loading /> : (
          <ul className="shares">
            {tab === 'all' || tab === 'ours' ? <GideiBayit /> : null}
            {shown.map((s) => (
              <li key={s.id} className={`share ${s.hidden ? 'is-hidden' : ''}`}>
                <h3>{s.title}</h3>
                <Prose text={s.body} />
                <SpaceBadges ids={s.spaces} />
                {/^https?:\/\//i.test(s.link || '') ? <a href={s.link} target="_blank" rel="noreferrer" dir="ltr" className="small">{s.link.replace(/^https?:\/\//, '').slice(0, 40)}</a> : null}
                <div className="comment-foot">
                  <Byline name={s.name} createdAt={s.createdAt} hidden={s.hidden} />
                  <ItemActions col="stories" item={s} />
                </div>
                <button type="button" className="link-btn" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? 'סגירה' : 'להגיב'}</button>
                {open === s.id ? <Comments targetType="story" targetId={s.id} withCompass={false} placeholder="מה זה מעורר בך?" /> : null}
              </li>
            ))}
          </ul>
        )}
        {shown?.length === 0 && tab !== 'all' && tab !== 'ours' ? <Empty>עוד אין כאן שיתופים. אולי הראשון מחכה אצלך?</Empty> : null}
      </section>
    </div>
  );
}
