// Classroom mode. A teacher (a signed-in grown-up) creates a class and shares its 6-character code.
// Students join with the code and a nickname – no email, no account: an anonymous sign-in on their device.
// The teacher sees each nickname with counts (explored, spotted, badges, quests, XP), nothing else.
// Rules: firestore.rules (classes/…); attack tests: tests/rules/.
import { sdk } from './account.js';
import { getSettings, setSettings, progress, xp, badges, quests } from './store.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I, easy to read out loud
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => ALPHABET[b % ALPHABET.length]).join('');
export const normaliseCode = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

export async function createClass(name) {
  const { app, auth, fs } = await sdk();
  const user = auth.getAuth(app).currentUser;
  if (!user || user.isAnonymous) throw new Error('Sign in as a grown-up first');
  const db = fs.getFirestore(app);
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    try {
      // The rules refuse to overwrite an existing class, so a clash just means "try another code".
      if ((await fs.getDoc(fs.doc(db, 'classes', code))).exists()) continue;
      await fs.setDoc(fs.doc(db, 'classes', code), { owner: user.uid, name: String(name).trim().slice(0, 40) || 'My class', createdAt: Date.now() });
      return code;
    } catch (e) { if (i === 4) throw e; }
  }
  throw new Error('Could not create a class code');
}

export async function myClasses() {
  const { app, auth, fs } = await sdk();
  const user = auth.getAuth(app).currentUser;
  if (!user || user.isAnonymous) return [];
  const snap = await fs.getDocs(fs.query(fs.collection(fs.getFirestore(app), 'classes'), fs.where('owner', '==', user.uid)));
  return snap.docs.map((d) => ({ code: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
}

export async function roster(code) {
  const { app, fs } = await sdk();
  const snap = await fs.getDocs(fs.collection(fs.getFirestore(app), 'classes', code, 'members'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() })).sort((a, b) => b.xp - a.xp);
}

export async function removeMember(code, uid) {
  const { app, fs } = await sdk();
  await fs.deleteDoc(fs.doc(fs.getFirestore(app), 'classes', code, 'members', uid));
}

export async function deleteClass(code) {
  const { app, fs } = await sdk();
  const db = fs.getFirestore(app);
  for (const m of await roster(code)) await fs.deleteDoc(fs.doc(db, 'classes', code, 'members', m.uid));
  await fs.deleteDoc(fs.doc(db, 'classes', code));
}

// ───────────── the student's side ─────────────
export const myClass = () => getSettings().classroom || null; // { code, nick, name }

const summary = (nick) => ({
  nick,
  explored: Object.keys(progress().learned).length,
  spotted: Object.keys(progress().spotted).length,
  badges: badges().length,
  quests: quests().filter((q) => q.done).length,
  xp: xp(),
  updatedAt: Date.now(),
});

async function studentUser() {
  const { app, auth } = await sdk();
  const a = auth.getAuth(app);
  await a.authStateReady?.();
  return a.currentUser || (await auth.signInAnonymously(a)).user;
}

export async function joinClass(codeInput, nickInput) {
  const code = normaliseCode(codeInput), nick = String(nickInput).trim().slice(0, 20);
  if (code.length !== 6 || !nick) throw new Error('Enter the 6-letter class code and a nickname');
  const { app, fs } = await sdk();
  const user = await studentUser();
  const db = fs.getFirestore(app);
  const cls = await fs.getDoc(fs.doc(db, 'classes', code));
  if (!cls.exists()) throw Object.assign(new Error('No class has that code – check it with your teacher'), { code: 'no-class' });
  await fs.setDoc(fs.doc(db, 'classes', code, 'members', user.uid), summary(nick));
  setSettings({ classroom: { code, nick, name: cls.data().name } });
  return myClass();
}

export async function pushClassProgress() {
  const c = myClass();
  if (!c) return;
  const { app, fs } = await sdk();
  const user = await studentUser();
  await fs.setDoc(fs.doc(fs.getFirestore(app), 'classes', c.code, 'members', user.uid), summary(c.nick));
}

export async function leaveClass() {
  const c = myClass();
  if (!c) return;
  try {
    const { app, auth, fs } = await sdk();
    const user = auth.getAuth(app).currentUser;
    if (user) await fs.deleteDoc(fs.doc(fs.getFirestore(app), 'classes', c.code, 'members', user.uid));
  } finally {
    setSettings({ classroom: null });
  }
}
