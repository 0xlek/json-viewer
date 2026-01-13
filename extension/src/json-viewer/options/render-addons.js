import jsonFormater from '../jsl-format';

function renderAddons(CodeMirror, value) {
  const addonsInput = document.getElementById('addons');
  addonsInput.innerHTML = jsonFormater(JSON.stringify(value));

  return CodeMirror.fromTextArea(addonsInput, {
    mode: "application/ld+json",
    lineWrapping: true,
    lineNumbers: true,
    tabSize: 2
  });
}

export default renderAddons;
