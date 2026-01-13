import jqPromise from 'jq-web';

console.log('[JSONViewer] Offscreen JQ document loaded');

const MAX_RESULT_LINES = 10000;
let jqInstance = null;
let jsonDataCache = null;

async function initializeJq() {
  if (jqInstance) {
    return jqInstance;
  }

  try {
    console.log('[JSONViewer] Awaiting jq-web promise...');
    jqInstance = await jqPromise;
    console.log('[JSONViewer] jq-web loaded, instance:', jqInstance);
    console.log('[JSONViewer] jq-web methods:', Object.keys(jqInstance || {}));

    if (!jqInstance || !jqInstance.json || !jqInstance.raw) {
      console.error('[JSONViewer] jq instance structure:', {
        instance: jqInstance,
        keys: Object.keys(jqInstance || {})
      });
      throw new Error('jq-web instance does not have expected json/raw methods');
    }

    console.log('[JSONViewer] Testing jq with simple query...');
    await jqInstance.raw('{}', '.');
    console.log('[JSONViewer] jq initialized successfully in offscreen document');
    return jqInstance;
  } catch (error) {
    console.error('[JSONViewer] Failed to initialize jq:', error);
    console.error('[JSONViewer] Error details:', {
      message: error.message,
      stack: error.stack
    });
    jqInstance = null;
    throw error;
  }
}

async function fetchJsonData(url, useWindowJson) {
  try {
    if (useWindowJson) {
      console.log('[JSONViewer] Using JSON data from window.json');
      return useWindowJson;
    }

    console.log('[JSONViewer] Fetching JSON from URL:', url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonData = await response.json();
    console.log('[JSONViewer] JSON fetched successfully');
    return jsonData;
  } catch (error) {
    console.error('[JSONViewer] Failed to fetch JSON:', error);
    throw error;
  }
}

async function executeJqQuery(url, query, jsonData) {
  if (!query || query.trim() === '') {
    return {
      success: false,
      error: 'Query cannot be empty'
    };
  }

  try {
    const jq = await initializeJq();

    let data;
    if (jsonData) {
      console.log('[JSONViewer] Using provided JSON data');
      data = jsonData;
    } else if (jsonDataCache) {
      console.log('[JSONViewer] Using cached JSON data');
      data = jsonDataCache;
    } else {
      data = await fetchJsonData(url);
      jsonDataCache = data;
    }

    console.log('[JSONViewer] ========== JQ QUERY EXECUTION ==========');
    console.log('[JSONViewer] INPUT DATA:', JSON.stringify(data, null, 2));
    console.log('[JSONViewer] JQ QUERY:', query);

    const result = await jq.json(data, query);

    console.log('[JSONViewer] OUTPUT RESULT:', JSON.stringify(result, null, 2));
    console.log('[JSONViewer] ==========================================');

    let resultString = JSON.stringify(result, null, 2);

    const lineCount = (resultString.match(/\n/g) || []).length + 1;
    let truncated = false;

    if (lineCount > MAX_RESULT_LINES) {
      const lines = resultString.split('\n');
      resultString = lines.slice(0, MAX_RESULT_LINES).join('\n') + '\n...';
      truncated = true;
    }

    return {
      success: true,
      result: resultString,
      truncated,
      lineCount
    };
  } catch (error) {
    console.error('[JSONViewer] jq execution error:', error);
    console.error('[JSONViewer] Query was:', query);
    return {
      success: false,
      error: error.message || 'jq query execution failed'
    };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'EXECUTE_JQ') {
    executeJqQuery(message.url, message.query, message.jsonData)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        success: false,
        error: error.message || 'jq execution failed'
      }));
    return true;
  }

  if (message.action === 'CLEAR_CACHE') {
    jsonDataCache = null;
    sendResponse({ success: true });
    return true;
  }
});

console.log('[JSONViewer] Offscreen JQ message handlers registered');
