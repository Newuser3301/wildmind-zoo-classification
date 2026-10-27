---
title: WildMind AI - Interactive Zoo Classification Lab
emoji: 🦁
colorFrom: green
colorTo: cyan
sdk: docker
app_port: 7860
pinned: false
---

# 🌿 WildMind AI — Interactive Zoo Classification Lab

> **Subtitle:** "Interactive Zoo Classification Lab. Uchta algoritm. Uch xil fikrlash usuli. Bitta hayvon."  
> **Core Concept:** *"See the intelligence behind every prediction."*

**WildMind AI** — bu mashinali o'rganish (Machine Learning) algoritmlarining qanday fikrlashini talabalar, tadqiqotchilar va qiziquvchilar uchun bosqichma-bosqich, matematik jihatdan to'g'ri va vizual interaktiv tarzda tushuntirib beruvchi zamonaviy laboratoriya platformasi.

Loyihada **haqiqiy UCI Zoo ma'lumotlar to'plami** (101 ta hayvon, 16 ta biologik xususiyat, 7 ta sinf guruhi) va haqiqiy `scikit-learn` modellari ishlatilgan. Barcha animatsiyalar sun'iy simulyatsiya emas, balki real modellarning ichki parametrlariga to'liq asoslangan.

---

## 🔬 Uchta Haqiqiy Mashinali O'rganish Algoritmi

### 1. DecisionTreeClassifier (Qarorlar Daraxti)
* **G'oya:** Biologik belgilarni (masalan, sut emizish, patlar, oyoqlar soni) ildiz tugunidan boshlab shartli tekshirish orqali daraxt bo'ylab shoxlanadi.
* **Vizualizatsiya:** Haqiqiy `tree_.children_left`, `children_right`, `threshold`, va `impurity` (Gini) parametrlari asosida interaktiv daraxt chiziladi.
* **Bosqichma-bosqich kuzatish:** Foydalanuvchi kiritgan hayvon belgilari bo'yicha har bir tugunda shart tekshiriladi (`milk <= 0.5`), tanlangan tarmoq bo'ylab animatsiya harakatlanadi va yakuniy barg (leaf) tugunidagi ehtimollik ochiladi.
* **Boshqaruv:** Play, Pause, Oldinga/Orqaga qadam, 0.5x/1x/2x tezlik, masshtablash (Zoom/Pan).

### 2. K-Nearest Neighbors (KNN — K-Eng Yaqin Qo'shnilar)
* **G'oya:** Yangi hayvonni 16 o'lchamli fazoda (StandardScaler orqali normallashtirilgan) unga eng yaqin K ta o'quv namunalarining ko'pchilik ovozi (majority vote) orqali tasniflaydi.
* **Matematik haqiqiylik:** Masofalar 16 o'lchamli fazoda Evklid formulasi bo'yicha hisoblanadi. 2D xarita esa vizual tushunish uchun o'quv ma'lumotlariga moslangan PCA (Asosiy Komponentlar Tahlili) proyeksiyasidir.
* **Interaktiv xususiyatlar:** Dinamik K selektori (1, 3, 5, 7, 9), qidiruv to'lqini (pulse) animatsiyasi, masofa chiziqlari, o'quv namunalarini batafsil tekshirish, va ko'rgazmali 2D qaror chegaralari.

### 3. RandomForestClassifier (Tasodifiy O'rmon — Ensemble)
* **G'oya:** 100 ta mustaqil qarorlar daraxtlarining kollektiv konsensus ovozi. Har bir daraxt tasodifiy o'quv qismlari (Bootstrap / Bagging) va tasodifiy belgilar to'plami orqali o'qitilgan.
* **Vizualizatsiya:** 100 ta haqiqiy daraxtdan iborat miniatyura o'rmon maydoni. Jonli ovoz berish jarayoni, real vaqtda yangilanuvchi ovozlar gistogrammasi va `predict_proba` ehtimollik taqsimoti.
* **Chuqur tahlil:** Istalgan daraxtni bosib, uning ichki arxitekturasi va bergan ovozini alohida tekshirish imkoniyati.

