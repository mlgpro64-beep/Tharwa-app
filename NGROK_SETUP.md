# ✅ تم إعداد ngrok تلقائياً!

## ما تم إنجازه:

✅ **تم إضافة ngrok authtoken** تلقائياً
✅ **ngrok جاهز للاستخدام**

---

## 🚀 كيفية استخدام ngrok:

### 1️⃣ شغّل السيرفر

```bash
npm run dev
```

السيرفر سيعمل على `http://localhost:5000`

### 2️⃣ شغّل ngrok (في terminal جديد)

```bash
ngrok http 5000
```

ستحصل على output مثل:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:5000
```

### 3️⃣ انسخ الـ URL

انسخ الـ URL من ngrok (مثل: `https://abc123.ngrok.io`)

### 4️⃣ حدّث `.env`

افتح ملف `.env` وأضف:
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

## 📝 ملاحظات:

- ngrok URL يتغير كل مرة تشغّل ngrok (في النسخة المجانية)
- عند التغيير، حدّث Paylink Webhook URL و `.env`
- ngrok authtoken محفوظ في `~/.ngrok2/ngrok.yml`

---

## 🔧 أوامر ngrok مفيدة:

```bash
# شغّل ngrok
ngrok http 5000

# شغّل ngrok مع دومين ثابت (إذا كان لديك)
ngrok http 5000 --domain=your-domain.ngrok.io

# عرض ngrok web interface
# افتح: http://localhost:4040
```

---

## ✅ انتهى!

ngrok جاهز للاستخدام. فقط شغّل `ngrok http 5000` بعد تشغيل السيرفر.













