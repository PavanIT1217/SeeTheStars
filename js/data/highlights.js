// Deeper “did you know” sections for every object, plus the four chapters that group the sectors
// into a journey that zooms outward: Solar System → stars → star life and death → galaxies.

export const CHAPTERS = [
  {
    "title": "Our Solar System",
    "scale": "From under your feet to light-hours away",
    "intro": "Start right here at home. Meet the Sun’s family – rocky worlds, giant planets, icy dwarfs and comets – all close enough for spacecraft to visit.",
    "sectors": [
      "home",
      "rocky",
      "giants",
      "dwarfs",
      "comets"
    ]
  },
  {
    "title": "The Stars",
    "scale": "A few to thousands of light-years away",
    "intro": "Leave the Sun behind and travel to other suns. Discover glittering stars, the pictures people drew between them and alien worlds orbiting far-off stars.",
    "sectors": [
      "stars",
      "exoplanets",
      "constellations"
    ]
  },
  {
    "title": "Life and Death of Stars",
    "scale": "Hundreds to millions of light-years away",
    "intro": "Stars are born, grow old and die, just like living things. Explore glowing star nurseries, dazzling explosions and the strange, crushed objects stars leave behind.",
    "sectors": [
      "lifecycle",
      "extreme"
    ]
  },
  {
    "title": "Galaxies and Beyond",
    "scale": "Thousands to billions of light-years away",
    "intro": "Zoom out until whole galaxies look like specks of dust. Then travel back in time to the Big Bang and the mysteries scientists are still trying to solve.",
    "sectors": [
      "galaxies",
      "universe"
    ]
  }
];

