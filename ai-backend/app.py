import os

# ── Offline/Mirror flags must be set before any HuggingFace imports ──
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

import re
import json as json_mod
import tempfile
import uuid
import requests
from dotenv import load_dotenv

# Load .env from the repo root (one level up from ai-backend/)
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_pipeline import pipeline

app = Flask(__name__)
CORS(app)  # Allow React Native / Expo / Web to access this API

# ─────────────────────────────────────────────────────────────────────────────
# /health  — Liveness check (used by Render health checks + frontend gateway)
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "version": "2.0",
        "llm": "configured" if pipeline.llm_engine.is_configured else "unconfigured",
        "vision": "local_model" if pipeline.vision_engine.model_loaded else "cloud_fallback",
        "translation": "enabled" if pipeline.language_engine.is_configured else "pass-through",
    })


# ─────────────────────────────────────────────────────────────────────────────
# /predict  — Crop Disease Vision Scan
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image provided in form-data"}), 400

    file = request.files['image']
    image_bytes = file.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        return jsonify({"success": False, "error": "Image too large. Maximum 10MB."}), 413

    language = request.form.get('language', 'en')
    result = pipeline.process_plant_image(image_bytes, language=language)
    return jsonify(result)


# ─────────────────────────────────────────────────────────────────────────────
# /chat  — AI Agricultural Advisor (text)
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"success": False, "error": "No text provided in request body"}), 400

    text = data.get('text')
    language = data.get('language', 'en')
    lat = data.get('lat')
    lon = data.get('lon')

    result = pipeline.process_advisory_chat(text, language, lat, lon)
    return jsonify(result)


# ─────────────────────────────────────────────────────────────────────────────
# /voice-chat  — Voice-to-AI pipeline
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/voice-chat', methods=['POST'])
def voice_chat():
    if 'audio' not in request.files:
        return jsonify({"success": False, "error": "No audio file provided in form-data"}), 400

    audio_file = request.files['audio']
    language = request.form.get('language', 'en-IN')
    lat = request.form.get('lat')
    lon = request.form.get('lon')

    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, f"kisan_voice_{uuid.uuid4().hex}.wav")

    try:
        audio_file.save(temp_path)
        result = pipeline.process_voice_chat(temp_path, language=language, lat=lat, lon=lon)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# ─────────────────────────────────────────────────────────────────────────────
