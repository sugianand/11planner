/**
 * 11Planner Canvas Extension – Popup Script
 * Handles login via Supabase Auth and assignment extraction/sync.
 */

// ── Supabase config (anon key is safe to embed in client code) ──
const SUPABASE_URL = 'https://ddszcujvbvvihwsrkzsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkc3pjdWp2YnZ2aWh3c3JrenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjIzNDYsImV4cCI6MjA4NTczODM0Nn0.HfSG1DHiGG3Riv_JVFvFBWJggy40tPS4iAavIDKjs1o';

let extractedAssignments = [];

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
    chrome.storage.local.get(['userId', 'userEmail', 'backendUrl'], result => {
        if (result.userId && result.userEmail) {
            showPanel(true, result.userEmail);
        } else {
            showPanel(false);
        }
        const backendEl = document.getElementById('backendUrl');
        if (result.backendUrl && backendEl) backendEl.value = result.backendUrl;
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
        btn.textContent = 'Logging in…';
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
            btn.textContent = '🔑 Log In to 11Planner';
        }
    });

    // ── Logout button ──
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        chrome.storage.local.remove(['userId', 'userEmail'], () => {
            showPanel(false);
            document.getElementById('status').className = 'status';
            extractedAssignments = [];
            document.getElementById('preview').style.display = 'none';
            document.getElementById('syncBtn').style.display = 'none';
        });
    });

    // ── Preview renderer ──
    function renderPreview(assignments) {
        const preview = document.getElementById('preview');
        const list = document.getElementById('previewList');
        const syncCount = document.getElementById('syncCount');
        const syncBtn = document.getElementById('syncBtn');

        list.innerHTML = '';
        if (assignments.length === 0) {
            preview.style.display = 'none';
            syncBtn.style.display = 'none';
            return;
        }

        assignments.forEach(a => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            let dueStr;
            if (a.dueDate) {
                const d = new Date(a.dueDate);
                dueStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            } else {
                dueStr = '⚠️ No date found';
            }
            item.innerHTML = `
          <div class="title">${a.title}</div>
          <div class="meta" style="color:${a.dueDate ? '' : '#ef4444'}">${a.course || 'Unknown'} · ${dueStr}</div>
        `;
            list.appendChild(item);
        });

        preview.style.display = 'block';
        syncCount.textContent = assignments.length;
        syncBtn.style.display = 'block';
    }

    // ── Extract button ──
    document.getElementById('extractBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('extractBtn');
        btn.disabled = true;
        btn.textContent = 'Extracting…';
        showStatus('Scanning this Canvas page…', 'info');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });

            chrome.tabs.sendMessage(tab.id, { action: 'extract' }, response => {
                if (chrome.runtime.lastError || !response) {
                    showStatus('Could not extract. Make sure you are on a Canvas page.', 'error');
                    btn.disabled = false;
                    btn.textContent = '🎓 Extract Assignments';
                    return;
                }
                extractedAssignments = response.assignments || [];
                if (extractedAssignments.length === 0) {
                    showStatus('No assignments found on this page.', 'info');
                } else {
                    showStatus(`Found ${extractedAssignments.length} assignment(s).`, 'success');
                }
                renderPreview(extractedAssignments);
                btn.disabled = false;
                btn.textContent = '🎓 Extract Assignments';
            });
        } catch (err) {
            showStatus(`Error: ${err.message}`, 'error');
            btn.disabled = false;
            btn.textContent = '🎓 Extract Assignments';
        }
    });

    // ── Sync button ──
    document.getElementById('syncBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('syncBtn');
        btn.disabled = true;
        showStatus('Syncing to 11Planner…', 'info');

        chrome.runtime.sendMessage({ action: 'sync', assignments: extractedAssignments }, response => {
            if (response.success) {
                showStatus(`✅ ${response.message || `Synced ${response.count} assignments!`}`, 'success');
            } else {
                showStatus(`❌ ${response.error}`, 'error');
            }
            btn.disabled = false;
        });
    });

    // ── Save settings ──
    document.getElementById('saveSettings')?.addEventListener('click', () => {
        const backendUrl = document.getElementById('backendUrl')?.value?.trim() || 'http://localhost:8000';
        chrome.storage.local.set({ backendUrl }, () => {
            showStatus('Settings saved!', 'success');
            setTimeout(() => { document.getElementById('status').className = 'status'; }, 2000);
        });
    });

}); // end DOMContentLoaded
