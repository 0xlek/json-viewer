import CodeMirror from 'codemirror';
import copyToClipboard from '../utils/clipboard';
import loadCss from '../load-css';
import JqHistory from './jq-history';

class JqModal {
  constructor() {
    this.overlay = null;
    this.editor = null;
    this.copyFeedback = null;
    this.history = new JqHistory();
  }

  async show(onQueryChange) {
    if (this.overlay) {
      return;
    }

    this.onQueryChange = onQueryChange;

    await loadCss({ path: 'assets/jq-modal.css', checkClass: 'jq-modal-overlay' });

    this.overlay = document.createElement('div');
    this.overlay.className = 'jq-modal-overlay';

    const container = document.createElement('div');
    container.className = 'jq-modal-container';

    const header = document.createElement('div');
    header.className = 'jq-modal-header';

    const title = document.createElement('h3');
    title.textContent = 'jq Query';
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'jq-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => this.hide();
    header.appendChild(closeBtn);

    const inputSection = document.createElement('div');
    inputSection.className = 'jq-modal-input-section';

    const inputLabel = document.createElement('label');
    inputLabel.textContent = 'jq filter:';
    inputLabel.className = 'jq-modal-input-label';
    inputSection.appendChild(inputLabel);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'jq-modal-input';
    input.placeholder = '. | .foo (examples: ., .name, .[] | select(.x > 5))';
    input.addEventListener('input', (e) => this.handleInput(e.target.value));
    input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    inputSection.appendChild(input);

    const autocomplete = document.createElement('div');
    autocomplete.className = 'jq-modal-autocomplete';
    inputSection.appendChild(autocomplete);

    const body = document.createElement('div');
    body.className = 'jq-modal-body';

    const resultDiv = document.createElement('div');
    resultDiv.className = 'jq-modal-result';
    body.appendChild(resultDiv);

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'jq-modal-loading hidden';
    const loadingText = document.createElement('span');
    loadingText.textContent = 'Executing query...';
    loadingDiv.appendChild(loadingText);
    body.appendChild(loadingDiv);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'jq-modal-error hidden';
    body.appendChild(errorDiv);

    const footer = document.createElement('div');
    footer.className = 'jq-modal-footer';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'jq-modal-copy';
    copyBtn.textContent = 'Copy Result';
    copyBtn.onclick = () => this.copyResult();

    this.copyFeedback = document.createElement('span');
    this.copyFeedback.className = 'jq-modal-copy-feedback';
    this.copyFeedback.textContent = 'Copied!';

    footer.appendChild(this.copyFeedback);
    footer.appendChild(copyBtn);

    container.appendChild(header);
    container.appendChild(inputSection);
    container.appendChild(body);
    container.appendChild(footer);

    this.overlay.appendChild(container);

    document.body.appendChild(this.overlay);

    this.input = input;
    this.autocomplete = autocomplete;
    this.resultDiv = resultDiv;
    this.loadingDiv = loadingDiv;
    this.errorDiv = errorDiv;
    this.selectedAutocompleteIndex = -1;

    await this.history.load();

    setTimeout(() => {
      this.input.focus();
    }, 100);
  }

  handleInput(value) {
    this.updateAutocomplete(value);

    if (this.onQueryChange) {
      this.onQueryChange(value);
    }
  }

  updateAutocomplete(value) {
    if (!value || !value.trim()) {
      this.hideAutocomplete();
      return;
    }

    const matches = this.history.history
      .filter(query => query.toLowerCase().includes(value.toLowerCase()))
      .reverse()
      .slice(0, 10);

    if (matches.length === 0) {
      this.hideAutocomplete();
      return;
    }

    this.autocomplete.innerHTML = '';
    this.selectedAutocompleteIndex = -1;

    matches.forEach((match, index) => {
      const item = document.createElement('div');
      item.className = 'jq-modal-autocomplete-item';
      item.textContent = match;
      item.addEventListener('click', () => {
        this.selectAutocomplete(match);
      });
      this.autocomplete.appendChild(item);
    });

    this.autocomplete.classList.add('visible');
  }

