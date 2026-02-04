# 🎨 Customer Portal Redesign Plan
## Fluff N' Woof - Modern Mobile-First Design

---

## 📋 نظرة عامة | Overview

### الهدف | Goal
تحويل بوابة العملاء إلى تجربة تشبه تطبيق الموبايل مع تصميم حديث وأنيق يدعم:
- ✅ Mobile-First Design
- ✅ Bottom Navigation (App-Like)
- ✅ Dark Mode
- ✅ Smooth Animations
- ✅ RTL/LTR Support
- ✅ Scalable Architecture

---

## 🎨 Design System

### Color Palette

```typescript
// portalTheme.ts

export const colors = {
  // Brand Colors
  mint: {
    50: '#F0F9F4',
    100: '#DCF2E6',
    200: '#CEE8DC',  // Primary - brand-mint
    300: '#A8D5C2',
    400: '#7FC2A8',
    500: '#56AF8E',
    600: '#3D9B78',
    700: '#2D7A5E',
    800: '#1F5A45',
    900: '#123B2C',
  },
  pink: {
    50: '#FDF5F9',
    100: '#FAEAF3',
    200: '#F5D5E7',
    300: '#EAB8D5',  // Accent - brand-pink
    400: '#E091C0',
    500: '#D66AAB',
    600: '#C44896',
    700: '#A33579',
    800: '#82295E',
    900: '#611E45',
  },
  gold: {
    50: '#FFFDF5',
    100: '#FFFBE6',
    200: '#FDF6CC',
    300: '#F5DF59',  // Highlight - brand-gold
    400: '#E8C840',
    500: '#D4B02E',
    600: '#B8951F',
    700: '#957717',
    800: '#725A11',
    900: '#4F3E0C',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
};

export const lightTheme = {
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F7F6',
    tertiary: colors.mint[50],
    card: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  text: {
    primary: '#374151',      // رمادي غامق - ليس أسود
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    brand: colors.mint[700],
  },
  border: {
    default: colors.neutral[200],
    focus: colors.mint[400],
  },
  button: {
    primary: {
      bg: colors.mint[500],
      text: '#FFFFFF',
      hover: colors.mint[600],
    },
    secondary: {
      bg: colors.pink[300],
      text: colors.pink[800],
      hover: colors.pink[400],
    },
    ghost: {
      bg: 'transparent',
      text: colors.mint[600],
      hover: colors.mint[50],
    },
  },
  status: {
    success: '#10B981',
    warning: colors.gold[500],
    error: '#EF4444',
    info: colors.mint[500],
  },
};

export const darkTheme = {
  background: {
    primary: '#0F0F0F',
    secondary: '#1A1A1A',
    tertiary: '#242424',
    card: '#1F1F1F',
    elevated: '#2A2A2A',
  },
  text: {
    primary: '#F5F5F5',
    secondary: '#A3A3A3',
    tertiary: '#737373',
    inverse: '#171717',
    brand: colors.mint[300],
  },
  border: {
    default: '#333333',
    focus: colors.mint[500],
  },
  button: {
    primary: {
      bg: colors.mint[500],
      text: '#FFFFFF',
      hover: colors.mint[400],
    },
    secondary: {
      bg: colors.pink[400],
      text: '#FFFFFF',
      hover: colors.pink[300],
    },
    ghost: {
      bg: 'transparent',
      text: colors.mint[400],
      hover: 'rgba(206, 232, 220, 0.1)',
    },
  },
  status: {
    success: '#34D399',
    warning: colors.gold[400],
    error: '#F87171',
    info: colors.mint[400],
  },
};
```

### Typography

```typescript
export const typography = {
  fontFamily: {
    arabic: "'GE Dinar One', 'Noto Sans Arabic', sans-serif",
    english: "'DIN Next', 'Inter', system-ui, sans-serif",
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### Spacing & Sizing

```typescript
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
};

