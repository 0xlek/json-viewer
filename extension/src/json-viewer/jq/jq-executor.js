async function executeJqQuery(jsonData, query) {
  if (!query || query.trim() === '') {
    return {
      success: false,
      error: 'Query cannot be empty'
    };
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'EXECUTE_JQ',
      url: window.location.href,
      query: query,
      jsonData: jsonData
    });

    return response;
  } catch (error) {
    console.error('[JSONViewer] jq execution error:', error);
    return {
      success: false,
      error: error.message || 'Failed to communicate with background script'
    };
  }
}

export default executeJqQuery;
