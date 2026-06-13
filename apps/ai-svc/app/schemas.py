from pydantic import BaseModel, Field
from typing import Any, Optional


# ── Adaptive ──────────────────────────────────────────────────────────────────

class ItemParam(BaseModel):
    id: str
    a: Optional[float] = 1.0
    b: float
    c: float = 0.0
    topic: list[str] = []
    difficulty: Optional[str] = None


class SelectReq(BaseModel):
    theta: float = 0.0
    se: float = 99.0
    administered: list[str] = []
    candidates: list[ItemParam]
    config: dict = {}


class SelectResp(BaseModel):
    stop: bool
    question_id: Optional[str] = None
    theta: float
    se: float


class AdminItem(BaseModel):
    a: Optional[float] = 1.0
    b: float
    c: float = 0.0
    correct: bool


class ThetaUpdateReq(BaseModel):
    theta: float = 0.0
    administered: list[AdminItem]


class ThetaUpdateResp(BaseModel):
    theta: float
    se: float


# ── Grading ───────────────────────────────────────────────────────────────────

class GradeReq(BaseModel):
    question_stem: str
    rubric: dict
    max_marks: float
    student_answer: Any
    ensemble: bool = True


class GradeResp(BaseModel):
    awarded: float
    criteria: list[dict]
    confidence: float
    model: str


# ── Generation ────────────────────────────────────────────────────────────────

class GenerateReq(BaseModel):
    topic: str
    count: int = Field(default=5, ge=1, le=20)
    difficulty: str = "MEDIUM"
    type: str = "MCQ"
    language: str = "English"


class GenerateResp(BaseModel):
    drafts: list[dict]


# ── Embeddings ────────────────────────────────────────────────────────────────

class EmbedReq(BaseModel):
    text: str


class EmbedResp(BaseModel):
    embedding: list[float]
    dim: int
