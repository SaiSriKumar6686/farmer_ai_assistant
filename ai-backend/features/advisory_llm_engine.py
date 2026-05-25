import os
import requests


class AdvisoryLLM:
    '''
    Production-ready Reasoning Engine.
    3-Tier Fallback: Groq (instant) → Google Gemini (accurate) → OpenRouter (emergency)
    Injects real-time weather context for hyper-accurate location-aware answers.
    Works even when Flask backend is cold-starting on Render.com.
    '''

    SYSTEM_INSTRUCTION = (
        "You are an expert Indian Agronomist AI. Provide actionable, concise, "
        "and accurate farming advice. Do not output markdown, as it will be spoken via TTS."
    )

    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY") or os.environ.get("AI_API_KEY")
        self.is_configured = False

        if self.api_key:
            self.model_name = "stepfun/step-3.5-flash:free"
            self.is_configured = True
            print(f"[LLMEngine] Successfully initialized OpenRouter context ({self.model_name}).")
        else:
            print("[LLMEngine] WARNING: No OPENROUTER_API_KEY or AI_API_KEY found. Engine disabled.")

    def fetch_weather_context(self, lat, lon):
        '''Internal tool call: Fetch live weather to inject into the prompt for context-aware advice.'''
        weather_key = os.environ.get("OPENWEATHER_API_KEY") or os.environ.get("EXPO_PUBLIC_WEATHER_KEY", "")
        if not weather_key:
            return "No live weather available."

        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={weather_key}&units=metric"
        try:
            res = requests.get(url, timeout=5)
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
        '''
        High-Performance Multi-Tier Reasoning Engine.
        Tiers: 1. Groq (Instant), 2. Google Gemini (Native), 3. OpenRouter (Fallback)
        '''
        if not self.is_configured:
            return "Apologies, the AI reasoning engine is currently unconfigured. Please check API keys."

        context_string = ""
        if lat and lon:
            w_context = self.fetch_weather_context(lat, lon)
            context_string = f"[Location Weather: {w_context}]\n"

        prompt = f"{context_string}Farmer asks: {english_query}\nReply clearly as an expert Indian Agronomist AI."

        # ── TIER 1: GROQ (Sub-second High Speed) ──────────────────────
        groq_key = os.environ.get("GROQ_API_KEY")
        if groq_key:
            try:
                print(f"[LLMEngine] Attempting Tier 1 (Groq - Llama 3.3)...")
                res = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": self.SYSTEM_INSTRUCTION},
                            {"role": "user", "content": prompt}
                        ]
                    },
                    headers={"Authorization": f"Bearer {groq_key.strip()}"},
                    timeout=10
                )
                if res.status_code == 200:
                    text = res.json()['choices'][0]['message']['content']
                    print("[LLMEngine] SUCCESS: Groq")
                    return str(text).replace('*', '').strip()
                else:
                    print(f"[LLMEngine] Groq Failed (HTTP {res.status_code}): {res.text[:200]}")
            except Exception as e:
                print(f"[LLMEngine] Groq Exception: {str(e)}")

        # ── TIER 2: GOOGLE GEMINI (Highest Accuracy) ──────────────────
        gemini_key = os.environ.get("EXPO_PUBLIC_GEMINI_API_KEY") or (
            self.api_key if self.api_key and self.api_key.startswith("AIza") else None
        )
        if gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key.strip())
                for m_name in ["gemini-1.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"]:
                    try:
                        print(f"[LLMEngine] Attempting Tier 2 ({m_name})...")
                        model = genai.GenerativeModel(m_name, system_instruction=self.SYSTEM_INSTRUCTION)
                        response = model.generate_content(prompt)
                        if response.text:
                            print(f"[LLMEngine] SUCCESS: Gemini ({m_name})")
                            return str(response.text).replace('*', '').strip()
                    except Exception as ge:
                        print(f"[LLMEngine] {m_name} failed: {str(ge)}")
                        continue
            except Exception as e:
                print(f"[LLMEngine] Gemini Base Exception: {str(e)}")

        # ── TIER 3: OPENROUTER (Emergency Fallback) ───────────────────
        # Only use OpenRouter key if it's a proper OR key (not a Gemini AIza key)
        or_key = os.environ.get("OPENROUTER_API_KEY") or (
            self.api_key if self.api_key and not self.api_key.startswith("AIza") else None
        )
        if or_key:
            try:
                print("[LLMEngine] Attempting Tier 3 (OpenRouter Fallback)...")
                res = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    json={
                        "model": "google/gemini-2.0-flash-exp:free",
                        "messages": [
                            {"role": "system", "content": self.SYSTEM_INSTRUCTION},
                            {"role": "user", "content": prompt}
                        ]
                    },
                    headers={"Authorization": f"Bearer {or_key.strip()}"},
                    timeout=15
                )
                if res.status_code == 200:
                    text = res.json()['choices'][0]['message']['content']
                    print("[LLMEngine] SUCCESS: OpenRouter")
                    return str(text).replace('*', '').strip()
                else:
                    print(f"[LLMEngine] OpenRouter Failed (HTTP {res.status_code}): {res.text[:200]}")
            except Exception as e:
                print(f"[LLMEngine] OpenRouter Exception: {str(e)}")

        return "AI advisor is currently taking a break. Please check your data connection and try again."
