# Store and child-privacy compliance

What See the Stars collects, and how to answer the store questionnaires. Keep this in step with
`privacy.html` and `firestore.rules`. Last reviewed 2026-10-30. **This is not legal advice. Have the answers
checked before the first public release.**

## What the app collects

| Data | When | Where it goes | Linked to a person? |
|---|---|---|---|
| Progress (explored, spotted, quiz scores, observing log, tours) | Only if a **grown-up signs in** | Firebase Firestore (`users/{uid}/progress/main`) | Yes, to the grown-up's account |
| Name, email, account ID (from Google/Apple) | Only if a grown-up signs in | Firebase Authentication | Yes |
| Class nickname + progress counts | Only if a **student joins a class** | Firestore (`classes/{code}/members/{uid}`), anonymous sign-in | To an anonymous ID only; the teacher sees the nickname |
| Rounded location (~10 km) | When the Tonight page loads online | Open-Meteo weather API (not stored by us) | No |
| Precise location, camera, motion sensors | Sky Finder | Never leaves the device | – |
| Reminders | If turned on in the apps | Scheduled on the device only | – |

No ads, no analytics, no tracking, no data sold or shared for advertising.

## Google Play – Data safety

- **Does your app collect or share any of the required user data types?** Yes.
- **Is all of the user data collected by your app encrypted in transit?** Yes.
- **Do you provide a way for users to request that their data is deleted?** Yes (Delete account in the app, Leave class, or an email to pavan@webappslab.com).
- Data types, all *collected*, *not shared*, *optional*:
  - **Personal info → Name, Email address**. Purpose: *Account management*. (Grown-up sign-in only.)
  - **Personal info → User IDs**. Purpose: *Account management, App functionality*.
  - **App activity → Other user-generated content / App interactions** (progress). Purpose: *App functionality*.
  - **Location → Approximate location**. Purpose: *App functionality* (weather forecast). Processed ephemerally: tick *Data is processed ephemerally*.
- **Target audience and content:** if the target audience includes under-13s, the **Families policy** applies:
  - No ads ✔. Firebase Authentication and Firestore are in Google's Families self-certified SDK list ✔ (re-check the list before submitting).
  - Sign-in is for grown-ups and sits behind a parental gate ✔. Children can use every feature without it ✔.
  - Teacher-approved classroom data is limited to a nickname and counts ✔.
- **Permissions:** camera, location, notifications (Android 13+). The exact-alarm permission is deliberately removed.

## Apple App Store – App Privacy ("nutrition label")

- **Data Linked to You:** Contact Info (Name, Email Address) – *App Functionality*; Identifiers (User ID) – *App Functionality*; User Content / Other Data (progress) – *App Functionality*.
- **Data Not Linked to You:** Coarse Location – *App Functionality* (weather).
- **Tracking:** No.
- **Age rating:** answer *None* to everything → 4+.
- **Category:** *Education* (primary), *Reference* (secondary). **Recommendation: do not put the app in the Kids Category yet.** The Kids Category forbids links out of the app without a parental gate. The app links to Wikipedia credits, the privacy policy and GitHub. To move into the Kids Category later, put those links behind the same grown-up question used for sign-in.
- **Sign in with Apple** is offered next to Google on iOS (guideline 4.8) ✔. **Account deletion** is in the app (guideline 5.1.1(v)) ✔. Apple token revocation needs the Sign in with Apple key added in Firebase (see below).
- **Encryption:** the app uses only standard HTTPS → `ITSAppUsesNonExemptEncryption = NO`.

## Children's privacy laws (COPPA, GDPR-K, India's DPDP Act)

- Children use the app without giving any personal data. Grown-ups choose to sign in.
- Classroom mode relies on the school/teacher context. Teachers should have the school's permission to use it, and students are told to use a nickname, not their full name.
- Privacy requests (access or deletion, including for a child) go to **pavan@webappslab.com**, listed in `privacy.html`.

## Open setup items

- [ ] Firebase → Authentication → Sign-in method → Apple → *OAuth code flow configuration*: Team ID `PDBY98SCNB`, Key ID `5VPWF4XSN7`, private key from `AuthKey_5VPWF4XSN7.p8` (in `~/seethestars-signing/`). Needed to revoke Apple tokens on Delete account.
- [ ] After the first Play upload: add Play's app-signing SHA-1/SHA-256 to the Firebase Android app, re-download `google-services.json`, rebuild.
- [x] Privacy contact email in `privacy.html`: pavan@webappslab.com.
