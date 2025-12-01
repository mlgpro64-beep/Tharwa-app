# TaskField Design Guidelines

## Design Approach
**iOS-Inspired Native Mobile App** - This app emulates iOS design patterns with native feel, optimized for mobile-first experience with touch gestures and haptic feedback.

## Core Design Elements

### A. Typography
- **Primary Font**: Plus Jakarta Sans (weights: 400, 500, 600, 700, 800)
- **Hierarchy**:
  - Headers: 24-32px, font-extrabold (800), tracking-tight
  - Subheaders: 18-20px, font-bold (700)
  - Body: 14-16px, font-medium (500)
  - Labels: 10-12px, font-bold uppercase, tracking-wider
  - Small text: 10px for metadata

### B. Layout & Spacing
- **Tailwind Units**: Primarily use 2, 4, 6, 8 units (p-2, p-4, p-6, p-8)
- **Safe Areas**: Account for mobile notches using env(safe-area-inset-*)
- **Container Padding**: px-6 standard, px-4 for tight spaces
- **Vertical Rhythm**: py-4 to py-8 for sections, mb-6 to mb-8 between major blocks

### C. Component Library

**Cards** (Task Cards, Profile Cards):
- Rounded: rounded-[2rem] (32px)
- Background: bg-white dark:bg-surface-dark
- Shadow: shadow-sm, hover:shadow-xl
- Padding: p-6
- Active state: active:scale-[0.99]

**Buttons**:
- Primary: h-14 rounded-2xl bg-primary text-white font-bold shadow-lg
- Secondary: h-12 rounded-2xl bg-gray-100 dark:bg-gray-800
- Icon buttons: w-10 h-10 rounded-full
- Active: active:scale-[0.98] or active:scale-90 for icon buttons

**Inputs**:
- Height: h-16 with floating labels
- Rounded: rounded-2xl
- Border: border-2 border-transparent focus:border-primary/50
- Label animation: Floats to top on focus/value

**Modals**:
- Bottom sheet style on mobile: rounded-t-[2.5rem]
- Backdrop: bg-black/40 backdrop-blur-sm
- Handle bar: w-12 h-1.5 rounded-full (mobile only)

**Navigation**:
- Bottom nav: Fixed, backdrop-blur-xl, h-16, pb-safe
- Active state: bg-primary/10, -translate-y-1, scale-110 icon
- Icons: Material Symbols Outlined, 26px

**Badges & Pills**:
- Rounded: rounded-xl to rounded-full
- Padding: px-3 py-1.5
- Background: bg-gray-50 dark:bg-gray-800
- Font: text-xs font-bold

### D. Color Usage
**Backgrounds**:
- App: bg-background-light (#F2F2F7) / dark:bg-background-dark (#000000)
- Cards: bg-surface (#ffffff) / dark:bg-surface-dark (#1C1C1E)
- Overlays: bg-surface/85 with backdrop-blur-xl

**Text**:
- Primary: text-text-primary / dark:text-text-primary-dark
- Secondary: text-text-secondary (opacity 60%) / dark:text-text-secondary-dark
- Labels: Uppercase, tracking-wider, opacity-60

**Accents**:
- Primary actions: #007AFF (iOS Blue)
- Success: #34C759 (green)
- Warning: #FF9500 (orange)
- Danger: #FF3B30 (red)

### E. Animations
**Timing**: Use sparingly, only for meaningful feedback
- Transitions: duration-300, cubic-bezier(0.2, 0.8, 0.2, 1)
- Entrance: animate-slide-up, animate-fade-in
- Interactions: active:scale-[0.98], hover states minimal
- Loading: animate-spin, animate-pulse-slow

**Gestures**:
- Swipe to save: translateX with smooth spring return
- Pull to refresh: Native overscroll disabled
- Tap highlights: -webkit-tap-highlight-color: transparent

## Mobile-Specific Patterns

### Screen Structure
```
<Screen safeAreaTop safeAreaBottom>
  <header> // Fixed positioning when needed
  <main> // Scrollable content
</Screen>
// BottomNav auto-managed
```

### Touch Targets
- Minimum: 44x44px (iOS guideline)
- Preferred: 48-56px for primary actions
- Icon buttons: w-10 h-10 minimum

### Visual Feedback
- Haptic feedback on interactions (trigger(5) light, trigger(10) medium)
- Toast notifications: Bottom-center, rounded-full, 3s duration
- Loading states: Skeleton screens or spinners, no empty states

### List Patterns
- Gap: gap-4 to gap-6 between cards
- Intersection observer for lazy loading
- Swipe gestures for secondary actions (save/unsave)

## Icons
- **Library**: Material Symbols Outlined via CDN
- **Filled variant**: Add `material-symbols-filled` class for active states
- **Sizes**: text-base (16px) for inline, text-[22px] for buttons, text-5xl for features

## Images
Use images strategically:
- **User Avatars**: 40-48px circular
- **Task Images**: Full-width cards when available
- **Map Markers**: Custom pins with primary color
- No hero images (dashboard app, not marketing)