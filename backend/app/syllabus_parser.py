import io
import re
import os
import json
from typing import Optional
from pypdf import PdfReader


def _get_genai_module():
    """Lazily import Gemini SDK so parser can run even if optional deps are unavailable."""
    try:
        import google.generativeai as genai  # type: ignore
        return genai
    except Exception as e:
        print(f"Gemini SDK unavailable: {str(e)}")
        return None

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
    
    # Remove office information and location
    name_part = re.sub(r"\s+(?:Office|office|OFFICE):\s*[^\n]*", "", name_part)
    name_part = re.sub(r"\s+(?:Location|location|LOCATION):\s*[^\n]*", "", name_part)
    name_part = re.sub(r"\s+(?:Remote|remote|REMOTE)", "", name_part)
    
    # Remove bullet points and common prefixes
    name_part = re.sub(r"^[•\-*]\s*", "", name_part)
    
    # Split by common delimiters to get just the name
    parts = re.split(r"[;/,]\s*(?:phone|email|office|ext|extension|room|office hours|by appointment)", name_part, flags=re.IGNORECASE)
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
    
    # Only return if it looks like a name (typically 2-3 words, no numbers)
    if name_part and len(name_part) > 2 and len(name_part) < 100 and not re.search(r"\d{4,}", name_part):
        return name_part
    
    return None


def _extract_course_code_from_parens(line: str) -> Optional[str]:
    """Extract course code from parenthetical format like (CS-101) or (CS 101)."""
    # Look for patterns like (CS-101), (CS 101), (MATH-201), etc.
    paren_match = re.search(r'\(([A-Z]{2,6})\s?-?\s?(\d{3,4}[A-Z]?)\)', line, re.IGNORECASE)
    if paren_match:
        dept = paren_match.group(1).upper()
        number = paren_match.group(2).upper()
        return _normalize_course_code(f"{dept} {number}")
    return None


def _analyze_syllabus_with_gemini(course_code: str, course_name: str, full_syllabus_text: str) -> dict:
    """Use Gemini to analyze syllabus and extract course info comprehensively."""
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {}

        genai = _get_genai_module()
        if genai is None:
            return {}
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-pro")
        
        prompt = f"""Analyze this course syllabus and extract the following information in JSON format:
{{
    "description": "1-2 sentence overview of what the course covers (max 200 chars)",
    "courseGoals": "Key learning objectives and goals (1-2 sentences, max 200 chars)",
    "meetingDays": "Days of the week the course meets (e.g., 'Monday Wednesday Friday' or 'MWF' or null if online)",
    "meetingTime": "Time range when course meets (e.g., '9:00 AM - 10:30 AM' or null if online)",
    "isOnline": "true/false - whether course is fully online or asynchronous",
    "keyTopics": "Main topics covered (comma-separated list, max 200 chars)"
}}

Course Code: {course_code}
Course Name: {course_name}

SYLLABUS TEXT:
{full_syllabus_text[:3000]}

Return ONLY valid JSON, no other text."""
        
        response = model.generate_content(prompt)
        if response and response.text:
            try:
                # Extract JSON from response
                text = response.text.strip()
                # Handle markdown code blocks if present
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]
                    text = text.strip()
                
                result = json.loads(text)
                return result
            except json.JSONDecodeError:
                print(f"Failed to parse JSON from Gemini response: {response.text}")
                return {}
    except Exception as e:
        print(f"Gemini API error: {str(e)}")
    
    return {}


def _generate_description_with_gemini(course_code: str, course_name: str, syllabus_excerpt: str) -> Optional[str]:
    """Generate a course description using Google Gemini API."""
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None

        genai = _get_genai_module()
        if genai is None:
            return None
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-pro")
        
        prompt = f"""Based on the following course information from a syllabus, generate a concise course description (1-2 sentences, max 150 characters):

Course Code: {course_code}
Course Name: {course_name}
Syllabus Excerpt: {syllabus_excerpt[:500]}

Generate only the description, no additional text."""
        
        response = model.generate_content(prompt)
        if response and response.text:
            description = response.text.strip()
            # Ensure it's not too long
            if len(description) > 200:
                description = description[:197] + "..."
            return description
    except Exception as e:
        # Silently fail - if Gemini API fails, parsing should still work
        print(f"Gemini API error: {str(e)}")
    
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


