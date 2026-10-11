# Publishing See the Stars to Google Play and the App Store

The Android and iOS apps live in `android/` and `ios/`. They are the same web app (`index.html`, `js/`, `css/`, …) packaged with [Capacitor](https://capacitorjs.com/). You change the app once and both stores get the update.

---

## 0. Before you start

| | Google Play | Apple App Store |
|---|---|---|
| Developer account | [Google Play Console](https://play.google.com/console/signup): **US$25 once** | [Apple Developer Program](https://developer.apple.com/programs/enroll/): **US$99 per year** |
| Computer needed | Any (GitHub builds it for you) | **A Mac with Xcode** (free from the Mac App Store) |
| Identity checks | ID verification, can take a few days | Can take a few days (organisations need a D-U-N-S number) |
| First release | New *personal* accounts must run a **closed test with at least 12 testers for 14 days** before going public | Every version goes through **App Review** (usually 1–3 days) |

**App ID.** The apps use `com.webappslab.seethestars`, based on your domain. Once you've uploaded to a store, this ID can never change: Google Play calls it the *package name*, Apple the *Bundle ID*. Use exactly this value when you create the app in Play Console and App Store Connect.

**Website and privacy policy URL.** The web version is live at **https://seethestars.webappslab.com** (GitHub Pages from `master`, custom domain set in the `CNAME` file). Both stores need a privacy policy URL. Use:
`https://seethestars.webappslab.com/privacy.html`

---

## 1. Try it on your own phone first

**Android:** every push to GitHub builds a test app.
1. Open the repo on GitHub → **Actions** → the latest *Test and build apps* run.
2. Download **see-the-stars-android-test-apk** at the bottom of the page and unzip it.
3. Copy `app-debug.apk` to your phone and open it. Allow "install unknown apps" when asked.

**iPhone:** needs a Mac (a free Apple ID is enough to run it on your own phone).
1. `git clone` the repo, then run `npm ci` and `npm run ios`. Xcode opens.
2. Plug in your iPhone, choose it at the top of Xcode, select your team under **Signing & Capabilities**, and press ▶︎.

Check these on a real phone: camera view, compass arrows (try "calibrate"), location, ISS pass times, saving items for offline, and airplane mode.

---

## 2. Google Play

### 2a. Create your upload key (one time only, keep it forever)
On any computer with Java installed:

```bash
keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

> ⚠️ Back up `upload.jks` and its passwords somewhere safe (a password manager). **Never commit it to GitHub.**

### 2b. Give GitHub the key (so it can build signed bundles)
Repo **Settings → Secrets and variables → Actions → New repository secret**. Add four secrets:

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | output of `base64 -w0 upload.jks` (macOS: `base64 -i upload.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | the key password |

The next GitHub run also produces **see-the-stars-play-store-bundle** (`app-release.aab`). Its version code goes up automatically with every run.

### 2c. Create the app in Play Console
1. **Create app** → name *See the Stars*, type *App*, *Free*.
2. **Store listing**: use the texts in [store listing text](#4-store-listing-text) below, plus:
   - App icon (512×512): `icons/icon-512.png`
   - Feature graphic: `store/play-feature-graphic.png`
   - Phone screenshots: `store/android-*.png`
3. **App content** section:
   - Privacy policy: the URL above
   - Ads: *No ads*
   - Data safety: *No data collected or shared*. Location is processed on the device only and never leaves it.
   - Content rating questionnaire: Education/Reference, no violence etc. Expect *Everyone / 3+*
   - **Target audience**: if you include ages under 13, Google's *Families* policies apply. The app already has no ads, no accounts and no data collection. Read the questions carefully.
4. **Testing → Closed testing**: upload `app-release.aab`, add at least 12 testers (friends and family with Google accounts), and run the test for 14 days.
5. Then **Production → Create release** → upload the latest `.aab` → submit for review.

Turn on **Play App Signing** when asked (recommended). Google then keeps the final app-signing key, and your `upload.jks` is only used to upload.

---

## 3. Apple App Store (needs a Mac)

1. Enroll in the Apple Developer Program.
2. On the Mac: `git clone …`, `npm ci`, `npm run ios`. Xcode opens the project.
3. In Xcode, select the **App** target:
   - **Signing & Capabilities**: tick *Automatically manage signing*, choose your Team, and check the Bundle Identifier.
   - **General → Identity**: Version `1.0`, Build `1`. Increase Build for every upload.
4. In [App Store Connect](https://appstoreconnect.apple.com) → **My Apps → +** → New App, with the same bundle ID.
5. Back in Xcode: choose **Any iOS Device** → **Product → Archive** → **Distribute App → App Store Connect → Upload**.
6. In App Store Connect, fill in the app page:
   - Screenshots: `store/ios-6.9-*.png` (6.9" display, 1320×2868)
   - Description, keywords and subtitle: see the next section
   - Privacy policy URL: the URL above
   - **App Privacy**: *Data Not Collected*
   - Age rating questionnaire: all "None", which gives *4+*
   - Category: **Education** (secondary: Reference)
7. Choose the build you uploaded → **Submit for Review**.

> **About the "Kids" category:** Apple's Kids Category has extra rules. For example, links that leave the app (our "Read the full article on Wikipedia") need a parental gate. Publishing under **Education** with a 4+ rating avoids that and still lets families find it. You can add a parental gate later and move to the Kids Category if you want.

The camera, location and motion permission messages are already set in `ios/App/App/Info.plist`. Apple reviews them.

---

## 4. Store listing text

**App name:** See the Stars
**Subtitle (iOS, 30 chars):** Explore the universe, live
**Short description (Play, 80 chars):** Planets, comets, black holes & the ISS – point your phone to find them in the sky

**Full description:**

> Take a journey across the universe, one wonder at a time.
>
> See the Stars guides curious kids and students through 12 sectors, from the ground under your feet to the edge of the observable universe: the Moon and Sun, the planets and dwarf planets, comets and interstellar visitors, stars and the planets around them, constellations, nebulae, pulsars, black holes, galaxies and the Big Bang.
>
> ✦ SKY FINDER: Hold up your phone and follow the arrow to any planet, star, galaxy or black hole. It works even when the object is below the horizon, so you'll know you're pointing *through the Earth*. Track the International Space Station live and find out when you can see it with your own eyes.
>
> ✦ REAL SCIENCE: Positions are calculated from NASA JPL orbital data. Every object has live data (how far away it is right now, how long its light takes to reach you), a discovery timeline, a mind-blowing fact and a question to wonder about.
>
> ✦ LIGHT IS A TIME MACHINE: Find out what was happening on Earth when the light you're seeing set off.
>
> ✦ LEARN AND LEVEL UP: Earn XP, climb from Stargazer Cadet to Cosmic Explorer, and win a badge for every sector challenge.
>
> ✦ WORKS OFFLINE: All lessons, quizzes and the Sky Finder work without internet. Save the photos you like for offline use.
>
> No ads. No accounts. No tracking. Your progress stays on your device.

**Keywords (iOS, 100 chars):** astronomy,space,planets,stars,constellations,kids,science,ISS,black hole,galaxy,comet,solar system

---

## 5. Releasing an update

1. Make your changes and push to GitHub.
2. **Android:** download the new `.aab` from the latest Actions run and upload it as a new release in Play Console.
3. **iOS:** on the Mac, `git pull`, `npm ci`, `npm run ios`, increase **Build** in Xcode, then Archive and upload again.
4. **Web version:** updates automatically on GitHub Pages.

Useful commands:

```bash
npm start          # run the web app at http://localhost:8080
npm test           # astronomy + ISS checks against NASA JPL, offline file list
npm run sync       # copy the web app into the Android and iOS projects
npm run android    # sync + open Android Studio
npm run ios        # sync + open Xcode (Mac only)
```

If you change the icon or splash artwork in `assets/`, regenerate them with:

```bash
npx @capacitor/assets generate --iconBackgroundColor '#04050d' --splashBackgroundColor '#04050d'
```
