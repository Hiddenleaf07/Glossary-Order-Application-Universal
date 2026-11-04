(function () {
  const CONFIG_KEY = 'grocery_github_sync_config';
  let syncTimer;
  let syncInProgress = false;
  let syncQueued = false;

  function getGitHubSyncConfig() {
    return readStoredJson(CONFIG_KEY, {});
  }

  function setGitHubSyncConfig(config) {
    writeStoredJson(CONFIG_KEY, config);
  }

  function encodedContent(snapshot) {
    const content = JSON.stringify({
      ...snapshot,
      copyright: 'hiddenleaf07/GitHub.com',
      updatedAt: new Date().toISOString()
    }, null, 2);
    return btoa(unescape(encodeURIComponent(content)));
  }

  async function syncSnapshotToGitHub(snapshot) {
    const config = getGitHubSyncConfig();
    if (!config.token || !config.owner || !config.repo || !config.path) return;
    if (syncInProgress) {
      syncQueued = true;
      return;
    }

    syncInProgress = true;
    try {
      const apiUrl = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${config.path.split('/').map(encodeURIComponent).join('/')}`;
      const headers = {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${config.token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      };
      const current = await fetch(`${apiUrl}?ref=${encodeURIComponent(config.branch || 'main')}`, { headers });
      let sha;
      if (current.ok) sha = (await current.json()).sha;
      else if (current.status !== 404) throw new Error(`GitHub read failed (${current.status}).`);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Update grocery application data (${new Date().toISOString()})`,
          content: encodedContent(snapshot),
          branch: config.branch || 'main',
          ...(sha ? { sha } : {})
        })
      });
      if (!response.ok) throw new Error(`GitHub commit failed (${response.status}).`);
      localStorage.setItem('grocery_github_last_sync', new Date().toISOString());
    } catch (error) {
      console.error('GitHub synchronization failed.', error);
      alert(`Local changes were saved, but GitHub synchronization failed: ${error.message}`);
    } finally {
      syncInProgress = false;
      if (syncQueued) {
        syncQueued = false;
        scheduleGitHubSync(snapshot);
      }
    }
  }

  function scheduleGitHubSync(snapshot) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncSnapshotToGitHub(snapshot), 800);
  }

  window.getGitHubSyncConfig = getGitHubSyncConfig;
  window.setGitHubSyncConfig = setGitHubSyncConfig;
  window.scheduleGitHubSync = scheduleGitHubSync;
})();
