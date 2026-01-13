import CodeMirror from 'codemirror';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/search/matchesonscrollbar';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import 'codemirror/mode/javascript/javascript';
import merge from './merge';
import defaults from './options/defaults';
import URL_PATTERN from './url-pattern';

const F_LETTER = 70;

class Highlighter {
  constructor(jsonText, options) {
    this.options = options || {};
    this.text = jsonText;
    this.defaultSearch = false;
    this.theme = this.options.theme || "default";
    this.theme = this.theme.replace(/_/, ' ');
  }

  highlight() {
    this.editor = CodeMirror(document.body, this.getEditorOptions());
    if (!this.alwaysRenderAllContent()) this.preventDefaultSearch();
    if (this.isReadOny()) this.getDOMEditor().className += ' read-only';

    this.bindRenderLine();
    this.bindMousedown();
    this.editor.refresh();
    this.editor.focus();
  }

  hide() {
    this.getDOMEditor().hidden = true;
    this.defaultSearch = true;
  }

  show() {
    this.getDOMEditor().hidden = false;
    this.defaultSearch = false;
  }

  getDOMEditor() {
    return document.getElementsByClassName('CodeMirror')[0];
  }

  fold() {
    let skippedRoot = false;
    const firstLine = this.editor.firstLine();
    const lastLine = this.editor.lastLine();

    for (let line = firstLine; line <= lastLine; line++) {
      if (!skippedRoot) {
        if (/(\[|\{)/.test(this.editor.getLine(line).trim())) skippedRoot = true;

      } else {
        this.editor.foldCode({line: line, ch: 0}, null, "fold");
      }
    }
  }

  unfoldAll() {
    for (let line = 0; line < this.editor.lineCount(); line++) {
      this.editor.foldCode({line: line, ch: 0}, null, "unfold");
    }
  }

  bindRenderLine() {
    this.editor.off("renderLine");
    this.editor.on("renderLine", (cm, line, element) => {
      const elementsNode = element.getElementsByClassName("cm-string");
      if (!elementsNode || elementsNode.length === 0) return;

      const elements = [];
      for (let i = 0; i < elementsNode.length; i++) {
        elements.push(elementsNode[i]);
      }

      const textContent = elements.reduce((str, node) => {
        return str += node.textContent;
      }, "");

      const text = this.removeQuotes(textContent);

      if (text.match(URL_PATTERN) && this.clickableUrls()) {
        const decodedText = this.decodeText(text);
        elements.forEach((node) => {
          if (this.wrapLinkWithAnchorTag()) {
            const linkTag = document.createElement("a");
            linkTag.href = decodedText;
            linkTag.setAttribute('target', '_blank')
            linkTag.classList.add("cm-string");

            node.childNodes.forEach((child) => {
              linkTag.appendChild(child);
            });

            linkTag.addEventListener("contextmenu", (e) => {
              if (e.bubbles) e.cancelBubble = true;
            });

            node.appendChild(linkTag);
          } else {
            node.classList.add("cm-string-link");
            node.setAttribute("data-url", decodedText);
          }
        });
      }
    });
  }

  bindMousedown() {
    this.editor.off("mousedown");
    this.editor.on("mousedown", (cm, event) => {
      const element = event.target;
      if (element.classList.contains("cm-string-link")) {
        const url = element.getAttribute("data-url")
        let target = "_self";
        if (this.openLinksInNewWindow()) {
          target = "_blank";
        }
        window.open(url, target);
      }
    });
  }

  removeQuotes(text) {
    return text.replace(/^\"+/, '').replace(/\"+$/, '');
  }

  includeQuotes(text) {
    return `"${text}"`;
  }

  decodeText(text) {
    const div = document.createElement("div");
    div.innerHTML = text;
    return div.firstChild ? div.firstChild.nodeValue : "";
  }

  getEditorOptions() {
    const obligatory = {
      value: this.text,
      theme: this.theme,
      readOnly: this.isReadOny() ? true : false,
      mode: "application/ld+json",
      indentUnit: 2,
      tabSize: 2,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
      extraKeys: this.getExtraKeysMap()
    }

    if (this.alwaysRenderAllContent()) {
      obligatory.viewportMargin = Infinity;
    }

    const optional = defaults.structure;
    const configured = this.options.structure;

    return merge({}, optional, configured, obligatory);
  }

  getExtraKeysMap() {
    const extraKeyMap = {
      "Esc": (cm) => {
        CodeMirror.commands.clearSearch(cm);
        cm.setSelection(cm.getCursor());
        cm.focus();
      }
    }

    if (this.options.structure.readOnly) {
      extraKeyMap["Enter"] = (cm) => {
        CodeMirror.commands.findNext(cm);
      }

      extraKeyMap["Shift-Enter"] = (cm) => {
        CodeMirror.commands.findPrev(cm);
      }

      extraKeyMap["Ctrl-V"] = extraKeyMap["Cmd-V"] = (cm) => {};
    }

    const nativeSearch = this.alwaysRenderAllContent();
    extraKeyMap["Ctrl-F"] = nativeSearch ? false : this.openSearchDialog;
    extraKeyMap["Cmd-F"] = nativeSearch ? false : this.openSearchDialog;
    return extraKeyMap;
  }

  preventDefaultSearch() {
    document.addEventListener("keydown", (e) => {
      const metaKey = navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey;
      if (!this.defaultSearch && e.keyCode === F_LETTER && metaKey) {
        e.preventDefault();
      }
    }, false);
  }

  openSearchDialog(cm) {
    cm.setCursor({line: 0, ch: 0});
    CodeMirror.commands.find(cm);
  }

  alwaysRenderAllContent() {
    return this.options.addons.alwaysRenderAllContent ||
           this.options.addons.awaysRenderAllContent;
  }

  clickableUrls() {
    return this.options.addons.clickableUrls;
  }

  wrapLinkWithAnchorTag() {
    return this.options.addons.wrapLinkWithAnchorTag;
  }

  openLinksInNewWindow() {
    return this.options.addons.openLinksInNewWindow;
  }

  isReadOny() {
    return this.options.structure.readOnly;
  }
}

export default Highlighter;
