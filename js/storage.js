(function () {
  const STORAGE_PREFIX = 'grocery_';

  function readStoredJson(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn(`Unable to read stored value for ${key}; using defaults.`, error);
      return fallback;
    }
  }

  function writeStoredJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Unable to persist ${key}.`, error);
      alert('Your changes could not be saved in this browser. Please free storage space and try again.');
      return false;
    }
  }

  function persistAppState() {
    const snapshot = typeof window.getAppState === 'function'
      ? window.getAppState()
      : {};
    writeStoredJson(`${STORAGE_PREFIX}state_snapshot`, {
      ...snapshot,
      savedAt: new Date().toISOString()
    });
    if (typeof scheduleGitHubSync === 'function') scheduleGitHubSync(snapshot);
  }

  window.readStoredJson = readStoredJson;
  window.writeStoredJson = writeStoredJson;
  window.persistAppState = persistAppState;
})();
