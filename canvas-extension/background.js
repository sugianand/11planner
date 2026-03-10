/**
 * 11Planner Canvas Extension – Background Service Worker
 * Receives extracted assignments from the popup and POSTs them to the backend API.
 */

const DEFAULT_API_URL = 'http://localhost:8000';

// Read settings from storage
async function getSettings() {
    return new Promise(resolve => {
        chrome.storage.local.get(['backendUrl', 'userId'], result => {
            resolve({
                backendUrl: result.backendUrl || DEFAULT_API_URL,
                userId: result.userId || '',
            });
        });
    });
}

// POST assignments to the 11Planner backend
async function syncAssignments(assignments) {
    const { backendUrl, userId } = await getSettings();

    console.log('[11Planner] Sync settings:', { backendUrl, userId });
    console.log('[11Planner] Syncing', assignments.length, 'assignments');

    if (!userId || userId.trim() === '') {
        return { success: false, error: 'No user ID set. Open settings (⚙️) and paste your Supabase user UUID.' };
    }

    const body = JSON.stringify({ userId: userId.trim(), assignments });

    // Remove any trailing slashes from the configured backend URL to prevent //api paths
    const cleanUrl = backendUrl.replace(/\/+$/, '');
    
    // Try both localhost and 127.0.0.1 (Chrome MV3 service workers sometimes can't resolve localhost DNS)
    const urlsToTry = [
        `${cleanUrl}/api/assignments/sync`,
        `${cleanUrl.replace('localhost', '127.0.0.1')}/api/assignments/sync`,
    ];

    let lastErr = null;
    for (const url of urlsToTry) {
        try {
            console.log('[11Planner] Trying:', url);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            });

            const text = await response.text();
            console.log('[11Planner] Response status:', response.status, 'body:', text);

            if (!response.ok) {
                return { success: false, error: `Server error ${response.status}: ${text}` };
            }

            let result;
            try { result = JSON.parse(text); } catch { result = { count: 0, message: text }; }
            return { success: true, count: result.count, message: result.message };

        } catch (err) {
            console.warn('[11Planner] Fetch failed for', url, ':', err.message);
            lastErr = err;
        }
    }

    return {
        success: false,
        error: `Could not reach backend. Make sure uvicorn is running on port 8000. (${lastErr?.message})`
    };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'sync') {
        syncAssignments(message.assignments).then(sendResponse);
        return true; // keep channel open
    }
    if (message.action === 'saveSettings') {
        chrome.storage.local.set({
            backendUrl: message.backendUrl,
            userId: message.userId,
        }, () => sendResponse({ success: true }));
        return true;
    }
    if (message.action === 'getSettings') {
        getSettings().then(sendResponse);
        return true;
    }
});
