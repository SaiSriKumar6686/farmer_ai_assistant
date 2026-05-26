"""
Kisan AI Shield — Standalone Flask Backend v2.2
================================================
Render.com free tier optimized:
- No heavy packages (no torch, no pyaudio, no deep-translator pip install)
- Translation via direct Google Translate REST API (no library needed)
- All AI via direct HTTP REST calls (Groq + Gemini)
- Startup in <3 seconds guaranteed
"""
import os
import re
import json
import io
import base64
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from dotenv import load_dotenv

# Load .env if running locally
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

app = Flask(__name__)
CORS(app)

# ── API Keys (read once at startup) ───────────────────────────────────────────
GROQ_KEY    = os.environ.get("GROQ_API_KEY", "").strip()
GEMINI_KEY  = os.environ.get("EXPO_PUBLIC_GEMINI_API_KEY", "").strip()
WEATHER_KEY = os.environ.get("EXPO_PUBLIC_WEATHER_KEY", "").strip()

print(f"[Kisan AI] Groq:    {'OK' if GROQ_KEY    else 'MISSING'}")
print(f"[Kisan AI] Gemini:  {'OK' if GEMINI_KEY  else 'MISSING'}")
print(f"[Kisan AI] Weather: {'OK' if WEATHER_KEY else 'MISSING'}")

SYSTEM_PROMPT = (
    "You are an expert Indian Agronomist AI. Give clear, actionable farming advice. "
    "Use plain sentences only. No markdown, no bullet points."
)


# ─────────────────────────────────────────────────────────────────────────────
# AI HELPERS — all via direct HTTP, zero SDK imports
# ─────────────────────────────────────────────────────────────────────────────

def call_groq(messages, timeout=12):
    if not GROQ_KEY:
        return None
    try:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json={"model": "llama-3.3-70b-versatile", "messages": messages},
            headers={"Authorization": f"Bearer {GROQ_KEY}"},
            timeout=timeout
        )
        if r.status_code == 200:
            return r.json()["choices"][0]["message"]["content"].replace("*", "").strip()
        print(f"[Groq] {r.status_code}: {r.text[:150]}")
    except Exception as e:
        print(f"[Groq] {e}")
    return None


def call_gemini(prompt, timeout=15):
    if not GEMINI_KEY:
        return None
    for model in ["gemini-1.5-flash", "gemini-2.0-flash-lite"]:
        try:
            r = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": GEMINI_KEY},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=timeout
            )
            if r.status_code == 200:
                return r.json()["candidates"][0]["content"]["parts"][0]["text"].replace("*", "").strip()
            print(f"[Gemini/{model}] {r.status_code}: {r.text[:150]}")
        except Exception as e:
            print(f"[Gemini/{model}] {e}")
    return None


def call_gemini_vision(image_b64, prompt, timeout=20):
    if not GEMINI_KEY:
        return None
    for model in ["gemini-1.5-flash", "gemini-2.0-flash-lite"]:
        try:
            r = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": GEMINI_KEY},
                json={"contents": [{"parts": [
                    {"inline_data": {"mime_type": "image/jpeg", "data": image_b64}},
                    {"text": prompt}
                ]}]},
                timeout=timeout
            )
            if r.status_code == 200:
                return r.json()["candidates"][0]["content"]["parts"][0]["text"].replace("*", "").strip()
        except Exception as e:
            print(f"[GeminiVision/{model}] {e}")
    return None


def ai_respond(prompt):
    """Groq first, Gemini fallback."""
    msgs = [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}]
    return (call_groq(msgs)
            or call_gemini(f"{SYSTEM_PROMPT}\n\n{prompt}")
            or "AI advisor is temporarily busy. Please try again.")


