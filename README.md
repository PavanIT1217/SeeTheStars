# See the Stars

**Live:** https://seethestars.webappslab.com

A journey through the universe for curious kids and students, with a **Sky Finder** that uses your phone's camera, compass and motion sensors to show *where* everything is right now, even when it's on the other side of the Earth.

## What's inside

- **The Journey:** 12 sectors and 61 objects, explored in order so each step builds on the last:
  Home Base (incl. the ISS) → Rocky Worlds → Giants → Dwarf Planets → Comets & Space Visitors → Stars → Other Worlds (exoplanets) → Constellations → Star Nurseries & Graveyards → Pulsars & Black Holes → Galaxies → The Whole Universe.
- **Every object page has:** a real photo (from Wikimedia Commons, credited), three "take a closer look" sections, an at-a-glance strip of kid-sized comparisons, Earth and the object drawn to scale, live data (distance right now, light travel time, where it is in your sky), a *time machine* (what was happening on Earth when its light set off), a discovery timeline, a mind-blowing fact, a "wonder" question, how to see it yourself, and the Wikipedia extract.
- **Chapters:** the sectors are grouped into four chapters that zoom outward, from the Solar System to the stars, to how stars live and die, to galaxies and the whole universe. The home page also shows which planets are in your sky right now.
- **ISS tracking:** live position from current orbit data, and predicted times when you can see it pass over with your own eyes.
- **Sky Finder:** pick any target, hold up your phone, and follow the arrow until it says *LOCKED ON*. Draws 5,000 stars in their real colours, all 88 constellations (boundaries in Scientist view), the horizon and compass points over the live camera view. Search any planet, named star or constellation. Without motion sensors (e.g. on a laptop), drag the sky to explore and pinch or scroll to zoom.
- **Sky layers** (switches in the Sky Finder settings):
  - **Pictures:** artwork for 12 famous constellations (the Hunter, the Great Bear, the Lion…) drawn over the real stars.
  - **Star distances:** how many light-years away each named star is, and when the light you see set off.
  - **Clouds, Wind, Rain:** the forecast hour by hour from Open-Meteo. Clouds are shown in three layers (low, middle, high) and drift with the real wind. Eight extra points about 60 km away fill the horizon, so you can see where clear sky is coming from. Time travel scrubs through the two-day forecast.
  - **Storms:** live tropical cyclones from GDACS (UN/EC), with distance, direction and where each storm is heading.
- **Places on Earth:** point at the Eiffel Tower, the Taj Mahal or any town (built-in landmarks work offline; any town is searched online). The arrow guides you straight *through the Earth*, and the panel gives the distance and the compass bearing to travel there.
- **Tonight:** the best things to see tonight from where you are (planets, the Moon, space stations flying over, a constellation and a bright star to learn, meteor showers), a nightly challenge, and what's coming up in the next two weeks.
- **Time travel:** play the sky forward, scrub ±24 hours, or (Scientist view) jump to any date.
- **Sky reminders** (iPhone and Android apps): space station passes, full and new Moons, meteor showers and planets meeting up, worked out on the phone.
- **Optional grown-up account:** sign in with Google (or Apple on iPhone) behind a parental gate to back up progress and keep it the same on every device. Only progress is stored, in Firebase; rules in `firestore.rules`, attack tests in `npm run test:rules`.
- **Guided tours, quests and an observing log:** step-by-step sky tours (read aloud where supported), nine real-sky quests and a log of everything you've found.
- **Classroom mode:** teachers create a class code and follow progress (nicknames and counts only); printable worksheets for every chapter at `/classroom/`.
- **Languages:** English, Hindi and Spanish interface (lesson texts are English for now).
- **Stargazing score:** how good tonight is for stargazing, from the cloud forecast and the Moon.
- **Home-screen widgets** (iPhone and Android): tonight's Moon, best sight and next space-station pass.
- **Tonight's Moon:** phase, how much is lit, moonrise and moonset, and the next full or new Moon.
- **Red night mode:** turns the whole app red to keep your eyes adjusted to the dark.
- **Motivation:** XP, ranks (Stargazer Cadet → Cosmic Explorer), sector challenges (quizzes) and badges, plus a reward for every object you physically point at.
- **Offline:** it's an installable app (PWA). Lessons, quizzes, artwork and the Sky Finder always work offline. Photos and extracts are downloaded only for the objects or sectors you choose to save (My journey).

## Mobile apps

