import Storage from './json-viewer/storage';

console.log('[JSONViewer] Background script loaded');

let offscreenCreating = null;

async function setupOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('pages/offscreen-jq.html')]
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (offscreenCreating) {
    await offscreenCreating;
  } else {
    offscreenCreating = chrome.offscreen.createDocument({
      url: 'pages/offscreen-jq.html',
      reasons: ['WORKERS'],
      justification: 'Execute jq queries using WebAssembly which requires document context'
    });

    await offscreenCreating;
    offscreenCreating = null;
    console.log('[JSONViewer] Offscreen document created for jq execution');
  }
}

async function executeJqQuery(url, query, jsonData) {
  try {
    await setupOffscreenDocument();

    console.log('[JSONViewer] Forwarding jq query to offscreen document');
    const result = await chrome.runtime.sendMessage({
      action: 'EXECUTE_JQ',
      url: url,
      query: query,
      jsonData: jsonData
    });

    return result;
  } catch (error) {
    console.error('[JSONViewer] Failed to execute jq query:', error);
    return {
      success: false,
      error: error.message || 'Failed to execute jq query'
    };
  }
}

function repairJson(text) {
  console.log('[JSONViewer] Attempting to repair JSON...');

  // Remove BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  // Try to fix common issues:

  // 1. Replace single quotes with double quotes (but not inside strings)
  // This is a simple approach that works for most cases
  let fixed = text.replace(/'/g, '"');

  // 2. Add quotes around unquoted property names
  // Matches pattern like: {name: or ,name: and converts to {"name":
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

  // 3. Remove trailing commas before } or ]
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // 4. Remove comments (// and /* */)
  fixed = fixed.replace(/\/\/.*$/gm, '');
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');

  console.log('[JSONViewer] Repair attempt complete');
  return fixed;
}

async function fetchAndOpenJson(url) {
  try {
    console.log('[JSONViewer] Fetching JSON from:', url);
    const response = await fetch(url);

    const contentType = response.headers.get('content-type');
    console.log('[JSONViewer] Status:', response.status, 'Content-Type:', contentType);

    const text = await response.text();

    let jsonData;
    try {
      jsonData = JSON.parse(text);
      console.log('[JSONViewer] JSON parsed successfully');
    } catch (parseError) {
      console.warn('[JSONViewer] Standard JSON parse failed, attempting repair:', parseError.message);

      try {
        const repairedText = repairJson(text);
        jsonData = JSON.parse(repairedText);
        console.log('[JSONViewer] JSON repaired and parsed successfully');
      } catch (repairError) {
        console.error('[JSONViewer] JSON repair failed:', repairError);
        throw new Error(`Response is not valid JSON: ${parseError.message}`);
      }
    }

    const omniboxUrl = chrome.runtime.getURL('/pages/omnibox.html');
    const jsonString = JSON.stringify(jsonData);
    const encodedJson = encodeURIComponent(jsonString);
    const finalUrl = `${omniboxUrl}?json=${encodedJson}`;

    await chrome.tabs.create({ url: finalUrl });

    return { success: true };
  } catch (error) {
    console.error('[JSONViewer] Failed to fetch and open JSON:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch JSON'
    };
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[JSONViewer] Received message:', request.action);

  if (request.action === "GET_OPTIONS") {
    Storage.load()
      .then(options => {
        console.log('[JSONViewer] Sending options:', options);
        sendResponse({err: null, value: options});
      })
      .catch(e => {
        console.error('[JSONViewer] Background error:', e.message, e);
        sendResponse({err: {message: e.message, stack: e.stack}});
      });
    return true;
  }

  if (request.action === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
    return false;
  }

  if (request.action === "EXECUTE_JQ") {
    executeJqQuery(request.url, request.query, request.jsonData)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message || 'jq execution failed'
        });
      });
    return true;
  }

  if (request.action === "FETCH_AND_OPEN_JSON") {
    fetchAndOpenJson(request.url)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message || 'Failed to fetch and open JSON'
        });
      });
    return true;
  }

  if (request.action === "FETCH_JSON_FOR_VIEWER") {
    (async () => {
      try {
        console.log('[JSONViewer] Fetching JSON for viewer:', request.url);
        const response = await fetch(request.url);

        const contentType = response.headers.get('content-type');
        console.log('[JSONViewer] Status:', response.status, 'Content-Type:', contentType);

        const text = await response.text();
        console.log('[JSONViewer] Response text length:', text.length);

        let jsonData;
        try {
          jsonData = JSON.parse(text);
          console.log('[JSONViewer] JSON parsed successfully');
        } catch (parseError) {
          console.warn('[JSONViewer] Standard JSON parse failed, attempting repair:', parseError.message);

          try {
            const repairedText = repairJson(text);
            jsonData = JSON.parse(repairedText);
            console.log('[JSONViewer] JSON repaired and parsed successfully');
          } catch (repairError) {
            console.error('[JSONViewer] JSON repair failed:', repairError);
            throw new Error(`Response is not valid JSON: ${parseError.message}`);
          }
        }

        sendResponse({
          success: true,
          data: jsonData
        });
      } catch (error) {
        console.error('[JSONViewer] Failed to fetch JSON:', error);
        sendResponse({
          success: false,
          error: error.message || 'Failed to fetch JSON'
        });
      }
    })();
    return true;
  }

  return false;
});

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  console.log(`[JSONViewer] inputChanged: ${text}`);
  suggest([
    {
      content: "Format JSON",
      description: "(Format JSON) Open a page with json highlighted"
    },
    {
      content: "Scratch pad",
      description: "(Scratch pad) Area to write and format/highlight JSON"
    }
  ]);
});

chrome.omnibox.onInputEntered.addListener((text) => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const omniboxUrl = chrome.runtime.getURL("/pages/omnibox.html");
    const path = /scratch pad/i.test(text) ? "?scratch-page=true" : `?json=${encodeURIComponent(text)}`;
    const url = omniboxUrl + path;
    console.log(`[JSONViewer] Opening: ${url}`);

    chrome.tabs.update(tabs[0].id, {url});
  });
});
