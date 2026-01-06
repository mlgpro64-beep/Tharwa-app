# ✅ تم إعداد كل شيء تلقائياً!

## ما تم إنجازه:

✅ **تم إعداد ملف `.env`** مع:
- `PAYLINK_APP_ID=APP_ID_1764821701792`
- `PAYLINK_SECRET_KEY=0a48bb80-dafc-3ffe-a459-6a5e5069b0b3`
- `DATABASE_URL=postgresql://postgres:...@db.tywwcinmoncjkitzqfaa.supabase.co:5432/postgres`
- `PAYLINK_BASE_URL=https://restapi.paylink.sa/api`

✅ **تم تثبيت ngrok** (جاهز للاستخدام)

✅ **تم إضافة `.env` إلى `.gitignore`**

---

## ⚠️ Migration يحتاج تأكيد

عند تشغيل `npm run db:push`، سيظهر سؤال:
```
Is payments table created or renamed from another table?
❯ + payments          create table
```

**اختر:** `+ payments create table` (اضغط Enter)

---

## الخطوات المتبقية:

### 1️⃣ أكمل Migration

```bash
npm run db:push
```

عندما يظهر السؤال، اضغط **Enter** لإنشاء جدول `payments`

### 2️⃣ شغّل السيرفر

```bash
npm run dev
```

### 3️⃣ شغّل ngrok (في terminal جديد)

```bash
ngrok http 5000
```

انسخ الـ URL من ngrok (مثل: `https://abc123.ngrok.io`)

### 4️⃣ حدّث `.env`

أضف ngrok URL:
```env
VITE_API_URL=https://abc123.ngrok.io
```

### 5️⃣ أضف Webhook في Paylink

1. اذهب إلى: https://my.paylink.sa/
2. **PAYMENT WEBHOOK**
3. Webhook Url: `https://abc123.ngrok.io/api/payments/webhook`
   (استبدل `abc123.ngrok.io` بالـ URL من ngrok)
4. اضغط **Test**
5. احفظ

---

## ✅ انتهى!

الآن كل شيء جاهز. Paylink سيعمل تلقائياً.

---

## 🧪 اختبار

بعد إكمال كل الخطوات، اختبر:

```bash
POST /api/payments/create
{
  "amount": 10
}
```

---

## 📝 ملاحظات

- ngrok URL يتغير كل مرة تشغّل ngrok
- عند التغيير، حدّث Paylink Webhook URL و `.env`
- للإنتاج: استخدم دومين ثابت













