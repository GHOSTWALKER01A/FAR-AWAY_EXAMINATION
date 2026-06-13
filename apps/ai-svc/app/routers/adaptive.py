from fastapi import APIRouter
from ..schemas import SelectReq, SelectResp, ThetaUpdateReq, ThetaUpdateResp
from ..services import irt

router = APIRouter()


@router.post("/select", response_model=SelectResp)
def select_item(req: SelectReq):
    """Return next adaptive item or stop signal."""
    if irt.should_stop(req.se, len(req.administered), req.config):
        return SelectResp(stop=True, theta=req.theta, se=req.se)

    top_n = req.config.get("exposureTopN", 5)
    pick = irt.select_next_item(req.theta, [c.model_dump() for c in req.candidates], top_n=top_n)

    if pick is None:   # Bank exhausted → stop gracefully
        return SelectResp(stop=True, theta=req.theta, se=req.se)

    return SelectResp(stop=False, question_id=pick["id"], theta=req.theta, se=req.se)


@router.post("/theta", response_model=ThetaUpdateResp)
def update_theta(req: ThetaUpdateReq):
    """Re-estimate theta after a new response."""
    theta, se = irt.estimate_theta_mle([r.model_dump() for r in req.administered])
    return ThetaUpdateResp(theta=theta, se=se)
