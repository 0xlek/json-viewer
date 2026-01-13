import extractJSON from './extract-json';

let bodyModified = false;

function allTextNodes(nodes) {
  return !Object.keys(nodes).some(key => nodes[key].nodeName !== '#text');
}

function getPreWithSource() {
  const childNodes = document.body.childNodes;

  if (childNodes.length === 0) {
    return null;
  }

  if (childNodes.length > 1 && allTextNodes(childNodes)) {
    if (process.env.NODE_ENV === 'development') {
      console.debug("[JSONViewer] Loaded from a multiple text nodes, normalizing");
    }
    document.body.normalize();
  }

  const childNode = childNodes[0];
  const nodeName = childNode.nodeName;
  const textContent = childNode.textContent;

  if (nodeName === "PRE") {
    return childNode;
  }

  if (nodeName === "#text" && textContent.trim().length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.debug("[JSONViewer] Loaded from a text node, this might have returned content-type: text/html");
    }

    const pre = document.createElement("pre");
    pre.textContent = textContent;
    document.body.removeChild(childNode);
    document.body.appendChild(pre);
    bodyModified = true;
    return pre;
  }

  return null;
}

function restoreNonJSONBody() {
  const artificialPre = document.body.lastChild;
  const removedChildNode = document.createElement("text");
  removedChildNode.textContent = artificialPre.textContent;
  document.body.insertBefore(removedChildNode, document.body.firstChild);
  document.body.removeChild(artificialPre);
}

function isJSON(jsonStr) {
  let str = jsonStr;
  if (!str || str.length === 0) {
    return false;
  }

  str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
  str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
  str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
  return (/^[\],:{}\s]*$/).test(str);
}

function isJSONP(jsonStr) {
  return isJSON(extractJSON(jsonStr));
}

function checkIfJson(sucessCallback, element) {
  const pre = element || getPreWithSource();

  if (pre !== null &&
    pre !== undefined &&
    (isJSON(pre.textContent) || isJSONP(pre.textContent))) {
    sucessCallback(pre);
  } else if (bodyModified) {
    restoreNonJSONBody();
  }
}

export default {
  checkIfJson,
  isJSON
};
