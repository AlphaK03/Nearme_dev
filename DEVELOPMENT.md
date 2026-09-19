# Development Guide

## Prerequisites

- Flutter 3.35 or newer with Dart 3.9 or newer
- Node.js 20 or newer
- A Supabase project or local Supabase stack

## Tooling installed on this workstation

Flutter is installed as a portable SDK at:

```powershell
C:\Users\keylo\development\flutter\bin\flutter.bat --version
```

Add `C:\Users\keylo\development\flutter\bin` to the user `PATH` to invoke `flutter` directly in new terminal sessions. Supabase CLI is installed locally under `backend`; use it through npm so every contributor uses the locked project version.

## Restore dependencies

```powershell
Set-Location frontend
C:\Users\keylo\development\flutter\bin\flutter.bat pub get

Set-Location ..\backend
npm install
```

## Configure Supabase (optional backend work)

1. Copy `env.example.json` to `env.json` and set the project URL and publishable key.
2. Link the backend directory to a Supabase project.
3. Apply migrations.

```powershell
Set-Location backend
npm exec supabase -- link --project-ref YOUR_PROJECT_REF
npm exec supabase -- db push
```

Never place the service-role key in the Flutter application.

## Run the web application

```powershell
Set-Location frontend
C:\Users\keylo\development\flutter\bin\flutter.bat run -d chrome
```

The current web experience uses local demonstration data, so Supabase credentials are not required to run the complete planning flow.

## Quality checks

```powershell
Set-Location frontend
C:\Users\keylo\development\flutter\bin\dart.bat format --output=none --set-exit-if-changed lib test
C:\Users\keylo\development\flutter\bin\flutter.bat analyze
C:\Users\keylo\development\flutter\bin\flutter.bat test
```
