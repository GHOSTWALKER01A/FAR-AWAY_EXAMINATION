import hashlib
import hmac
import os
import time

from fastapi import Header, HTTPException, Request

SECRET = os.environ.get("INTERNAL_SERVICE_SECRET", "").encode()


async def verify_service_signature(
    request: Request,
    x_signature: str = Header(...),
    x_timestamp: str = Header(...),
):
    """Verify HMAC signature and reject stale requests (replay protection)."""
    if abs(time.time() - int(x_timestamp)) > 300:
        raise HTTPException(status_code=401, detail="Stale request — timestamp too old")

    body = await request.body()
    expected = hmac.new(SECRET, x_timestamp.encode() + b"." + body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected, x_signature):
        raise HTTPException(status_code=401, detail="Invalid service signature")
