# Design System Guidelines
## Neumorphic Soft UI Design Language

> **Design Philosophy**: A premium, tactile interface that feels soft, raised, and interactive. Every element should appear to emerge from the background with subtle depth, creating a sense of physicality and elegance.

---

## 1. Design Principles

### Core Philosophy
- **Soft Neumorphism**: Elements appear to be gently raised from the surface with soft shadows and highlights
- **Tactile Feedback**: Every interaction should feel physical and responsive
- **Clear Hierarchy**: Active states are dramatically emphasized through color, elevation, and glow
- **Minimalist Elegance**: Clean, uncluttered interfaces with generous whitespace
- **Gradient Accents**: Vibrant gradient glows for active states create visual interest and depth

### Design Tenets
1. **Depth Through Shadow**: Use soft, multi-layered shadows to create elevation
2. **Gradient Glow**: Active elements feature vibrant gradient halos (pink → purple → orange)
3. **Capsule Shapes**: Rounded pill/capsule containers create soft, friendly forms
4. **Circular Highlights**: Active states use circular raised elements with gradient borders
5. **Icon-First Navigation**: Icons are primary, text labels are secondary and minimal

---

## 2. Structure & Layout

### Container Patterns

**Primary Navigation Container (Bottom Nav)**
- Shape: Horizontal capsule/pill with rounded ends
- Border Radius: `28px` (very rounded, pill-shaped)
- Background: Pure white (`#FFFFFF`) or very light gray (`#F5F5F5`)
- Shadow: Soft, subtle shadow creating raised appearance
- Padding: Horizontal `8px`, Vertical `8px` (tight internal padding)
- Margin: `16px` horizontal margin, `16px` bottom margin
- Max Width: `md` breakpoint (centered on larger screens)

**Card/Content Containers**
- Shape: Rounded rectangles
- Border Radius: `16px` to `24px` (generous rounding)
- Background: White with subtle transparency
- Shadow: Multi-layer soft shadows
- Padding: `16px` to `24px` standard

### Layout Grid
- **Spacing Scale**: 4px base unit (4, 8, 12, 16, 20, 24, 32px)
- **Container Padding**: `16px` minimum, `24px` preferred
- **Component Gaps**: `8px` to `16px` between related elements
- **Section Spacing**: `24px` to `32px` between major sections

### Safe Areas
- Always respect device safe areas (notches, home indicators)
- Use `env(safe-area-inset-*)` for padding
- Bottom navigation: `pb-safe` (padding-bottom: safe-area-inset-bottom)

---

## 3. Spacing System

### Spacing Scale (4px base unit)
```
xs:   4px   (0.25rem)  - Tight spacing, icon padding
sm:   8px   (0.5rem)   - Component internal spacing
md:   12px  (0.75rem)  - Standard gap between elements
base: 16px  (1rem)     - Default spacing, container padding
lg:   20px  (1.25rem)  - Section spacing
xl:   24px  (1.5rem)   - Major section spacing
2xl:  32px  (2rem)     - Large section spacing
3xl:  48px  (3rem)     - Hero section spacing
```

### Application Rules
- **Navigation Items**: `8px` gap between icon and label
- **Button Padding**: `12px` horizontal, `8px` vertical minimum
- **Card Padding**: `16px` to `24px` internal padding
- **Screen Margins**: `16px` horizontal margins on mobile
- **Vertical Rhythm**: `24px` between major content blocks

---

## 4. Typography

### Font Family
- **Primary**: System font stack (San Francisco on iOS, Roboto on Android)
- **Fallback**: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Arabic Support**: Include "Cairo" or similar Arabic font

### Type Scale

**Navigation Labels**
- Size: `10px` (0.625rem)
- Weight: `500` (medium) inactive, `700` (bold) active
- Tracking: `0.05em` (slightly wider letter spacing)
- Color: Dark gray (`#666666`) inactive, Primary color active
- Line Height: `1.2`

**Body Text**
- Size: `14px` to `16px` (0.875rem to 1rem)
- Weight: `400` (regular) to `500` (medium)
- Line Height: `1.5` to `1.6`
- Color: Dark gray (`#333333`) to black (`#000000`)

