import contentExtractor from './content-extractor';
import Highlighter from './highlighter';
import timestamp from './timestamp';
import exposeJson from './viewer/expose-json';
import renderExtras from './viewer/render-extras';
import renderAlert from './viewer/render-alert';
import getOptions from './viewer/get-options';
import loadRequiredCss from './viewer/load-required-css';

function oversizedJSON(pre, options, outsideViewer) {
  const jsonSize = pre.textContent.length;
  const accepted = options.addons.maxJsonSize;

  const loaded = jsonSize / 1024;
  const maxJsonSize = accepted * 1024;
  const isOversizedJSON = jsonSize > maxJsonSize;

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[JSONViewer] JSON size: ${loaded} kbytes`);
    console.debug(`[JSONViewer] Max JSON size: ${accepted} kbytes`);
    console.debug(`[JSONViewer] ${jsonSize} > ${maxJsonSize} = ${isOversizedJSON}`);
  }

  if (isOversizedJSON) {
    console.warn(
      `[JSONViewer] Content not highlighted due to oversize. ` +
      `Accepted: ${accepted} kbytes, received: ${loaded} kbytes. ` +
      `It's possible to change this value at options -> Add-ons -> maxJsonSize`
    );

    const container = document.createElement("div");

    const message = document.createElement("div");
    message.innerHTML = "[JSONViewer] Content not highlighted due to oversize. " +
    "Take a look at the console log for more information.";
    container.appendChild(message);

    const highlightAnyway = document.createElement("a");
    highlightAnyway.href = "#";
    highlightAnyway.title = "Highlight anyway!";
    highlightAnyway.innerHTML = "Highlight anyway!";
    highlightAnyway.onclick = (e) => {
      e.preventDefault();
      pre.hidden = true;
      highlightContent(pre, outsideViewer, true);
    };
    container.appendChild(highlightAnyway);

    renderAlert(pre, options, container);
  }

  return isOversizedJSON;
}

function prependHeader(options, outsideViewer, jsonText) {
  if (!outsideViewer && options.addons.prependHeader) {
    options.structure.firstLineNumber = options.structure.firstLineNumber - 3;
    let header = `// ${timestamp()}\n`;
    header += `// ${document.location.href}\n\n`;
    jsonText = header + jsonText;
  }

  return jsonText;
}

async function highlightContent(pre, outsideViewer, ignoreLimit) {
  try {
    const options = await getOptions();

    if (!ignoreLimit && oversizedJSON(pre, options, outsideViewer)) {
      pre.hidden = false;
      return;
    }

    const value = await contentExtractor(pre, options);
    await loadRequiredCss(options);

    const formatted = prependHeader(options, outsideViewer, value.jsonText);
    const highlighter = new Highlighter(formatted, options);

    if (options.addons.autoHighlight) {
      highlighter.highlight();
    } else {
      highlighter.highlight();
      highlighter.hide();
      pre.hidden = false;

      console.warn(
        "[JSONViewer] You are seeing the raw version because you configured the " +
        "addon 'autoHighlight' to false. It's possible to highlight from this page, " +
        "just click at the 'RAW' button in the top-right corner. " +
        "It's possible to change this value at options -> Add-ons -> autoHighlight"
      );
    }

    if (options.addons.alwaysFold || options.addons.awaysFold) {
      highlighter.fold();
    }

    exposeJson(value.jsonExtracted, outsideViewer);
    renderExtras(pre, options, highlighter);

  } catch(e) {
    pre.hidden = false;
    if (process.env.NODE_ENV === 'development') {
      console.error('[JSONViewer] error: ' + e.message, e);
    }
  }
}

export default highlightContent;
