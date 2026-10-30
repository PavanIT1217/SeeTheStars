// Interface translations. The English text is the key, so anything not translated yet simply stays English.
// Lesson texts in js/data/catalog.js are English only for now.
export const LANGUAGES = { en: 'English', hi: 'हिन्दी', es: 'Español' };

const HI = {
  Explore: 'खोजें', Tonight: 'आज रात', 'Sky Finder': 'आकाश खोजक', Sky: 'आकाश', Library: 'लाइब्रेरी', 'My journey': 'मेरी यात्रा', Me: 'मैं',
  'For teachers': 'शिक्षकों के लिए', 'All 61 wonders': 'सभी 61 अजूबे', Privacy: 'गोपनीयता', 'Source code': 'सोर्स कोड',
  // Sky Finder
  'Free look': 'खुला आकाश', 'Tap anything on screen to target it': 'किसी भी चीज़ को चुनने के लिए उस पर टैप करें',
  'Find anything in the universe': 'ब्रह्मांड में कुछ भी खोजें',
  'Hold your phone up like you’re taking a photo. Arrows will guide you to your target – even if it is on the other side of the Earth.': 'फ़ोन को ऐसे पकड़ें जैसे फ़ोटो ले रहे हों। तीर आपको लक्ष्य तक ले जाएँगे – चाहे वह पृथ्वी की दूसरी ओर ही क्यों न हो।',
  'Engage scanner': 'स्कैनर चालू करें', 'No sensors? Drag to explore': 'सेंसर नहीं? खींचकर देखें',
  'Uses your camera, motion sensors and location. Nothing leaves your device.': 'कैमरा, मोशन सेंसर और लोकेशन का उपयोग करता है। कुछ भी आपके डिवाइस से बाहर नहीं जाता।',
  'Learn about it': 'इसके बारे में जानें', 'It’s right here – calibrate': 'यह यहीं है – कैलिब्रेट करें',
  'Turn left': 'बाएँ मुड़ें', 'Turn right': 'दाएँ मुड़ें', 'Look up': 'ऊपर देखें', 'Look down': 'नीचे देखें', ' a little': ' थोड़ा', ' a lot': ' बहुत',
  'Almost there…': 'बस पहुँचने वाले हैं…', '◎ LOCKED ON': '◎ मिल गया!', 'Found it!': 'मिल गया!', 'Almost there!': 'बस थोड़ा और!',
  'Getting warmer…': 'और पास…', 'Keep turning…': 'घूमते रहिए…', 'Cold – try the other way!': 'ठंडा – दूसरी ओर आज़माएँ!',
  Facing: 'दिशा', up: 'ऊपर', down: 'नीचे', right: 'दाएँ', left: 'बाएँ', 'turn {dir}': '{dir} मुड़ें', 'tilt {dir}': '{dir} झुकाएँ', ' and ': ' और ', 'almost there…': 'बस पहुँचने वाले हैं…',
  'Search, or pick a guided tour…': 'खोजें, या कोई गाइडेड टूर चुनें…', 'GUIDED TOURS': 'गाइडेड टूर', '← Back': '← पीछे', 'Next →': 'आगे →', 'Finish ✓': 'पूरा ✓',
  Now: 'अभी', 'stops up now': 'पड़ाव अभी आकाश में', of: 'में से',
  'Below your horizon right now – you’re pointing <i>through the Earth</i>.': 'अभी यह क्षितिज के नीचे है – आप <i>पृथ्वी के आर-पार</i> इशारा कर रहे हैं।',
  'It rises at': 'यह उगेगा', 'Above your horizon now. It sets at': 'अभी क्षितिज के ऊपर है। यह डूबेगा', 'It never sets from where you are.': 'आपकी जगह से यह कभी नहीं डूबता।',
  'No motion sensors detected – drag the sky to look around.': 'मोशन सेंसर नहीं मिले – आकाश को खींचकर देखें।',
  '⚠ Never look at the Sun – point the phone, not your eyes!': '⚠ सूरज को कभी सीधे न देखें – फ़ोन से इशारा करें, आँखों से नहीं!',
  'Nothing found – try a planet, a star like “Vega” or a constellation like “Leo”.': 'कुछ नहीं मिला – कोई ग्रह, “वेगा” जैसा तारा या “सिंह” जैसा तारामंडल आज़माएँ।',
  // Tonight
  'What can I see tonight?': 'आज रात मैं क्या देख सकता हूँ?',
  'The best things in your sky tonight – planets, the Moon, space stations flying over and stars to learn – worked out for exactly where you are.': 'आज रात आपके आकाश की सबसे अच्छी चीज़ें – ग्रह, चाँद, ऊपर से गुज़रते अंतरिक्ष स्टेशन और पहचानने लायक तारे – ठीक आपकी जगह के लिए।',
  'It gets dark at about {start} and stays dark until {end}.': 'लगभग {start} बजे अँधेरा होगा और {end} बजे तक रहेगा।',
  'It’s dark now, until about {end}.': 'अभी अँधेरा है, लगभग {end} तक।',
  'Best things to see': 'देखने लायक सबसे अच्छी चीज़ें', 'Coming up': 'आने वाला', 'The next two weeks in the sky.': 'अगले दो हफ़्तों में आकाश में।',
  'Find it': 'खोजें', 'Tonight’s challenge': 'आज रात की चुनौती', 'Find {name} in the real sky': 'असली आकाश में {name} खोजें',
  'Point your phone at it until it says LOCKED ON to earn +{xp} XP': 'फ़ोन से इशारा करें जब तक “मिल गया!” न दिखे, और +{xp} XP पाएँ',
  // Moon
  'Stargazing tonight': 'आज रात तारे देखने का मौसम', 'Forecast: Open-Meteo': 'पूर्वानुमान: Open-Meteo',
  'Tonight’s Moon': 'आज रात का चाँद', lit: 'रोशन', rises: 'उगता है', sets: 'डूबता है',
  'New Moon': 'अमावस्या', 'Waxing crescent': 'बढ़ता हुआ हँसिया चाँद', 'First quarter': 'शुक्ल अष्टमी', 'Waxing gibbous': 'बढ़ता हुआ चाँद',
  'Full Moon': 'पूर्णिमा', 'Waning gibbous': 'घटता हुआ चाँद', 'Last quarter': 'कृष्ण अष्टमी', 'Waning crescent': 'घटता हुआ हँसिया चाँद',
  'in {n} days': '{n} दिन में', today: 'आज', tomorrow: 'कल',
  // My journey
  'Your rank': 'आपकी रैंक', 'How much detail?': 'कितनी जानकारी?', Explorer: 'खोजी', Scientist: 'वैज्ञानिक', 'Simple and fun': 'आसान और मज़ेदार', 'All the data': 'सारा डेटा',
  'Real-sky quests': 'असली आकाश की खोजें', 'Observing log': 'अवलोकन डायरी', Badges: 'बैज', Offline: 'ऑफ़लाइन', Language: 'भाषा',
  'Red night mode': 'लाल रात्रि मोड', 'Turns the screen red so your eyes stay used to the dark.': 'स्क्रीन को लाल कर देता है ताकि आँखें अँधेरे की आदी रहें।',
  '🔔 Sky reminders': '🔔 आकाश अनुस्मारक', 'Remind me': 'मुझे याद दिलाएँ', '🏫 Join a class': '🏫 कक्षा से जुड़ें', '🏫 My class': '🏫 मेरी कक्षा', Join: 'जुड़ें',
  'Class code': 'कक्षा कोड', Nickname: 'उपनाम', 'Lesson texts are in English for now.': 'पाठ अभी अंग्रेज़ी में हैं।',
  // names
  Sun: 'सूर्य', Moon: 'चंद्रमा', Mercury: 'बुध', Venus: 'शुक्र', Earth: 'पृथ्वी', Mars: 'मंगल', Jupiter: 'बृहस्पति', Saturn: 'शनि', Uranus: 'अरुण', Neptune: 'वरुण', Pluto: 'प्लूटो',
  'The Moon': 'चंद्रमा', 'The Sun': 'सूर्य', 'International Space Station': 'अंतर्राष्ट्रीय अंतरिक्ष स्टेशन', 'North Star': 'ध्रुव तारा', Polaris: 'ध्रुव तारा',
};

