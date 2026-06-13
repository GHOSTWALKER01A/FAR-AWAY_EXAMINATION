from fastapi import APIRouter
from ..schemas import GenerateReq, GenerateResp
from ..services.generator import draft_questions

router = APIRouter()


@router.post("", response_model=GenerateResp)
def generate(req: GenerateReq):
    """
    Draft AI questions for examiner review.
    All drafts are tagged AI provenance — they MUST go through human review before saving.
    """
    drafts = draft_questions(req.topic, req.count, req.difficulty, req.type, req.language)
    return GenerateResp(drafts=drafts)
