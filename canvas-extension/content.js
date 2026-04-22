/**
 * 11Planner Canvas Extension – Content Script
 * Injects into Canvas pages to extract courses, assignments, and their details.
 */

// Recursively extracts visible text from DOM elements, skipping hidden/screenreader-only content
function getVisibleText(el) {
    if (!el) return '';
    let text = '';
    el.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const cls = String(node.className || '');
            // Skip hidden elements
            if (cls.includes('screenreader-only') || cls.includes('screen-reader') ||
                cls.includes('sr-only') || cls.includes('hidden')) return;
            text += getVisibleText(node);
        }
    });
    return text.trim();
}

// Converts date heading text (like "Today", "Tomorrow", "Mar 10") to ISO YYYY-MM-DD format
function parseDateHeading(text) {
    if (!text) return null;
    text = text.trim();

    const today = new Date();
    if (/^today$/i.test(text)) return today.toISOString().split('T')[0];
    if (/^tomorrow$/i.test(text)) {
        const t = new Date(today); t.setDate(t.getDate() + 1);
        return t.toISOString().split('T')[0];
    }

    // If heading includes an explicit year, parse directly.
    const hasExplicitYear = /\b\d{4}\b/.test(text);
    if (hasExplicitYear) {
        const direct = new Date(text);
        if (!isNaN(direct.getTime())) return direct.toISOString().split('T')[0];
    }

    // "Tue, Mar 10" style heading without year.
    // Use current year first, then roll forward if the date is already in the past.
    const currentYearCandidate = new Date(`${text}, ${today.getFullYear()}`);
    if (!isNaN(currentYearCandidate.getTime())) {
        const candidateDateOnly = new Date(currentYearCandidate.getFullYear(), currentYearCandidate.getMonth(), currentYearCandidate.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (candidateDateOnly < todayDateOnly) {
            const nextYearCandidate = new Date(`${text}, ${today.getFullYear() + 1}`);
            if (!isNaN(nextYearCandidate.getTime())) {
                return nextYearCandidate.toISOString().split('T')[0];
            }
        }
        return currentYearCandidate.toISOString().split('T')[0];
    }

    return null;
}

// Parses time strings like "11:59pm", "2:30 am", "14:00" into {hours, minutes} object
function parseTimeText(text, opts = {}) {
    const assumePmWhenMissing = Boolean(opts.assumePmWhenMissing);
    if (!text) return null;
    const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();

    // Examples:
    // "11:59pm", "11:59 pm", "11:59"
    let m = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(a|am|p|pm)?$/i);
    if (!m) {
        // Also support strings that contain time text: "Due 11:59pm"
        m = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(a|am|p|pm)?/i);
    }
    if (!m) return null;

    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const suffix = (m[3] || '').toLowerCase();

    if (suffix === 'p' || suffix === 'pm') {
        if (h < 12) h += 12;
    } else if (suffix === 'a' || suffix === 'am') {
        if (h === 12) h = 0;
    } else {
        // Canvas month events often expose default deadlines as "11:59" (without am/pm),
        // which represent 11:59 PM. Use PM assumption in those contexts.
        if (assumePmWhenMissing && h < 12) h += 12;
    }

    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return { hours: h, minutes: min };
}

function parseCalendarEventTime(event, rawTitle) {
    if (!event) return null;

    const timeEl = event.querySelector('.fc-time');
    const fromDataStart = parseTimeText(timeEl?.getAttribute('data-start'), { assumePmWhenMissing: true });
    if (fromDataStart) return fromDataStart;

    const fromTimeText = parseTimeText(getVisibleText(timeEl), { assumePmWhenMissing: true });
    if (fromTimeText) return fromTimeText;

    // Fallback: parse title prefix only when title actually starts with time
    const title = (rawTitle || '').trim();
    const prefixMatch = title.match(/^(\d{1,2}(?::\d{2})?\s*(?:a|am|p|pm))\b/i);
    if (prefixMatch) {
        const fromTitle = parseTimeText(prefixMatch[1], { assumePmWhenMissing: false });
        if (fromTitle) return fromTitle;
    }

    return null;
}

