# FluffNwoof - Development Workflow

## Engineering Standards (CRITICAL)

### Enterprise Development Philosophy

Apply the **highest global engineering standards** for:
- **Stability**: Rock-solid, production-ready code
- **Performance**: Optimized, fast, and efficient
- **Scalability**: Ready for unlimited growth
- **Flexibility**: Easy to extend and maintain
- **Quality**: Clean, readable, well-structured code

### Development Principles

1. **Plan Before Code**
   - Analyze requirements deeply before implementation
   - Consider edge cases and error handling
   - Think about performance implications
   - Design for future extensibility

2. **Use Shared Components**
   - Always check for existing shared components before creating new ones
   - Reuse UI components from `frontend/src/components/`
   - Reuse backend services from `backend/src/services/`
   - Reuse utilities and helpers
   - Maintain consistency across the application

3. **Code Quality Standards**
   - TypeScript strict mode
   - Proper error handling
   - Input validation
   - Security best practices (OWASP)
   - Clean code principles (DRY, SOLID, KISS)

4. **Testing Mindset**
   - Test on localhost thoroughly before deployment
   - Consider all user scenarios
   - Verify database operations
   - Check API responses

---

## Deployment Rules (IMPORTANT)

**DO NOT push or deploy automatically. Always wait for explicit user approval.**

### Workflow Steps:

1. **Development (localhost)**
   - Code: localhost
   - Database: Neon branch `development`
   - Action: Develop and test here only
   - Wait for user to say: **"deploy"** or **"ارفع training"**

2. **Training (Render)**
   - Code: Render Training environment
   - Database: Neon branch `training`
   - Git branch: `training`
   - Wait for user to say: **"production"** or **"ارفع production"**

3. **Production (Render)**
   - Code: Render Production environment
   - Database: Neon branch `production`
   - Git branch: `main`

### Commands Reference:

| User Says | Action |
|-----------|--------|
| Any development request | Work on localhost ONLY |
| "deploy" or "ارفع training" | Commit and push to `training` branch |
| "production" or "ارفع production" | Merge `training` to `main` and deploy |

### Environment Variables:

#### Email (Resend API for Render):
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

#### SMS (Madar):
- `MADAR_SENDER_NAME=FluffnWoof`

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon with branching)
- **Hosting**: Render (Training & Production)
- **SMS**: Madar SMS API
- **Email**: Resend API (Render) / SMTP (localhost)

## Shared Components Architecture

### Frontend Shared Components
Check these locations before creating new components:
- `frontend/src/components/ui/` - Base UI components
- `frontend/src/components/common/` - Common shared components
- `frontend/src/components/layout/` - Layout components
- `frontend/src/hooks/` - Custom React hooks
- `frontend/src/utils/` - Utility functions
- `frontend/src/services/` - API service calls

### Backend Shared Services
Check these locations before creating new services:
- `backend/src/services/` - Business logic services
- `backend/src/utils/` - Utility functions
- `backend/src/middleware/` - Express middleware
- `backend/src/validators/` - Input validation schemas

### Reusability Rules
1. **Search first**: Always search for existing implementations
2. **Extend, don't duplicate**: Extend existing components if needed
3. **Keep DRY**: Don't Repeat Yourself
4. **Consistent patterns**: Follow existing code patterns

## UI/UX Standards

### Emoji Usage in Screens & Modals
- All new **pages/screens** must include relevant emojis in their titles and section headers (similar to existing screens)
- All new **modals** must include relevant emojis in their headers and field labels (similar to Patient Modal pattern)
- Use emojis to make the UI more friendly and visually clear for users
- Examples: 🐾 for pets, 👤 for owners, 📅 for dates, 🏠 for boarding, 💊 for medical, 📋 for forms, 🏷️ for tags/labels

---

## Shared Components & CSS Classes (MUST USE)

**CRITICAL: Always use existing shared components and CSS classes instead of writing raw Tailwind. This ensures consistency across the entire application.**

### React Components (`frontend/src/components/common/`)

