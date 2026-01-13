async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (err) {
      console.warn('[JSONViewer] Clipboard API failed:', err);
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      return { success: true };
    } else {
      throw new Error('execCommand failed');
    }
  } catch (err) {
    console.error('[JSONViewer] Clipboard copy failed:', err);
    return {
      success: false,
      error: 'Failed to copy to clipboard. Please copy manually.'
    };
  }
}

export default copyToClipboard;