**Headings**
- H1: `28px` to `32px`, weight `700` to `800`
- H2: `24px` to `28px`, weight `700`
- H3: `20px` to `24px`, weight `600` to `700`
- Line Height: `1.2` to `1.3`
- Tracking: `-0.02em` (tighter)

**Labels & Metadata**
- Size: `11px` to `12px` (0.6875rem to 0.75rem)
- Weight: `500` to `600`
- Color: Medium gray (`#888888`)
- Tracking: `0.05em`

### Typography Principles
- **Minimal Text**: Use icons and visual cues over text when possible
- **Clear Hierarchy**: Size and weight differences create clear information hierarchy
- **Readable Contrast**: Minimum 4.5:1 contrast ratio for body text
- **Active State Emphasis**: Bold weight and color change for active navigation items

---

## 5. Color System

### Base Colors

**Backgrounds**
- **Primary Background**: Very light gray (`#F5F5F5` to `#FAFAFA`)
- **Container Background**: Pure white (`#FFFFFF`)
- **Overlay Background**: Light gray (`#E5E5E5`)

**Text Colors**
- **Primary Text**: Dark gray to black (`#333333` to `#000000`)
- **Secondary Text**: Medium gray (`#666666`)
- **Tertiary Text**: Light gray (`#888888`)
- **Inactive Navigation**: Dark gray (`#666666`)

### Active State Colors

**Gradient Glow (Active Navigation)**
- **Primary Gradient**: Pink → Purple → Orange
  - Start: `#FF6B9D` (vibrant pink)
  - Mid: `#9C27FF` (purple)
  - End: `#FF9800` (orange)
- **Gradient Direction**: Radial or linear (135deg angle)
- **Opacity**: `0.3` to `0.5` for glow effect
- **Spread**: `8px` to `16px` blur radius