export const HIGHLIGHTS = {
  earth: [
    {"icon":"🍑","title":"A planet in layers","text":"Earth is built in layers: a thin rocky crust, a thick hot mantle that flows very slowly, and a core of iron and nickel. Compared with the whole planet, the crust is thinner than the skin on an apple, and the solid inner core is about as hot as the surface of the Sun."},
    {"icon":"🧲","title":"An invisible shield","text":"Deep down, liquid iron swirls around Earth’s inner core and turns the planet into a giant magnet. This magnetic field makes your compass point north and pushes away most of the charged particles streaming from the Sun. The few that slip in near the poles make the sky glow as the northern and southern lights."},
    {"icon":"🌱","title":"Air made by life","text":"The air you breathe is about 78% nitrogen and 21% oxygen, and most of that oxygen was made by living things. Tiny ocean microbes began filling the sky with it more than 2 billion years ago. Today, microscopic ocean plankton still make roughly half of the oxygen on Earth."},
  ],
  iss: [
    {"icon":"🪂","title":"Falling all the time","text":"At the height of the ISS, gravity is still about 90% as strong as on the ground. Astronauts float because the station and everyone inside it are falling around Earth together, moving sideways so fast that they keep missing the ground. Sleeping means zipping into a sleeping bag tied to the wall."},
    {"icon":"💧","title":"Recycling every drop","text":"Water is too heavy to keep sending up by rocket, so the station recycles it. Machines collect moisture from the air, sweat and even urine, and clean it into fresh drinking water – about 98% of it is reused. As astronauts like to say, today’s coffee is tomorrow’s coffee."},
    {"icon":"🏋️","title":"Staying strong in space","text":"Without gravity pulling on them, muscles and bones grow weaker, a bit like a leg in a plaster cast. So astronauts exercise for about two hours every day, strapped to a treadmill, a bike and a special weight machine. Studying their bodies helps doctors on Earth understand ageing and bone loss."},
  ],
  moon: [
    {"icon":"🌑","title":"Seas without water","text":"The dark patches that make the “face” in the Moon are called maria, Latin for “seas”. Early astronomers thought they might be oceans, but they are huge plains of hardened lava that flooded giant craters billions of years ago. The bright parts are older, rugged highlands packed with craters."},
    {"icon":"👣","title":"Footprints that stay","text":"The Moon has no wind or rain to wipe things away, so the astronauts’ footprints are probably still there. Moon dust is not soft like sand – it is made of tiny sharp, jagged grains that cling to everything. Apollo astronauts found it scratched their visors and smelled like spent gunpowder."},
    {"icon":"🌗","title":"A day two weeks long","text":"On the Moon, the Sun stays up for about two weeks, followed by two weeks of night. With no air to spread light or hold heat, the sky is black even at noon. The ground swings from hotter than boiling water in sunlight to about −130 °C in the dark."},
  ],
  sun: [
    {"icon":"🔥","title":"Not a campfire","text":"The Sun isn’t burning like a fire – there is no oxygen to burn. It is made of about three-quarters hydrogen and one-quarter helium, so hot that the gas becomes glowing plasma. Every second, its core turns about 4 million tonnes of matter into pure energy, and it has enough fuel left for billions of years."},
    {"icon":"🌀","title":"Spots and storms","text":"Sunspots are darker patches where tangled magnetic fields hold back the heat, and many are bigger than Earth. Their numbers rise and fall in a cycle of about 11 years. Near the busy peak, the Sun hurls out flares and giant clouds of gas that can light up auroras on Earth."},
    {"icon":"💨","title":"A wind from the Sun","text":"The Sun constantly blows a stream of charged particles into space called the solar wind, racing outward at over a million kilometres per hour. It inflates an enormous bubble around all the planets, called the heliosphere. Voyager 1, launched in 1977, crossed its edge in 2012 and entered interstellar space."},
  ],
  mercury: [
    {"icon":"⚙️","title":"A giant iron heart","text":"Mercury is mostly metal inside. Its iron core stretches across about 85% of the planet’s width, like a peach with a stone so big there is hardly any fruit left. That makes little Mercury the second-densest planet, after Earth."},
    {"icon":"🍎","title":"A shrinking planet","text":"As Mercury’s huge core slowly cooled over billions of years, the whole planet shrank. Its rocky skin wrinkled like the peel of a drying apple, creating long cliffs that run for hundreds of kilometres and rise more than a kilometre high. Scientists spotted these wrinkles in spacecraft photos."},
    {"icon":"🌞","title":"A giant Sun overhead","text":"If you stood on Mercury, the Sun would look two to three times wider than it does from Earth, blazing in a pitch-black sky. Reaching Mercury is surprisingly hard: spacecraft speed up as they fall towards the Sun, so they need years of looping fly-bys to slow down enough to stay."},
  ],
  venus: [
    {"icon":"🌊","title":"Crushing air pressure","text":"The air on Venus is so thick that standing on the surface would feel like being nearly a kilometre deep in Earth’s ocean – about 90 times the pressure we live in. The Soviet Venera landers that reached the ground survived for two hours at most before the heat and pressure destroyed them."},
    {"icon":"📡","title":"Seeing through clouds","text":"No camera can see Venus’ surface from space because the clouds never part. Instead, spacecraft like NASA’s Magellan used radar, bouncing radio waves off the ground to map it. They revealed a world covered in lava plains and more large volcanoes than any other planet."},
    {"icon":"🌪️","title":"Racing clouds","text":"Venus itself turns incredibly slowly, but its upper clouds whip around the whole planet in only about four Earth days. Their winds reach around 360 km/h – faster than the strongest hurricanes on Earth. Scientists call this “super-rotation”, and they are still working out exactly what powers it."},
  ],
  mars: [
    {"icon":"🏜️","title":"A canyon across a continent","text":"Mars has a giant canyon system called Valles Marineris, about 4,000 km long and up to 7 km deep. On Earth it would stretch right across the United States. Next to it, the Grand Canyon would look like a small scratch."},
    {"icon":"🌪️","title":"Planet-wide dust storms","text":"Martian air is very thin – less than 1% as thick as Earth’s – and mostly carbon dioxide. Even so, dust storms sometimes grow until they wrap the entire planet for weeks. In 2018 one blocked the sunlight that powered the Opportunity rover, ending its mission after nearly 15 years."},
    {"icon":"☄️","title":"Pieces of Mars on Earth","text":"Some rocks found on Earth actually come from Mars. Long ago, big impacts blasted them off the Martian surface, and they drifted through space until they fell here as meteorites. Scientists know where they came from because tiny bubbles of gas trapped inside match the Martian air measured by spacecraft."},
  ],
  jupiter: [
    {"icon":"🧲","title":"An ocean of metal","text":"Deep inside Jupiter, the crushing pressure squeezes hydrogen into a liquid that conducts electricity like metal. As the planet spins, this sea of liquid metal creates the strongest magnetic field of any planet. If we could see it from Earth, it would look bigger than the full Moon in our sky."},
    {"icon":"🌕","title":"Bigger than a planet","text":"Ganymede, Jupiter’s largest moon, is the biggest moon in the Solar System – wider than the planet Mercury. It is the only moon known to have its own magnetic field, and scientists think a salty ocean is hidden beneath its icy crust. ESA’s JUICE spacecraft is on its way to orbit it."},
    {"icon":"🪂","title":"No ground to land on","text":"Jupiter has no solid surface. A probe falling in would sink through ever thicker, hotter gas until it was crushed. In 1995 NASA’s Galileo spacecraft dropped a small probe into the clouds, and it radioed back measurements for about an hour before it went silent."},
  ],
  saturn: [
    {"icon":"⬡","title":"A six-sided storm","text":"Around Saturn’s north pole, a jet stream of fast winds flows in an almost perfect hexagon. Each of its six sides is longer than Earth is wide. Nothing like it exists on any other planet we know, and scientists use computer models and lab experiments with spinning fluids to understand how it keeps its shape."},
    {"icon":"⛲","title":"A moon that sprays water","text":"The small icy moon Enceladus shoots tall jets of water vapour and ice from cracks near its south pole. The water comes from an ocean hidden under the ice. The Cassini spacecraft flew straight through the spray and found salt and carbon-based molecules, and some of the spray feeds one of Saturn’s rings."},
    {"icon":"🚁","title":"Flying on Titan","text":"Titan, Saturn’s biggest moon, has air thicker than Earth’s and gravity weaker than our Moon’s. A person there could strap on wings and fly by flapping their arms. NASA is preparing a drone-like lander called Dragonfly to hop between spots on Titan and study its chemistry in the 2030s."},
  ],
  uranus: [
    {"icon":"🧊","title":"What’s an ice giant?","text":"Uranus has no solid surface. Under its hydrogen and helium air lies a hot, dense, slushy layer of water, ammonia and methane – the “ices” that give ice giants their name – wrapped around a small rocky core. Its cloud tops are among the coldest places in the Solar System, dipping to about −224 °C."},
    {"icon":"🏔️","title":"A moon with giant cliffs","text":"Uranus’ moon Miranda looks like a patchwork quilt, with grooved, jumbled regions that seem stitched together. It has one of the tallest cliffs known in the Solar System, many kilometres high. With Miranda’s weak gravity, a rock dropped off the edge would take minutes to reach the bottom."},
    {"icon":"🔭","title":"Waiting for a visitor","text":"Only one spacecraft has ever visited Uranus, so scientists study it with telescopes. In 2023 the James Webb Space Telescope photographed its faint rings glowing in infrared light. US planetary scientists have chosen a Uranus orbiter and probe as their top choice for the next big flagship mission."},
  ],
  neptune: [
    {"icon":"🔥","title":"Warm from inside","text":"Neptune is about 30 times further from the Sun than Earth, yet it gives off more than twice as much heat as it receives from sunlight. That leftover heat from deep inside the planet helps stir up its clouds and storms. Uranus, its near-twin, gives off much less, and scientists are still puzzling over why."},
    {"icon":"💫","title":"Rings with lumps","text":"Neptune has thin, dark rings made of dust and ice. Its outermost ring is strange: instead of being smooth, it has bright clumpy arcs that stay bunched together. Astronomers named the arcs Liberté, Égalité and Fraternité, and the James Webb Space Telescope photographed the rings clearly in 2022."},
    {"icon":"📡","title":"A faraway twilight","text":"Sunlight on Neptune is about 900 times dimmer than on Earth, so noon there would feel like a gloomy evening – though still brighter than a moonlit night here. Radio signals take about four hours to travel there, so talking to a spacecraft would mean waiting more than eight hours for every reply."},
  ],
  ceres: [
    {"icon":"🏔️","title":"A lonely ice mountain","text":"Dawn found a strange mountain on Ceres called Ahuna Mons, standing about 4 km tall all by itself on a fairly flat plain. Scientists think it is a cryovolcano – a volcano that oozed a cold, salty mud of ice and brine instead of hot lava."},
    {"icon":"🪶","title":"Light as a feather","text":"Gravity on Ceres is only about 3% of Earth’s. A kid who weighs 40 kg at home would feel as light as a bag of sugar there, and a good jump could keep you in the air for a long time. You would still need to be careful not to bounce too far."},
    {"icon":"🧪","title":"Ingredients for life","text":"Dawn’s instruments detected carbon-rich organic material on Ceres’ surface, along with clays and salts that formed in water. Organics are not life, but they are some of the building blocks it uses. That makes Ceres an important place for learning how water worlds form."},
  ],
  pluto: [
    {"icon":"💃","title":"A dancing pair","text":"Pluto is smaller than our own Moon – only about two-thirds as wide. Its moon Charon is half Pluto’s width, so instead of Charon simply circling Pluto, the two swing around a point in the space between them, like dancers holding hands. They always keep the same faces turned towards each other."},
    {"icon":"🌆","title":"Noon like twilight","text":"Pluto is so far away that sunlight takes about five and a half hours to get there. At midday, the Sun is only as bright as Earth’s sky shortly after sunset. The ground is around −230 °C, cold enough to freeze the air we breathe solid."},
    {"icon":"🚀","title":"The long trip","text":"New Horizons was launched in 2006 at record speed, passing the Moon’s orbit in just nine hours. Even so, it took nine and a half years to reach Pluto. Because it was so far away, its radio messages were faint and slow, and sending all its pictures home took more than a year."},
  ],
  haumea: [
    {"icon":"💥","title":"A family from a crash","text":"Haumea has a family of smaller icy objects travelling on similar paths around the Sun. Scientists think they are pieces knocked off in a giant collision long ago – the same crash that may have set Haumea spinning so fast. It was the first family like this found in the Kuiper Belt."},
    {"icon":"🔦","title":"Reading a flicker","text":"From Earth, Haumea is just a faint dot, yet astronomers know its shape. As it spins, its brightness rises and falls: brighter when its long side faces us, dimmer when its narrow end does. Timing that flicker reveals both how fast it spins and how stretched it is."},
    {"icon":"🗓️","title":"A very long year","text":"Haumea takes about 284 Earth years to go once around the Sun. Its oval path carries it between roughly 35 and 51 times Earth’s distance from the Sun. Since it was found in 2004, it has travelled less than a tenth of the way around."},
  ],
  makemake: [
    {"icon":"⭐","title":"A star that blinked","text":"In 2011, Makemake passed in front of a faint star, and astronomers watched closely. The star vanished and reappeared suddenly instead of fading slowly, which showed that Makemake has little or no global atmosphere. That makes it different from Pluto, which wraps itself in thin haze."},
    {"icon":"⚖️","title":"Weighing with a moon","text":"Makemake’s small dark moon is a useful tool. By measuring how long a moon takes to circle its parent world and how far away it is, scientists can work out the parent’s mass. Once they pin down this moon’s orbit, they will be able to weigh Makemake."},
    {"icon":"🥶","title":"Far, far away","text":"Makemake is currently more than 50 times further from the Sun than Earth is, so sunlight takes around seven hours to reach it. Its surface is colder than −230 °C, so cold that methane – a gas on Earth – lies frozen on the ground like frost."},
  ],
  eris: [
    {"icon":"⚖️","title":"Weighed by its moon","text":"By timing how its moon Dysnomia circles it, astronomers measured that Eris is about 27% more massive than Pluto, even though the two are nearly the same width. That means Eris must be packed with more rock. Its discovery made scientists ask if it should be the tenth planet."},
    {"icon":"🪞","title":"Shiny as fresh snow","text":"Eris is one of the most reflective objects in the Solar System, bouncing back about 96% of the sunlight that hits it – whiter than fresh snow. Scientists think its thin air freezes into a fresh coat of frost on the ground while it is far from the Sun."},
    {"icon":"📐","title":"A tilted path","text":"Most planets circle the Sun on a flat plane, like marbles rolling on a table. Eris’ orbit is tipped by about 44°, and it swings from about 38 to 98 times Earth’s distance from the Sun. Being so far away and so far off that flat plane, where most searches looked, helped it stay hidden until 2005."},
  ],
  halley: [
    {"icon":"🪨","title":"Darker than coal","text":"Giotto’s pictures showed that Halley’s icy heart is wrapped in a crust darker than coal, reflecting only about 4% of the sunlight that hits it. Underneath lies ice mixed with dust. As the Sun warms the comet, jets of gas burst out through cracks and build its glowing head and tail."},
    {"icon":"🔄","title":"A wrong-way orbit","text":"Halley’s path around the Sun is a long, stretched-out oval. At its closest it swoops inside the orbit of Venus; at its farthest it drifts beyond Neptune, creeping along slowly. Strangest of all, it travels around the Sun in the opposite direction to all the planets."},
    {"icon":"💊","title":"Through the tail","text":"In 1910 Earth passed through the edge of Halley’s tail. Some newspapers warned of poisonous gas, and a few sellers even made money from “comet pills”. Nothing happened at all – a comet’s tail is so thin that it is far emptier than the air around you."},
  ],
  c67p: [
    {"icon":"🦆","title":"Two comets stuck together","text":"Why the duck shape? Scientists think 67P’s “head” and “body” were once two separate small comets that bumped together very gently, long ago, and stayed stuck. The narrow “neck” between them is where cliffs and cracks are found, and where many of its gas jets shoot out."},
    {"icon":"🧽","title":"Light and fluffy","text":"67P is more like a dusty snowball full of holes than a solid rock – about half as dense as water. Its gravity is so weak that a person would weigh about as much as a paperclip. One good jump could send you floating off into space, never to come back down."},
    {"icon":"👃","title":"A smelly comet","text":"Rosetta carried an instrument that “sniffed” the gas around 67P. It found hydrogen sulphide, which smells of rotten eggs, plus ammonia and other strong-smelling chemicals. Luckily nobody was there to notice – but these smells tell scientists exactly what the comet’s ice is made of."},
  ],
  halebopp: [
    {"icon":"🔭","title":"Spotted from afar","text":"When Hale–Bopp was discovered in 1995, it was still out beyond the orbit of Jupiter – much farther away than comets are usually found. Being visible from so far away was the first clue that its icy nucleus was enormous, several times wider than Halley’s."},
    {"icon":"✨","title":"A secret third tail","text":"Besides its famous dust and gas tails, Hale–Bopp had a faint third tail that nobody had seen on a comet before. It was made of sodium – the same element that makes old street lamps glow orange – and astronomers found it using special filters on their telescopes."},
    {"icon":"🪐","title":"A tug from Jupiter","text":"In 1996, on its way towards the Sun, Hale–Bopp passed fairly close to Jupiter. The giant planet’s gravity tugged on it and changed its path, shortening its trip around the Sun from more than 4,000 years to about 2,400. Planets can steer comets like this."},
  ],
  oumuamua: [
    {"icon":"⏱️","title":"A race against time","text":"ʻOumuamua was only spotted after it had already passed the Sun and was speeding away. Astronomers around the world rushed to point their biggest telescopes at it, but they had only a few weeks before it grew too faint to see. Everything we know comes from that short chase."},
    {"icon":"📏","title":"A shape from flickers","text":"No telescope could see ʻOumuamua as more than a dot of light. But that dot grew much brighter and dimmer every few hours as the object tumbled. That told scientists it was very stretched – either long like a cigar or flat like a pancake, and slightly reddish in colour."},
    {"icon":"🧭","title":"Coming from Vega’s way","text":"ʻOumuamua arrived from the direction of Vega, a bright star in the constellation Lyra. But it didn’t come from Vega itself: when ʻOumuamua was passing that part of the sky long ago, Vega wasn’t there yet. Its true home star is still a mystery."},
  ],
  atlas3i: [
    {"icon":"🚀","title":"A cosmic speed record","text":"3I/ATLAS entered our Solar System at about 58 kilometres every second – fast enough to cross from London to New York in under two minutes. It came from the direction of Sagittarius, towards the crowded centre of our Milky Way galaxy."},
    {"icon":"🧊","title":"Alien ice","text":"The James Webb Space Telescope found that the gas streaming from 3I/ATLAS is full of carbon dioxide – much more, compared with water, than in most comets from our own Solar System. Clues like this tell scientists about the cold place where it formed, around a star we will never see."},
    {"icon":"🌞","title":"Hiding behind the Sun","text":"When 3I/ATLAS made its closest pass by the Sun, it was on the far side of the Sun from Earth, so telescopes here could not watch. It never came near us: it always stayed more than 250 million kilometres from Earth, much farther away than the Sun."},
  ],
  sirius: [
    {"icon":"🔥","title":"A hot white star","text":"Sirius looks white because it is much hotter than our Sun: its surface is close to 10,000 °C, while the Sun’s is about 5,500 °C. It is also nearly twice as wide as the Sun. Hot stars like this use up their fuel much faster than the Sun does."},
    {"icon":"💃","title":"A 50-year dance","text":"Sirius and its tiny partner, Sirius B, circle each other once every 50 years. Sirius B used to be the bigger star, but it aged faster, swelled up and blew away its outer layers, leaving only its hot core. One day Sirius itself will end the same way."},
    {"icon":"🐕","title":"The dog days","text":"In ancient Greece and Rome, Sirius rose with the Sun in the hottest weeks of summer. People thought the Dog Star added its heat to the Sun’s, so they called that stretch of summer the “dog days” – a name some people still use today."},
  ],
  polaris: [
    {"icon":"🟡","title":"A real giant","text":"Polaris looks fairly ordinary because it is so far away – about 430 light-years. Up close it is a yellow supergiant, dozens of times wider than our Sun and more than a thousand times brighter. In fact it is only around the 50th brightest star in the night sky."},
    {"icon":"🎯","title":"Not quite on target","text":"Polaris is not exactly above Earth’s North Pole. It is slightly off to one side – a little more than the width of the full Moon – so it actually draws a very tiny circle in the sky each night. It will be at its closest to the pole around the year 2100."},
    {"icon":"📐","title":"A cosmic measuring tape","text":"Polaris belongs to a family of pulsing stars called Cepheids. In 1912, Henrietta Leavitt discovered that the slower a Cepheid pulses, the brighter it truly is. That lets astronomers work out how far away Cepheids are – even in other galaxies – and Polaris is the closest Cepheid of all."},
  ],
  betelgeuse: [
    {"icon":"🫧","title":"A bubbling surface","text":"Betelgeuse is so huge that big telescopes can see its surface as more than a dot. It isn’t a smooth ball: it is lumpy and changing, with a few gigantic bubbles of hot gas – each one bigger than our whole Sun – rising and sinking like soup boiling on a stove."},
    {"icon":"⏳","title":"Young but nearly done","text":"Betelgeuse is only about 10 million years old – the Sun is 4.6 billion years old. Big stars burn through their fuel incredibly fast, so even though Betelgeuse is young, it is already near the end of its life. The Sun will keep shining for billions of years more."},
    {"icon":"🧬","title":"Made of star stuff","text":"When Betelgeuse explodes, it will scatter carbon, oxygen, iron and other elements into space. Long ago, exploding stars did the same for the cloud that formed our Solar System. The iron in your blood and the calcium in your bones were made inside stars."},
  ],
  rigel: [
    {"icon":"🔵","title":"A blue giant furnace","text":"Rigel is about 20 times heavier than the Sun and roughly 75 times wider. Being so big and hot, it burns through its fuel at a furious rate. It is only about 8 million years old, but it is already running low – a star like the Sun lasts about a thousand times longer."},
    {"icon":"🧙","title":"Lighting up a witch","text":"Rigel is so bright that it lights up a faint cloud of dust far from it, nicknamed the Witch Head Nebula because its shape looks like a witch’s face in profile. The dust reflects Rigel’s blue light, a bit like fog glowing around a car’s headlights."},
    {"icon":"🏆","title":"Orion’s brightest star","text":"Astronomers often label each constellation’s brightest star “Alpha”. In Orion, that label went to Betelgeuse – yet Rigel, the “Beta” star, is usually the brighter of the two. Before it dies, Rigel will probably swell and cool into a red supergiant, much like Betelgeuse."},
  ],
  vega: [
    {"icon":"🌀","title":"A twelve-hour day","text":"Vega spins all the way round in about 12 and a half hours – our Sun takes nearly a month. The spin flings its middle outwards, so its equator bulges and is cooler and dimmer than its poles. From Earth we see Vega almost pole-on, like looking down at a spinning top."},
    {"icon":"🌱","title":"A young star","text":"Vega is only about 450 million years old – a tenth of the Sun’s age. It is about twice as heavy as the Sun, so it burns its fuel faster and will live only around a billion years in all. When dinosaurs walked on Earth, Vega was already shining."},
    {"icon":"💿","title":"A puzzling smooth disc","text":"Vega is circled by a wide disc of dust, a bit like a giant version of the icy belt beyond Neptune. When the Hubble and Webb telescopes looked closely, the disc turned out to be surprisingly smooth, with no clear gaps carved by big planets. Scientists are still puzzling over why."},
  ],
  proxima: [
    {"icon":"⚡","title":"A stormy little star","text":"Proxima Centauri is a flare star. Every so often a sudden blast of energy erupts from its surface, making it shine many times brighter for a few minutes. These flares send out strong ultraviolet light and X-rays – bad news for any planet hoping to keep a gentle atmosphere."},
    {"icon":"🌍","title":"A year of 11 days","text":"The planet Proxima b is a little heavier than Earth and circles its star in just 11 days. Seen from there, Proxima would look about three times wider than the Sun does from Earth, but glow a dim reddish colour. One side of the planet may always face the star."},
    {"icon":"🕯️","title":"A trillion-year candle","text":"Small red dwarfs like Proxima use their fuel extremely slowly. Our Sun will shine for about 10 billion years in total, but Proxima will keep glowing for trillions of years – far longer than the Universe has existed so far. No red dwarf has ever had time to die."},
  ],
  psr1257: [
    {"icon":"🌀","title":"A spinning city-sized star","text":"The pulsar at the centre of this system is the crushed core of a giant star. It is only about the size of a city, yet it weighs more than our Sun. It spins around about 160 times every second, sweeping beams of radio waves across space like a lighthouse."},
    {"icon":"🌑","title":"Dark, dangerous skies","text":"Standing on one of these planets would be nothing like Earth. There would be no warm sunshine, because the pulsar gives off very little visible light. Instead, the planets are blasted by powerful radiation and a fierce wind of tiny particles, making them very unlikely homes for life."},
    {"icon":"👻","title":"Spooky names","text":"In a public naming contest in 2015, this pulsar and its planets got suitably spooky names. The pulsar is Lich, an undead creature from fantasy stories, and its three planets are Draugr, Poltergeist and Phobetor – names from myths and ghost tales."},
  ],
  peg51b: [
    {"icon":"🎂","title":"A birthday every 4 days","text":"51 Pegasi b goes all the way round its star in just over four days, so a ten-year-old there would have had hundreds of birthdays. It orbits about seven times closer to its star than Mercury is to our Sun, so it is roasted by starlight all the time."},
    {"icon":"🧳","title":"A wandering giant","text":"Giant planets like Jupiter are thought to form far from their star, where it is cold enough for ice to gather. So most scientists think 51 Pegasi b was born much farther out and slowly drifted inwards. Finding it showed that planets can move around after they form."},
    {"icon":"🌊","title":"The start of a flood","text":"The star 51 Pegasi sways back and forth at about 200 kilometres per hour – the speed of a racing car – and astronomers measured that from 50 light-years away. Since this first find in 1995, more than 6,000 planets around other stars have been confirmed."},
  ],
  hd209458b: [
    {"icon":"🎈","title":"A puffed-up giant","text":"HD 209458 b is about 40% wider than Jupiter but weighs less. Fierce heat from its nearby star has puffed up its atmosphere like a soufflé in an oven. That makes it a very light, fluffy world for its size – less dense than any planet in our Solar System."},
    {"icon":"📉","title":"A tiny dip in light","text":"When the planet crosses its star, it blocks only about 1.5% of the starlight – like a moth flying in front of a distant streetlamp. Telescopes measure this tiny dip every three and a half days, which tells scientists how big the planet is and how it moves."},
    {"icon":"🌗","title":"Forever day, forever night","text":"Because it orbits so close, scientists think the planet is “locked” with the same side always facing its star, just as the Moon always shows Earth the same face. One side would have endless scorching daytime, while the other would sit in never-ending night."},
  ],
  trappist1: [
    {"icon":"🔴","title":"Barely bigger than Jupiter","text":"The star TRAPPIST-1 is only a little wider than Jupiter and less than a tenth as heavy as the Sun. Its surface is around 2,300 °C, so it glows a deep red and gives off much of its energy as invisible infrared light. It will keep shining for trillions of years."},
    {"icon":"🎵","title":"Planets in rhythm","text":"The seven planets go round their star in a neat pattern, a bit like musicians keeping a beat. For example, while one planet makes two orbits, its neighbour makes almost exactly three. Scientists think this chain of rhythms helps keep the crowded system stable."},
    {"icon":"🍺","title":"A name with a story","text":"TRAPPIST stands for “TRAnsiting Planets and PlanetesImals Small Telescope”, a robotic telescope run by Belgian astronomers. The name is also a nod to the monks of Belgium’s Trappist monasteries, famous for their beer – and the system’s planets got the same family name."},
  ],
  kepler186f: [
    {"icon":"🌅","title":"Noon like sunset","text":"Kepler-186f’s star is a red dwarf about half the size of the Sun. Standing on the planet at midday, its light would look about as bright as sunlight here an hour before sunset. Everything would be lit by a warm, orangey glow, all day long."},
    {"icon":"⚖️","title":"Size known, weight unknown","text":"Kepler measured the planet’s size from the tiny dip in starlight each time it passed in front of its star. But the star is too faint to measure its wobble, so we don’t know the planet’s mass. Without that, scientists can’t be certain it is made of rock like Earth."},
    {"icon":"🕰️","title":"Old light","text":"Kepler-186f is about 580 light-years away, so the light Kepler saw had been travelling for nearly six centuries. It set out in the 1400s, around the time the printing press was invented in Europe. We see this star system as it was back then, not as it is now."},
  ],
  k218b: [
    {"icon":"🧩","title":"The missing kind of planet","text":"Planets between the size of Earth and Neptune turn out to be among the most common in our galaxy – yet our Solar System has none. That makes K2-18 b a precious chance to study a kind of world we can’t visit at home and still don’t fully understand."},
    {"icon":"🧪","title":"A mystery recipe","text":"For its size, K2-18 b is too light to be solid rock like Earth, but too heavy to be mostly gas like Neptune. So it must be built from some mix of rock, water and gas. Scientists are still arguing about which recipe is right."},
    {"icon":"🔭","title":"Once every 33 days","text":"Webb can only sniff K2-18 b’s air when the planet passes in front of its star, which happens just once every 33 days and lasts a few hours. Each pass gives a little more starlight-filtered data, so scientists need many passes to be sure what they are seeing."},
  ],
  orion: [
    {"icon":"🔴","title":"Betelgeuse, the restless giant","text":"Betelgeuse is a red supergiant so huge that it would swallow Mars’s orbit if it sat where the Sun is. It is near the end of its life and will one day explode as a supernova – sometime in the next 100,000 years. In 2019–2020 it dimmed noticeably when it puffed out a cloud of dust."},
    {"icon":"📏","title":"A belt that isn’t flat","text":"The three belt stars – Alnitak, Alnilam and Mintaka – look like beads on one string, but they are not side by side. Alnilam, the middle one, lies much farther away than the other two. They only line up neatly from where we happen to stand."},
    {"icon":"🧭","title":"Orion the signpost","text":"Follow the belt down to the left and you reach Sirius, the brightest star in the night sky. Follow it up to the right and you find orange Aldebaran and then the Pleiades. Betelgeuse, Sirius and Procyon together make a big shape called the Winter Triangle."},
  ],
  ursamajor: [
    {"icon":"🌸","title":"The arc to Arcturus","text":"Follow the curve of the Dipper’s handle away from the bowl and you “arc to Arcturus”, a bright orange star. Keep the same curve going and you can “speed on to Spica”, a blue-white star. One star pattern helps you find two more."},
    {"icon":"🌌","title":"Galaxies in the Bear","text":"Point binoculars just beyond the bowl and you may spot two faint smudges: the galaxies M81 and M82, millions of light-years away. M82 is a “starburst” galaxy, making new stars many times faster than our Milky Way. A tug from its bigger neighbour M81 helped set it off."},
    {"icon":"👀","title":"Six stars, not two","text":"Mizar and Alcor look like a pair, but telescopes reveal much more. Mizar splits into two stars, and each of those is itself a tight pair. Alcor has a small partner too – so this little spot in the handle holds at least six stars."},
  ],
  cassiopeia: [
    {"icon":"👑","title":"The queen’s punishment","text":"In Greek myth Cassiopeia’s boasting angered the sea god Poseidon, who sent a monster to attack her kingdom. Her daughter Andromeda was chained to a rock until the hero Perseus rescued her. As punishment, the queen circles the pole on her throne, spending half the night upside down."},
    {"icon":"💥","title":"Cassiopeia A up close","text":"Cassiopeia A is one of the youngest remains of an exploded star in our galaxy. Its light reached Earth around 1680, yet nobody clearly recorded it – thick dust probably hid the flash. X-ray telescopes show clouds of silicon, sulphur and iron flung out from the star’s insides."},
    {"icon":"🧭","title":"Hop to Andromeda","text":"The deeper “V” of Cassiopeia’s W points roughly towards the Andromeda Galaxy. On a dark night it looks like a faint oval smudge to the naked eye. Its light set off about 2.5 million years ago, making it one of the most distant things you can see without a telescope."},
  ],
  scorpius: [
    {"icon":"💙","title":"A heart with a partner","text":"Red Antares has a hidden companion: a smaller, hotter blue-white star orbiting it. It is hard to see because Antares outshines it, but a good telescope on a steady night can show it. Antares itself is so massive that it will probably end its life as a supernova."},
    {"icon":"✨","title":"An ancient star city","text":"Just beside Antares sits M4, a globular cluster – a tight ball of tens of thousands of stars. It is one of the closest clusters of its kind to Earth, and its stars are more than 10 billion years old. In binoculars it looks like a soft, round glow."},
    {"icon":"📡","title":"The X-ray surprise","text":"In 1962 a rocket carrying X-ray detectors found Scorpius X-1, the first X-ray source discovered beyond the Solar System. It is a neutron star pulling gas from a partner star. Apart from the Sun, it is the brightest steady X-ray source in our sky."},
  ],
  crux: [
    {"icon":"🔭","title":"Acrux is a team","text":"To the eye, Acrux at the foot of the cross looks like one star. A small telescope splits it into two blue-white stars, and one of those is itself a close pair. Each of them is much hotter and brighter than our Sun."},
    {"icon":"💎","title":"The Jewel Box","text":"Next to the star Mimosa lies a young star cluster called the Jewel Box. In the 1830s John Herschel described it as a casket of coloured precious stones. Through a telescope you see dozens of blue-white stars with one striking orange-red star among them."},
    {"icon":"👉","title":"Pointers and false cross","text":"A bigger, dimmer “False Cross” nearby often fools beginners. To be sure you have the real one, find the two bright Pointer stars, Alpha and Beta Centauri, which point straight at it. Alpha Centauri is the nearest star system to us, about 4.4 light-years away."},
  ],
  cygnus: [
    {"icon":"💡","title":"Deneb, the far-off beacon","text":"Vega and Altair, the other two stars of the Summer Triangle, are both within about 25 light-years of us. Deneb is well over a thousand light-years away, yet it still shines brightly in our sky. To manage that, it must shine tens of thousands of times more strongly than the Sun."},
    {"icon":"📐","title":"The first star measured","text":"In 1838 Friedrich Bessel measured the distance to a faint star in Cygnus called 61 Cygni – the first star other than the Sun ever measured. He tracked how it shifts slightly as Earth moves around the Sun. It turned out to be about 11 light-years away."},
    {"icon":"🗺️","title":"A continent in the sky","text":"Near Deneb glows the North America Nebula, a cloud of gas shaped remarkably like the continent, with dark dust forming its “Gulf of Mexico”. Running through Cygnus is the Great Rift, a lane of dark dust that seems to split the Milky Way in two."},
  ],
  orionnebula: [
    {"icon":"💠","title":"The Trapezium’s glow","text":"At the nebula’s heart, a small telescope shows four bright stars in a tight little shape called the Trapezium. These young stars are fiercely hot. Their ultraviolet light makes the surrounding gas glow and has carved out a hollow in the cloud, like a cave lit from inside."},
    {"icon":"🧊","title":"Tip of the cloud","text":"The glowing part is only a bright blister on the near side of a far bigger, cold, dark cloud. Hidden behind it, more stars are forming in thick dust. Infrared telescopes like Webb can see through that dust to find them."},
    {"icon":"☀️","title":"Our Sun’s baby pictures","text":"Our Sun was probably born in a crowded star nursery much like this one, about 4.6 billion years ago. Studying the Orion Nebula helps scientists picture how our own Solar System began. Its pink colour comes from glowing hydrogen – the same gas that fuels the Sun today."},
  ],
  pleiades: [
    {"icon":"👭","title":"Names from a myth","text":"In Greek myth the Pleiades were seven sisters, daughters of the giant Atlas and the sea nymph Pleione. Their parents are in the cluster too, as two of its brightest stars. The brightest of all is Alcyone, a blue giant at the centre of the little dipper shape."},
    {"icon":"📏","title":"The distance puzzle","text":"In the 1990s the Hipparcos satellite measured the Pleiades as about 390 light-years away, closer than other methods suggested. Scientists argued about it for years. Later measurements, including from the Gaia spacecraft, settled on about 444 light-years – showing why astronomers check results in more than one way."},
    {"icon":"🌱","title":"A family that will scatter","text":"The Pleiades stars were born together, but they won’t stay together forever. The gravity of passing stars and clouds slowly tugs them apart, and in a few hundred million years the family will have scattered. Our Sun was probably born in a cluster too, with long-lost sibling stars."},
  ],
  pillars: [
    {"icon":"🥚","title":"Eggs at the fingertips","text":"Along the tips of the pillars are small dark knobs that scientists call EGGs – evaporating gaseous globules. Each is a dense lump of gas, and some may hold a baby star. As the surrounding gas is stripped away, these eggs are slowly uncovered."},
    {"icon":"🏖️","title":"The sculptors nearby","text":"Just outside the picture lies a cluster of young, very hot stars. Their fierce light and winds blow away the thinner gas, like wind wearing down a sandcastle. Only the densest parts survive – which is why the pillars are long columns with thick tips."},
    {"icon":"⏳","title":"A picture from the past","text":"Light from the pillars takes about 6,500 years to reach us. So the view in every photo shows them as they were around the time people were building some of the very first towns. Whatever they look like today, we won’t see it for thousands of years."},
  ],
  ringnebula: [
    {"icon":"🍩","title":"A barrel, not a ring","text":"The Ring Nebula is not really a flat ring. It is more like a barrel or doughnut of gas, and we happen to look at it almost end-on – straight down the middle. That is why the centre looks dim and the edge looks bright."},
    {"icon":"⚪","title":"The tiny, scorching core","text":"The star left at the centre is a white dwarf about the size of Earth but heavier than half the Sun. A teaspoon of its material would weigh several tonnes. Its surface is more than 100,000 °C, and its fierce light makes the gas around it glow."},
    {"icon":"♻️","title":"Cosmic recycling","text":"The gas spreading out from the ring carries carbon, nitrogen and oxygen made inside the dying star. Over time it will mix into space and become part of new stars and planets. The carbon in your body came from stars that shed their outer layers like this."},
  ],
  crabnebula: [
    {"icon":"🧶","title":"Threads of star stuff","text":"The orange-red strands that criss-cross the Crab are the shredded outer layers of the star that blew up. They contain hydrogen, helium, oxygen and other elements made inside it. The whole cloud is now about 11 light-years across and still growing."},
    {"icon":"🌀","title":"Powered by a spinning heart","text":"The ghostly blue glow filling the nebula comes from tiny particles racing through magnetic fields, flung out by the pulsar at the centre. As the pulsar slowly loses spin, it pumps that energy into the cloud. Without it, the Crab would have faded long ago."},
    {"icon":"📏","title":"A measuring stick for X-rays","text":"The Crab is one of the brightest and steadiest X-ray sources in the sky. Because of this, astronomers have often used it to calibrate their instruments. They even measure the brightness of other X-ray sources in “Crabs” and “milliCrabs”."},
  ],
  psr1919: [
    {"icon":"🔨","title":"A telescope built by hand","text":"The radio telescope that found this pulsar was not a dish but a field of wooden posts and wire, covering more ground than two football pitches. Jocelyn Bell Burnell and other students helped build it. It printed its signals as wiggly lines on long rolls of paper, which she checked by hand."},
    {"icon":"🏮","title":"When beams cross Earth","text":"A pulsar’s beams sweep around as it spins, like a lighthouse. We only see one if a beam happens to cross Earth, so many pulsars are out there that we can never detect. Astronomers have now found more than 3,000."},
    {"icon":"⏱️","title":"Clocks across the galaxy","text":"Since 1967, pulsars have become some of the best clocks in the universe. In 1992 the first planets beyond the Solar System were found orbiting a pulsar. In 2023, teams timing dozens of pulsars found evidence of a gentle background “hum” of gravitational waves rippling through space."},
  ],
  crabpulsar: [
    {"icon":"🌪️","title":"A whirling surface","text":"Spinning about 30 times a second, a ball about 20 km across moves astonishingly fast at its surface – roughly 2,000 km every second at its equator. Its gravity is so strong that any “mountains” on it are thought to be at most a few millimetres tall."},
    {"icon":"🐢","title":"Slowly winding down","text":"The Crab Pulsar is gradually slowing as it pours energy into the nebula around it. Each day its spin takes less than a ten-millionth of a second longer, but over thousands of years that adds up. Scientists can measure this tiny change because the pulses are so regular."},
    {"icon":"💫","title":"Wisps and jets","text":"Close-up images from Hubble and the Chandra X-ray telescope show glowing rings and wisps around the pulsar, plus jets shooting out from its poles. The wisps change shape over days and weeks. They show the pulsar’s wind blasting into the nebula at a large fraction of the speed of light."},
  ],
  velapulsar: [
    {"icon":"🌕","title":"A giant sky ghost","text":"The cloud left by Vela’s explosion is enormous on our sky – about 16 full Moons wide. It is far too faint to see by eye, but long-exposure photos show a huge web of glowing threads. The pulsar sits inside it, slowly drifting through the wreckage."},
    {"icon":"🚒","title":"The firehose jet","text":"The Chandra X-ray telescope filmed a jet of particles shooting out of the Vela Pulsar. Over months it whips and wriggles from side to side, like a firehose that someone has let go of. Watching it helps scientists understand how pulsars fling energy into space."},
    {"icon":"🔦","title":"Faint flashes of light","text":"Although Vela is bright in radio waves and gamma rays, its visible light is incredibly faint. In 1977 astronomers in Australia finally caught it flashing in visible light, 11 times a second."},
  ],
  cygx1: [
    {"icon":"🚗","title":"How big is it?","text":"Cygnus X-1 packs about 21 Suns’ worth of matter into a dark sphere only around 120 km across. You could drive across that distance on a motorway in about an hour. Anything that crosses that edge, the event horizon, can never come back out."},
    {"icon":"🌬️","title":"Feeding on a star’s wind","text":"Its partner is a blue supergiant around 40 times heavier than the Sun. The two orbit closer together than Mercury is to the Sun. The giant star blows off a strong wind of gas, and the black hole gobbles some of it, forming a hot, swirling disc."},
    {"icon":"⚡","title":"The telltale flicker","text":"The X-rays from Cygnus X-1 flicker in less than a hundredth of a second. Something can’t flicker faster than light can cross it, so the glowing region must be tiny. That clue, plus its large mass, convinced astronomers this was a black hole."},
  ],
  sgra: [
    {"icon":"🪐","title":"Heavy but compact","text":"Sagittarius A* has the mass of about 4 million Suns, yet its event horizon is only around 25 million km across. That would fit well inside the orbit of Mercury. If you shrank the Milky Way to the size of a football field, the black hole would be smaller than a grain of sand."},
    {"icon":"🍽️","title":"A picky eater","text":"Compared with many giant black holes, Sagittarius A* is surprisingly quiet, because very little gas falls into it. Even so, it flickers with small flares in X-rays and infrared light, often about once a day. Astronomers watch these flares to learn how black holes feed."},
    {"icon":"🧪","title":"Testing Einstein","text":"When the star S2 swings closest to the black hole, its light is stretched by gravity, exactly as Einstein’s theory predicts. Its orbit also slowly turns like a spirograph pattern, another of Einstein’s predictions. Scientists confirmed both effects in 2018 and 2020."},
  ],
  m87bh: [
    {"icon":"🚀","title":"A jet across the galaxy","text":"The jet shooting out from near M87* stretches about 5,000 light-years – longer than the distance from Earth to the Orion Nebula and back. Particles in it travel at nearly the speed of light. Magnetic fields twisted by the spinning black hole help launch them."},
    {"icon":"💾","title":"Data by aeroplane","text":"The 2017 observations made about 5 petabytes of data – far too much to send over the internet. So the hard drives, weighing about half a tonne, were flown to supercomputer centres. There, computers combined the signals from all the dishes to build the picture."},
    {"icon":"🍩","title":"Why the ring is lopsided","text":"Light from hot gas bends around the black hole, making the ring around its dark shadow. The ring is brighter on one side because gas there is swirling towards us, which boosts its light. Even though M87* is about 1,500 times heavier than Sagittarius A*, both look about the same size from Earth."},
  ],
  milkyway: [
    {"icon":"🧪","title":"Ingredients of a Galaxy","text":"Besides stars, the Milky Way holds vast clouds of gas and dust – the raw ingredients for new suns and planets. At its very centre sits a black hole called Sagittarius A*, about 4 million times heavier than the Sun. Wrapped around everything is an invisible halo of dark matter."},
    {"icon":"🎠","title":"Riding the Galactic Carousel","text":"Even when you sit perfectly still, the Sun is carrying you around the galaxy at roughly 230 kilometres every second – fast enough to get from London to New York in about 25 seconds. Our spot, about halfway out from the centre, is a quiet suburb far from the crowded core."},
    {"icon":"📡","title":"Seeing Through the Dust","text":"Thick dust hides the galaxy’s centre from ordinary telescopes, like fog hiding a lighthouse, but infrared and radio telescopes see straight through it. By tracking stars whizzing around the centre for decades, astronomers proved a giant black hole lives there – work that won the 2020 Nobel Prize in Physics."},
  ],
  lmc: [
    {"icon":"💪","title":"Home of Monster Stars","text":"Deep inside the Tarantula Nebula lies a tight cluster of some of the heaviest stars ever found. The record-holder, R136a1, is roughly 200 times the mass of the Sun and shines millions of times brighter. Stars like this live fast and explode after just a few million years."},
    {"icon":"🌌","title":"A Sky With a Spiral","text":"Imagine a planet orbiting a star in the Large Magellanic Cloud. On a dark night, the Milky Way would hang overhead as an enormous glowing spiral, wider than 60 full Moons lined up side by side. It would be one of the most spectacular views in our corner of the universe."},
    {"icon":"📏","title":"A Ruler for the Universe","text":"Astronomers know the distance to the Large Magellanic Cloud to within about 1%, measured using pairs of stars that eclipse each other. That makes it a vital rung on the cosmic distance ladder – the chain of measurements used to work out how fast the whole universe is expanding."},
  ],
  smc: [
    {"icon":"🧂","title":"A Pinch of Heavy Elements","text":"The Small Magellanic Cloud’s stars contain only about a fifth as much of the heavier elements – like oxygen and iron – as our Sun. That makes it a handy window into the past, because galaxies in the early universe were also short of these ingredients."},
    {"icon":"🌉","title":"Pulled Like Taffy","text":"The SMC is being tugged by both the Large Magellanic Cloud and the Milky Way. Their gravity has pulled out a long bridge of gas and stars – the Magellanic Bridge – that links the two Clouds, and a huge trail of gas that streams behind them across the sky."},
    {"icon":"🔭","title":"Webb Finds Planet Nurseries","text":"In the SMC’s busy star cluster NGC 346, the James Webb Space Telescope spotted young stars still wrapped in dusty discs that can build planets – even though the galaxy has so few heavy elements. Puzzlingly, these discs seem to last longer than similar ones in our own galaxy."},
  ],
  andromeda: [
    {"icon":"🛰️","title":"A Galaxy With Followers","text":"Andromeda is surrounded by a swarm of smaller satellite galaxies, including M32 and M110, which a small telescope shows close to its bright centre. Long streams of stars loop around it too – the leftover wreckage of smaller galaxies that Andromeda has pulled apart and swallowed in the past."},
    {"icon":"🌕","title":"Bigger Than It Looks","text":"If your eyes could pick up faint light better, Andromeda would stretch across the sky about six times wider than the full Moon. We only notice its bright middle, which is why it looks like a small fuzzy smudge rather than a giant glowing disc."},
    {"icon":"🪞","title":"Our Mirror Galaxy","text":"Because we live inside the Milky Way, nobody can step outside to photograph it. Andromeda is the next best thing: a big spiral close enough to study star by star. It shows astronomers what a galaxy like ours looks like from the outside."},
  ],
  triangulum: [
    {"icon":"🥚","title":"No Bulge in the Middle","text":"Unlike the Milky Way and Andromeda, Triangulum has no big bright bulge at its centre, and astronomers have found no sign of a giant black hole there. Instead it is rich in gas, which it is busily turning into fresh new stars along its loose, patchy arms."},
    {"icon":"🏭","title":"Inside a Star Factory","text":"Its star factory, NGC 604, is a glowing cloud so wide that light takes well over a thousand years to cross it – dozens of times wider than the Orion Nebula. More than 200 hot, blue, heavyweight stars blaze inside it, carving out huge bubbles in the gas."},
    {"icon":"📻","title":"Watching a Galaxy Turn","text":"By tracking tiny radio beacons in its gas clouds over several years, astronomers measured Triangulum actually turning – and sliding slowly across our sky. It was one of the first times anyone measured a spiral galaxy’s sideways motion directly, a bit like timing a carousel from millions of light-years away."},
  ],
  whirlpool: [
    {"icon":"🎨","title":"Painted Spiral Arms","text":"Each arm of the Whirlpool is threaded with dark lanes of dust, sprinkled with blue clusters of young stars and dotted with pink clouds of glowing hydrogen. The pink patches are nurseries, lit up by newborn stars switching on inside them."},
    {"icon":"🌠","title":"A View With a Neighbour","text":"From a planet inside the Whirlpool, the companion galaxy NGC 5195 would hang in the sky as a large hazy glow. The nearby spiral arm would be crowded with bright young stars and glowing clouds, much busier than the night sky we see from Earth."},
    {"icon":"💥","title":"Supernova Hotspot","text":"Astronomers have spotted three supernovae – exploding stars – in the Whirlpool since 1994, and amateur astronomers helped discover some of them. Catching stars in the act of dying lets scientists check what kinds of stars blow up and how."},
  ],
  sombrero: [
    {"icon":"⚪","title":"Thousands of Star Balls","text":"The Sombrero is surrounded by around 2,000 globular clusters – tight balls of hundreds of thousands of ancient stars. Our Milky Way has only about 150. They swarm around the galaxy’s huge, bright bulge of old, yellowish stars like bees around a hive."},
    {"icon":"🎩","title":"A Hat Seen Side-On","text":"We see the Sombrero almost exactly edge-on, tilted only about 6 degrees. That is why its ring of dust lies across the glowing middle like the brim of a hat. If we could see it from above, it would look like a bright ball circled by a dark hoop."},
    {"icon":"🌫️","title":"A Quiet Ring of Dust","text":"The Sombrero’s dusty ring is full of cold gas and dust, yet it makes surprisingly few new stars – unlike the busy Whirlpool. Infrared telescopes see the dust glowing softly, helping astronomers work out why some galaxies keep making stars while others slow down."},
  ],
  hudf: [
    {"icon":"🧩","title":"Galaxies of Every Shape","text":"Nearer galaxies in the image look like neat spirals and smooth ovals, while the most distant ones are small, messy red smudges – young galaxies still putting themselves together. Only a few of the dots are stars in our own galaxy; almost everything else is a whole galaxy."},
    {"icon":"🌍","title":"Light Older Than Earth","text":"Much of the light in this picture set out on its journey before the Sun and Earth even existed, about 4.6 billion years ago. Some of those photons were already travelling for billions of years when our planet was still a ball of molten rock."},
    {"icon":"🌈","title":"Colours Tell Distance","text":"Hubble photographed the patch through several colour filters, from ultraviolet to near-infrared. Because the expanding universe stretches light, the most distant galaxies look reddest – or vanish completely from the bluer filters – which lets astronomers estimate how far away each one is."},
  ],
  expansion: [
    {"icon":"🍳","title":"The First Ingredients","text":"In its first few minutes, the young universe worked like a giant nuclear oven, cooking up hydrogen and helium – about three quarters hydrogen and one quarter helium by weight. Almost everything heavier, like the carbon in your body, was made much later inside stars."},
    {"icon":"🍞","title":"The Raisin Bread Universe","text":"Picture raisins in a loaf of bread as it rises in the oven. Every raisin moves away from every other one, and the farthest move fastest, but none is the centre. The raisins themselves don’t grow – just as you, Earth and the Milky Way are held together and don’t get stretched."},
    {"icon":"⏱️","title":"Measuring the Stretch","text":"Astronomers measure how fast space is growing by comparing galaxies’ distances with how quickly they move away. Using nearby stars and the Big Bang’s afterglow gives slightly different answers – a puzzle called the “Hubble tension” that nobody has solved yet."},
  ],
  cmb: [
    {"icon":"🌊","title":"Almost Perfectly Smooth","text":"The afterglow is the same temperature in every direction to about 1 part in 100,000. Those tiny ripples are like waves one millimetre high on a lake 100 metres deep – yet they were enough for gravity to grow them into every galaxy we see today."},
    {"icon":"🔥","title":"Hot as a Star","text":"If you could stand in the universe when this light was released, every direction would glow orange-hot – about 2,700 °C, like the surface of a cool red star. Since then, the expansion of space has stretched that light about 1,100 times, turning it into faint microwaves."},
    {"icon":"🏔️","title":"Telescopes in Dry Places","text":"Water in the air soaks up microwaves, so CMB telescopes are built in very dry places like the South Pole and Chile’s Atacama Desert, or launched into space. Measuring the pattern of tiny ripples is how scientists worked out the universe’s age and its recipe."},
  ],
  darkmatter: [
    {"icon":"👻","title":"Not Made of Atoms","text":"Dark matter doesn’t shine, reflect or block light, and it isn’t made of ordinary atoms. There is roughly five times more of it than all the normal matter in the universe. Without its extra gravity, gas in the young universe may never have clumped into galaxies like ours."},
    {"icon":"🔍","title":"Gravity’s Magnifying Glass","text":"Dark matter’s gravity bends light from more distant galaxies, a bit like the bottom of a glass bends the view of things behind it. By measuring how background galaxies are stretched and distorted, astronomers draw maps of where the invisible dark matter must be."},
    {"icon":"⛏️","title":"Hunting Deep Underground","text":"Some dark matter detectors sit in old mines more than a kilometre underground, where rock shields them from cosmic rays. Giant tanks of cold liquid xenon wait for a dark matter particle to bump into an atom. So far, none has been caught – the hunt continues."},
  ],
};
