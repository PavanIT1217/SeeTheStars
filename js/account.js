// Grown-up account: sign in with Google (or Apple on iPhone) to keep a child's progress safe and the same
// on every device. Only progress is stored – what was explored, spotted and the quiz scores – never the
// child's name, location or anything else. Without signing in, everything stays on this device as before.
//
// The Firebase SDK is loaded on demand from Google's CDN, so nobody pays for it until they sign in.
// Website: Google's pop-up. iOS/Android apps: the phone's own Google or Apple sign-in screen
// (@capacitor-firebase/authentication), whose result signs in this same Firebase JS SDK.
import { Capacitor, registerPlugin } from './vendor/capacitor/core.js';

const FIREBASE = 'https://www.gstatic.com/firebasejs/13.0.0';
// Web config is public by design (it ships in every Firebase web app); Firestore rules protect the data.
const config = {
  apiKey: 'AIzaSyBx2N5bRU8mS9TrmOGnKyFeCB-ePq-VJeA',
  authDomain: 'seethestars-app.firebaseapp.com',
  projectId: 'seethestars-app',
  storageBucket: 'seethestars-app.firebasestorage.app',
  messagingSenderId: '1099223678104',
  appId: '1:1099223678104:web:2f58a4e56cc704e9e2e4ed',
};

const native = Capacitor.isNativePlatform();
export const PROVIDERS = Capacitor.getPlatform() === 'ios' ? ['apple', 'google'] : ['google']; // Apple must sit next to Google on iOS
const nativeAuth = () => registerPlugin('FirebaseAuthentication');

let sdkPromise = null;
function sdk() {
  sdkPromise ??= (async () => {
    const [appMod, auth, fs] = await Promise.all([import(`${FIREBASE}/firebase-app.js`), import(`${FIREBASE}/firebase-auth.js`), import(`${FIREBASE}/firebase-firestore-lite.js`)]);
    const app = appMod.getApps()[0] ?? appMod.initializeApp(config);
    // In the app's web view the default (pop-up capable) auth can hang; keep the session in IndexedDB instead.
    if (native) auth.initializeAuth(app, { persistence: auth.indexedDBLocalPersistence });
    return { app, auth, fs };
  })();
  sdkPromise.catch(() => { sdkPromise = null; }); // offline: try again next time
  return sdkPromise;
}

const toAccount = (u) => ({ uid: u.uid, name: u.displayName || u.email || 'Signed in', email: u.email || '', provider: u.providerData.some((p) => p.providerId === 'apple.com') ? 'apple' : 'google' });

/** Calls `cb` with the signed-in account (or null) now and whenever it changes. Only loads Firebase if someone signed in before. */
export function watchAccount(cb, { load = false } = {}) {
  if (!load && !hadAccount()) { cb(null); return () => {}; }
  let unsub = null;
  sdk().then(({ app, auth }) => { unsub = auth.onAuthStateChanged(auth.getAuth(app), (u) => { rememberAccount(!!u); cb(u ? toAccount(u) : null); }); }).catch(() => cb(null));
  return () => unsub?.();
}
const HINT = 'stg.account.v1';
const hadAccount = () => { try { return localStorage.getItem(HINT) === '1'; } catch { return false; } };
const rememberAccount = (on) => { try { if (on) localStorage.setItem(HINT, '1'); else localStorage.removeItem(HINT); } catch { /* ignore */ } };

export const isCancelled = (e) => /popup-closed|cancelled-popup|cancel|error 1001/i.test(`${e?.code} ${e?.message}`);

async function nativeCredential(provider) {
  const { auth } = await sdk();
  if (provider === 'apple') {
    const { credential: c, user } = await nativeAuth().signInWithApple();
    if (!c?.idToken) throw new Error('Apple sign-in returned no token');
    return { credential: new auth.OAuthProvider('apple.com').credential({ idToken: c.idToken, rawNonce: c.nonce }), appleAuthCode: c.authorizationCode, displayName: user?.displayName };
  }
  const { credential: c } = await nativeAuth().signInWithGoogle();
  if (!c?.idToken) throw new Error('Google sign-in returned no token');
  return { credential: auth.GoogleAuthProvider.credential(c.idToken) };
}

