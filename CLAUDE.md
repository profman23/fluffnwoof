# FluffNwoof

## Standards
- Highest engineering standards: stability, performance, scalability, clean code
- TypeScript strict, OWASP security, DRY/SOLID/KISS
- Plan before code, consider edge cases
- Emojis in all screen titles, modal headers, and section headers

## Deployment (CRITICAL)
- **DO NOT push/deploy without explicit approval**
- **Golden Rule: NO code reaches Production without passing Training first**

### Environments
| Environment | Branch | Database | URL |
|------------|--------|----------|-----|
| Dev | localhost | Neon `development` | `localhost:5173` / `localhost:5000` |
| Training | `training` | Neon `training` | `fluffnwoof-training-frontend.onrender.com` |
| Production | `main` | Neon `production` | `fluffnwoof-frontend.onrender.com` |

### Deploy Commands
- `"deploy"` / `"ارفع training"` → commit & push to `training` branch → Render Training auto-deploys
- `"production"` / `"ارفع production"` → push `main` → Render Production auto-deploys
- `"ارفع"` without specifying → **ASK**: Training or Production?

### Workflow Rules
1. **Always develop on Dev first** → test locally
2. **Always deploy to Training first** → test on Training
3. **Then deploy to Production** → quick smoke test on Live
4. **Never skip Training** — even for "small" fixes

### Batching Strategy
| Change Type | Strategy |
|-------------|----------|
| Small bug fixes | Batch 3-5 together → Training → Production |
| Simple UI tweaks | Batch 2-3 together → Training → Production |
| New feature (medium/large) | One at a time → Training → Production |
| Database migration | One at a time → Training → Production |

### Before Production Deploy (Checklist)
- Same code was tested on Training first
- No destructive migrations (DROP TABLE/COLUMN) without explicit approval
- Always ask user for confirmation

## Database Migrations (CRITICAL)
- **NEVER write migration SQL files manually** — always use `prisma migrate dev --name "description"`
- Prisma generates migrations with correct checksums that `prisma migrate deploy` requires
- Hand-written SQL files will be rejected by `prisma migrate deploy` on Training/Production
- **Safety Guard**: `scripts/check-migrations.js` runs before every deploy and blocks destructive SQL (DROP TABLE/COLUMN, TRUNCATE, DELETE FROM) in new migrations
- To bypass safety guard (rare): set `ALLOW_DESTRUCTIVE_MIGRATION=true` in Render env vars
- **Dev workflow**: edit `schema.prisma` → run `prisma migrate dev` → commit migration file → deploy
- **Never use `prisma db push` on Training/Production** — it has no history and no rollback

## Testing (CRITICAL)
- **Tests run on a SEPARATE test database** (Neon `test` branch) — NEVER on Dev/Training/Production
- `setup.ts` has safety checks that block non-test databases
- **Every new API endpoint or feature MUST include integration tests**
- **Every bug fix MUST include a regression test** that prevents the bug from returning
- **External services (SMS, Email, WhatsApp, Cloudinary) MUST be mocked** — never send real messages in tests
- **Coverage minimum: 40% (CI fails if below)** — target: 85%, increase thresholds as coverage grows
- Test files go in `backend/src/tests/api/` following existing patterns
- Run locally: `cd backend && npm run test:run`
- Run with coverage: `cd backend && npm run test:coverage`
- CI runs tests automatically on every push, deploy gate checks CI passed

### Test Helpers
| Helper | Location | Usage |
|--------|----------|-------|
| `cleanDatabase()` | `tests/setup.ts` | Truncate all tables (test DB only) |
| `createTestUser()` | `tests/setup.ts` | Create staff user with TestRole |
| `generateAdminToken()` | `tests/helpers.ts` | JWT with ADMIN role (bypasses permissions) |
| `generateUserToken()` | `tests/helpers.ts` | JWT with custom role (subject to permissions) |
| `generateCustomerToken()` | `tests/helpers.ts` | JWT with `type: 'customer'` for portal auth |
| `createTestOwnerWithPortal()` | `tests/helpers.ts` | Owner with isVerified + portalEnabled |
| `createTestVisitType()` | `tests/helpers.ts` | Visit type for appointment tests |
| `createTestCategory()` | `tests/helpers.ts` | Service product category |

### Mocking External Services
Use `vi.mock()` at the top of test files (hoisted automatically):
- SMS: `vi.mock('../../services/smsService', () => ({ ... }))`
- Email: `vi.mock('../../services/emailService', () => ({ ... }))`
- WhatsApp: `vi.mock('../../services/whatsappService', () => ({ ... }))`
- Cloudinary: `vi.mock('../../config/cloudinary', () => ({ ... }))`
- See `tests/mocks/externalServices.ts` for reusable mock definitions

