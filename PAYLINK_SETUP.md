# إعداد بوابة الدفع Paylink

## المتطلبات

1. حساب Paylink نشط من [my.paylink.sa](https://my.paylink.sa/)
2. مفاتيح API (App ID و Secret Key) من لوحة تحكم Paylink

## خطوات الإعداد

### 1. الحصول على مفاتيح API

1. سجّل الدخول إلى [لوحة تحكم Paylink](https://my.paylink.sa/private/api-keys)
2. انتقل إلى قسم "API Keys"
3. انسخ `App ID` و `Secret Key`

### 2. إضافة متغيرات البيئة

أضف المتغيرات التالية إلى ملف `.env` في مجلد المشروع:

```env
# Paylink Configuration
PAYLINK_APP_ID=APP_ID_1764821701792
PAYLINK_SECRET_KEY=0a48bb80-dafc-3ffe-a459-6a5e5069b0b3
PAYLINK_BASE_URL=https://restapi.paylink.sa/api

# Base URL for callbacks (يجب أن يكون URL عام يمكن الوصول إليه من Paylink)
VITE_API_URL=https://your-domain.com
```

### 3. إعداد Webhook في Paylink

1. في لوحة تحكم Paylink، انتقل إلى إعدادات Webhook
2. أضف URL التالي:
   ```
   https://your-domain.com/api/payments/webhook
   ```
3. احفظ الإعدادات

### 4. تشغيل Migration لقاعدة البيانات

قم بتشغيل migration لإضافة جدول `payments`:

```bash
npm run db:push
```

## استخدام API

### إنشاء فاتورة دفع

```javascript
POST /api/payments/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100  // المبلغ بالريال السعودي
}

// Response
{
  "paymentId": "uuid",
  "paymentUrl": "https://paylink.sa/invoice/...",
  "qrCode": "base64_qr_code",
  "invoiceId": "invoice_id"
}
```

### التحقق من حالة الدفع

```javascript
GET /api/payments/:id
Authorization: Bearer {token}

// Response
{
  "id": "uuid",
  "userId": "user_id",
  "amount": "100.00",
  "status": "paid",
  "paylinkInvoiceId": "invoice_id",
  "paymentUrl": "https://paylink.sa/invoice/...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### الحصول على جميع المدفوعات

```javascript
GET /api/payments
Authorization: Bearer {token}

// Response
[
  {
    "id": "uuid",
    "userId": "user_id",
    "amount": "100.00",
    "status": "paid",
    ...
  }
]
```

## حالات الدفع

- `pending`: في انتظار الدفع
- `paid`: تم الدفع بنجاح
- `failed`: فشل الدفع
- `cancelled`: تم إلغاء الدفع

## Webhook

Paylink سيرسل webhook عند تغيير حالة الدفع. الـ webhook handler يقوم بـ:

1. التحقق من حالة الدفع
2. تحديث حالة الدفع في قاعدة البيانات
3. إضافة الرصيد إلى حساب المستخدم عند نجاح الدفع
4. إرسال إشعار للمستخدم

## ملاحظات مهمة

1. تأكد من أن `VITE_API_URL` يشير إلى URL عام يمكن الوصول إليه من الإنترنت
2. في بيئة التطوير، يمكنك استخدام أدوات مثل ngrok لإنشاء tunnel
3. تأكد من أن Webhook URL متاح ويمكن الوصول إليه من Paylink
4. جميع المبالغ بالريال السعودي (SAR)

## استكشاف الأخطاء

### خطأ: "Paylink credentials not configured"
- تأكد من إضافة `PAYLINK_APP_ID` و `PAYLINK_SECRET_KEY` في ملف `.env`
- أعد تشغيل السيرفر بعد إضافة المتغيرات

### خطأ: "Failed to create Paylink invoice"
- تحقق من صحة مفاتيح API
- تأكد من أن المبلغ أكبر من 0
- تحقق من اتصال الإنترنت

### الدفع لا يتم إضافته للرصيد
- تحقق من أن Webhook URL صحيح ومتاح
- راجع logs السيرفر للتحقق من استلام webhook
- يمكنك استخدام callback URL كبديل: `/api/payments/callback`













