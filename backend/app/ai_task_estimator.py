import json
import os
import re
from datetime import datetime, timezone
from typing import Any

try:
    from openai import OpenAI
except Exception:
    OpenAI = None


# Cache estimates by task signature so re-estimation is stable unless task fields change.
_ESTIMATE_CACHE: dict[str, float] = {}


# Rounds hour estimates to 0.5 hour increments and enforces a minimum floor.
def _round_to_half_hour(hours: float) -> float:
    return max(0.5, round(hours * 2) / 2)


# Normalizes priority values into the supported 1-5 range.
def _normalize_priority(priority_value: Any) -> int:
    try:
        priority = int(priority_value)
    except (TypeError, ValueError):
        priority = 2
    return max(1, min(5, priority))


def _task_signature(task_info: dict[str, Any]) -> str:
    """
    Build a stable signature for cache lookups.
    Excludes estimated_hours so repeated re-estimates stay stable.
    """
    canonical = {
        "task_type": str(task_info.get("task_type") or "assignment").strip().lower(),
        "title": str(task_info.get("title") or "").strip().lower(),
        "description": str(task_info.get("description") or "").strip().lower(),
        "deadline": str(task_info.get("deadline") or "").strip(),
        "priority": _normalize_priority(task_info.get("priority")),
    }
    return json.dumps(canonical, sort_keys=True, ensure_ascii=True)


def _parse_deadline(deadline_value: Any) -> datetime | None:
    """Parse deadline from various formats."""
    if isinstance(deadline_value, datetime):
        return deadline_value
    if isinstance(deadline_value, str):
        try:
            iso_str = deadline_value.replace("Z", "+00:00")
            return datetime.fromisoformat(iso_str)
        except (ValueError, AttributeError):
            return None
    return None


def _compute_hours_until_deadline(deadline_value: Any) -> float | None:
    """
    Compute hours from now until deadline.
    Returns positive if deadline is in future, negative if overdue.
    """
    deadline = _parse_deadline(deadline_value)
    if not deadline:
        return None
    
    now = datetime.now(timezone.utc) if deadline.tzinfo else datetime.now()
    delta = deadline - now
    return delta.total_seconds() / 3600.0


def _is_overdue(deadline_value: Any) -> bool:
    """Check if task is overdue."""
    hours_until = _compute_hours_until_deadline(deadline_value)
    return hours_until is not None and hours_until < 0


def _word_count(text: str | None) -> int:
    """Count words in text."""
    if not text:
        return 0
    return len(text.split())


# Combines title and description into normalized text for keyword scanning.
def _normalize_task_text(task_info: dict[str, Any]) -> str:
    title = str(task_info.get("title") or "")
    description = str(task_info.get("description") or "")
    return f"{title} {description}".strip().lower()


# Checks whether any phrase in a set appears in the provided text.
def _contains_any(text: str, phrases: set[str]) -> bool:
    return any(phrase in text for phrase in phrases)


