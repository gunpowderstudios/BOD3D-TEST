(() => {
  const PUBLIC_REPO = 'gunpowderstudios/BOD3D-TEST';
  const PRIVATE_REPO = 'gunpowderstudios/story-mapper';
  const STORY_PATH = 'story-mapper/story-map.json';
  const originalFetch = window.fetch.bind(window);

  function rewrite(url) {
    if (url.includes(`/repos/${PUBLIC_REPO}/contents/${STORY_PATH}`)) {
      return url.replace(`/repos/${PUBLIC_REPO}/`, `/repos/${PRIVATE_REPO}/`);
    }
    if (url === `https://api.github.com/repos/${PUBLIC_REPO}` || url.startsWith(`https://api.github.com/repos/${PUBLIC_REPO}?`)) {
      return url.replace(`/repos/${PUBLIC_REPO}`, `/repos/${PRIVATE_REPO}`);
    }
    return url;
  }

  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input.url;
    return originalFetch(rewrite(url), init);
  };
})();
