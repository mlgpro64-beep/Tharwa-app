# ✅ السيرفر يعمل الآن!

## 🚀 حالة السيرفر:

السيرفر يعمل في الخلفية على:
- **URL**: `http://localhost:5000`
- **ngrok URL**: `https://8593d2bb6452.ngrok-free.app`

---

## ✅ ما يجب أن تراه في Terminal:

```
[Paylink] Initialized successfully
Server listening on port 5000
```

---

## 🧪 اختبار السيرفر:

### 1. اختبار API (يحتاج authentication):
```bash
GET http://localhost:5000/api/payments
```

### 2. اختبار Paylink:
```bash
POST http://localhost:5000/api/payments/create
Authorization: Bearer {token}
{
  "amount": 10
}
```

---

## 📋 الخطوات التالية:

### 1️⃣ تأكد من ngrok يعمل

في terminal جديد:
```bash
ngrok http 5000
```

يجب أن يكون ngrok URL: `https://8593d2bb6452.ngrok-free.app`

### 2️⃣ أضف Webhook في Paylink

1. اذهب إلى: https://my.paylink.sa/
2. **PAYMENT WEBHOOK**
3. Webhook Url: `https://8593d2bb6452.ngrok-free.app/api/payments/webhook`
4. اضغط **Test**
5. احفظ

### 3️⃣ شغّل Migration (إن لم تشغّله)

```bash
npm run db:push
```

---

## ✅ انتهى!

السيرفر يعمل الآن. Paylink جاهز للاستخدام!

---

## 🔗 الروابط:

- **Local Server**: http://localhost:5000
- **ngrok URL**: https://8593d2bb6452.ngrok-free.app
- **Paylink Dashboard**: https://my.paylink.sa/

---

## 📝 ملاحظات:

- السيرفر يعمل في الخلفية
- يمكنك استخدام API endpoints الآن
- تأكد من أن ngrok يعمل أيضاً
- أضف Webhook في Paylink Dashboard













