# Repository Guidelines

## Project Structure & Module Organization

`frontend/` contains the Flutter application. Application code lives in `frontend/lib/`, with shared configuration and theming under `core/` and feature modules under `features/`. Each feature follows `presentation -> domain <- data`: domain contracts must not depend on Flutter or Supabase, data implements those contracts, and presentation owns widgets and `ChangeNotifier` controllers. Mirror source paths in `frontend/test/`.

`backend/` contains the pinned Supabase CLI and database assets. Add schema changes as timestamped SQL files in `backend/supabase/migrations/`; do not edit an applied migration. Architecture notes belong in `docs/`, especially `docs/architecture.md`.

## Build, Test, and Development Commands

Run Flutter commands from `frontend/` and backend commands from `backend/`:

- `flutter pub get` installs Dart dependencies.
- `flutter run -d chrome` starts the responsive web application with local demonstration data.
- `dart format --output=none --set-exit-if-changed lib test` checks formatting without changing files.
- `flutter analyze` enforces static-analysis and lint rules.
- `flutter test` runs all unit and widget tests.
- `npm install` installs the locked Supabase CLI (Node.js 20+).
- `npm exec supabase -- db push` applies migrations to the linked project.

## Coding Style & Naming Conventions

Use Dart's standard two-space indentation and run `dart format` before committing. The analyzer requires strict casts, inference, and raw types; follow `flutter_lints` plus the repository rules in `analysis_options.yaml`. Prefer single quotes, explicit return types, final locals, and ordered imports. Name files in `snake_case.dart`, types in `UpperCamelCase`, and members in `lowerCamelCase`. Keep external SDK types behind data-layer implementations.

## Testing Guidelines

Use `flutter_test`. Name files `<subject>_test.dart`, group tests by class or behavior, and use small repository fakes for controller tests. Add tests with every behavior change, including success, validation, and failure paths. No numeric coverage threshold is currently enforced; prioritize meaningful coverage of domain and presentation logic.

## Commit & Pull Request Guidelines

History currently contains only the initial commit, so follow the convention documented in `README.md`: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, or `chore:` followed by a concise imperative summary. Keep commits focused and work on branches such as `feature/login`.

Pull requests should explain the change, note testing performed, link relevant issues, and include screenshots for UI changes. Call out migrations or configuration changes explicitly.

## Security & Configuration

Copy `env.example.json` to ignored `env.json`. Never commit credentials or expose a Supabase service-role key to Flutter. Preserve row-level security and validate data from external APIs.
