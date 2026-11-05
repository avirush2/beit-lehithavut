import { useContent } from '../lib/store.jsx';
import { GroupHead, SectionHead } from '../components/Botanical.jsx';
import { Empty, Prose, useCompass } from '../components/ui.jsx';
import NewDefinition from './NewDefinition.jsx';

// אודות: עמוד אחד – למה עכשיו?, מהו חדש?, מצפן וחזון. כל חלק עם עוגן משלו (/about#compass).
function Timing() {
  const title = useContent('timingTitle');
  const intro = useContent('timingIntro');
  const body = useContent('timingBody');
  return (
    <section className="section about-section" id="timing">
      <SectionHead spaceKey="timing" eyebrow={title} lead={intro} />
      <Prose text={body} className="about-text" />
    </section>
  );
}

function Compass() {
  const intro = useContent('compassIntro');
  const items = useCompass();
  return (
    <section className="section about-section" id="compass">
      <SectionHead spaceKey="compass" lead={intro} />
      {items.length === 0 ? <Empty>המצפן עוד לא נטען.</Empty> : (
        <ol className="compass-cards">
          {items.map((c, i) => (
            <li key={c.id} className="card compass-card">
              <span className="compass-num" aria-hidden="true">{i + 1}</span>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              {c.question ? <p className="compass-q">{c.question}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Vision() {
  const intro = useContent('visionIntro');
  const body = useContent('visionBody');
  return (
    <section className="section about-section" id="vision">
      <SectionHead spaceKey="vision" lead={intro} />
      <Prose text={body} className="about-text" />
    </section>
  );
}

export default function About() {
  return (
    <div className="page">
      <GroupHead group="about" />
      <Timing />
      <section className="section about-section"><NewDefinition /></section>
      <Compass />
      <Vision />
    </div>
  );
}
