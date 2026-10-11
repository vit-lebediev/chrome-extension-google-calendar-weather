(function (root) {
  function discover(doc = document) {
    const main = doc.querySelector('[role="main"]') || doc.querySelector('main');
    if (!main) return [];
    const headers = [...main.querySelectorAll('[role="columnheader"]')];
    const week = headers.flatMap(header => {
      const button = header.querySelector('button[data-datekey]');
      const date = button && WeatherCore.decodeDateKey(button.dataset.datekey);
      return date && WeatherCore.matchesDateLabel(date, button.getAttribute('aria-label')) ? [{date, anchor: header, mode: 'week'}] : [];
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
  root.CalendarAdapter = {discover};
  if (typeof module !== 'undefined') module.exports = root.CalendarAdapter;
})(globalThis);
