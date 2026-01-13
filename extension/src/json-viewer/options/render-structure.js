import jsonFormater from '../jsl-format';

function renderStructure(CodeMirror, value) {
  const structureInput = document.getElementById('structure');
  structureInput.innerHTML = jsonFormater(JSON.stringify(value));

  return CodeMirror.fromTextArea(structureInput, {
    mode: "application/ld+json",
    lineWrapping: true,
    lineNumbers: true,
    tabSize: 2
  });
}

export default renderStructure;