// Converts date object to local ISO string (YYYY-MM-DDTHH:mm:ss)
function toLocalIsoString(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const mm = String(dateObj.getMinutes()).padStart(2, '0');
    const ss = String(dateObj.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
}

// Parses "Due: Mar 3 at 11:59pm" style text into ISO datetime string
function parseDueDateFromText(text) {
    if (!text) return null;
    const normalized = text.replace(/\s+/g, ' ').trim();

    // Examples handled:
    // "Due: Mar 3 at 11:59pm"
    // "Due Mar 3, 2026 at 11:59pm"
    // "Due: Mar 3"
    const m = normalized.match(/due[:\s-]*([A-Za-z]{3,9}\s+\d{1,2}(?:,\s*\d{4})?)(?:\s+at\s+(\d{1,2}:\d{2}\s*[ap]m))?/i);
    if (!m) return null;

    const datePart = m[1];
    const timePart = m[2] || null;
    const now = new Date();
    const hasYear = /\b\d{4}\b/.test(datePart);

    let parsedDate = hasYear ? new Date(datePart) : new Date(`${datePart}, ${now.getFullYear()}`);
    if (isNaN(parsedDate.getTime())) return null;

    if (!hasYear) {
        const parsedDateOnly = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
        const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (parsedDateOnly < todayDateOnly) {
            const nextYearDate = new Date(`${datePart}, ${now.getFullYear() + 1}`);
            if (!isNaN(nextYearDate.getTime())) parsedDate = nextYearDate;
        }
    }

    const timeObj = parseTimeText(timePart);
    if (timeObj) parsedDate.setHours(timeObj.hours, timeObj.minutes, 0, 0);
    else parsedDate.setHours(23, 59, 0, 0);

    return toLocalIsoString(parsedDate);
}

// Extracts due date from event metadata: title, aria-label, or time elements
function extractDueDateFromEventMetadata(event) {
    const timeEl = event.querySelector('time[datetime]');
    const timeAttr = timeEl?.getAttribute('datetime');
    if (timeAttr) {
        const parsed = new Date(timeAttr);
        if (!isNaN(parsed.getTime())) return toLocalIsoString(parsed);
    }

    const candidates = [
        event.getAttribute('title'),
        event.getAttribute('aria-label'),
        event.getAttribute('data-original-title'),
        event.getAttribute('data-tooltip'),
        getVisibleText(event),
    ];

    for (const candidate of candidates) {
        const parsed = parseDueDateFromText(candidate);
        if (parsed) return parsed;
    }

    return null;
}

// Combines a date string and time object into a full ISO datetime
function buildISOFromDateAndTime(dateStr, timeObj) {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return null;
        if (timeObj) {
            d.setHours(timeObj.hours, timeObj.minutes, 0, 0);
        } else {
            d.setHours(23, 59, 0, 0);
        }
        return toLocalIsoString(d);
    } catch (_) { return null; }
}

// Simple utility: clamps a value between min and max bounds
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

// Rounds hours to nearest 0.5 (e.g., 2.3 -> 2.5)
function roundToHalfHour(hours) {
    return Math.round(hours * 2) / 2;
}

// Calculates days until due date from now
function daysUntilDue(dueDate) {
    if (!dueDate) return 7;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return 7;
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((due.getTime() - now.getTime()) / msPerDay);
}

// Checks if due date is in the future
function isDueAfterNow(dueDate) {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return false;
    return due.getTime() > Date.now();
}

// Estimates time in hours needed to complete an assignment
// Uses keywords, points, description length, and urgency to calculate estimate
function estimateHours(assignment) {
    const title = (assignment.title || '').toLowerCase();
    const description = (assignment.description || '').toLowerCase();
    const text = `${title} ${description}`;
    const points = Number.isFinite(assignment.points) ? assignment.points : null;
    const dueInDays = daysUntilDue(assignment.dueDate);

    let hours = 0.5; // base minimum

    // Type/complexity cues
    const heavyKeywords = ['final project', 'research paper', 'term paper', 'lab report', 'presentation'];
    const mediumKeywords = ['project', 'essay', 'report', 'problem set', 'homework', 'assignment'];
    const lightKeywords = ['reading', 'discussion', 'participation', 'check-in', 'quiz'];

    if (heavyKeywords.some(k => text.includes(k))) hours += 3.5;
    else if (mediumKeywords.some(k => text.includes(k))) hours += 2.0;
    else if (lightKeywords.some(k => text.includes(k))) hours += 0.5;
    else hours += 1.0;

    // Points-based effort (if available)
    if (points !== null) {
        if (points >= 200) hours += 3.0;
        else if (points >= 100) hours += 2.0;
        else if (points >= 50) hours += 1.25;
        else if (points >= 20) hours += 0.75;
    }

    // Description length as a weak proxy for scope
    const wordCount = description.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 250) hours += 1.5;
    else if (wordCount >= 120) hours += 1.0;
    else if (wordCount >= 50) hours += 0.5;

    // Urgency bump for near deadlines
    if (dueInDays <= 0) hours += 1.0;
    else if (dueInDays <= 1) hours += 0.75;
    else if (dueInDays <= 3) hours += 0.5;

    return clamp(roundToHalfHour(hours), 0.5, 16);
}

