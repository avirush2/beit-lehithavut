import { useContent } from '../lib/store.jsx';
import { Paths } from '../components/Layout.jsx';
import { PageHead } from '../components/Botanical.jsx';
import { Prose } from '../components/ui.jsx';

// אודות ← למה עכשיו? התפר שבין ישן לחדש, והתנועה שהבית מגיע ממנה
export default function Timing() {
  const title = useContent('timingTitle');
  const intro = useContent('timingIntro');
  const body = useContent('timingBody');

  return (
    <div className="page">
      <PageHead spaceKey="timing" eyebrow={title} lead={intro} />
      <Prose text={body} className="about-text" />
      <Paths keys={['new', 'compass', 'vision']} />
    </div>
  );
}
