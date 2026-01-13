import jsonFormater from '../jsl-format';
import loadCss from '../load-css';
import themeDarkness from '../theme-darkness';

const themeDefault = "default";
const themesList = process.env.THEMES;
const themeJSONExample = {
  title: "JSON Example",
  nested: {
    someInteger: 7,
    someBoolean: true,
    someArray: [
      "list of",
      "fake strings",
      "and fake keys"
    ]
  }
}

function onThemeChange(input, editor) {
  const selectedTheme = input.options[input.selectedIndex].value;
  const themeOption = selectedTheme.replace(/_/, ' ');

  const currentLinkTag = document.getElementById('selected-theme');
  if (currentLinkTag !== null) {
    document.head.removeChild(currentLinkTag);
  }

  const themeToLoad = {
    id: "selected-theme",
    path: `themes/${themeDarkness(selectedTheme)}/${selectedTheme}.css`,
    checkClass: `theme-${selectedTheme}-css-check`
  };

  if (selectedTheme === "default") {
    editor.setOption("theme", themeOption);
  } else {
    loadCss(themeToLoad).then(() => {
      editor.setOption("theme", themeOption);
    });
  }
}

function renderThemeList(CodeMirror, value) {
  const themesInput = document.getElementById('themes');
  const themesExampleInput = document.getElementById('themes-example');
  themesExampleInput.innerHTML = jsonFormater(JSON.stringify(themeJSONExample));

  const themeEditor = CodeMirror.fromTextArea(themesExampleInput, {
    readOnly: true,
    mode: "application/ld+json",
    lineWrapping: true,
    lineNumbers: true,
    tabSize: 2,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
  });

  themes.onchange = () => {
    onThemeChange(themesInput, themeEditor);
  }

  const optionSelected = value;
  themesInput.appendChild(createOption(themeDefault, optionSelected));
  themesInput.appendChild(createThemeGroup("Light", themesList.light, optionSelected));
  themesInput.appendChild(createThemeGroup("Dark", themesList.dark, optionSelected));

  if (optionSelected && optionSelected !== "default") {
    themes.onchange();
  }
}

function createOption(theme, optionSelected) {
  const option = document.createElement("option");
  option.value = theme
  option.text = theme;

  if (theme === optionSelected) {
    option.selected = "selected";
  }

  return option;
}

function createGroup(label) {
  const group = document.createElement("optgroup");
  group.label = label;
  return group;
}

function createThemeGroup(name, list, optionSelected) {
  const group = createGroup(name);
  list.forEach((theme) => {
    group.appendChild(createOption(theme, optionSelected));
  });
  return group;
}

export default renderThemeList;
