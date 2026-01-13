function exposeJson(text, outsideViewer) {
  console.info("[JSONViewer] Your json was stored into 'window.json', enjoy!");

  try {
    window.json = JSON.parse(text);
  } catch(e) {
    console.error("[JSONViewer] Failed to parse JSON for window.json:", e);
  }
}

export default exposeJson;
