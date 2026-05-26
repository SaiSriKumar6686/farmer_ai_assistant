import os
import requests


class AdvisoryLLM:
    '''
    Production-ready Reasoning Engine.
    3-Tier Fallback: Groq (instant) → Google Gemini (accurate) → OpenRouter (emergency)
    is_configured = True as long as ANY of the 3 API keys exist.
    '''

    SYSTEM_INSTRUCTION = (
        "You are an expert Indian Agronomist AI. Provide actionable, concise, "
        "and accurate farming advice. Do not output markdown, as it will be spoken via TTS."
    )

    def __init__(self):
        self.groq_key   = os.environ.get("GROQ_API_KEY", "").strip()
        self.gemini_key = os.environ.get("EXPO_PUBLIC_GEMINI_API_KEY", "").strip()
        self.or_key     = os.environ.get("OPENROUTER_API_KEY", "").strip()

        # is_configured = True if ANY key exists
        self.is_configured = bool(self.groq_key or self.gemini_key or self.or_key)

        if self.is_configured:
            keys = []
            if self.groq_key:   keys.append("Groq")
            if self.gemini_key: keys.append("Gemini")
            if self.or_key:     keys.append("OpenRouter")
            print(f"[LLMEngine] Initialized with keys: {', '.join(keys)}")
        else:
            print("[LLMEngine] WARNING: No AI API keys found. Set GROQ_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY.")

    def fetch_weather_context(self, lat, lon):
        weather_key = os.environ.get("EXPO_PUBLIC_WEATHER_KEY", "")
        if not weather_key or not lat or not lon:
            return "No live weather available."
        try:
            res = requests.get(
                f"https://api.openweathermap.org/data/2.5/weather"
                f"?lat={lat}&lon={lon}&appid={weather_key}&units=metric",
                timeout=5
            )
            if res.status_code == 200:
                d = res.json()
                return (
                    f"Currently {d['weather'][0]['description']}, "
                    f"{d['main']['temp']}°C, {d['main']['humidity']}% humidity."
                )
        except Exception:
            pass
        return "Weather service unreachable."

    def generate_advice(self, english_query, lat=None, lon=None):
        if not self.is_configured:
            return "AI advisor is temporarily unavailable. Please set API keys."

        context_string = ""
        if lat and lon:
            w_context = self.fetch_weather_context(lat, lon)
            context_string = f"[Location Weather: {w_context}]\n"

        prompt = f"{context_string}Farmer asks: {english_query}\nReply clearly as an expert Indian Agronomist AI."

        # ── TIER 1: GROQ ──────────────────────────────────────────────
        if self.groq_key:
            try:
                print("[LLMEngine] Attempting Tier 1 (Groq - Llama 3.3)...")
                res = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": self.SYSTEM_INSTRUCTION},
                            {"role": "user",   "content": prompt}
                        ]
                    },
                    headers={"Authorization": f"Bearer {self.groq_key}"},
                    timeout=10
                )
                if res.status_code == 200:
                    text = res.json()['choices'][0]['message']['content']
                    print("[LLMEngine] SUCCESS: Groq")
                    return str(text).replace('*', '').strip()
                print(f"[LLMEngine] Groq HTTP {res.status_code}: {res.text[:200]}")
            except Exception as e:
                print(f"[LLMEngine] Groq Exception: {e}")

        # ── TIER 2: GOOGLE GEMINI ─────────────────────────────────────
        if self.gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_key)
                for m_name in ["gemini-1.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"]:
                    try:
                        print(f"[LLMEngine] Attempting Tier 2 ({m_name})...")
                        model = genai.GenerativeModel(m_name, system_instruction=self.SYSTEM_INSTRUCTION)
                        response = model.generate_content(prompt)
                        if response.text:
                            print(f"[LLMEngine] SUCCESS: Gemini ({m_name})")
                            return str(response.text).replace('*', '').strip()
                    except Exception as ge:
                        print(f"[LLMEngine] {m_name} failed: {ge}")
            except Exception as e:
                print(f"[LLMEngine] Gemini import error: {e}")

        # ── TIER 3: OPENROUTER ────────────────────────────────────────
        if self.or_key:
            try:
                print("[LLMEngine] Attempting Tier 3 (OpenRouter)...")
                res = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    json={
                        "model": "google/gemini-2.0-flash-exp:free",
                        "messages": [
                            {"role": "system", "content": self.SYSTEM_INSTRUCTION},
                            {"role": "user",   "content": prompt}
                        ]
                    },
                    headers={"Authorization": f"Bearer {self.or_key}"},
                    timeout=15
                )
                if res.status_code == 200:
                    text = res.json()['choices'][0]['message']['content']
                    print("[LLMEngine] SUCCESS: OpenRouter")
                    return str(text).replace('*', '').strip()
                print(f"[LLMEngine] OpenRouter HTTP {res.status_code}: {res.text[:200]}")
            except Exception as e:
                print(f"[LLMEngine] OpenRouter Exception: {e}")

        return "AI advisor is currently taking a break. Please check your data connection and try again."
