(function () {
  const CACHE_KEY = 'grocery_image_search_cache_v1';
  const FALLBACK_KEY = 'grocery_image_fallback_v1';

  function readCache() {
    return readStoredJson(CACHE_KEY, {});
  }

  function cacheKey(query) {
    return query.trim().toLowerCase();
  }

  function fallbackImageDataUrl(label) {
    const safeLabel = String(label || 'Image').slice(0, 30);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="#e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" fill="#475569">${safeLabel.replace(/[<&>"]/g, '')}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  async function searchGoogleImage(query) {
    const normalized = cacheKey(query);
    if (!normalized) throw new Error('Enter an image search term first.');

    const cache = readCache();
    if (cache[normalized]?.url) return {
      ...cache[normalized],
      url: cache[normalized].dataUrl || cache[normalized].url
    };

    const apiKey = localStorage.getItem('google_image_api_key');
    const searchEngineId = localStorage.getItem('google_image_search_engine_id');
    if (!apiKey || !searchEngineId) {
      throw new Error('Configure a Google Image Search API key and Search Engine ID in Settings first.');
    }

    const endpoint = new URL('https://www.googleapis.com/customsearch/v1');
    endpoint.search = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: normalized,
      searchType: 'image',
      num: '1',
      safe: 'active'
    });

    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Google Image Search failed (${response.status}).`);
    const payload = await response.json();
    const result = payload.items?.[0];
    if (!result?.link) throw new Error('Google Image Search returned no images.');

    const image = {
      url: result.link,
      title: result.title || normalized,
      source: 'Google Custom Search',
      cachedAt: new Date().toISOString()
    };
    try {
      const imageResponse = await fetch(result.link, { mode: 'cors' });
      if (imageResponse.ok) {
        const blob = await imageResponse.blob();
        image.dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.info('Image binary could not be cached; retaining the source URL.', error);
    }
    cache[normalized] = image;
    writeStoredJson(CACHE_KEY, cache);
    return { ...image, url: image.dataUrl || image.url };
  }

  function applyImageFallback(imgEl, category, name) {
    if (imgEl.dataset.fallbackApplied === 'true') {
      imgEl.parentNode.innerHTML = getItemCategorySvg(category, name);
      if (window.lucide) lucide.createIcons();
      return;
    }
    imgEl.dataset.fallbackApplied = 'true';
    imgEl.src = fallbackImageDataUrl(name || category || 'Grocery');
  }

  window.searchGoogleImage = searchGoogleImage;
  window.applyImageFallback = applyImageFallback;
  window.getCachedImageFallback = function (label) {
    return readStoredJson(FALLBACK_KEY, {})[cacheKey(label)] || fallbackImageDataUrl(label);
  };
})();
