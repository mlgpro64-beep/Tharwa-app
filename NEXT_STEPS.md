# الخطوات المتبقية - جاهزة للتنفيذ

## ✅ ما تم إنجازه تلقائياً:

1. ✅ **تم إنشاء ملف `.env`** مع Paylink credentials
2. ✅ **تم تثبيت ngrok** (جاهز للاستخدام)
3. ✅ **تم إضافة `.env` إلى `.gitignore`**

---

## ⚠️ ما يحتاج إضافته يدوياً:

### 1️⃣ أضف DATABASE_URL في `.env`

افتح ملف `.env` وأضف:
```env
DATABASE_URL=your_database_connection_string
```

**مثال لـ Supabase:**
```
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

**أو من Supabase Dashboard:**
1. اذهب إلى: https://tywwcinmoncjkitzqfaa.supabase.co
2. Settings → Database
3. Connection string → Copy

---

## 🚀 بعد إضافة DATABASE_URL، نفّذ:

### 2️⃣ شغّل Migration
```bash
npm run db:push
```

### 3️⃣ شغّل السيرفر
```bash
npm run dev
```

### 4️⃣ شغّل ngrok (في terminal جديد)
```bash
ngrok http 5000
```

### 5️⃣ انسخ ngrok URL

ستحصل على شيء مثل:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:5000
```

### 6️⃣ حدّث `.env`

أضف ngrok URL:
```env
VITE_API_URL=https://abc123.ngrok.io
```

### 7️⃣ أضف Webhook في Paylink

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

## 📝 ملاحظة

- ngrok URL يتغير كل مرة تشغّل ngrok
- عند التغيير، حدّث Paylink Webhook URL و `.env`
- للإنتاج: استخدم دومين ثابت