# /schemes  — Government Scheme Eligibility (LLM-powered)
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/schemes', methods=['POST'])
def schemes():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "No farmer profile provided"}), 400

    name = data.get('name', 'Farmer')
    state = data.get('state', 'India')
    land_acres = data.get('land_acres', 'Unknown')
    crop = data.get('crop', 'General')
    category = data.get('category', 'General')
    irrigation = data.get('irrigation', 'Unknown')
    language = data.get('language', 'en')

    lang_map = {'te': 'Telugu', 'hi': 'Hindi', 'en': 'English'}
    target_lang_name = lang_map.get(language, 'English')

    prompt = (
        f"You are an expert Indian agriculture policy advisor. "
        f"A farmer named {name} from {state} owns {land_acres} acres of land, "
        f"grows {crop}, belongs to the {category} category, "
        f"and uses {irrigation} irrigation.\n\n"
        f"List the TOP 5 most relevant Indian government agricultural schemes "
        f"this farmer is eligible for as of 2026. "
        f"For EACH scheme, respond in this EXACT JSON array format and nothing else:\n"
        f'[{{"name":"...","ministry":"...","benefit":"...","amount":"...","desc":"..."}}]\n\n'
        f"All JSON string values MUST be translated natively into {target_lang_name} language. "
        f"Only return the JSON array. No markdown, no explanation."
    )

    try:
        llm_response = pipeline.llm_engine.generate_advice(prompt)
        match = re.search(r'\[.*\]', llm_response, re.DOTALL)
        if match:
            schemes_list = json_mod.loads(match.group(0))
        else:
            schemes_list = [{
                "name": "Could not parse schemes",
                "ministry": "",
                "benefit": "",
                "amount": "",
                "desc": llm_response
            }]
        return jsonify({"success": True, "schemes": schemes_list})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# /weather  — Proxied OpenWeatherMap (avoids CORS issues on mobile)
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/weather', methods=['GET'])
def get_weather():
    lat = request.args.get('lat', '17.2473')
    lon = request.args.get('lon', '80.1514')
    api_key = os.getenv('EXPO_PUBLIC_WEATHER_KEY')

    if not api_key:
        return jsonify({"success": False, "error": "EXPO_PUBLIC_WEATHER_KEY missing"}), 500

    try:
        current_res = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}&lon={lon}&appid={api_key}&units=metric",
            timeout=10
        ).json()

        forecast_res = requests.get(
            f"https://api.openweathermap.org/data/2.5/forecast"
            f"?lat={lat}&lon={lon}&appid={api_key}&units=metric",
            timeout=10
        ).json()

        if current_res.get('cod') not in (200, '200'):
            return jsonify({"success": False, "error": current_res.get('message', 'Unknown error')}), 400

        return jsonify({"success": True, "current": current_res, "forecast": forecast_res})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# /translate-json  — Bulk JSON translation (market prices, schemes cards)
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/translate-json', methods=['POST'])
def translate_json():
    data = request.json or {}
    payload = data.get('payload', [])
    language = data.get('language', 'en')

    if language == 'en':
        return jsonify({"success": True, "translated": payload})

    try:
        import copy

        unique_strings = set()

        def extract_strings(obj):
            if isinstance(obj, dict):
                for v in obj.values():
                    extract_strings(v)
            elif isinstance(obj, list):
                for v in obj:
                    extract_strings(v)
            elif isinstance(obj, str):
                if len(obj) > 1 and not obj.startswith('http') and not obj.isnumeric():
                    unique_strings.add(obj)

        extract_strings(payload)

        translation_map = {}
        for text in unique_strings:
            try:
                translation_map[text] = pipeline.language_engine.translate_direct(text, target_lang=language)
            except Exception:
                translation_map[text] = text

        def rebuild(obj):
            if isinstance(obj, dict):
                return {k: rebuild(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [rebuild(item) for item in obj]
            elif isinstance(obj, str):
                return translation_map.get(obj, obj)
            else:
                return obj

        translated_payload = rebuild(payload)
        return jsonify({"success": True, "translated": translated_payload})

    except Exception as e:
        print(f"[TranslateJSON] Error: {e}")
        return jsonify({"success": True, "translated": payload, "error": str(e)})


# ─────────────────────────────────────────────────────────────────────────────
# /mandi-prices  — AI-generated mandi prices (LLM fallback for market data)
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/mandi-prices', methods=['POST'])
def mandi_prices():
    data = request.json or {}
    mandi = data.get('mandi', 'Khammam')
    language = data.get('language', 'en')

    fallback = {
        "signal": {
            "crop": "Chilli",
            "emoji": "🫑",
            "title": f"Sell Signal - Chilli ({mandi})",
            "desc": "Prices trending up this week. Good time to sell."
        },
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
        f"List 8 crop prices for {mandi} mandi in India. Language: {language}. "
        f"Return ONLY valid JSON: "
        f'{{"signal":{{"crop":"...","emoji":"...","title":"...","desc":"..."}},'
        f'"prices":[{{"emoji":"...","name":"...","price":"₹...","change":"+X%","up":true}}]}}'
    )

    try:
        llm_response = pipeline.llm_engine.generate_advice(prompt)
        match = re.search(r'\{.*\}', llm_response, re.DOTALL)
        if match:
            res_json = json_mod.loads(match.group(0))
            return jsonify({"success": True, "data": res_json})
    except Exception as e:
        print(f"[MandiPrices] LLM failed, using fallback: {e}")

    # Translate fallback if needed
    if language != 'en':
        try:
            fallback["signal"]["title"] = pipeline.language_engine.translate_direct(
                fallback["signal"]["title"], target_lang=language
            )
            fallback["signal"]["desc"] = pipeline.language_engine.translate_direct(
                fallback["signal"]["desc"], target_lang=language
            )
            for item in fallback["prices"]:
                item["name"] = pipeline.language_engine.translate_direct(item["name"], target_lang=language)
        except Exception as trans_e:
            print(f"[MandiPrices] Fallback translation failed: {trans_e}")

    return jsonify({"success": True, "data": fallback})


# ─────────────────────────────────────────────────────────────────────────────
# /translate  — Translate chat history array (language toggle)
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/translate', methods=['POST'])
def translate_chat():
    data = request.json
    if not data or 'texts' not in data:
        return jsonify({"success": False, "error": "Missing 'texts' array"}), 400

    texts = data.get('texts', [])
    target_lang = data.get('language', 'en')

    result = pipeline.translate_history(texts, target_lang)
    return jsonify(result)


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Kisan AI Shield Server starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
