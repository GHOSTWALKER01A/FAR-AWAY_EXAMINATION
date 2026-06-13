"""
2PL / 3PL Item Response Theory — probability, information, MLE theta estimation, CAT selection.
"""
import math
import random
from typing import Optional


def p_correct(theta: float, a: float, b: float, c: float = 0.0) -> float:
    """3PL probability of correct response. Degenerates to 2PL when c=0, Rasch when a=1,c=0."""
    a = a or 1.0
    return c + (1.0 - c) / (1.0 + math.exp(-a * (theta - b)))


def item_information(theta: float, a: float, b: float, c: float = 0.0) -> float:
    """Fisher information of an item at a given theta level."""
    a = a or 1.0
    p = p_correct(theta, a, b, c)
    p = min(max(p, 1e-8), 1.0 - 1e-8)
    # 3PL information formula
    return (a ** 2) * ((p - c) ** 2 / (1.0 - c) ** 2) * ((1.0 - p) / p)


def estimate_theta_mle(
    responses: list[dict],
    lo: float = -4.0,
    hi: float = 4.0,
) -> tuple[float, float]:
    """
    Newton-Raphson MLE estimation of theta.
    responses: [{a, b, c, correct(bool)}]
    Returns (theta_hat, standard_error).
    Falls back to boundary clamping on all-correct / all-wrong to avoid divergence.
    """
    if not responses:
        return 0.0, 99.0

    corrects = [r["correct"] for r in responses]

    # Degenerate cases — MLE is undefined, clamp toward sensible bounds
    if all(corrects):
        theta_hat = hi * 0.85
        info = sum(item_information(theta_hat, r.get("a") or 1.0, r["b"], r.get("c", 0.0)) for r in responses)
        return theta_hat, (1.0 / math.sqrt(info) if info > 0 else 1.0)
    if not any(corrects):
        theta_hat = lo * 0.85
        info = sum(item_information(theta_hat, r.get("a") or 1.0, r["b"], r.get("c", 0.0)) for r in responses)
        return theta_hat, (1.0 / math.sqrt(info) if info > 0 else 1.0)

    theta = 0.0
    for _ in range(50):   # Newton-Raphson iterations
        first_deriv = 0.0
        second_deriv = 0.0
        for r in responses:
            a = r.get("a") or 1.0
            b = r["b"]
            c = r.get("c", 0.0)
            p = p_correct(theta, a, b, c)
            p = min(max(p, 1e-8), 1.0 - 1e-8)
            u = 1.0 if r["correct"] else 0.0
            first_deriv += a * (u - p)
            second_deriv -= (a ** 2) * p * (1.0 - p)

        if abs(second_deriv) < 1e-10:
            break
        step = first_deriv / second_deriv
        theta -= step
        theta = max(lo, min(hi, theta))
        if abs(step) < 1e-5:
            break

    total_info = sum(item_information(theta, r.get("a") or 1.0, r["b"], r.get("c", 0.0)) for r in responses)
    se = 1.0 / math.sqrt(total_info) if total_info > 1e-8 else 99.0
    return round(theta, 4), round(se, 4)


def select_next_item(
    theta: float,
    candidates: list[dict],
    top_n: int = 5,
) -> Optional[dict]:
    """
    Maximum-information selection with randomesque exposure control.
    Randomly samples from the top-N most informative items to prevent item over-exposure / leakage.
    candidates: [{id, a, b, c, ...}]
    """
    if not candidates:
        return None
    ranked = sorted(
        candidates,
        key=lambda it: item_information(theta, it.get("a") or 1.0, it["b"], it.get("c", 0.0)),
        reverse=True,
    )
    pool = ranked[: min(top_n, len(ranked))]
    return random.choice(pool)


def should_stop(se: float, n_items: int, config: dict) -> bool:
    """CAT stopping rule: precision reached OR item count limits hit."""
    se_target = config.get("seTarget", 0.3)
    min_items = config.get("minItems", 8)
    max_items = config.get("maxItems", 30)
    return n_items >= max_items or (n_items >= min_items and se <= se_target)
