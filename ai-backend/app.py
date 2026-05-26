"""
Kisan AI Shield — Standalone Flask Backend
==========================================
Designed to deploy reliably on Render.com free tier.
- Zero heavy dependencies (no torch, no pyaudio, no ffmpeg)
- All AI via REST API calls (Groq, Gemini, OpenRouter)
- Crash-proof startup: all external calls lazy, all errors caught
"""
import os
import re
import json
import tempfile
import uuid
import requests
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import base64
import io

# Load .env if present locally (ignored on Render — env vars set in dashboard)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

app = Flask(__name__)
CORS(app)

# ── Read all keys once at startup ──────────────────────────────────────────────
GROQ_KEY   = os.environ.get("GROQ_API_KEY", "").strip()
GEMINI_KEY = os.environ.get("EXPO_PUBLIC_GEMINI_API_KEY", "").strip()
WEATHER_KEY= os.environ.get("EXPO_PUBLIC_WEATHER_KEY", "").strip()

print(f"[Server] Groq key:   {'SET' if GROQ_KEY   else 'MISSING'}")
print(f"[Server] Gemini key: {'SET' if GEMINI_KEY else 'MISSING'}")
print(f"[Server] Weather key:{'SET' if WEATHER_KEY else 'MISSING'}")


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are an expert Indian Agronomist AI. Give actionable, concise farming advice. "
    "Never use markdown or bullet points. Reply in plain sentences only."
)

def call_groq(messages, timeout=12):
    if not GROQ_KEY:
        return None
    try:
        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json={"model": "llama-3.3-70b-versatile", "messages": messages},
            headers={"Authorization": f"Bearer {GROQ_KEY}"},
            timeout=timeout
        )
        if res.status_code == 200:
            return res.json()["choices"][0]["message"]["content"].replace("*", "").strip()
        print(f"[Groq] HTTP {res.status_code}: {res.text[:200]}")
    except Exception as e:
        print(f"[Groq] Error: {e}")
    return None


def call_gemini_text(prompt, timeout=15):
    if not GEMINI_KEY:
        return None
    for model in ["gemini-1.5-flash", "gemini-2.0-flash-lite"]:
        try:
            res = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": GEMINI_KEY},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=timeout
            )
            if res.status_code == 200:
                text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                return text.replace("*", "").strip()
            print(f"[Gemini/{model}] HTTP {res.status_code}: {res.text[:200]}")
        except Exception as e:
            print(f"[Gemini/{model}] Error: {e}")
    return None


def call_gemini_vision(image_b64, prompt, timeout=20):
    if not GEMINI_KEY:
        return None
    for model in ["gemini-1.5-flash", "gemini-2.0-flash-lite"]:
        try:
            res = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": GEMINI_KEY},
                json={"contents": [{"parts": [
                    {"inline_data": {"mime_type": "image/jpeg", "data": image_b64}},
                    {"text": prompt}
                ]}]},
                timeout=timeout
            )
            if res.status_code == 200:
                text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                return text.replace("*", "").strip()
            print(f"[GeminiVision/{model}] HTTP {res.status_code}: {res.text[:200]}")
        except Exception as e:
            print(f"[GeminiVision/{model}] Error: {e}")
    return None