export async function signIn(provider = 'google') {
  const { app, auth } = await sdk();
  let user;
  if (native) {
    const { credential, displayName } = await nativeCredential(provider);
    user = (await auth.signInWithCredential(auth.getAuth(app), credential)).user;
    // Apple gives the name only on the first sign-in and not in its token, so keep it on the Firebase account.
    if (displayName && !user.displayName) await auth.updateProfile(user, { displayName }).catch(() => {});
  } else {
    const p = new auth.GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    user = (await auth.signInWithPopup(auth.getAuth(app), p)).user;
  }
  rememberAccount(true);
  return toAccount(user);
}

export async function signOut() {
  const { app, auth } = await sdk();
  if (native) await nativeAuth().signOut().catch(() => {}); // forget the phone's Google session too
  await auth.signOut(auth.getAuth(app));
  rememberAccount(false);
}

// ───────────── progress sync: users/{uid}/progress/main ─────────────
// { learned: {id: time}, spotted: {id: time}, quiz: {sectorId: {best, total, passed}}, updatedAt }

// Merging never loses anything: an item explored on either device counts, with the earlier time;
// for quizzes the best score and any pass win.
export function mergeProgress(a = {}, b = {}) {
  const times = (x = {}, y = {}) => {
    const out = { ...x };
    for (const [k, t] of Object.entries(y)) out[k] = out[k] ? Math.min(out[k], t) : t;
    return out;
  };
  const quiz = { ...(a.quiz || {}) };
  for (const [k, q] of Object.entries(b.quiz || {})) {
    const p = quiz[k];
    quiz[k] = p ? { best: Math.max(p.best, q.best), total: q.total || p.total, passed: !!(p.passed || q.passed) } : q;
  }
  return { learned: times(a.learned, b.learned), spotted: times(a.spotted, b.spotted), quiz };
}

export async function pullProgress(uid) {
  const { app, fs } = await sdk();
  const snap = await fs.getDoc(fs.doc(fs.getFirestore(app), 'users', uid, 'progress', 'main'));
  return snap.exists() ? snap.data() : null;
}

export async function pushProgress(uid, p) {
  const { app, fs } = await sdk();
  const clean = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => /^[a-z0-9-]{1,40}$/.test(k)).slice(0, 500));
  await fs.setDoc(fs.doc(fs.getFirestore(app), 'users', uid, 'progress', 'main'), {
    learned: clean(p.learned), spotted: clean(p.spotted),
    quiz: Object.fromEntries(Object.entries(clean(p.quiz)).map(([k, q]) => [k, { best: +q.best || 0, total: +q.total || 0, passed: !!q.passed }])),
    updatedAt: Date.now(),
  });
}

/** Permanently delete the account and its progress. Must be called straight from a click (it shows a sign-in screen). */
export async function deleteAccount() {
  const { app, auth, fs } = await sdk();
  const a = auth.getAuth(app);
  const user = a.currentUser;
  if (!user) return;
  // Deleting a sign-in account needs a recent sign-in, so always confirm first.
  if (native) {
    const { credential, appleAuthCode } = await nativeCredential(user.providerData.some((p) => p.providerId === 'apple.com') ? 'apple' : 'google');
    await auth.reauthenticateWithCredential(user, credential);
    // Apple requires apps to revoke the Sign in with Apple token when an account is deleted.
    if (appleAuthCode) await auth.revokeAccessToken(a, appleAuthCode).catch((e) => console.warn('Could not revoke the Apple token', e));
  } else {
    await auth.reauthenticateWithPopup(user, new auth.GoogleAuthProvider());
  }
  await fs.deleteDoc(fs.doc(fs.getFirestore(app), 'users', user.uid, 'progress', 'main'));
  await user.delete();
  if (native) await nativeAuth().signOut().catch(() => {});
  rememberAccount(false);
}
