import io
import re
from typing import Optional

from pypdf import PdfReader

COURSE_CODE_RE = re.compile(r"\b([A-Z]{2,6})\s?-?\s?(\d{3,4}[A-Z]?)\b", re.IGNORECASE)
COURSE_CODE_TITLE_RE = re.compile(
    r"\b([A-Z]{2,6})\s?-?\s?(\d{3,4}[A-Z]?)\b\s*[-–:]\s*(.+)",
    re.IGNORECASE,
)
COURSE_CODE_TITLE_FALLBACK_RE = re.compile(
    r"^\s*([A-Z]{2,6})\s?-?\s?(\d{3,4}[A-Z]?)\s+(.+)$",
    re.IGNORECASE,
)


def extract_text_from_pdf_bytes(data: bytes) -> str:
    """Extract text from PDF bytes."""
    reader = PdfReader(io.BytesIO(data))
    pages_text = []
    for page in reader.pages:
        pages_text.append(page.extract_text() or "")
    return "\n".join(pages_text)


def _normalize_course_code(value: str) -> str:
    """Normalize course code formatting."""
    value = value.replace("-", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip().upper()


def _clean_course_name(value: str) -> str:
    """Clean course name by removing noise."""
    # Remove department prefix at the start (generalized for any department)
    cleaned = re.sub(r"^\s*\w+\s+\w+\s+department\s+", "", value, flags=re.IGNORECASE)
    cleaned = re.sub(r"^\s*department\s+of\s+", "", cleaned, flags=re.IGNORECASE)
    
    # Remove common keywords
    cleaned = re.sub(r"\bsyllabus\b|\bcourse\b|\bsection\b|\bterm\b|\bsemester\b|\bdepartment\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b(?:spring|summer|fall|winter|draft|week|page|chapters?)\b", "", cleaned, flags=re.IGNORECASE)
    # Remove 2-digit numbers (like year codes) but keep 3+ digits
    cleaned = re.sub(r"\b\d{2}\b", "", cleaned, flags=re.IGNORECASE)
    
    # Truncate at common section breaks
    for section_break in ["instructor:", "email:", "office", "class times:", "prerequisites:", "textbook:", "schedule:"]:
        if section_break in cleaned.lower():
            cleaned = cleaned[:cleaned.lower().index(section_break)]
    
    # Limit to max 150 characters for course name
    if len(cleaned) > 150:
        # Try to cut at first period
        period_idx = cleaned.find(".")
        if period_idx > 20:  # Only if we have reasonable text before period
            cleaned = cleaned[:period_idx]
        else:
            cleaned = cleaned[:150]
    
    cleaned = cleaned.strip(" -:\t")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _extract_professor_name(value: str) -> Optional[str]:
    """Extract and clean professor name from a line."""
    # Remove email addresses
    name_part = re.sub(r"\s*\(.*?@.*?\)", "", value)
    name_part = re.sub(r"\s+[\w\.-]+@[\w\.-]+\.\w+", "", name_part)
    
    # Remove bullet points and common prefixes
    name_part = re.sub(r"^[•\-*]\s*", "", name_part)
    
    # Split by common delimiters to get just the name
    parts = re.split(r"[;/,]\s*(?:phone|email|office|ext|extension|room|office hours)", name_part, flags=re.IGNORECASE)
    name_part = parts[0].strip()
    
    # Remove leading labels (Instructor:, Professor:, etc.)
    name_part = re.sub(r"^\s*(instructor|professor|faculty|dr\.?|prof\.?)\s*:?\s*", "", name_part, flags=re.IGNORECASE)
    
    # Remove trailing course codes if appended to name
    name_part = re.sub(r"\s+[A-Z]{2,6}\s+\d{3,4}.*$", "", name_part, flags=re.IGNORECASE)
    
    # Split by common delimiters if multiple names
    parts = re.split(r"[;/]", name_part)
    name_part = parts[0].strip()
    
    # Clean up whitespace
    name_part = re.sub(r"\s+", " ", name_part).strip()
    
    # Only return if it looks like a name
    if name_part and len(name_part) > 2 and len(name_part) < 100:
        return name_part
    
    return None


def _is_valid_professor_line(line: str) -> bool:
    """Check if a line is likely to contain a professor name based on title keywords."""
    line_lower = line.lower()
    
    # Check for professor/instructor title keywords that indicate actual contact info
    title_patterns = [
        r"^\s*(dr\.?|prof\.?|professor|instructor|faculty member)\s+[a-z]",  # Title at start
        r"(instructor|professor|faculty)\s*:\s*",  # Label with colon (check next line too)
        r"(taught by|instructor|professor)\s+[a-z]",  # Explicit phrase
        r"faculty\s+(contact|information)",  # Faculty section header
    ]
    
    for pattern in title_patterns:
        if re.search(pattern, line_lower):
            return True
    return False


def _extract_meeting_times(lines: list[str]) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """Extract course meeting days and times from syllabus lines.
    Returns: (course_date as space-separated days, start_time, end_time)
    """
    days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_abbreviations = {
        "Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday", 
        "Thu": "Thursday", "Fri": "Friday", "Sat": "Saturday", "Sun": "Sunday",
        "M": "Monday", "T": "Tuesday", "W": "Wednesday", 
        "R": "Thursday", "F": "Friday", "S": "Saturday", "U": "Sunday"
    }
    
    # Keywords to skip (not class times)
    skip_keywords = [
        "office", "office hours", "hours", "availability", "appointment",
        "ta hours", "ta office", "gta", "teaching assistant", "grading",
        "zoom", "online office", "virtual office", "help"
    ]
    
    course_date = None
    start_time = None
    end_time = None
    
    # First pass: look for lines with strong class time indicators
    class_time_keywords = [
        "class time", "class times", "meeting time", "meeting times",
        "lecture", "lectures", "meets", "session times"
    ]
    
    # Search in first 60 lines for meeting info
    for idx, line in enumerate(lines[:60]):
        line_lower = line.lower()
        
        # Skip lines that are clearly not class times
        if any(skip_keyword in line_lower for skip_keyword in skip_keywords):
            continue
        
        # Look for lines with class time keywords or meeting info
        has_class_keyword = any(keyword in line_lower for keyword in class_time_keywords)
        has_day_reference = any(day.lower() in line_lower for day in days_of_week)
        has_time_reference = re.search(r'\d{1,2}:?\d{2}\s*(?:am|pm|a\.m\.|p\.m\.)', line_lower)
        
        # Only process if it has class-related keyword or both days and times
        if has_class_keyword or (has_day_reference and has_time_reference):
            
            # Try to extract time range first
            # Pattern: HH:MM-HH:MM or HH-HH or HH:MM am-pm - HH:MM am-pm, etc.
            time_patterns = [
                r'(\d{1,2}):(\d{2})\s*(?:am|pm|a\.m\.|p\.m\.)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(?:am|pm|a\.m\.|p\.m\.)?',
                r'(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})',
                r'(\d{1,2})\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(?:am|pm)',
            ]
            
            times_found = False
            for pattern in time_patterns:
                time_match = re.search(pattern, line, re.IGNORECASE)
                if time_match:
                    groups = time_match.groups()
                    if len(groups) >= 4:
                        start_hour = groups[0]
                        start_min = groups[1] if len(groups[0]) <= 2 else "00"
                        end_hour = groups[2]
                        end_min = groups[3]
                        
                        # Detect am/pm from line context
                        meridiem = "am"
                        if "pm" in line_lower or "p.m" in line_lower:
                            meridiem = "pm"
                        
                        start_time = f"{start_hour}:{start_min} {meridiem}"
                        end_time = f"{end_hour}:{end_min} {meridiem}"
                        times_found = True
                    break
            
            # Extract days - try multiple approaches
            found_days = []
            
            # First try: full day names
            for day in days_of_week:
                if day.lower() in line_lower:
                    found_days.append(day)
            
            # Second try: 3-letter abbreviations (Tue, Thu, Mon, etc.)
            if not found_days:
                abbrev_3 = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                for abbr in abbrev_3:
                    if abbr.lower() in line_lower:
                        found_days.append(day_abbreviations.get(abbr, abbr))
            
            # Third try: single letter with context (M, T, W, R, F)
            if not found_days:
                # More specific single letter detection
                for char in ["M", "T", "W", "R", "F"]:
                    # Use word boundaries to avoid false matches
                    if re.search(rf'\b{char}\b', line):
                        if char in day_abbreviations:
                            day = day_abbreviations[char]
                            if day not in found_days:
                                found_days.append(day)
            
            # Fourth try: slash/comma separated days (Tue/Thu, T/Th, etc.)
            if not found_days:
                day_sep_pattern = r'(Mon|Tue|Wed|Thu|Fri|Sat|Sun|M|T|W|R|F)(?:/|,|\s+and\s+)(Mon|Tue|Wed|Thu|Fri|Sat|Sun|M|T|W|R|F)'
                day_match = re.findall(day_sep_pattern, line, re.IGNORECASE)
                if day_match:
                    for abbr1, abbr2 in day_match:
                        day1 = day_abbreviations.get(abbr1, None) or day_abbreviations.get(abbr1.lower(), abbr1)
                        day2 = day_abbreviations.get(abbr2, None) or day_abbreviations.get(abbr2.lower(), abbr2)
                        if day1 not in found_days:
                            found_days.append(day1)
                        if day2 not in found_days:
                            found_days.append(day2)
            
            if found_days:
                course_date = " ".join(found_days)
            
            # If we found either days or times, we can return
            if course_date or start_time or end_time:
                return course_date, start_time, end_time
            
            # Also check the next line if current line has keyword but no times/days
            if idx < len(lines) - 1:
                next_line = lines[idx + 1].lower()
                
                # Skip next line if it's office hours
                if any(skip_keyword in next_line for skip_keyword in skip_keywords):
                    continue
                
                # Check next line for times if not found in current line
                if not start_time:
                    for pattern in time_patterns:
                        time_match = re.search(pattern, next_line, re.IGNORECASE)
                        if time_match:
                            groups = time_match.groups()
                            if len(groups) >= 4:
                                start_hour = groups[0]
                                start_min = groups[1]
                                end_hour = groups[2]
                                end_min = groups[3]
                                meridiem = "pm" if "pm" in next_line else "am"
                                start_time = f"{start_hour}:{start_min} {meridiem}"
                                end_time = f"{end_hour}:{end_min} {meridiem}"
                            break
                
                # Check next line for days if not found in current line
                if not course_date:
                    for day in days_of_week:
                        if day.lower() in next_line:
                            if day not in found_days:
                                found_days.append(day)
                    
                    if found_days:
                        course_date = " ".join(found_days)
                
                if course_date or start_time or end_time:
                    return course_date, start_time, end_time
    
    return None, None, None


def _extract_course_info(lines: list[str]) -> dict:
    """Extract course code, name, professor, description, meeting times, and days from PDF text lines."""
    course_code = None
    course_name = None
    professor = None
    description = None
    course_date = None  # Days (e.g., "Monday Wednesday Friday")
    start_time = None
    end_time = None

    candidate_lines = lines[:120]

    def extract_code_from_line(line: str) -> Optional[str]:
        match = COURSE_CODE_RE.search(line)
        if not match:
            return None
        dept = match.group(1).upper()
        number = match.group(2).upper()
        return _normalize_course_code(f"{dept} {number}")

    def extract_code_and_name_from_line(line: str) -> tuple[Optional[str], Optional[str]]:
        match = COURSE_CODE_TITLE_RE.search(line)
        if match:
            code = _normalize_course_code(f"{match.group(1).upper()} {match.group(2).upper()}")
            name = _clean_course_name(match.group(3))
            return code, name or None

        match = COURSE_CODE_TITLE_FALLBACK_RE.search(line)
        if match:
            code = _normalize_course_code(f"{match.group(1).upper()} {match.group(2).upper()}")
            name = _clean_course_name(match.group(3))
            return code, name or None

        return None, None

    # Extract meeting times and days early so we have them available
    extracted_course_date, extracted_start_time, extracted_end_time = _extract_meeting_times(candidate_lines)
    if extracted_course_date:
        course_date = extracted_course_date
    if extracted_start_time:
        start_time = extracted_start_time
    if extracted_end_time:
        end_time = extracted_end_time

    # Check first line for code and name
    if len(candidate_lines) > 0:
        first_line = candidate_lines[0]
        
        # Try to extract professor from first line if it contains instructor/professor label
        if not professor and re.search(r"instructor:|professor:", first_line, re.IGNORECASE):
            prof_match = re.search(r"(?:instructor|professor):\s*([^(e].*?)(?=\s+e-?mail|\s+office|$)", first_line, re.IGNORECASE)
            if prof_match:
                prof_candidate = _extract_professor_name(prof_match.group(1))
                if prof_candidate:
                    professor = prof_candidate
        
        detected_code, detected_name = extract_code_and_name_from_line(first_line)
        if detected_code:
            course_code = detected_code
        if detected_name:
            course_name = detected_name
        if course_code and course_name:
            # Look for professor and description in remaining lines
            for idx, line in enumerate(candidate_lines[1:], 1):
                if not professor and re.search(r"\b(instructor|professor|faculty)\b", line, re.IGNORECASE):
                    if _is_valid_professor_line(line):
                        parts = re.split(r":", line, maxsplit=1)
                        if len(parts) == 2:
                            prof_candidate = _extract_professor_name(parts[1])
                            if prof_candidate:
                                professor = prof_candidate
                        else:
                            prof_candidate = _extract_professor_name(line)
                            if prof_candidate:
                                professor = prof_candidate
                        
                        # If not found on same line, check next line
                        if not professor and idx < len(candidate_lines) - 1:
                            next_line = candidate_lines[idx + 1].strip()
                            if next_line and not re.search(r"\b(email|phone|office|location)\b", next_line, re.IGNORECASE):
                                prof_candidate = _extract_professor_name(next_line)
                                if prof_candidate:
                                    professor = prof_candidate

                if not description and re.search(r"\b(course\s*description|description|overview|about)\b", line, re.IGNORECASE):
                    parts = re.split(r":", line, maxsplit=1)
                    if len(parts) == 2:
                        desc_candidate = parts[1].strip()
                        if desc_candidate and len(desc_candidate) > 10:
                            description = desc_candidate[:200]

            return {
                "name": course_name,
                "code": course_code,
                "professor": professor,
                "description": description,
                "courseDate": course_date,
                "startTime": start_time,
                "endTime": end_time,
            }

    # Look for professor and description
    for idx, line in enumerate(candidate_lines):
        if not professor and re.search(r"\b(instructor|professor|faculty)\b", line, re.IGNORECASE):
            if _is_valid_professor_line(line):
                parts = re.split(r":", line, maxsplit=1)
                if len(parts) == 2:
                    prof_candidate = _extract_professor_name(parts[1])
                    if prof_candidate:
                        professor = prof_candidate
                else:
                    # Handle professor name line without colon delimiter
                    prof_candidate = _extract_professor_name(line)
                    if prof_candidate:
                        professor = prof_candidate
                
                # If not found on same line, check next line
                if not professor and idx < len(candidate_lines) - 1:
                    next_line = candidate_lines[idx + 1].strip()
                    # Skip if next line is contact info
                    if next_line and not re.search(r"\b(email|phone|office|location|hours)\b", next_line, re.IGNORECASE):
                        prof_candidate = _extract_professor_name(next_line)
                        if prof_candidate:
                            professor = prof_candidate

        if not description and re.search(r"\b(course\s*description|description|overview|about)\b", line, re.IGNORECASE):
            parts = re.split(r":", line, maxsplit=1)
            if len(parts) == 2:
                desc_candidate = parts[1].strip()
                if desc_candidate and len(desc_candidate) > 10:
                    description = desc_candidate[:200]

        if not course_code:
            detected_code = extract_code_from_line(line)
            if detected_code:
                course_code = detected_code

        if not course_name:
            detected_code = extract_code_from_line(line)
            if detected_code:
                remainder = line.replace(detected_code, "").strip()
                name_candidate = _clean_course_name(remainder)
                if name_candidate and not re.fullmatch(r"syllabus", name_candidate, re.IGNORECASE):
                    course_name = name_candidate

        if course_code and course_name and professor and description:
            break

    if not course_name:
        course_name = "Course from Syllabus"
    if not course_code:
        course_code = "COURSE-000"

    return {
        "name": course_name,
        "code": course_code,
        "professor": professor,
        "description": description,
        "courseDate": course_date,
        "startTime": start_time,
        "endTime": end_time,
    }


def parse_syllabus_text(text: str) -> dict:
    """Parse syllabus text and extract course information."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    course = _extract_course_info(lines)

    return {
        "name": course["name"],
        "code": course["code"],
        "professor": course["professor"],
        "description": course["description"],
        "courseDate": course.get("courseDate"),
        "startTime": course.get("startTime"),
        "endTime": course.get("endTime"),
    }