export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  card: '0 2px 8px rgba(0, 0, 0, 0.08)',
  elevated: '0 8px 24px rgba(0, 0, 0, 0.12)',
};
```

---

## 🏗️ Architecture

### File Structure

```
frontend/src/
├── pages/portal/
│   ├── index.ts                    # Export all pages
│   ├── CustomerLogin.tsx           # ✨ Redesign
│   ├── CustomerRegister.tsx        # ✨ Redesign
│   ├── ForgotPassword.tsx          # ✨ Redesign
│   ├── CustomerDashboard.tsx       # ✨ Redesign
│   ├── MyPets.tsx                  # ✨ Redesign
│   ├── BookAppointment.tsx         # ✨ Redesign
│   └── MyAppointments.tsx          # ✨ Redesign
│
├── components/portal/
│   ├── index.ts                    # Export all components
│   │
│   ├── layout/                     # 🆕 Layout Components
│   │   ├── PortalLayout.tsx        # Main app shell
│   │   ├── BottomNavigation.tsx    # Mobile bottom nav
│   │   ├── TopHeader.tsx           # Minimal top header
│   │   └── AuthLayout.tsx          # Auth pages layout
│   │
│   ├── ui/                         # 🆕 UI Primitives
│   │   ├── Button.tsx              # All button variants
│   │   ├── Input.tsx               # Text inputs
│   │   ├── Card.tsx                # Card container
│   │   ├── Avatar.tsx              # User/pet avatars
│   │   ├── Badge.tsx               # Status badges
│   │   ├── Modal.tsx               # Bottom sheet modal
│   │   ├── Skeleton.tsx            # Loading skeletons
│   │   ├── Toast.tsx               # Toast notifications
│   │   ├── IconButton.tsx          # Icon-only buttons
│   │   ├── Tabs.tsx                # Tab navigation
│   │   └── EmptyState.tsx          # Empty content state
│   │
│   ├── forms/                      # 🆕 Form Components
│   │   ├── FormField.tsx           # Field wrapper with label/error
│   │   ├── SearchableSelect.tsx    # Searchable dropdown
│   │   ├── DatePicker.tsx          # Date selection
│   │   ├── TimePicker.tsx          # Time slot picker
│   │   └── OtpInput.tsx            # OTP 6-digit input
│   │
│   ├── features/                   # 🆕 Feature Components
│   │   ├── PetCard.tsx             # Pet display card
│   │   ├── AppointmentCard.tsx     # Appointment card
│   │   ├── VetCard.tsx             # Vet selection card
│   │   ├── VisitTypeCard.tsx       # Visit type option
│   │   ├── TimeSlotGrid.tsx        # Available times grid
│   │   ├── BookingStepper.tsx      # Booking progress
│   │   └── QuickActions.tsx        # Dashboard quick actions
│   │
│   └── shared/                     # 🆕 Shared Components
│       ├── Logo.tsx                # Brand logo
│       ├── LanguageToggle.tsx      # EN/AR toggle
│       ├── ThemeToggle.tsx         # Light/Dark toggle
│       ├── LoadingScreen.tsx       # Full page loader
│       └── ErrorBoundary.tsx       # Error handling
│
├── hooks/portal/                   # 🆕 Custom Hooks
│   ├── usePortalTheme.ts           # Theme management
│   ├── useBottomSheet.ts           # Bottom sheet control
│   ├── useSwipeGesture.ts          # Swipe detection
│   └── useAnimatedMount.ts         # Mount animations
│
├── context/                        # 🆕 Context Providers
│   └── PortalThemeContext.tsx      # Theme provider
│
├── styles/portal/                  # 🆕 Portal Styles
│   ├── theme.ts                    # Theme configuration
│   ├── animations.css              # CSS animations
│   └── portal.css                  # Portal-specific styles
│
└── utils/portal/                   # 🆕 Utilities
    ├── animations.ts               # Framer Motion variants
    └── constants.ts                # Portal constants
```

---

## 📱 Component Specifications

### 1. PortalLayout (Main Shell)

```tsx
// components/portal/layout/PortalLayout.tsx

/**
 * Main layout for authenticated portal pages
 *
 * Features:
 * - Minimal top header (logo + profile)
 * - Bottom navigation (4 tabs)
 * - Safe area padding for mobile
 * - Theme-aware styling
 * - Page transition animations
 */

interface PortalLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  headerTitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

Structure:
┌─────────────────────────────────┐
│  TopHeader (optional)           │  ← 56px height
├─────────────────────────────────┤
│                                 │
│                                 │
│        Page Content             │  ← flex-1, scrollable
│        (children)               │
│                                 │
│                                 │
├─────────────────────────────────┤
│  BottomNavigation               │  ← 64px + safe-area
└─────────────────────────────────┘
```

### 2. BottomNavigation

```tsx
// components/portal/layout/BottomNavigation.tsx

