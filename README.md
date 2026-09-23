# DigiWarranty — Digital Billing & Warranty Management Platform

> "Never lose a warranty because you lost a bill."
> Bill once. Register warranty automatically. Manage every service claim from one dashboard.

A multi-tenant MERN SaaS. Every completed purchase auto-generates a digital invoice, a
digital warranty record, a unique invoice ID, a QR verification code, and a warranty
lifecycle that carries through service, repair, and expiry.

---

## 1. What's implemented (all 6 phases)

```
Purchase → Digital Invoice → Warranty Registration → Warranty Active
  → Warranty Verification → Service Request → Technician
  → Repair History → Warranty Expiry → Analytics
```

- **Phase 1 — Auth, RBAC, Store, Customer, Product.** JWT + rotating refresh tokens, bcrypt,
  5 roles (OWNER/MANAGER/CASHIER/TECHNICIAN/CUSTOMER), tenant isolation on every query.
- **Phase 2 — Billing, Invoices, PDF, Payments.** Transactional invoice creation (Mongo
  session): stock decrement, line-item tax/discount math, secure invoice numbers
  (`INV-2026-09-8F29A7`), PDF generation (pdfkit), QR code generation.
- **Phase 3 — Warranty, countdown, verification, OTP, QR.** Warranty auto-registered per line
  item from the product's warranty template (never hard-coded); status derived from dates at
  read time; public QR verification page; OTP-gated full reveal (mock SMS/WhatsApp provider,
  swappable); masked PII on every public response.
- **Phase 4 — Service requests, technician assignment, service history, warranty claims.**
  Full lifecycle state machine, append-only ServiceHistory log, WarrantyClaim auto-opened on
  verification, duplicate-claim prevention, technician-only status transitions.
- **Phase 5 — Notifications, audit logs, analytics.** Channel-abstracted notifications
  (EMAIL/SMS/WHATSAPP/IN_APP) respecting customer preferences, a daily cron job for
  30/7/1-day warranty-expiry reminders, immutable AuditLog on every sensitive write, and an
  analytics API (dashboard summary, sales trend, top products, product failure rate, claims
  trend) rendered with Recharts.
- **Phase 6 (partial) — Customer portal.** A CUSTOMER-role account spans multiple stores
  (their real-world purchasing relationship); portal endpoints aggregate across every linked
  Customer record. Ownership transfer / Digital Product Passport are designed for (see
  `Product`/`Warranty` schemas) but not yet built — the next natural phase.

## 2. Architecture

- **Frontend**: React 18 + Vite, Tailwind, React Router, TanStack Query, React Hook Form + Zod,
  Axios, Recharts, lucide-react.
- **Backend**: Node/Express (ESM), MongoDB/Mongoose, JWT, bcrypt, Zod, Helmet, CORS, rate
  limiting, Winston/Morgan, pdfkit, qrcode, node-cron, nodemailer.
- **Multi-tenancy**: every business document carries `storeId`; `requireStoreContext` +
  per-query `storeId` scoping in every service function enforce isolation. `req.user` is
  rebuilt from the database on every request — a JWT never carries authority on its own.
- **Money-critical writes are transactional**: `invoiceService.createInvoice` opens one Mongo
  session for stock decrement + Invoice + N Warranties + Payment, so a failure anywhere rolls
  back the whole sale (no orphaned warranty, no invoice without its warranty).

## 3. Folder structure

```
digiwarranty/
├── server/src/{config,controllers,middleware,models,routes,services,utils,validators,jobs,constants}
└── client/src/{components,pages,layouts,hooks,services,api,context,store,routes,utils,validators,constants}
```

## 4. Full API surface

```
/api/v1/auth            register, register-customer, login, refresh, logout, me,
                         forgot-password, reset-password
/api/v1/stores           GET/PUT me
/api/v1/users             staff CRUD, role change, deactivate
/api/v1/customers        CRUD, search
/api/v1/products          CRUD (soft delete), warranty template config
/api/v1/invoices          create (transactional), list, get, PDF download
/api/v1/warranties         list, get, manual status override (OWNER, audited)
/api/v1/warranty-claims  list, get, update status
/api/v1/services          create, list, get, verify, assign, technician status updates,
                         product service history
/api/v1/technicians       directory, own dashboard summary
/api/v1/notifications      own in-app notifications, mark read
/api/v1/analytics         dashboard, sales-trend, top-products, product-failure, claims-trend
/api/v1/audit-logs         list (OWNER/MANAGER)
/api/v1/verification        PUBLIC: by QR token, lookup, send-otp, verify-otp
/api/v1/portal             CUSTOMER: profile, invoices(+pdf), warranties, service-requests,
                         notifications — aggregated across every store they've bought from
GET /health                unauthenticated liveness check
```