**Active Icon Color**
- **Primary Active**: Red (`#FF0000` or `#DC2626`)
- **Alternative**: Primary brand color (if red doesn't fit brand)
- **Glow**: Matching gradient glow around active icon

**Inactive State**
- **Icon Color**: Dark gray (`#666666`)
- **Text Color**: Dark gray (`#666666`)
- **Background**: Transparent or very subtle gray

### Color Application Rules
- **Active States**: Always use gradient glow + color change
- **Inactive States**: Muted gray, no glow
- **Hover States**: Slight color shift toward active state
- **Contrast**: Ensure sufficient contrast for accessibility

---

## 6. Component Design Patterns

### Bottom Navigation Bar

**Container**
- Shape: Horizontal capsule (`rounded-[28px]`)
- Background: White (`#FFFFFF`)
- Shadow: `0 2px 8px rgba(0,0,0,0.08)` (soft, subtle)
- Border: Optional subtle border (`1px solid rgba(0,0,0,0.05)`)
- Padding: `8px` internal padding
- Height: `64px` to `72px` total height

**Navigation Items**
- Layout: Horizontal flex, equal distribution
- Item Padding: `8px` to `12px` horizontal, `8px` vertical
- Gap: `4px` between icon and label
- Alignment: Center-aligned, icon above text

**Active State**
- **Circular Highlight**: Circular raised element around icon
  - Size: `48px` to `56px` diameter
  - Background: White with subtle gradient
  - Border: Gradient glow border (`2px` to `4px` width)
  - Border Colors: Pink → Purple → Orange gradient
  - Shadow: `0 4px 12px rgba(255,107,157,0.3)` (glow shadow)
  - Elevation: Slightly raised above container surface
- **Icon**: 
  - Color: Red (`#FF0000`) or primary brand color
  - Size: `24px` to `28px`
  - Weight: Filled or bold stroke (`2.5px`)
  - Glow: Subtle drop shadow matching gradient
- **Label**:
  - Color: Primary brand color or matching active color
  - Weight: `700` (bold)
  - Size: `10px`

**Inactive State**
- **Icon**: 
  - Color: Dark gray (`#666666`)
  - Size: `22px` to `24px`
  - Weight: Regular stroke (`2px`)
  - No glow or shadow
- **Label**:
  - Color: Dark gray (`#666666`)
  - Weight: `500` (medium)
  - Size: `10px`
- **Background**: Transparent, no highlight

### Buttons

**Primary Button**
- Shape: Rounded rectangle (`rounded-2xl` = `16px`)
- Background: Gradient or solid primary color
- Padding: `12px` horizontal, `10px` vertical
- Shadow: Soft shadow with slight glow
- Active State: `scale(0.98)` on press

**Secondary Button**
- Shape: Rounded rectangle (`rounded-xl` = `12px`)
- Background: White with subtle border
- Border: `1px solid rgba(0,0,0,0.1)`
- Shadow: Very subtle shadow
- Active State: `scale(0.98)` on press

**Icon Button**
- Shape: Circular (`rounded-full`)
- Size: `40px` to `48px` diameter
- Background: White with subtle shadow
- Active State: Scale down + shadow increase

### Cards

**Standard Card**
- Shape: Rounded rectangle (`rounded-2xl` = `16px`)
- Background: White (`#FFFFFF`)
- Shadow: `0 2px 8px rgba(0,0,0,0.08)`
- Padding: `16px` to `24px`
- Border: Optional subtle border (`1px solid rgba(0,0,0,0.05)`)

**Elevated Card**
- Same as standard but with stronger shadow
- Shadow: `0 4px 16px rgba(0,0,0,0.12)`
- Use for interactive or featured content

### Input Fields

**Text Input**
- Shape: Rounded rectangle (`rounded-xl` = `12px`)
- Background: White or very light gray
- Border: `1px solid rgba(0,0,0,0.1)`
- Padding: `12px` horizontal, `10px` vertical
- Focus State: Border color change + subtle glow
- Shadow: Subtle shadow on focus

### Modals & Overlays

**Modal Container**
- Background: White (`#FFFFFF`)
- Border Radius: `24px` top corners (bottom sheet style)
- Shadow: Strong shadow (`0 8px 32px rgba(0,0,0,0.2)`)
- Padding: `24px`
- Backdrop: Semi-transparent dark overlay (`rgba(0,0,0,0.5)`)

---

## 7. Shadows & Depth

### Shadow System

**Level 1 - Subtle Elevation**
- `0 1px 3px rgba(0,0,0,0.05)`
- Use for: Subtle depth, inactive elements

**Level 2 - Standard Elevation**
- `0 2px 8px rgba(0,0,0,0.08)`
- Use for: Cards, containers, navigation bars

**Level 3 - Raised Elements**
- `0 4px 12px rgba(0,0,0,0.12)`
- Use for: Interactive elements, buttons

**Level 4 - Floating Elements**
- `0 8px 24px rgba(0,0,0,0.16)`
- Use for: Modals, dropdowns, elevated cards

**Gradient Glow Shadow (Active States)**
- `0 4px 16px rgba(255,107,157,0.3)` (pink glow)
- `0 4px 16px rgba(156,39,255,0.3)` (purple glow)
- `0 4px 16px rgba(255,152,0,0.3)` (orange glow)
- Combined: Multi-layer shadow with gradient colors
- Use for: Active navigation items, selected states

### Shadow Principles
- **Soft Edges**: Always use blur radius, never hard shadows
- **Layered Shadows**: Combine multiple shadows for depth
- **Color-Tinted Shadows**: Match shadow color to element color
- **Subtle on Light**: Lighter shadows on light backgrounds
- **Stronger on Dark**: Stronger shadows on dark backgrounds

---

## 8. Icons

### Icon System

**Size Scale**
- **Small**: `16px` - Inline with text
- **Standard**: `20px` to `24px` - Navigation, buttons
- **Large**: `32px` to `40px` - Feature icons, empty states
- **XLarge**: `48px` to `64px` - Hero sections

**Icon Style**
- **Stroke Weight**: `2px` standard, `2.5px` for active states
- **Style**: Outlined icons (not filled) for inactive states
- **Active Style**: Filled or bold stroke for active states
- **Color**: Follow color system (gray inactive, colored active)

**Icon Spacing**
- **With Text**: `8px` gap between icon and text
- **In Buttons**: `12px` padding around icon
- **In Navigation**: `4px` gap between icon and label

### Icon Principles
- **Consistent Style**: Use same icon library throughout (e.g., Lucide, Material Symbols)
- **Visual Weight**: Match icon weight to text weight
- **Active Emphasis**: Bold or filled icons for active states
- **Accessibility**: Ensure sufficient size for touch targets (minimum `44px`)

---

## 9. Animations & Interactions

### Animation Principles
- **Spring Physics**: Use spring animations for natural feel
- **Quick Feedback**: `200ms` to `300ms` for most interactions
- **Smooth Transitions**: Ease-in-out or spring curves
- **Purposeful Motion**: Every animation should have a purpose

### Standard Animations

**Button Press**
- Scale: `scale(0.95)` to `scale(0.98)`
- Duration: `150ms` to `200ms`
- Easing: `ease-out` or spring

**Navigation Transition**
- Active Indicator: Spring animation (`stiffness: 400, damping: 20`)
- Icon Scale: `scale(0.95)` inactive to `scale(1)` active
- Icon Lift: `translateY(-2px)` for active state
- Duration: `300ms`
- Easing: Spring curve

**Card Hover/Lift**
- Transform: `translateY(-4px)`
- Shadow: Increase shadow intensity
- Duration: `200ms`
- Easing: `ease-out`

**Modal Open/Close**
- Scale: `scale(0.95)` to `scale(1)`
- Opacity: `0` to `1`
- Duration: `300ms`
- Easing: Spring or `ease-out`

**Gradient Glow Pulse**
- Opacity: `0.3` to `0.5` (subtle pulse)
- Duration: `2s`
- Easing: `ease-in-out`
- Use sparingly for attention

### Interaction Feedback
- **Touch Targets**: Minimum `44px × 44px`
- **Visual Feedback**: Immediate color/shadow change on press
- **Haptic Feedback**: Consider haptic feedback for important actions
- **Loading States**: Smooth transitions, skeleton screens preferred

---

## 10. Responsive Design

### Breakpoints
- **Mobile**: `0px` to `640px` (default, mobile-first)
- **Tablet**: `641px` to `1024px`
- **Desktop**: `1025px` and above

### Mobile-First Approach
- Design for mobile first, enhance for larger screens
- Navigation: Bottom navigation on mobile, sidebar on desktop
- Spacing: Tighter on mobile, more generous on desktop
- Typography: Slightly larger on desktop

### Adaptive Patterns
- **Navigation**: Bottom nav on mobile, top/sidebar on desktop
- **Cards**: Single column on mobile, grid on desktop
- **Spacing**: `16px` margins on mobile, `24px` on tablet, `32px` on desktop
- **Typography**: Scale up `1.125x` on tablet, `1.25x` on desktop

---

## 11. Accessibility

### Contrast Requirements
- **Body Text**: Minimum `4.5:1` contrast ratio
- **Large Text**: Minimum `3:1` contrast ratio
- **Interactive Elements**: Minimum `3:1` contrast ratio
- **Active States**: High contrast for visibility

### Touch Targets
- **Minimum Size**: `44px × 44px` (iOS HIG, Material Design)
- **Spacing**: `8px` minimum gap between touch targets
- **Navigation Items**: `48px` to `56px` height recommended

### Visual Indicators
- **Focus States**: Clear focus indicators (outline or glow)
- **Active States**: Multiple indicators (color, size, glow)
- **Error States**: Red color + icon + message
- **Success States**: Green color + icon + message

### Screen Reader Support
- **Labels**: Proper `aria-label` attributes
- **Roles**: Semantic HTML and ARIA roles
- **States**: `aria-selected`, `aria-current` for navigation
- **Descriptions**: Alt text for icons and images

---

## 12. Dark Mode Considerations

### Dark Mode Adaptations
- **Background**: Dark gray (`#1A1A1A` to `#2A2A2A`)
- **Cards**: Slightly lighter dark gray (`#2A2A2A` to `#333333`)
- **Text**: Light gray to white (`#E5E5E5` to `#FFFFFF`)
- **Shadows**: Stronger, darker shadows
- **Gradient Glows**: More vibrant, higher opacity
- **Borders**: Subtle light borders (`rgba(255,255,255,0.1)`)

### Dark Mode Principles
- Maintain same visual hierarchy
- Increase contrast for readability
- Softer shadows (less harsh)
- Vibrant accent colors pop more

---

## 13. Implementation Guidelines for AI

### When Creating Components

1. **Navigation Bars**
   - Use capsule shape (`rounded-[28px]`)
   - White background with soft shadow
   - Active state: Circular highlight with gradient glow
   - Icons: `22px` to `24px`, gray inactive, colored active
   - Labels: `10px`, `500` weight inactive, `700` weight active

2. **Buttons**
   - Rounded corners (`rounded-xl` to `rounded-2xl`)
   - Soft shadows (Level 2 or 3)
   - Active state: `scale(0.98)` + shadow increase
   - Padding: `12px` horizontal minimum

3. **Cards**
   - Rounded corners (`rounded-2xl`)
   - White background
   - Soft shadow (Level 2)
   - Padding: `16px` to `24px`

4. **Active States**
   - Always use gradient glow (pink → purple → orange)
   - Combine color change + elevation + glow
   - Animate transitions smoothly (spring physics)

5. **Spacing**
   - Use 4px base unit
   - `16px` container padding standard
   - `8px` gap between related elements
   - `24px` between major sections

6. **Typography**
   - System font stack
   - `10px` for navigation labels
   - `14px` to `16px` for body text
   - Bold weight (`700`) for active states

7. **Colors**
   - White backgrounds (`#FFFFFF`)
   - Dark gray text (`#666666` inactive, `#333333` active)
   - Gradient glow for active states (pink/purple/orange)
   - Red or primary color for active icons

8. **Shadows**
   - Always soft, blurred edges
   - Level 2 (`0 2px 8px rgba(0,0,0,0.08)`) for containers
   - Gradient glow shadows for active states
   - Multi-layer shadows for depth

### Code Patterns

**Navigation Item (Active)**
```tsx
// Active state with gradient glow
<div className="relative">
  {/* Gradient glow background */}
  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-orange-400/30 blur-md" />
  
  {/* Circular highlight */}
  <div className="relative rounded-full bg-white p-3 border-2 border-transparent bg-clip-padding"
       style={{
         backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FF6B9D, #9C27FF, #FF9800)',
         backgroundOrigin: 'border-box',
         backgroundClip: 'padding-box, border-box'
       }}>
    <Icon className="w-6 h-6 text-red-500" />
  </div>
  
  {/* Label */}
  <span className="text-[10px] font-bold text-primary">Label</span>
</div>
```

**Container (Capsule Shape)**
```tsx
<div className="bg-white rounded-[28px] px-2 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
  {/* Content */}
</div>
```

**Card**
```tsx
<div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
  {/* Content */}
</div>
```

---

## 14. Design Checklist

When implementing UI components, verify:

- [ ] Uses capsule/pill shapes for navigation containers
- [ ] White or very light gray backgrounds
- [ ] Soft, blurred shadows (no hard edges)
- [ ] Active states have gradient glow (pink/purple/orange)
- [ ] Icons are `22px` to `24px` for navigation
- [ ] Labels are `10px` with proper weight (500 inactive, 700 active)
- [ ] Spacing follows 4px base unit
- [ ] Touch targets are minimum `44px × 44px`
- [ ] Smooth animations with spring physics
- [ ] Clear visual hierarchy through size, color, and elevation
- [ ] Sufficient contrast for accessibility
- [ ] Responsive design considerations

---

## Summary

This design system emphasizes **soft neumorphism** with:
- **Capsule-shaped containers** with generous rounding
- **Gradient glow effects** for active states (pink → purple → orange)
- **Circular highlights** for active navigation items
- **Soft shadows** creating depth and elevation
- **Minimalist typography** with clear hierarchy
- **Tactile interactions** with smooth animations

The overall aesthetic is **premium, soft, and tactile** - every element feels like it's gently raised from the surface, with active states dramatically emphasized through vibrant gradient glows and elevation changes.