/**
 * iOS/Android style bottom navigation
 *
 * Tabs:
 * 1. Home (Dashboard) - HomeIcon
 * 2. Pets - HeartIcon
 * 3. Book - CalendarPlusIcon (center, highlighted)
 * 4. Appointments - CalendarDaysIcon
 *
 * Features:
 * - Active indicator animation
 * - Haptic feedback on tap
 * - RTL support
 * - Theme-aware colors
 * - Safe area bottom padding
 */

Visual Design:
┌─────────────────────────────────────────────┐
│                                             │
│  🏠        💜       📅+       📋            │
│ Home      Pets     Book     Appts           │
│  ●                                          │  ← Active indicator
└─────────────────────────────────────────────┘

Animation:
- Icon scale on press: 0.95
- Active tab: icon color + dot indicator
- Page transition: slide left/right based on tab index
```

### 3. Card Component

```tsx
// components/portal/ui/Card.tsx

/**
 * Versatile card component
 *
 * Variants:
 * - default: Standard card with shadow
 * - elevated: More prominent shadow
 * - outlined: Border only, no shadow
 * - interactive: Hover/press states
 * - glass: Glassmorphism effect (dark mode)
 */

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}
```

### 4. Button Component

```tsx
// components/portal/ui/Button.tsx

/**
 * All button variants
 *
 * Variants:
 * - primary: Mint green filled
 * - secondary: Pink filled
 * - ghost: Transparent with text
 * - outline: Border only
 * - danger: Red for destructive actions
 *
 * Sizes: sm, md, lg, xl
 *
 * States: default, hover, active, disabled, loading
 */

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

// Animation: scale(0.98) on press, spring animation
```

### 5. Modal (Bottom Sheet)

```tsx
// components/portal/ui/Modal.tsx

/**
 * Mobile-native bottom sheet modal
 *
 * Features:
 * - Slides up from bottom
 * - Drag to close gesture
 * - Backdrop blur
 * - Multiple snap points (partial, full)
 * - Handle indicator for dragging
 * - Keyboard-aware
 */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: ('partial' | 'full')[];
  children: React.ReactNode;
}

Visual:
┌─────────────────────────────────┐
│         ▬▬▬▬▬                   │  ← Drag handle
├─────────────────────────────────┤
│  Modal Title              ✕     │
├─────────────────────────────────┤
│                                 │
│        Modal Content            │
│                                 │
└─────────────────────────────────┘
```

### 6. PetCard

```tsx
// components/portal/features/PetCard.tsx

/**
 * Pet display card with species icon
 *
 * Features:
 * - Species-specific icon/avatar
 * - Pet name & breed
 * - Age calculation
 * - Gender indicator
 * - Tap to view/edit
 * - Subtle shadow
 */

Visual:
┌─────────────────────────────────┐
│  ┌────────┐                     │
│  │  🐕    │  Luna               │
│  │  icon  │  Golden Retriever   │
│  └────────┘  2 years • Female   │
│                            ›    │
└─────────────────────────────────┘
```

### 7. AppointmentCard

```tsx
// components/portal/features/AppointmentCard.tsx

/**
 * Appointment display card
 *
 * Features:
 * - Date/time prominent display
 * - Pet info with avatar
 * - Vet info
 * - Status badge (color coded)
 * - Visit type indicator
 * - Cancel button (if applicable)
 */

Visual:
┌─────────────────────────────────┐
│  Tue, Feb 15              10:30 │  ← Date & Time
│                                 │
│  🐕 Luna                        │  ← Pet
│  General Checkup                │  ← Visit Type
│  Dr. Ahmed Hassan               │  ← Vet
│                                 │
│  ┌──────────┐      ┌─────────┐  │
│  │ مجدول   │      │  إلغاء  │  │
│  └──────────┘      └─────────┘  │
└─────────────────────────────────┘
```

---

## 📄 Page Designs

### 1. Login Page

```
┌─────────────────────────────────┐
│                          EN|AR  │  ← Language toggle
│                                 │
│         🐾                      │  ← Logo
│    Fluff N' Woof               │
│                                 │
│  ┌─────────────────────────────┐│
│  │                             ││
│  │    Welcome Back!            ││  ← Card
│  │    مرحباً بعودتك            ││
│  │                             ││
│  │    ┌───────────────────┐    ││
│  │    │ Email             │    ││
│  │    └───────────────────┘    ││
│  │                             ││
│  │    ┌───────────────────┐    ││
│  │    │ Password      👁  │    ││
│  │    └───────────────────┘    ││
│  │                             ││
│  │    Forgot password?         ││
│  │                             ││
│  │    ┌───────────────────┐    ││
│  │    │    Sign In        │    ││  ← Primary button
│  │    └───────────────────┘    ││
│  │                             ││
│  │    ────── or ──────         ││
│  │                             ││
│  │    Don't have account?      ││
│  │    Register now →           ││
│  │                             ││
│  └─────────────────────────────┘│
│                                 │
│         ☀️ | 🌙                 │  ← Theme toggle
└─────────────────────────────────┘

