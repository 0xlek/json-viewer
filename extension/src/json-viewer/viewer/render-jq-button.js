import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import svgJq from './svg-jq';
import JqController from '../jq/jq-controller';

function renderJqButton(pre, options, highlighter) {
  const jqLink = document.createElement("a");
  jqLink.className = "json_viewer icon jq";
  jqLink.href = "#";
  jqLink.title = "jq Query (Ctrl+J / Cmd+J)";
  jqLink.innerHTML = svgJq;

  let controller = null;

  const toggleJq = () => {
    if (controller && controller.modal && controller.modal.isVisible()) {
      controller.modal.hide();
      controller.cleanup();
      controller = null;
      return;
    }

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
    toggleJq();
  };

  Mousetrap.bindGlobal(['ctrl+j', 'command+j'], (e) => {
    e.preventDefault();
    toggleJq();
    return false;
  });

  return jqLink;
}

export default renderJqButton;
