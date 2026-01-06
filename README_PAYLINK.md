# 🚀 إعداد Paylink - دليل سريع

## ⚡ خطوات سريعة (5 دقائق)

### 1️⃣ إعداد ملف `.env`

أنشئ ملف `.env` في جذر المشروع:

```env
# Paylink
PAYLINK_APP_ID=APP_ID_1764821701792
PAYLINK_SECRET_KEY=your_secret_key_from_paylink

# Database
DATABASE_URL=your_database_url

# API URL (سنضيفه بعد ngrok)
VITE_API_URL=
```

### 2️⃣ ثبت ngrok

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
2. PAYMENT WEBHOOK
3. Webhook Url: `https://abc123.ngrok.io/api/payments/webhook`
4. اضغط Test
5. احفظ

### 7️⃣ شغّل Migration

```bash
npm run db:push
```

### ✅ انتهى!

---

## 📝 ملاحظات

⚠️ **ngrok URL يتغير** كل مرة تشغّل ngrok
- الحل: حدّث Paylink Webhook و `.env` عند التغيير

💡 **للإنتاج**: استخدم دومين ثابت بدلاً من ngrok

---

## 🧪 اختبار

```bash
POST /api/payments/create
{
  "amount": 10
}
```

---

## 📚 ملفات مساعدة

- `QUICK_START_PAYLINK.md` - دليل سريع
- `SETUP_PAYLINK.md` - دليل مفصل
- `PAYLINK_SETUP.md` - توثيق API













