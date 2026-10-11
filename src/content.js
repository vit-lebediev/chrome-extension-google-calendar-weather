(() => {
  const core = WeatherCore;
  const host = document.createElement('div');
  host.id = 'calendar-weather-overlay';
  const shadow = host.attachShadow({mode: 'open'});
  shadow.innerHTML = `<style>
    :host { all: initial; font-family: system-ui,sans-serif; color-scheme: light dark; }
    * { box-sizing: border-box; }
    button { font: 12px system-ui; cursor: pointer; border: 1px solid #80808055; border-radius: 6px; color: CanvasText; background: Canvas; padding: 2px 5px; }
    button:hover { border-color: #669fdf; }
    button:focus-visible { outline: 2px solid #669fdf; outline-offset: 2px; }
    .weather { position: fixed; z-index: 50; height: 22px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .month { font-size: 10px; padding: 2px; }
    #strips { position: fixed; z-index: 1; pointer-events: none; overflow: hidden; }
    .strip-segment { position: absolute; pointer-events: none; }
    .status { position: fixed; bottom: 14px; right: 76px; z-index: 50; max-width: 300px; font-size: 12px; }
    dialog { position: fixed; margin: auto; color: CanvasText; background: Canvas; border: 1px solid #8888; border-radius: 12px; padding: 18px; width: min(440px,90vw); max-height: 75vh; font: 13px system-ui; }
    dialog::backdrop { background: #0005; }
    h2 { font-size: 18px; margin: 0 0 8px; } p { line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; } th,td { text-align: left; padding: 6px; border-bottom: 1px solid #8884; }
    .scroll { max-height: 40vh; overflow: auto; } .close { float: right; } a { color: #659ee8; }
  </style><div id="strips" aria-hidden="true"></div><div id="widgets"></div><button class="status" hidden></button><dialog aria-label="Weather forecast"></dialog>`;
  document.body.append(host);
  const widgets = shadow.querySelector('#widgets');
  const strips = shadow.querySelector('#strips');
  const status = shadow.querySelector('.status');
  const dialog = shadow.querySelector('dialog');
  const summaryRows = WeatherSummaryLayout.createReservations();
  let settings = core.defaults;
  let forecast = null;
  let error = '';
  let loading = false;
  let generation = 0;
  let entries = [];
  let scheduled = false;
  let segmentSource = null;
  let segmentTimezone = '';
  let segments = [];
  let stripSignature = '';
  let stripNodes = [];

  function node(tag, text) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    return element;
  }
  const percent = value => Number.isFinite(value) ? `${Math.round(value)}%` : '—';
  function details(date) {
    const day = forecast?.data.days[date];
    if (!day) return;
    dialog.replaceChildren();
    const close = node('button', 'Close');
    close.className = 'close'; close.autofocus = true;
    close.addEventListener('click', () => dialog.close());
    dialog.append(close, node('h2', `${core.condition(day.code)[0]} ${date}`),
      node('p', `${settings.location.label} · ${core.condition(day.code)[1]}`),
      node('p', `High ${core.temperature(day.high, settings.units)} / Low ${core.temperature(day.low, settings.units)}${settings.units === 'fahrenheit' ? 'F' : 'C'} · Precipitation ${percent(day.rain)}`),
      node('p', `Hours and daily totals use ${forecast.data.timezone}, the selected city's time zone.`));
    if (forecast.stale) dialog.append(node('p', 'Cached forecast: refresh failed. Values may be out of date.'));
    dialog.append(node('p', `Fetched ${new Date(forecast.fetchedAt).toLocaleString()}`));
    const table = node('table');
    const head = node('thead'); const headings = node('tr');
    for (const title of ['Local time', 'Temperature', 'Precip.', 'Wind km/h']) {
      const th = node('th', title); th.scope = 'col'; headings.append(th);
    }
    head.append(headings); table.append(head);
    const body = node('tbody');
    for (const hour of day.hours) {
      const row = node('tr');
      for (const value of [hour.time, core.temperature(hour.temperature, settings.units), percent(hour.rain), Number.isFinite(hour.wind) ? String(Math.round(hour.wind)) : '—']) row.append(node('td', value));
      body.append(row);
    }
    table.append(body);
    const scroll = node('div'); scroll.className = 'scroll'; scroll.append(table);
    const attribution = node('a', 'Weather data: Open-Meteo (CC BY 4.0)');
    attribution.href = 'https://open-meteo.com/'; attribution.target = '_blank'; attribution.rel = 'noreferrer';
    dialog.append(scroll, node('p', 'Precipitation is the maximum hourly probability for this day.'),
      node('p', 'Strip legend: temperature purple → blue → teal → yellow → orange → red (−10°C to 40°C / 14°F to 104°F). Adjacent blue lane: darker means higher precipitation probability. Repeated DST hours split each lane; gaps mean missing data.'), attribution);
    if (!dialog.open) dialog.showModal();
  }
  dialog.addEventListener('click', event => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right || event.clientY < dialog.getBoundingClientRect().top || event.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); });
  status.addEventListener('click', () => {
    if ((error || forecast?.stale) && settings.location) load().catch(() => {});
    else {
      dialog.replaceChildren(node('p', 'Choose your city or change preferences using the Calendar Weather extension icon in Chrome.'));
      const close = node('button', 'Close'); close.addEventListener('click', () => dialog.close()); dialog.append(close); dialog.showModal();
    }
  });

  function layoutStrips(targets) {
    strips.hidden = true;
    if (!settings.enabled || !settings.hourlyStrips || !forecast || !targets.some(target => target.mode === 'week')) {
      strips.replaceChildren(); stripNodes = []; stripSignature = ''; return '';
    }
    if (!core.validTimezone(settings.calendarTimezone)) return 'Set Calendar time zone for strips';
    const grid = CalendarAdapter.discoverTimeGrid();
    if (!grid) return 'Hourly grid not recognized';
    if (segmentSource !== forecast.data || segmentTimezone !== settings.calendarTimezone) {
      segments = core.stripSegments(forecast.data.hours, settings.calendarTimezone);
      segmentSource = forecast.data; segmentTimezone = settings.calendarTimezone;
      stripSignature = '';
    }
    const visible = segments.filter(segment => grid.columns.some(column => column.date === segment.date));
    const signature = JSON.stringify(grid.columns.map(column => column.date));
    if (signature !== stripSignature) {
      stripNodes = visible.map(segment => {
        const element = node('div'); element.className = 'strip-segment';
        const color = segment.lane === 'temperature' ? core.temperatureColor(segment.value) : `rgba(40,120,230,${.12 + .88 * segment.value / 100})`;
        element.style.backgroundColor = color;
        element.style.opacity = forecast.stale ? '.4' : '.75';
        return {segment, element};
      });
      strips.replaceChildren(...stripNodes.map(item => item.element));
      stripSignature = signature;
    }
    const {clip} = grid;
    strips.style.left = `${clip.left}px`; strips.style.top = `${clip.top}px`;
    strips.style.width = `${clip.right - clip.left}px`; strips.style.height = `${clip.bottom - clip.top}px`;
    for (const {segment, element} of stripNodes) {
      const column = grid.columns.find(column => column.date === segment.date);
      const laneWidth = segment.lane === 'temperature' ? 4 : 2;
      const laneOffset = segment.lane === 'temperature' ? 0 : 4;
      element.style.left = `${column.rect.left + 1 + laneOffset + segment.slot * laneWidth / segment.slots - clip.left}px`;
      element.style.width = `${laneWidth / segment.slots}px`;
      element.style.top = `${grid.midnightY + segment.startMinute * grid.pixelsPerMinute - clip.top}px`;
      element.style.height = `${(segment.endMinute - segment.startMinute) * grid.pixelsPerMinute}px`;
    }
    strips.hidden = !stripNodes.length;
    return '';
  }
  function layout() {
    scheduled = false;
    const targets = settings.enabled ? CalendarAdapter.discover() : [];
    // Calendar's theme can differ from the operating system's preferred theme.
    let themeNode = document.querySelector('[role="main"]') || document.body;
    let scheme = '';
    while (themeNode) {
      const color = getComputedStyle(themeNode).backgroundColor.match(/[\d.]+/g)?.map(Number);
      if (color && color.length >= 3 && (color.length < 4 || color[3] > 0)) {
        scheme = (color[0] * .2126 + color[1] * .7152 + color[2] * .0722) < 128 ? 'dark' : 'light';
        break;
      }
      themeNode = themeNode.parentElement;
    }
    if (host.style.colorScheme !== scheme) host.style.colorScheme = scheme;
    const weekTargets = targets.filter(target => target.mode === 'week' && target.headerRow && target.allDayRow);
    const active = new Set(weekTargets.map(target => target.allDayRow));
    summaryRows.restoreExcept(active);
    for (const row of active) {
      summaryRows.reserve(row, getComputedStyle(row).marginTop);
    }
    const same = entries.length === targets.length && targets.every((target, i) => entries[i].date === target.date && entries[i].anchor === target.anchor);
    if (!same) {
      widgets.replaceChildren();
      entries = targets.map(target => {
        const button = node('button'); button.className = `weather ${target.mode}`;
        button.addEventListener('click', event => { event.stopPropagation(); details(target.date); });
        widgets.append(button);
        return {...target, button};
      });
    }
    for (const entry of entries) {
      const day = forecast?.data.days[entry.date];
      const rect = entry.anchor.getBoundingClientRect();
      const width = entry.mode === 'month' ? Math.max(0, rect.width / 2 - 22) : Math.max(0, rect.width - 12);
      const outside = rect.bottom <= 72 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth;
      const current = targets.find(target => target.anchor === entry.anchor);
      const dateBottom = current?.dateAnchor?.getBoundingClientRect().bottom;
      const allDayTop = current?.allDayRow?.getBoundingClientRect().top;
      const top = entry.mode === 'month' ? rect.top + 2 : allDayTop - 28;
      const safe = entry.mode === 'month' || (Number.isFinite(top) && top >= dateBottom + 4 && top + 22 <= allDayTop - 2);
      entry.button.hidden = !day || outside || width < 48 || !safe;
      entry.button.style.left = `${rect.left + 4}px`;
      entry.button.style.top = `${top}px`;
      entry.button.style.width = `${width}px`;
      if (day) {
        const text = `${core.condition(day.code)[0]} ${core.temperature(day.high, settings.units)}/${core.temperature(day.low, settings.units)}${settings.units === 'fahrenheit' ? 'F' : 'C'} · ${percent(day.rain)}${forecast.stale ? ' ⏱' : ''}`;
        entry.button.textContent = text;
        entry.button.title = `${settings.location.label}: ${text}. ${core.condition(day.code)[1]}. Click for hourly forecast.${forecast.stale ? ' Cached data; refresh failed.' : ''}`;
        entry.button.setAttribute('aria-label', `${entry.date}: ${entry.button.title}`);
      }
    }
    status.hidden = !settings.enabled;
    const stripNotice = layoutStrips(targets);
    status.textContent = !settings.location ? 'Weather: choose a city' : loading ? 'Weather: loading…' : error ? 'Weather unavailable · retry' : !targets.length ? 'Weather: unsupported layout' : forecast?.stale ? 'Weather: cached forecast · retry' : `Weather: ${settings.location.label}`;
    if (stripNotice) status.textContent += ` · ${stripNotice}`;
    status.title = error || `Weather uses the selected city’s local dates. ${stripNotice || 'Open extension settings to change your city.'}`;
  }
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(layout); } }
  async function load() {
    const current = ++generation;
    const stored = await chrome.storage.local.get('settings');
    if (current !== generation) return;
    const previousKey = settings.location && core.cacheKey(settings.location);
    settings = {...core.defaults, ...stored.settings};
    if (!core.validLocation(settings.location)) settings.location = null;
    const nextKey = settings.location && core.cacheKey(settings.location);
    if (previousKey !== nextKey || !settings.enabled) forecast = null;
    if (dialog.open) dialog.close();
    error = ''; loading = false; schedule();
    if (!settings.enabled || !settings.location) return;
    loading = true; schedule();
    try {
      const result = await chrome.runtime.sendMessage({type: 'forecast'});
      if (current !== generation) return;
      if (!result?.ok) throw new Error(result?.error || 'Weather request failed.');
      // Responses are accepted only for the currently selected location.
      if (result.data.key !== nextKey) return;
      forecast = result.data;
    } catch (failure) { if (current === generation) error = failure.message; }
    finally { if (current === generation) { loading = false; schedule(); } }
  }
  new MutationObserver(schedule).observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-datekey', 'data-start-date-key', 'data-end-date-key', 'aria-label', 'class', 'style']});
  addEventListener('resize', schedule);
  document.addEventListener('scroll', schedule, true);
  chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.settings) load().catch(() => {}); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load().catch(() => {}); });
  setInterval(() => { if (!document.hidden) load().catch(() => {}); }, 60 * 60 * 1000);
  load().catch(failure => { error = failure.message; schedule(); });
})();
