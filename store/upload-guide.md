# Chrome Web Store Upload Guide

## Prepared files

- Upload ZIP: `dist/calendar-weather-overlay-0.1.0.zip`.
- SHA-256 checksum: the adjacent `.zip.sha256` file.
- Store icon: `assets/icon-128.png` (transparent padding; 128×128).
- Small promotional tile: `store/assets/promo-440x280.png` (440×280).
- Listing and dashboard text: `store/listing.md`.
- Privacy policy draft: `store/privacy-policy.md`.

The tile is promotional artwork, not a screenshot. The ZIP includes only the manifest, runtime source, icons, and license; store materials, tests, plans, Git metadata, and development scripts are excluded. The ZIP is deterministic for identical runtime inputs. It is an unsigned ZIP for store upload, not a locally packed CRX.

## Remaining materials

1. Capture at least one actual-use screenshot at **1280×800 or 640×400**, with square corners and no added padding. Prefer a clean test calendar with sample events. Show the daily summaries and strips; a second month-view screenshot and a settings screenshot are useful. Save them under `store/assets/`. The personal screenshots from development have not been republished or repurposed.
2. Use the confirmed public support/privacy contact: `vit.lebediev@gmail.com`. It is already included in the policy.
3. Commit and push `store/privacy-policy.md` to the public GitHub repository. Use this URL after verifying it loads while signed out:
   `https://github.com/vit-lebediev/chrome-extension-google-calendar-weather/blob/main/store/privacy-policy.md`.
   A rendered public Markdown page provides the policy without separate website hosting. GitHub Pages is an optional alternative if you want a dedicated page. The policy is required even for local-only handling of user information. This task has not pushed files or verified that the remote repository/policy is publicly accessible.
4. Decide public versus unlisted distribution and publisher identity, and verify public repository access. The user-selected 0BSD license covers project code and original artwork and is included in the ZIP; weather-provider terms remain separate.
5. Keep the initial release noncommercial under the current free weather API terms. Before monetizing it, revisit the [Open-Meteo terms](https://open-meteo.com/en/terms) and provider integration; do not embed a paid secret in a distributed extension.

Image requirements: [Chrome Web Store images](https://developer.chrome.com/docs/webstore/images). Privacy requirements: [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

## Rebuild and smoke-test

```sh
npm run package
```

This runs tests and manifest/syntax checks before creating the ZIP. Icons are checked in; `npm run assets` regenerates icons and the promotional tile without external dependencies.

Extract the exact ZIP into a temporary folder and load that folder unpacked to test the packaged contents. Confirm city search, forecast loading, units, settings persistence, daily-summary spacing around all-day events, hourly-strip visibility/clipping, and clicking/dragging events through the strips. Check Week/rolling multi-day and Month, scrolling/resizing, and light/dark themes. Remaining offline, DST, and full interaction checks are tracked in the plan; automated tests alone do not verify Chrome layout.

## Upload

1. Register/sign in to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole). Complete account registration and any verification required by the dashboard.
2. Add a new item and upload the ZIP.
3. Fill Store Listing using the draft; upload the icon, promotional tile, and actual-use screenshots.
4. Fill Privacy practices with the single purpose, permission justifications, remote-code answer, data disclosures, and public policy URL. Confirm wording matches the released code.
5. Choose Distribution settings and complete the reviewer test instructions below.
6. Submit for review when ready. Select deferred publishing if you want to review approval before publishing. This task has not uploaded or submitted the extension.

Publishing steps: [Google's publishing guide](https://developer.chrome.com/docs/webstore/publish).

## Reviewer test instructions

No extension account or API key is required. Google Calendar requires the reviewer's own Google account; no publisher credentials are supplied.

1. Open the extension popup, search for Los Angeles, and select California, United States.
2. Open Google Calendar in English, choose the current Week or a rolling multi-day view, and reload the page. Current dates within forecast coverage display daily weather buttons.
3. Click a daily weather button to open hourly details.
4. In the popup, enable hourly strips and enter the primary time zone configured in Calendar (for example America/Los_Angeles). Strips appear along each time-grid day's left edge; they do not intercept event clicks.
5. Switch to Month to see daily summaries. Toggle units and disable the overlay from the popup to confirm those controls.