The `android/` and `ios/` folders are native app projects (built with [Capacitor](https://capacitorjs.com/)) for Google Play and the App Store. Every push to GitHub runs the tests, builds an installable Android test APK and compiles the iOS app (see the **Actions** tab). Step-by-step store publishing, including accounts, signing, store text and screenshots in `store/`, is in **[PUBLISHING.md](PUBLISHING.md)**.

## Run it

No bundler and no runtime dependencies:

```bash
npm start           # serves on http://localhost:8080
npm test            # astronomy checks against NASA JPL Horizons, offline file list, up-to-date pages
npm run pages       # re-generate the pre-rendered pages after changing content or template.html
npm run sync        # copy the web app into the Android/iOS projects
```

### Pages and SEO

Every sector and object has its own address (for example `/object/saturn/`). `npm run pages` (`scripts/build-pages.mjs`) renders each one to a static HTML file using the same view code as the app (`js/views.js`), with its own title, description, canonical URL, social-share tags and schema.org structured data, plus `sitemap.xml` and `robots.txt`. GitHub Pages serves these files directly, so search engines see full content; in the browser the app takes over. **Edit `template.html`, not `index.html`**, and commit the regenerated files. The tests fail if they are out of date.

The camera and motion sensors only work over **HTTPS** (or `localhost`). The live site, **https://seethestars.webappslab.com**, is deployed by GitHub Pages from `master`. Open it on a phone and use "Add to Home Screen" to install it.

## Project layout

| Path | What it does |
|---|---|
| `js/data/catalog.js` | All learning content: sectors, objects, quizzes, constellation figures |
| `js/data/sky.js` | 5,044 stars and the 88 constellations (lines, boundaries, names) – generated by `scripts/build-sky-data.mjs` from [d3-celestial](https://github.com/ofrohn/d3-celestial) (BSD-3-Clause); star distances from the [HYG database](https://github.com/astronexus/HYG-Database) v4.1 (© David Nash, CC BY-SA 4.0) |
| `js/astro.js` | Astronomy engine: planets, dwarf planets, comets (incl. interstellar), Moon, Sun; alt/az, rise/set |
| `js/tonight.js` | The Tonight planner: dark window, highlights, conjunctions, meteor showers |
| `js/reminders.js` | Sky reminders, built from the Tonight planner and scheduled as local notifications in the apps |
| `js/account.js` | Optional grown-up sign-in and progress sync (Firebase, loaded on demand) |
| `js/iss.js` | ISS tracking (SGP4 via bundled [satellite.js](https://github.com/shashwatak/satellite-js), MIT) and pass predictions |
| `js/sky.js` | Sky Finder: sensors, camera, projection, guidance, lock-on |
| `js/skylayers.js` | Sky Finder layers: constellation pictures, clouds, wind, rain |
| `js/weather.js` | Hourly cloud, wind and rain forecast for the layers (Open-Meteo), cached with an offline fallback |
| `js/earth.js` | Places on Earth as targets: great-circle distance and bearing, place search, tropical cyclones (GDACS) |
| `js/data/places.js` | Built-in landmarks and cities |
| `js/data/figures.js` | Constellation artwork, drawn in each constellation's own flat frame |
| `js/views.js` | Page markup and page metadata (shared by the app and the page builder) |
| `js/app.js` | Navigation and everything interactive |
| `js/data/highlights.js` | Chapters and the "take a closer look" sections |
| `js/data/photos.js` | Photo for every object, with credit and licence |
| `template.html`, `scripts/build-pages.mjs` | Page template and the pre-renderer (writes `index.html`, `object/`, `sector/`, …) |
| `js/art.js` | Procedural illustrations (so everything looks good offline) |
| `js/media.js` | Encyclopedia extracts and "save for offline" |
| `js/store.js` | Progress, XP, ranks, settings (stored on the device) |
| `sw.js` | Service worker for offline use (web version) |
| `android/`, `ios/` | Native app projects; `capacitor.config.json` configures them |
| `assets/`, `store/` | Icon/splash artwork and app-store screenshots |
| `privacy.html` | Privacy policy (required by the stores) |

### Accuracy

Planet positions use JPL's approximate Keplerian elements; dwarf planets use osculating elements from the JPL Small-Body Database. Comets use osculating elements from JPL Horizons, and the ISS uses SGP4 with orbit data from CelesTrak, refreshed automatically when online. The test suite compares 19 solar-system bodies and the ISS with JPL Horizons. The Moon is within 0.5°, the ISS within 1° and everything else within 0.25°, which is far better than a phone compass (typically ±5°). The Sky Finder has a one-tap calibration ("It's right here") and a compass nudge in its settings.

### Adding content

Add an object to `OBJECTS` in `js/data/catalog.js` and list its id in a sector's `items`. Give it `pos: { ra, dec }` (J2000 degrees) or `pos: { body }` and it automatically appears in the Sky Finder, the Library and the journey. Add its photo to `js/data/photos.js` and its highlights to `js/data/highlights.js`, then run `npm run pages`.