  hideAutocomplete() {
    this.autocomplete.classList.remove('visible');
    this.selectedAutocompleteIndex = -1;
  }

  selectAutocomplete(value) {
    this.input.value = value;
    this.hideAutocomplete();
    this.handleInput(value);
    this.input.focus();
  }

  handleKeyDown(e) {
    const autocompleteVisible = this.autocomplete.classList.contains('visible');
    const items = this.autocomplete.querySelectorAll('.jq-modal-autocomplete-item');

    if (autocompleteVisible && items.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedAutocompleteIndex = Math.min(
          this.selectedAutocompleteIndex + 1,
          items.length - 1
        );
        this.updateAutocompleteSelection(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedAutocompleteIndex = Math.max(
          this.selectedAutocompleteIndex - 1,
          -1
        );
        this.updateAutocompleteSelection(items);
      } else if (e.key === 'Enter' && this.selectedAutocompleteIndex >= 0) {
        e.preventDefault();
        const selectedItem = items[this.selectedAutocompleteIndex];
        this.selectAutocomplete(selectedItem.textContent);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.hideAutocomplete();
      }
    } else {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = this.history.getPrevious(this.input.value);
        if (prev !== null) {
          this.input.value = prev;
          this.hideAutocomplete();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = this.history.getNext(this.input.value);
        if (next !== null) {
          this.input.value = next;
          this.hideAutocomplete();
        }
      }
    }
  }

  updateAutocompleteSelection(items) {
    items.forEach((item, index) => {
      if (index === this.selectedAutocompleteIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  async saveToHistory(query) {
    await this.history.save(query);
    this.history.reset();
  }


  showLoading() {
    this.resultDiv.classList.add('hidden');
    this.errorDiv.classList.add('hidden');
    this.loadingDiv.classList.remove('hidden');
  }

  displayResult(result, truncated = false) {
    this.loadingDiv.classList.add('hidden');
    this.errorDiv.classList.add('hidden');
    this.resultDiv.classList.remove('hidden');

    if (this.editor) {
      this.editor.toTextArea();
      this.editor = null;
    }

    this.resultDiv.innerHTML = '';
    const textarea = document.createElement('textarea');
    textarea.value = result;
    this.resultDiv.appendChild(textarea);

    this.editor = CodeMirror.fromTextArea(textarea, {
      mode: 'application/ld+json',
      theme: 'default',
      readOnly: 'nocursor',
      lineNumbers: true,
      cursorBlinkRate: -1
    });

    this.editor.setSize(null, '100%');

    if (truncated) {
      const warning = document.createElement('div');
      warning.style.cssText = 'padding: 10px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; margin-bottom: 10px;';
      warning.textContent = 'Result truncated to 10,000 lines';
      this.resultDiv.insertBefore(warning, this.resultDiv.firstChild);
    }
  }

  displayError(error) {
    this.loadingDiv.classList.add('hidden');
    this.resultDiv.classList.add('hidden');
    this.errorDiv.classList.remove('hidden');
    this.errorDiv.textContent = error;
  }

  async copyResult() {
    if (!this.editor) {
      return;
    }

    const result = await copyToClipboard(this.editor.getValue());

    if (result.success) {
      this.copyFeedback.classList.add('show');
      setTimeout(() => {
        this.copyFeedback.classList.remove('show');
      }, 2000);
    } else {
      this.displayError(result.error || 'Failed to copy to clipboard');
    }
  }

  hide() {
    if (!this.overlay) {
      return;
    }

    if (this.editor) {
      this.editor.toTextArea();
      this.editor = null;
    }

    document.body.removeChild(this.overlay);
    this.overlay = null;
  }

  isVisible() {
    return this.overlay !== null;
  }
}

export default JqModal;
