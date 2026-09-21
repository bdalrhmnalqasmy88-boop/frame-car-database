# فريم - Frame Sizes Database

تطبيق لإدارة قاعدة بيانات مقاسات وصور فريمات السيارات، مخصص للاستخدام في مجال الطباعة والإعلان (طباعة الاستيكرات والملصقات).

## الميزات

- **إضافة سيارات جديدة**: الماركة، الموديل، سنة الصنع، المقاسات (العرض والارتفاع بالسم)، صورة للفريم، وملاحظات
- **البحث السريع**: ابحث بالاسم أو الموديل أو السنة
- **عرض التفاصيل**: صورة كبيرة مع المقاسات وإمكانية نسخها للمشاركة في برامج التصميم
- **تعديل وحذف**: إدارة كاملة لكل سجل
- **دعم العمل بدون إنترنت كلياً (Offline-First)**:
  - البيانات تُحفظ محلياً باستخدام IndexedDB (على الويب) و AsyncStorage (على الموبايل)
  - الصور تُخزن محلياً كـ base64
  - المزامنة التلقائية مع قاعدة البيانات السحابية عند توفر الاتصال
  - Service Worker لتثبيت التطبيق كـ PWA على المتصفح

## البنية التقنية

- **Frontend**: React Native + Expo Router (Web + Mobile)
- **Backend**: Supabase (PostgreSQL + Storage)
- **التخزين المحلي**: IndexedDB / AsyncStorage
- **PWA**: Service Worker + Web Manifest
- **الخط**: Cairo (عربي)

## كيفية البناء

### المتطلبات
- Node.js 18+
- npm

### تثبيت الحزم
```bash
npm install
```

### التشغيل المحلي
```bash
npm run dev
```

### بناء نسخة الويب (PWA)
```bash
npm run build:web
```

### بناء APK للأندرويد
لأن بيئة Bolt تعمل في المتصفح فقط، لبناء ملف APK يجب:

1. تصدير المشروع وفتحه محلياً (في VS Code أو Cursor)
2. تثبيت EAS CLI:
```bash
npm install -g eas-cli
```
3. بناء APK:
```bash
eas build -p android --profile preview
```

أو استخدام Expo Dev Client:
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

ملف APK سيكون في `android/app/build/outputs/apk/release/`.

## رفع المشروع إلى GitHub

1. أنشئ مستودع جديد على GitHub
2. من جهازك المحلي:
```bash
git init
git add .
git commit -m "Initial commit - Frame app"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

## هيكل المشروع

```
app/
├── _layout.tsx          # التخطيط الرئيسي (خطوط + RTL + Service Worker)
├── (tabs)/
│   ├── _layout.tsx      # تبويبات سفلى
│   ├── index.tsx        # الصفحة الرئيسية - قائمة السيارات
│   ├── search.tsx       # صفحة البحث
│   └── add.tsx          # إضافة سيارة جديدة
├── car/[id]/
│   ├── index.tsx        # تفاصيل السيارة
│   └── edit.tsx         # تعديل السيارة
lib/
├── supabase.ts          # اتصال Supabase + الأنواع
├── api.ts               # طبقة API (Offline-First)
├── localStorage.ts      # تخزين محلي (IndexedDB/AsyncStorage)
├── imageUtils.ts        # أدوات تحويل الصور
└── theme.ts             # ألوان ومسافات
hooks/
├── useFrameworkReady.ts
└── useServiceWorker.ts  # تسجيل Service Worker
public/
├── sw.js                # Service Worker
└── manifest.json        # PWA Manifest
```

## الترخيص

استخدام شخصي/تجاري
