(async function() {
  const wasmUrl = chrome.runtime.getURL('assets/jq.wasm');
  console.log('[JSONViewer] Fetching WASM from:', wasmUrl);

  try {
    const response = await fetch(wasmUrl);
    const wasmBinary = await response.arrayBuffer();
    console.log('[JSONViewer] WASM loaded, size:', wasmBinary.byteLength);

    window.Module = {
      wasmBinary: wasmBinary,
      locateFile: function(path) {
        console.log('[JSONViewer] locateFile called for:', path);
        if (path.endsWith('.wasm')) {
          return wasmUrl;
        }
        return path;
      }
    };

    console.log('[JSONViewer] jq Module configuration loaded with binary');
  } catch (error) {
    console.error('[JSONViewer] Failed to load WASM:', error);
  }
})();
