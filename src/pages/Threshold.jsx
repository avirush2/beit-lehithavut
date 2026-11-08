import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth, useDoc, useT } from '../lib/store.jsx';
import Comments from '../components/Comments.jsx';
import { Byline, Empty, ItemActions, Loading, Prose, SpaceBadges } from '../components/ui.jsx';

// שיתוף קושי ישן, עם ההקשבה שנכתבה עליו. שיתופים חדשים נכתבים ב"מה מתמוסס" (חישה), והרשימה מוצגת שם.
export function ThresholdPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isHost, requireUser } = useAuth();
  const post = useDoc('pain', id);
  const t = useT();
  const PROMPT = t('pain-prompt');
  if (post === undefined) return <div className="page"><Loading /></div>;
  if (post === null || (post.hidden && !isHost && post.uid !== user?.uid)) {
    return <div className="page"><Empty>לא נמצא. <Link to="/observe">חזרה</Link></Empty></div>;
  }
  return (
    <div className="page">
      <Link to="/observe" className="back">→ מה מתמוסס</Link>
      <article className="reading">
        <Prose text={post.body} />
        <SpaceBadges ids={post.spaces} />
        <Byline name={post.name} createdAt={post.createdAt} hidden={post.hidden} />
        <ItemActions col="pain" item={post} onDeleted={() => navigate('/observe')} />
      </article>
      <section className="section">
        <h2>הקשבה</h2>
        <Comments targetType="pain" targetId={id} prompt={PROMPT} placeholder={PROMPT} />
      </section>
      <div className="invite tone-blossom invite-small">
        <p>ואם מתוך הכאב הזה מבקש לצמוח חלום – אפשר לשתף אותו בחלימה.</p>
        <button type="button" className="btn btn-ghost" onClick={() => requireUser() && navigate('/dreams/new', { state: { draft: '', fromPain: id } })}>להפוך לזרע חלום</button>
      </div>
    </div>
  );
}
