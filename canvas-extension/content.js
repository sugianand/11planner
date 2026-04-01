/**
 * 11Planner Canvas Extension – Content Script
 */

function getVisibleText(el) {
    if (!el) return '';
    let text = '';
    el.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const cls = node.className || '';
            // Skip hidden elements
            if (cls.includes('screenreader-only') || cls.includes('screen-reader') ||
                cls.includes('sr-only') || cls.includes('hidden')) return;
            text += getVisibleText(node);
        }
    });
    return text.trim();
}

// Parse date heading text into YYYY-MM-DD
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

/**
 * Parse a time string from Canvas agenda like "Due 5:30pm", "11:59pm", "4:00pm"
 * Returns { hours, minutes } or null.
 */
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

function toLocalIsoString(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const mm = String(dateObj.getMinutes()).padStart(2, '0');
    const ss = String(dateObj.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
}

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

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function roundToHalfHour(hours) {
    return Math.round(hours * 2) / 2;
}

function daysUntilDue(dueDate) {
    if (!dueDate) return 7;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return 7;
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((due.getTime() - now.getTime()) / msPerDay);
}

function isDueAfterNow(dueDate) {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return false;
    return due.getTime() > Date.now();
}

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

/**
 * Build course ID → course name from the Canvas calendar sidebar.
 */
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

// Walk up DOM looking for group_course_XXXXX class
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

// Get course name from a /courses/ID URL
function extractCourseFromUrl(url, courseMap) {
    if (!url) return null;
    const m = url.match(/\/courses\/(\d+)/);
    if (!m) return null;
    const code = `course_${m[1]}`;
    if (courseMap[code]) return courseMap[code];
    return null;
}

/**
 * Return true only for assignment-like items (skip regular meetings/events).
 */
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

function parseCourseIdFromNode(node) {
    if (!node) return null;

    const classText = node.className || '';
    const clsMatch = classText.match(/group_course_(\d+)/i);
    if (clsMatch) return clsMatch[1];

    const contextCode = node.getAttribute('data-context-code') || node.closest('[data-context-code]')?.getAttribute('data-context-code');
    const ctxMatch = contextCode?.match(/course_(\d+)/i);
    if (ctxMatch) return ctxMatch[1];

    return null;
}

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
        node.className,
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

function isLikelyCalendarUrl(url) {
    if (!url) return true;
    try {
        const u = new URL(url, window.location.origin);
        return u.pathname === '/calendar' || u.pathname.startsWith('/calendar');
    } catch (_) {
        return true;
    }
}

function normalizeTitle(text) {
    return (text || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

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

// ===== ASSIGNMENTS LIST PAGE =====
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
     * Helper: Map a table cell to its actual column index,
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

function extractCourses() {
    const courseMap = buildCourseMap();
    return Object.entries(courseMap).map(([contextCode, name]) => {
        const idMatch = String(contextCode).match(/^course_(\d+)$/);
        return {
            id: idMatch ? idMatch[1] : contextCode,
            code: contextCode,
            name,
        };
    });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'extract') {
        (async () => {
            const assignments = await extractAssignments();
            const courses = extractCourses();
            sendResponse({
                assignments,
                courses,
                count: assignments.length,
                courseCount: courses.length,
            });
        })();
    }
    return true;
});
