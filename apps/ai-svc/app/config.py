import os


class Settings:
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    internal_service_secret: str = os.getenv("INTERNAL_SERVICE_SECRET", "")
    grading_model: str = os.getenv("GRADING_MODEL", "claude-opus-4-8")
    triage_model: str = os.getenv("TRIAGE_MODEL", "claude-haiku-4-5-20251001")
    generation_model: str = os.getenv("GENERATION_MODEL", "claude-opus-4-8")
    grading_ensemble_size: int = int(os.getenv("GRADING_ENSEMBLE_SIZE", "3"))


settings = Settings()
