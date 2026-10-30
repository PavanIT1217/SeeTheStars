// Attack tests for firestore.rules, run against the local emulator: npm run test:rules
// Each case says whether the rules must allow or deny it. Add cases whenever the rules change.
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'seethestars-rules-test',
  firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 },
});

const member = (o = {}) => ({ nick: 'Asha', explored: 3, spotted: 1, badges: 0, quests: 1, xp: 80, updatedAt: 1, ...o });
const progress = (o = {}) => ({ learned: { moon: 1 }, spotted: {}, quiz: { home: { best: 4, total: 5, passed: true } }, updatedAt: 1, ...o });
await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'users/alice/progress/main'), progress()); });

await env.withSecurityRulesDisabled(async (c) => {
  await setDoc(doc(c.firestore(), 'classes/ABC234'), { owner: 'teacher', name: 'Class 5B', createdAt: 1 });
  await setDoc(doc(c.firestore(), 'classes/ABC234/members/kid1'), member());
});
const alice = env.authenticatedContext('alice').firestore();
const teacher = env.authenticatedContext('teacher', { firebase: { sign_in_provider: 'google.com' } }).firestore();
const kid1 = env.authenticatedContext('kid1', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const kid2 = env.authenticatedContext('kid2', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
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
  ['alice can sync her observing log and tours', 'allow', () => setDoc(doc(alice, 'users/alice/progress/main'), progress({ log: [{ key: 'moon', name: 'The Moon', at: 1 }], tours: { orion: 1 } }))],
  ['the observing log is capped at 300 entries', 'deny', () => setDoc(doc(alice, 'users/alice/progress/main'), progress({ log: Array.from({ length: 301 }, (_, i) => ({ key: 'moon', name: 'x', at: i })) }))],
  ['tours must be a map', 'deny', () => setDoc(doc(alice, 'users/alice/progress/main'), progress({ tours: 'all' }))],
  // classroom
  ['a teacher can create a class', 'allow', () => setDoc(doc(teacher, 'classes/XYZ789'), { owner: 'teacher', name: 'Stars club', createdAt: 2 })],
  ['an anonymous student cannot create a class', 'deny', () => setDoc(doc(kid1, 'classes/KID234'), { owner: 'kid1', name: 'Mine', createdAt: 2 })],
  ['a class cannot be created for someone else', 'deny', () => setDoc(doc(alice, 'classes/QQQ234'), { owner: 'teacher', name: 'X', createdAt: 2 })],
  ['class codes must look like codes', 'deny', () => setDoc(doc(teacher, 'classes/abc'), { owner: 'teacher', name: 'X', createdAt: 2 })],
  ['a student can look up a class code', 'allow', () => getDoc(doc(kid2, 'classes/ABC234'))],
  ['a student can join with a nickname', 'allow', () => setDoc(doc(kid2, 'classes/ABC234/members/kid2'), member({ nick: 'Leo' }))],
  ['a student cannot join a class that does not exist', 'deny', () => setDoc(doc(kid2, 'classes/NOPE22/members/kid2'), member())],
  ['a student cannot write as someone else', 'deny', () => setDoc(doc(kid2, 'classes/ABC234/members/kid1'), member())],
  ['a student cannot add personal fields', 'deny', () => setDoc(doc(kid2, 'classes/ABC234/members/kid2'), member({ email: 'x@y.z' }))],
  ['nicknames are at most 20 characters', 'deny', () => setDoc(doc(kid2, 'classes/ABC234/members/kid2'), member({ nick: 'x'.repeat(21) }))],
  ['a student cannot read classmates', 'deny', () => getDoc(doc(kid2, 'classes/ABC234/members/kid1'))],
  ['a student cannot list the roster', 'deny', () => getDocs(collection(kid2, 'classes/ABC234/members'))],
  ['the teacher can list the roster', 'allow', () => getDocs(collection(teacher, 'classes/ABC234/members'))],
  ['the teacher can list their own classes', 'allow', () => getDocs(query(collection(teacher, 'classes'), where('owner', '==', 'teacher')))],
  ['nobody can list all classes', 'deny', () => getDocs(collection(alice, 'classes'))],
  ['the teacher can remove a student', 'allow', () => deleteDoc(doc(teacher, 'classes/ABC234/members/kid1'))],
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
