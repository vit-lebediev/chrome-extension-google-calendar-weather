# Google Calendar Weather Overlay — Implementation Plan

Status: First implementation written; automated checks pass. Live Chrome/Calendar acceptance checks are pending.
Last updated: 2026-10-11.

## Agreed Scope

- Prioritize week and month views. Day view is lower priority.
- Show weather condition, daily high/low temperature, and precipitation probability.
- Start with manual city selection; preserve a path to browser geolocation.
- Hourly gradients are optional and deferred until the basic overlay works.
- Use Open-Meteo for forecasts and city search, subject to its applicable terms.
- Build an inspectable Manifest V3 extension with plain JavaScript, HTML, and CSS, minimal dependencies, and no application server.
- Keep settings and forecast cache local. Do not send calendar content to external services or create calendar events.
- Support arbitrary time zones without hardcoded PST/PDT offsets; handle daylight-saving changes using IANA time-zone identifiers.

## Working Design

Week view gets a compact summary beneath each date; month view gets a compact summary within each day cell. Clicking a summary opens forecast details without triggering Calendar's event editor. Exact placement must be validated against the live interface in Stage 1.

Separate the calendar adapter, weather provider, location resolver, and rendering code. Both manual search and future browser geolocation resolve to a common location record: label, coordinates, time zone, and source. Forecast fetching accepts coordinates regardless of their source.

## Stage 1 — Validate Calendar Integration

Status: Completed — adapter design and time-zone policy established from supplied evidence. Live placement checks are tracked in Stages 4–6. Dependencies: plan approved.

Tasks:
- Inspect live week and month layouts and identify visible dates and safe insertion points.
- Check navigation, month boundaries, hidden weekends, locale, light/dark themes, and calendar time-zone behavior.
- Establish how forecast hours map to calendar dates, including when the selected city's time zone differs from Calendar's.
- Capture minimal, anonymized DOM fixtures where useful; avoid storing personal events.

Deliverables: adapter design, supported-layout notes, and confirmed weather placement in this plan.

Acceptance: dates can be identified without guessing from day numbers alone; placement does not obstruct events. Document any unsupported layout and the time-zone policy before proceeding. Static evidence establishes candidate insertion points; verify actual non-interference with the runnable overlay in Stages 4–6.

Evidence and remaining work:
- User uses English, visible weekends, and a Pacific calendar time zone; supplied screenshots show dark mode and two time-zone columns in the time grid.
- The custom `7 days` view is a rolling window starting on the current day, not a fixed weekday. The screenshot starts Sunday because that was the current day; the month screenshot starts Monday. Identify each displayed date independently, including windows crossing month/year boundaries, and support the custom view as well as standard Week view.
- All four requested HTML samples received: 7-day header/all-day area, October 12–18 month row, October 26–November 1 row, and October 2026 heading. No additional HTML is needed for the initial adapter design.
- Week headers expose `[role="columnheader"]` with `button[data-datekey]` and readable date labels. Target the header container, not the existing date button or all-day event row; create a sibling weather control outside Calendar's heading action target.
- Month rows separate background date markers, visible `h2[data-datekey]` headings, and event gridcells into different layers. Do not assume that each gridcell contains its visible date. Match layers within each row by validated date/order; use date-heading wrappers as visual anchors while keeping interactive weather controls outside `aria-hidden` ancestors. Final placement may need an extension-owned layer positioned relative to those anchors; verify stacking, clipping, and pointer behavior live.
- Limit selectors to the active main calendar; identical keys occur in multiple layers. Prefer roles and date attributes, keeping necessary class-based layout detection isolated in the adapter. Do not derive dates from event contents or IDs.
- Supplied keys match a candidate encoding: `(year - 1970) * 512 + month * 32 + day`, with month numbered 1–12. Examples: October 11, 2026 = 29003; October 31 = 29023; November 1 = 29025. This is an inference from samples, not a documented contract. Validate decoded civil dates against date labels and the visible heading, and fail gracefully on inconsistencies. Never increment date keys to advance days.
- The heading supplies the year missing from most date labels. Date keys provide a candidate full-date source without relying on localized text parsing; verify year rollover and February/leap-day behavior during implementation. Keep decoded dates as civil date strings rather than interpreting them as browser-local midnight instants.
- Preserve structural evidence in anonymized fixtures during implementation; omit supplied event titles, event IDs, calendar identifiers, and event tracking metadata.
- Live placement, rerender behavior, standard Week view, light theme, and changed time-zone settings remain unverified. Check them with the first runnable overlay; do not treat static HTML as proof of working integration.
- Implemented daily semantics: selected-city local-day summaries matched to the displayed calendar date. Hourly details explicitly label their time zone. Alignment to calendar hours for future gradients still requires a reliable primary-calendar time-zone source or an explicit setting; screenshots show offsets but cannot establish IANA identifiers.