def _keyword_multiplier(task_info: dict[str, Any]) -> tuple[float, list[str]]:
    """Return a multiplier and matched keyword signals for the task text."""
    text = _normalize_task_text(task_info)
    task_type = (task_info.get("task_type") or "assignment").lower()

    matched: list[str] = []
    multiplier = 1.0

    heavy_academic_terms = {
        "final",
        "cumulative",
        "comprehensive",
        "midterm",
        "capstone",
        "research",
        "thesis",
        "dissertation",
        "prototype",
        "implementation",
        "programming",
        "coding",
        "analysis",
        "report",
        "presentation",
        "paper",
    }
    light_work_terms = {
        "homework",
        "hw",
        "worksheet",
        "practice",
        "exercise",
        "quiz",
        "reading response",
        "discussion",
        "reflection",
        "short answer",
        "basic",
        "intro",
    }
    exam_terms = {
        "exam",
        "test",
        "quiz",
        "midterm",
        "final",
        "cumulative",
        "comprehensive",
        "take-home",
        "proctored",
        "oral",
        "essay",
        "review",
    }
    project_terms = {
        "project",
        "capstone",
        "research",
        "report",
        "presentation",
        "proposal",
        "prototype",
        "implementation",
        "design",
        "build",
        "develop",
        "programming",
        "coding",
    }
    strong_project_terms = {
        "capstone",
        "research",
        "prototype",
        "implementation",
        "design",
        "develop",
        "programming",
        "coding",
    }
    light_project_terms = {
        "project",
        "report",
        "presentation",
        "proposal",
        "build",
    }

    if task_type == "exam":
        if _contains_any(text, exam_terms):
            matched.extend(sorted(term for term in exam_terms if term in text))
            multiplier *= 1.35 if _contains_any(text, {"final", "cumulative", "comprehensive", "midterm"}) else 1.15
        if _contains_any(text, light_work_terms):
            matched.extend(sorted(term for term in light_work_terms if term in text))
            multiplier *= 0.85
    elif task_type == "project":
        if _contains_any(text, project_terms):
            matched.extend(sorted(term for term in project_terms if term in text))
            if _contains_any(text, strong_project_terms):
                multiplier *= 1.22
            elif _contains_any(text, light_project_terms):
                multiplier *= 1.08
        if _contains_any(text, {"small", "mini", "short", "simple"}):
            matched.extend([term for term in ["small", "mini", "short", "simple"] if term in text])
            multiplier *= 0.9
    else:
        if _contains_any(text, heavy_academic_terms):
            matched.extend(sorted(term for term in heavy_academic_terms if term in text))
            multiplier *= 1.25
        if _contains_any(text, light_work_terms):
            matched.extend(sorted(term for term in light_work_terms if term in text))
            multiplier *= 0.8

    # Generic hints that apply across task types.
    if _contains_any(text, {"final", "cumulative", "comprehensive"}):
        matched.extend([term for term in ["final", "cumulative", "comprehensive"] if term in text])
        multiplier *= 1.15

    if _contains_any(text, {"draft", "revise", "revision", "proofread"}):
        matched.extend([term for term in ["draft", "revise", "revision", "proofread"] if term in text])
        multiplier *= 0.9

    return multiplier, sorted(set(matched))


def _get_type_bounds(task_type: str | None, priority: int) -> tuple[float, float]:
    """
    Return (min_hours, max_hours) based on task type and priority.
    """
    task_type_lower = (task_type or "assignment").lower()

    if task_type_lower == "exam":
        base_min, base_max = (1.0, 14.0)
    elif task_type_lower == "project":
        base_min, base_max = (2.0, 24.0)
    else:  # assignment
        base_min, base_max = (0.5, 8.0)

    priority = _normalize_priority(priority)
    min_add_by_priority = {
        1: 0.0,
        2: 0.0,
        3: 0.5,
        4: 1.0,
        5: 1.5,
    }
    max_mult_by_priority = {
        1: 0.75,
        2: 0.9,
        3: 1.0,
        4: 1.15,
        5: 1.3,
    }

    # Keep project scaling gentler so high priorities do not spike too aggressively.
    if task_type_lower == "project":
        min_add_by_priority = {
            1: 0.0,
            2: 0.0,
            3: 0.1,
            4: 0.5,
            5: 0.75,
        }
        max_mult_by_priority = {
            1: 0.8,
            2: 0.9,
            3: 0.93,
            4: 1.08,
            5: 1.16,
        }

    min_hours = base_min + min_add_by_priority[priority]
    max_hours = min(24.0, base_max * max_mult_by_priority[priority])

    if min_hours > max_hours - 0.5:
        min_hours = max(0.5, max_hours - 0.5)

    return (min_hours, max_hours)


def _estimate_with_heuristic(task_info: dict[str, Any]) -> float:
    """
    Fallback heuristic when LLM is unavailable.
    Uses priority, deadline urgency, and description length.
    """
    priority = _normalize_priority(task_info.get("priority", 2))
    task_type = task_info.get("task_type", "assignment")
    description = task_info.get("description", "")
    deadline = task_info.get("deadline")
    
    hours_until = _compute_hours_until_deadline(deadline)
    word_count = _word_count(description)
    min_hours, max_hours = _get_type_bounds(task_type, priority)
    
    # Base estimate on priority
    if (task_type or "").lower() == "project":
        # Gentler slope for projects at high priorities.
        base_estimate = {
            1: min_hours,
            2: min_hours + 0.5,
            3: min_hours + (max_hours - min_hours) * 0.25,
            4: min_hours + (max_hours - min_hours) * 0.72,
            5: min_hours + (max_hours - min_hours) * 0.82,
        }.get(priority, min_hours + 1.0)
    else:
        base_estimate = {
            1: min_hours,           # Very Low -> minimum
            2: min_hours + 0.5,     # Low -> slightly above min
            3: (min_hours + max_hours) / 2,  # Medium -> midpoint
            4: max_hours - 1.5,     # High -> near max
            5: max_hours,           # Critical -> maximum
        }.get(priority, min_hours + 1.0)
    
    # Adjust based on description complexity (word count)
    if word_count > 100:
        base_estimate *= 1.3
    elif word_count > 50:
        base_estimate *= 1.15

    # Adjust for keywords in the title/description that signal scope or complexity.
    keyword_multiplier, _ = _keyword_multiplier(task_info)
    base_estimate *= keyword_multiplier
    
    # Urgency boost: if due soon or overdue, increase estimate
    if hours_until is not None and hours_until < 24:
        if hours_until < 0:  # Overdue
            base_estimate *= 1.2
        else:  # Due within 24 hours
            base_estimate *= 1.15
    
    # Clamp to type bounds
    estimate = max(min_hours, min(base_estimate, max_hours))
    return _round_to_half_hour(estimate)