def _extract_lab_times(lines: list[str]) -> tuple[bool, Optional[str], Optional[str], Optional[str]]:
    """Extract lab meeting day and times from syllabus lines.
    Returns: (has_lab, lab_day, lab_start_time, lab_end_time)
    """
    days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_abbreviations = {
        "Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday", 
        "Thu": "Thursday", "Fri": "Friday", "Sat": "Saturday", "Sun": "Sunday",
        "M": "Monday", "T": "Tuesday", "W": "Wednesday", 
        "R": "Thursday", "F": "Friday", "S": "Saturday", "U": "Sunday"
    }
    
    has_lab = False
    lab_day = None
    lab_start_time = None
    lab_end_time = None
    
    # Keywords indicating EXPLICIT lab/recitation sessions
    # Be specific about what constitutes a "lab" - must have actual session marker
    lab_session_keywords = [
        "lab - ", "lab:", "lab", "laboratory",
        "lab session", "lab meeting", "lab section", "laboratory session",
        "recitation", "recitation meeting", "recitation session",
        "practical session", "hands-on session", "discussion", "discussion section"
    ]
    
    # Search first 80 lines for lab info
    for idx, line in enumerate(lines[:80]):
        line_lower = line.lower()
        
        # Step 1: Check for EXPLICIT lab/recitation keywords
        has_explicit_lab_keyword = any(keyword in line_lower for keyword in lab_session_keywords)
        
        if not has_explicit_lab_keyword:
            continue
        
        # Step 2: If we have an explicit lab keyword, look for day and times in the SAME line
        # Extract times first
        time_patterns = [
            r'(\d{1,2}):(\d{2})\s*(?:am|pm|a\.m\.|p\.m\.)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(?:am|pm|a\.m\.|p\.m\.)?',
            r'(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})',
        ]
        
        time_match = None
        for pattern in time_patterns:
            time_match = re.search(pattern, line, re.IGNORECASE)
            if time_match:
                break
        
        # Only continue if we found times on this line
        if not time_match:
            continue
        
        groups = time_match.groups()
        if len(groups) >= 4:
            start_hour = groups[0]
            start_min = groups[1]
            end_hour = groups[2]
            end_min = groups[3]
            
            # Detect am/pm from line context
            meridiem = "am"
            if "pm" in line_lower or "p.m" in line_lower:
                meridiem = "pm"
            
            lab_start_time = f"{start_hour}:{start_min} {meridiem}"
            lab_end_time = f"{end_hour}:{end_min} {meridiem}"
        
        # Step 3: Look for day of week on same line
        for day in days_of_week:
            if day.lower() in line_lower:
                lab_day = day
                break
        
        # Try 3-letter abbreviations
        if not lab_day:
            abbrev_3 = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            for abbr in abbrev_3:
                if re.search(rf"\b{abbr}\b", line, re.IGNORECASE):
                    lab_day = day_abbreviations.get(abbr, abbr)
                    break
        
        # Try 1-letter abbreviations (R=Thursday, etc.)
        if not lab_day:
            for abbr, full_day in day_abbreviations.items():
                if len(abbr) == 1 and re.search(rf"\b{abbr}\b", line):
                    lab_day = full_day
                    break
        
        # Only mark has_lab=True if we found BOTH day AND times on this line
        if lab_day and lab_start_time and lab_end_time:
            has_lab = True
            break
    
    return has_lab, lab_day, lab_start_time, lab_end_time


