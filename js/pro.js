// The "Pro" gate. The learning journey is always free. These extras could become paid later
// (an in-app purchase in the apps), but for now everything is unlocked for everyone: PRO_LOCKED is false.
// To turn the gate on: set PRO_LOCKED to true and make hasPro() check the purchase.
export const PRO_LOCKED = false;

export const PRO_FEATURES = {
  tours: 'Guided sky tours',
  classroom: 'Classroom mode',
  deepCatalog: 'Messier objects and faint stars in the Sky Finder',
};

export const hasPro = () => true;
export const unlocked = (feature) => !PRO_LOCKED || !(feature in PRO_FEATURES) || hasPro();