Every response follows `{ success, message, data }` / `{ success, message, errorCode }`.

## 5. Security highlights

- Access JWT carries only `{ userId, storeId, role }`; refresh token is stored **hashed**,
  delivered as an `httpOnly` cookie scoped to `/api/v1/auth`.
- Role and store membership are re-read from the DB on every request — a revoked/demoted
  user loses access on their very next call, not after token expiry.
- Public verification endpoints never expose a raw phone/address/Mongo id; full detail
  requires a 6-digit OTP (5-minute expiry, capped attempts, hashed at rest).
- A cashier can never modify a warranty; every OWNER override writes an AuditLog entry with
  old/new value and a required reason.
- Product deletion is a soft-delete (`isDeleted`) so historical invoices/warranties never
  point at a vanished product; invoices are never physically deleted.

## 6. UI page map

```
/login, /register (store owner), /register-customer (shopper)
/verify/invoice/:token                     PUBLIC — QR scan result

/app                        role-aware home (staff stats / technician queue / customer cards)
/app/billing                  POS: search customer + products, live totals, generate bill
/app/invoices, /app/invoices/:id            list + detail + PDF download
/app/products, /app/customers               OWNER/MANAGER/CASHIER
/app/warranties                 role-aware: store-wide (staff) or "My Warranties" (customer)
/app/service-requests(/:id)     role-aware: verify/assign (staff), work queue (technician),
                             "request service" (customer)
/app/employees                  OWNER/MANAGER
/app/analytics                    OWNER/MANAGER — Recharts dashboard
/app/audit-logs                   OWNER/MANAGER
/app/store                        OWNER only
/app/purchases, /app/notifications  customer portal
```

## 7. Running it

### Prerequisites
- Node.js ≥ 18, a MongoDB instance (local, Docker, or Atlas)

### Backend
```bash
cd server
cp .env.example .env   # a working dev .env is already included
npm install
npm run dev             # http://localhost:5000
```

### Frontend
```bash
cd client
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api/v1
npm install
npm run dev              # http://localhost:5173
```

### First run
1. **Create your store** — this makes the Store + first OWNER account.
2. As OWNER: add products (with warranty templates), add a CASHIER/TECHNICIAN, add a customer.
3. Go to **Billing**, generate an invoice — watch the warranty get registered automatically
   and a QR code appear on the invoice.
4. Copy the invoice's verification link (`/verify/invoice/<token>`) and open it in a private
   window — no login needed, this is the customer-facing QR result.
5. Sign up a **customer account** at `/register-customer` using the same phone number you
   billed to — their purchase history links automatically.
6. Raise a service request (as the customer or as staff on their behalf), verify it against
   the warranty, assign the technician account you created, and walk it through
   TECHNICIAN_VISIT → DIAGNOSIS → REPAIR_IN_PROGRESS → COMPLETED as that technician.
7. Check **Analytics** and **Audit Logs** as OWNER to see the trail this all left behind.

### Tests
```bash
cd server
npm test
```
Runs on an in-memory MongoDB (`mongodb-memory-server`) — no external database needed.
`tests/auth.test.js` covers registration/login/RBAC/tenant isolation;
`tests/billing-warranty-service.test.js` covers the full billing → warranty →
public/OTP verification loop and the complete service-request → technician workflow,
including a stock-insufficiency rejection and an invalid state-transition rejection.

> Network access is disabled in this build environment, so `npm install`/`npm test` have not
> been executed here. Every backend `.js` file was syntax-checked with `node --check` (all
> pass); every frontend file was brace/paren-balance checked. Run the commands above locally
> to install dependencies and execute the suite before treating this as verified-working.

## 8. Known gaps / where Phase 6 continues

- Ownership transfer and the Digital Product Passport view are not built — the schemas
  (`Product`, `Warranty`) are shaped to support them without migration.
- `Store.settings.notificationPreferences` exists but isn't yet surfaced in the Store
  Settings UI (backend honors per-customer preferences already).
- Authorized service-center / manufacturer-warranty-database (spec §6 advanced features) —
  not started, intentionally left for after the MVP loop above is validated end-to-end.
