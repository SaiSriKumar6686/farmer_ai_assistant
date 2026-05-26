import os
from features.disease_vision_engine import DiseaseVisionModel
from features.advisory_llm_engine import AdvisoryLLM
from features.speech_language_engine import SpeechLanguageEngine

# NOTE: speech_to_text is imported lazily (inside the method) because
# it requires SpeechRecognition + pydub + ffmpeg which are unavailable
# on Render free tier. Lazy import prevents a crash at server startup.


class KisanAIPipeline:
    '''
    THE MASTER INTEGRATION POINT
    All perception, reasoning, and communication logic in one place.
    Import-safe: no heavy dependencies loaded at module level.
    '''

    def __init__(self):
        print("[AIPipeline] Initializing core AI engines...")

        # Vision model (uses Gemini Vision as cloud fallback when no local weights)
        model_path = os.environ.get("VISION_MODEL_PATH", None)
        self.vision_engine = DiseaseVisionModel(model_path=model_path)

        # LLM (Groq → Gemini → OpenRouter)
        self.llm_engine = AdvisoryLLM()

        # Translation
        self.language_engine = SpeechLanguageEngine()

        print("[AIPipeline] All engines ready.")

    # ── /predict ──────────────────────────────────────────────────────────────
    def process_plant_image(self, image_file_bytes, language='en'):
        try:
            result = self.vision_engine.predict(image_file_bytes)
            if result.get("success") and language != 'en':
                result["diagnosis"]       = self.language_engine.translate_to_regional(result["diagnosis"],       target_lang=language)
                result["visual_severity"] = self.language_engine.translate_to_regional(result["visual_severity"], target_lang=language)
                result["recommendation"]  = self.language_engine.translate_to_regional(result["recommendation"],  target_lang=language)
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── /chat ─────────────────────────────────────────────────────────────────
    def process_advisory_chat(self, raw_user_text, language='en', lat=None, lon=None):
        try:
            print("[AIPipeline] Chat request received.")
            english_query    = self.language_engine.translate_to_english(raw_user_text, source_lang=language)
            english_response = self.llm_engine.generate_advice(english_query, lat=lat, lon=lon)
            localized        = self.language_engine.translate_to_regional(english_response, target_lang=language)
            return {"success": True, "input_language": language, "response": localized}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── /voice-chat ───────────────────────────────────────────────────────────
    def process_voice_chat(self, audio_file_path, language='en-IN', lat=None, lon=None):
        '''
        Voice-to-AI. speech_to_text imported lazily so it doesn't crash
        Render startup when ffmpeg/pyaudio are unavailable.
        '''
        print("[AIPipeline] Processing voice input...")
        try:
            from features.speech_to_text import transcribe_audio_file  # lazy import
            transcription_result = transcribe_audio_file(audio_file_path, language=language)
        except ImportError:
            return {"success": False, "error": "Voice transcription not available on this server."}

        if "error" in transcription_result:
            return {"success": False, "error": transcription_result["error"]}

        transcribed_text = transcription_result["text"]
        print(f"[AIPipeline] Transcribed: '{transcribed_text}'")

        chat_result = self.process_advisory_chat(transcribed_text, language=language, lat=lat, lon=lon)
        if chat_result.get("success"):
            chat_result["transcribed_query"] = transcribed_text
        return chat_result

    # ── /translate ────────────────────────────────────────────────────────────
    def translate_history(self, texts, target_lang='en'):
        try:
            return {
                "success": True,
                "translations": [self.language_engine.translate_direct(t, target_lang) for t in texts]
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


# Module-level singleton — created once when gunicorn imports this module
pipeline = KisanAIPipeline()
