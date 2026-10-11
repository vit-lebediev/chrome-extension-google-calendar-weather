/* Shared by extension contexts and dependency-free Node tests. */
(function (root) {
  const defaults = {enabled: true, units: 'celsius', location: null};
  function decodeDateKey(value) {
    if (!/^\d+$/.test(String(value))) return null;
    const key = Number(value);
    const year = 1970 + Math.floor(key / 512);
    const month = Math.floor((key % 512) / 32);
    const day = key % 32;
    if (year < 1970 || year > 2200 || month < 1 || month > 12 || day < 1) return null;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return date.toISOString().slice(0, 10);
  }
  function validLocation(location) {
    if (!location || typeof location.label !== 'string' || location.label.length > 200 ||
        !Number.isFinite(location.latitude) || Math.abs(location.latitude) > 90 ||
        !Number.isFinite(location.longitude) || Math.abs(location.longitude) > 180 ||
        typeof location.timezone !== 'string') return false;
    try { new Intl.DateTimeFormat('en', {timeZone: location.timezone}); return true; }
    catch { return false; }
  }
  const finite = value => Number.isFinite(value) ? value : null;
  function normalizeForecast(raw) {
    if (!Array.isArray(raw.daily?.time) || !Array.isArray(raw.hourly?.time) || !raw.timezone) {
      throw new Error('Weather service returned an incomplete forecast.');
    }
    const days = {};
    raw.daily.time.forEach((date, i) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      days[date] = {date, high: finite(raw.daily.temperature_2m_max?.[i]),
        low: finite(raw.daily.temperature_2m_min?.[i]), code: finite(raw.daily.weather_code?.[i]),
        rain: finite(raw.daily.precipitation_probability_max?.[i]), hours: []};
    });
    raw.hourly.time.forEach((time, i) => {
      days[time.slice(0, 10)]?.hours.push({time: time.slice(11, 16),
        temperature: finite(raw.hourly.temperature_2m?.[i]),
        rain: finite(raw.hourly.precipitation_probability?.[i]),
        wind: finite(raw.hourly.wind_speed_10m?.[i])});
    });
    return {timezone: raw.timezone, days};
  }
  function condition(code) {
    if (code === 0) return ['☀️', 'Clear'];
    if (code === 1 || code === 2) return ['🌤️', 'Partly cloudy'];
    if (code === 3) return ['☁️', 'Overcast'];
    if (code === 45 || code === 48) return ['🌫️', 'Fog'];
    if ([71, 73, 75, 77, 85, 86].includes(code)) return ['🌨️', 'Snow'];
    if ([95, 96, 99].includes(code)) return ['⛈️', 'Thunderstorm'];
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ['🌧️', 'Rain'];
    return ['◌', 'Unknown conditions'];
  }
  function temperature(value, units) {
    if (!Number.isFinite(value)) return '—';
    return `${Math.round(units === 'fahrenheit' ? value * 9 / 5 + 32 : value)}°`;
  }
  function cacheKey(location) {
    return JSON.stringify([location.latitude, location.longitude, location.timezone, 'v1']);
  }
  function matchesDateLabel(date, label) {
    if (!date || typeof label !== 'string') return false;
    const instant = new Date(`${date}T12:00:00Z`);
    const month = new Intl.DateTimeFormat('en', {month: 'long', timeZone: 'UTC'}).format(instant);
    const weekday = new Intl.DateTimeFormat('en', {weekday: 'long', timeZone: 'UTC'}).format(instant);
    const day = Number(date.slice(8));
    return label.includes(`${weekday}, ${month} ${day}`) &&
      new RegExp(`${month} ${day}(?:,|$)`).test(label);
  }
  function isFresh(entry, now = Date.now()) {
    return !!entry && now >= entry.fetchedAt && now - entry.fetchedAt < 60 * 60 * 1000;
  }
  const api = {defaults, decodeDateKey, validLocation, normalizeForecast, condition, temperature, cacheKey, isFresh, matchesDateLabel};
  root.WeatherCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
