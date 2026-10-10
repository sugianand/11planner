/**
 * 11Planner Canvas Extension – Background Service Worker
 * Receives extracted assignments from the popup and POSTs them to the backend API.
 */

const DEFAULT_API_URL = 'https://my11planner-api.vercel.app';
const SUPABASE_URL = 'https://zweedoinjlbwnqyuwqlk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RlOKu6hZUuYakoIlkBfo4g_vkm0yg0J';

// Generates a PKCE verifier and challenge pair for Supabase OAuth.
async function generatePKCE() {
    const array = new Uint8Array(96);
    crypto.getRandomValues(array);
    const verifier = btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return { verifier, challenge };
}

// Wraps chrome.identity.launchWebAuthFlow in a Promise.
function launchOAuthFlow(authUrl) {
    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
            { url: authUrl, interactive: true },
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
    // NOTE: https://*.chromiumapp.org/** must be added to Supabase's
    // Authentication → URL Configuration → Redirect URLs allowlist.
    const redirectUri = chrome.identity.getRedirectURL('supabase-auth');
    const { verifier, challenge } = await generatePKCE();

    const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google` +
        `&redirect_to=${encodeURIComponent(redirectUri)}` +
        `&code_challenge=${challenge}` +
        `&code_challenge_method=S256`;

    const responseUrl = await launchOAuthFlow(authUrl);

    const parsedUrl = new URL(responseUrl);
    const code = parsedUrl.searchParams.get('code');
    const oauthError = parsedUrl.searchParams.get('error_description') || parsedUrl.searchParams.get('error');

    if (oauthError) {
        throw new Error(decodeURIComponent(oauthError));
    }

    if (!code) {
        throw new Error('Google login did not return an authorization code. Make sure the chromiumapp.org redirect URL is added to Supabase.');
    }

    // Exchange the authorization code for an access token using PKCE.
    const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || tokenData.message || 'Token exchange failed.');
    }

    return {
        userId: tokenData.user.id,
        userEmail: tokenData.user.email,
        accessToken: tokenData.access_token,
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