Background: Gradient mint to white (light)
           Gradient dark to darker (dark)
```

### 2. Dashboard

```
┌─────────────────────────────────┐
│  Good morning, Ahmed!     👤    │  ← TopHeader
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│
│  │  🎉 Book your next visit    ││  ← Welcome banner
│  │                             ││
│  │  ┌─────────────────────┐    ││
│  │  │   Book Appointment  │    ││
│  │  └─────────────────────┘    ││
│  └─────────────────────────────┘│
│                                 │
│  My Pets                See All │
│  ┌────────┐ ┌────────┐ ┌──────┐│
│  │ 🐕     │ │ 🐱     │ │  +   ││  ← Horizontal scroll
│  │ Luna   │ │ Milo   │ │ Add  ││
│  └────────┘ └────────┘ └──────┘│
│                                 │
│  Upcoming                       │
│  ┌─────────────────────────────┐│
│  │  Tomorrow, 10:30 AM         ││
│  │  🐕 Luna - Checkup          ││  ← Appointment card
│  │  Dr. Ahmed                  ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │  Feb 20, 2:00 PM            ││
│  │  🐱 Milo - Vaccination      ││
│  └─────────────────────────────┘│
│                                 │
├─────────────────────────────────┤
│  🏠    💜    📅+    📋         │  ← Bottom nav
└─────────────────────────────────┘
```

### 3. My Pets

```
┌─────────────────────────────────┐
│  My Pets                   +    │  ← Add button
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│
│  │  ┌────┐                     ││
│  │  │ 🐕 │  Luna               ││
│  │  └────┘  Golden Retriever   ││
│  │          2 years • Female   ││  ← PetCard
│  │                         ›   ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │  ┌────┐                     ││
│  │  │ 🐱 │  Milo               ││
│  │  └────┘  Persian            ││
│  │          1 year • Male      ││
│  │                         ›   ││
│  └─────────────────────────────┘│
│                                 │
├─────────────────────────────────┤
│  🏠    💜    📅+    📋         │
└─────────────────────────────────┘

Add Pet Modal (Bottom Sheet):
┌─────────────────────────────────┐
│            ▬▬▬▬▬                │
├─────────────────────────────────┤
│  Add New Pet               ✕    │
├─────────────────────────────────┤
│                                 │
│  Pet Name                       │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  Species                        │
│  ┌───────────────────────────┐  │
│  │ Select species         ▼ │  │
│  └───────────────────────────┘  │
│                                 │
│  Breed                          │
│  ┌───────────────────────────┐  │
│  │ Select breed           ▼ │  │
│  └───────────────────────────┘  │
│                                 │
│  Gender                         │
│  ┌─────────┐  ┌─────────────┐   │
│  │  Male   │  │   Female    │   │
│  └─────────┘  └─────────────┘   │
│                                 │
│  Birth Date (Optional)          │
│  ┌───────────────────────────┐  │
│  │ DD/MM/YYYY            📅 │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │        Add Pet            │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### 4. Book Appointment (Wizard)

