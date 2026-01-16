# 🔄 إرجاع تعطيل OTP (قبل الرفع للـ GitHub)

هذا الملف يحتوي على تعليمات لإرجاع تعطيل OTP قبل رفع الكود للـ GitHub.

---

## ⚠️ مهم جداً

**قبل عمل `git push`، يجب إرجاع تعطيل OTP!**

---

## 📝 التغييرات التي تمت

تم تعطيل OTP في وضع التطوير (`NODE_ENV=development`) في الملفات التالية:

1. `server/routes.ts` - تم إضافة bypass في:
   - `/api/auth/verify-otp`
   - `/api/auth/verify-phone-otp`
   - `/api/auth/login-with-otp`
   - `/api/auth/login-with-phone-otp`
   - `/api/auth/register-with-otp`

2. `client/src/pages/RegisterScreen.tsx` - تم تعديل:
   - `sendOtpMutation` لتخطي OTP في development mode
   - إضافة زر Skip في OTP step

3. `client/src/pages/VerifyOTPScreen.tsx` - تم تحسين:
   - زر Skip للـ development mode

---

## 🔧 كيفية الإرجاع

### الطريقة 1: استخدام Git (موصى بها)

```bash
# عرض التغييرات
git diff

# إرجاع جميع التغييرات
git checkout -- server/routes.ts client/src/pages/RegisterScreen.tsx client/src/pages/VerifyOTPScreen.tsx

# أو إرجاع ملف واحد فقط
git checkout -- server/routes.ts
```

### الطريقة 2: إرجاع يدوي

#### 1. في `server/routes.ts`

ابحث عن الأكواد التي تحتوي على:
- `// Development bypass: Accept any OTP code in dev mode`
- `const isDevelopment = process.env.NODE_ENV === 'development';`
- `if (isDevelopment) { ... }`

واحذف هذه الأكواد وأعد الكود الأصلي.

#### 2. في `client/src/pages/RegisterScreen.tsx`

ابحث عن:
- `if (import.meta.env.DEV) { ... }`
- زر Skip في OTP step

واحذفها.

#### 3. في `client/src/pages/VerifyOTPScreen.tsx`

ابحث عن:
- زر Skip في development mode

واحذف التعليقات الإضافية لكن أبقِ الزر (كان موجود من قبل).

---

## ✅ قائمة التحقق قبل Push

- [ ] تم إرجاع `server/routes.ts`
- [ ] تم إرجاع `client/src/pages/RegisterScreen.tsx`
- [ ] تم إرجاع `client/src/pages/VerifyOTPScreen.tsx`
- [ ] تم اختبار أن OTP يعمل بشكل صحيح
- [ ] تم التأكد من أن `NODE_ENV=production` يطلب OTP

---

## 🧪 اختبار بعد الإرجاع

```bash
# تأكد من أن NODE_ENV=production
export NODE_ENV=production

# شغّل السيرفر
npm run dev

# جرّب التسجيل - يجب أن يطلب OTP
# جرّب تسجيل الدخول - يجب أن يطلب OTP
```

---

## 📌 ملاحظة

إذا أردت الاحتفاظ بنسخة من الكود المعدل للاستخدام المحلي فقط:

```bash
# حفظ التغييرات في branch منفصل
git checkout -b dev/otp-bypass
git add .
git commit -m "Add OTP bypass for development"

# العودة للـ main branch
git checkout main

# إرجاع التغييرات
git checkout -- server/routes.ts client/src/pages/RegisterScreen.tsx client/src/pages/VerifyOTPScreen.tsx
```

بهذه الطريقة يمكنك التبديل بين النسختين حسب الحاجة.

---

## 🚨 تحذير

**لا ترفع الكود مع OTP معطّل للـ GitHub!**

هذا قد يسبب مشاكل أمنية في الإنتاج.

---

**تم إنشاء هذا الملف في:** $(date)
