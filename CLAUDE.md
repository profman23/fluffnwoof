# FluffNwoof

## Standards
- Highest engineering standards: stability, performance, scalability, clean code
- TypeScript strict, OWASP security, DRY/SOLID/KISS
- Plan before code, consider edge cases
- Emojis in all screen titles, modal headers, and section headers

## Deployment (CRITICAL)
- **DO NOT push/deploy without explicit approval**
- Development: localhost + Neon `development` branch
- `"deploy"` / `"ارفع training"` → commit & push to `training` branch (Render Training + Neon `training`)
- `"production"` / `"ارفع production"` → merge `training` to `main` (Render Production + Neon `production`)

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
