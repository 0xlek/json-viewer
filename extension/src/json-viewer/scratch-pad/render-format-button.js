import svgFormat from './svg-format';
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';

function renderFormatButton(onFormatClick) {
  const extras = document.getElementsByClassName("extras")[0];

  const formatLink = document.createElement("a");
  formatLink.className = "json_viewer icon format";
  formatLink.href = "#";
  formatLink.title = "Format (ctrl+shift+F / command+shift+F)";
  formatLink.innerHTML = svgFormat;
  formatLink.onclick = (e) => {
    e.preventDefault();
    onFormatClick();
  }

  Mousetrap.bindGlobal(['command+shift+f', 'ctrl+shift+f'], () => {
    onFormatClick();
    return false;
  });

  extras.appendChild(formatLink);
}

export default renderFormatButton;
