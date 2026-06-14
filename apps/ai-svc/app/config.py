import os


class Settings:
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    internal_service_secret: str = os.getenv("INTERNAL_SERVICE_SECRET", "")
    grading_model: str = os.getenv("GRADING_MODEL", "gemini-2.5-pro")
    triage_model: str = os.getenv("TRIAGE_MODEL", "gemini-2.5-flash")
    generation_model: str = os.getenv("GENERATION_MODEL", "gemini-2.5-pro")
    grading_ensemble_size: int = int(os.getenv("GRADING_ENSEMBLE_SIZE", "3"))


settings = Settings()
