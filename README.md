# Calendar Weather Overlay

A small Manifest V3 Chrome extension that displays weather in Google Calendar's week, rolling 7-day, and month views. It uses plain JavaScript with no runtime dependencies, accounts, API keys, or application server.

## Install locally

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this repository folder (the folder containing `manifest.json`).
3. Pin **Calendar Weather Overlay** using Chrome's Extensions menu.
4. Click its icon, search for your city, and select the matching region/country.
5. Open or reload [Google Calendar](https://calendar.google.com/). Select **7 days**, **Week**, or **Month**.

After editing extension files, click **Reload** on its card in `chrome://extensions`, then reload Calendar. No build step is required.

## Features and date behavior

Daily buttons show weather conditions, high/low temperature, and the maximum hourly precipitation probability. Click a button for hourly temperature, precipitation probability, and wind. Temperatures support Celsius/Fahrenheit; wind uses km/h. Disable the overlay from the popup.

Daily summaries use the selected city's civil dates; provider daily totals follow its returned daily boundaries. Hourly details convert absolute timestamps into the city's IANA time zone, including seasonal offset changes; they are not mapped to Calendar's primary or secondary time axis. Forecasts cover up to 16 future days plus two past days for time-zone boundary coverage. Dates beyond available data have no weather button or strip.

Data is refreshed on demand after one hour. Failed refreshes retain a matching cached forecast with a cached-data indicator. Retry using the bottom-right weather status control. Unavailable individual values appear as `—`.

### Vertical hourly strips

In the popup, enable **Show hourly weather strips** and enter your **Calendar primary time zone**, for example `America/Los_Angeles`. Match Google Calendar → Settings → Primary time zone; the browser's time zone and a displayed GMT offset are not used as substitutes. Strips start disabled and remain hidden until a valid zone is configured.

Week and rolling multi-day grids get a narrow strip along each day's left edge: a 4 px temperature lane beside a 2 px blue precipitation lane. Colors run from purple at −10°C through blue, teal, yellow, and orange to red at 40°C (14°F–104°F). The scale stays the same when changing units. The blue lane darkens with probability; 0% is a theme-aware neutral shade and missing samples leave gaps. Temperature represents the reading at the start of the hour; precipitation represents the preceding hour, as defined in the [provider documentation](https://open-meteo.com/en/docs).

Strips follow Calendar's configured primary time axis, including when the weather city's time zone differs. Repeated fall-back intervals split their lanes to retain both readings; missing spring-forward hours stay empty. Opaque strips start one pixel before the day-column edge to cover event slivers. They appear above timed events and let mouse actions pass through; existing daily buttons remain the way to open exact hourly values. Month summaries are unchanged. Unknown grid geometry suppresses strips and displays a status hint.

## Privacy and permissions

- The content script runs only on `calendar.google.com`. It reads date markers and date accessibility labels to position weather; it does not process event contents or send them anywhere. Calendar host access technically allows page access, so review the source rather than treating this as a browser-enforced event-data boundary.
- `storage` stores your city, coordinates, city and Calendar time zones, units, overlay/strip toggles, and the latest forecast locally. Chrome sync is not used. The Calendar time-zone setting is used locally to position strips.
- Network access is limited to `api.open-meteo.com` and `geocoding-api.open-meteo.com`. City searches go to the latter; coordinates and city time zone go to the former. The provider also sees your IP address.
- No analytics, Google OAuth, calendar API, automatic geolocation, or remote executable code. Browser location is a planned opt-in addition.

Weather data is provided by [Open-Meteo](https://open-meteo.com/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Consult its [API terms](https://open-meteo.com/en/terms) before commercial use or distribution.

## Development

Use a current Node.js release (Node 20 or newer) for the dependency-free checks:

```sh
npm test
npm run check
```

Tests cover inferred Calendar date keys, month/year boundaries, leap days, accessible-label agreement, missing forecast data, absolute timestamps, repeated/skipped DST hours, fractional-offset zones, scrolling geometry, palette bounds, units, location validation, cache expiration, concurrent requests, offline fallback, and message restrictions. `check` verifies JavaScript syntax and manifest file paths. No package installation is needed.

`src/` contains shared weather/date functions, the service worker, Calendar adapter, content renderer, and settings popup. `tests/` contains Node tests; `plans/weather-overlay.md` tracks stages and verification. `scripts/` contains development checks.

## Current limitations and manual verification

This implementation is based on supplied Calendar HTML. The user has checked the initial summaries and reported that they look good; **the new vertical strips still need live verification**. Month and hourly-grid layouts rely on Google's current classes; date-key encoding is inferred and cross-checked against English date labels. English Calendar is supported initially. Unknown layouts or inconsistent labels omit weather instead of guessing. Hourly strips use hourly color bands; smooth interpolation is not implemented. Day view is not a priority, although its header may be recognized.

Validate these before relying on the overlay:

- Load the extension and select a city; reopen the popup to confirm preferences persist.
- Check rolling 7-day, standard Week, and Month, including adjacent-month cells and a year boundary. Confirm weather stays under the correct dates after navigation and switching views.
- Confirm summaries do not cover date numbers, events, all-day events, or overflow controls. Test narrow windows, scrolling, and light/dark Calendar themes.
- Click, create, edit, and drag events. Tab to a weather button, open details, and dismiss with Escape; focus should return to the button.
- Change city/units and disable/re-enable; no old-city forecasts or duplicate buttons should remain.
- Go offline with an expired cache and retry; cached values should be identified. Change city while offline; old-city forecasts must not appear.
- Select a city in another time zone and verify the labeled local-day policy, including daylight-saving boundaries.
- Enable strips and set Calendar's primary IANA zone. Check alignment at morning/evening hours, after scrolling and resizing, and across view switches. Verify strips remain below all-day events and do not prevent event selection, dragging, or resizing.
- Turn strips off/on independently; daily summaries should remain. Check the legend and colors in both themes. Change the Calendar zone setting when changing Calendar's actual primary time zone.

If no buttons appear, check that your selected city has a forecast for the visible dates. If status says **unsupported layout**, capture only date-header HTML for adapter repair. For errors, inspect the extension's service worker from `chrome://extensions`. Avoid including personal events in diagnostic exports.

## Store packaging

Run `npm run package` to run checks and generate `dist/calendar-weather-overlay-0.1.0.zip` plus its SHA-256 checksum. This archive includes only the manifest, runtime files, and icons. Store listing drafts, privacy policy, and the promotional tile are in `store/`; follow [the upload guide](store/upload-guide.md) for remaining screenshots, policy hosting, packaged smoke tests, and dashboard fields. `npm run assets` regenerates the code-drawn artwork. No upload or publication is performed by these commands.
