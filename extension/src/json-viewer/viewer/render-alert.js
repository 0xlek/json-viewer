import loadCss from '../load-css';

async function renderAlert(pre, options, content) {
  const alertContainer = document.createElement("div");
  alertContainer.className = "json-viewer-alert";
  alertContainer.appendChild(content);

  const closeBtn = document.createElement("a");
  closeBtn.className = "close";
  closeBtn.href = "#";
  closeBtn.title = "Close";
  closeBtn.innerHTML = "×";
  closeBtn.onclick = (e) => {
    e.preventDefault();
    alertContainer.parentNode.removeChild(alertContainer);
  };

  alertContainer.appendChild(closeBtn);

  try {
    await loadCss({path: "assets/viewer-alert.css", checkClass: "json-viewer-alert"});
    document.body.appendChild(alertContainer);
  } catch(e) {
    alertContainer.hidden = false;
    if (process.env.NODE_ENV === 'development') {
      console.error('[JSONViewer] error: ' + e.message, e);
    }
  }
}

export default renderAlert;
