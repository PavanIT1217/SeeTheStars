// Guided sky tours: the Sky Finder points you from one thing to the next and tells a little story at each stop.
// `key` is anything the Sky Finder can target: a journey object id, `star:<name>` (looked up by name),
// `con-<IAU abbreviation>` or `m-<Messier number>`. `best` says when the tour works best (shown in the list).
export const TOURS = [
  {
    id: 'north-star', title: 'Find the North Star', emoji: '🧭', best: 'All year · northern hemisphere',
    intro: 'Sailors used these stars to find their way home. Now you can too.',
    stops: [
      { key: 'ursamajor', say: 'Start with the Big Dipper – seven bright stars shaped like a giant saucepan. It is part of the Great Bear.' },
      { key: 'star:Dubhe', say: 'These are the two “pointer stars” at the end of the pan. Merak is at the bottom, Dubhe at the top.' },
      { key: 'polaris', say: 'Follow the pointers about five times their distance and you reach Polaris, the North Star. It hardly moves all night – the whole sky turns around it.' },
      { key: 'cassiopeia', say: 'On the other side of Polaris is Cassiopeia, the Queen – a big W or M of five stars.' },
    ],
  },
  {
    id: 'orion', title: 'Orion and the winter giants', emoji: '🏹', best: 'December to March evenings',
    intro: 'The brightest stars of the year, all around one famous hunter.',
    stops: [
      { key: 'orion', say: 'Find Orion the Hunter: three stars in a neat row make his belt.' },
      { key: 'betelgeuse', say: 'His shoulder is Betelgeuse, an orange supergiant so big it would swallow Mars’ orbit. One day it will explode.' },
      { key: 'rigel', say: 'His knee is Rigel, a blue-white giant much hotter than our Sun.' },
      { key: 'orionnebula', say: 'Below the belt hangs his sword. The fuzzy middle “star” is the Orion Nebula, where new stars are being born right now.' },
      { key: 'sirius', say: 'Follow the belt down and to the left to Sirius, the brightest star in the whole night sky.' },
      { key: 'star:Aldebaran', say: 'Follow the belt the other way to Aldebaran, the orange eye of Taurus the Bull.' },
      { key: 'pleiades', say: 'A little further is a tiny cluster of stars: the Pleiades, or Seven Sisters. How many can you count?' },
    ],
  },
  {
    id: 'summer-triangle', title: 'The Summer Triangle', emoji: '🔺', best: 'June to October evenings',
    intro: 'Three bright stars make a giant triangle, with the Milky Way flowing through it.',
    stops: [
      { key: 'vega', say: 'Start with Vega, the brightest star high overhead on summer evenings. It is blue-white and about 25 light-years away.' },
      { key: 'star:Deneb', say: 'Deneb is the second corner. It looks fainter only because it is incredibly far away – it is one of the most powerful stars we can see.' },
      { key: 'star:Altair', say: 'Altair makes the third corner. It spins so fast it is squashed into an egg shape.' },
      { key: 'cygnus', say: 'Deneb is the tail of Cygnus the Swan, flying down the Milky Way with its wings spread wide.' },
      { key: 'ringnebula', say: 'Between Vega and its neighbours hides the Ring Nebula – the glowing shell of a dying star. You need a telescope for this one.' },
    ],
  },
  {
    id: 'southern-cross', title: 'The Southern Cross', emoji: '✝️', best: 'March to July · southern hemisphere',
    intro: 'The most famous stars of the southern sky – they are even on flags.',
    stops: [
      { key: 'crux', say: 'Find Crux, the Southern Cross: four bright stars in a small kite shape.' },
      { key: 'star:Rigil Kentaurus', say: 'Next to it are two “pointer” stars. The brighter one is Alpha Centauri, the closest star system to the Sun.' },
      { key: 'proxima', say: 'A tiny red star in that system, Proxima Centauri, is the nearest star of all – just over four light-years away.' },
      { key: 'lmc', say: 'On a dark night, look for two fuzzy clouds: the Magellanic Clouds, small galaxies orbiting our Milky Way.' },
    ],
  },
  {
    id: 'scorpion', title: 'The Scorpion and the heart of the galaxy', emoji: '🦂', best: 'May to August evenings',
    intro: 'Look towards the centre of the Milky Way, where a giant black hole hides.',
    stops: [
      { key: 'scorpius', say: 'Scorpius really looks like a scorpion, with a long curling tail.' },
      { key: 'star:Antares', say: 'Its red heart is Antares – “rival of Mars” – a red supergiant star.' },
      { key: 'con-Sgr', say: 'Next door is Sagittarius. Its brightest stars look like a teapot, with the Milky Way rising like steam from the spout.' },
      { key: 'sgra', say: 'Just past the spout lies the centre of our galaxy and its giant black hole, Sagittarius A*, 26,000 light-years away.' },
      { key: 'm-8', say: 'Above the teapot is the Lagoon Nebula, a star nursery you can glimpse with binoculars.' },
    ],
  },
  {
    id: 'autumn-galaxies', title: 'Galaxies far, far away', emoji: '🌌', best: 'September to January evenings',
    intro: 'See light that left its galaxy millions of years ago.',
    stops: [
      { key: 'con-Peg', say: 'Find the Great Square of Pegasus – four stars making a big box.' },
      { key: 'cassiopeia', say: 'Cassiopeia’s W points the way down towards Andromeda.' },
      { key: 'andromeda', say: 'The Andromeda Galaxy: the most distant thing you can see with your own eyes. Its light set off 2.5 million years ago.' },
      { key: 'triangulum', say: 'Close by is the Triangulum Galaxy, a smaller neighbour. You need a very dark sky to spot it.' },
    ],
  },
];