def translate(text, target_lang):
    """
    Translation via Google Translate unofficial REST endpoint.
    No pip package needed — just a plain HTTP call.
    Falls back to original text silently on any error.
    """
    if not text or target_lang == "en":
        return text
    try:
        r = requests.get(
            "https://translate.googleapis.com/translate_a/single",
            params={
                "client": "gtx", "sl": "auto", "tl": target_lang,
                "dt": "t", "q": text[:4000]
            },
            timeout=6
        )
        if r.status_code == 200:
            parts = r.json()
            return "".join(chunk[0] for chunk in parts[0] if chunk[0])
    except Exception as e:
        print(f"[Translate] {e}")
    return text


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/', methods=['GET'])
def root():
    """Root route — Render health check hits this first."""
    return jsonify({"status": "ok", "service": "Kisan AI Shield"})


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "version": "2.2",
        "llm": "configured" if (GROQ_KEY or GEMINI_KEY) else "unconfigured",
        "vision": "gemini_cloud",
        "translation": "google_rest"
    })


@app.route('/chat', methods=['POST'])
def chat():
    data     = request.json or {}
    text     = data.get('text', '').strip()
    language = data.get('language', 'en')
    lat      = data.get('lat')
    lon      = data.get('lon')

    if not text:
        return jsonify({"success": False, "error": "No text provided"}), 400

    # Weather context injection
    weather_ctx = ""
    if lat and lon and WEATHER_KEY:
        try:
            w = requests.get(
                f"https://api.openweathermap.org/data/2.5/weather"
                f"?lat={lat}&lon={lon}&appid={WEATHER_KEY}&units=metric",
                timeout=4
            ).json()
            if w.get("cod") == 200:
                weather_ctx = (
                    f"[Weather: {w['weather'][0]['description']}, "
                    f"{w['main']['temp']}°C, {w['main']['humidity']}% RH] "
                )
        except Exception:
            pass

    english_text = translate(text, "en") if language != "en" else text
    response     = ai_respond(f"{weather_ctx}Farmer asks: {english_text}")
    localized    = translate(response, language) if language != "en" else response

    return jsonify({"success": True, "response": localized, "input_language": language})


@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image provided"}), 400

    image_bytes = request.files['image'].read()
    language    = request.form.get('language', 'en')

    if len(image_bytes) > 10 * 1024 * 1024:
        return jsonify({"success": False, "error": "Image too large (max 10MB)"}), 413

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img.thumbnail((800, 800))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=80)
        b64 = base64.b64encode(buf.getvalue()).decode()
    except Exception as e:
        return jsonify({"success": False, "error": f"Image error: {e}"}), 400

    vision_prompt = (
        "Analyze this crop leaf image. Respond ONLY in this exact JSON format:\n"
        '{"disease":"<name or Healthy>","confidence":"<0-100>%","severity":"<Low|Moderate|High|None>",'
        '"recommendation":"<2 sentence treatment>","diagnosis":"<1 sentence diagnosis>"}\n'
        "Only JSON. No markdown."
    )

    raw = call_gemini_vision(b64, vision_prompt)
    if raw:
        try:
            m = re.search(r'\{.*\}', raw, re.DOTALL)
            if m:
                p = json.loads(m.group(0))
                diagnosis      = translate(p.get("diagnosis", ""), language)
                severity       = translate(p.get("severity", ""), language)
                recommendation = translate(p.get("recommendation", ""), language)
                return jsonify({
                    "success": True,
                    "disease": p.get("disease", "Unknown"),
                    "confidence": p.get("confidence", "N/A"),
                    "visual_severity": severity,
                    "diagnosis": diagnosis,
                    "recommendation": recommendation
                })
        except Exception as e:
            print(f"[Predict] parse error: {e}")

    return jsonify({"success": False, "error": "Could not analyse image. Please try a clearer photo."}), 500


@app.route('/weather', methods=['GET'])
def get_weather():
    lat = request.args.get('lat', '17.2473')
    lon = request.args.get('lon', '80.1514')
    if not WEATHER_KEY:
        return jsonify({"success": False, "error": "Weather key not set"}), 500
    try:
        current  = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={WEATHER_KEY}&units=metric",
            timeout=10).json()
        forecast = requests.get(
            f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={WEATHER_KEY}&units=metric",
            timeout=10).json()
        if current.get('cod') not in (200, '200'):
            return jsonify({"success": False, "error": current.get('message')}), 400
        return jsonify({"success": True, "current": current, "forecast": forecast})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/schemes', methods=['POST'])
