# Chrome Web Store Listing Draft

## Name

Calendar Weather Overlay

## Short description

See daily forecasts and hourly temperature and precipitation strips directly in Google Calendar.

## Detailed description

Plan your day with weather alongside your schedule.

Calendar Weather Overlay adds daily weather summaries to Google Calendar's week, rolling multi-day, and month views. See conditions, high and low temperatures, and precipitation probability without switching tabs. Click a summary to see hourly temperature, precipitation probability, and wind.

Enable optional vertical weather strips to see hourly temperature colors and a blue precipitation lane along each day column. The strips stay visible over events while letting clicks and dragging pass through.

Features:
- Search for a city and select the matching region and country.
- Choose Celsius or Fahrenheit; wind is shown in km/h.
- Set Calendar's primary time zone to align hourly strips with its time grid.
- Keep your settings and forecast cache on your device.
- Retain clearly marked cached forecasts when a refresh fails.
- Turn weather overlays or hourly strips off from the extension popup.

Weather comes directly from Open-Meteo. City searches, selected coordinates, and the city's time zone are sent to the weather provider, which also receives your IP address. There is no developer-operated server, analytics, advertising, registration, or Google Calendar API connection. Calendar event titles and descriptions are not used or transmitted.

Setup: select a city from the extension popup, then reload Google Calendar. For strips, enable the toggle and enter your Calendar primary IANA time zone, such as America/Los_Angeles.

Daily summaries and hourly details use the selected city's dates/time zone. Strips use the Calendar time zone you configure. Forecasts are limited to available weather data. English Calendar is supported initially; future changes to Google's interface may require extension updates.

Weather data: Open-Meteo, CC BY 4.0. This is an independent extension, not affiliated with or endorsed by Google.

## Dashboard fields

- Language: English.
- Suggested category: News & Weather (use the closest available dashboard category).
- Single purpose: Display weather forecasts alongside dates and hourly schedules in Google Calendar.
- Website/source URL: https://github.com/vit-lebediev/chrome-extension-google-calendar-weather (verify public access before submission). No license file exists yet; select a license before describing the project as openly licensed.
- Support contact: `vit.lebediev@gmail.com`.
- Privacy policy URL: https://github.com/vit-lebediev/chrome-extension-google-calendar-weather/blob/main/store/privacy-policy.md (after committing/pushing the file and verifying access while signed out).

## Permission justifications

- `storage`: Save the manually selected city/coordinates/time zone, units, Calendar time zone, overlay settings, and latest forecast cache locally. Chrome sync is not used.
- `calendar.google.com`: Read visible date markers and date accessibility labels, measure the time grid, and insert weather overlays. Calendar event contents are not needed, and no Calendar information is sent to external services.
- `api.open-meteo.com`: Retrieve daily/hourly forecasts for the user-selected coordinates and city time zone over HTTPS.
- `geocoding-api.open-meteo.com`: Search cities entered by the user and return distinguishable city/region/country results.
- Remote code: No. All executable code is included in the ZIP. HTTPS responses are weather/geocoding JSON data only.

## Data disclosures

Declare **Location**: the selected city's coordinates are stored locally and sent to Open-Meteo for forecasts. There is no GPS permission or automatic location detection. Explain city-query text and provider-visible IP addresses in the policy.

Declare **Website content** for the Calendar date labels and layout information handled locally to place overlays; no event content or page data is transmitted or retained in the forecast cache. This disclosure describes local page handling, not a server collection of calendar contents.

The extension does not collect names/emails, passwords/authentication tokens, financial information, health information, browsing history, or user interaction telemetry. Certifications: data is not sold; use is limited to this weather feature; data is not used for creditworthiness or lending. Review the current dashboard wording against the implementation and policy before certifying.

Reference: [Chrome privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy).
