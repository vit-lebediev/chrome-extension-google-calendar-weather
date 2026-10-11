const el = id => document.getElementById(id);
let settings;
let saveQueue = Promise.resolve();
function save() {
  const snapshot = structuredClone(settings);
  saveQueue = saveQueue.catch(() => {}).then(() => chrome.storage.local.set({settings: snapshot}));
  return saveQueue;
}
function showLocation() {
  el('location').textContent = settings.location ? `${settings.location.label} · ${settings.location.timezone}` : 'No city selected.';
}
async function init() {
  const stored = await chrome.storage.local.get('settings');
  settings = {...WeatherCore.defaults, ...stored.settings};
  el('enabled').checked = settings.enabled;
  el('units').value = settings.units;
  el('strips').checked = settings.hourlyStrips;
  el('calendar-timezone').value = settings.calendarTimezone;
  for (const zone of Intl.supportedValuesOf('timeZone')) {
    const option = document.createElement('option'); option.value = zone; el('timezones').append(option);
  }
  showLocation();
  el('enabled').addEventListener('change', () => { settings.enabled = el('enabled').checked; save().catch(report); });
  el('units').addEventListener('change', () => { settings.units = el('units').value; save().catch(report); });
  el('strips').addEventListener('change', () => { settings.hourlyStrips = el('strips').checked; save().catch(report); });
  el('calendar-timezone').addEventListener('change', () => {
    const value = el('calendar-timezone').value.trim();
    if (value && !WeatherCore.validTimezone(value)) {
      el('status').textContent = 'Enter a valid time zone, such as America/Los_Angeles.';
      el('calendar-timezone').setAttribute('aria-invalid', 'true'); return;
    }
    el('calendar-timezone').removeAttribute('aria-invalid');
    settings.calendarTimezone = value;
    save().then(() => { el('status').textContent = 'Calendar time zone saved.'; }).catch(report);
  });
  el('search').addEventListener('submit', async event => {
    event.preventDefault();
    el('search-button').disabled = true;
    el('results').replaceChildren();
    el('status').textContent = 'Searching…';
    try {
      const result = await chrome.runtime.sendMessage({type: 'searchCity', query: el('city').value});
      if (!result?.ok) throw new Error(result?.error || 'Search failed.');
      el('status').textContent = result.data.length ? 'Select a city:' : 'No cities found. Try another name.';
      for (const location of result.data) {
        const button = document.createElement('button');
        button.textContent = location.label;
        button.addEventListener('click', async () => {
          settings.location = location;
          try {
            await save(); showLocation(); el('results').replaceChildren(); el('status').textContent = 'City saved.';
          } catch (error) { report(error); }
        });
        el('results').append(button);
      }
    } catch (error) { report(error); }
    finally { el('search-button').disabled = false; }
  });
}
function report(error) { el('status').textContent = error.message; }
init().catch(report);
