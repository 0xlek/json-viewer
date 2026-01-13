function bindSaveButton(editors, onSaveClicked) {
  const form = document.getElementById("options");
  form.onsubmit = () => false;

  const saveButton = document.getElementById("save");
  saveButton.onclick = (e) => {
    e.preventDefault();

    const output = {};
    editors.forEach((editor) => {
      editor.save();
    });

    for (let i = 0; i < form.elements.length; i++) {
      const e = form.elements[i];
      if (!/-example$/.test(e.name) && e.name.length !== 0) {
        output[e.name] = e.value;
      }
    }

    onSaveClicked(output);
  }
}

export default bindSaveButton;
