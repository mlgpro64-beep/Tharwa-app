# THARWA (ذروة)

## Overview

THARWA (ذروة) is a mobile-first community marketplace application for everyday tasks. It connects clients who need help with local taskers who can complete tasks. The platform features a dual-role system where users can either post tasks (as clients) or complete tasks for payment (as taskers). Built with a modern full-stack architecture, it emphasizes an iOS-inspired native mobile experience with smooth animations, haptic feedback, and intuitive touch gestures.

## Business Model

**Platform Fee Structure**
- 5% platform fee on all completed tasks
- 95% of task payment goes to the tasker
- Client pays the full bid amount
- Platform fee is tracked in transactions for audit purposes

**Geographic Availability**
- Currently available only in Riyadh, Saudi Arabia
- Users outside Riyadh see "Coming Soon" message
- Location checked via browser geolocation API
- Riyadh bounds: Lat 24.4-25.1, Lon 46.3-47.1

**Daily Task Limit**
- Clients can only post 5 tasks per day
- Limit enforced in backend via `getTasksCreatedToday` storage method
- Returns HTTP 429 when limit exceeded with remaining count info
- API endpoint: GET /api/tasks/my/today-count returns current count and limit

**Identity Verification (Taskers Only)**
- Available at /verify route for taskers
- Requires ID photo (front/back) and selfie
- Shows verification status: pending, verified
- Verified taskers get a badge on their profile

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 19** with TypeScript for type-safe component development
- **Wouter** for lightweight client-side routing
- **Vite** as the build tool and development server with HMR support
- **TanStack Query** (React Query) for server state management and caching

**UI Design System**
- **Tailwind CSS** with custom iOS-inspired design tokens
- **Shadcn UI** component library (New York variant) for accessible, reusable components
- **Radix UI** primitives for headless component functionality
- Mobile-first responsive design with safe area insets for notched devices
- Dark mode support with system preference detection

**State Management Strategy**
- Server state managed via TanStack Query with optimistic updates
- Client state managed through React Context API (AppContext)
- Local state for UI interactions and form management
- LocalStorage for persistence of user preferences, saved tasks, and authentication state

**Design Philosophy**
- Premium glassmorphism aesthetic with backdrop blur and subtle gradients
- iOS-native feel with Plus Jakarta Sans typography and 24px rounded corners
- Touch-optimized interactions with Framer Motion scale transforms and micro-interactions
- Bottom sheet modals for mobile actions
- Floating label glass inputs with smooth transitions
- Lucide React icons for consistent iconography

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript for REST API endpoints
- **HTTP Server** with WebSocket support for real-time chat functionality
- Session-based authentication using express-session with memory store
- Security through bcrypt password hashing

**API Design**
- RESTful endpoints structured around resources (users, tasks, bids, messages, notifications)
- Consistent error handling with descriptive status codes
- Request validation and sanitization
- Cookie-based session management

**Real-time Features**
- WebSocket server for instant messaging between clients and taskers
- Message broadcasting per task conversation
- Connection management with task-based room isolation

**File Structure**
- Monorepo structure with shared schema definitions
- `server/` - Backend logic, routes, database access
- `client/` - React frontend application
- `shared/` - Common TypeScript types and Drizzle schema
- Path aliases for clean imports (`@/`, `@shared/`)

### Data Storage Solutions

**Database**
- **PostgreSQL** via Neon serverless driver
- **Drizzle ORM** for type-safe database queries and schema management
- Connection pooling for efficient database access

**Schema Design**
- Users table with dual-role support (client/tasker), balance tracking, ratings
- Tasks table with status lifecycle, geolocation, and budget information
- Bids table for tasker offers on tasks
- Messages table for task-specific conversations
- Transactions table for payment history tracking
- Notifications table for user alerts
- Saved tasks for user bookmarking

**Data Relationships**
- One-to-many: Users to Tasks (client), Tasks to Bids, Tasks to Messages
- Many-to-one: Tasks to Users (tasker), Bids to Users (tasker)
- Join tables via Drizzle relations for efficient queries with user details

**Migration Strategy**
- Drizzle Kit for schema migrations
- Schema-first development with TypeScript type generation

### Authentication & Authorization

**Authentication Method**
- Username/password authentication with bcrypt hashing
- Session-based auth stored in memory (development) or connect-pg-simple (production-ready)
- HTTP-only cookies for session token storage
- Session restoration on page load via /api/users/me endpoint check

**Authorization Model**
- Role-based access control (RBAC) with 'client' and 'tasker' roles
- Users can switch roles dynamically
- Middleware checks for authenticated routes
- User context propagation through request object

**Security Measures**
- Password hashing with bcrypt (10 salt rounds)
- Session secret configuration via environment variables
- Secure cookie settings (httpOnly, sameSite)
- Input validation using Zod schemas

## External Dependencies

### Third-party Services

**Mapping & Geolocation**
- **Leaflet.js** for interactive map displays
- CartoDB tile layer for map rendering
- Client-side geolocation API for user positioning

**Payment Processing**
- **Stripe** integration via stripe-replit-sync for real payments
- Wallet system with balance tracking for tasker earnings
- Transaction history with credit/debit tracking
- 5% platform fee on all completed tasks

### Database & Hosting

