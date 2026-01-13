import Storage from './json-viewer/storage';

console.log('[JSONViewer] Background script loaded');

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
