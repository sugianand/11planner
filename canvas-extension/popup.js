/**
 * 11Planner Canvas Extension – Popup Script
 * Handles login via Supabase Auth and task extraction/sync.
 */

// ── Supabase config (anon key is safe to embed in client code) ──
const SUPABASE_URL = 'https://ddszcujvbvvihwsrkzsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkc3pjdWp2YnZ2aWh3c3JrenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjIzNDYsImV4cCI6MjA4NTczODM0Nn0.HfSG1DHiGG3Riv_JVFvFBWJggy40tPS4iAavIDKjs1o';

let extractedTasks = [];
let extractedCourses = [];

function isCanvasUrl(url) {
        if (!url) return false;
        return /https?:\/\/[^/]*instructure\.com\//i.test(url);
}

function setExtractAvailability(isAvailable) {
        const extractBtn = document.getElementById('extractBtn');
        const emptyState = document.getElementById('emptyState');
        if (!extractBtn) return;

        extractBtn.disabled = !isAvailable;
        extractBtn.textContent = isAvailable ? 'Extract Courses and Tasks' : 'Open Canvas to Extract';

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
            document.getElementById('preview').style.display = 'none';
            document.getElementById('syncBtn').style.display = 'none';
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
        if (tasks.length === 0) {
            preview.style.display = 'none';
            syncBtn.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        tasks.forEach(a => {
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

        courses.forEach(c => {
            const chip = document.createElement('span');
            chip.className = 'course-chip';
            chip.textContent = c.name;
            courseList.appendChild(chip);
        });

        preview.style.display = 'block';
        syncCount.textContent = tasks.length;
        courseCount.textContent = courses.length;
        syncBtn.style.display = 'block';
    }

    // ── Extract button ──
    document.getElementById('extractBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('extractBtn');

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
                    showStatus('Could not extract. Make sure you are on a Canvas page.', 'error');
                    btn.disabled = false;
                    btn.textContent = 'Extract Courses and Tasks';
                    return;
                }
                extractedTasks = response.assignments || [];
                extractedCourses = response.courses || [];
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
    });

    // ── Sync button ──
    document.getElementById('syncBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('syncBtn');
        btn.disabled = true;
        showStatus('Syncing to 11Planner...', 'info');

        chrome.runtime.sendMessage({ action: 'sync', assignments: extractedTasks, courses: extractedCourses }, response => {
            if (response.success) {
                showStatus(response.message || `Synced ${response.count} tasks!`, 'success');
            } else {
                showStatus(response.error, 'error');
            }
            btn.disabled = false;
        });
    });

}); // end DOMContentLoaded
