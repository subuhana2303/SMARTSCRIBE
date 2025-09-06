from deep_translator import GoogleTranslator
from typing import Dict

class TranslationService:
    def __init__(self):
        self.supported_languages = {
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese (Simplified)',
            'ar': 'Arabic',
            'hi': 'Hindi'
        }
    
    async def translate_text(self, text: str, target_language: str) -> str:
        """Translate text to target language."""
        try:
            if target_language == 'en':
                return text
            
            translator = GoogleTranslator(source='en', target=target_language)
            translated = translator.translate(text)
            return translated
            
        except Exception as e:
            raise Exception(f"Translation failed: {str(e)}")
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported languages."""
        return self.supported_languages
    
    async def detect_language(self, text: str) -> str:
        """Detect language of text."""
        try:
            from deep_translator import single_detection
            detected = single_detection(text, api_key=None)
            return detected
        except Exception:
            return 'en'  # Default to English
