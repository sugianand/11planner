/**
 * 11Planner Canvas Extension – Popup Script
 * Handles login via Supabase Auth and task extraction/sync.
 */

// ── Supabase config (anon key is safe to embed in client code) ──
const SUPABASE_URL = 'https://ddszcujvbvvihwsrkzsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkc3pjdWp2YnZ2aWh3c3JrenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjIzNDYsImV4cCI6MjA4NTczODM0Nn0.HfSG1DHiGG3Riv_JVFvFBWJggy40tPS4iAavIDKjs1o';

let extractedTasks = [];
let extractedCourses = [];
let selectedCourseCodes = new Set();

function getCourseKey(course) {
    return String(course?.code || course?.contextCode || course?.id || course?.name || '').trim();
}

function getFilteredSyncData() {
    if (!Array.isArray(extractedCourses) || extractedCourses.length === 0) {
        return { tasks: extractedTasks, courses: extractedCourses };
    }

    const selectedCourses = extractedCourses.filter(c => selectedCourseCodes.has(getCourseKey(c)));
    if (selectedCourses.length === 0) {
        return { tasks: [], courses: [] };
    }

    const selectedCourseNames = new Set(selectedCourses.map(c => String(c.name || '').toLowerCase().trim()));
    const selectedContextCodes = new Set(selectedCourses.map(c => String(c.contextCode || c.code || '').toLowerCase().trim()).filter(Boolean));

    const tasks = extractedTasks.filter(t => {
        const taskContext = String(t.contextCode || '').toLowerCase().trim();
        if (taskContext && selectedContextCodes.has(taskContext)) return true;

        const taskCourse = String(t.course || '').toLowerCase().trim();
        if (taskCourse && selectedCourseNames.has(taskCourse)) return true;

        // Keep uncategorized tasks so they are not accidentally dropped.
        return !taskContext && (!taskCourse || taskCourse === 'general');
    });

    return { tasks, courses: selectedCourses };
}

function renderCourseSelectors(courses, onChange) {
    const panel = document.getElementById('courseFilterPanel');
    const list = document.getElementById('courseSelectionList');
    const selectAllBtn = document.getElementById('selectAllCourses');
    const clearAllBtn = document.getElementById('clearAllCourses');

    if (!panel || !list) return;
    list.innerHTML = '';

    if (!Array.isArray(courses) || courses.length === 0) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';

    courses.forEach(course => {
        const key = getCourseKey(course);
        const label = document.createElement('label');
        label.className = 'course-option';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = selectedCourseCodes.has(key);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) selectedCourseCodes.add(key);
            else selectedCourseCodes.delete(key);
            onChange();
        });

        const text = document.createElement('span');
        const schedule = course.scheduleText ? ` (${course.scheduleText})` : '';
        text.textContent = `${course.name}${schedule}`;

        label.appendChild(checkbox);
        label.appendChild(text);
        list.appendChild(label);
    });

    selectAllBtn.onclick = () => {
        selectedCourseCodes = new Set(courses.map(getCourseKey));
        onChange();
    };

    clearAllBtn.onclick = () => {
        selectedCourseCodes = new Set();
        onChange();
    };
}

function isCanvasUrl(url) {
        if (!url) return false;
        // Support instructure.com AND institutional Canvas domains (canvas.wayne.edu, etc)
        return /https?:\/\/([^/]*instructure\.com|.*canvas.*)\//.test(url);
}

