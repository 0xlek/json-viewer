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
