import defaults from './options/defaults';
import merge from './merge';

const OLD_NAMESPACE = "options";
const NAMESPACE = "v2.options";

const Storage = {
  async save(obj) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({[NAMESPACE]: JSON.stringify(obj)}, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  async load() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([NAMESPACE, OLD_NAMESPACE], async (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        try {
          let optionsStr = result[NAMESPACE];
          optionsStr = await this.restoreOldOptions(optionsStr, result[OLD_NAMESPACE]);

          let options = optionsStr ? JSON.parse(optionsStr) : {};
          options.theme = options.theme || defaults.theme;
          options.addons = options.addons ? JSON.parse(options.addons) : {};
          options.addons = merge({}, defaults.addons, options.addons);
          options.structure = options.structure ? JSON.parse(options.structure) : defaults.structure;
          options.style = options.style && options.style.length > 0 ? options.style : defaults.style;
          resolve(options);
        } catch(e) {
          reject(e);
        }
      });
    });
  },

  async restoreOldOptions(optionsStr, oldOptions) {
    let options = null;

    if (!optionsStr && oldOptions) {
      try {
        let parsedOld = JSON.parse(oldOptions);
        if (!parsedOld || typeof parsedOld !== "object") parsedOld = {};

        options = {};
        options.theme = parsedOld.theme;
        options.addons = {
          prependHeader: JSON.parse(parsedOld.prependHeader || defaults.addons.prependHeader),
          maxJsonSize: parseInt(parsedOld.maxJsonSize || defaults.addons.maxJsonSize, 10)
        };

        if (options.addons.maxJsonSize < defaults.addons.maxJsonSize) {
          options.addons.maxJsonSize = defaults.addons.maxJsonSize;
        }

        options.addons = JSON.stringify(options.addons);
        options.structure = JSON.stringify(defaults.structure);
        options.style = defaults.style;
        await this.save(options);

        optionsStr = JSON.stringify(options);

        await new Promise((resolve) => {
          chrome.storage.local.remove(OLD_NAMESPACE, resolve);
        });
      } catch(e) {
        console.error('[JSONViewer] error: ' + e.message, e);
      }
    }

    return optionsStr;
  }
};

export default Storage;