function setExtractAvailability(isAvailable) {
        const extractBtn = document.getElementById('extractBtn');
        const extractBtnGuest = document.getElementById('extractBtnGuest');
        const emptyState = document.getElementById('emptyState');
        if (!extractBtn && !extractBtnGuest) return;

        if (extractBtn) {
            extractBtn.disabled = !isAvailable;
            extractBtn.textContent = isAvailable ? 'Extract Courses and Tasks' : 'Open Canvas to Extract';
        }
        if (extractBtnGuest) {
            extractBtnGuest.disabled = !isAvailable;
            extractBtnGuest.textContent = isAvailable ? 'Extract Courses and Tasks' : 'Open Canvas to Extract';
        }

        if (!isAvailable && emptyState) {
                emptyState.style.display = 'block';
                emptyState.innerHTML = `
                    <h3>Open a Canvas Page</h3>
                    <div class="steps">
                        <div class="step">
                            <span class="step-index">1</span>
                            <div><strong>Go to Canvas</strong> in another tab.</div>
                        </div>
                        <div class="step">
                            <span class="step-index">2</span>
                            <div><strong>Open Calendar or Assignments</strong> for best extraction results.</div>
                        </div>
                        <div class="step">
                            <span class="step-index">3</span>
                            <div><strong>Re-open this popup</strong> and run extract.</div>
                        </div>
                    </div>
                `;
        }
}

// ── UI helpers ──
function showStatus(message, type) {
    const el = document.getElementById('status');
    el.textContent = message;
    el.className = `status ${type}`;
}

function showPanel(loggedIn, email) {
    document.getElementById('loginPanel').style.display = loggedIn ? 'none' : 'block';
    document.getElementById('mainPanel').style.display = loggedIn ? 'block' : 'none';
    if (loggedIn && email) {
        document.getElementById('userEmail').textContent = email;
        document.getElementById('userAvatar').textContent = email[0].toUpperCase();
    }
}

// ── Auth ──
async function login(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Login failed');
    return { userId: data.user.id, email: data.user.email, accessToken: data.access_token };
}