const ES = {
  Explore: 'Explorar', Tonight: 'Esta noche', 'Sky Finder': 'Buscador del cielo', Sky: 'Cielo', Library: 'Biblioteca', 'My journey': 'Mi viaje', Me: 'Yo',
  'For teachers': 'Para docentes', 'All 61 wonders': 'Las 61 maravillas', Privacy: 'Privacidad', 'Source code': 'Código fuente',
  'Free look': 'Vista libre', 'Tap anything on screen to target it': 'Toca cualquier cosa para elegirla',
  'Find anything in the universe': 'Encuentra cualquier cosa del universo',
  'Hold your phone up like you’re taking a photo. Arrows will guide you to your target – even if it is on the other side of the Earth.': 'Levanta el teléfono como si fueras a hacer una foto. Las flechas te guiarán hasta tu objetivo, aunque esté al otro lado de la Tierra.',
  'Engage scanner': 'Activar escáner', 'No sensors? Drag to explore': '¿Sin sensores? Arrastra para explorar',
  'Uses your camera, motion sensors and location. Nothing leaves your device.': 'Usa la cámara, los sensores de movimiento y tu ubicación. Nada sale de tu dispositivo.',
  'Learn about it': 'Aprende más', 'It’s right here – calibrate': 'Está justo aquí: calibrar',
  'Turn left': 'Gira a la izquierda', 'Turn right': 'Gira a la derecha', 'Look up': 'Mira arriba', 'Look down': 'Mira abajo', ' a little': ' un poco', ' a lot': ' mucho',
  'Almost there…': 'Casi…', '◎ LOCKED ON': '◎ ¡ENCONTRADO!', 'Found it!': '¡Encontrado!', 'Almost there!': '¡Casi!',
  'Getting warmer…': 'Caliente…', 'Keep turning…': 'Sigue girando…', 'Cold – try the other way!': 'Frío: ¡prueba hacia el otro lado!',
  Facing: 'Mirando al', up: 'arriba', down: 'abajo', right: 'derecha', left: 'izquierda', 'turn {dir}': 'gira a la {dir}', 'tilt {dir}': 'inclina hacia {dir}', ' and ': ' y ', 'almost there…': 'casi…',
  'Search, or pick a guided tour…': 'Busca o elige una visita guiada…', 'GUIDED TOURS': 'VISITAS GUIADAS', '← Back': '← Atrás', 'Next →': 'Siguiente →', 'Finish ✓': 'Terminar ✓',
  Now: 'Ahora', 'stops up now': 'paradas visibles ahora', of: 'de',
  'Below your horizon right now – you’re pointing <i>through the Earth</i>.': 'Ahora está bajo tu horizonte: estás apuntando <i>a través de la Tierra</i>.',
  'It rises at': 'Sale a las', 'Above your horizon now. It sets at': 'Ahora está sobre tu horizonte. Se pone a las', 'It never sets from where you are.': 'Desde donde estás nunca se pone.',
  'No motion sensors detected – drag the sky to look around.': 'No hay sensores de movimiento: arrastra el cielo para mirar alrededor.',
  '⚠ Never look at the Sun – point the phone, not your eyes!': '⚠ ¡Nunca mires al Sol! Apunta con el teléfono, no con los ojos.',
  'Nothing found – try a planet, a star like “Vega” or a constellation like “Leo”.': 'No hay resultados: prueba un planeta, una estrella como «Vega» o una constelación como «Leo».',
  'What can I see tonight?': '¿Qué puedo ver esta noche?',
  'The best things in your sky tonight – planets, the Moon, space stations flying over and stars to learn – worked out for exactly where you are.': 'Lo mejor de tu cielo esta noche (planetas, la Luna, estaciones espaciales que pasan y estrellas para aprender), calculado para el lugar exacto donde estás.',
  'It gets dark at about {start} and stays dark until {end}.': 'Oscurece hacia las {start} y sigue oscuro hasta las {end}.',
  'It’s dark now, until about {end}.': 'Ya es de noche, hasta las {end} más o menos.',
  'Best things to see': 'Lo mejor para ver', 'Coming up': 'Próximamente', 'The next two weeks in the sky.': 'Las próximas dos semanas en el cielo.',
  'Find it': 'Encontrar', 'Tonight’s challenge': 'El reto de esta noche', 'Find {name} in the real sky': 'Encuentra {name} en el cielo real',
  'Point your phone at it until it says LOCKED ON to earn +{xp} XP': 'Apunta con el teléfono hasta que diga ENCONTRADO y gana +{xp} XP',
  'Stargazing tonight': 'Observación esta noche', 'Forecast: Open-Meteo': 'Previsión: Open-Meteo',
  'Tonight’s Moon': 'La Luna de esta noche', lit: 'iluminada', rises: 'sale', sets: 'se pone',
  'New Moon': 'Luna nueva', 'Waxing crescent': 'Luna creciente', 'First quarter': 'Cuarto creciente', 'Waxing gibbous': 'Gibosa creciente',
  'Full Moon': 'Luna llena', 'Waning gibbous': 'Gibosa menguante', 'Last quarter': 'Cuarto menguante', 'Waning crescent': 'Luna menguante',
  'in {n} days': 'en {n} días', today: 'hoy', tomorrow: 'mañana',
  'Your rank': 'Tu rango', 'How much detail?': '¿Cuánto detalle?', Explorer: 'Explorador', Scientist: 'Científico', 'Simple and fun': 'Sencillo y divertido', 'All the data': 'Todos los datos',
  'Real-sky quests': 'Misiones en el cielo real', 'Observing log': 'Diario de observación', Badges: 'Insignias', Offline: 'Sin conexión', Language: 'Idioma',
  'Red night mode': 'Modo nocturno rojo', 'Turns the screen red so your eyes stay used to the dark.': 'Pone la pantalla en rojo para que tus ojos sigan acostumbrados a la oscuridad.',
  '🔔 Sky reminders': '🔔 Avisos del cielo', 'Remind me': 'Avisarme', '🏫 Join a class': '🏫 Unirse a una clase', '🏫 My class': '🏫 Mi clase', Join: 'Unirse',
  'Class code': 'Código de clase', Nickname: 'Apodo', 'Lesson texts are in English for now.': 'Por ahora, las lecciones están en inglés.',
  Sun: 'Sol', Moon: 'Luna', Mercury: 'Mercurio', Venus: 'Venus', Earth: 'Tierra', Mars: 'Marte', Jupiter: 'Júpiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Neptuno', Pluto: 'Plutón',
  'The Moon': 'La Luna', 'The Sun': 'El Sol', 'International Space Station': 'Estación Espacial Internacional', 'North Star': 'Estrella Polar', Polaris: 'Estrella Polar',
};

const DICTS = { hi: HI, es: ES };
let lang = 'en';

export function setLanguage(code) {
  lang = DICTS[code] ? code : 'en';
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}
export const language = () => lang;

// Best guess from the device, used until the person picks a language.
export function deviceLanguage() {
  const l = (typeof navigator !== 'undefined' && navigator.language || 'en').slice(0, 2);
  return DICTS[l] ? l : 'en';
}

export function t(text, vars) {
  let s = DICTS[lang]?.[text] ?? text;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
