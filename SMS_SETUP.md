# إعداد خدمة SMS لإرسال OTP

## المشكلة
إذا لم تستلم رمز OTP عند تسجيل الدخول، فالمشكلة على الأرجح أن مفتاح API لخدمة SMS غير مُعد.

## الحل

### 1. التسجيل في Authentica
1. قم بزيارة [https://authentica.sa](https://authentica.sa)
2. سجّل حساب جديد
3. احصل على مفتاح API من لوحة التحكم

### 2. إضافة المفتاح إلى متغيرات البيئة
أضف السطر التالي إلى ملف `.env` في جذر المشروع:

```env
AUTHENTICA_API_KEY=your_api_key_here
```

### 3. إعادة تشغيل السيرفر
بعد إضافة المفتاح، أعد تشغيل السيرفر:

```bash
npm run dev
```

## وضع التطوير (Development Mode)

في وضع التطوير، إذا لم يكن `AUTHENTICA_API_KEY` موجوداً:
- سيتم إرجاع رمز OTP في الاستجابة API تحت مفتاح `devCode`
- يمكنك استخدام هذا الرمز للاختبار
- لن يتم إرسال SMS فعلياً

## التحقق من الإعداد

عند بدء السيرفر، يجب أن ترى رسالة:
```
[SMS] OTP sent via Authentica to +9665XXXXXXXX for login
```

إذا رأيت:
```
⚠️  [SMS] AUTHENTICA_API_KEY is not configured!
```

فهذا يعني أن المفتاح غير موجود أو غير صحيح.

## اختبار الإعداد

بعد إضافة `AUTHENTICA_API_KEY`، يمكنك اختبار الإعداد باستخدام:

```bash
npx tsx script/test-sms.ts [رقم_الهاتف]
```

مثال:
```bash
npx tsx script/test-sms.ts 0501234567
```

سيعرض السكريبت:
- حالة مفتاح API
- تنسيق رقم الهاتف
- محاولة إرسال SMS اختباري
- رسائل الخطأ إن وجدت

## استكشاف الأخطاء

### المشكلة: لا يزال لا يتم إرسال OTP

#### 1. تحقق من المفتاح
```bash
# تحقق من وجود المفتاح في .env
cat .env | grep AUTHENTICA
```

#### 2. تحقق من السجلات
عند محاولة إرسال OTP، تحقق من سجلات السيرفر. يجب أن ترى:
```
[SMS] Attempting to send OTP to +9665XXXXXXXX
[SMS] Request body: {...}
[SMS] Response status: 200 OK
[SMS] Response data: {...}
✅ [SMS] OTP sent successfully via Authentica
```

إذا رأيت أخطاء:
- `401 Unauthorized`: المفتاح غير صحيح أو منتهي الصلاحية
- `400 Bad Request`: رقم الهاتف أو البيانات غير صحيحة
- `500 Internal Server Error`: مشكلة في خدمة Authentica

#### 3. تحقق من رقم الهاتف
- يجب أن يكون بصيغة: `05XXXXXXXX` (10 أرقام)
- أو: `+9665XXXXXXXX` (13 رقم مع رمز الدولة)

#### 4. تحقق من حساب Authentica
- سجّل الدخول إلى [لوحة تحكم Authentica](https://authentica.sa)
- تحقق من رصيد الرسائل
- تحقق من حالة الحساب (نشط/معطل)
- راجع سجل الرسائل المرسلة

### المشكلة: خطأ في API

#### أخطاء شائعة:

**`SMS service not configured`**
- المفتاح غير موجود في `.env`
- لم يتم إعادة تشغيل السيرفر بعد إضافة المفتاح

**`Invalid phone number`**
- رقم الهاتف غير صحيح
- استخدم الصيغة: `05XXXXXXXX`

**`Unauthorized` أو `401`**
- المفتاح غير صحيح
- المفتاح منتهي الصلاحية
- الحساب معطل

**`Insufficient balance`**
- رصيد الرسائل في Authentica منتهي
- اشترِ رصيد من لوحة التحكم

### الحصول على المساعدة

1. راجع [وثائق Authentica API](https://authenticasa.docs.apiary.io)
2. تحقق من [لوحة تحكم Authentica](https://authentica.sa) للأخطاء
3. راجع سجلات السيرفر للأخطاء التفصيلية
4. استخدم سكريبت الاختبار: `npx tsx script/test-sms.ts`

## ملاحظات
- في الإنتاج (production)، يجب أن يكون `AUTHENTICA_API_KEY` موجوداً دائماً
- في التطوير (development)، يمكنك استخدام `devCode` للاختبار بدون SMS

