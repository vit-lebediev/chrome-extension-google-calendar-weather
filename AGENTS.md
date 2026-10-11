# Repository Guidelines

## Project Structure & Module Organization

This Manifest V3 Chrome extension overlays weather on Google Calendar. `manifest.json` loads scripts from `src/`: `background.js` fetches weather, `adapter.js` identifies Calendar dates, `content.js` renders overlays, `core.js` shares pure functions, and `popup.*` manages settings. Node tests live in `tests/`, development checks in `scripts/`, and implementation plans in `plans/`. Installation instructions are in `README.md`.

Keep application code in `src/` and future static assets in `assets/`. Exclude generated output from version control.

## Build, Test, and Development Commands

Use Node 20+ and run `npm test` for automated checks and `npm run check` for syntax and manifest paths. No installation or build step is required. Load the repository unpacked through `chrome://extensions`; reload the extension and Calendar after changes. Use the README checklist for live browser verification.

## Planning Workflow

For future work that needs a plan, create or update a Markdown file in `plans/` before implementing. Use descriptive filenames such as `weather-overlay.md`. Include ordered stages, dependencies, deliverables, acceptance criteria, and status. Treat the file as the source of truth: update it as discussions change scope or decisions, and as implementation progresses. Summarize revisions in conversation. When the user requests planning and iteration first, wait for their instruction to begin coding.

## Coding Style & Naming Conventions

Use plain JavaScript, HTML, and CSS with two-space indentation, semicolons, camelCase functions, and descriptive filenames. No formatter or linter is configured. Keep Calendar DOM assumptions in `adapter.js`; avoid unrelated formatting changes.

## Testing Guidelines

Use Node's built-in test runner with `tests/*.test.js` and descriptive behavior names. No coverage threshold is set. Prioritize date boundaries, missing data, cache isolation, and message validation. Keep fixture event contents anonymized. Report browser checks separately from automated tests.

## Commit & Pull Request Guidelines

No Git history is available to establish existing conventions. Use concise, imperative commit subjects, such as `Add weather data adapter`. Keep changes focused.

Pull requests should explain the change, link relevant issues, and report validation performed. Include screenshots for visible interface changes and explicitly identify any checks that could not run.

## Security & Configuration

Never commit credentials, API keys, or personal calendar data. Document required configuration using placeholder values. Request only browser permissions necessary for implemented features.
