# Tenant App Redesign Progress (Idempotency & Reuse Log)

- **Design Tokens (`src/mobile/tokens.ts`, `src/styles/mobile-shell.css`)**: Reused exact palette, typography, spacing, and dark mode tokens from `pg-manager-web-application` (brand teal `#008080`, dark teal `#005F5F`, light teal `#E6F3F3`, charcoal `#1F2937`, dark `#0F1720`/`#1F2937`; no yellow/orange/purple in tenant icon tiles/chips).
- **Formatters (`src/utils/formatters.ts`)**: Reused `formatINR` (`Intl.NumberFormat('en-IN')`, no `.00` unless paise exist), `formatPeriod` (`YYYY-MM` -> `Month YYYY`), and `dd/mm/yyyy` date helpers.
- **Error Mapper (`src/utils/friendlyError.ts`)**: Centralized human-friendly error mapper (never shows raw validation arrays or `Failed to fetch`).
- **SwipeTabs (`src/components/common/SwipeTabs.tsx`)**: Ported from `pg-manager-web-application` `Primitives.tsx`.
- **Theme Persistence (`src/utils/theme.ts`)**: Ported from `pg-manager-web-application`.
- **Mascot Assets (`src/assets/mascot/`, `public/offline.html`)**: Already placed and synced in `tenant-web-app` and `pg-tenant-mobile-app`.
- **Backend Auth & PG Search DTO**: Backend `pg-ease-nest` is read-only per frontend-developer rule; requirements documented in `docs/redesign/BACKEND-HANDOFF.md`.
