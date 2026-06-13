"""Ensemble rubric-conditioned LLM grader with confidence scoring."""
import os
import statistics
from .llm import grade_once

MODEL = os.getenv("GRADING_MODEL", "claude-opus-4-8")
N = int(os.getenv("GRADING_ENSEMBLE_SIZE", "3"))


def grade_subjective(stem: str, rubric: dict, max_marks: float, answer: any, ensemble: bool = True) -> dict:
    """
    Grade a subjective answer against an analytic rubric.
    - Blank / whitespace → 0 without any LLM call.
    - Ensemble (N runs) → median awarded, confidence = (1 − spread) × min self-confidence.
    - All calls fail → awarded=0, confidence=0.0 → surfaces in human review queue.
    """
    answer_text = answer.get("text", "") if isinstance(answer, dict) else str(answer or "")
    if not answer_text.strip():
        return {"awarded": 0.0, "criteria": [], "confidence": 1.0, "model": MODEL}

    n_runs = N if ensemble else 1
    runs = []
    for _ in range(n_runs):
        try:
            result = grade_once(MODEL, stem, rubric, answer_text, max_marks)
            # Clamp to max marks
            result["total_awarded"] = min(float(result["total_awarded"]), max_marks)
            runs.append(result)
        except Exception:
            continue

    if not runs:
        # Complete failure — return 0 with 0 confidence → mandatory human review
        return {"awarded": 0.0, "criteria": [], "confidence": 0.0, "model": MODEL}

    totals = [r["total_awarded"] for r in runs]
    awarded = round(statistics.median(totals), 2)

    # Confidence = (1 − inter-judge spread) × minimum self-confidence across runs
    spread = (max(totals) - min(totals)) / max_marks if max_marks > 0 else 0.0
    min_self = min(float(r.get("confidence", 1.0)) for r in runs)
    confidence = round(max(0.0, min(1.0, (1.0 - spread) * min_self)), 3)

    return {
        "awarded": awarded,
        "criteria": runs[0].get("criteria", []),
        "confidence": confidence,
        "model": MODEL,
    }
