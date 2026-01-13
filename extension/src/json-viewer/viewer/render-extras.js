import chromeFramework from 'chrome-framework';
import svgGear from './svg-gear';
import svgRaw from './svg-raw';
import svgUnfold from './svg-unfold';
import renderJqButton from './render-jq-button';

function renderExtras(pre, options, highlighter) {
  const extras = document.createElement("div");
  extras.className = "extras";

  if (!options.addons.autoHighlight) {
    extras.className += ' auto-highlight-off';
  }

  const optionsLink = document.createElement("a");
  optionsLink.className = "json_viewer icon gear";
  optionsLink.href = "#";
  optionsLink.title = "Options";
  optionsLink.innerHTML = svgGear;
  optionsLink.onclick = (e) => {
    e.preventDefault();
    chrome.runtime.sendMessage({action: "OPEN_OPTIONS"});
  };

  const rawLink = document.createElement("a");
  rawLink.className = "json_viewer icon raw";
  rawLink.href = "#";
  rawLink.title = "Original JSON toggle";
  rawLink.innerHTML = svgRaw;
  rawLink.onclick = (e) => {
    e.preventDefault();
    const editor = document.getElementsByClassName('CodeMirror')[0];

    if (pre.hidden) {
      highlighter.hide();
      pre.hidden = false;
      extras.className += ' auto-highlight-off';
    } else {
      highlighter.show();
      pre.hidden = true;
      extras.className = extras.className.replace(/\s+auto-highlight-off/, '');
    }
  }

  const unfoldLink = document.createElement("a");
  unfoldLink.className = "json_viewer icon unfold";
  unfoldLink.href = "#";
  unfoldLink.title = "Fold/Unfold all toggle";
  unfoldLink.innerHTML = svgUnfold;
  unfoldLink.onclick = (e) => {
    e.preventDefault();
    const value = pre.getAttribute('data-folded')

    if (value === 'true' || value === true) {
      highlighter.unfoldAll();
      pre.setAttribute('data-folded', false)
    } else {
      highlighter.fold();
      pre.setAttribute('data-folded', true)
    }
  }

  extras.appendChild(optionsLink);
  extras.appendChild(rawLink);

  pre.setAttribute('data-folded', options.addons.alwaysFold || options.addons.awaysFold)
  extras.appendChild(unfoldLink);

  const jqButton = renderJqButton(pre, options, highlighter);
  extras.appendChild(jqButton);

  document.body.appendChild(extras);
}

export default renderExtras;
