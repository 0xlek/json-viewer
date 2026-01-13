import './viewer-styles';
import JSONUtils from './json-viewer/check-if-json';
import highlightContent from './json-viewer/highlight-content';

function onLoad() {
  JSONUtils.checkIfJson((pre) => {
    pre.hidden = true;
    highlightContent(pre);
  });
}

document.addEventListener("DOMContentLoaded", onLoad, false);
