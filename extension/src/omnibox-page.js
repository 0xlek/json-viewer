import JSONUtils from './json-viewer/check-if-json';
import highlightContent from './json-viewer/highlight-content';
import loadScratchPadEditor from './json-viewer/scratch-pad/load-editor';

function onLoad() {
  const pre = document.getElementsByTagName("pre")[0];
  const query = window.location.search.substring(1);

  if (isScratchPad(query)) handleScratchPad(pre);
  else handleJSONHighlight(pre, query);
}

function handleScratchPad(pre) {
  pre.hidden = true;
  loadScratchPadEditor(pre);
}

function handleJSONHighlight(pre, query) {
  const rawJson = query.replace(/^json=/, '');
  pre.innerText = decodeURIComponent(rawJson);

  JSONUtils.checkIfJson((pre) => {
    pre.hidden = true;
    highlightContent(pre, true);
  }, pre);
}

function isScratchPad(query) {
  return /scratch-page=true/.test(query);
}

document.addEventListener("DOMContentLoaded", onLoad, false);
