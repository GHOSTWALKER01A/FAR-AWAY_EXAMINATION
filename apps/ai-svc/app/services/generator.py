"""AI question draft generation. All output must pass through human review before saving."""
import os
from .llm import generate_questions

MODEL = os.getenv("GENERATION_MODEL", "claude-opus-4-8")


def draft_questions(topic: str, count: int, difficulty: str, qtype: str, language: str) -> list[dict]:
    questions = generate_questions(MODEL, topic, count, difficulty, qtype, language)
    # Tag every draft with AI provenance — Nest will enforce human review before saving
    for q in questions:
        q["provenance"] = "AI"
        q["calibration_status"] = "UNCALIBRATED"
    return questions
