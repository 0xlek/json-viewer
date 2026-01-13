const MAX_WAIT = 20;

function loadCSS(opts) {
  const url = chrome.runtime.getURL(opts.path);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  if (opts.id) link.id = opts.id;

  document.head.appendChild(link);

  const checkElement = document.createElement("div");
  checkElement.setAttribute("class", opts.checkClass);
  document.body.appendChild(checkElement);

  let scheduleId = null;
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const scheduleCheck = () => {
      const content = window
        .getComputedStyle(checkElement, ":before")
        .getPropertyValue("content");

      if (attempts > MAX_WAIT) {
        return reject(
          new Error(`fail to load css: '${url}', content loaded: ${content}`)
        );
      }

      if (/loaded/.test(content)) {
        cancelAnimationFrame(scheduleId);
        document.body.removeChild(checkElement);
        resolve();
      } else {
        attempts++;
        scheduleId = requestAnimationFrame(scheduleCheck, 1);
      }
    };

    scheduleCheck();
  });
}

export default loadCSS;
