# THARWA (ذروة)

## Overview

THARWA (ذروة) is a mobile-first community marketplace that connects clients needing help with local taskers. It operates with a dual-role system, allowing users to post tasks as clients or complete them as taskers. The platform enforces a 5% fee on completed tasks and is currently available only in Riyadh, Saudi Arabia, with plans for expansion. Key features include a daily task limit for clients, identity verification for taskers, and a strong emphasis on a native iOS-inspired mobile experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 19 and TypeScript, using Vite for development and bundling. Wouter handles client-side routing, and TanStack Query manages server state with optimistic updates. UI design adheres to an iOS-inspired glassmorphism aesthetic, utilizing Tailwind CSS, Shadcn UI, and Radix UI primitives for a mobile-first, responsive, and touch-optimized experience. State management combines TanStack Query for server data, React Context API for global client state, and LocalStorage for persistence.

### Backend Architecture

The backend utilizes Express.js with TypeScript to provide a RESTful API. It includes a WebSocket server for real-time chat. Authentication is session-based using `express-session`, with `bcrypt` for password hashing. The API follows RESTful principles with consistent error handling and robust request validation. The project uses a monorepo structure, separating client, server, and shared schema definitions.

### Data Storage Solutions

PostgreSQL, accessed via Neon serverless driver, serves as the primary database. Drizzle ORM provides type-safe queries and schema management. The schema includes tables for Users (with dual roles, balance, ratings), Tasks (lifecycle, geolocation, budget), Bids, Messages, Transactions, Notifications, and Saved Tasks, all interconnected with Drizzle relations. Drizzle Kit is used for schema migrations.

### Authentication & Authorization

Authentication is username/password-based with `bcrypt` hashing and session management using HTTP-only cookies. Authorization is role-based (client/tasker), with dynamic role switching and middleware for access control. Security measures include strong password hashing, environment variable-configured session secrets, and secure cookie settings.

### UI/UX Decisions

The application prioritizes an iOS-native feel with a premium glassmorphism aesthetic. This includes backdrop blur, subtle gradients, Plus Jakarta Sans typography, 24px rounded corners, and touch-optimized interactions powered by Framer Motion. Mobile actions often use bottom sheet modals, and input fields feature floating labels with smooth transitions. Lucide React provides consistent iconography. Dark mode is supported with system preference detection.

### Feature Specifications

-   **Professional Roles & Badges**: Taskers can have professional roles across various categories with distinct badges.
-   **Tasker Availability Calendar**: An Airbnb-style calendar allows taskers to manage their availability, visible to clients in read-only mode.
-   **Portfolio Gallery**: Taskers can upload and manage a portfolio of photos with captions and reordering capabilities.
-   **Enhanced Profile Screen**: Integrates professional badges, portfolio, and availability calendar.
-   **Help & Support System**: Provides FAQs and contact options.
-   **Legal Pages**: Includes privacy policy and terms & conditions.
-   **Profile Picture Upload**: Users can upload profile pictures (base64 encoded).
-   **Search Taskers Screen**: Clients can search for taskers using category filters and a "verified only" toggle.
-   **Enhanced Notification System**: Provides real-time notifications for new tasks, bids, task completion, and payments, with category-based and actionable alerts.
-   **Task Deletion**: Clients can soft-delete their open tasks.
-   **Direct Service Request Feature**: Clients can directly request services from tasker profiles, initiating a workflow of pending, accepted, or rejected requests, which can lead to auto-assigned tasks.
-   **iOS PWA Setup**: Optimized for iOS devices with manifest.json, service worker for offline caching, branded icons, splash screens, and iOS-specific CSS.

## External Dependencies

### Third-party Services

-   **Mapping & Geolocation**: Leaflet.js for interactive maps with CartoDB tile layers and client-side geolocation API.
-   **Payment Processing**: Stripe integration via `stripe-replit-sync` for real payments, including a wallet system and 5% platform fee application.

### Database & Hosting

-   **Neon Serverless PostgreSQL**: Managed PostgreSQL database, connected via `@neondatabase/serverless` driver.

### Development Tools

-   **Replit Integration**: Utilizes `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, and `@replit/vite-plugin-dev-banner` for development enhancements.

### UI Component Libraries

-   **Radix UI Primitives**: Comprehensive suite for accessible UI components (Dialog, Dropdown, Select, Checkbox, etc.).
-   **Supporting Libraries**: `react-hook-form` with `zod` for form validation, `date-fns` for date manipulation, `clsx` and `tailwind-merge` for CSS utility, and `class-variance-authority` for component variants.