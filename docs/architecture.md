# NearMe Architecture

## Direction

NearMe uses a feature-first structure with a small dependency rule:

```text
presentation -> domain <- data
```

- `domain` owns entities and repository contracts. It has no Flutter or Supabase dependency.
- `data` implements domain contracts with Supabase.
- `presentation` owns widgets and state controllers.
- `core` contains application-wide configuration and visual foundations.

This is intentionally lighter than a full Clean Architecture implementation. New layers should only be added when they remove demonstrated complexity.

## Initial vertical slice

The first slice covers account access and interest onboarding:

```text
Sign up / Sign in
        |
        v
 Supabase Auth
        |
        v
Select interests
        |
        v
PostgreSQL function + row-level security
```

The database owns the atomic replacement of a user's interests. The client never handles service-role credentials and can only read or modify rows authorized by row-level security.

## Decisions

- Configuration is injected at compile time with `--dart-define-from-file`.
- UI state uses small `ChangeNotifier` controllers while the state graph remains simple.
- Database changes are versioned as Supabase migrations.
- External SDK types do not cross into domain contracts.
- Tests target controller behavior through repository fakes.

## Next slices

1. Complete user profiles.
2. Capture location and search constraints.
3. Integrate nearby places behind a repository contract.
4. Generate and persist an itinerary.
5. Add reviews and itinerary recalculation.
