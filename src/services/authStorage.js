// Centralized auth-session storage.
//
// PROBLEM THIS SOLVES
// --------------------
// The app previously stored the logged-in user (incl. JWT) in
// `localStorage`. localStorage is shared across every tab of the same
// browser/origin. That meant: log in as a customer in Tab A, then log in
// as a farmer in Tab B → Tab A's session was silently overwritten too,
// because both tabs read/write the exact same localStorage key. Switching
// back to Tab A would show you logged in as the farmer.
//
// FIX
// ---
// `sessionStorage` is scoped to a single tab (browsing context) even
// though it's same-origin — this is exactly the browser primitive meant
// for "keep this tab's session independent of other tabs". We use it as
// the source of truth for the *current tab's* session.
//
// To still support "Remember Me" (staying logged in after closing the
// browser / opening a brand-new tab), we optionally mirror the session
// into `localStorage` as a template. That template is only ever COPIED
// into a tab's sessionStorage once, the first time that tab loads with no
// session of its own — it is never used to silently overwrite a tab that
// already has an active session. So:
//
//   - Tab A logs in as customer (Remember Me checked)
//   - Tab B is opened fresh -> hydrates from the remembered customer session
//   - Tab B logs in as farmer instead -> only Tab B's sessionStorage changes
//   - Tab A is untouched and still shows the customer session
//   - Logging out clears both the current tab's session AND the
//     remembered template, since "log out" should mean fully signed out.

const SESSION_KEY = 'user';
const REMEMBERED_KEY = 'rememberedUser';

let hydrated = false;

/**
 * Ensure this tab's sessionStorage has been hydrated from a remembered
 * (localStorage) session exactly once. Safe to call multiple times.
 */
function hydrateFromRememberedIfEmpty() {
  if (hydrated) return;
  hydrated = true;

  try {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      const remembered = localStorage.getItem(REMEMBERED_KEY);
      if (remembered) {
        sessionStorage.setItem(SESSION_KEY, remembered);
      }
    }
  } catch {
    // sessionStorage/localStorage can throw in some privacy modes — fail silently
  }
}

/**
 * Get the current tab's logged-in user (or null).
 */
export function getSessionUser() {
  hydrateFromRememberedIfEmpty();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persist a freshly logged-in / registered user for THIS tab.
 * If rememberMe is true, also save a template other new tabs can hydrate from.
 */
export function setSessionUser(user, rememberMe = false) {
  hydrated = true; // this tab now has an explicit session, don't hydrate over it later
  const serialized = JSON.stringify(user);
  try {
    sessionStorage.setItem(SESSION_KEY, serialized);
    if (rememberMe) {
      localStorage.setItem(REMEMBERED_KEY, serialized);
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Update fields on the currently logged-in user (e.g. after editing a
 * profile) without disturbing other tabs' sessions.
 */
export function updateSessionUser(partialUpdate) {
  const current = getSessionUser();
  if (!current) return null;
  const updated = { ...current, ...partialUpdate };
  const serialized = JSON.stringify(updated);
  try {
    sessionStorage.setItem(SESSION_KEY, serialized);
    // Keep the "remember me" template in sync ONLY if it currently
    // represents this same account, so we don't leak one tab's edits
    // into another tab's remembered account.
    const remembered = localStorage.getItem(REMEMBERED_KEY);
    if (remembered) {
      try {
        const rememberedUser = JSON.parse(remembered);
        if (rememberedUser?._id === updated._id) {
          localStorage.setItem(REMEMBERED_KEY, serialized);
        }
      } catch {
        // ignore malformed remembered data
      }
    }
  } catch {
    // ignore storage errors
  }
  return updated;
}

/**
 * Fully log out of THIS tab, and forget any "Remember Me" template too —
 * logging out should mean actually logging out.
 */
export function clearSessionUser() {
  hydrated = true;
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMEMBERED_KEY);
  } catch {
    // ignore storage errors
  }
}
