import json
import os
import re
from datetime import datetime
from typing import Any

try:
    from openai import OpenAI
except Exception:
    OpenAI = None


def _round_to_quarter(hours: float) -> float:
    return max(0.25, round(hours * 4) / 4)




def estimate_task_hours(task_info: dict[str, Any]) -> float:
    """
    Estimate task duration in hours. Uses OpenAI for estimation 
    """
    if OpenAI is None or not os.getenv("OPENAI_API_KEY"):
        return None

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    prompt = (
        "Estimate realistic hours for this student task. "
        "Use title, description, deadline proximity, priority, and current estimate if present. "
        "Return JSON only in the format {\"estimated_hours\": number}. "
        "Round to quarter-hour increments (0.25). "
        f"Task: {json.dumps(task_info, ensure_ascii=True)}"
    )

    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a precise academic workload estimator."},
                {"role": "user", "content": prompt},
            ],
        )
        content = response.choices[0].message.content or "{}"
        parsed = json.loads(content)
        value = float(parsed.get("estimated_hours"))
        if value <= 0:
            raise ValueError("Estimated hours must be positive.")
        return _round_to_quarter(min(value, 24))
    except Exception:
        try:
            content = response.choices[0].message.content or ""
            match = re.search(r"(\d+(?:\.\d+)?)", content)
            if match:
                value = float(match.group(1))
                return _round_to_quarter(min(value, 24))
        except Exception:
            pass
        return None
