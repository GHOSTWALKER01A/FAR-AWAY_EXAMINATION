from fastapi import APIRouter
from ..schemas import EmbedReq, EmbedResp

router = APIRouter()


@router.post("/embed", response_model=EmbedResp)
def embed(req: EmbedReq):
    """
    Generate a text embedding for semantic dedup / plagiarism detection.
    In production: use sentence-transformers or Anthropic embedding API.
    Stub returns a zero vector — wire up the real model before using in dedup.
    """
    dim = 1024
    # TODO: replace with: model.encode(req.text).tolist()
    embedding = [0.0] * dim
    return EmbedResp(embedding=embedding, dim=dim)