### Test Coverage (28 files, 243 tests)
| Module | Test File | Tests |
|--------|-----------|-------|
| Auth | `auth.test.ts` | Login, Profile, Auth rejection |
| Appointments | `appointments.test.ts` | CRUD, Status changes, Auto-confirm |
| Boarding | `boarding.test.ts` | Config CRUD, Filters, Validation |
| Owners | `owners.test.ts` | CRUD, Duplicate phone, Validation |
| Pets | `pets.test.ts` | CRUD, With-owner creation |
| Invoices | `invoices.test.ts` | CRUD, AddItem, Finalize |
| Health | `health.test.ts` | Health endpoints |
| Users | `users.test.ts` | CRUD, Deactivate, Password, Permissions |
| Roles | `roles.test.ts` | CRUD, Permissions |
| Medical Records | `medical-records.test.ts` | Full lifecycle, Audit, Close/Reopen |
| Shifts | `shifts.test.ts` | Schedules, Days off, Breaks, Periods |
| Visit Types | `visit-types.test.ts` | CRUD, Reorder, Seed, Toggle |
| Service Products | `service-products.test.ts` | Categories + Products CRUD |
| Dashboard | `dashboard.test.ts` | Stats, Appointments, Analytics |
| Profile | `profile.test.ts` | Get/Update profile & preferences |
| Clinic Settings | `clinic-settings.test.ts` | Form settings, Logo |
| Reminders | `reminders.test.ts` | Settings, Logs, Stats, Templates |
| Forms | `forms.test.ts` | Templates CRUD, Pet forms, Sign |
| Notifications | `notifications.test.ts` | List, Count, Mark read |
| SMS | `sms.test.ts` | Balance, Logs, Send (mocked) |
| WhatsApp | `whatsapp.test.ts` | Test, Templates, Send (mocked) |
| Email | `email.test.ts` | Connection, Send (mocked) |
| Audit | `audit.test.ts` | Logs, Recent, Statistics |
| Reports | `reports.test.ts` | Next appointments |
| Import | `import.test.ts` | Route availability check |
| Customer Portal | `customer-portal.test.ts` | Auth, Booking data, Profile, Pets, Appointments, Forms |
| Public Forms | `public-forms.test.ts` | Get form, Sign, Double-sign rejection |
| Uploads | `uploads.test.ts` | Avatar, Pet photo, Attachments |

## Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **DB**: PostgreSQL (Neon branching) | **Hosting**: Render
- **SMS**: Madar (`MADAR_SENDER_NAME=FluffnWoof`) | **Email**: Resend (Render) / SMTP (localhost)

## Component Architecture (CRITICAL)

### Rule of Three
If a UI pattern repeats 3+ times → extract to shared component in `common/`.
When a shared component is the better engineering choice → create it even for fewer uses.

### Before Writing Code
1. Search `frontend/src/components/common/` for existing components
2. Search `frontend/src/hooks/` for existing hooks
3. Search `backend/src/services/` and `backend/src/middlewares/` for existing logic
4. Extend existing code before creating new

### Shared Components (`frontend/src/components/common/`)

| Component | Usage |
|-----------|-------|
| `Button` | All buttons. Variants: `primary`, `secondary`, `danger`, `outline` |
| `Input` | Text inputs with label & error |
| `Modal` | All modals. Sizes: `sm`, `md`, `lg`, `xl` |
| `ConfirmationModal` | Delete/warning confirmations. Variants: `warning`, `danger`, `info` |
| `Card` | Card containers |
| `SearchableSelect` | Dropdowns with search, icons, clear |
| `SelectionCard` | Toggle/radio cards with color themes |
| `DataTable` | Tables with sorting, drag-and-drop columns |
| `PhoneInput` | Phone input with country codes |
| `ImageUpload` | Image upload with preview (`circle`, `square`) |
| `FileAttachment` | File upload/download/delete |
| `ReadOnlyBadge` | Read-only permission badge |
| `PermissionGuard` | Wrap content requiring permissions |
| `ScreenPermissionGuard` | Screen-level permission guard |
| `PermissionAlert` | Inline permission/error alerts (`noAccess`, `readOnly`, `error`) |
| `LogoLoader` | Loading spinner with logo |
| `ColorPicker` | Color selection |
| `AnimatedNumber` | Animated counting numbers |

### Hooks (`frontend/src/hooks/`)

| Hook | Usage |
|------|-------|
| `useScreenPermission` | Screen-level read/write/delete permissions |
| `usePhonePermission` | Phone visibility + `maskPhoneNumber()` |
| `useLanguage` | Language & RTL detection |
| `useNotificationSound` | Notification sounds |

### CSS Classes (`frontend/src/index.css`)
- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-outline`
- Forms: `.input`, `.select`, `.textarea`, `.label`
- Layout: `.card`, `.page-container`, `.table`
- Alerts: `.alert-success`, `.alert-error`, `.alert-warning`, `.alert-info`
- Badges: `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`
- Other: `.empty-state`, `.dropdown-menu`, `.dropdown-item`

### Usage Rules
1. Always use shared components over raw HTML/Tailwind
2. Always wrap protected content with `PermissionGuard` or `ScreenPermissionGuard`
3. Use `PermissionAlert` for inline permission messages in modals
4. Use CSS utility classes for elements without React components
