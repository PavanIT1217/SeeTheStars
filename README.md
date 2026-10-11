# See the Stars

A journey through the universe for curious kids and students, with a **Sky Finder** that uses your phone's camera, compass and motion sensors to show *where* everything is right now, even when it's on the other side of the Earth.

## What's inside

- **The Journey:** 10 sectors and 49 objects, explored in order so each step builds on the last:
  Home Base → Rocky Worlds → Giants → Dwarf Planets → Stars → Constellations → Star Nurseries & Graveyards → Pulsars & Black Holes → Galaxies → The Whole Universe.
- **Every object page has:** live data (distance right now, light travel time, where it is in your sky), a *time machine* (what was happening on Earth when its light set off), a discovery timeline, a mind-blowing fact, a "wonder" question, and how to see it yourself. Real photos and encyclopedia extracts are loaded from Wikipedia.
- **Sky Finder:** pick any target, hold up your phone, and follow the arrow until it says *LOCKED ON*. Draws constellation figures, bright stars, the horizon and compass points over the live camera view. Without motion sensors (e.g. on a laptop), drag the sky to explore.
- **Motivation:** XP, ranks (Stargazer Cadet → Cosmic Explorer), sector challenges (quizzes) and badges, plus a reward for every object you physically point at.
- **Offline:** it's an installable app (PWA). Lessons, quizzes, artwork and the Sky Finder always work offline. Photos and extracts are downloaded only for the objects or sectors you choose to save (Saved tab).

## Run it

No build step and no dependencies:

```bash
npm start           # serves on http://localhost:8080
npm test            # checks the astronomy engine against NASA JPL Horizons
```

The camera and motion sensors only work over **HTTPS** (or `localhost`). To try it on a phone, deploy to any static host. GitHub Pages works: Settings → Pages → deploy from the default branch. Then open the site on the phone and use "Add to Home Screen".

## Project layout

| Path | What it does |
|---|---|
| `js/data/catalog.js` | All learning content: sectors, objects, quizzes, constellation figures |
| `js/astro.js` | Astronomy engine: planet/dwarf-planet/Moon/Sun positions, alt/az, rise/set |
| `js/sky.js` | Sky Finder: sensors, camera, projection, guidance, lock-on |
| `js/app.js` | Screens and navigation |
| `js/art.js` | Procedural illustrations (so everything looks good offline) |
| `js/media.js` | Wikipedia photos/extracts and "save for offline" |
| `js/store.js` | Progress, XP, ranks, settings (stored on the device) |
| `sw.js` | Service worker for offline use |

### Accuracy

Planet positions use JPL's approximate Keplerian elements; dwarf planets use osculating elements from the JPL Small-Body Database. The test suite compares all 14 solar-system bodies with JPL Horizons. The Moon is within 0.5° and everything else within 0.25°, which is far better than a phone compass (typically ±5°). The Sky Finder has a one-tap calibration ("It's right here") and a compass nudge in its settings.

### Adding content

Add an object to `OBJECTS` in `js/data/catalog.js` and list its id in a sector's `items`. Give it `pos: { ra, dec }` (J2000 degrees) or `pos: { body }` and it automatically appears in the Sky Finder, the Library and the journey.

## Going native later

The app is plain HTML/JS, so it can be wrapped with [Capacitor](https://capacitorjs.com/) to publish to the Play Store and App Store without a rewrite.
