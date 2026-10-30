// Hands the home-screen widget (iOS WidgetKit / Android AppWidget) tonight's best sight and the next bright
// satellite pass. The widget works out the Moon itself. Apps only; does nothing on the web.
import { Capacitor, registerPlugin } from './vendor/capacitor/core.js';
import { tonightPlan } from './tonight.js';
import { OBJECTS } from './data/catalog.js';

let plugin = null;
export async function updateWidget(observer) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    plugin ??= registerPlugin('SkyWidget');
    const plan = tonightPlan(observer, new Date());
    const best = plan.highlights.find((h) => h.key && OBJECTS[h.key] && !OBJECTS[h.key].pos?.iss);
    const pass = plan.highlights.find((h) => h.emoji === '🛰');
    await plugin.update({
      top: best ? `Tonight: ${best.title}` : 'Tonight: a good night to learn a constellation',
      pass: pass ? pass.title : '',
    });
  } catch (e) {
    console.warn('Could not update the home-screen widget', e); // e.g. an older app build without the widget
  }
}
