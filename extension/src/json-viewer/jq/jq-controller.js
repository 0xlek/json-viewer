import JqModal from './jq-modal';
import executeJqQuery from './jq-executor';
import debounce from '../utils/debounce';

class JqController {
  constructor(highlighter) {
    this.highlighter = highlighter;
    this.modal = null;
    this.sourceData = null;
    this.debouncedQuery = debounce((query) => {
      this.handleQueryChange(query);
    }, 300);
  }

  async start() {
    try {
      this.sourceData = this.getJsonData();
    } catch (error) {
      console.error('[JSONViewer] jq error:', error);
      alert(error.message);
      return;
    }

    this.modal = new JqModal();
    await this.modal.show((query) => {
      if (query && query.trim()) {
        this.debouncedQuery(query);
      }
    });
  }

  getJsonData() {
    if (window.json) {
      return window.json;
    }

    const text = this.highlighter.editor.getValue();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Invalid JSON. Please format your JSON first.');
    }
  }

  async handleQueryChange(query) {
    if (!query || !query.trim() || !this.modal) {
      return;
    }

    this.modal.showLoading();

    const result = await executeJqQuery(this.sourceData, query);

    if (result.success) {
      this.modal.displayResult(result.result, result.truncated);
      await this.modal.saveToHistory(query);
    } else {
      this.modal.displayError(result.error);
    }
  }

  cleanup() {
    if (this.debouncedQuery) {
      this.debouncedQuery.cancel();
    }

    if (this.modal) {
      this.modal.hide();
      this.modal = null;
    }

    this.sourceData = null;
  }
}

export default JqController;
