import { useMemo } from 'react';

// סצנת גן מאוירת: גבעות בשכבות עם קצוות "מצוירים", פרחי בר בגדלים ובצבעים שונים,
// וניצוצות צבעוניים שמתקבצים מעל הגן – הדימוי של חלומות שמתפזרים בינינו ונאספים לתמונה אחת.
const W = 1200;

// מחולל פסאודו־אקראי קבוע, כדי שהגן ייראה אותו דבר בכל טעינה
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const PETALS = ['var(--blossom)', 'var(--peach)', 'var(--sun)', 'var(--lilac)', 'var(--sky)', 'var(--turquoise)'];
const INKS = ['var(--blossom-ink)', 'var(--peach-ink)', 'var(--sun-ink)', 'var(--lilac-ink)', 'var(--sky-ink)', 'var(--turquoise-ink)'];

function Flower({ kind, x, y, s, c }) {
  const petal = PETALS[c % PETALS.length];
  const ink = INKS[c % INKS.length];
  const h = 34 * s;
  const stem = <path d={`M0 0 C ${3 * s} ${-h * 0.4} ${-3 * s} ${-h * 0.7} 0 ${-h}`} className="gs-stem" />;
  const leaf = <path d={`M0 ${-h * 0.35} q ${10 * s} ${-6 * s} ${14 * s} ${-2 * s} q ${-6 * s} ${7 * s} ${-14 * s} ${2 * s}z`} className="gs-leaf" />;
  let head = null;
  if (kind === 'daisy') {
    head = (
      <g transform={`translate(0 ${-h})`}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <ellipse key={a} rx={2.6 * s} ry={7 * s} cy={-6 * s} transform={`rotate(${a})`} fill={petal} />)}
        <circle r={3.6 * s} fill={ink} />
      </g>
    );
  } else if (kind === 'poppy') {
    head = (
      <g transform={`translate(0 ${-h})`}>
        {[0, 90, 180, 270].map((a) => <circle key={a} r={6.5 * s} cx={4.5 * s} transform={`rotate(${a + 20})`} fill={petal} opacity=".92" />)}
        <circle r={3 * s} fill={ink} />
      </g>
    );
  } else if (kind === 'tulip') {
    head = <path transform={`translate(0 ${-h})`} d={`M${-7 * s} 0 C ${-8 * s} ${-12 * s} ${-3 * s} ${-14 * s} 0 ${-8 * s} C ${3 * s} ${-14 * s} ${8 * s} ${-12 * s} ${7 * s} 0 C ${4 * s} ${5 * s} ${-4 * s} ${5 * s} ${-7 * s} 0z`} fill={petal} stroke={ink} strokeWidth=".8" />;
  } else if (kind === 'spike') {
    head = (
      <g>
        {Array.from({ length: 7 }).map((_, i) => (
          <ellipse key={i} cx={(i % 2 ? 2.4 : -2.4) * s} cy={-h + i * 4.2 * s - 6 * s} rx={2.4 * s} ry={3.6 * s} fill={petal} />
        ))}
      </g>
    );
  } else if (kind === 'bud') {
    head = <circle cy={-h} r={4.2 * s} fill={petal} stroke={ink} strokeWidth=".8" />;
  } else {
    // עשב
    return (
      <g transform={`translate(${x} ${y})`} className="gs-grass">
        <path d={`M0 0 q ${-4 * s} ${-14 * s} ${-10 * s} ${-22 * s}M0 0 q ${1 * s} ${-16 * s} ${2 * s} ${-28 * s}M0 0 q ${5 * s} ${-12 * s} ${12 * s} ${-18 * s}`} />
      </g>
    );
  }
  return <g transform={`translate(${x} ${y})`} className="gs-flower">{stem}{leaf}{head}</g>;
}

// גובה הגבעה הקדמית בנקודה x (קירוב לעקומה המצוירת)
const frontY = (x, H, k) => H - 52 * k + (Math.sin(x / 140) * 9 + Math.sin(x / 47) * 3) * k;

