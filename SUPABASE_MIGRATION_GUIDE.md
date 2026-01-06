# 🚀 دليل نقل Backend إلى Supabase

## ✅ ما تم إنجازه:

### 1. هيكل Supabase الأساسي
- ✅ `supabase/config.toml` - ملف الإعدادات
- ✅ `supabase/functions/_shared/` - مكتبات مشتركة
- ✅ `supabase/migrations/` - Database migrations

### 2. Edge Functions
- ✅ `send-phone-otp` - إرسال رمز التحقق عبر SMS

### 3. Database Functions
- ✅ `check_rate_limit` - Rate limiting في قاعدة البيانات
- ✅ `cleanup_expired_rate_limits` - تنظيف تلقائي

---

## 📋 الخطوات التالية:

### 1. تثبيت Supabase CLI

```bash
# Windows (PowerShell)
irm https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip -OutFile supabase.zip
Expand-Archive supabase.zip
Move-Item supabase_windows_amd64/supabase.exe C:\Windows\System32\

# أو باستخدام npm
npm install -g supabase
```

### 2. تسجيل الدخول إلى Supabase

```bash
supabase login
```

### 3. ربط المشروع بـ Supabase Project

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

# نشر جميع الـ functions
supabase functions deploy
```

---

## 🔧 إعداد Environment Variables

في Supabase Dashboard → Settings → Edge Functions → Secrets:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AUTHENTICA_API_KEY=your-sms-api-key (اختياري)
ENVIRONMENT=production
```

---

## 📝 Edge Functions المطلوبة:

### ✅ تم إنشاؤها:
- [x] `send-phone-otp` - إرسال OTP

### ⏳ قيد الإنشاء:
- [ ] `verify-phone-otp` - التحقق من OTP
- [ ] `login-with-phone-otp` - تسجيل الدخول
- [ ] `register` - التسجيل
- [ ] `create-task` - إنشاء مهمة
- [ ] `create-bid` - إنشاء عرض
- [ ] `send-message` - إرسال رسالة
- [ ] `get-tasks` - جلب المهام
- [ ] `get-users` - جلب المستخدمين
- [ ] `update-user` - تحديث المستخدم
- [ ] `create-payment` - إنشاء دفعة

---

## 🔄 تحديث Frontend

بعد نشر Edge Functions، قم بتحديث `client/src/lib/config.ts`:

```typescript
export function getApiBaseUrl(): string {
  // استخدام Supabase Edge Functions
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tywwcinmoncjkitzqfaa.supabase.co'
  return `${supabaseUrl}/functions/v1`
}
```

---

## 📊 Supabase Realtime للـ Chat

بدلاً من WebSockets، استخدم Supabase Realtime:

```typescript
// client/src/pages/ChatScreen.tsx
import { supabase } from '@/lib/supabase'

// Subscribe للـ messages
const channel = supabase
  .channel(`task:${taskId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `task_id=eq.${taskId}`
  }, (payload) => {
    // استقبل الرسالة الجديدة
    handleNewMessage(payload.new)
  })
  .subscribe()

// إرسال رسالة (سيتم إرسالها تلقائياً عبر Realtime)
await supabase.from('messages').insert({
  task_id: taskId,
  sender_id: userId,
  receiver_id: receiverId,
  content: messageText
})
```

---

## 💰 التكاليف المتوقعة:

### Pro Plan ($25/شهر):
- ✅ 500K Edge Function invocations
- ✅ 200K Realtime connections
- ✅ 100GB Storage
- ✅ 8GB Database RAM

### Team Plan ($599/شهر):
- ✅ 2M Edge Function invocations
- ✅ 500K Realtime connections
- ✅ 1TB Storage
- ✅ 32GB Database RAM

---

## ✅ المزايا بعد النقل:

1. ✅ لا حاجة لإدارة سيرفر
2. ✅ Scaling تلقائي
3. ✅ CDN مدمج
4. ✅ SSL تلقائي
5. ✅ Backups تلقائية
6. ✅ Real-time جاهز
7. ✅ Authentication جاهز

---

## 🚨 ملاحظات مهمة:

1. **Rate Limiting**: تم نقله إلى Database function
2. **WebSockets**: سيتم استبداله بـ Supabase Realtime
3. **Sessions**: سيتم استخدام Supabase Auth JWT
4. **File Upload**: سيتم استخدام Supabase Storage
5. **Static Files**: سيتم استخدام Supabase Storage + CDN

---

**الخطوة التالية:** إنشاء باقي Edge Functions للـ endpoints المتبقية.