def schemes():
    data     = request.json or {}
    name     = data.get('name', 'Farmer')
    state    = data.get('state', 'India')
    acres    = data.get('land_acres', '2')
    crop     = data.get('crop', 'Rice')
    category = data.get('category', 'General')
    language = data.get('language', 'en')
    lang_name = {'te': 'Telugu', 'hi': 'Hindi', 'en': 'English'}.get(language, 'English')

    prompt = (
        f"Farmer {name} from {state}: {acres} acres, grows {crop}, category {category}.\n"
        f"List TOP 5 Indian government agricultural schemes for 2026.\n"
        f'Return ONLY JSON array: [{{"name":"...","ministry":"...","benefit":"...","amount":"...","desc":"..."}}]\n'
        f"Values in {lang_name}. No markdown."
    )
    raw = ai_respond(prompt)
    try:
        m = re.search(r'\[.*\]', raw, re.DOTALL)
        if m:
            return jsonify({"success": True, "schemes": json.loads(m.group(0))})
    except Exception:
        pass
    return jsonify({"success": True, "schemes": [{"name": raw[:200], "ministry": "", "benefit": "", "amount": "", "desc": ""}]})


@app.route('/mandi-prices', methods=['POST'])
def mandi_prices():
    data  = request.json or {}
    mandi = data.get('mandi', 'Hyderabad')
    lang  = data.get('language', 'en')

    FALLBACK = {
        "signal": {"crop": "Chilli", "emoji": "🫑", "title": f"Market Update — {mandi}", "desc": "Prices stable this week."},
        "prices": [
            {"emoji": "🌾", "name": "Wheat",     "price": "₹2,150", "change": "+2.4%", "up": True},
            {"emoji": "🌽", "name": "Maize",     "price": "₹1,820", "change": "-0.8%", "up": False},
            {"emoji": "🍅", "name": "Tomato",    "price": "₹3,400", "change": "+5.2%", "up": True},
            {"emoji": "🧅", "name": "Onion",     "price": "₹1,650", "change": "-1.3%", "up": False},
            {"emoji": "🫑", "name": "Chilli",    "price": "₹9,200", "change": "+3.7%", "up": True},
            {"emoji": "🌱", "name": "Soybean",   "price": "₹4,100", "change": "+1.1%", "up": True},
            {"emoji": "🥜", "name": "Groundnut", "price": "₹5,800", "change": "+0.6%", "up": True},
            {"emoji": "🌿", "name": "Cotton",    "price": "₹7,300", "change": "-2.1%", "up": False},
        ]
    }
    raw = ai_respond(
        f"List 8 crop prices at {mandi} mandi India. "
        f'JSON only: {{"signal":{{"crop":"...","emoji":"...","title":"...","desc":"..."}},'
        f'"prices":[{{"emoji":"...","name":"...","price":"₹...","change":"+X%","up":true}}]}}'
    )
    try:
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            return jsonify({"success": True, "data": json.loads(m.group(0))})
    except Exception:
        pass
    return jsonify({"success": True, "data": FALLBACK})


@app.route('/translate', methods=['POST'])
def translate_chat():
    data = request.json or {}
    return jsonify({
        "success": True,
        "translations": [translate(t, data.get('language', 'en')) for t in data.get('texts', [])]
    })


@app.route('/translate-json', methods=['POST'])
def translate_json():
    data     = request.json or {}
    payload  = data.get('payload', [])
    language = data.get('language', 'en')
    if language == 'en':
        return jsonify({"success": True, "translated": payload})

    unique = set()
    def _extract(obj):
        if isinstance(obj, dict):
            for v in obj.values(): _extract(v)
        elif isinstance(obj, list):
            for v in obj: _extract(v)
        elif isinstance(obj, str) and len(obj) > 1 and not obj.startswith('http'):
            unique.add(obj)
    _extract(payload)

    tmap = {s: translate(s, language) for s in unique}

    def _rebuild(obj):
        if isinstance(obj, dict):   return {k: _rebuild(v) for k, v in obj.items()}
        if isinstance(obj, list):   return [_rebuild(i) for i in obj]
        if isinstance(obj, str):    return tmap.get(obj, obj)
        return obj

    return jsonify({"success": True, "translated": _rebuild(payload)})


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Kisan AI Shield v2.2 — port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