```
Step 1 - Select Pet:
┌─────────────────────────────────┐
│  ← Book Appointment             │
├─────────────────────────────────┤
│  ○───○───○───○───○───○          │  ← Progress (6 steps)
│  Step 1 of 6                    │
│                                 │
│  Select your pet                │
│                                 │
│  ┌─────────────────────────────┐│
│  │  ┌────┐                  ✓  ││  ← Selected
│  │  │ 🐕 │  Luna               ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │  ┌────┐                     ││
│  │  │ 🐱 │  Milo               ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │        + Add New Pet        ││
│  └─────────────────────────────┘│
│                                 │
│  ┌───────────────────────────┐  │
│  │          Next             │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  🏠    💜    📅+    📋         │
└─────────────────────────────────┘

Step 5 - Select Time:
┌─────────────────────────────────┐
│  ← Book Appointment             │
├─────────────────────────────────┤
│  ○───●───●───●───●───○          │
│  Step 5 of 6                    │
│                                 │
│  Select time                    │
│  Tuesday, Feb 15, 2025          │
│                                 │
│  Morning                        │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │ 9:00 │ │ 9:30 │ │10:00 │    │
│  └──────┘ └──────┘ └──────┘    │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │10:30 │ │11:00 │ │11:30 │    │  ← Selected
│  └──────┘ └──────┘ └──────┘    │
│                                 │
│  Afternoon                      │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │ 2:00 │ │ 2:30 │ │ 3:00 │    │
│  └──────┘ └──────┘ └──────┘    │
│                                 │
│  ┌─────────┐ ┌───────────────┐  │
│  │  Back   │ │     Next      │  │
│  └─────────┘ └───────────────┘  │
├─────────────────────────────────┤
│  🏠    💜    📅+    📋         │
└─────────────────────────────────┘

Step 6 - Confirmation:
┌─────────────────────────────────┐
│  ← Book Appointment             │
├─────────────────────────────────┤
│  ●───●───●───●───●───●          │
│  Confirm Booking                │
│                                 │
│  ┌─────────────────────────────┐│
│  │                             ││
│  │     📅                      ││
│  │  Tuesday, Feb 15            ││
│  │  10:30 AM                   ││
│  │                             ││
│  │  ─────────────────────      ││
│  │                             ││
│  │  🐕 Luna                    ││
│  │  General Checkup            ││
│  │  Dr. Ahmed Hassan           ││
│  │                             ││
│  └─────────────────────────────┘│
│                                 │
│  Notes (Optional)               │
│  ┌───────────────────────────┐  │
│  │ Any special notes...      │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │    Confirm Booking        │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  🏠    💜    📅+    📋         │
└─────────────────────────────────┘
```

### 5. My Appointments

```
┌─────────────────────────────────┐
│  My Appointments                │
├─────────────────────────────────┤
│  ┌────────────┬────────────┐    │
│  │  Upcoming  │    Past    │    │  ← Tabs
│  └────────────┴────────────┘    │
│                                 │
│  Tomorrow                       │
│  ┌─────────────────────────────┐│
│  │  10:30 AM                   ││
│  │  🐕 Luna                    ││
│  │  General Checkup            ││
│  │  Dr. Ahmed                  ││
│  │  ┌─────────┐  ┌──────────┐  ││
│  │  │ مجدول  │  │   إلغاء  │  ││
│  │  └─────────┘  └──────────┘  ││
│  └─────────────────────────────┘│
│                                 │
│  February 20                    │
│  ┌─────────────────────────────┐│
│  │  2:00 PM                    ││
│  │  🐱 Milo                    ││
│  │  Vaccination                ││
│  │  Dr. Sara                   ││
│  │  ┌─────────┐                ││
│  │  │ مؤكد   │                ││
│  │  └─────────┘                ││
│  └─────────────────────────────┘│
│                                 │
├─────────────────────────────────┤
│  🏠    💜    📅+    📋         │
└─────────────────────────────────┘
```

---

## 🎬 Animations

### Page Transitions

```typescript
// utils/portal/animations.ts

import { Variants } from 'framer-motion';

// Page slide animation
export const pageSlide: Variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  }),
};

// Fade in up (for cards, list items)
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// Staggered children (for lists)
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

// Scale on tap
export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

// Bottom sheet animation
export const bottomSheet: Variants = {
  initial: {
    y: '100%',
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Success checkmark
export const successCheck: Variants = {
  initial: {
    scale: 0,
    rotate: -180,
  },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      delay: 0.1,
    },
  },
};
```

### CSS Animations

```css
/* styles/portal/animations.css */

/* Skeleton loading shimmer */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba(200, 200, 200, 0.2) 25%,
    rgba(200, 200, 200, 0.4) 50%,
    rgba(200, 200, 200, 0.2) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Pulse for notifications */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse 2s infinite;
}

/* Bounce for success */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.bounce {
  animation: bounce 0.5s ease;
}

/* Fade in */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

/* Slide up */
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-up {
  animation: slideUp 0.3s ease;
}
```

---

## 🌙 Dark Mode Implementation

### Theme Context

```tsx
// context/PortalThemeContext.tsx

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

export const PortalThemeProvider: React.FC = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return localStorage.getItem('portal-theme') as any || 'system';
  });

  const resolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    localStorage.setItem('portal-theme', theme);
  }, [theme, resolvedTheme]);

  // ...
};
```

### Tailwind Dark Mode Classes

