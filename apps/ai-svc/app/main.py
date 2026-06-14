from fastapi import FastAPI, Depends
from .security import verify_service_signature
from .routers import adaptive, grading, generation, embeddings

app = FastAPI(title="Exami AI Intelligence Service", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-svc"}


# All routers protected by HMAC service auth
app.include_router(adaptive.router, prefix="/adaptive", tags=["adaptive"],
                   dependencies=[Depends(verify_service_signature)])
app.include_router(grading.router, prefix="/grading", tags=["grading"],
                   dependencies=[Depends(verify_service_signature)])
app.include_router(generation.router, prefix="/generation", tags=["generation"],
                   dependencies=[Depends(verify_service_signature)])
app.include_router(embeddings.router, prefix="/embeddings", tags=["embeddings"],
                   dependencies=[Depends(verify_service_signature)])
