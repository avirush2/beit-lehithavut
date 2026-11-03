import { useSpaces } from '../lib/store.jsx';
import { Prose } from './ui.jsx';

// איורים בוטניים קטנים, בקו יד: קו בצבע הגוון של המרחב, ומילוי בכתם צבעי מים עדין.
const MOTIFS = {
  horizon: (
    <>
      <circle cx="32" cy="34" r="13" className="wash" />
      <path d="M19 34a13 13 0 0 1 26 0" />
      <path d="M6 42c8-6 14-7 22-3s14 4 22-1 8-2 8-2" />
      <path d="M10 50c10-4 18-3 26 0s14 2 20-1" opacity=".6" />
      <path d="M32 14v-5M45 19l3-3M19 19l-3-3" />
    </>
  ),
  flower: (
    <>
      <circle cx="32" cy="22" r="13" className="wash" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="32" cy="14" rx="5" ry="8" transform={`rotate(${a} 32 22)`} />
      ))}
      <circle cx="32" cy="22" r="3" className="dot" />
      <path d="M32 31c0 10-1 17 0 26" />
      <path d="M32 46c-6-1-10-5-11-9 5 0 9 3 11 9zM32 41c5-1 8-4 9-8-4 0-8 3-9 8z" />
    </>
  ),
  seed: (
    <>
      <ellipse cx="32" cy="42" rx="12" ry="9" className="wash" />
      <path d="M22 44c0-6 5-10 10-10s10 4 10 10-5 8-10 8-10-2-10-8z" />
      <path d="M32 34c0-8 2-14 7-18M33 26c-6-1-10-5-10-9 5 0 9 4 10 9zM36 21c5-1 8-4 9-8-5 0-8 3-9 8z" />
    </>
  ),
  leaves: (
    <>
      <ellipse cx="30" cy="30" rx="18" ry="14" className="wash" />
      <path d="M12 54C22 40 34 26 52 10" />
      <path d="M22 41c-7 0-11-4-12-9 6-1 10 3 12 9zM29 33c1-7 5-11 10-11 0 6-4 10-10 11zM34 27c-7-1-10-6-10-11 6 0 9 5 10 11zM42 19c2-6 6-9 11-9-1 6-5 9-11 9z" />
    </>
  ),
  spring: (
    <>
      <ellipse cx="32" cy="44" rx="20" ry="8" className="wash" />
      <path d="M32 8c-6 9-9 14-9 19a9 9 0 0 0 18 0c0-5-3-10-9-19z" />
      <ellipse cx="32" cy="46" rx="10" ry="3" />
      <ellipse cx="32" cy="46" rx="20" ry="7" opacity=".55" />
    </>
  ),
  sparks: (
    <>
      <circle cx="30" cy="32" r="16" className="wash" />
      <path d="M30 12c1 9 3 11 12 12-9 1-11 3-12 12-1-9-3-11-12-12 9-1 11-3 12-12z" />
      <path d="M47 38c.5 4 1.5 5 5 5.5-3.5.5-4.5 1.5-5 5.5-.5-4-1.5-5-5-5.5 3.5-.5 4.5-1.5 5-5.5zM15 42c.4 3 1 3.6 4 4-3 .4-3.6 1-4 4-.4-3-1-3.6-4-4 3-.4 3.6-1 4-4z" />
    </>
  ),
  sprout: (
    <>
      <ellipse cx="32" cy="46" rx="20" ry="9" className="wash" />
      <path d="M8 50h48" />
      <path d="M22 50l4-5-3-4 5-3" opacity=".6" />
      <path d="M34 50c0-9 0-15 2-21M36 36c-7 0-11-4-12-9 6 0 10 3 12 9zM36 31c5-2 8-6 8-11-5 1-8 5-8 11z" />
    </>
  ),
  compass: (
    <>
      <circle cx="32" cy="32" r="18" className="wash" />
      <circle cx="32" cy="32" r="20" />
      <path d="M32 14l4 18-4 18-4-18z" />
      <path d="M14 32l18-3 18 3-18 3z" opacity=".55" />
      <circle cx="32" cy="32" r="2.2" className="dot" />
    </>
  ),
};

export function Motif({ kind, size = 64, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={`motif ${className}`}>
      {MOTIFS[kind] || MOTIFS.seed}
    </svg>
  );
}

// ענף גדול לשולי מסך הכניסה
export function Sprig({ className = '' }) {
  return (
    <svg viewBox="0 0 220 260" aria-hidden="true" className={`sprig ${className}`}>
      <path className="stem" d="M200 255C170 200 140 150 120 100S80 30 40 8" />
      {[
        [178, 210, -40], [160, 175, 30], [146, 140, -35], [132, 112, 28], [118, 84, -30], [100, 58, 25], [78, 36, -25], [58, 20, 20],
      ].map(([x, y, r], i) => (
        <path key={i} className="leaf" transform={`translate(${x} ${y}) rotate(${r})`} d="M0 0c-14-6-22-16-24-28 14 2 22 12 24 28z" />
      ))}
      <circle className="berry b1" cx="44" cy="10" r="5" />
      <circle className="berry b2" cx="34" cy="18" r="4" />
      <circle className="berry b3" cx="50" cy="22" r="3.5" />
    </svg>
  );
}

// "להעמיק": שכבה שנייה למי שרוצה, בלי להעמיס על המסך
export function Deeper({ text, label = 'להעמיק', children }) {
  if (!text && !children) return null;
  return (
    <details className="deeper">
      <summary>{label}</summary>
      <div className="deeper-body">
        <Prose text={text} />
        {children}
      </div>
    </details>
  );
}

// ראש מרחב: דימוי, כותרת ומשפט אחד. את השאר – בשכבת ההעמקה.
export function PageHead({ spaceKey, eyebrow, title, lead, deep, deepLabel, children }) {
  const s = useSpaces().find((x) => x.key === spaceKey) || {};
  return (
    <header className={`page-head space-head tone-${s.tone || 'sage'}`}>
      <Motif kind={s.motif} size={72} className="head-motif" />
      <div className="head-text">
        <p className="eyebrow">{eyebrow ?? s.eyebrow}</p>
        <h1>{title ?? s.title}</h1>
        {lead ? <Prose text={lead} className="lead" /> : null}
        <Deeper text={deep} label={deepLabel} />
        {children}
      </div>
    </header>
  );
}
