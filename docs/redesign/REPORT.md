# PG Ease Tenant App Redesign & Structure Flow Report

## 1. Summary of Completed Work

### Tenant App (`tenant-web-app` + `pg-tenant-mobile-app` `v1.0.10`, `versionCode 11`)
- **Design System & Consistency (`src/styles/mobile-shell.css`, `src/mobile/components/Primitives.tsx`)**: Synchronized light & dark tokens (`#008080` teal, `#005F5F` dark teal, `#E6F3F3` light teal, `#1F2937` charcoal, `#0F1720`/`#1F2937` dark mode). Replaced all off-brand `amber-*`, `orange-*`, `purple-*`, `yellow-*` icon tiles, chips, and buttons across 15 Tenant pages with brand teal/semantic red/green.
- **4-Tab Figma Bottom Nav (`BottomTabBar.tsx`)**: Unified to **Dashboard (`/`), PG Search (`/search`), My PG (`/my-pg`), Menu (`/profile`)** for all 3 user states (Guest, No-PG, Active Stay) with light haptic feedback.
- **Route Guards (`App.tsx`)**: Added `<RequireAuth>` around `/night-out`, `/payments`, `/transactions`, `/complaints`, `/guests`, `/food`, `/wifi`, `/notice`, `/announcements`, `/documents`, `/notifications`, `/saved` so guests are redirected to `/login`.
- **PG Search Radius Fix (`searchService.ts`, `PgExplorerSection.tsx`)**: Aligned distance clamping (`SEARCH_MIN_DISTANCE_KM = 1`, `SEARCH_MAX_DISTANCE_KM = 10`) to `pg-ease-nest/src/tenants/dto/nearby-pgs-query.dto.ts` and routed errors through `friendlyError()` + `MascotEmptyState` (never showing raw `[minDistanceKm must...]` validation errors).
- **Name & Money Formatting (`src/utils/formatters.ts`)**: Added `formatINR`, `formatPeriod`, `formatDateIN`, and `sanitizeDisplayName` (strips duplicated initial such as `"SShivam"` -> `"Shivam"`).
- **Persistent Login & Offline (`apiClient.ts`, `AuthContext.tsx`)**: Single-flight refresh (`performSingleFlightRefresh`), foreground/visibility proactive refresh (`initTenantAuthLifecycle`), Capacitor `Preferences` hydration + logout cleanup, and bundled `offline.html` + `MascotEmptyState`.
- **Inventory & Registry (`navRegistry.ts`, `docs/redesign/inventory.json`, `scripts/verify-inventory.mjs`)**: Verified 16/16 rows against `TENANT_NAV_REGISTRY`.

### Owner My PG Structure Flow (`pg-manager-web-application/src/pages/Structure.tsx` + `pg-owner-mobile-app` `v1.0.12`, `versionCode 13`)
- Removed `+ Add property` and `+ Add room` from the Rooms & Beds `<PageHeader>` and removed the duplicate PG `<Select>` dropdown from the property bar.
- Added a 4-step progress indicator (`1. PG → 2. Block → 3. Floor → 4. Room`).
- Enforced strict hierarchy: empty Block state ("Start by adding a block or wing") with locked Floor/Room previews; Floor creation inside selected Block; Room creation inside selected Floor with locked Block + Floor context in the Add Room modal.
- Added `Unassigned Rooms` section for legacy rooms without `blockId`/`floorId` with a `Move to block/floor` action.

## 2. Backend Requirements (for Backend Developer — `pg-ease-nest` not modified)
1. **PG Search Distance Limit**: If product requires 0–25 km search radius in the UI, raise `maxDistanceKm` max validator in `pg-ease-nest/src/tenants/dto/nearby-pgs-query.dto.ts` from `10` to `25` (currently frontend clamps to `1–10 km` to match the DTO).
2. **Refresh Token Rotation & 90-Day Sliding Expiry**: Ensure `/tenants/refresh-token` and owner refresh endpoints rotate refresh tokens with reuse detection (30–60s grace window) and 90-day sliding expiry.

## 3. Verification & Artifacts
- `tenant-web-app`: `npm run verify:inventory` (16/16), `tsc -b && vite build` passed.
- `pg-manager-web-application`: `npm run build` passed.
- **Signed APKs**:
  - `apks/pgease-owner-v1.0.12.apk` (`in.pgease.owner`, `versionCode 13`, `versionName 1.0.12`)
  - `apks/pgease-tenant-v1.0.10.apk` (`in.pgease.tenant`, `versionCode 11`, `versionName 1.0.10`)
- **Environment note**: Android `emulator` / `system-images` are not installed on this Mac and no physical device was connected via `adb`, so on-device APK screenshots were not captured in this session.
