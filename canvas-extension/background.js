/**
 * 11Planner Canvas Extension – Background Service Worker
 * Receives extracted assignments from the popup and POSTs them to the backend API.
 */

const DEFAULT_API_URL = 'http://localhost:8000';

// Retrieves user settings (backend URL, user ID) from Chrome storage
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

// Sends extracted assignments and courses to 11Planner backend API
// Attempts multiple URLs to handle DNS resolution issues
async function syncAssignments(assignments, courses = []) {
    const { backendUrl, userId } = await getSettings();
    const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;

    console.log('[11Planner] Sync settings:', { backendUrl, userId, clientTimeZone });
    console.log('[11Planner] Syncing', assignments.length, 'assignments and', courses.length, 'courses');

    // Validates that a user ID is set before attempting sync
    if (!userId || userId.trim() === '') {
        return { success: false, error: 'No user ID set. Open settings (⚙️) and paste your Supabase user UUID.' };
    }

    const body = JSON.stringify({
        userId: userId.trim(),
        assignments,
        courses,
        clientTimeZone,
    });

    // Normalizes the backend URL and prepares multiple retry URLs
    // (Chrome MV3 sometimes has DNS resolution issues with localhost)
    const cleanUrl = backendUrl.replace(/\/+$/, '');
    
    // Tries multiple endpoint variations to maximize compatibility
    const urlsToTry = [
        `${cleanUrl}/api/tasks/sync`,
        `${cleanUrl.replace('localhost', '127.0.0.1')}/api/tasks/sync`,
        // Backward-compatible fallback
        `${cleanUrl}/api/assignments/sync`,
        `${cleanUrl.replace('localhost', '127.0.0.1')}/api/assignments/sync`,
    ];

    // Attempts each URL in sequence until one succeeds
    let lastErr = null;
    for (const url of urlsToTry) {
        try {
            console.log('[11Planner] Trying:', url);
            // Sends the sync request to the backend
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            });

            const text = await response.text();
            console.log('[11Planner] Response status:', response.status, 'body:', text);

            // Returns error if server returns non-OK status
            if (!response.ok) {
                return { success: false, error: `Server error ${response.status}: ${text}` };
            }

            // Parses response and returns success
            let result;
            try { result = JSON.parse(text); } catch { result = { count: 0, message: text }; }
            return { success: true, count: result.count, message: result.message };

        } catch (err) {
            console.warn('[11Planner] Fetch failed for', url, ':', err.message);
            lastErr = err;
        }
    }

    // Returns error if all URLs failed
    return {
        success: false,
        error: `Could not reach backend. Make sure uvicorn is running on port 8000. (${lastErr?.message})`
    };
}

// Handles messages from the popup: sync, saveSettings, getSettings
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // Handles sync request: sends assignments and courses to backend
    if (message.action === 'sync') {
        syncAssignments(message.assignments, message.courses || []).then(sendResponse);
        return true; // keep channel open
    }
    // Saves user settings (backend URL, user ID) to storage
    if (message.action === 'saveSettings') {
        chrome.storage.local.set({
            backendUrl: message.backendUrl,
            userId: message.userId,
        }, () => sendResponse({ success: true }));
        return true;
    }
    // Retrieves user settings from storage
    if (message.action === 'getSettings') {
        getSettings().then(sendResponse);
        return true;
    }
});
