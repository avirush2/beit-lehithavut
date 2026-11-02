// הקציר העונתי נערך במעבר בין עונות (נקודות השוויון והמפנה, בקירוב).
const BOUNDS = [
  { month: 2, day: 20, ending: 'החורף', next: 'האביב' },
  { month: 5, day: 21, ending: 'האביב', next: 'הקיץ' },
  { month: 8, day: 22, ending: 'הקיץ', next: 'הסתיו' },
  { month: 11, day: 21, ending: 'הסתיו', next: 'החורף' },
];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function nextHarvest(now = new Date()) {
  const today = startOfDay(now);
  for (let y = now.getFullYear(); y <= now.getFullYear() + 1; y += 1) {
    for (const b of BOUNDS) {
      const date = new Date(y, b.month, b.day);
      if (date >= today) {
        return {
          date,
          ending: b.ending,
          next: b.next,
          days: Math.round((date - today) / 864e5),
          label: `קציר ${b.ending} ${y}`,
        };
      }
    }
  }
  return null;
}

// חלון הקציר: שבועיים לפני מעבר העונה ועד שבוע אחריו
export function harvestWindow(now = new Date()) {
  const n = nextHarvest(now);
  if (n && n.days <= 14) return n;
  const weekAgo = new Date(now.getTime() - 7 * 864e5);
  const prev = nextHarvest(weekAgo);
  if (prev && prev.date <= startOfDay(now)) return { ...prev, days: 0, after: true };
  return null;
}
