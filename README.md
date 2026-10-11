# See the Stars

**Live:** https://seethestars.webappslab.com

A journey through the universe for curious kids and students, with a **Sky Finder** that uses your phone's camera, compass and motion sensors to show *where* everything is right now, even when it's on the other side of the Earth.

## What's inside

- **The Journey:** 12 sectors and 61 objects, explored in order so each step builds on the last:
  Home Base (incl. the ISS) → Rocky Worlds → Giants → Dwarf Planets → Comets & Space Visitors → Stars → Other Worlds (exoplanets) → Constellations → Star Nurseries & Graveyards → Pulsars & Black Holes → Galaxies → The Whole Universe.
- **Every object page has:** live data (distance right now, light travel time, where it is in your sky), a *time machine* (what was happening on Earth when its light set off), a discovery timeline, a mind-blowing fact, a "wonder" question, and how to see it yourself. Real photos and encyclopedia extracts are loaded from Wikipedia.
- **ISS tracking:** live position from current orbit data, and predicted times when you can see it pass over with your own eyes.
- **Sky Finder:** pick any target, hold up your phone, and follow the arrow until it says *LOCKED ON*. Draws constellation figures, bright stars, the horizon and compass points over the live camera view. Without motion sensors (e.g. on a laptop), drag the sky to explore.
- **Motivation:** XP, ranks (Stargazer Cadet → Cosmic Explorer), sector challenges (quizzes) and badges, plus a reward for every object you physically point at.
- **Offline:** it's an installable app (PWA). Lessons, quizzes, artwork and the Sky Finder always work offline. Photos and extracts are downloaded only for the objects or sectors you choose to save (Saved tab).

## Mobile apps

The `android/` and `ios/` folders are native app projects (built with [Capacitor](https://capacitorjs.com/)) for Google Play and the App Store. Every push to GitHub runs the tests, builds an installable Android test APK and compiles the iOS app (see the **Actions** tab). Step-by-step store publishing, including accounts, signing, store text and screenshots in `store/`, is in **[PUBLISHING.md](PUBLISHING.md)**.

## Run it

No build step and no dependencies:

```bash
npm start           # serves on http://localhost:8080
npm test            # checks planets, comets and the ISS against NASA JPL Horizons
npm run sync        # copy the web app into the Android/iOS projects
```

The camera and motion sensors only work over **HTTPS** (or `localhost`). The live site, **https://seethestars.webappslab.com**, is deployed by GitHub Pages from `master`. Open it on a phone and use "Add to Home Screen" to install it.

## Project layout

| Path | What it does |
|---|---|
| `js/data/catalog.js` | All learning content: sectors, objects, quizzes, constellation figures |
| `js/astro.js` | Astronomy engine: planets, dwarf planets, comets (incl. interstellar), Moon, Sun; alt/az, rise/set |
| `js/iss.js` | ISS tracking (SGP4 via bundled [satellite.js](https://github.com/shashwatak/satellite-js), MIT) and pass predictions |
| `js/sky.js` | Sky Finder: sensors, camera, projection, guidance, lock-on |
| `js/app.js` | Screens and navigation |
| `js/art.js` | Procedural illustrations (so everything looks good offline) |
| `js/media.js` | Wikipedia photos/extracts and "save for offline" |
| `js/store.js` | Progress, XP, ranks, settings (stored on the device) |
| `sw.js` | Service worker for offline use (web version) |
| `android/`, `ios/` | Native app projects; `capacitor.config.json` configures them |
| `assets/`, `store/` | Icon/splash artwork and app-store screenshots |
| `privacy.html` | Privacy policy (required by the stores) |

### Accuracy

Planet positions use JPL's approximate Keplerian elements; dwarf planets use osculating elements from the JPL Small-Body Database. Comets use osculating elements from JPL Horizons, and the ISS uses SGP4 with orbit data from CelesTrak, refreshed automatically when online. The test suite compares 19 solar-system bodies and the ISS with JPL Horizons. The Moon is within 0.5°, the ISS within 1° and everything else within 0.25°, which is far better than a phone compass (typically ±5°). The Sky Finder has a one-tap calibration ("It's right here") and a compass nudge in its settings.

### Adding content

Add an object to `OBJECTS` in `js/data/catalog.js` and list its id in a sector's `items`. Give it `pos: { ra, dec }` (J2000 degrees) or `pos: { body }` and it automatically appears in the Sky Finder, the Library and the journey.

