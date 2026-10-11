(function (root) {
  function discover(doc = document) {
    const main = doc.querySelector('[role="main"]') || doc.querySelector('main');
    if (!main) return [];
    const headers = [...main.querySelectorAll('[role="columnheader"]')];
    const week = headers.flatMap(header => {
      const button = header.querySelector('button[data-datekey]');
      const date = button && WeatherCore.decodeDateKey(button.dataset.datekey);
      const headerRow = header.closest('[role="row"]');
      const allDayRow = headerRow?.parentElement.querySelector('[jsname="sZR1Lb"][role="row"]');
      return date && WeatherCore.matchesDateLabel(date, button.getAttribute('aria-label')) ?
        [{date, anchor: header, dateAnchor: button.closest('h2') || button, headerRow, allDayRow, mode: 'week'}] : [];
    });
    if (week.length) return week;
    // Month dates and events are separate layers. Target only the date heading layer.
    return [...main.querySelectorAll('.FLFkR')].flatMap(row => {
      const headings = [...row.querySelectorAll('.umyEjb h2[data-datekey]')];
      const cells = [...row.querySelectorAll('[role="gridcell"]')];
      if (headings.length !== cells.length) return [];
      return headings.flatMap((heading, index) => {
        const date = WeatherCore.decodeDateKey(heading.dataset.datekey);
        const labelId = cells[index].getAttribute('aria-labelledby');
        const label = labelId && doc.getElementById(labelId)?.textContent;
        return date && WeatherCore.matchesDateLabel(date, label) ? [{date, anchor: heading.parentElement, mode: 'month'}] : [];
      });
    });
  }
  function discoverTimeGrid(doc = document) {
    const main = doc.querySelector('[role="main"]') || doc.querySelector('main');
    if (!main) return null;
    for (const grid of main.querySelectorAll('[data-start-date-key][data-end-date-key]')) {
      const row = grid.querySelector('.Tmdkcc');
      const hours = row && [...row.querySelectorAll('.aLC8Le > .sJ9Raf')];
      if (!hours || hours.length !== 24) continue;
      const hourRects = hours.map(hour => hour.getBoundingClientRect());
      const scale = WeatherCore.timeGridScale(hourRects, row.getBoundingClientRect().top);
      if (!scale) continue;
      const columns = [...row.querySelectorAll('[role="gridcell"][data-column-index][data-datekey]')].flatMap(cell => {
        const date = WeatherCore.decodeDateKey(cell.dataset.datekey);
        const label = doc.getElementById(cell.getAttribute('aria-labelledby'))?.textContent;
        const rect = cell.getBoundingClientRect();
        return date && WeatherCore.matchesDateLabel(date, label) && rect.width > 0 ? [{date, rect}] : [];
      });
      if (!columns.length) continue;
      const bounds = grid.getBoundingClientRect();
      const view = doc.defaultView;
      const clip = {left: Math.max(0, bounds.left), right: Math.min(view.innerWidth, bounds.right),
        top: Math.max(0, bounds.top), bottom: Math.min(view.innerHeight, bounds.bottom)};
      // A scroller may be this grid or an ancestor; intersect every clipping box.
      for (let ancestor = row.parentElement; ancestor; ancestor = ancestor.parentElement) {
        const style = view.getComputedStyle(ancestor);
        const rect = ancestor.getBoundingClientRect();
        if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
          clip.top = Math.max(clip.top, rect.top + ancestor.clientTop);
          clip.bottom = Math.min(clip.bottom, rect.top + ancestor.clientTop + ancestor.clientHeight);
        }
        if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
          clip.left = Math.max(clip.left, rect.left + ancestor.clientLeft);
          clip.right = Math.min(clip.right, rect.left + ancestor.clientLeft + ancestor.clientWidth);
        }
      }
      if (clip.bottom <= clip.top || clip.right <= clip.left) continue;
      return {columns, clip, ...scale};
    }
    return null;
  }
  root.CalendarAdapter = {discover, discoverTimeGrid};
  if (typeof module !== 'undefined') module.exports = root.CalendarAdapter;
})(globalThis);