```tsx
// Example usage in components

// Card
<div className="bg-white dark:bg-gray-900 shadow-card dark:shadow-none border dark:border-gray-800">

// Text
<p className="text-gray-700 dark:text-gray-300">

// Button
<button className="bg-mint-500 dark:bg-mint-600 hover:bg-mint-600 dark:hover:bg-mint-500">

// Input
<input className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
                  focus:border-mint-500 dark:focus:border-mint-400">

// Bottom Navigation
<nav className="bg-white dark:bg-gray-900 border-t dark:border-gray-800">
```

---

## 📋 Implementation Phases

### Phase 1: Foundation (Day 1-2)
- [ ] Create theme configuration (`styles/portal/theme.ts`)
- [ ] Set up `PortalThemeContext` with dark mode
- [ ] Create base UI components:
  - [ ] Button
  - [ ] Card
  - [ ] Input
  - [ ] Badge
  - [ ] Avatar
- [ ] Create animation utilities
- [ ] Update Tailwind config for new colors

### Phase 2: Layout (Day 2-3)
- [ ] Create `PortalLayout` shell
- [ ] Create `BottomNavigation` component
- [ ] Create `TopHeader` component
- [ ] Create `AuthLayout` for login/register
- [ ] Implement page transition animations
- [ ] Add safe area padding for mobile

### Phase 3: Form Components (Day 3-4)
- [ ] Create `FormField` wrapper
- [ ] Enhance `OtpInput` with new styling
- [ ] Create `Modal` (bottom sheet)
- [ ] Create `SearchableSelect` with new design
- [ ] Create `DatePicker` with new design
- [ ] Create `TimePicker` grid component

### Phase 4: Feature Components (Day 4-5)
- [ ] Create `PetCard` component
- [ ] Create `AppointmentCard` component
- [ ] Create `VetCard` component
- [ ] Create `VisitTypeCard` component
- [ ] Create `TimeSlotGrid` component
- [ ] Create `BookingStepper` component
- [ ] Create `QuickActions` widget

### Phase 5: Pages Redesign (Day 5-8)
- [ ] Redesign `CustomerLogin`
- [ ] Redesign `CustomerRegister`
- [ ] Redesign `ForgotPassword`
- [ ] Redesign `CustomerDashboard`
- [ ] Redesign `MyPets`
- [ ] Redesign `BookAppointment`
- [ ] Redesign `MyAppointments`

### Phase 6: Polish (Day 8-9)
- [ ] Add loading skeletons
- [ ] Add empty states
- [ ] Add error states
- [ ] Add toast notifications
- [ ] Add haptic feedback (if PWA)
- [ ] Test RTL thoroughly
- [ ] Test dark mode thoroughly

### Phase 7: Testing & Optimization (Day 9-10)
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Desktop testing
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Final RTL fixes
- [ ] Final dark mode fixes

---

## 🔧 Technical Notes

### Dependencies to Add

```json
{
  "framer-motion": "^10.x",  // For animations
  "@headlessui/react": "^1.x",  // For accessible components (optional)
  "class-variance-authority": "^0.x",  // For component variants
  "clsx": "^2.x"  // For class merging
}
```

### Tailwind Extensions

```javascript
// tailwind.config.js additions

module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Add portal-specific colors
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease',
        'fade-in': 'fadeIn 0.3s ease',
        'bounce-in': 'bounceIn 0.5s ease',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
};
```

### Safe Area Handling

```css
/* For notched devices (iPhone X+) */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.top-header {
  padding-top: env(safe-area-inset-top, 0);
}
```

---

## ✅ Success Criteria

1. **Mobile-First**: Works perfectly on mobile devices
2. **App-Like**: Feels like a native mobile app
3. **Fast**: Page transitions < 300ms
4. **Accessible**: WCAG 2.1 AA compliant
5. **Bilingual**: Full RTL support
6. **Themed**: Smooth dark/light mode toggle
7. **Maintainable**: Clean, documented code
8. **Scalable**: Easy to add new features

---

## 🎯 Priority Order

1. **BottomNavigation** - Core app-like navigation
2. **PortalLayout** - Shell for all pages
3. **Dashboard** - First impression after login
4. **Login** - First user touchpoint
5. **BookAppointment** - Main feature
6. **MyPets** - Secondary feature
7. **MyAppointments** - Tertiary feature
8. **Register/ForgotPassword** - Auth flows

---

Created: January 2026
Author: Claude Code