| Component | Import | Usage |
|-----------|--------|-------|
| `Button` | `import { Button } from '../common/Button'` | All buttons. Variants: `primary`, `secondary`, `danger`, `outline` |
| `Input` | `import { Input } from '../common/Input'` | Text inputs with label & error support |
| `Modal` | `import { Modal } from '../common/Modal'` | All modals. Sizes: `sm`, `md`, `lg`, `xl` |
| `ConfirmationModal` | `import { ConfirmationModal } from '../common/ConfirmationModal'` | Delete/warning confirmations. Variants: `warning`, `danger`, `info` |
| `Card` | `import { Card } from '../common/Card'` | Card containers with optional title & action |
| `SearchableSelect` | `import { SearchableSelect } from '../common/SearchableSelect'` | Dropdowns with search, icons, clear support |
| `SelectionCard` | `import { SelectionCard } from '../common/SelectionCard'` | Toggle/radio card selections with color themes |
| `DataTable` | `import { DataTable } from '../common/DataTable'` | Tables with sorting, drag-and-drop columns |
| `PhoneInput` | `import { PhoneInput } from '../common/PhoneInput'` | International phone input with country codes |
| `ImageUpload` | `import { ImageUpload } from '../common/ImageUpload'` | Image upload with preview. Shapes: `circle`, `square` |
| `FileAttachment` | `import { FileAttachment } from '../common/FileAttachment'` | File upload/download/delete for attachments |
| `ReadOnlyBadge` | `import { ReadOnlyBadge } from '../common/ReadOnlyBadge'` | Read-only permission badge |
| `PermissionGuard` | `import { PermissionGuard } from '../common/PermissionGuard'` | Wrap content that requires permissions |
| `ScreenPermissionGuard` | `import { ScreenPermissionGuard } from '../common/ScreenPermissionGuard'` | Screen-level permission guard |
| `LogoLoader` | `import { LogoLoader } from '../common/LogoLoader'` | App loading spinner with logo |
| `ColorPicker` | `import { ColorPicker } from '../common/ColorPicker'` | Color selection component |
| `AnimatedNumber` | `import { AnimatedNumber } from '../common/AnimatedNumber'` | Animated counting numbers for dashboards |

### Custom Hooks (`frontend/src/hooks/`)

| Hook | Usage |
|------|-------|
| `useScreenPermission` | Check screen-level read/write/delete permissions |
| `usePhonePermission` | Check if user can view phone numbers + `maskPhoneNumber()` |
| `usePermission` | General permission checking |
| `useLanguage` | Language & RTL detection |
| `useNotificationSound` | Play notification sounds |
| `useCountUp` | Animated number counting |
| `useScrollAnimation` | Scroll-based animation triggers |

### CSS Utility Classes (`frontend/src/index.css`)

**Buttons** - Use `<Button>` component instead, but these classes exist:
- `.btn` - Base button styles
- `.btn-primary` - Gold/yellow primary button
- `.btn-secondary` - Gray secondary button
- `.btn-danger` - Red danger button
- `.btn-outline` - Outlined border button

**Form Elements:**
- `.input` - Styled text input with focus ring
- `.select` - Styled dropdown select
- `.textarea` - Styled textarea
- `.label` / `.form-label` - Form field labels

**Layout:**
- `.card` - Card container with shadow & padding
- `.page-container` - Max-width page wrapper with padding
- `.table` / `.table th` / `.table td` - Styled table

**Dropdowns:**
- `.dropdown-menu` - Dropdown container with shadow
- `.dropdown-item` - Dropdown item with hover

**Alerts:**
- `.alert-success` - Green success alert
- `.alert-error` - Red error alert
- `.alert-warning` - Yellow warning alert
- `.alert-info` - Blue info alert

**Badges (dark mode):**
- `.badge-success` - Green badge
- `.badge-warning` - Yellow badge
- `.badge-danger` - Red badge
- `.badge-info` - Blue badge

**Other:**
- `.empty-state` - Empty state container (centered text, gray bg)
- `.list-item` - List item with hover
- `.section-header` - Section header text
- `.info-box` - Read-only info display box

### Usage Rules (MANDATORY)

1. **Buttons**: Always use `<Button variant="primary">` instead of raw `<button className="bg-blue-600...">`
2. **Modals**: Always use `<Modal>` or `<ConfirmationModal>` instead of building custom modal HTML
3. **Inputs**: Always use `<Input>` with label/error props instead of raw `<input className="...">`
4. **Cards**: Always use `<Card>` instead of raw `<div className="card">`
5. **Selects with search**: Always use `<SearchableSelect>` instead of building custom dropdowns
6. **Tables**: Always use `<DataTable>` instead of raw `<table>` elements
7. **Permissions**: Always wrap protected content with `<PermissionGuard>` or `<ScreenPermissionGuard>`
8. **Phone inputs**: Always use `<PhoneInput>` for phone number fields
9. **CSS Classes**: Use `.input`, `.select`, `.textarea` classes for any form elements not using React components
10. **Alerts**: Use `.alert-success`, `.alert-error`, etc. for inline messages
