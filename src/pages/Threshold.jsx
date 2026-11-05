import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { backend } from '../lib/backend.js';
import { useAuth, useCollection, useContent, useDoc, useT, byNewest, visibleFor } from '../lib/store.jsx';
import Comments from '../components/Comments.jsx';
import { Byline, Empty, ItemActions, Loading, Prose } from '../components/ui.jsx';
import { PageHead } from '../components/Botanical.jsx';
import { Paths } from '../components/Layout.jsx';

export function ThresholdPage() {
  const { isHost, requireUser, stamp } = useAuth();
  const intro = useContent('painIntro');
  const deep = useContent('painDeep');
  const t = useT();
  const posts = visibleFor(useCollection('pain'), isHost)?.sort(byNewest);
  const [body, setBody] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim() || !requireUser()) return;
    await backend.add('pain', { body: body.trim(), ...stamp() });
    setBody('');
  };

  return (
    <div className="page threshold">
      <PageHead spaceKey="threshold" lead={intro} deep={deep} />
      <form className="card form" onSubmit={submit}>
        <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('pain-placeholder')} />
        <div className="row-end"><button className="btn" disabled={!body.trim()}>{t('pain-send')}</button></div>
      </form>
      <section className="section">
        {posts == null ? <Loading /> : posts.length === 0 ? <Empty>שקט כאן כרגע.</Empty> : posts.map((p) => (
          <Link key={p.id} to={`/threshold/${p.id}`} className={`card pain-card ${p.hidden ? 'is-hidden' : ''}`}>
            <p>{p.body.length > 260 ? `${p.body.slice(0, 260)}…` : p.body}</p>
            <Byline name={p.name} createdAt={p.createdAt} hidden={p.hidden} />
          </Link>
        ))}
      </section>
      <Paths keys={['observe', 'tickle', 'celebrate']} />
    </div>
  );
}

export function ThresholdPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isHost, requireUser } = useAuth();
  const post = useDoc('pain', id);
  const t = useT();
  const PROMPT = t('pain-prompt');
  if (post === undefined) return <div className="page"><Loading /></div>;
  if (post === null || (post.hidden && !isHost && post.uid !== user?.uid)) {
    return <div className="page"><Empty>לא נמצא. <Link to="/threshold">חזרה</Link></Empty></div>;
  }
  return (
    <div className="page threshold">
      <Link to="/threshold" className="back">→ מהתפר</Link>
      <article className="reading">
        <Prose text={post.body} />
        <Byline name={post.name} createdAt={post.createdAt} hidden={post.hidden} />
        <ItemActions col="pain" item={post} onDeleted={() => navigate('/threshold')} />
      </article>
      <section className="section">
        <h2>הקשבה</h2>
        <Comments targetType="pain" targetId={id} prompt={PROMPT} placeholder={PROMPT} />
      </section>
      <div className="card turn-to-dream">
        <p>ואם מתוך הכאב הזה מבקש לצמוח חלום – אפשר לשתול אותו בגן.</p>
        <button type="button" className="btn btn-ghost" onClick={() => requireUser() && navigate('/dreams/new', { state: { draft: '', fromPain: id } })}>להפוך לזרע חלום</button>
      </div>
    </div>
  );
}
