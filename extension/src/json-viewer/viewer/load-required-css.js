import loadCss from '../load-css';
import themeDarkness from '../theme-darkness';

async function loadRequiredCss(options) {
  const { theme, style } = options;
  const loaders = [];

  loaders.push(loadCss({
    path: "assets/viewer.css",
    checkClass: "json-viewer-css-check"
  }));

  if (theme && theme !== "default") {
    loaders.push(loadCss({
      path: `themes/${themeDarkness(theme)}/${theme}.css`,
      checkClass: `theme-${theme}-css-check`
    }));
  }

  await Promise.all(loaders);

  const styleElement = document.createElement("style");
  styleElement.rel = "stylesheet";
  styleElement.type = "text/css";
  styleElement.innerHTML = style;
  document.head.appendChild(styleElement);
}

export default loadRequiredCss;