// Estimates priority level (1-5) based on deadline, effort, and stakes
function estimatePriorityLevel(assignment) {
    const title = (assignment.title || '').toLowerCase();
    const description = (assignment.description || '').toLowerCase();
    const text = `${title} ${description}`;
    const points = Number.isFinite(assignment.points) ? assignment.points : null;
    const dueInDays = daysUntilDue(assignment.dueDate);
    const estimatedHours = Number.isFinite(assignment.estimatedHours)
        ? assignment.estimatedHours
        : estimateHours(assignment);

    // Base urgency score (most important signal)
    let score = 2.0;
    if (dueInDays <= 0) score = 4.5;
    else if (dueInDays <= 1) score = 4.0;
    else if (dueInDays <= 3) score = 3.5;
    else if (dueInDays <= 7) score = 3.0;
    else if (dueInDays <= 14) score = 2.5;

    // Effort bump
    if (estimatedHours >= 8) score += 0.8;
    else if (estimatedHours >= 5) score += 0.5;
    else if (estimatedHours >= 3) score += 0.3;

    // Points bump
    if (points !== null) {
        if (points >= 100) score += 0.4;
        else if (points >= 50) score += 0.25;
    }

    // Keyword-based stakes adjustment
    const highStakes = ['final', 'midterm', 'exam', 'capstone', 'project', 'presentation', 'report', 'paper'];
    const lowStakes = ['reading', 'check-in', 'attendance', 'practice'];

    if (highStakes.some(k => text.includes(k))) score += 0.4;
    if (lowStakes.some(k => text.includes(k))) score -= 0.3;

    // Priority level scale: 1 (low) .. 5 (urgent)
    return clamp(Math.round(score), 1, 5);
}

// Builds a map of Canvas course IDs to course names from various sources
function buildCourseMap() {
    const map = {};

    // check Canvas global ENV variables
    try {
        const env = window.ENV || {};

        (env.CALENDAR_CONTEXTS || []).forEach(ctx => {
            if (ctx.asset_string && ctx.asset_string.startsWith('course_')) {
                map[ctx.asset_string] = ctx.name || ctx.course_code || ctx.asset_string;
            }
        });

        if (env.CONTEXTS) {
            Object.values(env.CONTEXTS).forEach(ctx => {
                const key = ctx.asset_string || ctx.id;
                if (key && String(key).startsWith('course_') && !map[key]) {
                    map[key] = ctx.name || ctx.short_name || ctx.course_code || key;
                }
            });
        }

        if (env.COURSE && env.COURSE.id && env.COURSE.name) {
            map[`course_${env.COURSE.id}`] = env.COURSE.name;
        }
    } catch (_) { }

    // scan events for group_course_ classes, then fetch names from Canvas API
    if (Object.keys(map).length === 0) {
        const courseIds = new Set();
        document.querySelectorAll('.fc-event, [class*="group_course_"]').forEach(el => {
            const classes = el.className || '';
            const match = classes.match(/group_course_(\d+)/);
            if (match) courseIds.add(match[1]);
        });

        if (courseIds.size > 0) {

            try {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '/api/v1/courses?per_page=100&enrollment_state=active', false);
                xhr.send();
                if (xhr.status === 200) {
                    const courses = JSON.parse(xhr.responseText);
                    courses.forEach(c => {
                        const code = `course_${c.id}`;
                        map[code] = c.name || c.course_code || code;
                    });
                    console.log('[11Planner] Got course names from Canvas API:', Object.keys(map).length);
                }
            } catch (e) {
                console.log('[11Planner] Canvas API fetch failed:', e.message);
            }

            // fallback placeholder for IDs not in API response
            courseIds.forEach(id => {
                const code = `course_${id}`;
                if (!map[code]) map[code] = `Course ${id}`;
            });
        }
    }

    // check data-context attributes
    document.querySelectorAll('[data-context-code], [data-context], .context_list_context').forEach(el => {
        const code = el.getAttribute('data-context-code') || el.getAttribute('data-context');
        if (!code || !code.startsWith('course_') || map[code]) return;
        const nameEl = el.querySelector('.context-list-course-title, .name, label, span, a') || el;
        const name = getVisibleText(nameEl);
        if (name && name.length > 2) map[code] = name;
    });

    // sidebar course links
    document.querySelectorAll('#context-list li, .calendar_list li, .ContextList li, [class*="calendar"] li, [class*="context"] li').forEach(li => {
        const anchor = li.querySelector('a[href*="/courses/"]');
        if (!anchor) return;
        const m = anchor.getAttribute('href')?.match(/\/courses\/(\d+)/);
        if (!m) return;
        const code = `course_${m[1]}`;
        if (map[code] && !map[code].startsWith('Course ')) return;
        const name = getVisibleText(li.querySelector('.name, label, span') || anchor);
        if (name && name.length > 2) map[code] = name;
    });

    console.log('[11Planner] Built course map with', Object.keys(map).length, 'courses:', JSON.stringify(map));
    return map;
}

// Walks up DOM tree looking for group_course_XXXXX class to find course ID
function getCourseCodeFromClasses(el) {
    if (!el) return null;

    let current = el;
    while (current && current !== document.body) {
        const classes = current.className || '';
        const match = classes.match(/group_course_(\d+)/);
        if (match) return `course_${match[1]}`;
        current = current.parentElement;
    }
    return null;
}

