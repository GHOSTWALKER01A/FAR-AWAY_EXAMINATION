from fastapi import APIRouter
from ..schemas import GradeReq, GradeResp
from ..services.grader import grade_subjective

router = APIRouter()


@router.post("/subjective", response_model=GradeResp)
def grade(req: GradeReq):
    """
    Ensemble rubric-conditioned subjective grading.
    - Blank answer → 0 without LLM call.
    - Low confidence → surfaces in human review queue in Nest.
    - Prompt injection in answer is neutralised by system prompt framing.
    """
    result = grade_subjective(
        stem=req.question_stem,
        rubric=req.rubric,
        max_marks=req.max_marks,
        answer=req.student_answer,
        ensemble=req.ensemble,
    )
    return GradeResp(**result)
