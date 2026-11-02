import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// גן החלומות: כל חלום הוא צמח. חלומות עם נושא משותף צומחים באותה ערוגה,
// וחוטים מחברים חלומות שמישהו הרגיש שהם מהדהדים זה את זה.
const W = 1000;
const H = 620;
const COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
const NO_THEME = 'עוד בלי ערוגה';

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

export default function Garden({ dreams, resonances }) {
  const navigate = useNavigate();
  const [hover, setHover] = useState(null);

  const { beds, pos } = useMemo(() => {
    const groups = new Map();
    for (const d of dreams) {
      const theme = d.themes?.[0] || NO_THEME;
      if (!groups.has(theme)) groups.set(theme, []);
      groups.get(theme).push(d);
    }
    const names = [...groups.keys()].sort((a, b) => groups.get(b).length - groups.get(a).length);
    const n = names.length;
    const p = new Map();
    const bedList = names.map((name, i) => {
      // ערוגות על אליפסה סביב המרכז; ערוגה יחידה – במרכז
      const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
      const cx = n === 1 ? W / 2 : W / 2 + Math.cos(angle) * (W * 0.33);
      const cy = n === 1 ? H / 2 : H / 2 + Math.sin(angle) * (H * 0.3);
      const members = groups.get(name);
      const r = 34 + Math.sqrt(members.length) * 26;
      members.forEach((d, k) => {
        // ספירלת זהב בתוך הערוגה
        const t = k * 2.39996 + hash(d.id) * 0.6;
        const rr = members.length === 1 ? 0 : 14 + Math.sqrt(k + 0.5) * 22;
        p.set(d.id, { x: cx + Math.cos(t) * rr, y: cy + Math.sin(t) * rr * 0.8, color: COLORS[i % COLORS.length] });
      });
      return { name, cx, cy, r, color: COLORS[i % COLORS.length], count: members.length };
    });
    return { beds: bedList, pos: p };
  }, [dreams]);

  const links = (resonances || []).filter((r) => pos.has(r.a) && pos.has(r.b));
  const linkCount = (id) => links.filter((l) => l.a === id || l.b === id).length;
  const hovered = hover ? dreams.find((d) => d.id === hover) : null;

  return (
    <div className="garden-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="garden" role="img" aria-label="גן החלומות">
        {beds.map((b) => (
          <g key={b.name}>
            <ellipse cx={b.cx} cy={b.cy + 6} rx={b.r + 20} ry={(b.r + 20) * 0.78} className="bed" style={{ '--bed': b.color }} />
            <text x={b.cx} y={b.cy - (b.r + 20) * 0.78 - 8} textAnchor="middle" className="bed-label">{b.name}</text>
          </g>
        ))}
        {links.map((l) => {
          const a = pos.get(l.a);
          const b = pos.get(l.b);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2 - Math.min(120, Math.hypot(a.x - b.x, a.y - b.y) * 0.25);
          const lit = hover && (l.a === hover || l.b === hover);
          return <path key={l.id} d={`M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`} className={`thread ${lit ? 'lit' : ''}`} />;
        })}
        {dreams.map((d) => {
          const p = pos.get(d.id);
          const leaves = 1 + Math.min(4, linkCount(d.id));
          const h = 26 + Math.min(18, (d.body || '').length / 60);
          return (
            <g
              key={d.id}
              className={`plant ${hover === d.id ? 'hover' : ''}`}
              transform={`translate(${p.x},${p.y}) scale(1.5)`}
              onMouseEnter={() => setHover(d.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(d.id)}
              onBlur={() => setHover(null)}
              onClick={() => navigate(`/dreams/${d.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/dreams/${d.id}`)}
              tabIndex={0}
              role="link"
              aria-label={d.title}
            >
              <circle r="22" className="plant-hit" />
              <path d={`M0,10 C2,${-h / 3} -2,${-h / 1.6} 0,${-h}`} className="stem" />
              {Array.from({ length: leaves }).map((_, k) => {
                const y = -6 - k * ((h - 10) / Math.max(leaves, 1));
                const side = k % 2 ? -1 : 1;
                return <path key={k} d={`M0,${y} q${side * 9},-5 ${side * 13},-1 q${side * -6},6 ${side * -13},1`} className="leaf" />;
              })}
              <circle cy={-h} r="6.5" style={{ fill: p.color }} className="bloom" />
              <circle cy={-h} r="2.4" className="bloom-core" />
            </g>
          );
        })}
      </svg>
      <div className="garden-caption" aria-live="polite">
        {hovered ? <><strong>{hovered.title}</strong> · {hovered.name}</> : 'כל צמח הוא חלום. לחיצה פותחת אותו. חוטים מחברים חלומות שמהדהדים זה את זה.'}
      </div>
    </div>
  );
}