// Extracts course name from a /courses/ID URL using the course map
function extractCourseFromUrl(url, courseMap) {
    if (!url) return null;
    const m = url.match(/\/courses\/(\d+)/);
    if (!m) return null;
    const code = `course_${m[1]}`;
    if (courseMap[code]) return courseMap[code];
    return null;
}

// Checks if a DOM node represents an assignment (not just a regular event)
function isAssignmentLikeNode(node) {
    if (!node) return false;

    // Canvas usually marks assignment/quiz events with this class.
    if (node.classList?.contains('assignment')) return true;

    // Fallback: assignment-ish icon markers used in calendar rows/cards.
    if (node.querySelector?.('.icon-assignment, .icon-quiz, .icon-discussion, .icon-graded-discussion')) {
        return true;
    }

    // Fallback: screenreader label in Canvas markup.
    const rawText = (node.textContent || '').toLowerCase();
    if (rawText.includes('assignment title:')) return true;

    // Exclude plain calendar events/meetings.
    return false;
}

// Extracts course ID from a DOM node's class or data attributes
function parseCourseIdFromNode(node) {
    if (!node) return null;

    const classText = String(node.className || '');
    const clsMatch = classText.match(/group_course_(\d+)/i);
    if (clsMatch) return clsMatch[1];

    const contextCode = node.getAttribute('data-context-code') || node.closest('[data-context-code]')?.getAttribute('data-context-code');
    const ctxMatch = contextCode?.match(/course_(\d+)/i);
    if (ctxMatch) return ctxMatch[1];

    return null;
}

// Extracts assignment ID from various node attributes and URLs
function parseAssignmentIdFromNode(node) {
    if (!node) return null;

    const candidates = [
        node.getAttribute('href'),
        node.getAttribute('data-href'),
        node.getAttribute('data-url'),
        node.getAttribute('data-assignment-url'),
        node.getAttribute('data-original-title'),
        node.getAttribute('title'),
        node.id,
        String(node.className || ''),
        node.outerHTML,
    ].filter(Boolean);

    for (const text of candidates) {
        const hrefMatch = String(text).match(/\/assignments\/(\d+)/i);
        if (hrefMatch) return hrefMatch[1];

        const idMatch = String(text).match(/assignment[_-]?(\d{3,})/i);
        if (idMatch) return idMatch[1];
    }

    return null;
}

// Finds an assignment link by matching its text to a title
function findAssignmentAnchorByTitle(title) {
    if (!title) return null;
    const normalizedTitle = title.trim().toLowerCase();
    const anchors = document.querySelectorAll('a[href*="/assignments/"]');
    for (const a of anchors) {
        const t = getVisibleText(a).trim().toLowerCase();
        if (t && t === normalizedTitle) return a;
    }
    return null;
}

// Resolves assignment URL from various sources (href, API, fallback)
function resolveAssignmentUrl(node, title) {
    // 1) Direct href on node or descendants
    const directHref =
        node?.getAttribute?.('href') ||
        node?.querySelector?.('a[href]')?.getAttribute('href');
    if (directHref) {
        try { return new URL(directHref, window.location.origin).toString(); } catch (_) { return directHref; }
    }

    // 2) Any nearby assignment anchor with matching title
    const titleAnchor = findAssignmentAnchorByTitle(title);
    if (titleAnchor?.href) return titleAnchor.href;

    // 3) Build from extracted course/assignment ids if available
    const assignmentId = parseAssignmentIdFromNode(node);
    const courseId = parseCourseIdFromNode(node);
    if (assignmentId && courseId) {
        return `${window.location.origin}/courses/${courseId}/assignments/${assignmentId}`;
    }

    // 4) Fallback: current page URL
    return window.location.href;
}

// Checks if URL is likely a Calendar page (not an assignment page)
function isLikelyCalendarUrl(url) {
    if (!url) return true;
    try {
        const u = new URL(url, window.location.origin);
        return u.pathname === '/calendar' || u.pathname.startsWith('/calendar');
    } catch (_) {
        return true;
    }
}

