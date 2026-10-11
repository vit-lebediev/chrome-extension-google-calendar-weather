(function (root) {
  function createReservations() {
    const rows = new Map();
    return {
      reserve(row, computedMargin) {
        if (rows.has(row)) return;
        rows.set(row, {value: row.style.getPropertyValue('margin-top'), priority: row.style.getPropertyPriority('margin-top')});
        // Capture the unmodified margin once. Never derive the next size from
        // geometry that our own style changes have already moved.
        row.style.setProperty('margin-top', `${(parseFloat(computedMargin) || 0) + 34}px`, 'important');
      },
      restoreExcept(active) {
        for (const [row, previous] of rows) {
          if (active.has(row)) continue;
          if (previous.value) row.style.setProperty('margin-top', previous.value, previous.priority);
          else row.style.removeProperty('margin-top');
          rows.delete(row);
        }
      }
    };
  }
  const api = {createReservations};
  root.WeatherSummaryLayout = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
