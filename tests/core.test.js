const {test} = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core.js');
test('provided keys decode across month boundaries without treating keys as day offsets', () => {
  for (const [key, date] of [[29003, '2026-10-11'], [29023, '2026-10-31'], [29025, '2026-11-01']]) assert.equal(core.decodeDateKey(key), date);
  assert.equal(core.decodeDateKey(29024), null);
});
test('decoded dates must agree with accessible labels, including weekday and exact day', () => {
  assert.equal(core.matchesDateLabel('2026-10-11', 'Sunday, October 11, today'), true);
  assert.equal(core.matchesDateLabel('2026-11-01', '1 event, Sunday, November 1'), true);
  assert.equal(core.matchesDateLabel('2026-11-01', 'Sunday, November 10'), false);
  assert.equal(core.matchesDateLabel('2025-11-01', 'Sunday, November 1'), false);
  assert.equal(core.matchesDateLabel('2026-11-01', null), false);
});
test('civil date decoding handles year rollover, leap days, and rejects invalid dates', () => {
  const key = (y, m, d) => (y - 1970) * 512 + m * 32 + d;
  assert.equal(core.decodeDateKey(key(2026, 12, 31)), '2026-12-31');
  assert.equal(core.decodeDateKey(key(2027, 1, 1)), '2027-01-01');
  assert.equal(core.decodeDateKey(key(2024, 2, 29)), '2024-02-29');
  assert.equal(core.decodeDateKey(key(2026, 2, 29)), null);
  for (const value of ['x', '', -1, 3.5, 999999999]) assert.equal(core.decodeDateKey(value), null);
});
test('forecast normalization preserves null data and repeated daylight-saving local hours', () => {
  const result = core.normalizeForecast({timezone: 'America/Los_Angeles',
    daily: {time: ['2026-11-01'], temperature_2m_max: [null], temperature_2m_min: [0], precipitation_probability_max: [0]},
    hourly: {time: ['2026-11-01T01:00', '2026-11-01T01:00'], temperature_2m: [0, null]}});
  assert.equal(result.days['2026-11-01'].high, null);
  assert.equal(result.days['2026-11-01'].low, 0);
  assert.equal(result.days['2026-11-01'].rain, 0);
  assert.equal(result.days['2026-11-01'].hours.length, 2);
  assert.equal(result.days['2026-11-01'].hours[1].temperature, null);
  assert.throws(() => core.normalizeForecast({}));
});
test('temperature conversion does not turn missing values into zero', () => {
  assert.equal(core.temperature(0, 'fahrenheit'), '32°');
  assert.equal(core.temperature(-40, 'fahrenheit'), '-40°');
  assert.equal(core.temperature(null, 'celsius'), '—');
});
test('cache identity includes location and timezone; freshness expires after one hour', () => {
  const location = {latitude: 34, longitude: -118, timezone: 'America/Los_Angeles'};
  assert.notEqual(core.cacheKey(location), core.cacheKey({...location, timezone: 'UTC'}));
  assert.notEqual(core.cacheKey(location), core.cacheKey({...location, latitude: 35}));
  assert.equal(core.isFresh({fetchedAt: 1000}, 3600999), true);
  assert.equal(core.isFresh({fetchedAt: 1000}, 3601000), false);
  assert.equal(core.isFresh({fetchedAt: 1000}, 999), false);
});
test('location validation supports multiple IANA zones and rejects malformed input', () => {
  const location = {label: 'City', latitude: 34, longitude: -118, timezone: 'America/Los_Angeles'};
  assert.equal(core.validLocation(location), true);
  assert.equal(core.validLocation({...location, timezone: 'Asia/Tokyo'}), true);
  assert.equal(core.validLocation({...location, timezone: 'bogus'}), false);
  assert.equal(core.validLocation({...location, latitude: 91}), false);
  assert.equal(core.validLocation(null), false);
});
