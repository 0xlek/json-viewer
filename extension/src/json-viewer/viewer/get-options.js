function getOptions() {
  console.log('[JSONViewer] getOptions: Sending message to background');
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({action: "GET_OPTIONS"}, (response) => {
      console.log('[JSONViewer] getOptions: Received response:', response);

      if (chrome.runtime.lastError) {
        console.error('[JSONViewer] getOptions: Runtime error:', chrome.runtime.lastError);
        reject('getOptions: ' + chrome.runtime.lastError.message);
        return;
      }

      if (!response) {
        console.error('[JSONViewer] getOptions: No response from background script');
        reject('getOptions: No response from background script');
        return;
      }

      const { err, value } = response;

      if (err) {
        console.error('[JSONViewer] getOptions: Error in response:', err);
        reject('getOptions: ' + err.message);
      } else {
        console.log('[JSONViewer] getOptions: Successfully resolved with value');
        resolve(value);
      }
    });
  });
}

export default getOptions;
