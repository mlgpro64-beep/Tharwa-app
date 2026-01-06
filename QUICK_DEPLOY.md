# ⚡ نشر سريع - Supabase Edge Functions

## 🚀 الأوامر السريعة:

### 1. تسجيل الدخول
```bash
npx supabase login
```

### 2. ربط المشروع
```bash
npm run supabase:link
```

أو:

```bash
npx supabase link --project-ref tywwcinmoncjkitzqfaa
```

### 3. تطبيق Migrations
```bash
npm run supabase:db:push
```

### 4. نشر جميع Edge Functions
```bash
npm run supabase:functions:deploy
```

---

## ✅ ملف .env

تم تحديث ملف `.env` تلقائياً. تأكد من وجود:

```
VITE_USE_SUPABASE_EDGE_FUNCTIONS=true
VITE_SUPABASE_URL=https://tywwcinmoncjkitzqfaa.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_abSbDhFuX3gx-SNlM3RUnA_68duuFjN
```

---

## 🔧 إعداد Environment Variables في Supabase

اذهب إلى: https://app.supabase.com/project/tywwcinmoncjkitzqfaa/settings/functions

أضف:
- `SUPABASE_URL` = `https://tywwcinmoncjkitzqfaa.supabase.co`
- `SUPABASE_ANON_KEY` = `sb_publishable_abSbDhFuX3gx-SNlM3RUnA_68duuFjN`
- `SUPABASE_SERVICE_ROLE_KEY` = (احصل عليه من API Settings)
- `ENVIRONMENT` = `production`

---

**تم! 🎉**










