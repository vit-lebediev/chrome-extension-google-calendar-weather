/* Shared by extension contexts and dependency-free Node tests. */
(function (root) {
  const defaults = {enabled: true, units: 'celsius', location: null, hourlyStrips: false, calendarTimezone: ''};
  const formatters = new Map();
  function validTimezone(timezone) {
    if (typeof timezone !== 'string' || !timezone) return false;
    try { new Intl.DateTimeFormat('en', {timeZone: timezone}); return true; }
    catch { return false; }
  }
  function localParts(timestamp, timezone) {
    if (!Number.isFinite(timestamp)) return null;
    if (!formatters.has(timezone) && !validTimezone(timezone)) return null;
    if (!formatters.has(timezone)) formatters.set(timezone, new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }));
    const parts = Object.fromEntries(formatters.get(timezone).formatToParts(new Date(timestamp * 1000)).map(p => [p.type, p.value]));
    return {date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`,
      minute: Number(parts.hour) * 60 + Number(parts.minute)};
  }
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
    const hours = [];
    raw.daily.time.forEach((value, i) => {
      // Open-Meteo daily boundaries use its returned fixed offset, even across DST.
      const date = typeof value === 'number' && Number.isFinite(raw.utc_offset_seconds)
        ? new Date((value + raw.utc_offset_seconds) * 1000).toISOString().slice(0, 10) : value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      days[date] = {date, high: finite(raw.daily.temperature_2m_max?.[i]),
        low: finite(raw.daily.temperature_2m_min?.[i]), code: finite(raw.daily.weather_code?.[i]),
        rain: finite(raw.daily.precipitation_probability_max?.[i]), hours: []};
    });
    raw.hourly.time.forEach((value, i) => {
      const local = typeof value === 'number' ? localParts(value, raw.timezone) : null;
      const date = local?.date || (typeof value === 'string' ? value.slice(0, 10) : null);
      if (!date) return;
      const hour = {time: local?.time || value.slice(11, 16), timestamp: local ? value : null,
        temperature: finite(raw.hourly.temperature_2m?.[i]),
        rain: finite(raw.hourly.precipitation_probability?.[i]),
        wind: finite(raw.hourly.wind_speed_10m?.[i])};
      hours.push(hour);
      days[date]?.hours.push(hour);
    });
    return {timezone: raw.timezone, days, hours};
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
    return JSON.stringify([location.latitude, location.longitude, location.timezone, 'v2']);
  }
  function temperatureColor(value) {
    if (!Number.isFinite(value)) return null;
    const stops = [[-10, [93, 83, 188]], [0, [77, 145, 220]], [10, [74, 189, 178]],
      [20, [229, 204, 92]], [30, [235, 145, 73]], [40, [207, 70, 83]]];
    const clamped = Math.max(-10, Math.min(40, value));
    const upper = stops.findIndex(stop => stop[0] >= clamped);
    if (upper === 0) return `rgb(${stops[0][1].join(',')})`;
    const [low, high] = [stops[upper - 1], stops[upper]];
    const fraction = (clamped - low[0]) / (high[0] - low[0]);
    return `rgb(${low[1].map((v, i) => Math.round(v + (high[1][i] - v) * fraction)).join(',')})`;
  }
  function timeGridScale(rects, midnightY = rects[0]?.top) {
    if (rects.length !== 24) return null;
    // Markers may be full hourly boxes or thin grid lines; use their spacing.
    const spacing = rects[1].top - rects[0].top;
    if (!Number.isFinite(spacing) || spacing <= 0 || !Number.isFinite(midnightY) ||
        rects[0].top < midnightY - 1 || rects[0].top > midnightY + spacing + 1 ||
        rects.some((rect, i) => !Number.isFinite(rect.top) ||
          Math.abs(rect.top - rects[0].top - i * spacing) > 1)) return null;
    return {midnightY, pixelsPerMinute: spacing / 60};
  }
  function stripSegments(hours, timezone) {
    if (!validTimezone(timezone)) return [];
    const segments = [];
    // Minute slices split half-hour zones, midnight, and DST jumps exactly.
    // Precipitation samples describe the preceding hour; temperature the instant.
    const append = (timestamp, sample, lane) => {
      let previous = null;
      for (let offset = 0; offset < 60; offset++) {
        const local = localParts(timestamp + offset * 60, timezone);
        if (!local) continue;
        if (previous && previous.date === local.date && previous.endMinute === local.minute) previous.endMinute++;
        else {
          previous = {date: local.date, startMinute: local.minute, endMinute: local.minute + 1,
            timestamp: timestamp + offset * 60, lane, value: sample};
          segments.push(previous);
        }
      }
    };
    for (const hour of hours || []) {
      if (!Number.isFinite(hour.timestamp)) continue;
      if (Number.isFinite(hour.temperature)) append(hour.timestamp, hour.temperature, 'temperature');
      if (Number.isFinite(hour.rain)) append(hour.timestamp - 3600, Math.max(0, Math.min(100, hour.rain)), 'rain');
    }
    // Split at every boundary so partial repeats (e.g. a 30-minute DST change)
    // also share lane width consistently without covering another reading.
    const groups = new Map();
    for (const segment of segments) {
      const key = `${segment.date}/${segment.lane}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(segment);
    }
    const result = [];
    for (const group of groups.values()) {
      const boundaries = [...new Set(group.flatMap(s => [s.startMinute, s.endMinute]))].sort((a, b) => a - b);
      for (let i = 0; i < boundaries.length - 1; i++) {
        const startMinute = boundaries[i]; const endMinute = boundaries[i + 1];
        const active = group.filter(s => s.startMinute < endMinute && s.endMinute > startMinute).sort((a, b) => a.timestamp - b.timestamp);
        active.forEach((segment, slot) => result.push({...segment, startMinute, endMinute, slot, slots: active.length}));
      }
    }
    return result;
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
  const api = {defaults, decodeDateKey, validLocation, normalizeForecast, condition, temperature, cacheKey, isFresh, matchesDateLabel,
    validTimezone, localParts, temperatureColor, stripSegments, timeGridScale};
  root.WeatherCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
