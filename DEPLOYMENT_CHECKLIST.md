# ✅ قائمة التحقق - نشر Supabase Edge Functions

## 📋 الخطوات المطلوبة:

### ✅ 1. تحديث ملف .env
- [x] تم إنشاء `.env.example` مع جميع المتغيرات المطلوبة
- [ ] نسخ `.env.example` إلى `.env` (إذا لم يكن موجوداً)
- [ ] التأكد من وجود `VITE_USE_SUPABASE_EDGE_FUNCTIONS=true`
- [ ] التأكد من وجود `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`

### ✅ 2. تثبيت Supabase CLI
- [x] تم التحقق من أن `npx supabase` يعمل
- [ ] لا حاجة للتثبيت - يمكن استخدام `npx supabase` مباشرة

### ✅ 3. تسجيل الدخول إلى Supabase
- [ ] تنفيذ: `npx supabase login`
- [ ] فتح المتصفح وتسجيل الدخول
- [ ] الموافقة على الوصول

**ملاحظة:** إذا كنت في بيئة غير تفاعلية، استخدم:
```bash
npx supabase login --token YOUR_ACCESS_TOKEN
```
احصل على Access Token من: https://app.supabase.com/account/tokens

### ✅ 4. ربط المشروع
- [ ] تنفيذ: `npm run supabase:link`
- [ ] أو: `npx supabase link --project-ref tywwcinmoncjkitzqfaa`

**Project Reference ID:** `tywwcinmoncjkitzqfaa`

### ✅ 5. تطبيق Database Migrations
- [ ] تنفيذ: `npm run supabase:db:push`
- [ ] التحقق من تطبيق Migrations بنجاح

### ✅ 6. إعداد Environment Variables في Supabase Dashboard
اذهب إلى: https://app.supabase.com/project/tywwcinmoncjkitzqfaa/settings/functions

أضف الـ Secrets التالية:
- [ ] `SUPABASE_URL` = `https://tywwcinmoncjkitzqfaa.supabase.co`
- [ ] `SUPABASE_ANON_KEY` = `sb_publishable_abSbDhFuX3gx-SNlM3RUnA_68duuFjN`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = (احصل عليه من API Settings)
- [ ] `ENVIRONMENT` = `production`
- [ ] `AUTHENTICA_API_KEY` = (اختياري - إذا كان لديك)

**للحصول على SERVICE_ROLE_KEY:**
1. اذهب إلى: https://app.supabase.com/project/tywwcinmoncjkitzqfaa/settings/api
2. انسخ `service_role` key (⚠️ حساس - لا تشاركه)

### ✅ 7. نشر Edge Functions
- [ ] تنفيذ: `npm run supabase:functions:deploy` (لنشر جميع الـ functions)
- [ ] أو نشر functions محددة:
  - [ ] `npm run supabase:functions:deploy:send-phone-otp`
  - [ ] `npm run supabase:functions:deploy:verify-phone-otp`
  - [ ] `npm run supabase:functions:deploy:login-with-phone-otp`
  - [ ] `npm run supabase:functions:deploy:register`
  - [ ] `npm run supabase:functions:deploy:create-task`
  - [ ] `npm run supabase:functions:deploy:get-tasks`
  - [ ] `npm run supabase:functions:deploy:complete-task`
  - [ ] `npm run supabase:functions:deploy:create-bid`
  - [ ] `npm run supabase:functions:deploy:accept-bid`
  - [ ] `npm run supabase:functions:deploy:send-message`
  - [ ] `npm run supabase:functions:deploy:get-users-me`
  - [ ] `npm run supabase:functions:deploy:update-user`

### ✅ 8. اختبار Edge Functions
- [ ] التحقق من الـ functions في: https://app.supabase.com/project/tywwcinmoncjkitzqfaa/functions
- [ ] اختبار function واحد على الأقل
- [ ] التحقق من Logs: https://app.supabase.com/project/tywwcinmoncjkitzqfaa/logs/edge-functions

### ✅ 9. تحديث Frontend
- [ ] التأكد من أن `.env` يحتوي على `VITE_USE_SUPABASE_EDGE_FUNCTIONS=true`
- [ ] إعادة تشغيل السيرفر: `npm run dev`
- [ ] إعادة تحميل الصفحة في المتصفح
- [ ] اختبار التطبيق

---

## 🔗 روابط مفيدة:

- **Supabase Dashboard:** https://app.supabase.com/project/tywwcinmoncjkitzqfaa
- **Edge Functions:** https://app.supabase.com/project/tywwcinmoncjkitzqfaa/functions
- **API Settings:** https://app.supabase.com/project/tywwcinmoncjkitzqfaa/settings/api
- **Function Secrets:** https://app.supabase.com/project/tywwcinmoncjkitzqfaa/settings/functions
- **Database:** https://app.supabase.com/project/tywwcinmoncjkitzqfaa/editor
- **Logs:** https://app.supabase.com/project/tywwcinmoncjkitzqfaa/logs/edge-functions
- **Access Tokens:** https://app.supabase.com/account/tokens

---

## 📝 الأوامر السريعة:

```bash
# 1. تسجيل الدخول
npx supabase login

# 2. ربط المشروع
npm run supabase:link

# 3. تطبيق Migrations
npm run supabase:db:push

# 4. نشر جميع Edge Functions
npm run supabase:functions:deploy
```

---

## ⚠️ ملاحظات مهمة:

1. **SERVICE_ROLE_KEY حساس جداً** - لا تشاركه أبداً ولا تضعه في الكود
2. **Environment Variables** يجب إضافتها في Supabase Dashboard → Functions → Secrets
3. **ملف .env** يجب أن يحتوي على `VITE_USE_SUPABASE_EDGE_FUNCTIONS=true` لتفعيل Edge Functions
4. **بعد تحديث .env** يجب إعادة تشغيل السيرفر

---

**تم إعداد كل شيء! 🎉** الآن اتبع الخطوات أعلاه للنشر.










