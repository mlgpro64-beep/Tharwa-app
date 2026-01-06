# 🚀 تعليمات نشر Supabase Edge Functions

## ✅ الخطوة 1: تحديث ملف .env

تم تحديث ملف `.env` تلقائياً. تأكد من وجود المتغيرات التالية:

```
VITE_SUPABASE_URL=https://tywwcinmoncjkitzqfaa.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_abSbDhFuX3gx-SNlM3RUnA_68duuFjN
VITE_USE_SUPABASE_EDGE_FUNCTIONS=true
```

---

## ✅ الخطوة 2: تسجيل الدخول إلى Supabase

افتح terminal جديد واكتب:

```bash
npx supabase login
```

سيطلب منك:
1. فتح المتصفح
2. تسجيل الدخول إلى Supabase
3. الموافقة على الوصول

---

## ✅ الخطوة 3: ربط المشروع

بعد تسجيل الدخول، اربط المشروع:

```bash
npx supabase link --project-ref tywwcinmoncjkitzqfaa
```

**Project Reference ID:** `tywwcinmoncjkitzqfaa`

---

## ✅ الخطوة 4: تطبيق Database Migrations

```bash
npx supabase db push
```

أو:

```bash
npm run supabase:db:push
```

---

## ✅ الخطوة 5: إعداد Environment Variables في Supabase

اذهب إلى: https://app.supabase.com/project/tywwcinmoncjkitzqfaa/settings/functions

أضف الـ Secrets التالية:

```
SUPABASE_URL=https://tywwcinmoncjkitzqfaa.supabase.co
SUPABASE_ANON_KEY=sb_publishable_abSbDhFuX3gx-SNlM3RUnA_68duuFjN
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AUTHENTICA_API_KEY=your-sms-api-key (اختياري)
ENVIRONMENT=production
```

**للحصول على SERVICE_ROLE_KEY:**
1. اذهب إلى: https://app.supabase.com/project/tywwcinmoncjkitzqfaa/settings/api
2. انسخ `service_role` key (⚠️ حساس - لا تشاركه)

---

## ✅ الخطوة 6: نشر Edge Functions

### نشر جميع الـ Functions:

```bash
npm run supabase:functions:deploy
```

أو:

```bash
npx supabase functions deploy
```

### نشر Function محدد:

```bash
npm run supabase:functions:deploy:send-phone-otp
npm run supabase:functions:deploy:verify-phone-otp
npm run supabase:functions:deploy:login-with-phone-otp
npm run supabase:functions:deploy:register
npm run supabase:functions:deploy:create-task
npm run supabase:functions:deploy:get-tasks
npm run supabase:functions:deploy:complete-task
npm run supabase:functions:deploy:create-bid
npm run supabase:functions:deploy:accept-bid
npm run supabase:functions:deploy:send-message
npm run supabase:functions:deploy:get-users-me
npm run supabase:functions:deploy:update-user
```

---

## ✅ الخطوة 7: اختبار Edge Functions

بعد النشر، يمكنك اختبار الـ functions من:

https://app.supabase.com/project/tywwcinmoncjkitzqfaa/functions

أو من الكود:

```typescript
const supabaseUrl = 'https://tywwcinmoncjkitzqfaa.supabase.co'
const response = await fetch(`${supabaseUrl}/functions/v1/send-phone-otp`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '0558875419',
    type: 'login'
  })
})
```

---

## ✅ الخطوة 8: تفعيل في Frontend

ملف `.env` تم تحديثه تلقائياً. تأكد من:

1. إعادة تشغيل السيرفر (`npm run dev`)
2. إعادة تحميل الصفحة في المتصفح

---

## 📋 قائمة التحقق:

- [ ] تم تحديث ملف `.env` بـ `VITE_USE_SUPABASE_EDGE_FUNCTIONS=true`
- [ ] تم تسجيل الدخول (`npx supabase login`)
- [ ] تم ربط المشروع (`npx supabase link`)
- [ ] تم تطبيق Migrations (`npx supabase db push`)
- [ ] تم إضافة Environment Variables في Supabase Dashboard
- [ ] تم نشر Edge Functions (`npm run supabase:functions:deploy`)
- [ ] تم إعادة تشغيل السيرفر
- [ ] تم اختبار التطبيق

---

## 🔧 حل المشاكل:

### المشكلة: `Cannot use automatic login flow`

**الحل:** استخدم Access Token:
1. اذهب إلى: https://app.supabase.com/account/tokens
2. أنشئ Access Token جديد
3. استخدمه: `npx supabase login --token YOUR_TOKEN`

### المشكلة: `Project not found`

**الحل:** تأكد من Project Reference ID:
- الصحيح: `tywwcinmoncjkitzqfaa`
- يمكنك التحقق من: https://app.supabase.com/project/_/settings/general

### المشكلة: Edge Functions لا تعمل

**الحل:**
1. تحقق من Environment Variables في Supabase Dashboard
2. تحقق من Logs: https://app.supabase.com/project/tywwcinmoncjkitzqfaa/logs/edge-functions
3. تأكد من أن `VITE_USE_SUPABASE_EDGE_FUNCTIONS=true` في `.env`

---

## 📚 روابط مفيدة:

- Supabase Dashboard: https://app.supabase.com/project/tywwcinmoncjkitzqfaa
- Edge Functions: https://app.supabase.com/project/tywwcinmoncjkitzqfaa/functions
- API Settings: https://app.supabase.com/project/tywwcinmoncjkitzqfaa/settings/api
- Database: https://app.supabase.com/project/tywwcinmoncjkitzqfaa/editor

---

**تم! 🎉** الآن يمكنك نشر Edge Functions واختبارها.