// Normalizes text for comparison (lowercase, trim, single spaces)
function normalizeTitle(text) {
    return (text || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

// Strips HTML tags from text, leaving only readable content
function stripHtmlToText(html) {
    if (!html) return '';
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return (doc.body?.textContent || '').replace(/\s+/g, ' ').trim();
    } catch (_) {
        return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
}

// Determines assignment type (quiz, discussion, exam) from Canvas API data
function inferAssignmentTypeFromApi(item) {
    if (!item) return null;
    const submissionTypes = Array.isArray(item.submission_types) ? item.submission_types : [];
    const title = normalizeTitle(item.name || '');

    if (submissionTypes.includes('discussion_topic') || title.includes('discussion')) return 'discussion';
    if (submissionTypes.includes('online_quiz') || title.includes('quiz')) return 'quiz';
    if (submissionTypes.includes('on_paper') || title.includes('exam') || title.includes('test')) return 'exam';
    return 'assignment';
}

// Parses course schedule text like "MWF 9:00 AM - 10:15 AM" into structured data
function parseCourseScheduleFromText(text) {
    if (!text) return null;
    const normalized = String(text).replace(/\s+/g, ' ').trim();
    if (!normalized) return null;

    // Examples: "MWF 9:00 AM - 10:15 AM", "Tue/Thu 2:00pm-3:15pm"
    const meetingRegex = /\b((?:mon|monday|tue|tues|tuesday|wed|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday|sun|sunday|mwf|tth|tu\/th|mo\/we|we\/fr)(?:\s*[,/&-]\s*(?:mon|monday|tue|tues|tuesday|wed|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday|sun|sunday|mwf|tth|tu\/th|mo\/we|we\/fr))*)\b[^\d]{0,12}(\d{1,2}(?::\d{2})?\s*(?:a|am|p|pm)\s*[-–]\s*\d{1,2}(?::\d{2})?\s*(?:a|am|p|pm))/i;
    const match = normalized.match(meetingRegex);
    if (!match) return null;

    const days = match[1].trim();
    const timeRange = match[2].replace(/\s+/g, ' ').trim();
    return {
        days,
        timeRange,
        scheduleText: `${days} ${timeRange}`,
    };
}

// Builds a map of course codes to their meeting times from course links
function buildCourseMeetingMap() {
    const byCode = {};

    // Look for course links and parse schedule-ish text nearby.
    const courseAnchors = document.querySelectorAll('a[href*="/courses/"]');
    courseAnchors.forEach(anchor => {
        const href = anchor.getAttribute('href') || '';
        const m = href.match(/\/courses\/(\d+)/);
        if (!m) return;
        const code = `course_${m[1]}`;
        if (byCode[code]) return;

        const container = anchor.closest('li, tr, .ic-DashboardCard, .course-list-item, .context_list_context') || anchor.parentElement;
        const contextText = getVisibleText(container || anchor);
        const parsed = parseCourseScheduleFromText(contextText);
        if (parsed) {
            byCode[code] = parsed;
        }
    });

    return byCode;
}

// Compares if two date strings refer to the same calendar day
function sameDateOnly(a, b) {
    if (!a || !b) return false;
    try {
        const da = new Date(a);
        const db = new Date(b);
        if (isNaN(da.getTime()) || isNaN(db.getTime())) return false;
        return (
            da.getFullYear() === db.getFullYear() &&
            da.getMonth() === db.getMonth() &&
            da.getDate() === db.getDate()
        );
    } catch (_) {
        return false;
    }
}

// Queries Canvas API to find assignment URL by title and course
async function fetchAssignmentUrlFromCanvasApi(courseId, title, dueDate) {
    if (!courseId || !title) return null;

    try {
        const endpoint = `${window.location.origin}/api/v1/courses/${courseId}/assignments?search_term=${encodeURIComponent(title)}&per_page=50`;
        const res = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) return null;
        const list = await res.json();
        if (!Array.isArray(list) || list.length === 0) return null;

        const target = normalizeTitle(title);

        // 1) exact title + same due date
        let best = list.find(a => normalizeTitle(a?.name) === target && sameDateOnly(a?.due_at, dueDate));
        // 2) exact title
        if (!best) best = list.find(a => normalizeTitle(a?.name) === target);
        // 3) contains title
        if (!best) best = list.find(a => normalizeTitle(a?.name).includes(target) || target.includes(normalizeTitle(a?.name)));

        if (!best) return null;

        if (best.html_url) return best.html_url;
        if (best.id) return `${window.location.origin}/courses/${courseId}/assignments/${best.id}`;
        return null;
    } catch (_) {
        return null;
    }
}

// Enriches assignments with URLs from Canvas API
async function enrichAssignmentUrls(assignments) {
    const cache = new Map();

    for (const item of assignments) {
        if (!isLikelyCalendarUrl(item.url)) continue;

        const ctx = item.contextCode || '';
        const m = ctx.match(/course_(\d+)/i);
        const courseId = m ? m[1] : null;
        if (!courseId) continue;

        const key = `${courseId}::${normalizeTitle(item.title)}::${item.dueDate || ''}`;
        if (!cache.has(key)) {
            cache.set(key, fetchAssignmentUrlFromCanvasApi(courseId, item.title, item.dueDate));
        }

        const resolved = await cache.get(key);
        if (resolved) item.url = resolved;
    }

    return assignments;
}

// Fetches detailed assignment info (description, points, type) from Canvas API
async function fetchAssignmentDetailsFromCanvasApi(courseId, title, dueDate) {
    if (!courseId || !title) return null;

    try {
        const endpoint = `${window.location.origin}/api/v1/courses/${courseId}/assignments?search_term=${encodeURIComponent(title)}&per_page=50`;
        const res = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) return null;
        const list = await res.json();
        if (!Array.isArray(list) || list.length === 0) return null;

        const target = normalizeTitle(title);
        let best = list.find(a => normalizeTitle(a?.name) === target && sameDateOnly(a?.due_at, dueDate));
        if (!best) best = list.find(a => normalizeTitle(a?.name) === target);
        if (!best) best = list.find(a => normalizeTitle(a?.name).includes(target) || target.includes(normalizeTitle(a?.name)));
        if (!best) return null;

        const parsedDue = best.due_at ? new Date(best.due_at) : null;
        const dueDateIso = parsedDue && !isNaN(parsedDue.getTime()) ? toLocalIsoString(parsedDue) : null;

        return {
            url: best.html_url || (best.id ? `${window.location.origin}/courses/${courseId}/assignments/${best.id}` : null),
            description: stripHtmlToText(best.description || ''),
            points: Number.isFinite(best.points_possible) ? best.points_possible : null,
            type: inferAssignmentTypeFromApi(best),
            dueDate: dueDateIso,
        };
    } catch (_) {
        return null;
    }
}

