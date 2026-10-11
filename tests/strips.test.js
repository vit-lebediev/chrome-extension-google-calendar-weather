const {test} = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core.js');
const epoch = iso => Date.parse(iso) / 1000;
const sample = (iso, temperature = 20, rain = 50) => ({timestamp: epoch(iso), temperature, rain});

test('UNIX normalization retains absolute hours and labels city time across a DST transition', () => {
  const result = core.normalizeForecast({timezone: 'America/Los_Angeles', utc_offset_seconds: -25200,
    daily: {time: [epoch('2026-11-01T07:00:00Z')], temperature_2m_max: [20]},
    hourly: {time: [epoch('2026-11-01T08:00:00Z'), epoch('2026-11-01T09:00:00Z')], temperature_2m: [15, 14]}});
  assert.equal(result.days['2026-11-01'].high, 20);
  assert.deepEqual(result.hours.map(hour => hour.time), ['01:00', '01:00']);
  assert.equal(result.hours[1].timestamp - result.hours[0].timestamp, 3600);
});
test('temperature and precipitation use their documented instant/preceding-hour intervals', () => {
  const segments = core.stripSegments([sample('2026-10-12T07:00:00Z')], 'America/Los_Angeles');
  const temp = segments.find(segment => segment.lane === 'temperature');
  const rain = segments.find(segment => segment.lane === 'rain');
  assert.equal(temp.date, '2026-10-12');
  assert.deepEqual([temp.startMinute, temp.endMinute], [0, 60]);
  assert.equal(rain.date, '2026-10-11');
  assert.deepEqual([rain.startMinute, rain.endMinute], [1380, 1440]);
});
test('calendar mapping works across date boundaries and fractional-offset zones', () => {
  const segments = core.stripSegments([sample('2026-10-12T18:00:00Z', 20, null)], 'Asia/Kolkata');
  assert.deepEqual(segments.map(s => [s.date, s.startMinute, s.endMinute]), [
    ['2026-10-12', 1410, 1440], ['2026-10-13', 0, 30]
  ]);
});
test('spring-forward skips the missing wall-clock hour', () => {
  const segments = core.stripSegments([
    sample('2026-03-08T09:00:00Z', 15, null), sample('2026-03-08T10:00:00Z', 16, null)
  ], 'America/Los_Angeles');
  assert.deepEqual(segments.map(s => [s.startMinute, s.endMinute]), [[60, 120], [180, 240]]);
});
test('fall-back preserves both readings by splitting repeated wall-clock lanes', () => {
  const segments = core.stripSegments([
    sample('2026-11-01T08:00:00Z', 15, null), sample('2026-11-01T09:00:00Z', 14, null)
  ], 'America/Los_Angeles');
  assert.deepEqual(segments.map(s => [s.startMinute, s.endMinute, s.slot, s.slots]), [
    [60, 120, 0, 2], [60, 120, 1, 2]
  ]);
});
test('missing samples and unknown timezone do not produce invented segments', () => {
  assert.deepEqual(core.stripSegments([sample('2026-10-12T07:00:00Z', null, null)], 'UTC'), []);
  assert.deepEqual(core.stripSegments([{time: '07:00', temperature: 20}], 'UTC'), []);
  assert.deepEqual(core.stripSegments([sample('2026-10-12T07:00:00Z')], 'bogus'), []);
});
test('half-hour DST repeats divide only overlapping ranges into matching lane slots', () => {
  const segments = core.stripSegments([
    sample('2026-04-04T14:00:00Z', 15, null), sample('2026-04-04T15:00:00Z', 14, null)
  ], 'Australia/Lord_Howe');
  const repeated = segments.filter(s => s.startMinute === 90 && s.endMinute === 120);
  assert.equal(repeated.length, 2);
  assert.deepEqual(repeated.map(s => [s.slot, s.slots]), [[0, 2], [1, 2]]);
  assert.ok(segments.filter(s => s.endMinute <= 90 || s.startMinute >= 120).every(s => s.slots === 1));
});
test('temperature palette clamps extremes and leaves missing values empty', () => {
  assert.equal(core.temperatureColor(null), null);
  assert.equal(core.temperatureColor(-50), core.temperatureColor(-10));
  assert.equal(core.temperatureColor(80), core.temperatureColor(40));
  assert.notEqual(core.temperatureColor(0), core.temperatureColor(30));
});
test('time-grid scale follows scrolling and rejects unequal or incomplete hour rows', () => {
  const rows = Array.from({length: 24}, (_, i) => ({top: -120 + i * 40, height: 40}));
  assert.deepEqual(core.timeGridScale(rows), {midnightY: -120, pixelsPerMinute: 2 / 3});
  const scrolled = rows.map(row => ({...row, top: row.top - 200}));
  assert.equal(core.timeGridScale(scrolled).midnightY, -320);
  assert.equal(core.timeGridScale(rows.slice(1)), null);
  assert.equal(core.timeGridScale(rows.map((row, i) => i === 4 ? {...row, top: row.top + 10} : row)), null);
  const lines = rows.map(row => ({...row, height: 1, top: row.top + 40}));
  assert.deepEqual(core.timeGridScale(lines, -120), {midnightY: -120, pixelsPerMinute: 2 / 3});
});