def _apply_guardrails(
    llm_estimate: float,
    task_info: dict[str, Any],
    current_estimate: float | None
) -> float:
    """
    Apply guardrails to LLM estimate:
    - Enforce task type/priority min/max bounds
    - Round to half-hour increments accepted by scheduling
    """
    task_type = task_info.get("task_type", "assignment")
    priority = _normalize_priority(task_info.get("priority", 2))
    min_hours, max_hours = _get_type_bounds(task_type, priority)
    
    # Clamp to type bounds
    clamped = max(min_hours, min(llm_estimate, max_hours))
    
    return _round_to_half_hour(clamped)


def estimate_task_hours(task_info: dict[str, Any]) -> float:
    """
    Estimate task duration in hours.
    
    Logic:
    1. Compute explicit numeric features (hours_until_deadline, word_count, is_overdue)
    2. Try LLM estimation with enriched prompt
    3. Apply guardrails (type bounds, reject extreme jumps)
    4. Fall back to heuristic if LLM unavailable or fails
    """
    signature = _task_signature(task_info)
    cached = _ESTIMATE_CACHE.get(signature)
    if cached is not None:
        return cached

    # Enrich task_info with computed features
    hours_until = _compute_hours_until_deadline(task_info.get("deadline"))
    is_overdue = _is_overdue(task_info.get("deadline"))
    word_count = _word_count(task_info.get("description"))
    keyword_multiplier, matched_keywords = _keyword_multiplier(task_info)
    
    enriched_info = {
        **task_info,
        "hours_until_deadline": hours_until,
        "is_overdue": is_overdue,
        "description_word_count": word_count,
        "keyword_multiplier": keyword_multiplier,
        "matched_keywords": matched_keywords,
    }
    
    current_estimate = float(task_info.get("estimated_hours") or 0)
    
    # Try LLM estimation
    if OpenAI and os.getenv("OPENAI_API_KEY"):
        try:
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            prompt = (
                "Estimate realistic hours for this student task. "
                "Use task type (assignment, exam, project), title, description, "
                "hours_until_deadline, is_overdue, description_word_count, keyword_multiplier, "
                "matched_keywords, priority, "
                "and current estimate if present. "
                "Pay attention to keywords that suggest low-effort homework, exams, or larger projects. "
                "Consider urgency and complexity. "
                "Return JSON only in format {\"estimated_hours\": number}. "
                "Round to half-hour increments (0.5). "
                f"Task: {json.dumps(enriched_info, ensure_ascii=True, default=str)}"
            )
            
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
            
            # Cap at 24 hours and apply guardrails
            llm_estimate = min(value, 24)
            final_estimate = _apply_guardrails(llm_estimate, task_info, current_estimate if current_estimate > 0 else None)
            _ESTIMATE_CACHE[signature] = final_estimate
            return final_estimate
        
        except Exception:
            # Try regex fallback as last resort
            try:
                match = re.search(r"(\d+(?:\.\d+)?)", str(response.choices[0].message.content or ""))
                if match:
                    value = float(match.group(1))
                    llm_estimate = min(value, 24)
                    final_estimate = _apply_guardrails(llm_estimate, task_info, current_estimate if current_estimate > 0 else None)
                    _ESTIMATE_CACHE[signature] = final_estimate
                    return final_estimate
            except Exception:
                pass
    
    # Fall back to heuristic
    final_estimate = _estimate_with_heuristic(task_info)
    _ESTIMATE_CACHE[signature] = final_estimate
    return final_estimate
