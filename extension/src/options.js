import './options-styles';
import CodeMirror from 'codemirror';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/css-hint';
import 'codemirror/mode/css/css';
import sweetAlert from 'sweetalert';

import Storage from './json-viewer/storage';
import renderThemeList from './json-viewer/options/render-theme-list';
import renderAddons from './json-viewer/options/render-addons';
import renderStructure from './json-viewer/options/render-structure';
import renderStyle from './json-viewer/options/render-style';
import bindSaveButton from './json-viewer/options/bind-save-button';
import bindResetButton from './json-viewer/options/bind-reset-button';

function isValidJSON(pseudoJSON) {
  try {
    JSON.parse(pseudoJSON);
    return true;
  } catch(e) {
    return false;
  }
}

function renderVersion() {
  const version = process.env.VERSION;
  const versionLink = document.getElementsByClassName('version')[0];
  versionLink.innerHTML = version;
  versionLink.href = `https://github.com/0xlek/json-viewer/tree/${version}`;
}

async function onLoaded() {
  const currentOptions = await Storage.load();

  renderVersion();
  renderThemeList(CodeMirror, currentOptions.theme);
  const addonsEditor = renderAddons(CodeMirror, currentOptions.addons);
  const structureEditor = renderStructure(CodeMirror, currentOptions.structure);
  const styleEditor = renderStyle(CodeMirror, currentOptions.style);

  bindResetButton();
  bindSaveButton([addonsEditor, structureEditor, styleEditor], async (options) => {
    if (!isValidJSON(options.addons)) {
      sweetAlert("Ops!", "\"Add-ons\" isn't a valid JSON", "error");
    } else if (!isValidJSON(options.structure)) {
      sweetAlert("Ops!", "\"Structure\" isn't a valid JSON", "error");
    } else {
      await Storage.save(options);
      sweetAlert("Success", "Options saved!", "success");
    }
  });
}

document.addEventListener("DOMContentLoaded", onLoaded, false);