// Enriches assignments with details (description, points) from Canvas API
async function enrichAssignmentDetails(assignments) {
    const cache = new Map();

    for (const item of assignments) {
        const ctx = item.contextCode || '';
        const m = ctx.match(/course_(\d+)/i);
        const courseId = m ? m[1] : null;
        if (!courseId) continue;

        const key = `${courseId}::${normalizeTitle(item.title)}::${item.dueDate || ''}`;
        if (!cache.has(key)) {
            cache.set(key, fetchAssignmentDetailsFromCanvasApi(courseId, item.title, item.dueDate));
        }

        const details = await cache.get(key);
        if (!details) continue;

        if ((!item.url || isLikelyCalendarUrl(item.url)) && details.url) {
            item.url = details.url;
        }
        if ((!item.description || !item.description.trim()) && details.description) {
            item.description = details.description;
        }
        if (!Number.isFinite(item.points) && Number.isFinite(details.points)) {
            item.points = details.points;
        }
        if (!item.type && details.type) {
            item.type = details.type;
        }
        if (!item.dueDate && details.dueDate) {
            item.dueDate = details.dueDate;
        }
    }

    return assignments;
}

/** ───── AGENDA VIEW ───── */
function extractFromAgenda() {
    const assignments = [];
    const courseMap = buildCourseMap();
    console.log('[11Planner] Course map:', courseMap);

    let currentDateStr = null;


    const rows = document.querySelectorAll('tr.fc-list-day, tr.fc-list-item');
    console.log('[11Planner] Agenda rows found:', rows.length);

    rows.forEach(row => {
        if (row.classList.contains('fc-list-day')) {

            let d = row.getAttribute('data-date');
            if (!d) {
                const withDate = row.querySelector('[data-date]');
                d = withDate?.getAttribute('data-date');
            }
            if (d) {
                currentDateStr = d;
            } else {
                // fallback: parse from heading text
                const headingEl = row.querySelector(
                    '.fc-list-day-text, .fc-list-heading-main, td, th'
                );
                const headingText = getVisibleText(headingEl || row);
                currentDateStr = parseDateHeading(headingText);
            }
            console.log('[11Planner] Date heading parsed:', currentDateStr);
            return;
        }

        if (row.classList.contains('fc-list-item')) {
            if (!isAssignmentLikeNode(row)) return;

            // Time cell
            const timeEl = row.querySelector('td.fc-list-item-time, .fc-list-item-time');
            const timeText = getVisibleText(timeEl);

            // title from anchor text
            const titleAnchor = row.querySelector('td.fc-list-item-title a, .fc-list-item-title a');
            const titleEl = row.querySelector('td.fc-list-item-title, .fc-list-item-title');


            const title = getVisibleText(titleAnchor || titleEl);
            const url = resolveAssignmentUrl(titleAnchor || row, title);

            if (!title || title.length < 2) return;

            const contextCode = row.getAttribute('data-context-code') || row.getAttribute('data-context') || '';

            // resolve course name
            let course = 'General';

            // CSS class match
            const classCode = getCourseCodeFromClasses(row) ||
                getCourseCodeFromClasses(titleAnchor) ||
                getCourseCodeFromClasses(row.querySelector('.fc-event, .fc-event-dot, [class*="group_course"]'));
            if (classCode && courseMap[classCode]) {
                course = courseMap[classCode];
            }

            // data-context-code
            if (course === 'General' && contextCode && courseMap[contextCode]) {
                course = courseMap[contextCode];
            }

            // data-context
            if (course === 'General') {
                const ctx = row.getAttribute('data-context') || '';
                if (ctx && courseMap[ctx]) course = courseMap[ctx];
            }

            // parent context
            if (course === 'General') {
                const parentCtx = row.closest('[data-context-code], [data-context]');
                const pCode = parentCtx?.getAttribute('data-context-code') || parentCtx?.getAttribute('data-context') || '';
                if (pCode && courseMap[pCode]) course = courseMap[pCode];
            }

            // URL-based lookup
            if (course === 'General' && url) {
                const fromUrl = extractCourseFromUrl(url, courseMap);
                if (fromUrl) course = fromUrl;
            }


            // Build due date
            const timeObj =
                parseTimeText(timeEl?.getAttribute('data-start'), { assumePmWhenMissing: true }) ||
                parseTimeText(timeText, { assumePmWhenMissing: true });
            const dueDate = buildISOFromDateAndTime(currentDateStr, timeObj);

            console.log('[11Planner] Item:', { title, timeText, currentDateStr, dueDate, course });
            assignments.push({ title, dueDate, course, url, contextCode, extractedFrom: 'agenda' });
        }
    });

    return assignments;
}

