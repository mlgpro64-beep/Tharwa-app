# TaskField

## Overview

TaskField is a mobile-first community marketplace application for everyday tasks. It connects clients who need help with local taskers who can complete tasks. The platform features a dual-role system where users can either post tasks (as clients) or complete tasks for payment (as taskers). Built with a modern full-stack architecture, it emphasizes an iOS-inspired native mobile experience with smooth animations, haptic feedback, and intuitive touch gestures.

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
- Wallet system with balance tracking (infrastructure ready for Stripe/payment gateway integration)
- Transaction history with credit/debit tracking

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