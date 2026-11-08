import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { backend, isDemo } from './backend.js';
import {
  DEFAULT_CONTENT, DEFAULT_LABELS, SPACES, NAV_GROUPS, DREAM_LAYERS, STORY_KINDS, DECKS, FEEDBACK_TYPES,
  IDEA_KINDS, LENSES, SPRINGS, HAPPENING_KINDS,
} from '../content/defaults.js';

// null = עדיין נטען
export function useCollection(col, filter) {
  const [items, setItems] = useState(null);
  const key = filter ? filter.join('|') : '';
  useEffect(() => {
    if (!col) { setItems([]); return undefined; }
    setItems(null);
    return backend.subscribe(col, filter || null, setItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [col, key]);
  return items;
}

// undefined = נטען, null = לא קיים
export function useDoc(col, id) {
  const [d, setD] = useState(undefined);
  useEffect(() => {
    if (!col || !id) { setD(undefined); return undefined; }
    setD(undefined);
    return backend.subscribeDoc(col, id, setD);
  }, [col, id]);
  return d;
}

export function useContent(key) {
  const d = useDoc('content', key);
  return d?.body ?? DEFAULT_CONTENT[key] ?? '';
}

export function useSettings() {
  return useDoc('settings', 'site') || {};
}

// תוויות וכותרות: מסמך אחד (content/labels) שנערך בממשק הניהול, עם ברירות מחדל מהקוד
const LabelsCtx = createContext(DEFAULT_LABELS);

export function LabelsProvider({ children }) {
  const d = useDoc('content', 'labels');
  const value = useMemo(() => ({ ...DEFAULT_LABELS, ...(d?.labels || {}) }), [d]);
  return <LabelsCtx.Provider value={value}>{children}</LabelsCtx.Provider>;
}

export function useT() {
  const labels = useContext(LabelsCtx);
  // תווית שרוקנה בממשק הניהול חוזרת לנוסח המקורי
  return useCallback((key) => labels[key] || DEFAULT_LABELS[key] || '', [labels]);
}

// רשימה מהקוד, כשהשדות הטקסטואליים שלה מוחלפים בתוויות הערוכות
function useLocalized(list, prefix, fields) {
  const t = useT();
  return useMemo(() => list.map((x) => ({
    ...x, ...Object.fromEntries(fields.map((f) => [f, t(`${prefix}-${x.key}-${f}`) || x[f]])),
  })), [list, prefix, fields, t]);
}
const F = {
  space: ['title'], layer: ['title', 'question'], story: ['title', 'text'], deck: ['title', 'text'],
  feedback: ['label', 'hint'], group: ['title', 'hint'], kind: ['label', 'titleLabel', 'placeholder'],
  lens: ['title', 'question'], spring: ['title', 'short', 'text'], hkind: ['title', 'text', 'titleLabel'],
};
export const useHappeningKinds = () => useLocalized(HAPPENING_KINDS, 'hkind', F.hkind);
export const useSpaces = () => useLocalized(SPACES, 'space', F.space);
export const useNavGroups = () => useLocalized(NAV_GROUPS, 'group', F.group);
export const useDreamLayers = () => useLocalized(DREAM_LAYERS, 'layer', F.layer);
export const useStoryKinds = () => useLocalized(STORY_KINDS, 'story', F.story);
export const useDecks = () => useLocalized(DECKS, 'deck', F.deck);
export const useFeedbackTypes = () => useLocalized(FEEDBACK_TYPES, 'feedback', F.feedback);
export const useIdeaKinds = () => useLocalized(IDEA_KINDS, 'kind', F.kind);
export const useLenses = () => useLocalized(LENSES, 'lens', F.lens);
export const useSprings = () => useLocalized(SPRINGS, 'spring', F.spring);

export const byNewest =(a, b) => (b.createdAt || 0) - (a.createdAt || 0);
export const byOldest = (a, b) => (a.createdAt || 0) - (b.createdAt || 0);
export const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999);

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [signInOpen, setSignInOpen] = useState(false);
  useEffect(() => backend.onAuth(setUser), []);

  const profile = useDoc(user ? 'users' : null, user?.uid);
  const owner = useDoc('meta', 'owner');

  // יצירת פרופיל בפעם הראשונה שמשתתפ.ת נכנס.ת
  useEffect(() => {
    if (user && profile === null) {
      backend.set('users', user.uid, {
        displayName: user.displayName || 'משתתפ.ת',
        role: 'member',
        createdAt: Date.now(),
      }, false).catch((e) => console.error(e));
    }
  }, [user, profile]);

  const isAdmin = !!user && (isDemo || owner?.uid === user.uid || profile?.role === 'admin');
  const isHost = isAdmin || profile?.role === 'host';
  const name = profile?.displayName || user?.displayName || '';

  const requireUser = useCallback(() => {
    if (user) return true;
    setSignInOpen(true);
    return false;
  }, [user]);

  const value = useMemo(() => ({
    user: user || null,
    loading: user === undefined,
    name,
    isAdmin,
    isHost,
    owner,
    signInOpen,
    openSignIn: () => setSignInOpen(true),
    closeSignIn: () => setSignInOpen(false),
    requireUser,
    // שדות שכל פוסט של משתתפ.ת נושא
    stamp: () => ({ uid: user?.uid, name }),
  }), [user, name, isAdmin, isHost, owner, signInOpen, requireUser]);

  return <AuthCtx.Provider value={value}><LabelsProvider>{children}</LabelsProvider></AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

// פריטים מוסתרים נראים רק למארחים
export function visibleFor(items, isHost) {
  if (!items) return items;
  return isHost ? items : items.filter((x) => !x.hidden);
}
