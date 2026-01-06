# THARWA (ذروة) - Services Marketplace Platform

<div dir="rtl">

## 📱 نظرة عامة

**THARWA (ذروة)** هو تطبيق موبايل يربط بين العملاء الذين يحتاجون إلى مساعدة ومنفذي الخدمات المحترفين في الرياض. التطبيق مبني بتقنيات حديثة ويوفر تجربة مستخدم متميزة.

</div>

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Supabase/Neon)
- Apple Developer Account (for iOS deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd tharwa

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your actual values
# See .env.example for all required variables

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SESSION_SECRET` - Session encryption secret
- `RESEND_API_KEY` - Email service API key
- `AUTHENTICA_API_KEY` - SMS service API key
- `PAYLINK_APP_ID` & `PAYLINK_SECRET_KEY` - Payment gateway credentials

## 🏗️ Project Structure

```
tharwa/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utilities and config
│   │   └── context/     # React context
│   └── public/         # Static assets
├── server/          # Express backend
│   ├── routes.ts    # API routes
│   ├── db.ts        # Database connection
│   ├── storage.ts   # Database operations
│   └── ...
├── shared/          # Shared types and schemas
├── ios/             # iOS native project
├── ios-resources/   # App icons and splash screens
└── website/         # Static website pages
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Wouter** - Routing
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling
- **Radix UI** - UI components
- **Capacitor** - Native iOS integration

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Drizzle ORM** - Database ORM
- **bcryptjs** - Password hashing
- **WebSocket** - Real-time chat

### Services
- **Supabase** - Database hosting
- **Resend** - Email service
- **Authentica** - SMS service (Saudi Arabia)
- **Paylink** - Payment gateway (Saudi Arabia)
- **Stripe** - Payment gateway (optional)

## 📱 Features

### For Clients
- Post tasks with details
- Receive and compare offers
- Secure payment via Paylink
- Rate providers after completion
- Direct messaging with providers
- Save favorite tasks

### For Providers
- Browse available tasks
- Submit competitive offers
- Earn money from completed tasks
- Build reputation through ratings
- Level system (bronze → diamond)
- Availability calendar
- Portfolio gallery
- Professional badges

### Platform Features
- Multi-auth (password, email OTP, SMS OTP)
- Real-time notifications
- In-app chat
- Digital wallet
- Rating system
- Search and filters
- Location-based services (Riyadh only)

## 🚀 Development

### Run Development Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Build for Production

```bash
npm run build
```

Output: `dist/public/` (client) and `dist/index.cjs` (server)

### iOS Development

```bash
# Build and sync with Capacitor
npm run cap:build

# Open in Xcode
npm run cap:open:ios
```

## 📦 Deployment

### Production Build

1. Set `NODE_ENV=production` in `.env`
2. Update all environment variables with production values
3. Build: `npm run build`
4. Start: `npm start`

### iOS App Store

1. Build in Xcode: Product → Archive
2. Upload to App Store Connect
3. Complete App Store metadata (see `APP_STORE_DESCRIPTION.md`)
4. Submit for review

## 🔒 Security

- ✅ No hardcoded API keys
- ✅ Environment variables for all secrets
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on auth endpoints
- ✅ Session-based authentication
- ✅ HTTPS only in production
- ✅ Input validation with Zod

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/send-otp` - Send OTP via email
- `POST /api/auth/send-phone-otp` - Send OTP via SMS
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/login-with-otp` - Login with OTP

### Tasks
- `GET /api/tasks` - List tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Bids
- `GET /api/tasks/:id/bids` - Get bids for task
- `POST /api/tasks/:id/bids` - Submit bid
- `POST /api/bids/:id/accept` - Accept bid

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/webhook` - Paylink webhook

See `server/routes.ts` for complete API documentation.

## 🧪 Testing

```bash
# Type checking
npm run check

# Build test
npm run build
```

## 📄 License

MIT

## 👥 Contributors

- Development Team

## 📞 Support

For support, email support@tharwwa.com or visit https://tharwwa.com

---

<div dir="rtl">

## 🇸🇦 للمطورين العرب

هذا المشروع مبني بتقنيات حديثة ويستخدم:
- React 18 مع TypeScript
- Express.js للـ Backend
- PostgreSQL مع Drizzle ORM
- Capacitor للـ iOS

للمساعدة أو الاستفسارات، راجع الملفات في مجلد `docs/` أو تواصل مع الفريق.

</div>