def _detect_online_course(lines: list[str]) -> tuple[bool, bool]:
    """Detect if course is fully online/asynchronous or hybrid.
    Returns: (is_course_online, is_lab_online)
    
    Detects: "asynchronous", "fully online", "completely online", "online only",
    "hybrid" (implies some online component), "on-line lecture", "web-based course", "distance education"
    Ignores negations like "not online" or "not on-line"
    """
    # Strong indicators of online/async course format
    online_keywords = [
        "asynchronous", "fully online", "completely online", "online only",
        "web-based course", "distance education", "distance course",
        "hybrid", "on-line lecture", "online lecture"
    ]
    
    is_course_online = False
    is_lab_online = False
    
    # Search first 80 lines for course format detection
    for line in lines[:80]:
        line_lower = line.lower()
        
        # Skip lines with negation (NOT online)
        if re.search(r'\bnot\s+(?:an\s+)?on[-]?line\b', line_lower):
            continue
        if re.search(r'\bnot\s+(?:an\s+)?online\b', line_lower):
            continue
        
        # Check for online indicators
        for keyword in online_keywords:
            if keyword in line_lower:
                # Check if it mentions lab in same line (might mean lab is online)
                if "lab" in line_lower or "laboratory" in line_lower:
                    is_lab_online = True
                else:
                    is_course_online = True
                return is_course_online, is_lab_online
    
    return is_course_online, is_lab_online


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
    
    # First pass: look for explicit "Meeting Days:" and "Meeting Time:" labels
    for idx, line in enumerate(lines[:60]):
        line_lower = line.lower()
        
        # Look for explicit meeting day label
        if "meeting day" in line_lower and ":" in line:
            parts = line.split(":", 1)
            if len(parts) == 2:
                day_str = parts[1].strip()
                found_days = []
                
                # Extract full day names first (to avoid issues with abbreviations)
                for full_day in days_of_week:
                    if re.search(rf'\b{full_day}\b', day_str, re.IGNORECASE):
                        found_days.append(full_day)
                
                # Also check for 3-letter abbreviations with word boundaries
                if not found_days or len(found_days) < 2:  # If not all days found yet
                    for abbr in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
                        if re.search(rf'\b{abbr}\b', day_str, re.IGNORECASE):
                            full_day = day_abbreviations.get(abbr, abbr)
                            if full_day not in found_days:
                                found_days.append(full_day)
                
                if found_days:
                    course_date = " ".join(found_days)
        
        # Look for explicit meeting time label
        if "meeting time" in line_lower and ":" in line:
            parts = line.split(":", 1)
            if len(parts) == 2:
                time_str = parts[1].strip()
                # Extract time range
                time_patterns = [
                    r'(\d{1,2}):(\d{2})\s*(?:am|pm|a\.m\.|p\.m\.)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(?:am|pm|a\.m\.|p\.m\.)?',
                    r'(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})',
                ]
                for pattern in time_patterns:
                    time_match = re.search(pattern, time_str, re.IGNORECASE)
                    if time_match:
                        groups = time_match.groups()
                        if len(groups) >= 4:
                            start_hour = groups[0]
                            start_min = groups[1]
                            end_hour = groups[2]
                            end_min = groups[3]
                            
                            # Detect am/pm
                            meridiem = "am"
                            if "pm" in time_str.lower() or "p.m" in time_str.lower():
                                meridiem = "pm"
                            
                            start_time = f"{start_hour}:{start_min} {meridiem}"
                            end_time = f"{end_hour}:{end_min} {meridiem}"
                        break
    
    # If we found meeting info from explicit labels, return early
    if course_date and start_time and end_time:
        return course_date, start_time, end_time
    
    # First pass: look for lines with strong class time indicators
    class_time_keywords = [
        "class time", "class times", "lecture", "lectures", "meets", "session times"
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

    # Detect online/asynchronous courses FIRST
    is_online, is_lab_online = _detect_online_course(candidate_lines)

    # Extract meeting times and days only if course is NOT online
    if not is_online:
        extracted_course_date, extracted_start_time, extracted_end_time = _extract_meeting_times(candidate_lines)
        if extracted_course_date:
            course_date = extracted_course_date
        if extracted_start_time:
            start_time = extracted_start_time
        if extracted_end_time:
            end_time = extracted_end_time

    # Extract lab information
    has_lab, lab_day, lab_start_time, lab_end_time = _extract_lab_times(candidate_lines)
    
    # Only use lab times if lab is not online
    if is_lab_online:
        lab_day = None
        lab_start_time = None
        lab_end_time = None

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
        
        # Check for parenthetical code which might override the main code
        paren_code = _extract_course_code_from_parens(first_line)
        if paren_code:
            course_code = paren_code
        
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

                if not description and re.search(r"\b(course\s*description|description|overview|about|course\s*objective|objectives?)\b", line, re.IGNORECASE):
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
                "isOnline": is_online,
                "hasLab": has_lab,
                "labDay": lab_day,
                "labStartTime": lab_start_time,
                "labEndTime": lab_end_time,
                "labIsOnline": is_lab_online,
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

        if not description and re.search(r"\b(course\s*description|description|overview|about|course\s*objective|objectives?)\b", line, re.IGNORECASE):
            parts = re.split(r":", line, maxsplit=1)
            if len(parts) == 2:
                desc_candidate = parts[1].strip()
                if desc_candidate and len(desc_candidate) > 10:
                    description = desc_candidate[:200]

        if not course_code:
            detected_code = extract_code_from_line(line)
            if detected_code:
                course_code = detected_code
            else:
                # Try to extract from parentheses
                paren_code = _extract_course_code_from_parens(line)
                if paren_code:
                    course_code = paren_code

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
    
    # Use Gemini to analyze full syllabus and fill in missing information
    full_text = "\n".join(lines)
    ai_analysis = _analyze_syllabus_with_gemini(course_code, course_name, full_text)
    
    # Merge AI results with extracted data (prefer extracted data, use AI as fallback)
    if ai_analysis:
        if not description and ai_analysis.get("description"):
            description = ai_analysis.get("description")
        
        # Use AI meeting days if we didn't find them
        if not course_date and ai_analysis.get("meetingDays"):
            course_date = ai_analysis.get("meetingDays")
        
        # Use AI meeting time if we didn't find it
        if not start_time and ai_analysis.get("meetingTime"):
            time_parts = ai_analysis.get("meetingTime", "").split("-")
            if len(time_parts) == 2:
                start_time = time_parts[0].strip()
                end_time = time_parts[1].strip()
        
        # Override online status if AI detected it clearly
        if ai_analysis.get("isOnline") == "true":
            is_online = True

    return {
        "name": course_name,
        "code": course_code,
        "professor": professor,
        "description": description,
        "courseDate": course_date,
        "startTime": start_time,
        "endTime": end_time,
        "isOnline": is_online,
        "hasLab": has_lab,
        "labDay": lab_day,
        "labStartTime": lab_start_time,
        "labEndTime": lab_end_time,
        "labIsOnline": is_lab_online,
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
        "isOnline": course.get("isOnline", False),
        "hasLab": course.get("hasLab", False),
        "labDay": course.get("labDay"),
        "labStartTime": course.get("labStartTime"),
        "labEndTime": course.get("labEndTime"),
        "labIsOnline": course.get("labIsOnline", False),
    }
