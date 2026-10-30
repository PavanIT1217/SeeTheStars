// Attack tests for firestore.rules, run against the local emulator: npm run test:rules
// Each case says whether the rules must allow or deny it. Add cases whenever the rules change.
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'seethestars-rules-test',
  firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 },
});

const progress = (o = {}) => ({ learned: { moon: 1 }, spotted: {}, quiz: { home: { best: 4, total: 5, passed: true } }, updatedAt: 1, ...o });
await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'users/alice/progress/main'), progress()); });

const alice = env.authenticatedContext('alice').firestore();
const bob = env.authenticatedContext('bob').firestore();
const anon = env.unauthenticatedContext().firestore();
const many = Object.fromEntries(Array.from({ length: 501 }, (_, i) => [`o${i}`, 1]));

const cases = [
  ['signed out cannot read progress', 'deny', () => getDoc(doc(anon, 'users/alice/progress/main'))],
  ['alice can read her own progress', 'allow', () => getDoc(doc(alice, 'users/alice/progress/main'))],
  ['bob cannot read alice’s progress', 'deny', () => getDoc(doc(bob, 'users/alice/progress/main'))],
  ['nobody can list all users', 'deny', () => getDocs(collection(alice, 'users'))],
  ['alice can save her progress', 'allow', () => setDoc(doc(alice, 'users/alice/progress/main'), progress({ updatedAt: 2 }))],
  ['bob cannot overwrite alice’s progress', 'deny', () => setDoc(doc(bob, 'users/alice/progress/main'), progress())],
  ['signed out cannot write progress', 'deny', () => setDoc(doc(anon, 'users/alice/progress/main'), progress())],
  ['alice cannot add unknown fields (e.g. a child’s name)', 'deny', () => setDoc(doc(alice, 'users/alice/progress/main'), progress({ childName: 'Maya' }))],
  ['alice cannot use another document id', 'deny', () => setDoc(doc(alice, 'users/alice/progress/other'), progress())],
  ['alice cannot store oversized maps (>500 items)', 'deny', () => setDoc(doc(alice, 'users/alice/progress/main'), progress({ learned: many }))],
  ['updatedAt must be a number', 'deny', () => setDoc(doc(alice, 'users/alice/progress/main'), progress({ updatedAt: 'now' }))],
  ['alice cannot write elsewhere', 'deny', () => setDoc(doc(alice, 'stats/x'), { n: 1 })],
  ['alice can delete her progress', 'allow', () => deleteDoc(doc(alice, 'users/alice/progress/main'))],
];

let failed = 0;
for (const [name, expect, run] of cases) {
  try {
    await (expect === 'allow' ? assertSucceeds(run()) : assertFails(run()));
    console.log(`✔ ${name}`);
  } catch (e) {
    failed++;
    console.log(`✖ ${name}: ${e.message}`);
  }
}
await env.cleanup();
console.log(`${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
