# Repository Guidelines

## Project Structure & Module Organization

This directory is currently empty apart from this guide. No source code, assets, tests, package manifest, or Git metadata is present. The directory name suggests a Google Calendar weather extension; confirm its scope before choosing a framework or browser extension architecture.

When scaffolding the project, keep application code in `src/`, automated tests in `tests/`, and static assets in `assets/`. Document the actual layout here once established. Keep generated output separate from source files and exclude it from version control.

## Build, Test, and Development Commands

No build, test, lint, or local development commands are configured yet. Do not assume commands such as `npm test` or `npm run build` work.

After selecting tooling, define reproducible commands in the project manifest and document installation, local execution, testing, and production builds in `README.md`. If this becomes a browser extension, include instructions for loading the unpacked extension.

## Coding Style & Naming Conventions

No language, formatter, or linter has been selected. Establish shared formatting and linting configuration with the initial implementation. Until then, use two-space indentation for JSON and YAML, descriptive filenames, and consistent naming within each language. Avoid unrelated formatting changes.

## Testing Guidelines

No testing framework or coverage threshold exists. Add tests alongside new behavior, prioritizing weather data handling, date boundaries, and calendar integration if those features are implemented. Use descriptive test names and document the test command before requiring it in reviews.

## Commit & Pull Request Guidelines

No Git history is available to establish existing conventions. Use concise, imperative commit subjects, such as `Add weather data adapter`. Keep changes focused.

Pull requests should explain the change, link relevant issues, and report validation performed. Include screenshots for visible interface changes and explicitly identify any checks that could not run.

## Security & Configuration

Never commit credentials, API keys, or personal calendar data. Document required configuration using placeholder values. Request only browser permissions necessary for implemented features.
