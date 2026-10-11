const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createReservations} = require('../src/summary-layout.js');

function row(value = '', priority = '') {
  let writes = 0;
  return {get writes() { return writes; }, style: {
    getPropertyValue: () => value,
    getPropertyPriority: () => priority,
    setProperty(name, next, nextPriority) { assert.equal(name, 'margin-top'); value = next; priority = nextPriority; writes++; },
    removeProperty(name) { assert.equal(name, 'margin-top'); value = ''; priority = ''; writes++; }
  }};
}
test('repeated observer passes never accumulate reserved height', () => {
  const reservations = createReservations();
  const element = row();
  reservations.reserve(element, '4px');
  for (let i = 0; i < 100; i++) {
    reservations.restoreExcept(new Set([element]));
    reservations.reserve(element, element.style.getPropertyValue('margin-top'));
  }
  assert.equal(element.style.getPropertyValue('margin-top'), '38px');
  assert.equal(element.writes, 1);
});
test('disabling or leaving the view restores original inline value and priority', () => {
  const reservations = createReservations();
  const element = row('3px', 'important');
  reservations.reserve(element, '3px');
  reservations.restoreExcept(new Set());
  assert.equal(element.style.getPropertyValue('margin-top'), '3px');
  assert.equal(element.style.getPropertyPriority('margin-top'), 'important');
  reservations.reserve(element, '3px');
  assert.equal(element.style.getPropertyValue('margin-top'), '37px');
});
test('replaced DOM nodes release the previous reservation without inheriting it', () => {
  const reservations = createReservations();
  const previous = row(); const replacement = row();
  reservations.reserve(previous, '0px');
  reservations.restoreExcept(new Set([replacement]));
  reservations.reserve(replacement, '0px');
  assert.equal(previous.style.getPropertyValue('margin-top'), '');
  assert.equal(replacement.style.getPropertyValue('margin-top'), '34px');
});
