import defaults from './defaults';

function renderStyle(CodeMirror, value) {
  const styleInput = document.getElementById('style');
  styleInput.innerHTML = value;

  return CodeMirror.fromTextArea(styleInput, {
    mode: "css",
    lineWrapping: true,
    lineNumbers: true,
    tabSize: 2,
    extraKeys: {"Ctrl-Space": "autocomplete"}
  });
}

export default renderStyle;