## Stage 2 — Scaffold Extension and Manual Settings

Status: Implementation completed; Chrome loading and preference persistence require manual acceptance. Dependencies: Stage 1.

Tasks:
- Add the manifest, content script, service worker, popup, assets, and development instructions.
- Restrict content-script access to Google Calendar and network access to required weather/geocoding hosts.
- Implement city search with explicit result selection, unit preferences, and overlay enable/disable.
- Store the common location record locally; keep location resolution separate from weather fetching.

Deliverables: an unpacked extension with working, persistent settings.

Acceptance: Chrome loads it without errors; ambiguous city names are distinguishable; preferences survive restarting Chrome. No automatic location request occurs.

## Stage 3 — Forecast Fetching and Cache

Status: Completed — provider, cache, validation, and offline/concurrency tests implemented. Real-provider browser requests remain a Stage 6 acceptance check. Dependencies: Stage 2.

Tasks:
- Fetch and normalize daily/hourly forecasts through the service worker.
- Cache by coordinates, time-zone policy, and requested forecast data; deduplicate concurrent requests.
- Use an initial one-hour refresh interval on demand, with bounded retries and timestamps for cached data.
- Handle unavailable dates, missing values, offline operation, and provider errors; include provider attribution.

Deliverables: weather provider module, cache, and focused tests.

Acceptance: location changes cannot display previous-location forecasts; stale data is identified; dates beyond forecast coverage show no invented weather. Test normalization, cache expiry, unit conversion, and date boundaries.

## Stage 4 — Week Overlay

Status: Implementation completed; live placement, event interactions, and accessibility acceptance pending. Dependencies: Stages 1–3.

Tasks:
- Render daily summaries and a keyboard-accessible details popover with hourly temperature, rain probability, and wind.
- Observe relevant Calendar changes with debouncing; update on navigation and settings changes without duplicate widgets.
- Isolate extension styles and remove widgets when disabled or on unsupported views.

Deliverables: usable week overlay.

Acceptance: correct date alignment across navigation and year boundaries; event creation/editing still works; repeated rerenders create no duplicates. Verify light/dark themes, resizing, keyboard dismissal, and offline behavior.

## Stage 5 — Month Overlay

Status: Implementation completed; live month layout and view-switch acceptance pending. Dependencies: Stage 4.

Tasks:
- Reuse weather data and details with a compact month-cell renderer.
- Handle adjacent-month cells and narrow layouts without covering event controls.
- Distinguish forecast unavailability from loading or request failure.

Deliverables: usable month overlay and layout regression fixtures where practical.

Acceptance: week/month switching stays aligned and clean; overflow controls remain usable; cells outside forecast coverage remain uncluttered.

## Stage 6 — Validate and Package the First Version

Status: In progress — documentation and automated validation complete; live signed-in Calendar verification pending. Dependencies: Stages 4–5.

