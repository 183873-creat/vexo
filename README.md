# VEXO Video Editing

موقع معرض أعمال وصفحة إدارة مبنيان بصفحات HTML وJavaScript modules، ويستخدمان Firebase Authentication وCloud Firestore وCloud Storage.

## تشغيل الموقع

1. انشر المشروع على استضافة تدعم HTTPS، أو شغّله عبر خادم تطوير محلي مثل Live Server. لا تفتح ملفات HTML مباشرة عبر `file://` لأن المتصفح يمنع تحميل JavaScript modules بهذه الطريقة.
2. في Firebase Console للمشروع `gfhffgh-73edc` فعّل Email/Password من **Authentication → Sign-in method**، وأنشئ حساب المدير من **Authentication → Users → Add user**.
3. استبدل `REPLACE_WITH_ADMIN_EMAIL` بالبريد الإلكتروني نفسه في `firestore.rules` و`storage.rules`، ثم انشر القاعدتين من تبويبي **Firestore Database → Rules** و**Storage → Rules**.
4. أنشئ قاعدة بيانات Cloud Firestore وفعّل Cloud Storage للمشروع.
5. افتح `admin.html` وسجّل الدخول بالحساب الذي أنشأته. أضف ملفات الفيديو من لوحة الإدارة؛ ستظهر تلقائياً في `index.html`.
6. رابط واتساب في الموقع مضبوط على الرقم الجزائري `+213 562 098 325`.

قواعد Firebase هي الحماية الفعلية للكتابة والحذف؛ لا تعتمد على إخفاء رابط لوحة الإدارة. إعداد Firebase في `firebase.js` مخصص للواجهة العامة، أما كلمات المرور فلا توضع في ملفات الموقع.

إذا ظهر خطأ عند الرفع، تأكد في Firebase Console من إنشاء حاوية Storage وتطابق اسمها مع `storageBucket` في `firebase.js`، ومن نشر `storage.rules` بعد وضع بريد المدير. قد يتطلب إنشاء حاوية التخزين تفعيل خطة الفوترة التي يطلبها Firebase للمشروع. تعرض لوحة الإدارة استجابة الخادم في رسائل أخطاء الرفع للمساعدة في تحديد السبب.