// Extracts assignments from a dedicated assignments list page
function extractFromAssignmentsPage() {
    const assignments = [];
    const courseName = (() => {
        const crumbs = document.querySelectorAll('#breadcrumbs li a');
        if (crumbs.length >= 2) return crumbs[1].textContent.trim();
        return 'General';
    })();

    document.querySelectorAll('.ig-row, .assignment').forEach(row => {
        const titleEl = row.querySelector('.ig-title a, .assignment_title a, .title a, h3 a');
        if (!titleEl) return;
        const title = getVisibleText(titleEl);
        const url = titleEl.href || window.location.href;

        let dueDate = null;
        const timeEl = row.querySelector('time[datetime]');
        if (timeEl) dueDate = timeEl.getAttribute('datetime');
        if (!dueDate) {
            const el = row.querySelector('.due-date, [data-view="dueSummary"]');
            dueDate = el?.getAttribute('data-due-at') || el?.querySelector('time')?.getAttribute('datetime') || null;
        }

        const pointsEl = row.querySelector('.points_possible, .assignment-points');
        const points = pointsEl ? parseFloat(getVisibleText(pointsEl)) : null;
        if (title) assignments.push({ title, dueDate, course: courseName, points, url, extractedFrom: 'assignments_page' });
    });

    return assignments;
}

/** ───── MONTH/WEEK CALENDAR VIEW ─────
 * FullCalendar 3 (Canvas) structure per week:
 *   .fc-row.fc-week
 *     .fc-bg > table > tbody > tr > td.fc-day[data-date] × 7   (background dates)
 *     .fc-content-skeleton > table > tbody
 *       tr  (header with day numbers)
 *       tr  (event row 1)
 *       tr  (event row 2, if needed - with rowspan complications)
 *         td > .fc-event-container > a.fc-event
 *
 * Challenge: Events are in a table with rowspans, so we need to track
 * which column index each event is in by analyzing the table structure.
 */
function extractFromCalendar() {
    const assignments = [];
    const courseMap = buildCourseMap();

    /**
     * Helper: Maps a table cell to its actual column index,
     * accounting for rowspan from previous rows
     */
    function getCellColumnIndex(td) {
        const table = td.closest('table');
        if (!table) return null;

        const tbody = table.querySelector('tbody');
        if (!tbody) return null;

        const allRows = Array.from(tbody.querySelectorAll('tr'));
        const targetRowIndex = Array.from(allRows).indexOf(td.closest('tr'));
        if (targetRowIndex === -1) return null;

        // Track column occupancy for each row
        const colOccupancy = new Map(); // col -> rowspan remaining
        let colIndex = 0;

        for (let rowIndex = 0; rowIndex <= targetRowIndex; rowIndex++) {
            const row = allRows[rowIndex];
            colIndex = 0;

            // First, decrement rowspan counters for cells from previous rows
            const keysToDelete = [];
            for (const [col, remaining] of colOccupancy.entries()) {
                if (remaining > 1) {
                    colOccupancy.set(col, remaining - 1);
                } else {
                    keysToDelete.push(col);
                }
            }
            keysToDelete.forEach(k => colOccupancy.delete(k));

            // Now place cells from current row
            const cells = Array.from(row.querySelectorAll('td'));
            for (const cell of cells) {
                // Skip columns already occupied by rowspan from previous rows
                while (colOccupancy.has(colIndex)) {
                    colIndex++;
                }

                if (rowIndex === targetRowIndex && cell === td) {
                    return colIndex;
                }

                const span = parseInt(cell.getAttribute('rowspan') || '1', 10);
                if (span > 1) {
                    colOccupancy.set(colIndex, span);
                }
                colIndex++;
            }
        }

        return null;
    }

    document.querySelectorAll('.fc-event').forEach(event => {
        if (!isAssignmentLikeNode(event)) return;

        const rawTitle = getVisibleText(event.querySelector('.fc-title') || event);
        if (!rawTitle || rawTitle.length < 2) return;

        const timeObj = parseCalendarEventTime(event, rawTitle);
        const cleanTitle = rawTitle.replace(/^\d{1,2}(?::\d{2})?\s*[ap]\s*/i, '').trim();
        if (!cleanTitle) return;

        let dueDate = null;

        // Strategy 1: Check metadata (title/aria-label with "Due:" text)
        dueDate = extractDueDateFromEventMetadata(event);

        // Strategy 2: Direct data-date attribute
        if (!dueDate) {
            const directDateStr = event.getAttribute('data-date') || event.closest('[data-date]')?.getAttribute('data-date');
            if (directDateStr) {
                dueDate = buildISOFromDateAndTime(directDateStr, timeObj);
            }
        }

        // Strategy 3: Map to background day cells using rowspan-aware column tracking
        if (!dueDate) {
            const eventTd = event.closest('td');
            const fcWeek = event.closest('.fc-row.fc-week, .fc-week');

            if (eventTd && fcWeek) {
                // Get the actual column index accounting for rowspans
                const colIdx = getCellColumnIndex(eventTd);

                if (colIdx !== null) {
                    // Find the background day cells in this week
                    const bgDayTable = fcWeek.querySelector('.fc-bg > table');
                    if (bgDayTable) {
                        const bgDayCells = Array.from(bgDayTable.querySelectorAll('td.fc-day[data-date]'));

                        if (bgDayCells.length >= 7 && colIdx < bgDayCells.length) {
                            const dateStr = bgDayCells[colIdx].getAttribute('data-date');
                            if (dateStr) {
                                dueDate = buildISOFromDateAndTime(dateStr, timeObj);
                                console.log('[11Planner] Calendar rowspan-aware mapping:', cleanTitle, 'col:', colIdx, 'date:', dateStr);
                            }
                        }
                    }
                }
            }
        }

        const courseId = parseCourseIdFromNode(event);
        const contextCode = courseId ? `course_${courseId}` : '';
        const course = courseMap[contextCode] || 'General';
        const url = resolveAssignmentUrl(event, cleanTitle);
        assignments.push({ title: cleanTitle, dueDate, course, contextCode, url, extractedFrom: 'calendar_month' });
    });

    return assignments;
}