export default function GardenScene({ height = 360, flowers = 50, sparks = 40, seed = 7, className = '' }) {
  const H = height;
  // סצנה נמוכה (כמו בראש מרחב) – גבעות ופרחים מתכווצים, כדי להשאיר שמיים לניצוצות
  const k = Math.min(1, H / 360);
  const sky = H - 195 * k;
  const hill = (v) => H - v * k;
  const { blooms, dots, links } = useMemo(() => {
    const r = rng(seed);
    const kinds = ['daisy', 'poppy', 'tulip', 'spike', 'bud', 'grass', 'daisy', 'poppy', 'grass'];
    const blooms = Array.from({ length: flowers }, (_, i) => {
      const x = 20 + r() * (W - 40);
      const depth = r();
      return {
        id: i, kind: kinds[Math.floor(r() * kinds.length)], x, y: frontY(x, H, k) + (6 + depth * 34) * k,
        s: (0.6 + depth * 0.9 + r() * 0.25) * (0.55 + 0.45 * k), c: Math.floor(r() * PETALS.length),
      };
    }).sort((a, b) => a.y - b.y);
    const dots = Array.from({ length: sparks }, (_, i) => {
      // הניצוצות מתקבצים לשלושה אשכולות מעל הגן
      const cluster = i % 3;
      const cx = [W * 0.34, W * 0.5, W * 0.66][cluster];
      const cy = sky * (cluster === 1 ? 0.5 : 0.62);
      const a = r() * Math.PI * 2;
      const d = 18 + r() * 70;
      return {
        id: i, x: cx + Math.cos(a) * d * 1.4, y: cy + Math.sin(a) * d * 0.7 * k, r: 3.4 + r() * 5.2,
        c: Math.floor(r() * PETALS.length), dx: (r() - 0.5) * 520, dy: (r() - 0.3) * 240, delay: r() * 1.4,
      };
    });
    const links = [];
    for (let i = 0; i < dots.length; i += 1) {
      for (let j = i + 1; j < dots.length; j += 1) {
        const a = dots[i]; const b = dots[j];
        if (Math.hypot(a.x - b.x, a.y - b.y) < 58 && links.length < 26) links.push({ a, b, id: `${i}-${j}` });
      }
    }
    return { blooms, dots, links };
  }, [H, k, sky, flowers, sparks, seed]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className={`garden-scene ${className}`} aria-hidden="true">
      <defs>
        <filter id={`paint-${seed}`} x="-10%" y="-10%" width="120%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale="7" />
        </filter>
      </defs>

      <g className="gs-links">
        {links.map(({ a, b, id }) => <line key={id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />)}
      </g>
      <g className="gs-sparks">
        {dots.map((d) => (
          <g key={d.id} className="gs-spark" style={{ '--dx': `${d.dx}px`, '--dy': `${d.dy}px`, '--delay': `${d.delay}s` }}>
            <circle cx={d.x} cy={d.y} r={d.r * 3} fill={PETALS[d.c]} opacity=".55" />
            <circle cx={d.x} cy={d.y} r={d.r} fill={INKS[d.c]} />
          </g>
        ))}
      </g>

      <path className="gs-bird" d={`M${W * 0.12} ${sky * 0.3} q 8 -7 15 0 q 7 -7 15 0`} />
      <path className="gs-bird" d={`M${W * 0.66} ${sky * 0.18} q 6 -5 11 0 q 5 -5 11 0`} />

      <g filter={`url(#paint-${seed})`}>
        <path className="gs-hill back" d={`M-40 ${hill(120)} C 200 ${hill(175)} 380 ${hill(140)} 560 ${hill(160)} S 900 ${hill(195)} 1240 ${hill(145)} V ${H + 10} H -40 Z`} />
        <path className="gs-hill mid" d={`M-40 ${hill(82)} C 180 ${hill(115)} 330 ${hill(78)} 520 ${hill(102)} S 860 ${hill(125)} 1240 ${hill(88)} V ${H + 10} H -40 Z`} />
        <path className="gs-hill front" d={`M-40 ${hill(50)} C 240 ${hill(72)} 420 ${hill(38)} 640 ${hill(60)} S 980 ${hill(66)} 1240 ${hill(48)} V ${H + 10} H -40 Z`} />
      </g>
      {blooms.map((b) => <Flower key={b.id} {...b} />)}
    </svg>
  );
}