**Database**
- **Neon Serverless PostgreSQL** - Managed PostgreSQL database with WebSocket support
- Connection via `@neondatabase/serverless` driver
- Environment variable `DATABASE_URL` for connection string

### Development Tools

**Replit Integration**
- `@replit/vite-plugin-runtime-error-modal` for error overlay in development
- `@replit/vite-plugin-cartographer` for code navigation
- `@replit/vite-plugin-dev-banner` for development indicators

### UI Component Libraries

**Radix UI Primitives** (Full suite for accessible components):
- Dialog, Dropdown, Popover, Tooltip, Toast for overlays
- Select, Checkbox, Radio, Switch for form controls
- Accordion, Tabs, Navigation Menu for content organization
- Avatar, Progress, Slider for visual components

**Supporting Libraries**
- `react-hook-form` with `@hookform/resolvers` for form validation
- `zod` for runtime schema validation
- `date-fns` for date formatting and manipulation
- `clsx` and `tailwind-merge` for className utilities
- `class-variance-authority` for component variants
- `cmdk` for command palette functionality

### Build & Development

**Build Pipeline**
- Custom build script using esbuild for server bundling
- Vite for client bundling with code splitting
- TypeScript compilation with strict mode
- PostCSS with Tailwind and Autoprefixer

**Development Server**
- Vite dev server with HMR
- Express middleware mode for API proxy
- WebSocket server running alongside HTTP server

## Recent Features (December 2024)

**Professional Roles & Badges System**
- 19 predefined professional roles across 5 categories
- Category-specific badge colors:
  - Beauty & Fashion (pink): Model, Makeup Artist, Hair Stylist, Clothing Designer
  - Teaching & Education (green): Private Tutor, Language Translator, Sign Language
  - Art (blue): Drawing, Painting, Photography, Digital Art
  - Construction (red): Carpenter, Blacksmith, Electrician, Plumber
  - Special (yellow): Package Delivery, Furniture Moving, Car Washing, Home Barber
- Admin-only role assignment (verified professional badges)
- ProfessionalBadge component with icons and category colors
- Database tables: professional_roles, user_professional_roles

**Tasker Availability Calendar**
- Airbnb-style calendar for managing availability
- Days can be marked as "available" (green) or "busy" (red)
- Read-only mode for clients viewing tasker calendars
- Editable mode for taskers managing their own schedule
- Month navigation with Arabic/English support
- AvailabilityCalendar component with glassmorphism design
- Database table: tasker_availability

**Portfolio Gallery System**
- Photo upload with base64 encoding
- Drag-to-reorder functionality
- Lightbox viewer with navigation
- Maximum 5MB per photo
- Caption support for each photo
- PortfolioGallery component with glassmorphism cards
- Database table: user_photos

**Enhanced Profile Screen**
- Integrated professional badges display
- Portfolio gallery section for taskers
- Availability calendar toggle in Quick Actions
- Improved layout with premium glassmorphism design

**API Authorization Improvements**
- Admin-only endpoints for professional role assignment
- Ownership verification for availability mutations
- Ownership verification for photo mutations and reordering
- Secure API endpoints with proper 403 responses

**Help & Support System**
- /help route with comprehensive FAQ sections
- Contact options (WhatsApp, email, phone)
- Topics: getting started, payments, verification, ratings

**Legal Pages**
- /privacy route with privacy policy (data collection, usage, security, rights)
- /terms route with terms & conditions (acceptance, eligibility, accounts, payments, conduct, liability)
- Full Arabic/English localization

**Profile Picture Upload**
- Base64 image encoding for avatar storage
- Image preview before upload
- 5MB file size limit
- Stored in user.avatar field

**Premium Dark Mode Toggle**
- Glassmorphism design with sun/moon toggle buttons
- Smooth transitions with Framer Motion
- Persistent theme preference in localStorage

**Search Taskers Screen (December 2024)**
- Replaced client WalletScreen with SearchTaskersScreen in bottom nav
- Glass-styled search input with category filters
- Verified-only toggle to filter approved taskers
- Tasker cards showing: avatar, name, rating, completed tasks, professional badges
- Links to tasker profiles for viewing details
- Full RTL support for Arabic
- Route: /search-taskers

**Enhanced Notification System (December 2024)**
- New notification types: new_task, bid_received, task_completed, payment_request
- Category-based notifications: taskers receive alerts when tasks posted in their specialization
- Bid submission notifications: clients notified immediately when taskers submit offers
- Actionable notifications with deep links to relevant pages

**Task Deletion (December 2024)**
- Clients can delete their own open tasks
- Soft delete pattern (status='cancelled') preserves task history
- Delete button with confirmation modal on TaskDetailsScreen
- Ownership validation in backend
- Route: DELETE /api/tasks/:id

**Stripe Payment Integration (December 2024)**
- Real Stripe payments via stripe-replit-sync integration
- Payment flow: assigned → in_progress → completed (after Stripe confirmation)
- 5% platform fee applied on all transactions
- Tasker marks task complete → Client sees payment screen
- PaymentScreen with Stripe Elements for card input
- Payment summary showing: total, platform fee, tasker payout
- Transaction records for both client (debit) and tasker (credit)
- Routes: POST /api/payments/create-intent, POST /api/payments/confirm
- Task completion route: POST /api/tasks/:id/request-completion

**Admin Features**
- isAdmin field added to users table
- Admin-only endpoints for professional role management
- Admin verification for tasker approval