// Main extraction function: tries agenda, calendar, and assignments pages
// Returns deduplicated, enriched assignment list with time estimates
async function extractAssignments() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    let found = [];

    const isAgenda = hash.includes('view_name=agenda') || document.querySelector('tr.fc-list-item') !== null;

    if (path.includes('/assignments')) {
        found = extractFromAssignmentsPage();
    } else if (path.includes('/calendar') || hash.includes('view_name=')) {
        if (isAgenda) {
            found = extractFromAgenda();
            if (found.length === 0) found = extractFromCalendar();
        } else {
            found = extractFromCalendar();
            if (found.length === 0) found = extractFromAgenda();
        }
    } else {
        found = [
            ...extractFromAssignmentsPage(),
            ...extractFromCalendar(),
            ...extractFromAgenda(),
        ];
    }

    // keep upcoming tasks; keep undated items too so users can decide manually
    const upcoming = found.filter(a => !a.dueDate || isDueAfterNow(a.dueDate));

    // deduplicate with a stronger identity than title alone
    const seen = new Set();
    const deduped = upcoming.filter(a => {
        const key = [
            normalizeTitle(a.title),
            String(a.course || '').toLowerCase().trim(),
            String(a.contextCode || '').toLowerCase().trim(),
            String(a.dueDate || '').trim(),
        ].join('||');

        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    await enrichAssignmentUrls(deduped);
    await enrichAssignmentDetails(deduped);

    const enriched = deduped.map(a => {
        const estimatedHours = estimateHours(a);
        return {
            ...a,
            estimatedHours,
            priorityLevel: estimatePriorityLevel({ ...a, estimatedHours }),
        };
    });

    console.log('[11Planner] Final extracted:', enriched.length, 'assignments');
    return enriched;
}

// Extracts all courses from Canvas course map and meeting schedule data
function extractCourses() {
    const courseMap = buildCourseMap();
    const meetingMap = buildCourseMeetingMap();
    return Object.entries(courseMap).map(([contextCode, name]) => {
        const idMatch = String(contextCode).match(/^course_(\d+)$/);
        const meeting = meetingMap[contextCode] || null;
        return {
            id: idMatch ? idMatch[1] : contextCode,
            code: contextCode,
            contextCode,
            name,
            days: meeting?.days || null,
            timeRange: meeting?.timeRange || null,
            scheduleText: meeting?.scheduleText || null,
        };
    });
}

// Listens for 'extract' message from popup and returns extracted courses/assignments
// Listens for 'extract' message from popup and returns extracted courses/assignments
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // Handles extraction request: extracts all assignments and courses
    if (message.action === 'extract') {
        (async () => {
            try {
                const assignments = await extractAssignments();
                const courses = extractCourses();
                sendResponse({
                    assignments,
                    courses,
                    count: assignments.length,
                    courseCount: courses.length,
                });
            } catch (error) {
                console.error('[11Planner] Extraction error:', error);
                sendResponse({
                    error: error.message || 'Extraction failed',
                    assignments: [],
                    courses: [],
                });
            }
        })();
        return true; // Keep the message channel open for async response
    }
});
