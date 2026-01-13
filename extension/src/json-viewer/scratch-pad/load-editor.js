import merge from '../merge';
import Highlighter from '../highlighter';
import getOptions from '../viewer/get-options';
import loadRequiredCss from '../viewer/load-required-css';
import renderExtras from '../viewer/render-extras';
import renderFormatButton from './render-format-button';
import jsonFormater from '../jsl-format';
import JSONUtils from '../check-if-json';
import exposeJson from '../viewer/expose-json';

async function loadEditor(pre) {
  try {
    const options = await getOptions();
    await loadRequiredCss(options);

    const scratchPadOptions = merge({}, options);
    scratchPadOptions.structure.readOnly = false;

    const highlighter = new Highlighter("", scratchPadOptions);
    highlighter.highlight();

    renderExtras(pre, options, highlighter);
    renderFormatButton(() => {
      const text = highlighter.editor.getValue();
      highlighter.editor.setValue(jsonFormater(text));
      if (JSONUtils.isJSON(text)) {
        exposeJson(text, true);
      }
    });
  } catch (e) {
    console.error('[JSONViewer] error: ' + e.message, e);
  }
}

export default loadEditor;
