console.log('[JSONViewer] Popup loaded');

const loadButton = document.getElementById('loadButton');
const statusDiv = document.getElementById('status');
const optionsLink = document.getElementById('optionsLink');

function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

function hideStatus() {
  statusDiv.className = 'status';
}

async function loadAndViewCurrentPage() {
  try {
    loadButton.disabled = true;
    showStatus('Getting current page URL...', 'info');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url) {
      showStatus('Could not get current tab URL', 'error');
      loadButton.disabled = false;
      return;
    }

    showStatus('Opening JSON viewer...', 'success');

    const omniboxUrl = chrome.runtime.getURL('/pages/omnibox.html');
    const finalUrl = `${omniboxUrl}?url=${encodeURIComponent(tab.url)}`;

    await chrome.tabs.create({ url: finalUrl });

    setTimeout(() => {
      window.close();
    }, 200);
  } catch (error) {
    console.error('[JSONViewer] Popup error:', error);
    showStatus(error.message || 'An error occurred', 'error');
    loadButton.disabled = false;
  }
}

loadButton.addEventListener('click', loadAndViewCurrentPage);

optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