def generate_ai_response(prompt):
    """Try Groq first, fallback to Gemini."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": prompt}
    ]
    result = call_groq(messages)
    if result:
        return result
    result = call_gemini_text(f"{SYSTEM_PROMPT}\n\n{prompt}")
    if result:
        return result
    return "AI advisor is temporarily busy. Please try again in a moment."


def translate_text(text, target_lang):
    """Translate using deep_translator with graceful fallback."""
    if not text or target_lang == "en":
        return text
    try:
        from deep_translator import GoogleTranslator
        return GoogleTranslator(source="auto", target=target_lang).translate(text)
    except Exception as e:
        print(f"[Translate] Error: {e}")
        return text


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "version": "2.1",
        "llm": "configured" if (GROQ_KEY or GEMINI_KEY) else "unconfigured",
        "vision": "cloud_gemini",
        "translation": "enabled"
    })


@app.route('/chat', methods=['POST'])
def chat():
    data = request.json or {}
    text     = data.get('text', '').strip()
    language = data.get('language', 'en')
    lat      = data.get('lat')
    lon      = data.get('lon')

    if not text:
        return jsonify({"success": False, "error": "No text provided"}), 400

    # Optionally inject weather context
    weather_ctx = ""
    if lat and lon and WEATHER_KEY:
        try:
            wr = requests.get(
                f"https://api.openweathermap.org/data/2.5/weather"
                f"?lat={lat}&lon={lon}&appid={WEATHER_KEY}&units=metric",
                timeout=5
            ).json()
            if wr.get("cod") == 200:
                weather_ctx = (
                    f"[Current weather: {wr['weather'][0]['description']}, "
                    f"{wr['main']['temp']}°C, {wr['main']['humidity']}% humidity]\n"
                )
        except Exception:
            pass

    # Translate input to English if needed
    english_text = translate_text(text, "en") if language != "en" else text

    prompt   = f"{weather_ctx}Farmer asks: {english_text}"
    response = generate_ai_response(prompt)

    # Translate response back if needed
    localized = translate_text(response, language) if language != "en" else response

    return jsonify({"success": True, "response": localized, "input_language": language})


@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image provided"}), 400

    image_bytes = request.files['image'].read()
    language    = request.form.get('language', 'en')

    if len(image_bytes) > 10 * 1024 * 1024:
        return jsonify({"success": False, "error": "Image too large (max 10MB)"}), 413

    # Compress image to reduce Gemini API payload
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img.thumbnail((800, 800))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        image_b64 = base64.b64encode(buf.getvalue()).decode()
    except Exception as e:
        return jsonify({"success": False, "error": f"Image processing error: {e}"}), 400

    vision_prompt = (
        "You are an expert plant pathologist. Analyze this crop leaf image and respond in EXACTLY this JSON format:\n"
        '{"disease":"<name or Healthy>","confidence":"<0-100>%","severity":"<Low|Moderate|High|None>",'
        '"recommendation":"<2 sentence actionable treatment advice>","diagnosis":"<1 sentence clinical diagnosis>"}\n'
        "Return ONLY the JSON. No markdown, no explanation."
    )

    raw = call_gemini_vision(image_b64, vision_prompt)

    if raw:
        try:
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                disease        = parsed.get("disease", "Unknown")
                confidence     = parsed.get("confidence", "N/A")
                severity       = parsed.get("severity", "Unknown")
                recommendation = parsed.get("recommendation", "Consult a local agronomist.")
                diagnosis      = parsed.get("diagnosis", disease)

                if language != "en":
                    diagnosis       = translate_text(diagnosis, language)
                    severity        = translate_text(severity, language)
                    recommendation  = translate_text(recommendation, language)

                return jsonify({
                    "success": True,
                    "disease": disease,
                    "confidence": confidence,
                    "visual_severity": severity,
                    "diagnosis": diagnosis,
                    "recommendation": recommendation
                })
        except Exception as parse_err:
            print(f"[Predict] JSON parse error: {parse_err}, raw: {raw[:300]}")

    return jsonify({
        "success": False,
        "error": "Could not analyze image. Please try with a clearer photo of the leaf."
    }), 500


@app.route('/weather', methods=['GET'])
def get_weather():
    lat = request.args.get('lat', '17.2473')
    lon = request.args.get('lon', '80.1514')

    if not WEATHER_KEY:
        return jsonify({"success": False, "error": "Weather API key not configured"}), 500

    try:
        current = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}&lon={lon}&appid={WEATHER_KEY}&units=metric",
            timeout=10
        ).json()

        forecast = requests.get(
            f"https://api.openweathermap.org/data/2.5/forecast"
            f"?lat={lat}&lon={lon}&appid={WEATHER_KEY}&units=metric",
            timeout=10
        ).json()

        if current.get('cod') not in (200, '200'):
            return jsonify({"success": False, "error": current.get('message', 'Unknown error')}), 400

        return jsonify({"success": True, "current": current, "forecast": forecast})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/schemes', methods=['POST'])
def schemes():
    data     = request.json or {}
    name     = data.get('name', 'Farmer')
    state    = data.get('state', 'India')
    acres    = data.get('land_acres', 'Unknown')
    crop     = data.get('crop', 'General')
    category = data.get('category', 'General')
    language = data.get('language', 'en')

    lang_names = {'te': 'Telugu', 'hi': 'Hindi', 'en': 'English'}
    lang_name  = lang_names.get(language, 'English')

    prompt = (
        f"Indian farmer: {name}, {state}, {acres} acres, {crop} crop, {category} category.\n"
        f"List TOP 5 government agricultural schemes they qualify for in 2026.\n"
        f'Reply ONLY as a JSON array: [{{"name":"...","ministry":"...","benefit":"...","amount":"...","desc":"..."}}]\n'
        f"All values in {lang_name}. No markdown."
    )

    raw = generate_ai_response(prompt)
    try:
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match:
            return jsonify({"success": True, "schemes": json.loads(match.group(0))})
    except Exception as e:
        print(f"[Schemes] Parse error: {e}")

    return jsonify({"success": True, "schemes": [{"name": raw, "ministry": "", "benefit": "", "amount": "", "desc": ""}]})


@app.route('/mandi-prices', methods=['POST'])
def mandi_prices():
    data     = request.json or {}
    mandi    = data.get('mandi', 'Hyderabad')
    language = data.get('language', 'en')

    FALLBACK = {
        "signal": {"crop": "Chilli", "emoji": "🫑", "title": f"Market Update - {mandi}", "desc": "Prices stable this week."},
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

    prompt = (
        f"8 crop prices for {mandi} mandi, India. Language: {language}. "
        f'JSON only: {{"signal":{{"crop":"...","emoji":"...","title":"...","desc":"..."}},'
        f'"prices":[{{"emoji":"...","name":"...","price":"₹...","change":"+X%","up":true}}]}}'
    )

    raw = generate_ai_response(prompt)
    try:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            return jsonify({"success": True, "data": json.loads(match.group(0))})
    except Exception:
        pass

    return jsonify({"success": True, "data": FALLBACK})


@app.route('/translate', methods=['POST'])
def translate_chat():
    data  = request.json or {}
    texts = data.get('texts', [])
    lang  = data.get('language', 'en')
    return jsonify({
        "success": True,
        "translations": [translate_text(t, lang) for t in texts]
    })


@app.route('/translate-json', methods=['POST'])
def translate_json_route():
    data     = request.json or {}
    payload  = data.get('payload', [])
    language = data.get('language', 'en')

    if language == 'en':
        return jsonify({"success": True, "translated": payload})

    try:
        from deep_translator import GoogleTranslator
        unique_strings = set()

        def extract(obj):
            if isinstance(obj, dict):
                for v in obj.values(): extract(v)
            elif isinstance(obj, list):
                for v in obj: extract(v)
            elif isinstance(obj, str) and len(obj) > 1 and not obj.startswith('http'):
                unique_strings.add(obj)

        extract(payload)
        tmap = {}
        for s in unique_strings:
            try:
                tmap[s] = GoogleTranslator(source='auto', target=language).translate(s)
            except Exception:
                tmap[s] = s

        def rebuild(obj):
            if isinstance(obj, dict):   return {k: rebuild(v) for k, v in obj.items()}
            elif isinstance(obj, list): return [rebuild(i) for i in obj]
            elif isinstance(obj, str):  return tmap.get(obj, obj)
            return obj

        return jsonify({"success": True, "translated": rebuild(payload)})
    except Exception as e:
        return jsonify({"success": True, "translated": payload, "error": str(e)})


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Kisan AI Shield v2.1 starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
