import Mousetrap from 'mousetrap';
import svgJq from './svg-jq';
import JqController from '../jq/jq-controller';

function renderJqButton(pre, options, highlighter) {
  const jqLink = document.createElement("a");
  jqLink.className = "json_viewer icon jq";
  jqLink.href = "#";
  jqLink.title = "jq Query (Ctrl+J / Cmd+J)";
  jqLink.innerHTML = svgJq;

  let controller = null;

  const startJq = () => {
    if (controller) {
      return;
    }

    controller = new JqController(highlighter);
    controller.start().catch((error) => {
      console.error('[JSONViewer] Failed to start jq:', error);
      controller = null;
    });

    const checkModalClosed = setInterval(() => {
      if (controller && controller.modal && !controller.modal.isVisible()) {
        controller.cleanup();
        controller = null;
        clearInterval(checkModalClosed);
      }
    }, 500);
  };

  jqLink.onclick = (e) => {
    e.preventDefault();
    startJq();
  };

  Mousetrap.bind(['ctrl+j', 'command+j'], (e) => {
    e.preventDefault();
    startJq();
    return false;
  });

  return jqLink;
}

export default renderJqButton;
