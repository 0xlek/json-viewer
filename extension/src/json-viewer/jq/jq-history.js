const HISTORY_KEY = 'jq_query_history';
const MAX_HISTORY_SIZE = 50;

class JqHistory {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
    this.tempQuery = '';
  }

  async load() {
    try {
      const result = await chrome.storage.local.get(HISTORY_KEY);
      this.history = result[HISTORY_KEY] || [];
      this.currentIndex = this.history.length;
      console.log('[JSONViewer] Loaded jq history:', this.history.length, 'items');
    } catch (error) {
      console.error('[JSONViewer] Failed to load jq history:', error);
      this.history = [];
    }
  }

  async save(query) {
    if (!query || !query.trim()) {
      return;
    }

    query = query.trim();

    const lastQuery = this.history[this.history.length - 1];
    if (lastQuery === query) {
      return;
    }

    this.history = this.history.filter(q => q !== query);
    this.history.push(query);

    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history = this.history.slice(-MAX_HISTORY_SIZE);
    }

    this.currentIndex = this.history.length;

    try {
      await chrome.storage.local.set({ [HISTORY_KEY]: this.history });
      console.log('[JSONViewer] Saved query to history:', query);
    } catch (error) {
      console.error('[JSONViewer] Failed to save jq history:', error);
    }
  }

  getPrevious(currentQuery) {
    if (this.history.length === 0) {
      return null;
    }

    if (this.currentIndex === this.history.length) {
      this.tempQuery = currentQuery;
    }

    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }

    return this.history[0];
  }

  getNext(currentQuery) {
    if (this.history.length === 0) {
      return null;
    }

    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    } else if (this.currentIndex === this.history.length - 1) {
      this.currentIndex = this.history.length;
      return this.tempQuery;
    }

    return currentQuery;
  }

  reset() {
    this.currentIndex = this.history.length;
    this.tempQuery = '';
  }
}

export default JqHistory;
