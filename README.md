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

Forecasts use the selected city's IANA time zone, including seasonal offset changes. A Calendar date displays that same civil date's weather in the selected city. Hourly details use city-local time, explicitly labeled; they are not mapped to Calendar's primary or secondary time axis. Forecasts cover up to 16 days; past dates and dates beyond coverage have no weather button.

Data is refreshed on demand after one hour. Failed refreshes retain a matching cached forecast with a cached-data indicator. Retry using the bottom-right weather status control. Unavailable individual values appear as `—`.

## Privacy and permissions

- The content script runs only on `calendar.google.com`. It reads date markers and date accessibility labels to position weather; it does not process event contents or send them anywhere. Calendar host access technically allows page access, so review the source rather than treating this as a browser-enforced event-data boundary.
- `storage` stores your city, coordinates, time zone, units, enabled setting, and the latest forecast locally. Chrome sync is not used.
- Network access is limited to `api.open-meteo.com` and `geocoding-api.open-meteo.com`. City searches go to the latter; coordinates and city time zone go to the former. The provider also sees your IP address.
- No analytics, Google OAuth, calendar API, automatic geolocation, or remote executable code. Browser location is a planned opt-in addition.

Weather data is provided by [Open-Meteo](https://open-meteo.com/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Consult its [API terms](https://open-meteo.com/en/terms) before commercial use or distribution.

## Development

Use a current Node.js release (Node 20 or newer) for the dependency-free checks:

```sh
npm test
npm run check
```

Tests cover inferred Calendar date keys, month/year boundaries, leap days, accessible-label agreement, missing forecast data, repeated local hours, units, location validation, cache expiration, concurrent requests, offline fallback, and message restrictions. `check` verifies JavaScript syntax and manifest file paths. No package installation is needed.

`src/` contains shared weather/date functions, the service worker, Calendar adapter, content renderer, and settings popup. `tests/` contains Node tests; `plans/weather-overlay.md` tracks stages and verification. `scripts/` contains development checks.

## Current limitations and manual verification

This is a first implementation based on supplied Calendar HTML. It has **not yet been verified in a live, signed-in Calendar session**. Month layout relies on Google's current classes; date-key encoding is inferred and cross-checked against English date labels. English Calendar is supported initially. Unknown layouts or inconsistent labels omit weather instead of guessing. Day view is not a priority, although its header may be recognized. Hourly gradients are deferred.

Validate these before relying on the overlay:

- Load the extension and select a city; reopen the popup to confirm preferences persist.
- Check rolling 7-day, standard Week, and Month, including adjacent-month cells and a year boundary. Confirm weather stays under the correct dates after navigation and switching views.
- Confirm summaries do not cover date numbers, events, all-day events, or overflow controls. Test narrow windows, scrolling, and light/dark Calendar themes.
- Click, create, edit, and drag events. Tab to a weather button, open details, and dismiss with Escape; focus should return to the button.
- Change city/units and disable/re-enable; no old-city forecasts or duplicate buttons should remain.
- Go offline with an expired cache and retry; cached values should be identified. Change city while offline; old-city forecasts must not appear.
- Select a city in another time zone and verify the labeled local-day policy, including daylight-saving boundaries.

If no buttons appear, check that your selected city has a forecast for the visible dates. If status says **unsupported layout**, capture only date-header HTML for adapter repair. For errors, inspect the extension's service worker from `chrome://extensions`. Avoid including personal events in diagnostic exports.
