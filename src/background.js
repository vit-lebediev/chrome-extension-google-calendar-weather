importScripts('core.js');
const core = WeatherCore;
const pending = new Map();
const retryAfter = new Map();

async function getJSON(url) {
  const response = await fetch(url, {signal: AbortSignal.timeout(12000), credentials: 'omit'});
  if (!response.ok) throw new Error(`Weather service unavailable (${response.status}). Try again later.`);
  const result = await response.json();
  if (result.error) throw new Error('Weather service could not process this request.');
  return result;
}

async function searchCity(query) {
  if (typeof query !== 'string' || query.trim().length < 2 || query.length > 100) {
    throw new Error('Enter a city name with 2–100 characters.');
  }
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({name: query.trim(), count: '8', language: 'en', format: 'json'});
  const raw = await getJSON(url);
  return (raw.results || []).map(city => ({
    label: [city.name, city.admin1, city.country].filter(Boolean).join(', '),
    latitude: city.latitude, longitude: city.longitude, timezone: city.timezone, source: 'manual'
  })).filter(core.validLocation);
}

async function forecast(location) {
  const key = core.cacheKey(location);
  const {forecastCache} = await chrome.storage.local.get('forecastCache');
  const cached = forecastCache?.key === key ? forecastCache : null;
  if (core.isFresh(cached)) return {...cached, stale: false};
  if (pending.has(key)) return pending.get(key);
  if ((retryAfter.get(key) || 0) > Date.now()) {
    if (cached) return {...cached, stale: true};
    throw new Error('Weather temporarily unavailable. Retry in a minute.');
  }
  const task = (async () => {
    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.search = new URLSearchParams({latitude: String(location.latitude), longitude: String(location.longitude),
        timezone: location.timezone, forecast_days: '16', past_days: '2', timeformat: 'unixtime',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        hourly: 'temperature_2m,precipitation_probability,wind_speed_10m', wind_speed_unit: 'kmh'});
      const data = core.normalizeForecast(await getJSON(url));
      const entry = {key, fetchedAt: Date.now(), data};
      await chrome.storage.local.set({forecastCache: entry});
      retryAfter.delete(key);
      return {...entry, stale: false};
    } catch (error) {
      retryAfter.set(key, Date.now() + 60000);
      if (cached) return {...cached, stale: true};
      throw error;
    } finally { pending.delete(key); }
  })();
  pending.set(key, task);
  return task;
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  const popup = !sender.tab && sender.url === chrome.runtime.getURL('src/popup.html');
  const calendar = sender.tab && sender.url?.startsWith('https://calendar.google.com/');
  if (sender.id !== chrome.runtime.id || (!popup && !calendar)) return false;
  (async () => {
    if (message?.type === 'searchCity' && popup) return searchCity(message.query);
    if (message?.type === 'forecast') {
      const {settings} = await chrome.storage.local.get('settings');
      if (!settings?.enabled || !core.validLocation(settings.location)) throw new Error('Choose a city in Calendar Weather settings.');
      return forecast(settings.location);
    }
    throw new Error('Unsupported request.');
  })().then(data => respond({ok: true, data}), error => respond({ok: false, error: error.message}));
  return true;
});
