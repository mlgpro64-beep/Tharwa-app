# دليل سريع لإعداد Paylink

## خطوات سريعة (5 دقائق)

### 1. إعداد ملف البيئة

انسخ ملف `.env.example` إلى `.env`:
```bash
cp .env.example .env
```

ثم افتح `.env` وأضف:
- `PAYLINK_SECRET_KEY` من [my.paylink.sa](https://my.paylink.sa/private/api-keys)
- `DATABASE_URL` من قاعدة البيانات

### 2. إعداد ngrok (للتطوير)

#### أ. ثبت ngrok:
```bash
npm install -g ngrok
```

أو حمّل من: https://ngrok.com/download

#### ب. شغّل السيرفر:
```bash
npm run dev
```

#### ج. في terminal جديد، شغّل ngrok:
```bash
ngrok http 5000
```

#### د. انسخ الـ URL من ngrok:
ستحصل على شيء مثل: `https://abc123.ngrok.io`

### 3. تحديث ملف `.env`

أضف ngrok URL:
```env
VITE_API_URL=https://abc123.ngrok.io
```

### 4. إعداد Webhook في Paylink

1. اذهب إلى [Paylink Dashboard](https://my.paylink.sa/)
2. اذهب إلى **PAYMENT WEBHOOK**
3. أضف Webhook URL:
   ```
   https://abc123.ngrok.io/api/payments/webhook
   ```
   (استبدل `abc123.ngrok.io` بالـ URL من ngrok)
4. اضغط **Test** للتأكد
5. احفظ

### 5. تشغيل Migration

```bash
npm run db:push
```

### 6. انتهى! ✅

الآن يمكنك:
- إنشاء فواتير دفع من التطبيق
- استقبال webhooks من Paylink
- إضافة الرصيد تلقائياً عند الدفع

---

## ملاحظات مهمة

⚠️ **ngrok URL يتغير** في كل مرة تشغّل ngrok (في النسخة المجانية)
- الحل: كل مرة يتغير، حدّث Paylink Webhook URL و `.env`

💡 **للإنتاج**: استخدم دومين ثابت بدلاً من ngrok

---

## اختبار

بعد الإعداد، اختبر بإنشاء فاتورة:
```javascript
POST /api/payments/create
{
  "amount": 10
}
```

---

## استكشاف الأخطاء

### خطأ: "Paylink credentials not configured"
- تأكد من إضافة `PAYLINK_APP_ID` و `PAYLINK_SECRET_KEY` في `.env`

### Webhook لا يعمل
- تأكد من أن ngrok يعمل
- تأكد من أن Webhook URL صحيح في Paylink
- راجع logs السيرفر

### الدفع لا يضيف الرصيد
- تحقق من أن Webhook URL صحيح
- راجع logs السيرفر
- تأكد من أن الدفع تم بنجاح في Paylink













