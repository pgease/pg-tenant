# PG Ease – Tenant Web vs Mobile Parity Map

> **Source of Truth**: PG Ease Tenant Mobile Application (`pg-tenant-mobile-app` / Capacitor Android & iOS native shell)  
> **Date**: 24 November 2026  
> **Scope**: Feature parity mapping for upcoming production launch.

---

## 1. Feature Mapping Matrix

| Feature | Mobile Screen | Web Screen | API Endpoint(s) | Key Fields | Statuses / Lifecycle | Empty / Error States |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A1. Saved Properties** | Saved Tab (`/saved`) | `/saved` | • `GET /tenants/bookmarks`<br/>• `POST /tenants/bookmarks`<br/>• `GET /properties/public/:id` | Photo, PG name, City/Locality, Starting rent, Food included/available, Sharing options, Contact/Enquiry buttons | • Bookmarked (`true` / `false`) | • **Empty**: "No Saved PGs Yet" with "Explore Properties" CTA<br/>• **Loading**: Shimmer skeleton cards<br/>• **Guest**: "Sign in to save PGs" banner |
| **A2. Transactions** | Transactions (`/transactions` or `/payments/history`) | `/transactions`<br/>`/payments/history` | • `GET /tenants/rent-collections/history`<br/>• `GET /tenants/payments/:id/receipt`<br/>• `GET /tenants/rent-collections/:id` | Amount, Date (`dd/mm/yyyy`), Month/Period, Mode (`UPI`, `Gateway`, `Cash`, `Bank Transfer`), UTR / Txn ID, Receipt number, Rejection reason | • `SUCCESS` / `PAID`<br/>• `PENDING_VERIFICATION` (Under Verification)<br/>• `APPROVED`<br/>• `REJECTED` (with reason)<br/>• `FAILED` | • **Empty**: "No Transactions Yet"<br/>• **Filters**: Month & Status chips (All, Success, Under Review, Rejected)<br/>• **Error**: Retry banner |
| **A3. Guest Pass** | Guest Pass (`/guests` or `/guest-entry`) | `/guests`<br/>`/guest-entry` | • `GET /tenants/guest-requests`<br/>• `POST /tenants/guest-requests`<br/>• Trigger: WhatsApp `o_guest_visit` | Guest Name, Mobile Number, Gender, Relationship, Expected Arrival (`dd/mm/yyyy` + time), Expected Departure, Number of Guests, Purpose, ID Proof | • `PENDING` (Under review)<br/>• `APPROVED`<br/>• `REJECTED`<br/>• `CANCELLED` | • **Empty**: "No guest requests yet"<br/>• **Validation**: Inline errors, arrival before departure, 10-digit phone<br/>• **Actions**: Cancel request (if pending), Add Guest modal |
| **A4. Night Out** | Night Out (`/night-out`) | `/night-out` | • `GET /tenants/night-out-requests`<br/>• `POST /tenants/night-out-requests`<br/>• Trigger: WhatsApp `o_night_out_request` | Departure date & time (`dd/mm/yyyy` + time), Return date & time, Reason, Destination address, Emergency contact during stay, Parent consent confirmation | • `PENDING`<br/>• `APPROVED`<br/>• `REJECTED`<br/>• `RETURNED`<br/>• `CANCELLED` | • **Empty**: "No night out requests recorded"<br/>• **Validation**: Return date after departure, reason required<br/>• **Actions**: Mark Returned, Cancel request |
| **A5. Dashboard & Stay Details** | Home / My PG (`/`, `/my-pg`) | `/`, `/my-pg` | • `GET /tenants/profile`<br/>• `GET /tenants/rent-collections/my-dues`<br/>• `GET /tenants/property/wifi-details` | Rent due card, Dues breakdown (rent, deposit, wifi, laundry, joining fee), Room number, Bed number, WiFi credentials, Food menu, Notice status | • `ACTIVE`<br/>• `UNDER_NOTICE`<br/>• `OVERDUE`<br/>• `PAID` | • **Unlinked**: "Join your PG" card with invite link / QR CTA<br/>• **Active**: Complete PG Stay dashboard |

---

## 2. Navigation Structure Parity

### Mobile Bottom Bar & Drawer
1. **Home / Dashboard** (`/`)
2. **Explore / PG Search** (`/search`)
3. **My PG Stay** (`/my-pg`)
4. **Rent & Payments** (`/payments`)
5. **Menu / Services** (`/profile` drawer)
   - Transactions (`/transactions`)
   - Saved Properties (`/saved`)
   - Documents & KYC (`/documents`)
   - Food Menu (`/food`)
   - Wi-Fi Network (`/wifi`)
   - Complaints (`/complaints`)
   - Guest Pass (`/guests`)
   - Night Out (`/night-out`)
   - Notice Board (`/announcements`)
   - Notice Period (`/notice`)

### Desktop Sidebar Navigation
- Exactly mirrors the mobile navigation hierarchy with clear section grouping (Explore, Stay, Ops, Account).

---

## 3. Date & Time Standardization
- **Display format**: `DD/MM/YYYY` everywhere (`format(date, 'dd/MM/yyyy')`).
- **Input fields**: `placeholder="dd/mm/yyyy"`, with HTML5 date value format `YYYY-MM-DD` synchronized.
- **Timezone**: `Asia/Kolkata` (Indian Standard Time) for all timestamps and notifications.
