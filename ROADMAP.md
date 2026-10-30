# See the Stars – Roadmap

Benchmarked against **Night Sky** (iCandi Apps) and **Sky Guide** (Fifth Star Labs), October 2026.

**Positioning:** we will not out-catalog the big sky atlases. See the Stars is *the guided space curriculum for kids and students that also works under the real sky*. Close the table-stakes gaps, then double down on learning.

## Benchmark

| Area | See the Stars (today) | Night Sky | Sky Guide |
|---|---|---|---|
| Platforms | Web/PWA, Android, iOS | iOS (+Watch, Vision Pro), Android | iOS only (+Watch) |
| Star catalog | 17 guide stars | Thousands+ | Millions (Pro) |
| Constellations | 6 figures | 88 | 88 + artwork |
| AR pointing | Yes, with lock-on | Yes | Yes |
| Time travel | No | Yes | Yes |
| Satellites | ISS only | Many + alerts | ISS & others + alerts |
| Alerts | No | Yes | Yes |
| Red night mode | No | Yes | Yes |
| Moon phase / rise-set | Position only | Yes | Yes |
| Weather / sky quality | No | Yes (Pro) | Partial |
| Widgets / Watch | No | Yes | Yes |
| Structured learning path | **Yes** – 12 sectors, quizzes, XP | No | No |
| Kid-first design | **Yes** – Explorer/Scientist views | No | No |
| Free web + SEO pages | **Yes** | No | No |
| Tested accuracy | **Yes** – vs JPL Horizons | Not public | Not public |

## Phase 1 – Sky parity ✅ (done 2026-10-30)
1. Star catalog: 5,044 stars to magnitude 6 (d3-celestial), rendered by magnitude and colour.
2. All 88 constellation figures + boundaries, zoom-dependent labels.
3. Red night mode.
4. Moon phase, illumination, rise/set on home and Moon pages.
5. Drag view as a first-class sky chart: zoom, tap-to-identify, search.

## Phase 2 – Retention ✅ (done 2026-10-30)
6. Time travel slider and play in the Sky Finder.
7. Local notifications: ISS passes, meteor showers, Moon phases, conjunctions, tonight's challenge.
8. "Tonight" page: the 3–5 best things to see now, linked to journey and Sky Finder.
9. More satellites: Tiangong and Hubble via the existing SGP4 code. *Starlink trains deferred: CelesTrak has no small feed of fresh launches, and the full Starlink list (~1.6 MB) is too heavy for a kids' app.*
10. Optional grown-up accounts (Google; Apple on iPhone) behind a parental gate, syncing progress via Firebase (`seethestars-app`).

## Phase 3 – Learning moat ✅ (done 2026-10-30)
11. Guided sky tours: six seasonal tours plus a “Tonight’s tour” built for where you are; read aloud where the device can speak.
12. Observing log (every real-sky lock-on) and nine quests worked out from it, with XP.
13. Classroom mode: teacher class codes and roster (nicknames and counts only, students join anonymously), printable worksheets for all 12 chapters.
14. Hindi and Spanish for the interface, planet names and all 88 constellations. *Still English: the 61 lesson texts, quizzes, tour stories and Tonight's generated sentences – needs a translator's review.*
15. Content: all 110 Messier objects in the Sky Finder and search; meteor showers in Tonight and reminders (Phase 2). *Eclipses deferred: dates and visibility need a verified source before they go in a kids' app.*

## Phase 4 – Platform and business ✅ (done 2026-10-30)
16. Home-screen widgets on Android and iOS (WidgetKit): tonight's Moon, worked out on the widget itself, plus the best sight and the next bright pass from the app. *Watch app deferred: little value for a kids' audience compared with its cost.*
17. Stargazing conditions score out of 10 on the Tonight page (Open-Meteo cloud cover and visibility, plus moonlight).
18. Pro gate built (`js/pro.js`: tours, classroom, deep catalog) but **unlocked for everyone**; no in-app purchases yet.
19. Child-privacy and store compliance: [docs/compliance.md](docs/compliance.md) with Data safety / App Privacy answers, category advice and open items; privacy policy updated.

## Success metrics
Week-1 retention, lock-ons per week, sectors completed, organic search traffic to object pages.
