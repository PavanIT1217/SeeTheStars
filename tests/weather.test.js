// Sky Finder weather layers: reading Open-Meteo, picking the hour, and which way the clouds are.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { weatherUrl, parseWeather, weatherAt, opacity, cloudAt, trend, dirName, RING } from '../js/weather.js';
import { bearingDistance } from '../js/earth.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/open-meteo-ring.json', import.meta.url), 'utf8'));

test('one request asks for your spot plus 8 points 60 km away, using a rounded location', () => {
  const u = new URL(weatherUrl({ lat: 17.3851, lon: 78.4867 }));
  const lats = u.searchParams.get('latitude').split(',').map(Number), lons = u.searchParams.get('longitude').split(',').map(Number);
  assert.equal(lats.length, 1 + RING);
  assert.deepEqual([lats[0], lons[0]], [17.4, 78.5]);
  for (let i = 1; i <= RING; i++) {
    const { km, az } = bearingDistance({ lat: 17.4, lon: 78.5 }, { lat: lats[i], lon: lons[i] });
    assert.ok(Math.abs(km - 60) < 1.5, `ring point ${i} is 60 km away (${km})`);
    assert.ok(Math.abs(((az - (i - 1) * 45 + 540) % 360) - 180) < 1.5, `ring point ${i} is at ${(i - 1) * 45}°`);
  }
  for (const v of ['cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high', 'wind_direction_10m', 'precipitation']) assert.ok(u.searchParams.get('hourly').includes(v));
});

test('parses the real Open-Meteo answer and picks the nearest hour', () => {
  const data = parseWeather(fixture);
  assert.equal(data.points.length, 1 + RING);
  assert.equal(data.times.length, fixture[0].hourly.time.length);
  const wx = weatherAt(data, new Date(data.times[2] + 20 * 60e3));
  assert.equal(+wx.time, data.times[2]);
  assert.equal(wx.ring.length, RING);
  assert.equal(wx.centre.cloud, fixture[0].hourly.cloud_cover[2]);
  assert.equal(weatherAt(data, new Date(data.times[0] - 3 * 3600e3)), null, 'nothing before the forecast');
  assert.equal(weatherAt(data, new Date(data.times.at(-1) + 3 * 3600e3)), null, 'nothing after it');
  assert.equal(weatherAt(null, new Date()), null);
});

const wxOf = (centre, ring, more = {}) => ({ centre: { cloud: 0, low: 0, mid: 0, high: 0, wind: 20, windFrom: 270, precip: 0, prob: 0, code: 0, ...centre }, ring: ring.map((low) => ({ cloud: low, low, mid: 0, high: 0 })), ...more });

test('low clouds hide the sky more than thin high ones', () => {
  assert.equal(opacity({ low: 0, mid: 0, high: 0 }), 0);
  assert.ok(opacity({ low: 100, mid: 0, high: 0 }) > opacity({ low: 0, mid: 0, high: 100 }));
  assert.ok(opacity({ low: 100, mid: 100, high: 100 }) <= 1);
});

test('the horizon shows the far clouds, overhead shows your own', () => {
  const wx = wxOf({ low: 0 }, [0, 0, 0, 0, 0, 0, 100, 0]); // cloudy only to the west
  assert.ok(cloudAt(wx, 270, 1) > 0.8, 'west horizon is cloudy');
  assert.equal(cloudAt(wx, 90, 1), 0, 'east horizon is clear');
  assert.equal(cloudAt(wx, 270, 60), 0, 'overhead is your own clear sky');
  assert.ok(cloudAt(wx, 247.5, 1) > 0.3 && cloudAt(wx, 247.5, 1) < 0.6, 'blends between neighbouring points');
});

test('says which way the weather is coming from', () => {
  assert.equal(trend(wxOf({ low: 0 }, [0, 0, 0, 0, 0, 0, 100, 0])), 'Clouds coming in from the west.');
  assert.equal(trend(wxOf({ low: 100 }, [100, 100, 100, 100, 100, 100, 0, 100])), 'Clearer sky coming from the west.');
  assert.equal(trend(wxOf({ low: 0, wind: 2 }, [0, 0, 0, 0, 0, 0, 100, 0])), '', 'not when it is calm');
  assert.equal(dirName(359), 'north');
  assert.equal(dirName(225), 'south-west');
});
