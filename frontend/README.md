# NearMe Web

Responsive Flutter Web application for personalized nearby plans. The interface adapts to a desktop workspace with sidebar navigation and to a touch-first mobile layout with bottom navigation.

## Run locally

```powershell
flutter pub get
flutter run -d chrome
```

The demonstrable planning flow uses local state and does not require credentials: interests, route constraints, place selection, itinerary generation, and route adjustment are all interactive.

## Validate and build

```powershell
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
flutter build web --release
```

The production PWA is generated in `build/web/`. Supabase repositories remain in the codebase for the next backend integration slice, but they do not block the current web demo.