// ── On load: check if already logged in ──
document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const activeTab = tabs?.[0];
        const available = isCanvasUrl(activeTab?.url || '');
        setExtractAvailability(available);
    });

    chrome.storage.local.get(['userId', 'userEmail'], result => {
        if (result.userId && result.userEmail) {
            showPanel(true, result.userEmail);
        } else {
            showPanel(false);
        }
    });

    // ── Login button ──
    document.getElementById('loginBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('loginBtn');
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showStatus('Please enter your email and password.', 'error');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Logging in...';
        showStatus('', '');

        try {
            const { userId, email: userEmail } = await login(email, password);
            chrome.storage.local.set({ userId, userEmail }, () => {
                showPanel(true, userEmail);
                showStatus('Logged in successfully!', 'success');
                setTimeout(() => { document.getElementById('status').className = 'status'; }, 2000);
            });
        } catch (err) {
            showStatus(`Login failed: ${err.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Log In to 11Planner';
        }
    });

    // ── Logout button ──
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        chrome.storage.local.remove(['userId', 'userEmail'], () => {
            showPanel(false);
            document.getElementById('status').className = 'status';
            extractedTasks = [];
            extractedCourses = [];
            selectedCourseCodes = new Set();
            document.getElementById('preview').style.display = 'none';
            document.getElementById('syncBtn').style.display = 'none';
            const filterPanel = document.getElementById('courseFilterPanel');
            if (filterPanel) filterPanel.style.display = 'none';
            const emptyState = document.getElementById('emptyState');
            if (emptyState) emptyState.style.display = 'block';
        });
    });

    // ── Preview renderer ──
    function renderPreview(tasks, courses) {
        const preview = document.getElementById('preview');
        const emptyState = document.getElementById('emptyState');
        const list = document.getElementById('previewList');
        const courseList = document.getElementById('courseList');
        const syncCount = document.getElementById('syncCount');
        const courseCount = document.getElementById('courseCount');
        const syncBtn = document.getElementById('syncBtn');

        list.innerHTML = '';
        courseList.innerHTML = '';

        const { tasks: filteredTasks, courses: filteredCourses } = getFilteredSyncData();
        if (tasks.length === 0) {
            preview.style.display = 'none';
            syncBtn.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        filteredTasks.forEach(a => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            let dueStr;
            if (a.dueDate) {
                const d = new Date(a.dueDate);
                dueStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            } else {
                dueStr = 'No date found';
            }
                        const estHours = Number.isFinite(a.estimatedHours) ? `${a.estimatedHours.toFixed(1)}h` : '1.0h';
            const priority = Number.isFinite(a.priorityLevel) ? a.priorityLevel : 3;
            item.innerHTML = `
          <div class="title">${a.title}</div>
          <div class="meta" style="color:${a.dueDate ? '' : '#ef4444'}">${a.course || 'Unknown'} · ${dueStr}</div>
                    <div class="meta">Estimated: ${estHours} · Priority: ${priority}/5</div>
        `;
            list.appendChild(item);
        });

        filteredCourses.forEach(c => {
            const chip = document.createElement('span');
            chip.className = 'course-chip';
            chip.textContent = c.name;
            courseList.appendChild(chip);
        });

        renderCourseSelectors(courses, () => renderPreview(extractedTasks, extractedCourses));

        preview.style.display = 'block';
        syncCount.textContent = filteredTasks.length;
        courseCount.textContent = filteredCourses.length;
        syncBtn.style.display = 'block';
    }

    async function runExtract(btn) {

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id || !isCanvasUrl(tab.url || '')) {
            showStatus('Open a Canvas tab (instructure.com) to extract assignments.', 'error');
            setExtractAvailability(false);
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Extracting...';
        showStatus('Scanning this Canvas page...', 'info');

        try {
            await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });

            chrome.tabs.sendMessage(tab.id, { action: 'extract' }, response => {
                if (chrome.runtime.lastError || !response) {
                    const detail = chrome.runtime.lastError?.message || 'No extraction response';
                    showStatus(`Could not extract. ${detail}`, 'error');
                    btn.disabled = false;
                    btn.textContent = 'Extract Courses and Tasks';
                    return;
                }
                extractedTasks = response.assignments || [];
                extractedCourses = response.courses || [];
                selectedCourseCodes = new Set(extractedCourses.map(getCourseKey));
                if (extractedTasks.length === 0) {
                    showStatus('No tasks found on this page.', 'info');
                } else {
                    showStatus(`Found ${extractedTasks.length} task(s) and ${extractedCourses.length} course(s).`, 'success');
                }
                renderPreview(extractedTasks, extractedCourses);
                btn.disabled = false;
                btn.textContent = 'Extract Courses and Tasks';
            });
        } catch (err) {
            showStatus(`Error: ${err.message}`, 'error');
            btn.disabled = false;
            btn.textContent = 'Extract Courses and Tasks';
        }
    }

    // ── Extract buttons (logged-in + guest) ──
    document.getElementById('extractBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('extractBtn');
        await runExtract(btn);
    });

    document.getElementById('extractBtnGuest')?.addEventListener('click', async () => {
        const btn = document.getElementById('extractBtnGuest');
        await runExtract(btn);
    });

    // ── Sync button ──
    document.getElementById('syncBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('syncBtn');
        btn.disabled = true;
        showStatus('Syncing to 11Planner...', 'info');

        const { tasks, courses } = getFilteredSyncData();
        if (tasks.length === 0) {
            showStatus('No tasks selected to sync. Choose at least one course.', 'error');
            btn.disabled = false;
            return;
        }

        chrome.runtime.sendMessage({ action: 'sync', assignments: tasks, courses }, response => {
            if (chrome.runtime.lastError || !response) {
                const detail = chrome.runtime.lastError?.message || 'No sync response';
                showStatus(`Sync failed: ${detail}`, 'error');
                btn.disabled = false;
                return;
            }
            if (response.success) {
                showStatus(response.message || `Synced ${response.count} tasks!`, 'success');
            } else {
                showStatus(response.error, 'error');
            }
            btn.disabled = false;
        });
    });

}); // end DOMContentLoaded
