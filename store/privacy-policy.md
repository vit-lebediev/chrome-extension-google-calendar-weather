# Privacy Policy — Calendar Weather Overlay

Last updated: October 11, 2026.

## No developer data collection

Calendar Weather Overlay has no developer-operated server, analytics, advertising, or tracking. The developer does not receive your calendar data, city searches, location, or extension usage through the extension. No extension account is required. Data is not sold or used for advertising, creditworthiness, or lending.

## Local processing and storage

The extension reads Calendar date markers, date labels, and layout information to position weather overlays. Date labels may include event counts. This information stays on your device and is not retained in the forecast cache. Event titles, descriptions, participants, and authentication tokens are not used or transmitted.

Your selected city, coordinates, time zones, units, display settings, and latest forecast cache are stored locally using Chrome extension storage. The extension does not use Chrome sync. Settings remain until changed, cleared, or the extension is uninstalled; the cache is replaced by new forecasts and may remain during network failures.

## Weather-service requests

City search text is sent directly over HTTPS to Open-Meteo’s geocoding service. Forecast requests send the selected city’s coordinates and time zone directly to its weather service. Open-Meteo also receives your IP address. No Calendar information is included. GPS access and automatic location detection are not used.

Open-Meteo handles these requests under its own [terms and privacy information](https://open-meteo.com/en/terms). The developer does not control its request-log retention.

## Source transparency and control

You can inspect the [project source code](https://github.com/vit-lebediev/chrome-extension-google-calendar-weather), including network requests, permissions, and local storage behavior. Review the source corresponding to your installed extension version.

Change preferences in the popup. Disable or uninstall the extension through `chrome://extensions` to stop its activity. All data handled by the extension is used solely for its weather-overlay functionality, consistent with the Chrome Web Store User Data Policy, including Limited Use requirements.

## Contact and changes

Questions: [vit.lebediev@gmail.com](mailto:vit.lebediev@gmail.com). Contacting the developer voluntarily shares the information included in your message. This policy will be updated if data handling changes.
