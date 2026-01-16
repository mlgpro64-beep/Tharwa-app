# 🚀 Supabase Edge Functions - THARWA

هذا المجلد يحتوي على Supabase Edge Functions التي تحل محل Express.js backend.

## 📁 الهيكل

```
supabase/
├── config.toml              # إعدادات Supabase
├── functions/               # Edge Functions
│   ├── _shared/            # مكتبات مشتركة
│   │   ├── auth.ts         # Authentication utilities
│   │   └── rate-limit.ts   # Rate limiting utilities
│   ├── send-phone-otp/     # إرسال OTP
│   ├── verify-phone-otp/   # التحقق من OTP
│   ├── login-with-phone-otp/ # تسجيل الدخول
│   ├── create-task/        # إنشاء مهمة
│   ├── get-tasks/          # جلب المهام
│   └── get-users-me/       # جلب المستخدم الحالي
└── migrations/             # Database migrations
    └── 20250127000000_rate_limit_function.sql
```

## 🚀 البدء السريع

### 1. تثبيت Supabase CLI

```bash
npm install -g supabase
```

### 2. تسجيل الدخول

```bash
supabase login
```

### 3. ربط المشروع

```bash
# احصل على Project Reference ID من:
# https://app.supabase.com/project/_/settings/general

supabase link --project-ref YOUR_PROJECT_REF
```

### 4. تطبيق Migrations

```bash
supabase db push
```

### 5. نشر Edge Functions

```bash
# نشر function واحد
supabase functions deploy send-phone-otp

# أو استخدام npm scripts
npm run supabase:functions:deploy:send-phone-otp
```

## 📝 Edge Functions المتاحة

### Authentication
- `send-phone-otp` - إرسال رمز التحقق عبر SMS
- `verify-phone-otp` - التحقق من رمز التحقق
- `login-with-phone-otp` - تسجيل الدخول برمز التحقق

### Tasks
- `create-task` - إنشاء مهمة جديدة
- `get-tasks` - جلب قائمة المهام

### Users
- `get-users-me` - جلب بيانات المستخدم الحالي

### Payments
- `create-payment-link` - إنشاء رابط دفع عبر Paylink (السعودية)

## 🔧 Environment Variables

في Supabase Dashboard → Settings → Edge Functions → Secrets:

```
SUPABASE_URL=https://tywwcinmoncjkitzqfaa.supabase.co
SUPABASE_ANON_KEY=sb_publishable_abSbDhFuX3gx-SNlM3RUnA_68duuFjN
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AUTHENTICA_API_KEY=your-sms-api-key (اختياري)
ENVIRONMENT=production

# Paylink Payment Gateway (Saudi Arabia)
PAYLINK_APP_ID=your-paylink-app-id
PAYLINK_SECRET_KEY=your-paylink-secret-key
APP_BASE_URL=https://your-app-url.com (للـ callback URLs)
```

## 📊 استخدام Edge Functions

### من Frontend:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const functionUrl = `${supabaseUrl}/functions/v1/send-phone-otp`

const response = await fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // للـ functions التي تحتاج auth
  },
  body: JSON.stringify({
    phone: '0558875419',
    type: 'login'
  })
})

const data = await response.json()
```

## 🔄 Migration من Express.js

### قبل (Express.js):
```typescript
POST /api/auth/send-phone-otp
```

### بعد (Supabase Edge Functions):
```typescript
POST https://your-project.supabase.co/functions/v1/send-phone-otp
```

## 📚 المزيد من المعلومات

راجع `SUPABASE_MIGRATION_GUIDE.md` و `SUPABASE_SETUP_COMPLETE.md` للتفاصيل الكاملة.











