/**
 * 11Planner Canvas Extension – Background Service Worker
 * Receives extracted assignments from the popup and POSTs them to the backend API.
 */

const DEFAULT_API_URL = 'http://localhost:8000';
const SUPABASE_URL = 'https://ddszcujvbvvihwsrkzsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkc3pjdWp2YnZ2aWh3c3JrenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjIzNDYsImV4cCI6MjA4NTczODM0Nn0.HfSG1DHiGG3Riv_JVFvFBWJggy40tPS4iAavIDKjs1o';

function parseHashParams(url) {
    const hash = new URL(url).hash.replace(/^#/, '');
    return new URLSearchParams(hash);
}

function launchOAuthFlow(authUrl) {
    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
            {
                url: authUrl,
                interactive: true,
            },
            (responseUrl) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message || 'Google login was cancelled.'));
                    return;
                }
                if (!responseUrl) {
                    reject(new Error('No OAuth response URL returned.'));
                    return;
                }
                resolve(responseUrl);
            }
        );
    });
}

async function loginWithGoogleOAuth() {
    // Use the canonical extension OAuth callback URL so Supabase can return
    // directly to the extension flow instead of falling back to site URL.
    const redirectUri = chrome.identity.getRedirectURL();
    const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}&response_type=token`;

    const responseUrl = await launchOAuthFlow(authUrl);
    const params = parseHashParams(responseUrl);
    const accessToken = params.get('access_token');
    const oauthError = params.get('error_description') || params.get('error');

    if (oauthError) {
        throw new Error(oauthError);
    }

    if (!accessToken) {
        throw new Error('Google login did not return an access token.');
    }

    const profileRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const profile = await profileRes.json();
    if (!profileRes.ok || !profile?.id || !profile?.email) {
        throw new Error(profile?.message || 'Could not load your profile after Google login.');
    }

    return {
        userId: profile.id,
        userEmail: profile.email,
        accessToken,
    };
}

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
    // Runs Google OAuth login through Chrome Identity API from background context.
    if (message.action === 'googleOAuthLogin') {
        loginWithGoogleOAuth()
            .then(sendResponse)
            .catch(err => sendResponse({ error: err.message || 'Google login failed.' }));
        return true;
    }
});
