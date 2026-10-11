const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const core = require('../src/core.js');
const location = {label: 'Los Angeles', latitude: 34, longitude: -118, timezone: 'America/Los_Angeles', source: 'manual'};
const raw = {timezone: location.timezone, daily: {time: ['2026-10-11'], temperature_2m_max: [23], temperature_2m_min: [15]}, hourly: {time: ['2026-10-11T12:00'], temperature_2m: [22]}};

function worker(fetch, extra = {}) {
  const storage = {settings: {enabled: true, location}, ...extra};
  let listener;
  const context = vm.createContext({WeatherCore: core, importScripts() {}, fetch, URL, URLSearchParams, AbortSignal,
    chrome: {storage: {local: {
      async get(key) { return {[key]: storage[key]}; },
      async set(values) { Object.assign(storage, values); }
    }}, runtime: {id: 'test', getURL: path => `chrome-extension://test/${path}`,
      onMessage: {addListener(callback) { listener = callback; }}}}});
  vm.runInContext(fs.readFileSync('src/background.js', 'utf8'), context);
  const sender = {id: 'test', tab: {id: 1}, url: 'https://calendar.google.com/calendar/u/0/r'};
  const request = (message = {type: 'forecast'}, source = sender) => new Promise(resolve => {
    if (!listener(message, source, resolve)) resolve(null);
  });
  return {storage, request};
}
const success = async () => ({ok: true, json: async () => raw});

test('concurrent forecast requests are deduplicated and a warm cache needs no network', async () => {
  let count = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const w = worker(async url => { count++; assert.equal(url.hostname, 'api.open-meteo.com'); assert.equal(url.searchParams.get('timezone'), location.timezone); await gate; return success(); });
  const requests = [w.request(), w.request(), w.request()];
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(count, 1);
  release();
  const results = await Promise.all(requests);
  assert.ok(results.every(result => result.ok && !result.data.stale));
  await w.request();
  assert.equal(count, 1);
});
test('expired cache survives offline failures, with explicit stale status and bounded retries', async () => {
  let count = 0;
  const cached = {key: core.cacheKey(location), fetchedAt: Date.now() - 7200000, data: core.normalizeForecast(raw)};
  const w = worker(async () => { count++; throw new Error('offline'); }, {forecastCache: cached});
  const result = await w.request();
  assert.equal(result.ok, true);
  assert.equal(result.data.stale, true);
  await w.request();
  assert.equal(count, 1);
});
test('previous-location cache is never returned on a failed new-location request', async () => {
  const w = worker(async () => { throw new Error('offline'); }, {forecastCache: {
    key: core.cacheKey({...location, latitude: 40}), fetchedAt: Date.now(), data: core.normalizeForecast(raw)
  }});
  const result = await w.request();
  assert.equal(result.ok, false);
  assert.equal(result.error, 'offline');
});
test('only the popup can search and requests cannot select arbitrary fetch URLs', async () => {
  let count = 0;
  const w = worker(async () => { count++; return success(); });
  assert.equal(await w.request({}, {id: 'other', url: 'https://calendar.google.com/', tab: {}}), null);
  const result = await w.request({type: 'searchCity', query: 'London'});
  assert.equal(result.ok, false);
  const unknown = await w.request({type: 'fetch', url: 'https://example.com'});
  assert.equal(unknown.ok, false);
  assert.equal(count, 0);
});
test('disabled overlays make no forecast requests', async () => {
  let count = 0;
  const w = worker(async () => { count++; return success(); }, {settings: {enabled: false, location}});
  assert.equal((await w.request()).ok, false);
  assert.equal(count, 0);
});
test('geocoding results include disambiguation and a provider-independent location record', async () => {
  const w = worker(async url => {
    assert.equal(url.hostname, 'geocoding-api.open-meteo.com');
    assert.equal(url.searchParams.get('name'), 'London');
    return {ok: true, json: async () => ({results: [{name: 'London', admin1: 'England', country: 'United Kingdom', latitude: 51.5, longitude: -0.1, timezone: 'Europe/London'}]})};
  });
  const result = await w.request({type: 'searchCity', query: ' London '}, {id: 'test', url: 'chrome-extension://test/src/popup.html'});
  assert.equal(result.ok, true);
  assert.equal(result.data[0].label, 'London, England, United Kingdom');
  assert.equal(result.data[0].source, 'manual');
  assert.equal(core.validLocation(result.data[0]), true);
});
