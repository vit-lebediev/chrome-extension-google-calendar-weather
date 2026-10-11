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
  showLocation();
  el('enabled').addEventListener('change', () => { settings.enabled = el('enabled').checked; save().catch(report); });
  el('units').addEventListener('change', () => { settings.units = el('units').value; save().catch(report); });
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