---

## 📊 UCI Zoo Ma'lumotlar To'plami

To'plam 1990 yilda Richard Forsyth tomonidan UCI Machine Learning Repository-ga taqdim etilgan:
* **Namunalar soni:** 101 ta hayvon.
* **Kiruvchi belgilar (16 ta):**
  1. `hair` (jun/tuklar)
  2. `feathers` (patlar)
  3. `eggs` (tuxum qo'yish)
  4. `milk` (sut emizish)
  5. `airborne` (havoda uchish)
  6. `aquatic` (suvda yashash)
  7. `predator` (yirtqichlik)
  8. `toothed` (tishlar mavjudligi)
  9. `backbone` (umurtqa pog'onasi)
  10. `breathes` (o'pka bilan nafas olish)
  11. `venomous` (zaharlilik)
  12. `fins` (suzgich qanotlar)
  13. `legs` (oyoqlar soni: 0, 2, 4, 5, 6, 8)
  14. `tail` (dum)
  15. `domestic` (xonaki hayvon)
  16. `catsize` (mushuk o'lchami yoki undan katta)
* **Tasnif sinflari (7 ta guruh):**
  1. Sutemizuvchilar (Mammal) — 41 ta namuna
  2. Qushlar (Bird) — 20 ta namuna
  3. Sudralib yuruvchilar (Reptile) — 5 ta namuna
  4. Baliqlar (Fish) — 13 ta namuna
  5. Suvda ham quruqlikda yashovchilar (Amphibian) — 4 ta namuna
  6. Hasharotlar (Insect) — 8 ta namuna
  7. Umurtqasizlar (Invertebrate) — 10 ta namuna

---

## 🛠 Texnologik Stek

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion.
* **Backend:** Python 3.12, FastAPI, Uvicorn, Pydantic v2.
* **Machine Learning:** scikit-learn (DecisionTreeClassifier, KNeighborsClassifier, RandomForestClassifier, Pipeline, StandardScaler, PCA), pandas, NumPy, joblib.
* **Testlar:** pytest (backend API va ML logikasi), Vitest (frontend komponentlari va ma'lumotlar validatsiyasi).

---

## 🚀 O'rnatish va Ishga Tushirish

### 1. Talablar
* Python 3.10 yoki undan yuqori
* Node.js v18 yoki undan yuqori (npm bilan)

### 2. Python bog'liqliklarini o'rnatish
```bash
pip install -r backend/requirements.txt
```

### 3. Frontend bog'liqliklarini o'rnatish
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Dasturni ishga tushirish (Unified Fullstack Server)
FastAPI backend o'rnatilgan frontend build-ni avtomatik ravishda xizmat qiladi:
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
Brauzerda oching:
👉 **http://127.0.0.1:8000**

### 5. Rivojlanish rejimi (Frontend Dev Server)
Agar frontend kodini alohida hot-reload bilan tahrirlashni istasangiz:
```bash
# Terminal 1 (Backend API):
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 (Vite Dev Server):
cd frontend
npm run dev
```
Brauzerda oching:
👉 **http://localhost:5173**

---

## 🧪 Avtomatlashtirilgan Testlar

### Backend testlari (pytest)
API endpointlari, qarorlar daraxti izlash traektoriyasi, KNN masofa hisoblash tartibi va Random Forest ovozlari tekshiriladi:
```bash
python -m pytest backend/tests/test_backend.py -v
```

### Frontend testlari (vitest)
Presetlar xususiyatlari, 16 ta belgi validatsiyasi, Evklid masofasi va konsensus mantiqi tekshiriladi:
```bash
cd frontend
npm test
```

---

## 🌐 API Hujjatlari (OpenAPI / Swagger)

Server ishga tushirilgandan so'ng to'liq interaktiv API hujjatlari bilan tanishishingiz mumkin:
👉 **http://127.0.0.1:8000/docs**

Asosiy endpointlar:
* `GET /api/health` — Tizim holati va o'qitilgan modellar mavjudligi.
* `GET /api/dataset/summary` — Ma'lumotlar to'plami metama'lumotlari va statistikasi.
* `GET /api/dataset/animals` — Barcha 101 ta haqiqiy hayvon yozuvlari.
* `GET /api/models/metrics` — Uchala modelning test aniqligi, Precision, Recall, F1 va Confusion Matrix ko'rsatkichlari.
* `POST /api/models/predict` — 16 ta biologik belgi bo'yicha 3 ta modeldan bir vaqtda kanonik bashorat.
* `GET /api/decision-tree/structure` — Haqiqiy qarorlar daraxti tugunlari va parametrlari.
* `POST /api/decision-tree/trace` — Jonzot uchun ildizdan barggacha bo'lgan qadam-baqadam shoxlanish traektoriyasi.
* `POST /api/knn/neighbors` — Standartlashtirilgan 16D fazodagi haqiqiy eng yaqin qo'shnilar va masofalar.
* `GET /api/knn/projection` — 80 ta o'quv namunasining 2D PCA koordinatalari.
* `POST /api/random-forest/votes` — 100 ta daraxtning mustaqil ovozlari va ehtimolliklar taqsimoti.
* `GET /api/random-forest/tree/{tree_id}` — O'rmondagi alohida tanlangan daraxtning to'liq tuzilishi.

---

## 📁 Loyiha Strukturasi

```
zoo/
├── backend/
│   ├── app/
│   │   ├── api/                 # FastAPI routerlari (dataset, models, decision_tree, knn, random_forest)
│   │   ├── ml/                  # Machine learning pipeline, dataset loader, tree extractor, knn service
│   │   ├── schemas/             # Pydantic ma'lumotlar modellari va validatsiya
│   │   └── main.py              # FastAPI ilovasi va SPA statik fayllarni uzatish
│   ├── data/                    # Haqiqiy zoo.csv va zoo.data to'plami
│   ├── models/                  # Saqlangan o'qitilgan modellar
│   ├── tests/                   # Pytest avtomatlashtirilgan testlari
│   └── requirements.txt         # Python paketlar ro'yxati
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, AnimalStatusBar
│   │   ├── constants/           # Haqiqiy hayvon presetlari va sinflar xaritasi
│   │   ├── context/             # Global faol hayvon va bashorat holati (AnimalContext)
│   │   ├── pages/               # Home, AnimalStudio, DecisionTree, KNNMap, RandomForest, ModelComparison, Dataset
│   │   ├── services/            # Backend API chaqiruvlari (api.ts)
│   │   ├── tests/               # Vitest testlari
│   │   ├── types/               # TypeScript interfeyslari
│   │   ├── App.tsx              # Asosiy ilova komponenti
│   │   └── main.tsx             # React entrypoint
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── README.md                    # To'liq hujjatlar
├── .gitignore                   # Git istisnolar ro'yxati
└── .env.example                 # Konfiguratsiya namunasi
```

---

## 💡 Ilmiy Izoh va Cheklovlar

1. **Ma'lumotlar hajmi:** UCI Zoo to'plami 101 ta namunadan iborat bo'lib, ta'limiy maqsadlar uchun qulay, ammo ayrim sinflarda (masalan, sudralib yuruvchilar — 5 ta, amfibiyalar — 4 ta) namunalar juda kam.
2. **Kanonik vektor:** Har qanday hayvon tanlanganda yoki tahrirlanganda, aynan bir xil 16 ta biologik parametr barcha 3 ta modelga uzatiladi.
3. **Piksellar emas, belgilar:** Ma'lumotlar to'plamida rasm piksellari mavjud emas. Ilovada rasm yuklash imkoniyati faqat foydalanuvchi interfeysida ko'rgazmali namoyish uchun mo'ljallangan va model xulosasiga ta'sir qilmaydi.
