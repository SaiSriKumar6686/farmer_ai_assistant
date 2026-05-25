<div align="center">

<img src="assets/images/icon.png" alt="Kisan AI Shield Logo" width="120"/>

# 🌾 Kisan AI Shield

### AI-Powered Agricultural Assistant for Indian Farmers

[![EAS Build](https://img.shields.io/badge/EAS%20Build-Preview%20APK-4A90D9?logo=expo&logoColor=white)](https://expo.dev/accounts/saisrikumarparimi/projects/kisan-ai-shield/builds/3368689e-eba2-4c3f-b73e-25a42fecec94)
[![Backend](https://img.shields.io/badge/Backend-Render.com-46E3B7?logo=render&logoColor=white)](https://kisan-ai-shield.onrender.com/health)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-green?logo=android)](https://expo.dev)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

</div>

---

## 📱 Download the App

> **No setup needed — just install and use.**

| Platform | Link |
|----------|------|
| 🤖 **Android APK** (Direct Install) | [Download APK](https://expo.dev/artifacts/eas/7mbSFZMoW569aeA1p4sdMj.apk) |
| 🔗 **EAS Build Page** (QR Code + Install) | [expo.dev/…/builds/3368689e](https://expo.dev/accounts/saisrikumarparimi/projects/kisan-ai-shield/builds/3368689e-eba2-4c3f-b73e-25a42fecec94) |
| ☁️ **Backend Health Check** | [kisan-ai-shield.onrender.com/health](https://kisan-ai-shield.onrender.com/health) |

---

## 🎯 What It Does

**Kisan AI Shield** is a multilingual AI farming assistant built for Indian farmers. It provides:

| Feature | Description |
|---------|-------------|
| 🔬 **Crop Disease Scanner** | Point camera at any leaf → instant AI diagnosis + treatment advice |
| 🌦 **Weather & Irrigation** | Hyperlocal 7-day forecast with smart irrigation recommendations |
| 📊 **Mandi Market Prices** | Live APMC rates from data.gov.in with AI trend analysis |
| 🏛 **Govt Schemes Finder** | PM-KISAN, PMFBY, Rythu Bandhu + AI eligibility checker |
| 🤖 **AI Farm Advisor** | Voice + text chat in Hindi, Telugu, English via Groq LLM |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         React Native (Expo) App             │
│  • Expo Router navigation                   │
│  • 4-tier offline-first fallback chain      │
│  • Works without backend (Gemini Direct)    │
└───────────────────┬─────────────────────────┘
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────────┐
│      Flask Backend (Render.com Cloud)       │
│  POST /chat     → AI Advisor (Groq/Gemini)  │
│  POST /predict  → Disease Vision Scan       │
│  GET  /weather  → OpenWeatherMap proxy      │
│  POST /schemes  → Eligibility LLM           │
│  POST /mandi-prices → AI market data        │
│  GET  /health   → Liveness check            │
└─────────────────────────────────────────────┘
```

### 4-Tier Fallback (Never Crashes)
```
Request → Render Flask → Direct Cloud API → Firebase Cache → Hardcoded Data
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Expo account (free at [expo.dev](https://expo.dev))

### 1. Clone & Install

```bash
git clone https://github.com/SaiSriKumar6686/farmer_ai_assistant.git
cd farmer_ai_assistant

# Install frontend dependencies
npm install

# Install backend dependencies
cd ai-backend
pip install -r requirements.txt
cd ..
```

### 2. Configure Environment

Create `.env` in the project root:

```env
# Flask Backend URL (use Render URL in production)
EXPO_PUBLIC_API_URL=https://kisan-ai-shield.onrender.com

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# AI APIs
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key
EXPO_PUBLIC_WEATHER_KEY=your_openweather_key

# Backend-only (set in Render dashboard)
GROQ_API_KEY=your_groq_key
```

### 3. Run Locally

```bash
# Start the Flask backend
cd ai-backend
python app.py

# In a new terminal, start the Expo app
npx expo start
```

---

## ☁️ Deploy Backend to Render.com

### Step 1 — Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2 — Create Render Service
1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Set **Root Directory** to `ai-backend`
4. Render auto-detects `render.yaml` — click **Deploy**

### Step 3 — Set Environment Variables in Render Dashboard
| Variable | Value |
|----------|-------|
| `GROQ_API_KEY` | Your Groq API key |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Your Gemini API key |
| `EXPO_PUBLIC_WEATHER_KEY` | Your OpenWeather key |
| `EXPO_PUBLIC_DATA_GOV_API_KEY` | Your data.gov.in key |
| `HF_HUB_OFFLINE` | `1` |

### Step 4 — Verify
```bash
curl https://kisan-ai-shield.onrender.com/health
# → {"status": "ok", "llm": "configured", ...}
```

---

## 📦 Build APK

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build installable APK
eas build --platform android --profile preview

# Download APK from the link printed in terminal
```

---

## 📁 Project Structure

```
farmer_ai_assistant/
├── app/                    # Expo Router screens (tab navigation)
├── screens/                # Screen components
│   ├── HomeScreen.js       # Dashboard with live mandi data
│   ├── AIScreen.js         # AI chat + voice advisor
│   ├── DiseaseScreen.js    # Camera + disease scan
│   ├── WeatherScreen.js    # Weather + irrigation advice
│   ├── MarketScreen.js     # Live mandi prices
│   └── SchemesScreen.js    # Government schemes
├── services/               # API service layer
│   ├── api/gateway.js      # Unified 4-tier API gateway
│   ├── aiService.js        # AI chat service
│   ├── weatherService.js   # Weather service
│   ├── diseaseService.js   # Disease scan service
│   ├── mandiService.js     # Market prices service
│   └── schemeService.js    # Government schemes service
├── ai-backend/             # Python Flask backend
│   ├── app.py              # Main Flask server + all API routes
│   ├── ai_pipeline.py      # Unified AI pipeline facade
│   ├── features/           # AI engine modules
│   │   ├── advisory_llm_engine.py   # Groq/Gemini/OpenRouter LLM
│   │   ├── disease_vision_engine.py # Crop disease detection
│   │   ├── speech_language_engine.py # Translation engine
│   │   └── speech_to_text.py        # Voice transcription
│   ├── requirements.txt    # Python dependencies
│   ├── Procfile            # Render deployment config
│   └── render.yaml         # Render service definition
├── firebase/               # Firebase config
├── context/                # React Context (Language, Auth)
├── components/             # Reusable UI components
└── constants/              # Translations, theme
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server liveness check |
| `POST` | `/chat` | AI farm advisor (text) |
| `POST` | `/voice-chat` | Voice to AI (audio upload) |
| `POST` | `/predict` | Crop disease scan (image upload) |
| `GET` | `/weather` | Proxied weather data |
| `POST` | `/schemes` | Scheme eligibility check |
| `POST` | `/mandi-prices` | AI-generated market prices |
| `POST` | `/translate` | Chat history translation |
| `POST` | `/translate-json` | Bulk JSON translation |

---

## 🤖 AI Stack

| Component | Technology | Fallback |
|-----------|-----------|---------|
| **Language Model** | Groq (Llama 3.3 70B) | → Gemini 1.5 Flash → OpenRouter |
| **Disease Vision** | Custom PyTorch model | → Gemini Vision API |
| **Translation** | deep-translator (Google) | → Pass-through |
| **Speech-to-Text** | Google Web Speech API | → Type input |
| **Weather** | OpenWeatherMap API | → Cached data |
| **Market Prices** | APMC data.gov.in | → AI-generated |

---

## 🌍 Supported Languages

- 🇮🇳 **Telugu** (తెలుగు)
- 🇮🇳 **Hindi** (हिंदी)
- 🇬🇧 **English**

---

## 🛡️ Government Schemes Covered

- **PM-KISAN** — ₹6,000/year income support
- **PM Fasal Bima Yojana** — Crop insurance at 2% premium
- **Rythu Bandhu** — ₹5,000/acre/season (Telangana)
- **Rythu Bima** — ₹5 lakh life insurance (Telangana)
- **Kisan Credit Card** — Low-interest crop credit
- **PM KUSUM** — 90% subsidy on solar pumps
- **Soil Health Card** — Free soil testing
- **PKVY** — ₹50,000/acre organic farming support

---

## 🧑‍💻 Built By

**Saagu360 Team** — Built for Indian farmers with ❤️

---

## 📄 License

MIT License — Free to use, modify, and distribute.
