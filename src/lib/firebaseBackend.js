import { initializeApp } from 'firebase/app';
import {
  initializeFirestore, collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where,
} from 'firebase/firestore';
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile, signOut, sendPasswordResetEmail,
} from 'firebase/auth';

export function createFirebaseBackend(config) {
  const app = initializeApp(config);
  const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  const auth = getAuth(app);
  const toList = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const ref = (col, filter) => (filter ? query(collection(db, col), where(filter[0], '==', filter[1])) : collection(db, col));

  return {
    subscribe(col, filter, cb) {
      return onSnapshot(ref(col, filter), (s) => cb(toList(s)), (e) => { console.error(col, e); cb([]); });
    },
    subscribeDoc(col, id, cb) {
      return onSnapshot(
        doc(db, col, id),
        (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null),
        (e) => { console.error(col, id, e); cb(null); },
      );
    },
    async list(col, filter) { return toList(await getDocs(ref(col, filter))); },
    async get(col, id) {
      const s = await getDoc(doc(db, col, id));
      return s.exists() ? { id: s.id, ...s.data() } : null;
    },
    async add(col, data) { return (await addDoc(collection(db, col), { ...data, createdAt: Date.now() })).id; },
    set(col, id, data, merge = true) { return setDoc(doc(db, col, id), data, { merge }); },
    update(col, id, data) { return updateDoc(doc(db, col, id), data); },
    remove(col, id) { return deleteDoc(doc(db, col, id)); },

    onAuth(cb) {
      return onAuthStateChanged(auth, (u) => cb(u ? {
        uid: u.uid,
        displayName: u.displayName || '',
      } : null));
    },
    signInGoogle() { return signInWithPopup(auth, new GoogleAuthProvider()); },
    signInEmail(email, password) { return signInWithEmailAndPassword(auth, email, password); },
    async signUpEmail(name, email, password) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      return { uid: cred.user.uid, displayName: name };
    },
    resetPassword(email) { return sendPasswordResetEmail(auth, email); },
    signOut() { return signOut(auth); },
  };
}