Tasks:
- Run focused automated checks and manual checks on real Google Calendar.
- Verify daylight-saving transitions and the agreed time-zone policy.
- Review permissions and outbound requests for unnecessary access or calendar data.
- Document installation, configuration, data flow, limitations, and troubleshooting; update AGENTS.md with actual commands and structure.

Deliverables: documented, locally installable first version.

Acceptance: both priority views pass the documented checks; failures degrade gracefully; source contains no credentials or remotely loaded executable code. Web Store publication is a separate task.

## Later Stages

1. Hourly gradients in week view, aligned with visible hours and scrolling; retain readable events and an off switch.
2. Opt-in browser geolocation through an extension UI, with permission-denial handling and manual fallback. Persist only the selected location; no continuous tracking.
3. Day view, using the established adapter and renderer patterns.

## Open Decisions and Revision Log

- Confirm implemented summary placement in Chrome; structural anchors are identified, but live layout has not been tested.
- Daily and hourly details use the selected city’s local time zone; future time-axis gradients still need an explicit Calendar time-zone mapping.
- 2026-10-11: Initial staged plan reflects week/month priority, optional gradients, and manual location with future geolocation support.
- 2026-10-11: User approved staged plan and supplied 7-day/month screenshots. Recorded visible weekends, English, dark theme, differing weekday order, dual time-zone columns, and a requirement for arbitrary time-zone support. Stage 1 awaits targeted HTML samples; no implementation code started.
- 2026-10-11: Clarified that the custom 7-day window starts on the current day and has no fixed starting weekday; corrected Stage 1 assumptions.
- 2026-10-11: Reviewed all four supplied HTML samples. Documented header selectors, separate month layout layers, accessibility constraints, inferred date-key encoding, and remaining live checks. No further initial HTML requested; no implementation code started.

## Implementation Findings and Acceptance Handoff

- User authorized implementation on 2026-10-11. No application server, runtime dependencies, bundling, automatic location detection, or gradient feature was added.
- Files: root manifest and package scripts; `src/core.js`, `src/background.js`, `src/adapter.js`, `src/content.js`, and settings popup. README describes installation, privacy, limitations, and manual checks.
- Week headers reserve 24 pixels of padding for summaries. Month controls occupy the left portion of date-heading space, in an accessible body-level shadow root outside Calendar’s `aria-hidden` layers. Positioning follows scrolling/resizing and debounced DOM changes. These layout choices still require visual verification.
- Adapter checks decoded dates against English accessible labels and omits inconsistent dates. English is the initial supported Calendar language. Month layout classes are isolated in the adapter; a missing main region or changed structure produces an unsupported-layout status.
- Forecast requests use 16 days, metric canonical values, a one-hour cache, per-location in-flight deduplication, 12-second timeouts, and a one-minute failure cooldown within the service-worker lifetime. A single persistent cache holds the latest forecast; stale fallback is restricted to an identical location/time-zone key. No background polling or automatic retry loop was added.
- Tests verify provided boundary keys, civil-date validation, leap days/year rollover, label agreement, null values, repeated local-hour preservation, unit conversion, location validation, cache expiry, concurrent requests, stale fallback, location isolation, city result records, and message restrictions. Repeated-hour tests verify data preservation, not the provider’s actual DST response shape.
- `npm test`: 13 passing tests. `npm run check`: manifest paths and JavaScript syntax pass. These do not substitute for extension loading or live layout tests.
- Attempted an isolated headless Chrome launch using a temporary profile; it exited with code 134 under this environment. No signed-in browser session or real-provider extension request was verified. Stages 2, 4, 5, and 6 retain their manual acceptance work; do not mark that work complete until observed.
- Next acceptance step: load unpacked, select a city, then inspect both views and share any placement/error findings. Use the README checklist for navigation, interactions, themes, offline states, and time zones.
- 2026-10-11: First implementation and automated checks completed; documentation and plan updated to distinguish completed development from pending live acceptance.

Update this file whenever scope, decisions, stage status, or acceptance criteria change.
