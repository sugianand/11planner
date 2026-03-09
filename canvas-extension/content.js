/**
 * 11Planner Canvas Extension – Content Script
 * Extracts assignments from Canvas LMS calendar (Agenda view recommended).
 */

/**
 * Get visible text only — strips Canvas screenreader-only spans.
 * Canvas injects hidden spans like <span class="screenreader-only">Assignment Title:</span>
 * that pollute textContent. We skip those.
 */
function getVisibleText(el) {
    if (!el) return '';
    let text = '';
    el.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const cls = node.className || '';
            // Skip screenreader-only and visually-hidden elements
            if (cls.includes('screenreader-only') || cls.includes('screen-reader') ||
                cls.includes('sr-only') || cls.includes('hidden')) return;
            text += getVisibleText(node);
        }
    });
    return text.trim();
}

/**
 * Parse a human-readable date string (Canvas heading format) into YYYY-MM-DD.
 * Handles: "Tue, Mar 10", "Mar 10, 2026", "Today", "Tomorrow"
 */
function parseDateHeading(text) {
    if (!text) return null;
    text = text.trim();

    const today = new Date();
    if (/^today$/i.test(text)) return today.toISOString().split('T')[0];
    if (/^tomorrow$/i.test(text)) {
        const t = new Date(today); t.setDate(t.getDate() + 1);
        return t.toISOString().split('T')[0];
    }

    // Try direct parse — works for "Mar 10, 2026"
    const direct = new Date(text);
    if (!isNaN(direct.getTime())) return direct.toISOString().split('T')[0];

    // "Tue, Mar 10" — no year, so add current or next year
    const noYear = new Date(`${text}, ${today.getFullYear()}`);
    if (!isNaN(noYear.getTime())) {
        // If it's in the past by more than a month, assume next year
        const diff = noYear - today;
        if (diff < -30 * 24 * 3600 * 1000) {
            const nextYear = new Date(`${text}, ${today.getFullYear() + 1}`);
            return nextYear.toISOString().split('T')[0];
        }
        return noYear.toISOString().split('T')[0];
    }

    return null;
}

/**
 * Parse a time string from Canvas agenda like "Due 5:30pm", "11:59pm", "4:00pm"
 * Returns { hours, minutes } or null.
 */
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
        const d = new Date(dateStr + 'T00:00:00'); // force local midnight, avoid UTC shift
        if (isNaN(d.getTime())) return null;
        if (timeObj) {
            d.setHours(timeObj.hours, timeObj.minutes, 0, 0);
        } else {
            d.setHours(23, 59, 0, 0);
        }
        return d.toISOString();
    } catch (_) { return null; }
}

/**
 * Build course ID → course name from the Canvas calendar sidebar.
 */
function buildCourseMap() {
    const map = {};
    document.querySelectorAll('[data-context-code], .context_list_context').forEach(el => {
        const code = el.getAttribute('data-context-code') || el.getAttribute('data-context');
        if (!code || !code.startsWith('course_')) return;
        const nameEl = el.querySelector('.context-list-course-title, label, span') || el;
        const name = getVisibleText(nameEl);
        if (name && name.length > 2) map[code] = name;
    });
    document.querySelectorAll('#context-list li, .calendar_list li').forEach(li => {
        const anchor = li.querySelector('a[href*="/courses/"]');
        if (!anchor) return;
        const m = anchor.getAttribute('href')?.match(/\/courses\/(\d+)/);
        if (!m) return;
        const code = `course_${m[1]}`;
        const name = getVisibleText(li.querySelector('.context-list-course-title, .name') || anchor);
        if (name && name.length > 2 && !map[code]) map[code] = name;
    });
    return map;
}

/** ───── AGENDA VIEW ───── */
function extractFromAgenda() {
    const assignments = [];
    const courseMap = buildCourseMap();
    console.log('[11Planner] Course map:', courseMap);

    let currentDateStr = null;

    // Canvas agenda: alternating fc-list-day and fc-list-item rows in a table
    const rows = document.querySelectorAll('tr.fc-list-day, tr.fc-list-item');
    console.log('[11Planner] Agenda rows found:', rows.length);

    rows.forEach(row => {
        if (row.classList.contains('fc-list-day')) {
            // Try data-date on the row or any descendant first
            let d = row.getAttribute('data-date');
            if (!d) {
                const withDate = row.querySelector('[data-date]');
                d = withDate?.getAttribute('data-date');
            }
            if (d) {
                currentDateStr = d;
            } else {
                // Parse from visible text heading: "Tue, Mar 10"
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
            // Time cell
            const timeEl = row.querySelector('td.fc-list-item-time, .fc-list-item-time');
            const timeText = getVisibleText(timeEl);

            // Title — get only <a> href/text to avoid screenreader garbage
            const titleAnchor = row.querySelector('td.fc-list-item-title a, .fc-list-item-title a');
            const titleEl = row.querySelector('td.fc-list-item-title, .fc-list-item-title');

            // Prefer anchor visible text, fallback to title cell visible text
            const title = getVisibleText(titleAnchor || titleEl);
            const url = titleAnchor?.getAttribute('href') || window.location.href;

            if (!title || title.length < 2) return;

            // Course
            const contextCode = row.getAttribute('data-context-code') || '';
            const course = courseMap[contextCode] || 'General';

            // Build due date
            const timeObj = parseTimeText(timeText);
            const dueDate = buildISOFromDateAndTime(currentDateStr, timeObj);

            console.log('[11Planner] Item:', { title, timeText, currentDateStr, dueDate, course });
            assignments.push({ title, dueDate, course, url, extractedFrom: 'agenda' });
        }
    });

    return assignments;
}

/** ───── ASSIGNMENTS LIST PAGE ───── */
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
 *       tr  (event row 2, if needed)
 *         td > .fc-event-container > a.fc-event
 *
 * Strategy: for each .fc-event, walk up to .fc-row.fc-week,
 * then look in that week's .fc-bg for td.fc-day at the same cellIndex.
 */
function extractFromCalendar() {
    const assignments = [];

    document.querySelectorAll('.fc-event').forEach(event => {
        const rawTitle = getVisibleText(event.querySelector('.fc-title') || event);
        if (!rawTitle || rawTitle.length < 2) return;

        // Parse time prefix from title ("4p Chemistry HW" → 16:00)
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

        // ── Find the event's column (day-of-week) ──
        const eventTd = event.closest('td');
        if (!eventTd) return;
        const colIdx = eventTd.cellIndex; // 0=Sun … 6=Sat

        // ── Walk up to the week container ──
        const fcWeek = event.closest('.fc-row.fc-week, .fc-week, [class*="fc-week"]');
        if (!fcWeek) {
            console.log('[11Planner] No .fc-week found for:', cleanTitle);
            return;
        }

        // ── Get the date from the background grid at the same column ──
        // .fc-bg contains td.fc-day[data-date] in column order 0-6
        const bgDayCells = fcWeek.querySelectorAll('.fc-bg td.fc-day[data-date]');
        const dateStr = bgDayCells[colIdx]?.getAttribute('data-date');

        console.log('[11Planner]', cleanTitle, '| col:', colIdx, '| bgDayCells:', bgDayCells.length, '| date:', dateStr);

        const dueDate = buildISOFromDateAndTime(dateStr, timeObj);
        const href = event.getAttribute('href') || event.querySelector('a')?.getAttribute('href') || window.location.href;
        assignments.push({ title: cleanTitle, dueDate, course: 'General', url: href, extractedFrom: 'calendar_month' });
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

    // Deduplicate by title
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
