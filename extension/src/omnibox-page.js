import JSONUtils from './json-viewer/check-if-json';
import highlightContent from './json-viewer/highlight-content';
import loadScratchPadEditor from './json-viewer/scratch-pad/load-editor';

let currentUrl = '';
let viewerInitialized = false;

function onLoad() {
  const pre = document.querySelector("#content pre");
  const query = window.location.search.substring(1);
  const params = new URLSearchParams(query);

  if (isScratchPad(query)) {
    document.body.classList.add('no-toolbar');
    handleScratchPad(pre);
  } else if (params.has('url')) {
    handleUrlMode(params.get('url'));
  } else {
    document.body.classList.add('no-toolbar');
    handleJSONHighlight(pre, query);
  }
}

function handleUrlMode(url) {
  const toolbar = document.getElementById('url-toolbar');
  const urlInput = document.getElementById('url-input');
  const fetchButton = document.getElementById('fetch-button');

  toolbar.style.display = 'flex';
  urlInput.value = url || '';
  currentUrl = url || '';

  if (url) {
    fetchJsonFromUrl(url);
  }

  fetchButton.addEventListener('click', () => {
    const inputUrl = urlInput.value.trim();
    if (inputUrl) {
      fetchJsonFromUrl(inputUrl);
    }
  });

  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const inputUrl = urlInput.value.trim();
      if (inputUrl) {
        fetchJsonFromUrl(inputUrl);
      }
    }
  });
}

function updateViewerContent(jsonData) {
  const pre = document.querySelector("#content pre");
  const jsonString = JSON.stringify(jsonData, null, 2);

  if (!viewerInitialized) {
    // First time: initialize the viewer
    pre.innerText = jsonString;
    JSONUtils.checkIfJson((pre) => {
      pre.hidden = true;
      highlightContent(pre, true);
      viewerInitialized = true;
    }, pre);
  } else {
    // Update existing viewer content
    // The viewer exposes window.json, update it and refresh
    if (window.json) {
      window.json = jsonData;
    }

    // Find and update the CodeMirror instance
    const codeMirror = document.querySelector('.CodeMirror');
    if (codeMirror && codeMirror.CodeMirror) {
      codeMirror.CodeMirror.setValue(jsonString);
    }
  }
}

async function fetchJsonFromUrl(url) {
  const fetchButton = document.getElementById('fetch-button');

  try {
    fetchButton.disabled = true;
    showStatus('Fetching JSON...', 'info');

    const response = await chrome.runtime.sendMessage({
      action: 'FETCH_JSON_FOR_VIEWER',
      url: url
    });

    if (response.success) {
      showStatus('JSON loaded successfully', 'success');
      setTimeout(() => hideStatus(), 2000);

      updateViewerContent(response.data);
    } else {
      showStatus(response.error || 'Failed to fetch JSON', 'error');
      const pre = document.querySelector("#content pre");
      if (pre) {
        pre.innerText = 'Error: ' + (response.error || 'Failed to fetch JSON');
      }
    }
  } catch (error) {
    console.error('[JSONViewer] Fetch error:', error);
    showStatus(error.message || 'An error occurred', 'error');
    const pre = document.querySelector("#content pre");
    if (pre) {
      pre.innerText = 'Error: ' + (error.message || 'An error occurred');
    }
  } finally {
    fetchButton.disabled = false;
  }
}

function showStatus(message, type = 'info') {
  const statusBar = document.getElementById('status-bar');
  statusBar.textContent = message;
  statusBar.className = `visible ${type}`;

  if (!document.body.classList.contains('no-toolbar')) {
    document.body.style.paddingTop = '108px';
  }
}

function hideStatus() {
  const statusBar = document.getElementById('status-bar');
  statusBar.className = '';

  if (!document.body.classList.contains('no-toolbar')) {
    document.body.style.paddingTop = '68px';
  }
}

function handleScratchPad(pre) {
  pre.hidden = true;
  loadScratchPadEditor(pre);
}

function handleJSONHighlight(pre, query) {
  const rawJson = query.replace(/^json=/, '');
  pre.innerText = decodeURIComponent(rawJson);

  JSONUtils.checkIfJson((pre) => {
    pre.hidden = true;
    highlightContent(pre, true);
  }, pre);
}

function isScratchPad(query) {
  return /scratch-page=true/.test(query);
}

document.addEventListener("DOMContentLoaded", onLoad, false);
