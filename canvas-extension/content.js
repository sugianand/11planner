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

    // try direct parse
    const direct = new Date(text);
    if (!isNaN(direct.getTime())) return direct.toISOString().split('T')[0];

    // no year given, add current or next year
    const noYear = new Date(`${text}, ${today.getFullYear()}`);
    if (!isNaN(noYear.getTime())) {
        // past by >1 month = next year
        const diff = noYear - today;
        if (diff < -30 * 24 * 3600 * 1000) {
            const nextYear = new Date(`${text}, ${today.getFullYear() + 1}`);
            return nextYear.toISOString().split('T')[0];
        }
        return noYear.toISOString().split('T')[0];
    }

    return null;
}

// Parse time string → { hours, minutes } or null
function parseTimeText(text) {
    if (!text) return null;
    const m = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ampm = m[3].toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    return { hours: h, minutes: min };
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
        return d.toISOString();
    } catch (_) { return null; }
}

// Build course_ID → course name map from Canvas page
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

// ===== AGENDA VIEW =====
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

            const timeEl = row.querySelector('td.fc-list-item-time, .fc-list-item-time');
            const timeText = getVisibleText(timeEl);

            // title from anchor text
            const titleAnchor = row.querySelector('td.fc-list-item-title a, .fc-list-item-title a');
            const titleEl = row.querySelector('td.fc-list-item-title, .fc-list-item-title');


            const title = getVisibleText(titleAnchor || titleEl);
            const url = titleAnchor?.getAttribute('href') || window.location.href;

            if (!title || title.length < 2) return;

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
            if (course === 'General') {
                const contextCode = row.getAttribute('data-context-code') || '';
                if (contextCode && courseMap[contextCode]) course = courseMap[contextCode];
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


            const timeObj = parseTimeText(timeText);
            const dueDate = buildISOFromDateAndTime(currentDateStr, timeObj);

            console.log('[11Planner] Item:', { title, timeText, currentDateStr, dueDate, course });
            assignments.push({ title, dueDate, course, url, extractedFrom: 'agenda' });
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

// ===== MONTH/WEEK CALENDAR VIEW =====
function extractFromCalendar() {
    const assignments = [];
    const courseMap = buildCourseMap();

    document.querySelectorAll('.fc-event').forEach(event => {
        const rawTitle = getVisibleText(event.querySelector('.fc-title') || event);
        if (!rawTitle || rawTitle.length < 2) return;

        // parse time prefix from title
        const timeMatch = rawTitle.match(/^(\d{1,2})(?::(\d{2}))?\s*(a|p)\s/i);
        let timeObj = null;
        if (timeMatch) {
            let h = parseInt(timeMatch[1], 10);
            const min = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
            if (timeMatch[3].toLowerCase() === 'p' && h < 12) h += 12;
            if (timeMatch[3].toLowerCase() === 'a' && h === 12) h = 0;
            timeObj = { hours: h, minutes: min };
        }
        const cleanTitle = rawTitle.replace(/^\d{1,2}(?::\d{2})?\s*[ap]\s*/i, '').trim();
        if (!cleanTitle) return;

        // find event column
        const eventTd = event.closest('td');
        if (!eventTd) return;
        const colIdx = eventTd.cellIndex; // 0=Sun … 6=Sat

        // walk up to week container
        const fcWeek = event.closest('.fc-row.fc-week, .fc-week, [class*="fc-week"]');
        if (!fcWeek) {
            console.log('[11Planner] No .fc-week found for:', cleanTitle);
            return;
        }

        // get date from background grid
        const bgDayCells = fcWeek.querySelectorAll('.fc-bg td.fc-day[data-date]');
        const dateStr = bgDayCells[colIdx]?.getAttribute('data-date');

        // resolve course
        let course = 'General';
        const classCode = getCourseCodeFromClasses(event);
        if (classCode && courseMap[classCode]) {
            course = courseMap[classCode];
        }
        if (course === 'General') {
            const contextCode = event.getAttribute('data-context-code') ||
                event.getAttribute('data-context') ||
                event.closest('[data-context-code]')?.getAttribute('data-context-code') ||
                event.closest('[data-context]')?.getAttribute('data-context') || '';
            if (contextCode && courseMap[contextCode]) course = courseMap[contextCode];
        }
        if (course === 'General') {
            const href = event.getAttribute('href') || event.querySelector('a')?.getAttribute('href') || '';
            const fromUrl = extractCourseFromUrl(href, courseMap);
            if (fromUrl) course = fromUrl;
        }

        console.log('[11Planner]', cleanTitle, '| col:', colIdx, '| date:', dateStr, '| course:', course);

        const dueDate = buildISOFromDateAndTime(dateStr, timeObj);
        const href = event.getAttribute('href') || event.querySelector('a')?.getAttribute('href') || window.location.href;
        assignments.push({ title: cleanTitle, dueDate, course, url: href, extractedFrom: 'calendar_month' });
    });

    return assignments;
}

function extractAssignments() {
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

    // deduplicate
    const seen = new Set();
    const deduped = found.filter(a => {
        if (seen.has(a.title)) return false;
        seen.add(a.title);
        return true;
    });

    console.log('[11Planner] Final extracted:', deduped.length, 'assignments');
    return deduped;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'extract') {
        const assignments = extractAssignments();
        sendResponse({ assignments, count: assignments.length });
    }
    return true;
});
