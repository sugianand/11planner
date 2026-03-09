/**
 * 11Planner Canvas Extension – Popup Script
 */

let extractedAssignments = [];

function showStatus(message, type) {
    const el = document.getElementById('status');
    el.textContent = message;
    el.className = `status ${type}`;
}

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
      <div class="meta" style="color:${a.dueDate ? '' : 'red'}">${a.course || 'Unknown course'} · ${dueStr}${a.points ? ` · ${a.points} pts` : ''}</div>
    `;
        list.appendChild(item);
    });

    preview.style.display = 'block';
    syncCount.textContent = assignments.length;
    syncBtn.style.display = 'block';
}

// Load saved settings
async function loadSettings() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, settings => {
        if (settings.backendUrl) document.getElementById('backendUrl').value = settings.backendUrl;
        if (settings.userId) document.getElementById('userId').value = settings.userId;
    });
}

// Extract button
document.getElementById('extractBtn').addEventListener('click', async () => {
    const btn = document.getElementById('extractBtn');
    btn.disabled = true;
    btn.textContent = 'Extracting…';
    showStatus('Scanning this Canvas page for assignments…', 'info');

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Inject content.js directly into the active tab — works on ANY Canvas domain
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
        });

        // Now send the extract message
        chrome.tabs.sendMessage(tab.id, { action: 'extract' }, response => {
            if (chrome.runtime.lastError || !response) {
                showStatus('Could not extract. Make sure you are on a Canvas page (assignments, calendar, or dashboard).', 'error');
                btn.disabled = false;
                btn.textContent = '🎓 Extract Assignments';
                return;
            }

            extractedAssignments = response.assignments || [];
            if (extractedAssignments.length === 0) {
                showStatus('No assignments found. Try the Canvas Assignments page (/assignments) for better results.', 'info');
            } else {
                showStatus(`Found ${extractedAssignments.length} assignment(s). Review and sync below.`, 'success');
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

// Sync button
document.getElementById('syncBtn').addEventListener('click', async () => {
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

// Save settings
document.getElementById('saveSettings').addEventListener('click', () => {
    const backendUrl = document.getElementById('backendUrl').value.trim() || 'http://localhost:8000';
    const userId = document.getElementById('userId').value.trim();
    chrome.runtime.sendMessage({ action: 'saveSettings', backendUrl, userId }, () => {
        showStatus('Settings saved!', 'success');
        setTimeout(() => { document.getElementById('status').style.display = 'none'; }, 2000);
    });
});

// Debug DOM button — dumps raw Canvas agenda HTML into the textarea
document.getElementById('debugBtn').addEventListener('click', async () => {
    const out = document.getElementById('debugOut');
    out.style.display = 'block';
    out.value = 'Running…';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const lines = [];
                const days = document.querySelectorAll('tr.fc-list-day');
                const items = document.querySelectorAll('tr.fc-list-item');
                lines.push(`fc-list-day rows: ${days.length}`);
                lines.push(`fc-list-item rows: ${items.length}`);

                if (days.length > 0) {
                    const d = days[0];
                    const attrs = [...d.attributes].map(a => `${a.name}="${a.value}"`).join(' ');
                    lines.push(`\nDay[0] attrs: ${attrs}`);
                    lines.push(`Day[0] HTML: ${d.innerHTML.slice(0, 400)}`);
                }
                if (items.length > 0) {
                    const item = items[0];
                    const attrs = [...item.attributes].map(a => `${a.name}="${a.value}"`).join(' ');
                    lines.push(`\nItem[0] attrs: ${attrs}`);
                    lines.push(`Item[0] HTML: ${item.innerHTML.slice(0, 400)}`);
                }

                // data-date anywhere
                const withDate = document.querySelectorAll('[data-date]');
                lines.push(`\nElements [data-date]: ${withDate.length}`);
                [...withDate].slice(0, 3).forEach((el, i) => {
                    lines.push(`  [${i}] <${el.tagName}.${el.className.split(' ')[0]}> data-date="${el.getAttribute('data-date')}"`);
                });

                return lines.join('\n');
            }
        });

        out.value = results[0]?.result || 'No result';
    } catch (err) {
        out.value = `Error: ${err.message}`;
    }
});

// Init
loadSettings();
