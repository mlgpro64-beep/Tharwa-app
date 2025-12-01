# TaskField Design Guidelines - Premium Glassmorphism Edition

## Design Approach
**Premium Glassmorphism Mobile App** - Luxury fintech-inspired design with frosted glass effects, vibrant gradients, and elegant animations. Think Revolut meets Apple Card meets iOS productivity excellence.

## Core Design Elements

### A. Typography
- **Primary Font**: Plus Jakarta Sans (weights: 400, 500, 600, 700, 800)
- **Hierarchy**:
  - Headers: 28-36px, font-extrabold (800), tracking-tight, gradient text for emphasis
  - Subheaders: 20-24px, font-bold (700), semi-transparent for glass effect
  - Body: 15-17px, font-medium (500), slightly increased line-height (1.6)
  - Labels: 11-13px, font-bold uppercase, tracking-widest, 50% opacity
  - Metadata: 11px, font-medium, 40% opacity

### B. Layout & Spacing
- **Tailwind Units**: 3, 4, 6, 8, 12, 16 (generous whitespace: p-6, p-8, gap-12)
- **Container Padding**: px-6 to px-8 standard, never cramped
- **Vertical Rhythm**: py-8 to py-16 for sections, mb-8 to mb-12 between blocks
- **Safe Areas**: env(safe-area-inset-*) for notches and gesture areas

### C. Glassmorphism System

**Glass Cards** (Primary Pattern):
- Background: bg-white/60 dark:bg-white/5 (subtle, frosted)
- Backdrop: backdrop-blur-2xl backdrop-saturate-150
- Border: border border-white/20 dark:border-white/10
- Rounded: rounded-3xl (24px minimum)
- Shadow: shadow-2xl shadow-black/5 dark:shadow-black/40
- Padding: p-6 to p-8
- Active: active:scale-[0.98] with duration-200

**Premium Glass Cards** (Featured Content):
- Background: bg-gradient-to-br from-white/70 to-white/50 dark:from-white/10 dark:to-white/5
- Backdrop: backdrop-blur-3xl backdrop-saturate-200
- Border: border-2 border-white/30 dark:border-white/15
- Shadow: shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.6)]
- Rounded: rounded-[2rem]

**Buttons**:
- Primary: h-14 rounded-2xl bg-gradient-to-r from-primary to-primary-dark shadow-xl shadow-primary/30 text-white font-bold
- Glass: h-14 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 font-bold
- Icon: w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md active:scale-90
- Active states: active:scale-[0.96] active:shadow-lg

**Inputs**:
- Height: h-16 with floating labels
- Background: bg-white/40 dark:bg-white/5 backdrop-blur-xl
- Border: border-2 border-white/20 focus:border-primary/40 focus:bg-white/60
- Rounded: rounded-2xl
- Label: Floats with translate-y-7 scale-75 on focus

**Modals & Overlays**:
- Bottom sheet: rounded-t-[2.5rem] bg-white/90 dark:bg-black/90 backdrop-blur-3xl
- Backdrop: bg-black/60 backdrop-blur-md
- Handle: w-12 h-1.5 rounded-full bg-white/30
- Content padding: p-8

**Navigation**:
- Bottom nav: Fixed, bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-t border-white/20
- Height: h-20 with pb-safe
- Active indicator: bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl
- Icon scale: active:scale-110 with translate-y-[-2px]

**Badges & Status**:
- Rounded: rounded-full
- Padding: px-4 py-2
- Glass effect: bg-white/30 dark:bg-white/10 backdrop-blur-md border border-white/20
- Gradient variants: bg-gradient-to-r with 20% opacity for categories

### D. Gradient & Accent System

**Primary Gradients**:
- Hero: bg-gradient-to-br from-primary via-primary-dark to-accent
- Cards: bg-gradient-to-br from-white/80 to-white/60 dark:from-white/8 to-white/4
- Buttons: bg-gradient-to-r from-primary to-primary-dark
- Overlays: bg-gradient-to-t from-black/80 to-transparent

**Vibrant Accents** (High-Impact Areas):
- Primary: #0066FF (vibrant blue)
- Secondary: #00D4FF (cyan)
- Success: #00E676 (neon green)
- Warning: #FFB800 (gold)
- Danger: #FF1744 (red)
- Purple: #9C27FF (premium tier)

**Text on Glass**:
- Primary: text-gray-900 dark:text-white (full opacity on glass)
- Secondary: text-gray-600 dark:text-gray-300 (60% opacity)
- Labels: text-gray-500 dark:text-gray-400 uppercase tracking-widest

### E. Premium Animations

**Micro-interactions**:
- Card entrance: animate-fade-in-up with stagger (50ms delay)
- Button press: scale-[0.96] + shadow reduction, duration-200
- Glass shimmer: Subtle gradient shift on hover (disabled on mobile)
- Success states: animate-scale-bounce with checkmark

**Page Transitions**:
- Slide in: translate-x-full to translate-x-0, duration-300 ease-out
- Modal open: scale-95 opacity-0 to scale-100 opacity-100, backdrop-blur increase
- Loading: Skeleton with shimmer gradient animation

**Gesture Feedback**:
- Swipe cards: translateX with spring animation (cubic-bezier(0.34, 1.56, 0.64, 1))
- Pull refresh: Scale icon from 0.8 to 1 with rotation
- Long press: Pulse shadow expansion

## Mobile-Specific Patterns

**Screen Backgrounds**:
- Light mode: bg-gradient-to-b from-gray-50 to-white
- Dark mode: bg-gradient-to-b from-gray-950 to-black
- Mesh gradient overlays for depth

**Touch Targets**:
- Minimum: 48x48px
- Primary actions: 56x56px
- Glass buttons feel larger due to blur/shadow

**List & Grid Patterns**:
- Gap: gap-6 between glass cards
- Masonry grid for varied content heights
- Floating action button: bottom-24 right-6, glass effect with primary gradient

**Visual Hierarchy**:
- Z-index layers: bg → cards (blur) → elevated cards → modals → toasts
- Shadow depth correlates to importance
- Blur intensity: 2xl (standard) → 3xl (premium) → none (text)

## Icons & Images

**Icons**:
- Material Symbols Outlined (CDN)
- Sizes: 20px inline, 24px buttons, 48px features
- Filled variant for active states with gradient fill

**Images**:
- User Avatars: 48px circular with border-2 border-white/30 shadow-lg
- Task Cards: Full-width 16:9 with rounded-t-3xl, gradient overlay from-transparent to-black/60
- Map Markers: Custom glass-morphic pins with primary gradient
- Background patterns: Subtle mesh gradients, never distracting

**Hero Sections** (Dashboard Top):
- Gradient background with glass card overlay
- User greeting with large avatar (80px)
- Stats cards in horizontal scroll with glass effect
- Height: Auto-fit content, minimum py-12

## Premium Touches

**Elevation System**:
- Level 1: shadow-lg (standard cards)
- Level 2: shadow-xl (interactive elements)
- Level 3: shadow-2xl (modals, featured)
- All shadows: Colored tint matching primary (shadow-primary/10)

**Separator Lines**:
- border-t border-white/10 dark:border-white/5 (nearly invisible on glass)
- Gradient dividers: h-px bg-gradient-to-r from-transparent via-white/20 to-transparent

**Empty States**:
- Glass card with gradient icon
- Motivational copy with generous spacing
- CTA button with gradient

This design creates a cohesive, premium mobile experience where every interaction feels polished and intentional, with glassmorphism enhancing depth without compromising readability or performance.