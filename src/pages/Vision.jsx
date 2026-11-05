import { useContent } from '../lib/store.jsx';
import { Paths } from '../components/Layout.jsx';
import { PageHead } from '../components/Botanical.jsx';
import { Prose } from '../components/ui.jsx';

// אודות ← חזון: מה הבית הזה מבקש להיות ולקיים
export default function Vision() {
  const intro = useContent('visionIntro');
  const body = useContent('visionBody');

  return (
    <div className="page">
      <PageHead spaceKey="vision" lead={intro} />
      <Prose text={body} className="about-text" />
      <Paths keys={['timing', 'new', 'compass']} />
    </div>
  );
}
