# إعداد Paylink - خطوة بخطوة

## المتطلبات

1. حساب Paylink من [my.paylink.sa](https://my.paylink.sa/)
2. App ID و Secret Key من Paylink
3. ngrok للتطوير (أو دومين للإنتاج)

---

## الخطوة 1: إعداد ملف البيئة

### أ. إنشاء ملف `.env`:

```bash
npm run setup:env
```

أو يدوياً:
```bash
cp .env.example .env
```

### ب. افتح `.env` وأضف:

```env
# Paylink - احصل عليها من https://my.paylink.sa/private/api-keys
PAYLINK_APP_ID=APP_ID_1764821701792
PAYLINK_SECRET_KEY=your_secret_key_here

# Database
DATABASE_URL=your_database_url

# API URL - سنضيفه بعد ngrok
VITE_API_URL=
```

---

## الخطوة 2: إعداد ngrok

### أ. ثبت ngrok:

**Windows:**
```bash
# باستخدام Chocolatey
choco install ngrok

# أو حمّل من https://ngrok.com/download
```

**Mac:**
```bash
brew install ngrok
```

**أو npm:**
```bash
npm install -g ngrok
```

### ب. شغّل السيرفر:

```bash
npm run dev
```

السيرفر سيعمل على `http://localhost:5000`

### ج. شغّل ngrok (في terminal جديد):

```bash
ngrok http 5000
```

### د. انسخ الـ URL:

ستحصل على شيء مثل:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:5000
```

انسخ: `https://abc123.ngrok.io`

---

## الخطوة 3: تحديث `.env`

أضف ngrok URL في `.env`:

```env
VITE_API_URL=https://abc123.ngrok.io
```

---

## الخطوة 4: إعداد Webhook في Paylink

1. اذهب إلى [Paylink Dashboard](https://my.paylink.sa/)
2. اذهب إلى **PAYMENT WEBHOOK**
3. في حقل **Webhook Url**، أضف:
   ```
   https://abc123.ngrok.io/api/payments/webhook
   ```
   (استبدل `abc123.ngrok.io` بالـ URL من ngrok)
4. اترك **HTTP Headers** فارغة
5. اضغط **Test** للتأكد من الاتصال
6. احفظ

---

## الخطوة 5: تشغيل Migration

```bash
npm run db:push
```

هذا يضيف جدول `payments` إلى قاعدة البيانات.

---

## الخطوة 6: إعادة تشغيل السيرفر

أوقف السيرفر (Ctrl+C) وشغّله مرة أخرى:

```bash
npm run dev
```

يجب أن ترى:
```
[Paylink] Initialized successfully
```

---

## ✅ انتهى!

الآن يمكنك:

1. **إنشاء فاتورة دفع:**
   ```javascript
   POST /api/payments/create
   {
     "amount": 100
   }
   ```

2. **التحقق من حالة الدفع:**
   ```javascript
   GET /api/payments/:id
   ```

3. **الحصول على جميع المدفوعات:**
   ```javascript
   GET /api/payments
   ```

---

## 🔄 تحديث ngrok URL

⚠️ **مهم**: ngrok URL يتغير في كل مرة تشغّل ngrok (في النسخة المجانية)

عندما يتغير:
1. انسخ الـ URL الجديد من ngrok
2. حدّث `.env`:
   ```env
   VITE_API_URL=https://new-url.ngrok.io
   ```
3. حدّث Paylink Webhook URL
4. أعد تشغيل السيرفر

---

## 🚀 للإنتاج

للإنتاج، استخدم دومين ثابت بدلاً من ngrok:

```env
VITE_API_URL=https://api.yourdomain.com
```

---

## 🐛 استكشاف الأخطاء

### خطأ: "Paylink credentials not configured"
- تأكد من إضافة `PAYLINK_APP_ID` و `PAYLINK_SECRET_KEY` في `.env`
- أعد تشغيل السيرفر

### Webhook لا يعمل
- تأكد من أن ngrok يعمل
- تأكد من أن Webhook URL صحيح في Paylink
- راجع logs السيرفر: `[Paylink] Webhook received:`

### الدفع لا يضيف الرصيد
- تحقق من أن Webhook URL صحيح
- راجع logs السيرفر
- تأكد من أن الدفع تم بنجاح في Paylink Dashboard

---

## 📞 المساعدة

إذا واجهت مشاكل:
1. راجع logs السيرفر
2. تحقق من Paylink Dashboard
3. تأكد من أن جميع المتغيرات في `.env` صحيحة













