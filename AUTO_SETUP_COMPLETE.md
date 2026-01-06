# ✅ تم إعداد Paylink تلقائياً!

## ما تم إنجازه:

✅ **تم إعداد ملف `.env`** مع:
- `PAYLINK_APP_ID=APP_ID_1764821701792`
- `PAYLINK_SECRET_KEY=0a48bb80-dafc-3ffe-a459-6a5e5069b0b3`
- `PAYLINK_BASE_URL=https://restapi.paylink.sa/api`

✅ **تم إضافة `.env` إلى `.gitignore`** (لحماية البيانات)

---

## الخطوات المتبقية (بسيطة جداً):

### 1️⃣ أضف DATABASE_URL في `.env`

افتح ملف `.env` وأضف:
```env
DATABASE_URL=your_database_url_here
```

### 2️⃣ ثبت ngrok (مرة واحدة فقط)

```bash
npm install -g ngrok
```

أو حمّل من: https://ngrok.com/download

### 3️⃣ شغّل السيرفر

```bash
npm run dev
```

### 4️⃣ شغّل ngrok (في terminal جديد)

```bash
ngrok http 5000
```

انسخ الـ URL من ngrok (مثل: `https://abc123.ngrok.io`)

### 5️⃣ حدّث `.env`

أضف ngrok URL:
```env
VITE_API_URL=https://abc123.ngrok.io
```

### 6️⃣ أضف Webhook في Paylink

1. اذهب إلى: https://my.paylink.sa/
2. **PAYMENT WEBHOOK**
3. Webhook Url: `https://abc123.ngrok.io/api/payments/webhook`
   (استبدل `abc123.ngrok.io` بالـ URL من ngrok)
4. اضغط **Test**
5. احفظ

### 7️⃣ شغّل Migration

```bash
npm run db:push
```

---

## ✅ انتهى!

الآن كل شيء جاهز. Paylink API credentials موجودة في `.env` وجاهزة للاستخدام.

---

## 🧪 اختبار سريع

بعد إكمال الخطوات، اختبر بإنشاء فاتورة:

```bash
POST /api/payments/create
{
  "amount": 10
}
```

---

## 📝 ملاحظات

- ملف `.env` موجود ومحمي في `.gitignore`
- Paylink credentials جاهزة
- فقط أضف `DATABASE_URL` و `VITE_API_URL` (ngrok URL)













